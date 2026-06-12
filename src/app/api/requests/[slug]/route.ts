import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  asOptionalString,
  asString,
  getUserFromRequest,
  isPrivacyLevel,
  isRequestStatus,
  isValidUrl,
} from "@/lib/request-platform";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const db = createServerClient();
    const { data: request, error } = await db
      .from("requests")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !request || request.status === "hidden" || !request.is_public) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [{ data: author }, { data: solutions }, { data: comments }] =
      await Promise.all([
        request.user_id
          ? db
              .from("profiles")
              .select("id, display_name, avatar_url, bio, github_url, sns_url, website_url, developer_enabled, skill_categories")
              .eq("id", request.user_id)
              .single()
          : Promise.resolve({ data: null }),
        db
          .from("solutions")
          .select("*")
          .eq("request_id", request.id)
          .order("is_accepted", { ascending: false })
          .order("created_at", { ascending: false }),
        db
          .from("request_comments")
          .select("*")
          .eq("request_id", request.id)
          .order("created_at", { ascending: true }),
      ]);

    return NextResponse.json({
      request,
      author,
      solutions: solutions ?? [],
      comments: comments ?? [],
    });
  } catch (err) {
    console.error("request GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slug } = await params;
    const db = createServerClient();
    const { data: existing } = await db
      .from("requests")
      .select("id, user_id")
      .eq("slug", slug)
      .single();

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    if (typeof body.title === "string") {
      const title = asString(body.title, 120);
      if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
      updates.title = title;
    }
    if (typeof body.category === "string") updates.category = asString(body.category, 80);
    if (typeof body.description === "string") updates.description = asString(body.description, 5000);
    if (typeof body.desired_outcome === "string") updates.desired_outcome = asString(body.desired_outcome, 2000);
    if (typeof body.target_user_type === "string") updates.target_user_type = asOptionalString(body.target_user_type, 1000);
    if (typeof body.current_workflow === "string") updates.current_workflow = asOptionalString(body.current_workflow, 2000);
    if (typeof body.pain_point === "string") updates.pain_point = asOptionalString(body.pain_point, 2000);
    if (typeof body.usage_frequency === "string") updates.usage_frequency = asOptionalString(body.usage_frequency, 500);
    if (typeof body.input_data === "string") updates.input_data = asOptionalString(body.input_data, 2000);
    if (typeof body.output_data === "string") updates.output_data = asOptionalString(body.output_data, 2000);
    if (typeof body.deadline === "string") updates.deadline = asOptionalString(body.deadline, 20);
    if (typeof body.reference_url === "string") {
      const referenceUrl = asOptionalString(body.reference_url, 500);
      if (!isValidUrl(referenceUrl)) {
        return NextResponse.json({ error: "reference_url must be a URL" }, { status: 400 });
      }
      updates.reference_url = referenceUrl;
    }
    if (typeof body.status === "string") {
      if (!isRequestStatus(body.status)) {
        return NextResponse.json({ error: "invalid status" }, { status: 400 });
      }
      updates.status = body.status;
    }
    if (typeof body.privacy_level === "string") {
      if (!isPrivacyLevel(body.privacy_level)) {
        return NextResponse.json({ error: "invalid privacy_level" }, { status: 400 });
      }
      updates.privacy_level = body.privacy_level;
    }
    if (typeof body.is_public === "boolean") updates.is_public = body.is_public;
    if (typeof body.is_beginner_friendly === "boolean") {
      updates.is_beginner_friendly = body.is_beginner_friendly;
    }

    const { data, error } = await db
      .from("requests")
      .update(updates)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: data });
  } catch (err) {
    console.error("request PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
