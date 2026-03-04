import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { createServerClient } from "@/lib/supabase";
import { createAuthServerClient } from "@/lib/supabase-server";
import { REACTION_EMOJIS, formatDate } from "@/lib/utils";
import ReactionBar from "./ReactionBar";
import RatingSection from "./RatingSection";
import CommentSection from "./CommentSection";

export const revalidate = 10;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data: app } = await supabase
    .from("apps")
    .select("name, description")
    .eq("slug", slug)
    .single();

  if (!app) return { title: "アプリが見つかりません" };

  return {
    title: `${app.name} — aplz`,
    description: app.description || `${app.name} を aplz でチェック`,
    openGraph: {
      title: app.name,
      description: app.description || `${app.name} を aplz でチェック`,
    },
  };
}

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServerClient();

  const { data: app } = await supabase
    .from("apps")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!app) notFound();

  // Get current user
  const authSupabase = await createAuthServerClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  const isOwner = user && app.user_id && user.id === app.user_id;

  // Fetch community name if app belongs to one
  let communityName: string | null = null;
  if (app.community_id) {
    const { data: community } = await supabase
      .from("communities")
      .select("name")
      .eq("id", app.community_id)
      .single();
    communityName = community?.name ?? null;
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("app_id", app.id)
    .order("created_at", { ascending: true });

  // Fetch reactions
  const { data: reactionRows } = await supabase
    .from("reactions")
    .select("emoji")
    .eq("app_id", app.id);

  const reactions: Record<string, number> = {};
  for (const e of REACTION_EMOJIS) {
    reactions[e] = 0;
  }
  for (const row of reactionRows ?? []) {
    reactions[row.emoji] = (reactions[row.emoji] || 0) + 1;
  }

  // Fetch ratings
  const { data: ratingsData } = await supabase
    .from("ratings")
    .select("usability, design, idea")
    .eq("app_id", app.id);

  const ratingsList = ratingsData ?? [];
  const ratingsCount = ratingsList.length;
  const ratingsAverages =
    ratingsCount > 0
      ? {
          usability:
            ratingsList.reduce((sum, r) => sum + r.usability, 0) / ratingsCount,
          design:
            ratingsList.reduce((sum, r) => sum + r.design, 0) / ratingsCount,
          idea:
            ratingsList.reduce((sum, r) => sum + r.idea, 0) / ratingsCount,
        }
      : { usability: 0, design: 0, idea: 0 };

  const iframeSrc = `${process.env.R2_PUBLIC_URL}/${slug}/index.html`;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0f0f0f]">
              {app.name}
              {communityName && (
                <span className="text-sm font-normal text-[#909090] ml-3">
                  {communityName}
                </span>
              )}
            </h1>
            <div className="flex items-center gap-1.5 text-sm text-[#909090] mt-1">
              {app.author_name && (
                <span>作成: {app.author_name}</span>
              )}
              {app.version > 1 && (
                <>
                  <span>・</span>
                  <span>v{app.version}</span>
                </>
              )}
              {app.last_published_at && app.version > 1 && (
                <>
                  <span>・</span>
                  <span>{formatDate(app.last_published_at)}に更新</span>
                </>
              )}
            </div>
          </div>
          {isOwner && (
            <Link
              href={`/apps/${slug}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-sm text-[#606060] hover:shadow-md transition-all"
            >
              <Pencil size={14} />
              編集
            </Link>
          )}
        </div>
        {app.description && (
          <p className="text-[#606060] mt-2">{app.description}</p>
        )}
        <a
          href={iframeSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-[#065fd4] hover:underline transition-colors mt-2"
        >
          新しいタブで開く &#8599;
        </a>
      </div>

      {/* iframe */}
      <div className="rounded-lg border border-[#e5e5e5] overflow-hidden bg-white mb-6 animate-fade-in">
        <iframe
          src={iframeSrc}
          sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-modals"
          loading="lazy"
          className="w-full h-[65vh] border-0"
          title={app.name}
        />
      </div>

      {/* Reactions */}
      <ReactionBar appId={app.id} initialReactions={reactions} />

      {/* Ratings */}
      <RatingSection
        appId={app.id}
        initialAverages={ratingsAverages}
        initialCount={ratingsCount}
      />

      {/* Comments */}
      <CommentSection appId={app.id} initialComments={comments ?? []} />
    </main>
  );
}
