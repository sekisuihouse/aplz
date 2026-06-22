import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, ExternalLink, PenLine } from "lucide-react";
import { getArticleGeo, getRelatedArticles } from "@/lib/article-geo";
import { ALL_ARTICLES, getAnyArticle } from "@/lib/articles";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ALL_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getAnyArticle(slug);
  if (!article) return { title: "記事が見つかりません | APLZ" };
  const geo = getArticleGeo(article);
  return pageMetadata({
    title: article.seoTitle ?? `${article.title} | APLZ`,
    description: article.seoDescription ?? article.description,
    path: `/articles/${article.slug}`,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: geo.updatedAt,
    keywords: article.seoKeywords ?? article.keywords,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getAnyArticle(slug);
  if (!article) notFound();
  const geo = getArticleGeo(article);
  const relatedArticles = getRelatedArticles(article, ALL_ARTICLES);

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
      description: article.seoDescription ?? article.description,
      inLanguage: "ja",
      datePublished: article.publishedAt,
      dateModified: geo.updatedAt,
      mainEntityOfPage: absoluteUrl(`/articles/${article.slug}`),
      articleSection: article.category,
      wordCount: article.wordCount,
      isAccessibleForFree: true,
      abstract: geo.directAnswer,
      citation: geo.sources.map((source) => source.url),
      isPartOf: {
        "@type": "CollectionPage",
        name: "APLZ 読みもの",
        url: absoluteUrl("/articles"),
      },
      hasPart: article.sections.map((section, index) => ({
        "@type": "WebPageElement",
        name: section.heading,
        url: absoluteUrl(`/articles/${article.slug}#section-${index + 1}`),
      })),
      about: [
        article.category,
        article.secondaryWorld,
        article.searchIntent,
        article.originalArtifact,
      ].filter(Boolean),
      audience: article.audience
        ? {
            "@type": "Audience",
            audienceType: article.audience,
          }
        : undefined,
      author: {
        "@type": "Organization",
        name: "APLZ編集部",
        url: absoluteUrl("/editorial-policy"),
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
      keywords: (article.seoKeywords ?? article.keywords).join(", "),
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
    <main className="bg-[#fbfbfa]">
      <JsonLd data={jsonLd} />
      <article className="max-w-[760px] mx-auto px-5 py-10 md:py-14">
        <Link href="/articles" className="text-sm text-[#606060] hover:underline">
          ← 記事一覧へ
        </Link>

        <header className="mt-8 mb-10">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#606060] mb-5">
            <span className="rounded-full bg-[#1B4F72]/10 px-3 py-1 font-semibold text-[#1B4F72]">
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 size={13} />
              約{geo.readingMinutes}分
            </span>
            <span>
              公開 <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            </span>
            <span>
              更新 <time dateTime={geo.updatedAt}>{formatDate(geo.updatedAt)}</time>
            </span>
          </div>
          <h1 className="text-[32px] md:text-[44px] font-bold text-[#0f0f0f] leading-[1.18] tracking-normal">
            {article.title}
          </h1>
          <p className="mt-5 text-sm text-[#606060]">
            編集: <Link href="/editorial-policy" className="font-medium text-[#1B4F72] hover:underline">APLZ編集部</Link>
          </p>
          <section aria-labelledby="direct-answer" className="mt-7 border-l-4 border-[#1B4F72] pl-5">
            <h2 id="direct-answer" className="text-sm font-bold text-[#1B4F72]">結論</h2>
            <p className="mt-2 text-lg md:text-xl text-[#303030] leading-9">
              {geo.directAnswer}
            </p>
          </section>
          {article.reader && (
            <div className="mt-7 border-l-4 border-[#1B4F72] bg-white px-5 py-4">
              <p className="text-xs font-semibold text-[#1B4F72] mb-1">この記事が向いている人</p>
              <p className="text-sm text-[#404040] leading-7">{article.reader}</p>
            </div>
          )}
        </header>

        <section className="border-y border-[#e5e5e5] py-6 mb-12">
          <h2 className="text-sm font-bold text-[#0f0f0f] mb-4">この記事の要点</h2>
          <ul className="space-y-3">
            {geo.keyPoints.map((item) => (
              <li key={item.anchor} className="flex gap-3 text-sm text-[#404040] leading-7">
                <CheckCircle2 size={18} className="mt-1 shrink-0 text-[#1B4F72]" />
                <span>
                  <Link href={`#${item.anchor}`} className="font-semibold text-[#0f0f0f] hover:underline">
                    {item.heading}
                  </Link>
                  <span className="block text-[#606060]">{item.summary}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-12">
          {article.sections.map((section, index) => (
            <section id={`section-${index + 1}`} key={`${section.heading}-${index}`} className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#0f0f0f] mb-5 leading-snug">{section.heading}</h2>
              <div className="space-y-5">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-[16px] md:text-[17px] text-[#333] leading-9">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {article.postExample && article.aplzCta && (
          <section className="mt-12 rounded-lg border border-[#dfe7ec] bg-white p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <PenLine size={18} className="text-[#1B4F72]" />
              <h2 className="text-xl font-bold text-[#0f0f0f]">APLZで投稿するなら</h2>
            </div>
            <p className="text-sm text-[#606060] leading-7 mb-5">
              この記事の内容に近い困りごとは、たとえばこのくらいの粒度で投稿できます。
            </p>
            <div className="space-y-4">
              <ArticleMemo label="タイトル" value={article.postExample.title} />
              <ArticleMemo label="今のやり方" value={article.postExample.current} />
              <ArticleMemo label="面倒な点" value={article.postExample.pain} />
              <ArticleMemo label="どうなったら楽か" value={article.postExample.outcome} />
            </div>
          </section>
        )}

        <section className="mt-12 border-t border-[#e5e5e5] pt-8" aria-labelledby="article-sources">
          <h2 id="article-sources" className="text-xl font-bold text-[#0f0f0f]">
            関連する一次情報・公的資料
          </h2>
          <p className="mt-2 text-sm text-[#606060] leading-7">
            このテーマの制度、統計、背景を確認するための資料です。制度や数値は更新されるため、リンク先の最新情報も確認してください。
          </p>
          <ul className="mt-5 space-y-4">
            {geo.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#1B4F72] hover:underline"
                >
                  {source.name}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
                <p className="mt-1 text-sm text-[#606060] leading-7">
                  {source.organization}。{source.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-[#0f0f0f] mb-5">よくある質問</h2>
          <div className="space-y-5">
            {article.faqs.map((faq) => (
              <div key={faq.question} className="border-b border-[#e5e5e5] pb-5">
                <h3 className="text-base font-bold text-[#0f0f0f] leading-7">{faq.question}</h3>
                <p className="text-sm md:text-base text-[#505050] leading-8 mt-2">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {article.aplzCta && (
          <section className="mt-12 rounded-lg bg-[#103a54] p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={18} />
              <h2 className="text-xl font-bold">読んだ内容を、そのまま相談にする</h2>
            </div>
            <p className="text-sm text-white/80 leading-7">
              似た作業で困っている場合は、既存の投稿を見るか、自分の条件で投稿できます。
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link
                href={`/requests?q=${encodeURIComponent(article.relatedRequestQuery)}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-white text-[#103a54] text-sm font-semibold hover:bg-[#eef6fa] transition-colors"
              >
                関連する困りごとを見る
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/requests/new"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                困りごとを書く
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-4">関連する記事</h2>
          <div className="grid gap-3">
            {relatedArticles.map((related) => (
              <Link
                key={related.slug}
                href={`/articles/${related.slug}`}
                className="rounded-lg border border-[#e5e5e5] bg-white p-4 hover:shadow-md transition-all"
              >
                <p className="text-xs font-semibold text-[#1B4F72] mb-1">{related.category}</p>
                <h3 className="text-sm font-semibold text-[#0f0f0f] leading-snug">
                  {related.title}
                </h3>
                <p className="text-xs text-[#606060] leading-relaxed mt-1">
                  {related.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}

function ArticleMemo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#1B4F72] mb-1">{label}</p>
      <p className="text-sm text-[#0f0f0f] leading-7 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
