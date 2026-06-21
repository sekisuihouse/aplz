import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createNotification, getUserFromRequest } from "@/lib/request-platform";
import { recordAnalyticsEvent } from "@/lib/analytics";

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
      .select("id, request_id, user_id")
      .eq("id", id)
      .single();

    if (!solution) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: request } = await db
      .from("requests")
      .select("id, user_id")
      .eq("id", solution.request_id)
      .single();

    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (request.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const unset = await db
      .from("solutions")
      .update({ is_accepted: false })
      .eq("request_id", request.id);
    if (unset.error) {
      return NextResponse.json({ error: unset.error.message }, { status: 500 });
    }

    const accepted = await db
      .from("solutions")
      .update({ is_accepted: true })
      .eq("id", solution.id)
      .select("*")
      .single();
    if (accepted.error) {
      return NextResponse.json({ error: accepted.error.message }, { status: 500 });
    }

    const requestUpdate = await db
      .from("requests")
      .update({ status: "solved" })
      .eq("id", request.id);
    if (requestUpdate.error) {
      return NextResponse.json({ error: requestUpdate.error.message }, { status: 500 });
    }

    await createNotification({
      userId: solution.user_id,
      actorId: user.id,
      type: "solution_accepted",
      requestId: request.id,
      solutionId: solution.id,
    });

    await recordAnalyticsEvent({
      req,
      eventName: "solution_accepted",
      userId: user.id,
      path: req.nextUrl.pathname,
    });

    return NextResponse.json({ success: true, solution: accepted.data });
  } catch (err) {
    console.error("solution accept POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
