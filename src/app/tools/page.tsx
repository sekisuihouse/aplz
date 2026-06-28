import Link from "next/link";
import { PUBLISHED_TOOLS } from "@/lib/public-tools";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "無料ツール・診断 — 暮らしと仕事の小さな計算機 | APLZ",
  description: "APLZの無料ツール・診断は、内容確認が完了したものから公開します。",
  path: "/tools",
  noIndex: true,
  keywords: ["無料ツール", "診断", "計算機", "チェックリスト"],
});

export default function ToolsPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "APLZ", path: "/" },
            { name: "無料ツール", path: "/tools" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "無料ツール・診断",
            url: absoluteUrl("/tools"),
            hasPart: PUBLISHED_TOOLS.map((tool) => ({
              "@type": "SoftwareApplication",
              name: tool.title,
              description: tool.seoDescription,
              url: absoluteUrl(`/tools/${tool.slug}`),
              applicationCategory: "UtilityApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
            })),
          },
        ]}
      />
      <div className="mb-8">
        <p className="text-sm font-semibold text-[#1B4F72] mb-2">Tools</p>
        <h1 className="text-3xl font-bold text-[#0f0f0f]">無料ツール・診断</h1>
        <p className="text-sm text-[#606060] leading-7 mt-3 max-w-2xl">
          現在、入力項目・計算結果・注意事項を確認中です。確認が終わったものから公開します。
        </p>
      </div>
      {PUBLISHED_TOOLS.length === 0 ? (
        <div className="rounded-lg border border-[#e5e5e5] bg-[#fbfbfb] p-6">
          <h2 className="text-lg font-bold text-[#0f0f0f]">公開準備中です</h2>
          <p className="mt-2 text-sm leading-7 text-[#606060]">
            仮の計算式や説明が残ったツールは公開しません。小さく試せる道具として確認できたものだけを掲載します。
          </p>
          <Link
            href="/requests/new"
            className="mt-4 inline-flex rounded-lg bg-[#1B4F72] px-4 py-2 text-sm font-semibold text-white hover:bg-[#15415F]"
          >
            作ってほしいツールを書く
          </Link>
        </div>
      ) : (
      <div className="grid md:grid-cols-2 gap-4">
        {PUBLISHED_TOOLS.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="rounded-lg border border-[#e5e5e5] bg-white p-5 hover:shadow-md transition-all"
          >
            <h2 className="text-lg font-bold text-[#0f0f0f]">{tool.title}</h2>
            <p className="text-sm text-[#606060] leading-7 mt-2">
              {tool.seoDescription}
            </p>
          </Link>
        ))}
      </div>
      )}
    </main>
  );
}
