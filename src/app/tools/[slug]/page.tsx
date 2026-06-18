import { notFound } from "next/navigation";
import Link from "next/link";
import { GENERATED_TOOLS } from "@/lib/generated-tools";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import ToolClient from "./ToolClient";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return GENERATED_TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = GENERATED_TOOLS.find((item) => item.slug === slug);
  if (!tool) return { title: "ツールが見つかりません | APLZ" };
  return pageMetadata({
    title: tool.seoTitle,
    description: tool.seoDescription,
    path: `/tools/${tool.slug}`,
    keywords: [...tool.keywords],
  });
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = GENERATED_TOOLS.find((item) => item.slug === slug);
  if (!tool) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "APLZ", path: "/" },
            { name: "無料ツール", path: "/tools" },
            { name: tool.title, path: `/tools/${tool.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: tool.title,
            description: tool.seoDescription,
            url: absoluteUrl(`/tools/${tool.slug}`),
            applicationCategory: "UtilityApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
            keywords: [...tool.keywords].join(", "),
          },
        ]}
      />
      <Link href="/tools" className="text-sm text-[#606060] hover:underline">
        ← 無料ツール一覧へ
      </Link>
      <div className="mt-6 mb-6">
        <p className="text-sm font-semibold text-[#1B4F72] mb-2">Free tool</p>
        <h1 className="text-3xl font-bold text-[#0f0f0f]">{tool.title}</h1>
      </div>
      <ToolClient {...tool} />
      <div className="mt-8 rounded-lg border border-[#e5e5e5] bg-[#f8f8f8] p-5">
        <h2 className="text-lg font-bold text-[#0f0f0f]">関連する読み物</h2>
        <Link
          href={`/articles/${tool.relatedArticleSlug}`}
          className="inline-block text-sm text-[#1B4F72] hover:underline mt-2"
        >
          関連記事を読む
        </Link>
      </div>
    </main>
  );
}
