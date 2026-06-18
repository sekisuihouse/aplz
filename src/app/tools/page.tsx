import Link from "next/link";
import { GENERATED_TOOLS } from "@/lib/generated-tools";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "無料ツール・診断 — 暮らしと仕事の小さな計算機 | APLZ",
  description: "家事分担、会議時間、イベントスタッフ数、当番順、仕込み原価などを試せる無料ツール集です。",
  path: "/tools",
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
            hasPart: GENERATED_TOOLS.map((tool) => ({
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
          暮らし、学校、地域、商売、仕事の小さな判断を、その場で試せる道具にしました。
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {GENERATED_TOOLS.map((tool) => (
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
    </main>
  );
}
