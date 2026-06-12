import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/request-platform";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createServerClient();
    const { data, error } = await db
      .from("notifications")
      .select(
        `
        *,
        requests:request_id(slug, title),
        solutions:solution_id(title)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      notifications: data ?? [],
      unread_count: (data ?? []).filter((item) => !item.read_at).length,
    });
  } catch (err) {
    console.error("notifications GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
