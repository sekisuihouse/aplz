import Link from "next/link";
import { ALL_ARTICLES } from "@/lib/articles";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "記事 — 小さな業務アプリと困りごと解決のヒント | APLZ",
  description:
    "町内会、学校、個人事業主、イベント運営などの小さな困りごとをアプリで解決するための記事一覧です。",
  path: "/articles",
  keywords: ["小さな業務アプリ", "業務改善", "困りごと 解決", "APLZ 記事"],
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
        description: article.description,
        url: absoluteUrl(`/articles/${article.slug}`),
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
      })),
    },
  ];

  return (
    <main className="bg-[#fbfbfa]">
      <JsonLd data={jsonLd} />
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        <div className="mb-10">
          <p className="text-sm font-semibold text-[#1B4F72] mb-2">APLZ Articles</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0f0f0f]">小さな困りごとを、投稿できる形にする読み物</h1>
          <p className="text-base text-[#606060] leading-8 mt-4 max-w-2xl">
            紙、Excel、LINE、手入力で回している作業を、どこから小さなアプリにすればいいか分かるようにまとめています。
          </p>
        </div>

        {featured && (
          <Link
            href={`/articles/${featured.slug}`}
            className="block rounded-xl border border-[#e5e5e5] bg-white p-6 md:p-8 hover:shadow-md transition-all mb-6"
          >
            <p className="text-xs font-semibold text-[#1B4F72] mb-3">{featured.category}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0f0f0f] leading-snug">{featured.title}</h2>
            <p className="text-base text-[#606060] leading-8 mt-3 max-w-3xl">{featured.description}</p>
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
                <p className="text-sm text-[#606060] leading-7 mt-2">{article.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
