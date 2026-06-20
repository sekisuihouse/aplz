import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Layers3,
  MessageCircle,
  PenLine,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import { createServerClient } from "@/lib/supabase";
import { REQUEST_CATEGORIES } from "@/lib/request-platform";
import { JsonLd, absoluteUrl, pageMetadata } from "@/lib/seo";
import { getUseCaseByCategory } from "@/lib/use-cases";
import AppCard from "./components/AppCard";
import RequestCard from "./components/RequestCard";

export const revalidate = 30;

export const metadata = pageMetadata({
  title: "APLZ — 小さな困りごとを小さなアプリで解決",
  description:
    "町内会・学校・個人事業主・イベント運営などの小さな困りごとを投稿し、開発者が小さなWebアプリで解決するプラットフォームです。",
  path: "/",
  keywords: ["小さな業務アプリ", "困りごと 解決", "業務改善", "当番表 アプリ", "集計 アプリ"],
});

const FLOW_STEPS = [
  {
    title: "一言で書く",
    text: "仕様ではなく、困っている作業からで大丈夫です。",
    icon: PenLine,
  },
  {
    title: "質問で補う",
    text: "足りない条件は開発者が短く聞けます。",
    icon: MessageCircle,
  },
  {
    title: "小さく試す",
    text: "回答アプリを開いて、使えそうか確認します。",
    icon: Sparkles,
  },
];

export default async function Home() {
  const supabase = createServerClient();
  const [
    { data: apps },
    { data: newRequests },
    { data: solvedRequests },
    { count: requestCount },
    { count: openRequestCount },
    { count: answeredRequestCount },
    { count: appCount },
  ] =
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
      supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .eq("is_public", true)
        .neq("status", "hidden"),
      supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .eq("is_public", true)
        .in("status", ["open", "questions", "in_progress"]),
      supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .eq("is_public", true)
        .in("status", ["answered", "testing", "solved"]),
      supabase
        .from("apps")
        .select("*", { count: "exact", head: true })
        .eq("is_public", true),
    ]);

  const [requestList, solvedRequestList, appList] = await Promise.all([
    enrichRequests(supabase, newRequests ?? []),
    enrichRequests(supabase, solvedRequests ?? []),
    enrichApps(supabase, apps ?? []),
  ]);

  const r2PublicUrl = process.env.R2_PUBLIC_URL;
  const metrics = [
    {
      label: "公開中の困りごと",
      value: requestCount ?? 0,
      icon: Layers3,
      href: "/requests",
    },
    {
      label: "募集中",
      value: openRequestCount ?? 0,
      icon: Clock3,
      href: "/requests?filter=unsolved",
    },
    {
      label: "回答あり",
      value: answeredRequestCount ?? 0,
      icon: CheckCircle2,
      href: "/requests?filter=answered",
    },
    {
      label: "公開アプリ",
      value: appCount ?? 0,
      icon: Wrench,
      href: "/#apps",
    },
  ];

  return (
    <main>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "APLZ",
            url: absoluteUrl("/"),
            logo: absoluteUrl("/icon-512.png"),
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "APLZ",
            url: absoluteUrl("/"),
            potentialAction: {
              "@type": "SearchAction",
              target: `${absoluteUrl("/requests")}?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />
      <section className="px-4 pt-10 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-[#f8f8f8] px-3 py-1 text-xs font-medium text-[#606060] mb-4">
                <span className="h-2 w-2 rounded-full bg-[#1B4F72]" />
                3分で書き始める
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-[#0f0f0f]">
                小さな困りごとを、
                <br className="hidden sm:block" />
                小さなアプリで解決。
              </h1>
              <p className="max-w-2xl text-sm md:text-base text-[#606060] leading-relaxed mt-4">
                APLZは、町内会・学校・個人事業主・イベント運営などの「外注するほどではないけど毎回めんどう」な作業を、投稿して小さなアプリで解決する場所です。
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <Link
                  href="/requests/new"
                  className="inline-flex min-h-12 items-center justify-center px-6 rounded-lg bg-[#1B4F72] text-white font-semibold text-sm hover:bg-[#15415F] transition-colors"
                >
                  困りごとを書く
                </Link>
                <Link
                  href="/requests?filter=unsolved"
                  className="inline-flex min-h-12 items-center justify-center px-5 rounded-lg border border-[#d8d8d8] text-[#0f0f0f] font-semibold text-sm hover:bg-[#f5f5f5] transition-colors"
                >
                  未解決を見る
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
              <p className="text-sm font-semibold text-[#0f0f0f] mb-3">
                迷ったら、この順で進めます
              </p>
              <div className="space-y-3">
                {FLOW_STEPS.map((step, index) => (
                  <div key={step.title} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#1B4F72]">
                      <step.icon size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0f0f0f]">
                        {index + 1}. {step.title}
                      </p>
                      <p className="text-xs text-[#606060] leading-relaxed mt-0.5">
                        {step.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((metric) => (
            <MetricTile key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-8">
        <form action="/requests" className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#909090]" />
          <input
            name="q"
            placeholder="当番表、集計、予約、連絡文などで検索"
            className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#1B4F72]"
          />
        </form>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#0f0f0f]">カテゴリから探す</h2>
            <p className="text-sm text-[#606060] mt-1">
              身近な作業単位で、解決できそうな困りごとを見つけられます。
            </p>
          </div>
          <Link href="/requests" className="inline-flex items-center gap-1 text-sm text-[#1B4F72] hover:underline">
            すべてのカテゴリ
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {REQUEST_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/use-cases/${getUseCaseByCategory(category)?.slug ?? "other"}`}
              className="px-3 py-1.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#606060] hover:border-[#1B4F72] hover:text-[#1B4F72] transition-colors"
            >
              {category}
            </Link>
          ))}
        </div>
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

      <section id="apps" className="max-w-[1800px] mx-auto px-4 pb-12">
        <h2 className="text-sm font-medium text-[#909090] mb-4">
          公開されたアプリ
        </h2>
        <div className="flex justify-end -mt-8 mb-4">
          <Link href="/apps" className="text-sm text-[#1B4F72] hover:underline">
            アプリ一覧を見る
          </Link>
        </div>

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
              href="/requests"
              className="px-4 py-2 rounded-lg border border-[#e5e5e5] bg-white text-[#606060] text-sm font-medium hover:shadow-md transition-all"
            >
              困りごと一覧を見る
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ size?: number; className?: string }>;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-[#e5e5e5] bg-white px-4 py-3 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-bold text-[#0f0f0f] leading-none">{value}</p>
          <p className="text-xs text-[#606060] mt-1.5">{label}</p>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#1B4F72] group-hover:bg-[#1B4F72] group-hover:text-white transition-colors">
          <Icon size={18} />
        </span>
      </div>
    </Link>
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
    deadline: string | null;
    is_beginner_friendly: boolean;
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
