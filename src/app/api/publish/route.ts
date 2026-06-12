import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { createServerClient } from "@/lib/supabase";
import { uploadToR2, getPublicUrl } from "@/lib/r2";
import { generateSlug, getMimeType } from "@/lib/utils";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { createNotification } from "@/lib/request-platform";

async function getUserFromToken(token: string): Promise<{ id: string } | null> {
  const db = createServerClient();
  const { data } = await db
    .from("api_tokens")
    .select("user_id")
    .eq("token", token)
    .single();
  if (!data) return null;
  db.from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token)
    .then(() => {});
  return { id: data.user_id };
}

async function getUser(req: NextRequest): Promise<{ id: string } | null> {
  // Try Bearer token first (MCP / API usage)
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const tokenUser = await getUserFromToken(authHeader.slice(7));
    if (tokenUser) return tokenUser;
  }

  // Fall back to cookie-based auth (browser)
  const supabaseResponse = NextResponse.next({ request: req });
  const supabase = createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    const contentType = req.headers.get("content-type") ?? "";

    // ── JSON path: html_content direct upload ───────────────────
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({})) as Record<string, unknown>;
      const name = (body.title as string) || (body.name as string) || "Untitled App";
      const description = (body.description as string) || "";
      const isPublic = body.is_public !== false;
      const htmlContent = body.html_content as string | undefined;
      const requestSlug = (body.request_slug as string) || (body.request as string) || null;

      if (!htmlContent) {
        return NextResponse.json({ success: false, error: "html_content is required" }, { status: 400 });
      }

      let communityId = (body.community_id as string) || null;
      const communitySlug = (body.community_slug as string) || null;
      if (!communityId && communitySlug) {
        const db = createServerClient();
        const { data: community } = await db.from("communities").select("id").eq("slug", communitySlug).single();
        communityId = community?.id ?? null;
      }

      let authorName = "Anonymous";
      if (user) {
        const db = createServerClient();
        const { data: profile } = await db.from("profiles").select("display_name").eq("id", user.id).single();
        if (profile?.display_name) authorName = profile.display_name;
      }

      const slug = generateSlug(name);
      await uploadToR2(`${slug}/index.html`, new TextEncoder().encode(htmlContent), "text/html");

      const authorToken = crypto.randomUUID();
      const supabase = createServerClient();
      const { data, error } = await supabase.from("apps").insert({
        name, description, slug, author_token: authorToken, file_count: 1,
        community_id: communityId, user_id: user?.id ?? null, author_name: authorName, is_public: isPublic,
      }).select("id").single();

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

      const appUrl = getPublicUrl(`${slug}/index.html`);
      const platformUrl = `${process.env.NEXT_PUBLIC_APP_URL}/apps/${slug}`;
      const solutionId = await linkPublishedAppToRequest({
        requestSlug,
        userId: user?.id ?? null,
        appId: data.id,
        appSlug: slug,
        appName: name,
        appUrl: platformUrl,
        description,
      });
      return NextResponse.json({ success: true, app_id: data.id, slug, app_url: appUrl, platform_url: platformUrl, solution_id: solutionId });
    }

    // ── FormData path (existing) ────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    // Accept both "name" (browser) and "title" (MCP)
    const name = (formData.get("name") as string) || (formData.get("title") as string) || "Untitled App";
    const description = (formData.get("description") as string) || "";
    const isPublic = formData.get("is_public") !== "false";
    const requestSlug = (formData.get("request_slug") as string) || (formData.get("request") as string) || null;

    // Resolve community_id: accept direct id or slug
    let communityId = (formData.get("community_id") as string) || null;
    const communitySlug = formData.get("community_slug") as string | null;
    if (!communityId && communitySlug) {
      const db = createServerClient();
      const { data: community } = await db
        .from("communities")
        .select("id")
        .eq("slug", communitySlug)
        .single();
      communityId = community?.id ?? null;
    }

    // Auto-set author_name from profile
    let authorName = "Anonymous";
    if (user) {
      const db = createServerClient();
      const { data: profile } = await db.from("profiles").select("display_name").eq("id", user.id).single();
      if (profile?.display_name) {
        authorName = profile.display_name;
      }
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const slug = generateSlug(name);
    const fileName = file.name.toLowerCase();
    let fileCount = 0;

    if (fileName.endsWith(".zip")) {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);

      // Collect valid file entries
      const entries: { path: string; file: JSZip.JSZipObject }[] = [];
      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;
        if (relativePath.startsWith("__MACOSX/")) return;
        const parts = relativePath.split("/");
        if (parts.some((p) => p.startsWith("."))) return;
        entries.push({ path: relativePath, file: zipEntry });
      });

      if (entries.length === 0) {
        return NextResponse.json(
          { success: false, error: "ZIP file is empty" },
          { status: 400 }
        );
      }

      // Detect single root folder and strip it
      const firstSlash = entries[0].path.indexOf("/");
      let prefix = "";
      if (firstSlash > 0) {
        const candidate = entries[0].path.slice(0, firstSlash + 1);
        if (entries.every((e) => e.path.startsWith(candidate))) {
          prefix = candidate;
        }
      }

      // Check for index.html
      const hasIndex = entries.some(
        (e) => stripPrefix(e.path, prefix) === "index.html"
      );
      if (!hasIndex) {
        return NextResponse.json(
          { success: false, error: "No index.html found in ZIP" },
          { status: 400 }
        );
      }

      // Upload all files
      for (const entry of entries) {
        const filePath = stripPrefix(entry.path, prefix);
        const content = await entry.file.async("uint8array");
        const key = `${slug}/${filePath}`;
        await uploadToR2(key, content, getMimeType(filePath));
        fileCount++;
      }
    } else if (fileName.endsWith(".html")) {
      const buffer = new Uint8Array(await file.arrayBuffer());
      await uploadToR2(`${slug}/index.html`, buffer, "text/html");
      fileCount = 1;
    } else {
      return NextResponse.json(
        { success: false, error: "Only .zip and .html files are accepted" },
        { status: 400 }
      );
    }

    const authorToken = crypto.randomUUID();

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("apps")
      .insert({
        name,
        description,
        slug,
        author_token: authorToken,
        file_count: fileCount,
        community_id: communityId,
        user_id: user?.id ?? null,
        author_name: authorName,
        is_public: isPublic,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const appUrl = getPublicUrl(`${slug}/index.html`);
    const platformUrl = `${process.env.NEXT_PUBLIC_APP_URL}/apps/${slug}`;
    const solutionId = await linkPublishedAppToRequest({
      requestSlug,
      userId: user?.id ?? null,
      appId: data.id,
      appSlug: slug,
      appName: name,
      appUrl: platformUrl,
      description,
    });

    return NextResponse.json({
      success: true,
      app_id: data.id,
      slug,
      app_url: appUrl,
      platform_url: platformUrl,
      solution_id: solutionId,
    });
  } catch (err) {
    console.error("Publish error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") ?? "";

    // ── JSON path: html_content direct update ───────────────────
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({})) as Record<string, unknown>;
      const slug = body.slug as string;
      if (!slug) return NextResponse.json({ success: false, error: "slug is required" }, { status: 400 });

      const htmlContent = body.html_content as string | undefined;
      const name = (body.title as string) || (body.name as string) || null;
      const description = (body.description as string) || null;

      const supabase = createServerClient();
      const { data: app } = await supabase.from("apps").select("id, slug, version, user_id").eq("slug", slug).single();
      if (!app || app.user_id !== user.id) {
        return NextResponse.json({ success: false, error: "Not found or not authorized" }, { status: 403 });
      }

      if (htmlContent) {
        await uploadToR2(`${slug}/index.html`, new TextEncoder().encode(htmlContent), "text/html");
      }

      const updates: Record<string, unknown> = {
        version: (app.version ?? 1) + 1,
        last_published_at: new Date().toISOString(),
      };
      if (name !== null) updates.name = name;
      if (description !== null) updates.description = description;

      const { error } = await supabase.from("apps").update(updates).eq("id", app.id);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

      const appUrl = getPublicUrl(`${slug}/index.html`);
      return NextResponse.json({ success: true, version: updates.version, app_url: appUrl });
    }

    // ── FormData path (existing) ────────────────────────────────
    const formData = await req.formData();
    const slug = formData.get("slug") as string;
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const description = formData.get("description") as string | null;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "slug is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify ownership
    const { data: app } = await supabase
      .from("apps")
      .select("id, slug, version, user_id")
      .eq("slug", slug)
      .single();

    if (!app || app.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Not found or not authorized" },
        { status: 403 }
      );
    }

    // Upload new files if provided
    if (file) {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".zip")) {
        const buffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);

        const entries: { path: string; file: JSZip.JSZipObject }[] = [];
        zip.forEach((relativePath, zipEntry) => {
          if (zipEntry.dir) return;
          if (relativePath.startsWith("__MACOSX/")) return;
          const parts = relativePath.split("/");
          if (parts.some((p) => p.startsWith("."))) return;
          entries.push({ path: relativePath, file: zipEntry });
        });

        const firstSlash = entries[0]?.path.indexOf("/") ?? -1;
        let prefix = "";
        if (firstSlash > 0) {
          const candidate = entries[0].path.slice(0, firstSlash + 1);
          if (entries.every((e) => e.path.startsWith(candidate))) {
            prefix = candidate;
          }
        }

        const hasIndex = entries.some(
          (e) => stripPrefix(e.path, prefix) === "index.html"
        );
        if (!hasIndex) {
          return NextResponse.json(
            { success: false, error: "No index.html found in ZIP" },
            { status: 400 }
          );
        }

        for (const entry of entries) {
          const filePath = stripPrefix(entry.path, prefix);
          const content = await entry.file.async("uint8array");
          await uploadToR2(`${slug}/${filePath}`, content, getMimeType(filePath));
        }
      } else if (fileName.endsWith(".html")) {
        const buffer = new Uint8Array(await file.arrayBuffer());
        await uploadToR2(`${slug}/index.html`, buffer, "text/html");
      }
    }

    // Update database
    const updates: Record<string, unknown> = {
      version: (app.version ?? 1) + 1,
      last_published_at: new Date().toISOString(),
    };
    if (name !== null) updates.name = name;
    if (description !== null) updates.description = description;

    const { error } = await supabase
      .from("apps")
      .update(updates)
      .eq("id", app.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const appUrl = getPublicUrl(`${slug}/index.html`);
    return NextResponse.json({ success: true, version: updates.version, app_url: appUrl });
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function stripPrefix(path: string, prefix: string): string {
  return prefix && path.startsWith(prefix) ? path.slice(prefix.length) : path;
}

async function linkPublishedAppToRequest({
  requestSlug,
  userId,
  appId,
  appSlug,
  appName,
  appUrl,
  description,
}: {
  requestSlug: string | null;
  userId: string | null;
  appId: string;
  appSlug: string;
  appName: string;
  appUrl: string;
  description: string;
}): Promise<string | null> {
  if (!requestSlug || !userId) return null;

  const db = createServerClient();
  const { data: request } = await db
    .from("requests")
    .select("id, user_id, status")
    .eq("slug", requestSlug)
    .single();

  if (!request) return null;

  const { data: solution, error } = await db
    .from("solutions")
    .insert({
      request_id: request.id,
      user_id: userId,
      app_id: appId,
      app_slug: appSlug,
      title: appName,
      app_url: appUrl,
      description,
      usage_guide: "APLZで公開されたアプリです。起動ボタンから試せます。",
      external_communication: false,
    })
    .select("id")
    .single();

  if (error || !solution) return null;

  if (["open", "questions"].includes(request.status)) {
    await db.from("requests").update({ status: "answered" }).eq("id", request.id);
  }

  await createNotification({
    userId: request.user_id,
    actorId: userId,
    type: "solution_created",
    requestId: request.id,
    solutionId: solution.id,
  });

  return solution.id;
}
