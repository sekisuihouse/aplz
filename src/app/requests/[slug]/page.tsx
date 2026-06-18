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

export const revalidate = 10;

interface RequestDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RequestDetailProps) {
  const { slug } = await params;
  const db = createServerClient();
  const { data: request } = await db
    .from("requests")
    .select("title, description")
    .eq("slug", slug)
    .single();

  if (!request) return { title: "困りごとが見つかりません" };
  return {
    title: `${request.title} — APLZ`,
    description: request.description || request.title,
  };
}

export default async function RequestDetailPage({ params }: RequestDetailProps) {
  const { slug } = await params;
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

  return (
    <main className="max-w-[1800px] mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="mb-4">
            <Link href="/requests" className="text-sm text-[#606060] hover:underline">
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
              <ReportButton targetType="request" targetId={request.id} />
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
              <InfoBlock label="入力データ" value={request.input_data} />
              <InfoBlock label="出力結果" value={request.output_data} />
              <InfoBlock label="期限" value={request.deadline} />
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
              <div className="flex items-center gap-2">
                <Link
                  href={`/new?request=${request.slug}`}
                  className="px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-sm text-[#606060] hover:bg-[#f5f5f5] transition-colors"
                >
                  作ってみる
                </Link>
                <a
                  href="#solution-form"
                  className="px-3 py-1.5 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] transition-colors"
                >
                  アプリで回答する
                </a>
              </div>
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
              アプリで回答する
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
                href={`/new?request=${request.slug}`}
                className="block text-center px-4 py-2 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] transition-colors"
              >
                アプリを作る
              </Link>
              <Link
                href={`/publish?request=${request.slug}`}
                className="block text-center px-4 py-2 rounded-lg border border-[#e5e5e5] text-[#606060] text-sm font-medium hover:bg-[#f5f5f5] transition-colors"
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
