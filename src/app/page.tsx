import Link from "next/link";
import { Search } from "lucide-react";
import { createServerClient } from "@/lib/supabase";
import AppCard from "./components/AppCard";
import RequestCard from "./components/RequestCard";

export const revalidate = 30;

export default async function Home() {
  const supabase = createServerClient();
  const [{ data: apps }, { data: newRequests }, { data: solvedRequests }] =
    await Promise.all([
      supabase
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
        .limit(30),
      supabase
        .from("requests")
        .select("*")
        .eq("is_public", true)
        .neq("status", "hidden")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("requests")
        .select("*")
        .eq("is_public", true)
        .eq("status", "solved")
        .order("updated_at", { ascending: false })
        .limit(6),
    ]);

  const [requestList, solvedRequestList, appList] = await Promise.all([
    enrichRequests(supabase, newRequests ?? []),
    enrichRequests(supabase, solvedRequests ?? []),
    enrichApps(supabase, apps ?? []),
  ]);

  const r2PublicUrl = process.env.R2_PUBLIC_URL;

  return (
    <main>
      <section className="flex flex-col items-center justify-center px-4 pt-16 pb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <svg width="48" height="48" viewBox="0 0 36 36">
            <g transform="translate(18,18)">
              <path d="M-13,-9 C-3,-9 3,9 13,9" fill="none" stroke="#1B4F72" strokeWidth="2.8" strokeLinecap="round"/>
              <path d="M-13,9 C-3,9 3,-9 13,-9" fill="none" stroke="#B83232" strokeWidth="2.8" strokeLinecap="round"/>
              <circle cx="0" cy="0" r="2.2" fill="#1B4F72"/>
            </g>
          </svg>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "48px", color: "#1a1a1a" }}>
            APLZ
          </h1>
        </div>
        <p className="text-xl font-semibold text-[#0f0f0f] mb-3">
          小さな困りごとを、小さなアプリで解決。
        </p>
        <p className="max-w-2xl text-sm md:text-base text-[#606060] leading-relaxed">
          APLZは、町内会・個人事業主・学校・イベント運営などの外注するほどではないけど毎回めんどくさい作業を、誰かが小さなアプリで解決してくれる場所です。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          <Link
            href="/requests/new"
            className="px-6 py-2.5 rounded-lg bg-[#1B4F72] text-white font-semibold text-sm hover:bg-[#15415F] transition-colors"
          >
            困りごとを投稿する
          </Link>
          <Link
            href="/requests"
            className="px-6 py-2.5 rounded-lg border border-[#e5e5e5] text-[#606060] font-semibold text-sm hover:bg-[#f5f5f5] transition-colors"
          >
            困りごとを見る
          </Link>
          <Link
            href="/new"
            className="px-6 py-2.5 rounded-lg border border-[#e5e5e5] text-[#606060] font-semibold text-sm hover:bg-[#f5f5f5] transition-colors"
          >
            アプリを作る
          </Link>
          <Link
            href="/publish"
            className="px-6 py-2.5 rounded-lg border border-[#e5e5e5] text-[#606060] font-semibold text-sm hover:bg-[#f5f5f5] transition-colors"
          >
            ファイルをアップロード
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-8">
        <form action="/requests" className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#909090]" />
          <input
            name="q"
            placeholder="困りごとや作業名で検索"
            className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#1B4F72]"
          />
        </form>
      </section>

      <section className="max-w-[1800px] mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[#909090]">新着の困りごと</h2>
          <Link href="/requests" className="text-sm text-[#1B4F72] hover:underline">
            すべて見る
          </Link>
        </div>
        {requestList.length === 0 ? (
          <EmptyRequest href="/requests/new" text="まだ困りごとはありません" />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {requestList.map((request) => (
              <RequestCard key={request.id} request={request} compact />
            ))}
          </div>
        )}
      </section>

      <section className="max-w-[1800px] mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[#909090]">回答済み・解決済みの困りごと</h2>
          <Link href="/requests?filter=solved" className="text-sm text-[#1B4F72] hover:underline">
            解決済みを見る
          </Link>
        </div>
        {solvedRequestList.length === 0 ? (
          <EmptyRequest href="/requests" text="まだ解決済みの困りごとはありません" />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {solvedRequestList.map((request) => (
              <RequestCard key={request.id} request={request} compact />
            ))}
          </div>
        )}
      </section>

      <section className="max-w-[1800px] mx-auto px-4 pb-12">
        <h2 className="text-sm font-medium text-[#909090] mb-4">
          公開されたアプリ
        </h2>

        {appList.length === 0 ? (
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
            {appList.map((app) => (
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

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#0f0f0f]">開発者として参加する</h2>
            <p className="text-sm text-[#606060] mt-1">
              小さな困りごとを見つけて、HTMLアプリや公開済みAPLZアプリで回答できます。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/requests?filter=unsolved"
              className="px-4 py-2 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] transition-colors"
            >
              未解決を見る
            </Link>
            <Link
              href="/new"
              className="px-4 py-2 rounded-lg border border-[#e5e5e5] bg-white text-[#606060] text-sm font-medium hover:shadow-md transition-all"
            >
              アプリを作る
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

async function enrichRequests(supabase: ReturnType<typeof createServerClient>, requests: Record<string, unknown>[]) {
  const requestIds = requests.map((request) => request.id as string);
  const userIds = [...new Set(requests.map((request) => request.user_id as string | null).filter(Boolean))];

  const [{ data: solutions }, { data: comments }, { data: profiles }] =
    await Promise.all([
      requestIds.length
        ? supabase.from("solutions").select("request_id").in("request_id", requestIds)
        : Promise.resolve({ data: [] }),
      requestIds.length
        ? supabase.from("request_comments").select("request_id").in("request_id", requestIds)
        : Promise.resolve({ data: [] }),
      userIds.length
        ? supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds)
        : Promise.resolve({ data: [] }),
    ]);

  const solutionCounts: Record<string, number> = {};
  for (const row of solutions ?? []) {
    solutionCounts[row.request_id] = (solutionCounts[row.request_id] ?? 0) + 1;
  }
  const commentCounts: Record<string, number> = {};
  for (const row of comments ?? []) {
    commentCounts[row.request_id] = (commentCounts[row.request_id] ?? 0) + 1;
  }
  const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
  for (const profile of profiles ?? []) {
    profileMap[profile.id] = {
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    };
  }

  return requests.map((request) => ({
    ...request,
    answer_count: solutionCounts[request.id as string] ?? 0,
    comment_count: commentCounts[request.id as string] ?? 0,
    author: request.user_id ? profileMap[request.user_id as string] ?? null : null,
  })) as Array<{
    id: string;
    slug: string;
    title: string;
    category: string | null;
    status: string;
    description: string | null;
    desired_outcome: string | null;
    usage_frequency: string | null;
    privacy_level: string | null;
    created_at: string;
    updated_at: string;
    answer_count: number;
    comment_count: number;
    author: { display_name: string | null; avatar_url: string | null } | null;
  }>;
}

async function enrichApps(supabase: ReturnType<typeof createServerClient>, apps: Record<string, unknown>[]) {
  const { data: allRatings } = await supabase
    .from("ratings")
    .select("app_id, usability, design, idea");

  const ratingsByApp: Record<string, { sum: number; count: number }> = {};
  for (const rating of allRatings ?? []) {
    if (!ratingsByApp[rating.app_id]) {
      ratingsByApp[rating.app_id] = { sum: 0, count: 0 };
    }
    ratingsByApp[rating.app_id].sum += rating.usability + rating.design + rating.idea;
    ratingsByApp[rating.app_id].count += 1;
  }

  const userIds = [...new Set(apps.map((app) => app.user_id as string | null).filter(Boolean))];
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds)
    : { data: [] };
  const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
  for (const profile of profiles ?? []) {
    profileMap[profile.id] = { display_name: profile.display_name, avatar_url: profile.avatar_url };
  }

  return apps.map((app) => {
    const rd = ratingsByApp[app.id as string];
    const profile = app.user_id ? profileMap[app.user_id as string] : null;
    const comments = app.comments as Array<{ count: number }> | undefined;
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

function EmptyRequest({ text, href }: { text: string; href: string }) {
  return (
    <div className="text-center py-10 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
      <p className="text-[#606060] mb-4">{text}</p>
      <Link
        href={href}
        className="inline-block px-5 py-2 rounded-lg bg-[#1B4F72] text-white font-semibold text-sm hover:bg-[#15415F] transition-colors"
      >
        見に行く
      </Link>
    </div>
  );
}
