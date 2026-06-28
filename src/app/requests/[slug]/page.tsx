import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { createAuthServerClient } from "@/lib/supabase-server";
import PrivacyLevelBadge from "@/app/components/PrivacyLevelBadge";
import RequestCommentForm from "@/app/components/RequestCommentForm";
import RequestCommentList from "@/app/components/RequestCommentList";
import RequestOwnerActions from "@/app/components/RequestOwnerActions";
import RequestStatusBadge from "@/app/components/RequestStatusBadge";
import ReportButton from "@/app/components/ReportButton";
import SolutionCard from "@/app/components/SolutionCard";
import SolutionForm from "@/app/components/SolutionForm";
import { formatDate } from "@/lib/utils";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata, truncateDescription } from "@/lib/seo";

export const revalidate = 10;

interface RequestDetailProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: RequestDetailProps) {
  const { slug } = await params;
  const db = createServerClient();
  const { data: request } = await db
    .from("requests")
    .select("title, description, desired_outcome, status, is_public, updated_at, created_at")
    .eq("slug", slug)
    .single();

  if (!request) return { title: "困りごとが見つかりません | APLZ" };
  const description = truncateDescription(
    request.desired_outcome || request.description,
    `${request.title}について、小さなWebアプリで解決するための困りごと投稿です。`
  );
  return pageMetadata({
    title: `${request.title} | APLZ`,
    description,
    path: `/requests/${slug}`,
    type: "article",
    noIndex: !request.is_public || request.status === "hidden",
    publishedTime: request.created_at,
    modifiedTime: request.updated_at,
    keywords: ["困りごと", "小さな業務アプリ", request.title],
  });
}

