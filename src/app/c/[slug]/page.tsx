import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { createAuthServerClient } from "@/lib/supabase-server";
import AppCard from "@/app/components/AppCard";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 15;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data: community } = await supabase
    .from("communities")
    .select("name, description, is_private")
    .eq("slug", slug)
    .single();

  if (!community) return pageMetadata({
    title: "コミュニティが見つかりません | APLZ",
    description: "指定されたコミュニティは見つかりませんでした。",
    path: `/c/${slug}`,
    noIndex: true,
  });

  return pageMetadata({
    title: `${community.name} | APLZコミュニティ`,
    description: community.description || `${community.name}で公開されている小さなWebアプリを確認できます。`,
    path: `/c/${slug}`,
    noIndex: community.is_private,
    keywords: [community.name, `${community.name} アプリ`, "APLZ コミュニティ"],
  });
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

  // Member-only check for private communities
  if (community.is_private) {
    const authSupabase = await createAuthServerClient();
    const { data: { user } } = await authSupabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: membership } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return (
        <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
          <div className="text-center animate-fade-in">
            <h1 className="text-xl font-bold text-[#0f0f0f] mb-2">
              メンバー限定のコミュニティです
            </h1>
            <p className="text-[#606060] mb-6">
              <span className="font-medium text-[#0f0f0f]">{community.name}</span> は招待コードが必要です。
            </p>
            <Link
              href="/c/join"
              className="inline-block px-6 py-2.5 rounded-lg bg-[#1B4F72] text-white font-semibold text-sm hover:bg-[#15415F] transition-colors"
            >
              招待コードで参加する
            </Link>
          </div>
        </main>
      );
    }
  }

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

  // Fetch profiles for avatar display
  const userIds = [...new Set((apps ?? []).map((a: { user_id?: string }) => a.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds)
    : { data: [] };
  const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
  }

  const list = (apps ?? []).map((app) => {
    const rd = ratingsByApp[app.id];
    const profile = app.user_id ? profileMap[app.user_id] : null;
    return {
      ...app,
      comment_count: app.comments?.[0]?.count ?? 0,
      rating_count: rd?.count ?? 0,
      avg_rating: rd ? rd.sum / rd.count / 3 : 0,
      profile_avatar_url: profile?.avatar_url ?? null,
      profile_display_name: profile?.display_name ?? null,
    };
  });

  const r2PublicUrl = process.env.R2_PUBLIC_URL;

  return (
    <main className="max-w-[1800px] mx-auto px-4 py-8">
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
          className="inline-block mt-4 px-5 py-2 rounded-lg bg-[#1B4F72] text-white font-medium text-sm hover:bg-[#15415F] transition-colors"
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
            className="inline-block px-5 py-2 rounded-lg bg-[#1B4F72] text-white font-semibold text-sm hover:bg-[#15415F] transition-colors"
          >
            アプリを公開する
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
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
              authorName={app.profile_display_name || app.author_name}
              avatarUrl={app.profile_avatar_url}
              version={app.version}
              communitySlug={slug}
            />
          ))}
        </div>
      )}
    </main>
  );
}
