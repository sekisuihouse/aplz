import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

export const revalidate = 30;

export default async function Home() {
  const supabase = createServerClient();
  const { data: apps } = await supabase
    .from("apps")
    .select(
      `
      *,
      comments:comments(count),
      reactions:reactions(count)
    `
    )
    .order("created_at", { ascending: false })
    .limit(30);

  const list = (apps ?? []).map((app) => ({
    ...app,
    comment_count: app.comments?.[0]?.count ?? 0,
    reaction_count: app.reactions?.[0]?.count ?? 0,
  }));

  return (
    <main>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          Ship your app in <span className="text-[#22d3ee]">seconds</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-md mb-8">
          Upload a ZIP or HTML file and get a live URL instantly. Collect
          feedback from the community.
        </p>
        <Link
          href="/publish"
          className="px-8 py-3 rounded-lg bg-[#22d3ee] text-black font-semibold text-lg hover:bg-[#06b6d4] transition-colors"
        >
          Publish Your App
        </Link>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-5">
            <div className="text-3xl mb-2">&#128193;</div>
            <h3 className="font-semibold text-white mb-1">Upload</h3>
            <p className="text-sm text-gray-500">ZIP or HTML file — drag & drop and you&apos;re done</p>
          </div>
          <div className="p-5">
            <div className="text-3xl mb-2">&#128279;</div>
            <h3 className="font-semibold text-white mb-1">Get a URL</h3>
            <p className="text-sm text-gray-500">Instant live link shared with anyone</p>
          </div>
          <div className="p-5">
            <div className="text-3xl mb-2">&#128172;</div>
            <h3 className="font-semibold text-white mb-1">Collect Feedback</h3>
            <p className="text-sm text-gray-500">Comments & reactions from the community</p>
          </div>
        </div>
      </section>

      {/* App List */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            Recently Published
          </h2>
          {list.length > 0 && (
            <span className="text-sm text-gray-500 font-mono">
              {list.length} app{list.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {list.length === 0 ? (
          <div className="text-center py-20 bg-[#141416] border border-[#2a2a2e] rounded-xl">
            <div className="text-4xl mb-4">&#128640;</div>
            <p className="text-gray-400 mb-4">
              No apps published yet. Be the first!
            </p>
            <Link
              href="/publish"
              className="inline-block px-6 py-2.5 rounded-lg bg-[#22d3ee] text-black font-semibold hover:bg-[#06b6d4] transition-colors"
            >
              Publish Your App
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((app) => (
              <Link
                key={app.id}
                href={`/apps/${app.slug}`}
                className="group bg-[#141416] border border-[#2a2a2e] rounded-xl p-5 hover:border-[#3a3a3e] transition-colors"
              >
                <h3 className="font-semibold text-white group-hover:text-[#22d3ee] transition-colors truncate">
                  {app.name}
                </h3>
                {app.description && (
                  <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
                    {app.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-4 text-xs text-gray-600">
                  <span className="font-mono">
                    {formatDate(app.created_at)}
                  </span>
                  {app.reaction_count > 0 && (
                    <span>&#128293; {app.reaction_count}</span>
                  )}
                  {app.comment_count > 0 && (
                    <span>&#128172; {app.comment_count}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
