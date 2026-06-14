import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { REACTION_TYPES, LEGACY_EMOJI_MAP } from "@/lib/utils";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = createServerClient();

    const { data: app } = await db
      .from("apps")
      .select("id, name, slug")
      .eq("slug", slug)
      .single();

    if (!app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [{ data: ratings }, { data: comments }, { data: reactions }] =
      await Promise.all([
        db.from("ratings").select("usability, design, idea").eq("app_id", app.id),
        db
          .from("comments")
          .select("body, created_at")
          .eq("app_id", app.id)
          .order("created_at", { ascending: false })
          .limit(20),
        db.from("reactions").select("emoji").eq("app_id", app.id),
      ]);

    const ratingCount = ratings?.length ?? 0;
    const avgRating =
      ratingCount > 0
        ? (
            (ratings!.reduce((s, r) => s + (r.usability + r.design + r.idea) / 3, 0) /
              ratingCount)
          ).toFixed(1)
        : null;

    const reactionCounts: Record<string, number> = {
      like: 0,
      want: 0,
      amazing: 0,
      feedback: 0,
    };
    for (const row of reactions ?? []) {
      const mapped =
        LEGACY_EMOJI_MAP[row.emoji] ??
        (REACTION_TYPES.includes(row.emoji as (typeof REACTION_TYPES)[number])
          ? (row.emoji as string)
          : null);
      if (mapped && mapped in reactionCounts) {
        reactionCounts[mapped]++;
      }
    }

    return NextResponse.json({
      title: app.name,
      slug: app.slug,
      avg_rating: avgRating,
      rating_count: ratingCount,
      reactions: reactionCounts,
      comments: (comments ?? []).map((c) => ({
        content: c.body,
        time_ago: timeAgo(c.created_at),
      })),
    });
  } catch (err) {
    console.error("feedback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
