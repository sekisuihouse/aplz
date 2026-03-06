import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createAuthServerClient } from "@/lib/supabase-server";

async function getUserFromRequest(req: NextRequest): Promise<{ id: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const db = createServerClient();
    const { data } = await db
      .from("api_tokens")
      .select("user_id")
      .eq("token", token)
      .single();
    if (data) {
      await db
        .from("api_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("token", token);
      return { id: data.user_id };
    }
  }

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  return user ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "10"), 50);

    const db = createServerClient();
    const { data: apps } = await db
      .from("apps")
      .select("id, slug, name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!apps?.length) {
      return NextResponse.json([]);
    }

    const appIds = apps.map((a) => a.id);
    const [{ data: ratings }, { data: comments }] = await Promise.all([
      db.from("ratings").select("app_id, usability, design, idea").in("app_id", appIds),
      db.from("comments").select("app_id").in("app_id", appIds),
    ]);

    const ratingMap: Record<string, { sum: number; count: number }> = {};
    for (const r of ratings ?? []) {
      if (!ratingMap[r.app_id]) ratingMap[r.app_id] = { sum: 0, count: 0 };
      ratingMap[r.app_id].sum += (r.usability + r.design + r.idea) / 3;
      ratingMap[r.app_id].count += 1;
    }

    const commentMap: Record<string, number> = {};
    for (const c of comments ?? []) {
      commentMap[c.app_id] = (commentMap[c.app_id] ?? 0) + 1;
    }

    const result = apps.map((app) => ({
      slug: app.slug,
      name: app.name,
      created_at: app.created_at,
      avg_rating: ratingMap[app.id]
        ? (ratingMap[app.id].sum / ratingMap[app.id].count).toFixed(1)
        : null,
      comment_count: commentMap[app.id] ?? 0,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("apps/mine error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
