import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Pencil } from "lucide-react";
import { createServerClient } from "@/lib/supabase";
import { createAuthServerClient } from "@/lib/supabase-server";
import { REACTION_TYPES, LEGACY_EMOJI_MAP, formatDate } from "@/lib/utils";
import ReactionBar from "./ReactionBar";
import RatingSection from "./RatingSection";
import CommentSection from "./CommentSection";
import RelatedApps from "./RelatedApps";
import QrCodeButton from "./QrCodeButton";

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

  // Fetch reactions and map to new types
  const { data: reactionRows } = await supabase
    .from("reactions")
    .select("emoji")
    .eq("app_id", app.id);

  const reactions: Record<string, number> = {};
  for (const t of REACTION_TYPES) {
    reactions[t] = 0;
  }
  for (const row of reactionRows ?? []) {
    const mapped = LEGACY_EMOJI_MAP[row.emoji];
    if (mapped) {
      reactions[mapped] += 1;
    } else if (REACTION_TYPES.includes(row.emoji as (typeof REACTION_TYPES)[number])) {
      reactions[row.emoji] += 1;
    }
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

  // Fetch author profile
  let authorProfile: { display_name: string | null; avatar_url: string | null } | null = null;
  if (app.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", app.user_id)
      .single();
    authorProfile = profile;
  }

  const iframeSrc = `${process.env.R2_PUBLIC_URL}/${slug}/index.html`;
  const r2PublicUrl = process.env.R2_PUBLIC_URL!;

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-8">
      <div className="flex gap-6">
        {/* Main Column */}
        <div className="flex-1 min-w-0">
          {/* iframe */}
          <div
            className="w-full rounded-lg overflow-hidden border border-[#e5e5e5] mb-4 animate-fade-in"
            style={{ aspectRatio: "16/9", maxHeight: "80vh", minHeight: "300px" }}
          >
            <iframe
              src={iframeSrc}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              allow="clipboard-write"
              title={app.name}
            />
          </div>

          {/* App Info */}
          <div className="mb-4 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-[#0f0f0f]">
                  {app.name}
                  {communityName && (
                    <span className="text-sm font-normal text-[#909090] ml-3">
                      {communityName}
                    </span>
                  )}
                </h1>
                <div className="flex items-center gap-1.5 text-sm text-[#909090] mt-1">
                  {(authorProfile?.display_name || app.author_name) && (
                    <span className="flex items-center gap-1.5">
                      {authorProfile?.avatar_url && (
                        <Image
                          src={authorProfile.avatar_url}
                          alt=""
                          width={20}
                          height={20}
                          className="w-5 h-5 rounded-full object-cover"
                          unoptimized
                        />
                      )}
                      作成: {authorProfile?.display_name || app.author_name}
                    </span>
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
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={iframeSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-sm text-[#606060] hover:shadow-md transition-all"
                >
                  新しいタブで開く &#8599;
                </a>
                <QrCodeButton appUrl={iframeSrc} />
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
            </div>
            {app.description && (
              <p className="text-[#606060] mt-2 text-sm">{app.description}</p>
            )}
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

          {/* Related Apps - mobile only */}
          <div className="lg:hidden mt-8">
            <RelatedApps currentAppId={app.id} r2PublicUrl={r2PublicUrl} />
          </div>
        </div>

        {/* Sidebar - desktop only */}
        <div className="hidden lg:block w-80 shrink-0">
          <RelatedApps currentAppId={app.id} r2PublicUrl={r2PublicUrl} />
        </div>
      </div>
    </main>
  );
}
