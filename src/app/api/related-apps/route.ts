import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const appId = req.nextUrl.searchParams.get("app_id");
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(parseInt(limitParam || "8", 10), 20);

  if (!appId) {
    return NextResponse.json({ error: "app_id is required" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Get the current app's community_id
  const { data: currentApp } = await supabase
    .from("apps")
    .select("community_id")
    .eq("id", appId)
    .single();

  let apps: Record<string, unknown>[] = [];

  // Fetch same-community apps first
  if (currentApp?.community_id) {
    const { data } = await supabase
      .from("apps")
      .select("id, name, slug, author_name, created_at")
      .eq("community_id", currentApp.community_id)
      .neq("id", appId)
      .order("created_at", { ascending: false })
      .limit(limit);
    apps = data ?? [];
  }

  // Fill remaining slots from all apps
  if (apps.length < limit) {
    const excludeIds = [appId, ...apps.map((a) => a.id as string)];
    const { data } = await supabase
      .from("apps")
      .select("id, name, slug, author_name, created_at")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(limit - apps.length);
    apps = [...apps, ...(data ?? [])];
  }

  // Fetch ratings for these apps
  const appIds = apps.map((a) => a.id as string);
  let ratingsByApp: Record<string, { sum: number; count: number }> = {};

  if (appIds.length > 0) {
    const { data: ratings } = await supabase
      .from("ratings")
      .select("app_id, usability, design, idea")
      .in("app_id", appIds);

    for (const r of ratings ?? []) {
      if (!ratingsByApp[r.app_id]) {
        ratingsByApp[r.app_id] = { sum: 0, count: 0 };
      }
      ratingsByApp[r.app_id].sum += r.usability + r.design + r.idea;
      ratingsByApp[r.app_id].count += 1;
    }
  }

  const result = apps.map((app) => {
    const rd = ratingsByApp[app.id as string];
    return {
      ...app,
      avg_rating: rd ? rd.sum / rd.count / 3 : 0,
      rating_count: rd?.count ?? 0,
    };
  });

  return NextResponse.json(result);
}
