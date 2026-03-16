import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import AppCard from "./components/AppCard";

export const revalidate = 30;

export default async function Home() {
  const supabase = createServerClient();
  const { data: apps } = await supabase
    .from("apps")
    .select(
      `
      *,
      comments:comments(count),
      ratings:ratings(count)
    `
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(30);

  // Fetch rating averages for all apps
  const { data: allRatings } = await supabase
    .from("ratings")
    .select("app_id, usability, design, idea");

  const ratingsByApp: Record<string, { sum: number; count: number }> = {};
  for (const r of allRatings ?? []) {
    if (!ratingsByApp[r.app_id]) {
      ratingsByApp[r.app_id] = { sum: 0, count: 0 };
    }
    ratingsByApp[r.app_id].sum += r.usability + r.design + r.idea;
    ratingsByApp[r.app_id].count += 1;
  }

  // Fetch profiles for avatar display
  const userIds = [...new Set((apps ?? []).map((a) => a.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds)
    : { data: [] };
  const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
  }

  const list = (apps ?? []).map((app) => {
    const rd = ratingsByApp[app.id];
    const profile = app.user_id ? profileMap[app.user_id] : null;
    return {
      ...app,
      comment_count: app.comments?.[0]?.count ?? 0,
      rating_count: rd?.count ?? 0,
      avg_rating: rd ? rd.sum / rd.count / 3 : 0,
      profile_avatar_url: profile?.avatar_url ?? null,
      profile_display_name: profile?.display_name ?? null,
    };
  });

  const r2PublicUrl = process.env.R2_PUBLIC_URL;

  return (
    <main>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-16 pb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <svg width="48" height="48" viewBox="0 0 36 36">
            <g transform="translate(18,18)">
              <path d="M-13,-9 C-3,-9 3,9 13,9" fill="none" stroke="#1B4F72" strokeWidth="2.8" strokeLinecap="round"/>
              <path d="M-13,9 C-3,9 3,-9 13,-9" fill="none" stroke="#B83232" strokeWidth="2.8" strokeLinecap="round"/>
              <circle cx="0" cy="0" r="2.2" fill="#1B4F72"/>
            </g>
          </svg>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: '48px', color: '#1a1a1a' }}>
            APLZ
          </h1>
        </div>
        <p className="text-lg text-[#606060] mb-3">
          AIで作ったアプリを、ドラッグ&ドロップで公開。
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <Link
            href="/new"
            className="px-6 py-2.5 rounded-lg bg-[#1B4F72] text-white font-semibold text-sm hover:bg-[#15415F] transition-colors"
          >
            AIでアプリを作る
          </Link>
          <Link
            href="/publish"
            className="px-6 py-2.5 rounded-lg border border-[#e5e5e5] text-[#606060] font-semibold text-sm hover:bg-[#f5f5f5] transition-colors"
          >
            ファイルをアップロード
          </Link>
        </div>
      </section>

      {/* App List */}
      <section className="max-w-[1800px] mx-auto px-4 pb-20">
        <h2 className="text-sm font-medium text-[#909090] mb-4">
          公開されたアプリ
        </h2>

        {list.length === 0 ? (
          <div className="text-center py-16 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
            <p className="text-[#606060] mb-4">まだアプリがありません</p>
            <Link
              href="/publish"
              className="inline-block px-5 py-2 rounded-lg bg-[#1B4F72] text-white font-semibold text-sm hover:bg-[#15415F] transition-colors"
            >
              最初のアプリを公開する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {list.map((app) => (
              <AppCard
                key={app.id}
                slug={app.slug}
                name={app.name}
                appUrl={`${r2PublicUrl}/${app.slug}/index.html`}
                avgRating={app.avg_rating}
                ratingCount={app.rating_count}
                commentCount={app.comment_count}
                createdAt={app.created_at}
                authorName={app.profile_display_name || app.author_name}
                avatarUrl={app.profile_avatar_url}
                version={app.version}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
