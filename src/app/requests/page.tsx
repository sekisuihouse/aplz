import Link from "next/link";
import type { ReactNode } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { createServerClient } from "@/lib/supabase";
import RequestCard from "@/app/components/RequestCard";
import { REQUEST_CATEGORIES } from "@/lib/request-platform";

export const revalidate = 20;

interface RequestsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const params = await searchParams;
  const q = getParam(params.q);
  const filter = getParam(params.filter);
  const category = getParam(params.category);
  const privacy = getParam(params.privacy);
  const hasActiveFilters = Boolean(q || filter || category || privacy);
  const hasAdvancedFilters = Boolean(filter || category || privacy);

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
      `title.ilike.${term},description.ilike.${term},category.ilike.${term},desired_outcome.ilike.${term}`
    );
  }

  const { data: requests } = await query
    .order("updated_at", { ascending: false })
    .limit(80);

  const requestIds = (requests ?? []).map((request) => request.id);
  const userIds = [...new Set((requests ?? []).map((request) => request.user_id).filter(Boolean))];

  const [{ data: solutions }, { data: comments }, { data: profiles }] =
    await Promise.all([
      requestIds.length
        ? db.from("solutions").select("request_id").in("request_id", requestIds)
        : Promise.resolve({ data: [] }),
      requestIds.length
        ? db.from("request_comments").select("request_id").in("request_id", requestIds)
        : Promise.resolve({ data: [] }),
      userIds.length
        ? db.from("profiles").select("id, display_name, avatar_url").in("id", userIds)
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

  const list = (requests ?? []).map((request) => ({
    ...request,
    answer_count: solutionCounts[request.id] ?? 0,
    comment_count: commentCounts[request.id] ?? 0,
    author: request.user_id ? profileMap[request.user_id] ?? null : null,
  }));

  return (
    <main className="max-w-[1800px] mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f0f0f]">困りごと</h1>
          <p className="text-sm text-[#606060] mt-1">
            小さな面倒を投稿して、誰かの小さなアプリで解決してもらう場所です。
          </p>
        </div>
        <Link
          href="/requests/new"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#1B4F72] text-white text-sm font-semibold hover:bg-[#15415F] transition-colors"
        >
          困りごとを投稿
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <QuickFilter href="/requests" active={!hasActiveFilters}>
          すべて
        </QuickFilter>
        <QuickFilter href="/requests?filter=unsolved" active={filter === "unsolved"}>
          未解決
        </QuickFilter>
        <QuickFilter href="/requests?filter=answered" active={filter === "answered"}>
          回答あり
        </QuickFilter>
        <QuickFilter href="/requests?filter=solved" active={filter === "solved"}>
          解決済み
        </QuickFilter>
        <QuickFilter href="/requests?filter=beginner" active={filter === "beginner"}>
          初心者向け
        </QuickFilter>
        <QuickFilter href="/requests?filter=privacy_none" active={filter === "privacy_none"}>
          個人情報なし
        </QuickFilter>
      </div>

      <form className="bg-white border border-[#e5e5e5] rounded-lg p-4 mb-5">
        <div className="grid md:grid-cols-[1fr_auto] gap-3">
          <label className="relative block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#909090]" />
            <input
              name="q"
              defaultValue={q}
              placeholder="例: 当番表、集計、予約、連絡文"
              className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F72]"
            />
          </label>
          <button className="min-h-10 px-5 py-2.5 rounded-lg bg-[#1B4F72] text-white text-sm font-semibold hover:bg-[#15415F] transition-colors">
            検索
          </button>
        </div>

        <details className="mt-3 group" open={hasAdvancedFilters}>
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm text-[#1B4F72] hover:underline">
            <SlidersHorizontal size={15} />
            絞り込み
            {hasAdvancedFilters && (
              <span className="rounded-full bg-[#1B4F72]/10 px-2 py-0.5 text-xs text-[#1B4F72]">
                適用中
              </span>
            )}
          </summary>
          <div className="grid md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-[#e5e5e5]">
            <select name="filter" defaultValue={filter} className="input min-w-36">
              <option value="">新着順</option>
              <option value="unsolved">未解決</option>
              <option value="answered">回答あり</option>
              <option value="solved">解決済み</option>
              <option value="beginner">初心者向け</option>
              <option value="privacy_none">個人情報なし</option>
            </select>
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
          </div>
        </details>
      </form>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <p className="text-sm text-[#606060]">
          {list.length}件の困りごとを表示中
        </p>
        {hasActiveFilters && (
          <Link href="/requests" className="text-sm text-[#1B4F72] hover:underline">
            条件をクリア
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
          <p className="text-[#606060] mb-4">条件に合う困りごとはありません</p>
          <Link
            href="/requests/new"
            className="inline-block px-5 py-2 rounded-lg bg-[#1B4F72] text-white font-semibold text-sm hover:bg-[#15415F] transition-colors"
          >
            最初の困りごとを投稿する
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </main>
  );
}

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
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
