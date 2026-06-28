import Link from "next/link";
import AppCard from "@/app/components/AppCard";
import { createServerClient } from "@/lib/supabase";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = pageMetadata({
  title: "公開アプリ一覧 — 小さな業務アプリとデモツール | APLZ",
  description:
    "APLZで公開された小さなWebアプリ一覧です。用途、対象、データ保存や外部通信の注意を見ながら試せます。",
  path: "/apps",
  keywords: ["小さなWebアプリ", "業務アプリ 一覧", "当番表 アプリ", "集計 アプリ"],
});

export default async function AppsPage() {
  const db = createServerClient();
  const { data: apps } = await db
    .from("apps")
    .select("*, comments:comments(count)")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(120);

  const appList = await enrichApps(db, apps ?? []);
  const r2PublicUrl = process.env.R2_PUBLIC_URL;

  return (
    <main className="max-w-[1800px] mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "APLZ", path: "/" },
            { name: "公開アプリ", path: "/apps" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "APLZの公開アプリ一覧",
            description: "小さな業務アプリやデモツールの一覧です。",
            url: absoluteUrl("/apps"),
            hasPart: appList.slice(0, 50).map((app) => ({
              "@type": "SoftwareApplication",
              name: app.name,
              url: absoluteUrl(`/apps/${app.slug}`),
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
            })),
          },
        ]}
      />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-sm font-semibold text-[#1B4F72] mb-2">Apps</p>
          <h1 className="text-3xl font-bold text-[#0f0f0f]">公開アプリ一覧</h1>
          <p className="text-sm text-[#606060] leading-relaxed mt-3 max-w-2xl">
            当番表、集計、連絡文、受付、材料計算など、APLZで公開された小さなWebアプリを探せます。
          </p>
        </div>
        <Link
          href="/requests?filter=unsolved"
          className="px-5 py-2.5 rounded-lg bg-[#1B4F72] text-white text-sm font-semibold hover:bg-[#15415F] transition-colors"
        >
          アプリ化できる課題を見る
        </Link>
      </div>

      {appList.length === 0 ? (
        <div className="text-center py-16 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
          <p className="text-[#606060]">まだ公開アプリはありません。</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          {appList.map((app) => (
            <AppCard
              key={app.id}
              slug={app.slug}
              name={app.name}
              description={app.description}
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
    </main>
  );
}

async function enrichApps(supabase: ReturnType<typeof createServerClient>, apps: Record<string, unknown>[]) {
  const appIds = apps.map((app) => app.id as string);
  const userIds = [...new Set(apps.map((app) => app.user_id as string | null).filter(Boolean))];
  const [{ data: allRatings }, { data: profiles }] = await Promise.all([
    appIds.length
      ? supabase.from("ratings").select("app_id, usability, design, idea").in("app_id", appIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const ratingsByApp: Record<string, { sum: number; count: number }> = {};
  for (const rating of allRatings ?? []) {
    ratingsByApp[rating.app_id] ??= { sum: 0, count: 0 };
    ratingsByApp[rating.app_id].sum += rating.usability + rating.design + rating.idea;
    ratingsByApp[rating.app_id].count += 1;
  }

  const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
  for (const profile of profiles ?? []) {
    profileMap[profile.id] = { display_name: profile.display_name, avatar_url: profile.avatar_url };
  }

  return apps.map((app) => {
    const rd = ratingsByApp[app.id as string];
    const comments = app.comments as Array<{ count: number }> | undefined;
    const profile = app.user_id ? profileMap[app.user_id as string] : null;
    return {
      ...app,
      comment_count: comments?.[0]?.count ?? 0,
      rating_count: rd?.count ?? 0,
      avg_rating: rd ? rd.sum / rd.count / 3 : 0,
      profile_avatar_url: profile?.avatar_url ?? null,
      profile_display_name: profile?.display_name ?? null,
    };
  }) as Array<{
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    created_at: string;
    author_name?: string;
    version?: number;
    comment_count: number;
    rating_count: number;
    avg_rating: number;
    profile_avatar_url: string | null;
    profile_display_name: string | null;
  }>;
}
