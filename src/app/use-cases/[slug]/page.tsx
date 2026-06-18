import { notFound } from "next/navigation";
import Link from "next/link";
import RequestCard from "@/app/components/RequestCard";
import { createServerClient } from "@/lib/supabase";
import { USE_CASES, getUseCase } from "@/lib/use-cases";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 60;

interface UseCasePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return USE_CASES.map((useCase) => ({ slug: useCase.slug }));
}

export async function generateMetadata({ params }: UseCasePageProps) {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) return { title: "用途が見つかりません | APLZ" };
  return pageMetadata({
    title: `${useCase.title} | APLZ`,
    description: useCase.description,
    path: `/use-cases/${useCase.slug}`,
    keywords: useCase.keywords,
  });
}

export default async function UseCasePage({ params }: UseCasePageProps) {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) notFound();

  const db = createServerClient();
  const { data: requests } = await db
    .from("requests")
    .select("*")
    .eq("is_public", true)
    .neq("status", "hidden")
    .eq("category", useCase.category)
    .order("updated_at", { ascending: false })
    .limit(6);

  const list = await enrichRequests(db, requests ?? []);
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "APLZ", path: "/" },
      { name: "用途別", path: "/use-cases" },
      { name: useCase.category, path: `/use-cases/${useCase.slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: useCase.title,
      description: useCase.description,
      url: absoluteUrl(`/use-cases/${useCase.slug}`),
      about: useCase.keywords,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: useCase.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <JsonLd data={jsonLd} />
      <Link href="/use-cases" className="text-sm text-[#606060] hover:underline">
        ← 用途別一覧へ
      </Link>
      <section className="mt-5">
        <p className="text-sm font-semibold text-[#1B4F72] mb-2">{useCase.category}</p>
        <h1 className="text-3xl md:text-4xl font-bold text-[#0f0f0f] leading-tight">
          {useCase.title}
        </h1>
        <p className="text-base text-[#606060] leading-relaxed mt-4 max-w-3xl">
          {useCase.description}
        </p>
        <p className="text-base text-[#404040] leading-relaxed mt-4 max-w-3xl">
          {useCase.searchIntent}
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href={`/requests/new?category=${encodeURIComponent(useCase.category)}`}
            className="px-5 py-2.5 rounded-lg bg-[#1B4F72] text-white text-sm font-semibold hover:bg-[#15415F] transition-colors"
          >
            この用途で困りごとを書く
          </Link>
          <Link
            href={`/requests?category=${encodeURIComponent(useCase.category)}`}
            className="px-5 py-2.5 rounded-lg border border-[#d8d8d8] text-[#0f0f0f] text-sm font-semibold hover:bg-[#f5f5f5] transition-colors"
          >
            投稿を見る
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4 mt-10">
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-5">
          <h2 className="text-lg font-bold text-[#0f0f0f]">投稿例</h2>
          <ul className="mt-3 space-y-2">
            {useCase.examples.map((example) => (
              <li key={example} className="text-sm text-[#404040] leading-relaxed">
                ・{example}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-5">
          <h2 className="text-lg font-bold text-[#0f0f0f]">書くと伝わりやすいこと</h2>
          <ul className="mt-3 space-y-2">
            {useCase.howToWrite.map((item) => (
              <li key={item} className="text-sm text-[#404040] leading-relaxed">
                ・{item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10 rounded-lg border border-[#e5e5e5] bg-white p-5">
        <h2 className="text-lg font-bold text-[#0f0f0f]">よくある質問</h2>
        <div className="mt-4 space-y-4">
          {useCase.faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-sm font-semibold text-[#0f0f0f]">{faq.question}</h3>
              <p className="text-sm text-[#606060] leading-relaxed mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-[#0f0f0f]">この用途の新着投稿</h2>
          <Link
            href={`/requests?category=${encodeURIComponent(useCase.category)}`}
            className="text-sm text-[#1B4F72] hover:underline"
          >
            もっと見る
          </Link>
        </div>
        {list.length === 0 ? (
          <div className="rounded-lg border border-[#e5e5e5] bg-[#f8f8f8] p-6 text-center">
            <p className="text-sm text-[#606060]">まだこの用途の投稿はありません。</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {list.map((request) => (
              <RequestCard key={request.slug} request={request} compact />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

async function enrichRequests(supabase: ReturnType<typeof createServerClient>, requests: Record<string, unknown>[]) {
  const requestIds = requests.map((request) => request.id as string);
  const userIds = [...new Set(requests.map((request) => request.user_id as string | null).filter(Boolean))];
  const [{ data: solutions }, { data: comments }, { data: profiles }] = await Promise.all([
    requestIds.length
      ? supabase.from("solutions").select("request_id").in("request_id", requestIds)
      : Promise.resolve({ data: [] }),
    requestIds.length
      ? supabase.from("request_comments").select("request_id").in("request_id", requestIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds)
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
    profileMap[profile.id] = { display_name: profile.display_name, avatar_url: profile.avatar_url };
  }

  return requests.map((request) => ({
    ...request,
    answer_count: solutionCounts[request.id as string] ?? 0,
    comment_count: commentCounts[request.id as string] ?? 0,
    author: request.user_id ? profileMap[request.user_id as string] ?? null : null,
  })) as Parameters<typeof RequestCard>[0]["request"][];
}