export default async function RequestDetailPage({ params, searchParams }: RequestDetailProps) {
  const { slug } = await params;
  const query = await searchParams;
  const db = createServerClient();
  const { data: request } = await db
    .from("requests")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!request || request.status === "hidden" || !request.is_public) notFound();

  const authClient = await createAuthServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  const isOwner = Boolean(user && request.user_id === user.id);

  const [{ data: author }, { data: comments }, { data: solutions }] =
    await Promise.all([
      request.user_id
        ? db
            .from("profiles")
            .select("id, display_name, avatar_url, bio, developer_enabled, skill_categories")
            .eq("id", request.user_id)
            .single()
        : Promise.resolve({ data: null }),
      db
        .from("request_comments")
        .select("*")
        .eq("request_id", request.id)
        .order("created_at", { ascending: true }),
      db
        .from("solutions")
        .select("*")
        .eq("request_id", request.id)
        .order("is_accepted", { ascending: false })
        .order("updated_at", { ascending: false }),
    ]);

  const commentUserIds = [
    ...new Set((comments ?? []).map((comment) => comment.user_id).filter(Boolean)),
  ];
  const solutionUserIds = [
    ...new Set((solutions ?? []).map((solution) => solution.user_id).filter(Boolean)),
  ];
  const solutionIds = (solutions ?? []).map((solution) => solution.id);

  const [{ data: commentProfiles }, { data: solutionProfiles }, { data: feedback }] =
    await Promise.all([
      commentUserIds.length
        ? db.from("profiles").select("id, display_name, avatar_url").in("id", commentUserIds)
        : Promise.resolve({ data: [] }),
      solutionUserIds.length
        ? db.from("profiles").select("id, display_name, avatar_url").in("id", solutionUserIds)
        : Promise.resolve({ data: [] }),
      solutionIds.length
        ? db
            .from("solution_feedback")
            .select("solution_id, feedback_type")
            .in("solution_id", solutionIds)
        : Promise.resolve({ data: [] }),
    ]);

  const commentProfileMap = makeProfileMap(commentProfiles ?? []);
  const solutionProfileMap = makeProfileMap(solutionProfiles ?? []);
  const feedbackMap: Record<string, Record<string, number>> = {};
  for (const row of feedback ?? []) {
    feedbackMap[row.solution_id] ??= {};
    feedbackMap[row.solution_id][row.feedback_type] =
      (feedbackMap[row.solution_id][row.feedback_type] ?? 0) + 1;
  }

  const enrichedComments = (comments ?? []).map((comment) => ({
    ...comment,
    author: comment.user_id ? commentProfileMap[comment.user_id] ?? null : null,
  }));
  const enrichedSolutions = (solutions ?? []).map((solution) => ({
    ...solution,
    author: solution.user_id ? solutionProfileMap[solution.user_id] ?? null : null,
    feedback_counts: feedbackMap[solution.id] ?? {},
  }));
  const requestUrl = absoluteUrl(`/requests/${request.slug}`);
  const backHref = buildBackHref(query);
  const requestSummary = request.desired_outcome || request.description || request.pain_point || "詳しい条件は投稿本文とコメントで確認してください。";
  const developmentEstimate = estimateDevelopment(request);
  const discussionComments = [
    ...enrichedComments.map((comment) => ({
      "@type": "Comment",
      text: comment.body,
      datePublished: comment.created_at,
      url: `${requestUrl}#comments`,
      author: {
        "@type": "Person",
        name: comment.author?.display_name || "匿名ユーザー",
      },
    })),
    ...enrichedSolutions.map((solution) => ({
      "@type": "Comment",
      text: [solution.title, solution.description].filter(Boolean).join("\n\n"),
      datePublished: solution.created_at,
      dateModified: solution.updated_at,
      url: solution.app_slug ? absoluteUrl(`/apps/${solution.app_slug}`) : solution.app_url || requestUrl,
      author: {
        "@type": "Person",
        name: solution.author?.display_name || "APLZユーザー",
      },
    })),
  ];
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "APLZ", path: "/" },
      { name: "困りごと", path: "/requests" },
      { name: request.title, path: `/requests/${request.slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "DiscussionForumPosting",
      headline: request.title,
      text: [
        request.description,
        request.current_workflow,
        request.pain_point,
        request.desired_outcome,
      ]
        .filter(Boolean)
        .join("\n\n"),
      url: requestUrl,
      datePublished: request.created_at,
      dateModified: request.updated_at,
      author: {
        "@type": "Person",
        name: author?.display_name || "匿名ユーザー",
      },
      discussionUrl: requestUrl,
      keywords: [request.category, request.usage_frequency, request.privacy_level].filter(Boolean),
      commentCount: discussionComments.length,
      ...(discussionComments.length ? { comment: discussionComments } : {}),
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/CommentAction",
          userInteractionCount: enrichedComments.length,
        },
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/ReplyAction",
          userInteractionCount: enrichedSolutions.length,
        },
      ],
    },
  ];

  return (
    <main className="max-w-[1800px] mx-auto px-4 py-8">
      <JsonLd data={jsonLd} />
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="mb-4">
            <Link href={backHref} className="text-sm text-[#606060] hover:underline">
              ← 困りごと一覧へ
            </Link>
          </div>

          <section className="bg-white border border-[#e5e5e5] rounded-lg p-5 animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <RequestStatusBadge status={request.status} />
                  <PrivacyLevelBadge level={request.privacy_level} />
                  {request.category && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[#f5f5f5] text-[#606060]">
                      {request.category}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-[#0f0f0f]">{request.title}</h1>
                <p className="text-sm text-[#909090] mt-2">
                  投稿者: {author?.display_name || "匿名ユーザー"} ・ {formatDate(request.created_at)}
                  {request.updated_at && ` ・ ${formatDate(request.updated_at)}に更新`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href="#solution-form"
                  className="hidden sm:inline-flex rounded-lg bg-[#1B4F72] px-4 py-2 text-sm font-semibold text-white hover:bg-[#15415F]"
                >
                  この困りごとを作ってみる
                </a>
                <ReportButton targetType="request" targetId={request.id} />
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-[#d8e2e8] bg-[#f7fbfd] p-4">
              <p className="text-xs font-semibold text-[#1B4F72]">課題の要約</p>
              <p className="mt-2 text-base leading-8 text-[#0f0f0f]">{requestSummary}</p>
            </div>

            {request.privacy_level === "high" && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
                高リスクの個人情報を扱う可能性があります。具体的な個人情報をコメントや外部アプリへ入力する前に、扱うデータと保存有無を確認してください。
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 mt-5">
              <InfoBlock label="困りごとの詳細" value={request.description} wide />
              <InfoBlock label="今のやり方" value={request.current_workflow} />
              <InfoBlock label="面倒な点" value={request.pain_point} />
              <InfoBlock label="理想状態" value={request.desired_outcome} />
              <InfoBlock label="誰が困っているか" value={request.target_user_type} />
              <InfoBlock label="使う頻度" value={request.usage_frequency} />
              <InfoBlock label="必須条件" value={request.output_data} />
              <InfoBlock label="できれば欲しい条件" value={request.input_data} />
              <InfoBlock label="期限" value={request.deadline} />
              <InfoBlock label="想定端末" value="スマートフォンとPCのブラウザ" />
              <InfoBlock label="想定開発期間" value={developmentEstimate.period} />
              <InfoBlock label="想定作業量" value={developmentEstimate.effort} />
              <InfoBlock label="報酬条件" value="未設定の場合は、無償・有償・相談可能をコメントで確認してください。" />
              <InfoBlock label="公開範囲" value={request.is_public ? "公開ページとして表示" : "非公開"} />
              <InfoBlock label="著作権・再利用条件" value="投稿本文の再利用や完成アプリの再利用条件は、投稿者と制作者の合意を優先します。" />
              <InfoBlock label="投稿者の返信目安" value="コメント後、数日以内の返信を目安にしてください。急ぎの場合は期限も確認してください。" />
              <InfoBlock label="外部サービス連携" value="必要な場合はコメントで確認してください。個人情報や外部通信が増える場合は明記が必要です。" />
              {request.reference_url && (
                <div className="md:col-span-2 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg p-3">
                  <p className="text-xs text-[#909090] mb-1">参考URL</p>
                  <a
                    href={request.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#1B4F72] underline break-all"
                  >
                    {request.reference_url}
                  </a>
                </div>
              )}
            </div>
          </section>

          <section id="solutions" className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#0f0f0f]">
                アプリ回答
              </h2>
              <a
                href="#solution-form"
                className="px-3 py-1.5 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] transition-colors"
              >
                この困りごとを作ってみる
              </a>
            </div>
            {enrichedSolutions.length === 0 ? (
              <div className="text-center py-10 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg">
                <p className="text-sm text-[#606060]">まだアプリ回答はありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {enrichedSolutions.map((solution) => (
                  <SolutionCard
                    key={solution.id}
                    solution={solution}
                    canAccept={isOwner}
                  />
                ))}
              </div>
            )}
          </section>

          <section id="solution-form" className="mt-6">
            <h2 className="text-sm font-semibold text-[#0f0f0f] mb-3">
              この困りごとを作ってみる
            </h2>
            <SolutionForm requestSlug={request.slug} />
          </section>

          <section id="comments" className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#0f0f0f]">
                質問・やりとり
              </h2>
              <a href="#comment-form" className="text-sm text-[#1B4F72] hover:underline">
                ひとこと送る
              </a>
            </div>
            <RequestCommentList
              comments={enrichedComments}
              requestOwnerId={request.user_id}
              currentUserId={user?.id ?? null}
            />
            <p className="mt-3 rounded-lg bg-[#f8f8f8] p-3 text-sm leading-6 text-[#606060]">
              開発者は、入力データ、出力結果、必須条件、個人情報の扱いを短く質問してください。投稿者は分かる範囲で返答すれば十分です。
            </p>
            <div id="comment-form" className="mt-4">
              <RequestCommentForm requestSlug={request.slug} />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          {isOwner && (
            <RequestOwnerActions requestSlug={request.slug} currentStatus={request.status} />
          )}
          <div className="bg-white border border-[#e5e5e5] rounded-lg p-4">
            <h2 className="text-sm font-semibold text-[#0f0f0f] mb-3">
              開発者向け
            </h2>
            <div className="space-y-2">
              <Link
                href={`/publish?request=${request.slug}`}
                className="block text-center px-4 py-2 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] transition-colors"
              >
                ファイルをアップロードして回答
              </Link>
            </div>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-lg p-4">
            <h2 className="text-sm font-semibold text-[#0f0f0f] mb-2">
              安全メモ
            </h2>
            <p className="text-sm text-[#606060]">
              個人情報や支払い情報を扱う場合は、入力前にデータ保存・外部通信・作者情報を確認してください。
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function buildBackHref(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const key of ["q", "filter", "category", "privacy", "sort"] as const) {
    const value = searchParams[key];
    if (Array.isArray(value)) {
      if (value[0]) params.set(key, value[0]);
    } else if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `/requests?${query}` : "/requests";
}

function InfoBlock({
  label,
  value,
  wide,
}: {
  label: string;
  value: string | null;
  wide?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={`${wide ? "md:col-span-2" : ""} bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg p-3`}>
      <p className="text-xs text-[#909090] mb-1">{label}</p>
      <p className="text-sm text-[#0f0f0f] whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function makeProfileMap(
  profiles: Array<{ id: string; display_name: string | null; avatar_url: string | null }>
) {
  const map: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
  for (const profile of profiles) {
    map[profile.id] = {
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    };
  }
  return map;
}

function estimateDevelopment(request: {
  input_data?: string | null;
  output_data?: string | null;
  reference_url?: string | null;
  privacy_level?: string | null;
}) {
  const complexity =
    (request.input_data ? 1 : 0) +
    (request.output_data ? 1 : 0) +
    (request.reference_url ? 1 : 0) +
    (request.privacy_level === "medium" || request.privacy_level === "high" ? 2 : 0);
  if (complexity >= 4) return { period: "1〜3週間程度", effort: "中規模。要件確認と安全確認が必要" };
  if (complexity >= 2) return { period: "数日〜2週間程度", effort: "小〜中規模。1〜3画面程度から開始" };
  return { period: "数日程度", effort: "小規模。1画面の試作から開始" };
}
