import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import AppCard from "@/app/components/AppCard";

export const revalidate = 15;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data: community } = await supabase
    .from("communities")
    .select("name, description")
    .eq("slug", slug)
    .single();

  if (!community) return { title: "コミュニティが見つかりません" };

  return {
    title: `${community.name} — aplz`,
    description: community.description || community.name,
  };
}

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServerClient();

  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!community) notFound();

  const { data: apps } = await supabase
    .from("apps")
    .select(
      `
      *,
      comments:comments(count),
      ratings:ratings(count)
    `
    )
    .eq("community_id", community.id)
    .order("created_at", { ascending: false });

  // Fetch rating averages
  const appIds = (apps ?? []).map((a) => a.id);
  const { data: allRatings } = appIds.length > 0
    ? await supabase
        .from("ratings")
        .select("app_id, usability, design, idea")
        .in("app_id", appIds)
    : { data: [] };

  const ratingsByApp: Record<string, { sum: number; count: number }> = {};
  for (const r of allRatings ?? []) {
    if (!ratingsByApp[r.app_id]) {
      ratingsByApp[r.app_id] = { sum: 0, count: 0 };
    }
    ratingsByApp[r.app_id].sum += r.usability + r.design + r.idea;
    ratingsByApp[r.app_id].count += 1;
  }

  const list = (apps ?? []).map((app) => {
    const rd = ratingsByApp[app.id];
    return {
      ...app,
      comment_count: app.comments?.[0]?.count ?? 0,
      rating_count: rd?.count ?? 0,
      avg_rating: rd ? rd.sum / rd.count / 3 : 0,
    };
  });

  const r2PublicUrl = process.env.R2_PUBLIC_URL;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Community Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[#0f0f0f]">
          {community.name}
        </h1>
        {community.description && (
          <p className="text-sm text-[#606060] mt-1">{community.description}</p>
        )}
        <Link
          href={`/publish?community=${slug}`}
          className="inline-block mt-4 px-5 py-2 rounded-lg bg-[#22d3ee] text-black font-medium text-sm hover:bg-[#06b6d4] transition-colors"
        >
          アプリを公開する
        </Link>
      </div>

      {/* App Grid */}
      {list.length === 0 ? (
        <div className="text-center py-16 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
          <p className="text-[#606060] mb-4">
            まだアプリがありません。最初の一つを公開してみましょう
          </p>
          <Link
            href={`/publish?community=${slug}`}
            className="inline-block px-5 py-2 rounded-lg bg-[#22d3ee] text-black font-semibold text-sm hover:bg-[#06b6d4] transition-colors"
          >
            アプリを公開する
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((app) => (
            <AppCard
              key={app.id}
              slug={app.slug}
              name={app.name}
              appUrl={`${r2PublicUrl}/${app.slug}/index.html`}
              avgRating={app.avg_rating}
              ratingCount={app.rating_count}
              commentCount={app.comment_count}
              createdAt={app.created_at}
              authorName={app.author_name}
              version={app.version}
            />
          ))}
        </div>
      )}
    </main>
  );
}
