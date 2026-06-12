import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { asOptionalString, asString, createNotification, getUserFromRequest } from "@/lib/request-platform";

const COMMENT_TYPES = ["question", "answer", "comment", "system"] as const;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slug } = await params;
    const db = createServerClient();
    const { data: request } = await db
      .from("requests")
      .select("id, user_id")
      .eq("slug", slug)
      .single();

    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const content = asString(body.body, 2000);
    if (!content) return NextResponse.json({ error: "body is required" }, { status: 400 });

    const commentType = COMMENT_TYPES.includes(body.comment_type as (typeof COMMENT_TYPES)[number])
      ? body.comment_type
      : "comment";

    const solutionId = asOptionalString(body.solution_id, 100);

    const { data: comment, error } = await db
      .from("request_comments")
      .insert({
        request_id: request.id,
        solution_id: solutionId,
        user_id: user.id,
        body: content,
        comment_type: commentType,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await createNotification({
      userId: request.user_id,
      actorId: user.id,
      type: "request_comment",
      requestId: request.id,
      solutionId,
      commentId: comment.id,
    });

    return NextResponse.json({ success: true, comment });
  } catch (err) {
    console.error("request comment POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
