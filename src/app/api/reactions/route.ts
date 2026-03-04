import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { REACTION_TYPES, LEGACY_EMOJI_MAP } from "@/lib/utils";

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

  // Initialize counts for new reaction types
  const counts: Record<string, number> = {};
  for (const t of REACTION_TYPES) {
    counts[t] = 0;
  }

  // Aggregate both legacy emojis and new types
  for (const row of data) {
    const mapped = LEGACY_EMOJI_MAP[row.emoji];
    if (mapped) {
      counts[mapped] += 1;
    } else if (REACTION_TYPES.includes(row.emoji as (typeof REACTION_TYPES)[number])) {
      counts[row.emoji] += 1;
    }
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

    // Accept both new reaction types and legacy emojis
    const validNew = REACTION_TYPES.includes(emoji as (typeof REACTION_TYPES)[number]);
    const validLegacy = emoji in LEGACY_EMOJI_MAP;

    if (!validNew && !validLegacy) {
      return NextResponse.json(
        { error: "Invalid reaction type" },
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
