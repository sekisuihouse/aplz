import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { REACTION_EMOJIS } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const appId = req.nextUrl.searchParams.get("app_id");
  if (!appId) {
    return NextResponse.json(
      { error: "app_id is required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("reactions")
    .select("emoji")
    .eq("app_id", appId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts: Record<string, number> = {};
  for (const e of REACTION_EMOJIS) {
    counts[e] = 0;
  }
  for (const row of data) {
    counts[row.emoji] = (counts[row.emoji] || 0) + 1;
  }

  return NextResponse.json(counts);
}

export async function POST(req: NextRequest) {
  try {
    const { app_id, emoji } = await req.json();

    if (!app_id || !emoji) {
      return NextResponse.json(
        { error: "app_id and emoji are required" },
        { status: 400 }
      );
    }

    if (!REACTION_EMOJIS.includes(emoji)) {
      return NextResponse.json(
        { error: "Invalid emoji" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from("reactions")
      .insert({ app_id, emoji });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
