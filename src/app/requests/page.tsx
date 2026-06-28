import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { createServerClient } from "@/lib/supabase";
import RequestCard from "@/app/components/RequestCard";
import PrivacyLevelBadge from "@/app/components/PrivacyLevelBadge";
import RequestStatusBadge from "@/app/components/RequestStatusBadge";
import { REQUEST_CATEGORIES } from "@/lib/request-platform";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 20;

export const metadata = pageMetadata({
  title: "困りごと一覧 — 投稿を比較して、その場で詳細を読む | APLZ",
  description:
    "当番表、集計、予約、連絡文、イベント運営など、小さな困りごとを比較しながら探せる一覧です。検索、絞り込み、並び替え、詳細プレビューに対応しています。",
  path: "/requests",
  keywords: ["困りごと 投稿", "一覧", "検索", "絞り込み", "並び替え", "APLZ"],
});

interface RequestsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type RequestRow = {
  id: string;
  slug: string;
  user_id: string | null;
  title: string;
  category: string | null;
  target_user_type: string | null;
  current_workflow: string | null;
  pain_point: string | null;
  desired_outcome: string | null;
  usage_frequency: string | null;
  input_data: string | null;
  output_data: string | null;
  privacy_level: string | null;
  deadline: string | null;
  reference_url: string | null;
  description: string | null;
  status: string;
  is_public: boolean;
  is_beginner_friendly: boolean;
  created_at: string;
  updated_at: string;
  answer_count: number;
  comment_count: number;
  completed_app_title: string | null;
  completed_app_href: string | null;
  author: { display_name: string | null; avatar_url: string | null } | null;
};

