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

  const list = (apps ?? []).map((app) => {
    const rd = ratingsByApp[app.id];
    return {
      ...app,
      comment_count: app.comments?.[0]?.count ?? 0,
      rating_count: rd?.count ?? 0,
      avg_rating: rd ? rd.sum / rd.count / 3 : 0,
    };
  });

  const r2PublicUrl = process.env.R2_PUBLIC_URL;

  return (
    <main>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-16 pb-12 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#e4e4e7] mb-3 leading-snug">
          AIで作ったアプリを、
          <br />
          ドラッグ&ドロップで公開。
        </h1>
        <Link
          href="/publish"
          className="mt-4 px-6 py-2.5 rounded-lg bg-[#22d3ee] text-black font-semibold text-sm hover:bg-[#06b6d4] transition-colors"
        >
          アプリを公開する
        </Link>
      </section>

      {/* App List */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-sm font-medium text-zinc-500 mb-4">
          公開されたアプリ
        </h2>

        {list.length === 0 ? (
          <div className="text-center py-16 bg-[#141416] border border-[#1e1e22] rounded-xl">
            <p className="text-zinc-500 mb-4">まだアプリがありません</p>
            <Link
              href="/publish"
              className="inline-block px-5 py-2 rounded-lg bg-[#22d3ee] text-black font-semibold text-sm hover:bg-[#06b6d4] transition-colors"
            >
              最初のアプリを公開する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
