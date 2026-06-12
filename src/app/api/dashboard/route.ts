import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/request-platform";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createServerClient();
    const [
      { data: myRequests },
      { data: mySolutions },
      { data: notifications },
    ] = await Promise.all([
      db
        .from("requests")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(30),
      db
        .from("solutions")
        .select("*, requests:request_id(slug, title, status)")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(30),
      db
        .from("notifications")
        .select("*, requests:request_id(slug, title), solutions:solution_id(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const solutionIds = (mySolutions ?? []).map((solution) => solution.id);
    const { data: feedback } = solutionIds.length
      ? await db
          .from("solution_feedback")
          .select("solution_id, feedback_type, comment, created_at")
          .in("solution_id", solutionIds)
      : { data: [] };

    const feedbackCounts: Record<string, Record<string, number>> = {};
    for (const row of feedback ?? []) {
      feedbackCounts[row.solution_id] ??= {};
      feedbackCounts[row.solution_id][row.feedback_type] =
        (feedbackCounts[row.solution_id][row.feedback_type] ?? 0) + 1;
    }

    return NextResponse.json({
      requests: myRequests ?? [],
      solutions: (mySolutions ?? []).map((solution) => ({
        ...solution,
        feedback_counts: feedbackCounts[solution.id] ?? {},
      })),
      accepted_solutions: (mySolutions ?? []).filter((solution) => solution.is_accepted),
      notifications: notifications ?? [],
      unread_count: (notifications ?? []).filter((item) => !item.read_at).length,
      stats: {
        request_count: myRequests?.length ?? 0,
        solution_count: mySolutions?.length ?? 0,
        accepted_count: (mySolutions ?? []).filter((solution) => solution.is_accepted).length,
        worked_count: (feedback ?? []).filter((item) => item.feedback_type === "worked").length,
        thanks_count: (feedback ?? []).filter((item) => item.feedback_type === "thanks").length,
      },
    });
  } catch (err) {
    console.error("dashboard GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
