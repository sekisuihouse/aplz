import Link from "next/link";
import { ARTICLES } from "@/lib/articles";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "記事 — 小さな業務アプリと困りごと解決のヒント | APLZ",
  description:
    "町内会、学校、個人事業主、イベント運営などの小さな困りごとをアプリで解決するための記事一覧です。",
  path: "/articles",
  keywords: ["小さな業務アプリ", "業務改善", "困りごと 解決", "APLZ 記事"],
});

export default function ArticlesPage() {
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
      hasPart: ARTICLES.map((article) => ({
        "@type": "Article",
        headline: article.title,
        description: article.description,
        url: absoluteUrl(`/articles/${article.slug}`),
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
      })),
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <JsonLd data={jsonLd} />
      <div className="mb-8">
        <p className="text-sm font-semibold text-[#1B4F72] mb-2">APLZ Articles</p>
        <h1 className="text-3xl font-bold text-[#0f0f0f]">小さな業務アプリの記事</h1>
        <p className="text-sm text-[#606060] leading-relaxed mt-3 max-w-2xl">
          紙、Excel、LINE、手入力で回している小さな作業を、投稿しやすい困りごとに分解するための実用記事です。
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {ARTICLES.map((article) => (
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="rounded-lg border border-[#e5e5e5] bg-white p-5 hover:shadow-md transition-all"
          >
            <p className="text-xs font-semibold text-[#1B4F72] mb-2">{article.category}</p>
            <h2 className="text-lg font-bold text-[#0f0f0f] leading-snug">{article.title}</h2>
            <p className="text-sm text-[#606060] leading-relaxed mt-2">{article.description}</p>
            <p className="text-xs text-[#909090] mt-4">
              {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
