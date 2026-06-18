import { notFound } from "next/navigation";
import Link from "next/link";
import { ARTICLES, getArticle } from "@/lib/articles";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "記事が見つかりません | APLZ" };
  return pageMetadata({
    title: `${article.title} | APLZ`,
    description: article.description,
    path: `/articles/${article.slug}`,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    keywords: article.keywords,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "APLZ", path: "/" },
      { name: "記事", path: "/articles" },
      { name: article.title, path: `/articles/${article.slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      inLanguage: "ja",
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      mainEntityOfPage: absoluteUrl(`/articles/${article.slug}`),
      author: {
        "@type": "Organization",
        name: "APLZ",
        url: absoluteUrl("/"),
      },
      publisher: {
        "@type": "Organization",
        name: "APLZ",
        url: absoluteUrl("/"),
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/icon-512.png"),
        },
      },
      keywords: article.keywords.join(", "),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: article.faqs.map((faq) => ({
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
    <main className="max-w-3xl mx-auto px-4 py-10">
      <JsonLd data={jsonLd} />
      <Link href="/articles" className="text-sm text-[#606060] hover:underline">
        ← 記事一覧へ
      </Link>
      <article className="mt-5">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#1B4F72] mb-2">{article.category}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0f0f0f] leading-tight">
            {article.title}
          </h1>
          <p className="text-sm text-[#909090] mt-3">
            公開日: {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
          </p>
          <p className="text-lg text-[#404040] leading-relaxed mt-6">{article.lead}</p>
        </div>

        <div className="space-y-8">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">{section.heading}</h2>
              <div className="space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-base text-[#404040] leading-8">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-4">よくある質問</h2>
          <div className="space-y-4">
            {article.faqs.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-[#e5e5e5] bg-white p-4">
                <h3 className="text-sm font-semibold text-[#0f0f0f]">{faq.question}</h3>
                <p className="text-sm text-[#606060] leading-relaxed mt-2">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-[#e5e5e5] bg-[#f8f8f8] p-5">
          <h2 className="text-lg font-bold text-[#0f0f0f]">関連する困りごとを探す</h2>
          <p className="text-sm text-[#606060] leading-relaxed mt-2">
            似た作業で困っている場合は、既存の投稿を見るか、自分の条件で投稿できます。
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              href={`/requests?q=${encodeURIComponent(article.relatedRequestQuery)}`}
              className="px-4 py-2 rounded-lg bg-[#1B4F72] text-white text-sm font-semibold hover:bg-[#15415F] transition-colors"
            >
              関連する困りごとを見る
            </Link>
            <Link
              href="/requests/new"
              className="px-4 py-2 rounded-lg border border-[#d8d8d8] bg-white text-[#0f0f0f] text-sm font-semibold hover:bg-[#f5f5f5] transition-colors"
            >
              困りごとを書く
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
