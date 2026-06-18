import Link from "next/link";
import { ALL_ARTICLES } from "@/lib/articles";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "記事 — 暮らし・仕事・地域・学びの小さな疑問を読む | APLZ",
  description:
    "暮らし、学校、仕事、商売、地域、技術の中で生まれる小さな疑問、不便、工夫、失敗、文化を読むAPLZのコンテンツメディアです。",
  path: "/articles",
  keywords: ["暮らしの疑問", "地域の困りごと", "名もない仕事", "小さな不便", "APLZ 記事"],
});

export default function ArticlesPage() {
  const [featured, ...rest] = ALL_ARTICLES;
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "APLZ", path: "/" },
      { name: "記事", path: "/articles" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "APLZの記事",
      description: metadata.description,
      url: absoluteUrl("/articles"),
      hasPart: ALL_ARTICLES.map((article) => ({
        "@type": "Article",
        headline: article.title,
        description: article.seoDescription ?? article.description,
        url: absoluteUrl(`/articles/${article.slug}`),
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        articleSection: article.category,
      })),
    },
  ];

  return (
    <main className="bg-[#fbfbfa]">
      <JsonLd data={jsonLd} />
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        <div className="mb-10">
          <p className="text-sm font-semibold text-[#1B4F72] mb-2">APLZ Articles</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0f0f0f]">暮らし・仕事・地域・学びの小さな疑問を読む</h1>
          <p className="text-base text-[#606060] leading-8 mt-4 max-w-2xl">
            家、学校、店、町内会、職場、制作現場で生まれる不便や工夫を、道具だけでなく人の動きや文化から考えます。
          </p>
        </div>

        {featured && (
          <Link
            href={`/articles/${featured.slug}`}
            className="block rounded-xl border border-[#e5e5e5] bg-white p-6 md:p-8 hover:shadow-md transition-all mb-6"
          >
            <p className="text-xs font-semibold text-[#1B4F72] mb-3">{featured.category}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0f0f0f] leading-snug">{featured.title}</h2>
            <p className="text-base text-[#606060] leading-8 mt-3 max-w-3xl">
              {featured.seoDescription ?? featured.description}
            </p>
            <p className="text-xs text-[#909090] mt-4">
              {new Date(featured.publishedAt).toLocaleDateString("ja-JP")}
            </p>
          </Link>
        )}

        <div className="divide-y divide-[#e5e5e5] border-y border-[#e5e5e5] bg-white">
          {rest.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="grid md:grid-cols-[160px_1fr] gap-3 px-4 py-5 hover:bg-[#f8f8f8] transition-colors"
            >
              <div>
                <p className="text-xs font-semibold text-[#1B4F72]">{article.category}</p>
                <p className="text-xs text-[#909090] mt-2">
                  {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
                </p>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0f0f0f] leading-snug">{article.title}</h2>
                <p className="text-sm text-[#606060] leading-7 mt-2">
                  {article.seoDescription ?? article.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
