import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { createServerClient } from "@/lib/supabase";
import { uploadToR2, getPublicUrl } from "@/lib/r2";
import { generateSlug, getMimeType } from "@/lib/utils";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";

async function getUser(req: NextRequest) {
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
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || "Untitled App";
    const description = (formData.get("description") as string) || "";
    const communityId = (formData.get("community_id") as string) || null;
    const authorName = (formData.get("author_name") as string) || "Anonymous";

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

    return NextResponse.json({
      success: true,
      app_id: data.id,
      slug,
      app_url: appUrl,
      platform_url: platformUrl,
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

    return NextResponse.json({ success: true, version: updates.version });
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
