import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, PenLine } from "lucide-react";
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
  const relatedArticles = ARTICLES.filter(
    (item) => item.slug !== article.slug && item.category === article.category
  )
    .concat(ARTICLES.filter((item) => item.slug !== article.slug && item.category !== article.category))
    .slice(0, 3);

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

  const takeaways = [
    article.sections[0]?.heading,
    article.sections[1]?.heading,
    article.faqs[0]?.question,
  ].filter(Boolean);

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
              約3分で読めます
            </span>
            <span>{new Date(article.publishedAt).toLocaleDateString("ja-JP")}</span>
          </div>
          <h1 className="text-[32px] md:text-[44px] font-bold text-[#0f0f0f] leading-[1.18] tracking-normal">
            {article.title}
          </h1>
          <p className="text-lg md:text-xl text-[#404040] leading-9 mt-7">
            {article.lead}
          </p>
          {article.reader && (
            <div className="mt-7 border-l-4 border-[#1B4F72] bg-white px-5 py-4">
              <p className="text-xs font-semibold text-[#1B4F72] mb-1">この記事が向いている人</p>
              <p className="text-sm text-[#404040] leading-7">{article.reader}</p>
            </div>
          )}
        </header>

        <section className="border-y border-[#e5e5e5] py-6 mb-12">
          <h2 className="text-sm font-bold text-[#0f0f0f] mb-4">この記事でわかること</h2>
          <ul className="space-y-3">
            {takeaways.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-[#404040] leading-7">
                <CheckCircle2 size={18} className="mt-1 shrink-0 text-[#1B4F72]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-12">
          {article.sections.map((section) => (
            <section key={section.heading}>
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

        {article.postExample && (
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
