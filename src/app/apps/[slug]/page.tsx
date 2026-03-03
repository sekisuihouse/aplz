import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { REACTION_EMOJIS } from "@/lib/utils";
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

  if (!app) return { title: "App not found" };

  return {
    title: `${app.name} — aplz`,
    description: app.description || `Check out ${app.name} on aplz`,
    openGraph: {
      title: app.name,
      description: app.description || `Check out ${app.name} on aplz`,
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
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-white">{app.name}</h1>
        {app.description && (
          <p className="text-gray-400 mt-2">{app.description}</p>
        )}
        <a
          href={iframeSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-[#22d3ee] hover:underline mt-2"
        >
          Open in new tab &#8599;
        </a>
      </div>

      {/* iframe */}
      <div className="rounded-xl border border-[#2a2a2e] overflow-hidden bg-white mb-6 animate-fade-in">
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
