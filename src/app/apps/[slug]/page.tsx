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
import ReportButton from "@/app/components/ReportButton";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata, truncateDescription } from "@/lib/seo";

export const revalidate = 10;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data: app } = await supabase
    .from("apps")
    .select("name, description, is_public, created_at, last_published_at")
    .eq("slug", slug)
    .single();

  if (!app) return { title: "アプリが見つかりません | APLZ" };

  const description = truncateDescription(
    app.description,
    `${app.name}はAPLZで公開された小さなWebアプリです。`
  );
  return pageMetadata({
    title: `${app.name} | APLZ`,
    description,
    path: `/apps/${slug}`,
    type: "article",
    noIndex: !app.is_public,
    publishedTime: app.created_at,
    modifiedTime: app.last_published_at || app.created_at,
    keywords: ["小さなWebアプリ", "業務アプリ", app.name],
  });
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

  // Fetch community name only if user is a member
  let communityName: string | null = null;
  if (app.community_id && user) {
    const { data: membership } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", app.community_id)
      .eq("user_id", user.id)
      .single();
    if (membership) {
      const { data: community } = await supabase
        .from("communities")
        .select("name")
        .eq("id", app.community_id)
        .single();
      communityName = community?.name ?? null;
    }
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
  const appUrl = absoluteUrl(`/apps/${slug}`);
  const averageRating =
    ratingsCount > 0
      ? (ratingsAverages.usability + ratingsAverages.design + ratingsAverages.idea) / 3
      : null;
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "APLZ", path: "/" },
      { name: "公開アプリ", path: "/#apps" },
      { name: app.name, path: `/apps/${slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: app.name,
      description: app.description || `${app.name}はAPLZで公開された小さなWebアプリです。`,
      url: appUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      datePublished: app.created_at,
      dateModified: app.last_published_at || app.created_at,
      author: {
        "@type": "Person",
        name: authorProfile?.display_name || app.author_name || "APLZユーザー",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "JPY",
      },
      ...(averageRating
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: averageRating.toFixed(1),
              ratingCount: ratingsCount,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    },
  ];

  return (
    <main className="max-w-[1800px] mx-auto px-4 py-8">
      <JsonLd data={jsonLd} />
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
                <ReportButton targetType="app" targetId={app.id} />
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
