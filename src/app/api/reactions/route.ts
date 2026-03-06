import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { REACTION_TYPES, LEGACY_EMOJI_MAP } from "@/lib/utils";

function getIdentifier(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function GET(req: NextRequest) {
  const appId = req.nextUrl.searchParams.get("app_id");
  if (!appId) {
    return NextResponse.json({ error: "app_id is required" }, { status: 400 });
  }

  const identifier = getIdentifier(req);
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("reactions")
    .select("emoji, identifier")
    .eq("app_id", appId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts: Record<string, number> = {};
  for (const t of REACTION_TYPES) {
    counts[t] = 0;
  }
  const userReactions: string[] = [];

  for (const row of data) {
    const mapped = LEGACY_EMOJI_MAP[row.emoji];
    const key = mapped ?? (REACTION_TYPES.includes(row.emoji as (typeof REACTION_TYPES)[number]) ? row.emoji : null);
    if (key) {
      counts[key] += 1;
      if (row.identifier === identifier) {
        userReactions.push(key);
      }
    }
  }

  return NextResponse.json({ counts, userReactions });
}

export async function POST(req: NextRequest) {
  try {
    const { app_id, emoji } = await req.json();

    if (!app_id || !emoji) {
      return NextResponse.json({ error: "app_id and emoji are required" }, { status: 400 });
    }

    const validNew = REACTION_TYPES.includes(emoji as (typeof REACTION_TYPES)[number]);
    const validLegacy = emoji in LEGACY_EMOJI_MAP;

    if (!validNew && !validLegacy) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    const identifier = getIdentifier(req);
    const supabase = createServerClient();

    // Check if already reacted (toggle behavior)
    const { data: existing } = await supabase
      .from("reactions")
      .select("id")
      .eq("app_id", app_id)
      .eq("emoji", emoji)
      .eq("identifier", identifier)
      .maybeSingle();

    if (existing) {
      // Toggle off: delete
      await supabase.from("reactions").delete().eq("id", existing.id);
      return NextResponse.json({ success: true, toggled: false });
    } else {
      // Toggle on: insert
      const { error } = await supabase
        .from("reactions")
        .insert({ app_id, emoji, identifier });
      if (error) {
        console.error("Reaction insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, toggled: true });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
