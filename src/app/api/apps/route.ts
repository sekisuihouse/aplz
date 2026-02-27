import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: apps, error } = await supabase
      .from("apps")
      .select(
        `
        *,
        comments:comments(count),
        reactions:reactions(count)
      `
      )
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = apps.map((app) => ({
      ...app,
      comment_count: app.comments?.[0]?.count ?? 0,
      reaction_count: app.reactions?.[0]?.count ?? 0,
      comments: undefined,
      reactions: undefined,
    }));

    return NextResponse.json({ apps: formatted });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
