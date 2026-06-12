import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  asOptionalString,
  createNotification,
  getUserFromRequest,
  isFeedbackType,
} from "@/lib/request-platform";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = createServerClient();
    const { data: solution } = await db
      .from("solutions")
      .select("id, user_id, request_id")
      .eq("id", id)
      .single();

    if (!solution) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (!isFeedbackType(body.feedback_type)) {
      return NextResponse.json({ error: "invalid feedback_type" }, { status: 400 });
    }

    const { data, error } = await db
      .from("solution_feedback")
      .upsert({
        solution_id: solution.id,
        user_id: user.id,
        feedback_type: body.feedback_type,
        comment: asOptionalString(body.comment, 1000),
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await createNotification({
      userId: solution.user_id,
      actorId: user.id,
      type: `solution_feedback_${body.feedback_type}`,
      requestId: solution.request_id,
      solutionId: solution.id,
    });

    return NextResponse.json({ success: true, feedback: data });
  } catch (err) {
    console.error("solution feedback POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