const SORT_LABELS: Record<string, string> = {
  updated_desc: "更新が新しい",
  deadline_asc: "期限が近い",
  answers_desc: "回答が多い",
  comments_desc: "やりとりが多い",
  newest_desc: "新着",
};

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const params = await searchParams;
  const q = getParam(params.q);
  const filter = getParam(params.filter);
  const category = getParam(params.category);
  const privacy = getParam(params.privacy);
  const sort = getParam(params.sort) || "updated_desc";
  const selected = getParam(params.selected);
  const hasActiveFilters = Boolean(q || filter || category || privacy || sort !== "updated_desc");
  const hasAdvancedFilters = Boolean(filter || category || privacy || sort !== "updated_desc");

  const db = createServerClient();
  let query = db
    .from("requests")
    .select("*")
    .eq("is_public", true)
    .neq("status", "hidden");

  if (category) query = query.eq("category", category);
  if (privacy) query = query.eq("privacy_level", privacy);
  if (filter === "unsolved") {
    query = query.not("status", "in", "(solved,hidden)");
  } else if (filter === "answered") {
    query = query.in("status", ["answered", "testing", "solved"]);
  } else if (filter === "solved") {
    query = query.eq("status", "solved");
  } else if (filter === "beginner") {
    query = query.eq("is_beginner_friendly", true);
  } else if (filter === "privacy_none") {
    query = query.eq("privacy_level", "none");
  }
  if (q) {
    const term = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    query = query.or(
      `title.ilike.${term},description.ilike.${term},category.ilike.${term},desired_outcome.ilike.${term},pain_point.ilike.${term}`
    );
  }

  const { data: requests } = await query.order("updated_at", { ascending: false }).limit(80);

  const requestIds = (requests ?? []).map((request) => request.id);
  const userIds = [...new Set((requests ?? []).map((request) => request.user_id).filter(Boolean))];

  const [{ data: solutions }, { data: comments }, { data: profiles }] = await Promise.all([
    requestIds.length
      ? db
          .from("solutions")
          .select("request_id, title, app_slug, app_url, is_accepted, updated_at")
          .in("request_id", requestIds)
      : Promise.resolve({ data: [] }),
    requestIds.length
      ? db.from("request_comments").select("request_id").in("request_id", requestIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? db.from("profiles").select("id, display_name, avatar_url").in("id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const solutionCounts: Record<string, number> = {};
  const completedAppByRequest: Record<string, { title: string; href: string | null; accepted: boolean }> = {};
  for (const row of solutions ?? []) {
    solutionCounts[row.request_id] = (solutionCounts[row.request_id] ?? 0) + 1;
    const href = row.app_slug ? `/apps/${row.app_slug}` : row.app_url || null;
    if (href && (row.is_accepted || !completedAppByRequest[row.request_id])) {
      completedAppByRequest[row.request_id] = {
        title: row.title,
        href,
        accepted: Boolean(row.is_accepted),
      };
    }
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

  const list: RequestRow[] = (requests ?? []).map((request) => ({
    ...request,
    answer_count: solutionCounts[request.id] ?? 0,
    comment_count: commentCounts[request.id] ?? 0,
    completed_app_title: completedAppByRequest[request.id]?.title ?? null,
    completed_app_href: completedAppByRequest[request.id]?.href ?? null,
    author: request.user_id ? profileMap[request.user_id] ?? null : null,
  }));

  const sortedList = sortRequests(list, sort);
  const selectedRequest =
    sortedList.find((request) => request.slug === selected) ?? sortedList[0] ?? null;

  return (
    <main className="max-w-[1800px] mx-auto px-4 py-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "APLZ", path: "/" },
            { name: "困りごと", path: "/requests" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "APLZの困りごと一覧",
            description:
              "小さな業務アプリで解決できる困りごとを、検索、絞り込み、並び替え、比較しながら探せる一覧です。",
            url: absoluteUrl("/requests"),
          },
        ]}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <p className="text-sm font-semibold text-[#1B4F72] mb-2">Requests</p>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0f0f0f]">困りごと一覧</h1>
          <p className="text-sm text-[#606060] mt-1 max-w-2xl">
            いま作ってほしい困りごとと、完成したアプリにつながった投稿を見られます。
          </p>
        </div>
        <Link
          href="/requests/new"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#1B4F72] text-white text-sm font-semibold hover:bg-[#15415F] transition-colors"
        >
          困りごとを投稿
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <QuickFilter href={buildRequestsHref(params, { filter: "", selected: "" })} active={!filter && !category && !privacy && sort === "updated_desc"}>
          すべて
        </QuickFilter>
        <QuickFilter
          href={buildRequestsHref(params, { filter: "unsolved", selected: "" })}
          active={filter === "unsolved"}
        >
          募集中
        </QuickFilter>
        <QuickFilter
          href={buildRequestsHref(params, { filter: "solved", selected: "" })}
          active={filter === "solved"}
        >
          アプリ完成
        </QuickFilter>
      </div>

      <form className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-5">
        <input type="hidden" name="selected" value={selected} />
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px_240px]">
          <label className="relative block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#909090]" />
            <input
              name="q"
              defaultValue={q}
            placeholder="例: 当番表、集計、予約、連絡文"
              className="w-full bg-[#fafafa] border border-[#e5e5e5] rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#1B4F72]"
            />
          </label>
          <label className="block">
            <span className="sr-only">並び替え</span>
            <select name="sort" defaultValue={sort} className="input w-full">
              <option value="updated_desc">更新が新しい</option>
              <option value="deadline_asc">期限が近い</option>
              <option value="answers_desc">回答が多い</option>
              <option value="comments_desc">やりとりが多い</option>
              <option value="newest_desc">新着</option>
            </select>
          </label>
          <div className="flex gap-2">
            <button className="min-h-11 flex-1 px-5 py-2.5 rounded-xl bg-[#1B4F72] text-white text-sm font-semibold hover:bg-[#15415F] transition-colors">
              検索
            </button>
            {hasActiveFilters && (
              <Link
                href="/requests"
                className="min-h-11 inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-[#e5e5e5] text-sm text-[#606060] hover:bg-[#f5f5f5] transition-colors"
              >
                クリア
              </Link>
            )}
          </div>
        </div>

        <details className="mt-4 group" open={hasAdvancedFilters}>
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm text-[#1B4F72] hover:underline">
            <SlidersHorizontal size={15} />
            さらに絞り込む
            {hasAdvancedFilters && (
              <span className="rounded-full bg-[#1B4F72]/10 px-2 py-0.5 text-xs text-[#1B4F72]">
                適用中
              </span>
            )}
          </summary>
          <div className="grid gap-3 mt-3 pt-3 border-t border-[#e5e5e5] md:grid-cols-3">
            <select name="category" defaultValue={category} className="input min-w-36">
              <option value="">すべてのカテゴリ</option>
              {REQUEST_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select name="privacy" defaultValue={privacy} className="input min-w-36">
              <option value="">安全レベル</option>
              <option value="none">個人情報なし</option>
              <option value="low">名前程度</option>
              <option value="medium">連絡先など</option>
              <option value="high">高リスク</option>
              <option value="unknown">不明</option>
            </select>
            <select name="filter" defaultValue={filter} className="input min-w-36">
              <option value="">状態を指定しない</option>
              <option value="unsolved">募集中</option>
              <option value="answered">回答あり</option>
              <option value="solved">アプリ完成</option>
              <option value="beginner">初心者向け</option>
              <option value="privacy_none">個人情報なし</option>
            </select>
          </div>
        </details>
      </form>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <p className="text-sm text-[#606060]">
          {sortedList.length}件の困りごとを表示中
          {sort && SORT_LABELS[sort] ? ` ・ ${SORT_LABELS[sort]}` : ""}
        </p>
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 text-xs text-[#606060]">
            {q && <ParamChip label={`検索: ${q}`} />}
            {filter && <ParamChip label={`状態: ${filter}`} />}
            {category && <ParamChip label={`カテゴリ: ${category}`} />}
            {privacy && <ParamChip label={`安全: ${privacy}`} />}
          </div>
        )}
      </div>

      {sortedList.length === 0 ? (
        <div className="text-center py-16 bg-[#fbfbfb] border border-[#e5e5e5] rounded-xl">
          <p className="text-[#606060] mb-4">条件に合う困りごとはありません</p>
          <Link
            href="/requests/new"
            className="inline-block px-5 py-2 rounded-lg bg-[#1B4F72] text-white font-semibold text-sm hover:bg-[#15415F] transition-colors"
          >
            最初の困りごとを投稿する
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <section aria-label="困りごと一覧" className="min-w-0">
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-2">
              {sortedList.map((request) => {
                const itemHref = buildRequestsHref(params, {
                  selected: request.slug,
                });
                return (
                  <RequestCard
                    key={request.id}
                    request={request}
                    href={itemHref}
                    selected={selectedRequest?.slug === request.slug}
                  />
                );
              })}
            </div>
          </section>

          <aside className="min-w-0">
            {selectedRequest ? (
              <RequestPreview request={selectedRequest} currentQuery={params} />
            ) : (
              <div className="sticky top-24 rounded-xl border border-[#e5e5e5] bg-white p-5">
                <p className="text-sm font-semibold text-[#0f0f0f]">詳細プレビュー</p>
                <p className="mt-2 text-sm text-[#606060] leading-7">
                  一覧から項目を選ぶと、ここに状態、期限、回答数、安全レベル、本文の要点が出ます。
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function buildRequestsHref(
  params: Record<string, string | string[] | undefined>,
  updates: Record<string, string>
) {
  const next = new URLSearchParams();
  const keys = ["q", "filter", "category", "privacy", "sort", "selected"] as const;
  for (const key of keys) {
    const current = getParam(params[key]);
    if (current) next.set(key, current);
  }
  for (const [key, value] of Object.entries(updates)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  const query = next.toString();
  return query ? `/requests?${query}` : "/requests";
}

function sortRequests(list: RequestRow[], sort: string): RequestRow[] {
  const copy = [...list];
  const deadlineValue = (value: string | null) => {
    if (!value) return Number.POSITIVE_INFINITY;
    const parsed = new Date(`${value}T00:00:00`).getTime();
    return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
  };
  const updatedValue = (value: string) => new Date(value).getTime();

  switch (sort) {
    case "deadline_asc":
      return copy.sort((a, b) => deadlineValue(a.deadline) - deadlineValue(b.deadline));
    case "answers_desc":
      return copy.sort((a, b) => b.answer_count - a.answer_count || updatedValue(b.updated_at) - updatedValue(a.updated_at));
    case "comments_desc":
      return copy.sort((a, b) => b.comment_count - a.comment_count || updatedValue(b.updated_at) - updatedValue(a.updated_at));
    case "newest_desc":
      return copy.sort((a, b) => updatedValue(b.created_at) - updatedValue(a.created_at));
    case "updated_desc":
    default:
      return copy.sort((a, b) => updatedValue(b.updated_at) - updatedValue(a.updated_at));
  }
}

function RequestPreview({
  request,
  currentQuery,
}: {
  request: RequestRow;
  currentQuery: Record<string, string | string[] | undefined>;
}) {
  const previewQuery = new URLSearchParams(buildRequestsHref(currentQuery, { selected: request.slug }).split("?")[1] ?? "");
  previewQuery.delete("selected");
  const detailHref = `/requests/${request.slug}${previewQuery.toString() ? `?${previewQuery.toString()}` : ""}`;
  const deadline = formatDeadline(request.deadline);

  return (
    <div className="sticky top-24 rounded-2xl border border-[#e5e5e5] bg-white shadow-sm overflow-hidden">
      <div className="border-b border-[#e5e5e5] bg-[#fbfbfb] px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <RequestStatusBadge status={request.status} />
          <PrivacyLevelBadge level={request.privacy_level} />
          {request.category && (
            <span className="text-xs text-[#404040] bg-[#f5f5f5] px-2 py-0.5 rounded-md">
              {request.category}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-[#0f0f0f] leading-tight">{request.title}</h2>
        <p className="text-sm text-[#606060] leading-7 mt-2">
          {request.desired_outcome || request.description || "詳しい内容を見る"}
        </p>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="回答" value={`${request.answer_count}件`} />
          <Stat label="やりとり" value={`${request.comment_count}件`} />
          <Stat label="期限" value={deadline || "未設定"} />
          <Stat label="頻度" value={request.usage_frequency || "未設定"} />
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-[#fbfbfb] p-4 space-y-3">
          <InlineField label="投稿者" value={request.author?.display_name || "匿名ユーザー"} />
          <InlineField label="今のやり方" value={request.current_workflow} />
          <InlineField label="面倒な点" value={request.pain_point} />
          <InlineField label="入力データ" value={request.input_data} />
          <InlineField label="出力結果" value={request.output_data} />
        </div>

        {request.reference_url && (
          <div className="text-sm">
            <p className="text-xs text-[#909090] mb-1">参考URL</p>
            <a
              href={request.reference_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1B4F72] underline break-all"
            >
              {request.reference_url}
            </a>
          </div>
        )}

        <div className="grid gap-2 pt-1">
          <Link
            href={detailHref}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1B4F72] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15415F] transition-colors"
          >
            詳細ページを開く
            <ArrowRight size={14} />
          </Link>
          <Link
            href={`/requests/new?request=${request.slug}`}
            className="inline-flex items-center justify-center rounded-xl border border-[#e5e5e5] px-4 py-2.5 text-sm font-semibold text-[#404040] hover:bg-[#f5f5f5] transition-colors"
          >
            この条件で投稿する
          </Link>
        </div>

        <div className="rounded-xl bg-[#103a54] px-4 py-4 text-white">
          <p className="text-sm font-semibold mb-2">安全メモ</p>
          <p className="text-sm leading-7 text-white/80">
            個人情報や支払い情報を扱う場合は、入力前にデータ保存・外部通信・作者情報を確認してください。
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white px-3 py-2">
      <p className="text-[11px] text-[#909090]">{label}</p>
      <p className="text-sm font-semibold text-[#0f0f0f] mt-1">{value}</p>
    </div>
  );
}

function InlineField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-[#909090] mb-1">{label}</p>
      <p className="text-sm text-[#0f0f0f] leading-7 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function ParamChip({ label }: { label: string }) {
  return <span className="rounded-full bg-[#f5f5f5] px-3 py-1">{label}</span>;
}

function QuickFilter({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
        active
          ? "border-[#1B4F72] bg-[#1B4F72]/10 text-[#1B4F72]"
          : "border-[#e5e5e5] bg-white text-[#606060] hover:border-[#1B4F72] hover:text-[#1B4F72]"
      }`}
    >
      {children}
    </Link>
  );
}

function formatDeadline(deadline: string | null | undefined): string | null {
  if (!deadline) return null;
  const date = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getMonth() + 1}/${date.getDate()}期限`;
}
