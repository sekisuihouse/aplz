import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  asOptionalString,
  asString,
  createNotification,
  getUserFromRequest,
  isValidUrl,
} from "@/lib/request-platform";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const db = createServerClient();
    const { data: request } = await db
      .from("requests")
      .select("id, is_public, status")
      .eq("slug", slug)
      .single();

    if (!request || !request.is_public || request.status === "hidden") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: solutions, error } = await db
      .from("solutions")
      .select("*")
      .eq("request_id", request.id)
      .order("is_accepted", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const solutionIds = (solutions ?? []).map((solution) => solution.id);
    const userIds = [
      ...new Set((solutions ?? []).map((solution) => solution.user_id).filter(Boolean)),
    ];

    const [{ data: feedback }, { data: profiles }] = await Promise.all([
      solutionIds.length
        ? db.from("solution_feedback").select("solution_id, feedback_type").in("solution_id", solutionIds)
        : Promise.resolve({ data: [] }),
      userIds.length
        ? db.from("profiles").select("id, display_name, avatar_url").in("id", userIds)
        : Promise.resolve({ data: [] }),
    ]);

    const feedbackMap: Record<string, Record<string, number>> = {};
    for (const row of feedback ?? []) {
      feedbackMap[row.solution_id] ??= {};
      feedbackMap[row.solution_id][row.feedback_type] =
        (feedbackMap[row.solution_id][row.feedback_type] ?? 0) + 1;
    }

    const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
    for (const profile of profiles ?? []) {
      profileMap[profile.id] = {
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      };
    }

    return NextResponse.json({
      solutions: (solutions ?? []).map((solution) => ({
        ...solution,
        feedback_counts: feedbackMap[solution.id] ?? {},
        author: solution.user_id ? profileMap[solution.user_id] ?? null : null,
      })),
    });
  } catch (err) {
    console.error("solutions GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slug } = await params;
    const db = createServerClient();
    const { data: request } = await db
      .from("requests")
      .select("id, user_id, status")
      .eq("slug", slug)
      .single();

    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    let title = asString(body.title, 120);
    let appUrl = asOptionalString(body.app_url, 1000);
    let appId = asOptionalString(body.app_id, 100);
    let appSlug = asOptionalString(body.app_slug, 200);

    if (appSlug || appId) {
      let appQuery = db.from("apps").select("id, slug, name");
      if (appId) appQuery = appQuery.eq("id", appId);
      if (appSlug) appQuery = appQuery.eq("slug", appSlug);
      const { data: apps } = await appQuery.limit(1);
      const app = apps?.[0];
      if (!app) return NextResponse.json({ error: "app not found" }, { status: 404 });
      appId = app.id;
      appSlug = app.slug;
      title ||= app.name;
      appUrl ||= `${process.env.NEXT_PUBLIC_APP_URL}/apps/${app.slug}`;
    }

    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
    if (!appUrl && !appSlug) {
      return NextResponse.json({ error: "app_url or app_slug is required" }, { status: 400 });
    }
    if (!isValidUrl(appUrl)) {
      return NextResponse.json({ error: "app_url must be a URL" }, { status: 400 });
    }

    const { data: solution, error } = await db
      .from("solutions")
      .insert({
        request_id: request.id,
        user_id: user.id,
        app_id: appId,
        app_slug: appSlug,
        title,
        app_url: appUrl,
        description: asOptionalString(body.description, 2000),
        usage_guide: asOptionalString(body.usage_guide, 2000),
        can_do: asOptionalString(body.can_do, 2000),
        cannot_do: asOptionalString(body.cannot_do, 2000),
        data_handled: asOptionalString(body.data_handled, 2000),
        external_communication: body.external_communication === true,
        data_storage: body.data_storage === true,
        recommended_environment: asOptionalString(body.recommended_environment, 1000),
        screenshot_url: asOptionalString(body.screenshot_url, 1000),
        version_note: asOptionalString(body.version_note, 1000),
        caution_note: asOptionalString(body.caution_note, 1000),
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (["open", "questions"].includes(request.status)) {
      await db.from("requests").update({ status: "answered" }).eq("id", request.id);
    }

    await createNotification({
      userId: request.user_id,
      actorId: user.id,
      type: "solution_created",
      requestId: request.id,
      solutionId: solution.id,
    });

    return NextResponse.json({ success: true, solution });
  } catch (err) {
    console.error("solutions POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
