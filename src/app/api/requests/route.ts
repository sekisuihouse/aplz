import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  REQUEST_CATEGORIES,
  asOptionalString,
  asString,
  getUserFromRequest,
  isPrivacyLevel,
  isValidUrl,
  makeRequestSlug,
} from "@/lib/request-platform";
import { recordAnalyticsEvent } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  try {
    const db = createServerClient();
    const { searchParams } = new URL(req.url);
    const q = asString(searchParams.get("q"), 120);
    const category = asString(searchParams.get("category"), 80);
    const filter = asString(searchParams.get("filter"), 40);
    const privacy = asString(searchParams.get("privacy"), 40);
    const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 100);

    let query = db
      .from("requests")
      .select("*")
      .eq("is_public", true)
      .neq("status", "hidden");

    if (category) query = query.eq("category", category);
    if (privacy) query = query.eq("privacy_level", privacy);

    if (filter === "unsolved") {
      query = query.not("status", "in", "(solved,hidden)");
    } else if (filter === "answered") {
      query = query.in("status", ["answered", "testing", "solved"]);
    } else if (filter === "solved") {
      query = query.eq("status", "solved");
    } else if (filter === "beginner") {
      query = query.eq("is_beginner_friendly", true);
    } else if (filter === "privacy_none") {
      query = query.eq("privacy_level", "none");
    }

    if (q) {
      const term = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
      query = query.or(
        `title.ilike.${term},description.ilike.${term},category.ilike.${term},desired_outcome.ilike.${term}`
      );
    }

    const { data: requests, error } = await query
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const requestIds = (requests ?? []).map((item) => item.id);
    const userIds = [
      ...new Set((requests ?? []).map((item) => item.user_id).filter(Boolean)),
    ];

    const [{ data: solutions }, { data: comments }, { data: profiles }] =
      await Promise.all([
        requestIds.length
          ? db.from("solutions").select("request_id").in("request_id", requestIds)
          : Promise.resolve({ data: [] }),
        requestIds.length
          ? db.from("request_comments").select("request_id").in("request_id", requestIds)
          : Promise.resolve({ data: [] }),
        userIds.length
          ? db.from("profiles").select("id, display_name, avatar_url").in("id", userIds)
          : Promise.resolve({ data: [] }),
      ]);

    const solutionCounts: Record<string, number> = {};
    for (const row of solutions ?? []) {
      solutionCounts[row.request_id] = (solutionCounts[row.request_id] ?? 0) + 1;
    }

    const commentCounts: Record<string, number> = {};
    for (const row of comments ?? []) {
      commentCounts[row.request_id] = (commentCounts[row.request_id] ?? 0) + 1;
    }

    const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
    for (const profile of profiles ?? []) {
      profileMap[profile.id] = {
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      };
    }

    return NextResponse.json({
      requests: (requests ?? []).map((item) => ({
        ...item,
        answer_count: solutionCounts[item.id] ?? 0,
        comment_count: commentCounts[item.id] ?? 0,
        author: item.user_id ? profileMap[item.user_id] ?? null : null,
      })),
      categories: REQUEST_CATEGORIES,
    });
  } catch (err) {
    console.error("requests GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const title = asString(body.title, 120);
    const category = asString(body.category, 80) || "その他";
    const description = asOptionalString(body.description, 5000);
    const desiredOutcome = asOptionalString(body.desired_outcome, 2000);
    const referenceUrl = asOptionalString(body.reference_url, 500);
    const deadline = asString(body.deadline, 20);
    const privacyLevel = isPrivacyLevel(body.privacy_level)
      ? body.privacy_level
      : "unknown";

    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
    if (!isValidDate(deadline)) {
      return NextResponse.json({ error: "deadline is required" }, { status: 400 });
    }
    if (!isValidUrl(referenceUrl)) {
      return NextResponse.json({ error: "reference_url must be a URL" }, { status: 400 });
    }

    const db = createServerClient();
    const { data, error } = await db
      .from("requests")
      .insert({
        user_id: user.id,
        slug: makeRequestSlug(title),
        title,
        category,
        target_user_type: asOptionalString(body.target_user_type, 1000),
        current_workflow: asOptionalString(body.current_workflow, 2000),
        pain_point: asOptionalString(body.pain_point, 2000),
        desired_outcome: desiredOutcome,
        usage_frequency: asOptionalString(body.usage_frequency, 500),
        input_data: asOptionalString(body.input_data, 2000),
        output_data: asOptionalString(body.output_data, 2000),
        privacy_level: privacyLevel,
        deadline,
        reference_url: referenceUrl,
        description,
        status: "open",
        is_public: body.is_public !== false,
        is_beginner_friendly: body.is_beginner_friendly === true,
      })
      .select("id, slug")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAnalyticsEvent({
      req,
      eventName: "request_created",
      userId: user.id,
      path: `/requests/${data.slug}`,
      metadata: { category, privacy_level: privacyLevel },
    });

    return NextResponse.json({ success: true, request: data });
  } catch (err) {
    console.error("requests POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
