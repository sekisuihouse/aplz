import Link from "next/link";
import { USE_CASES } from "@/lib/use-cases";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "用途別に探す — 小さな業務アプリの相談カテゴリ | APLZ",
  description:
    "集計、予約、当番表、イベント運営、町内会、個人事業主など、用途別に小さな業務アプリの困りごとを探せます。",
  path: "/use-cases",
  keywords: ["業務アプリ 用途", "小さな業務改善", "困りごと カテゴリ"],
});

export default function UseCasesPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "APLZ", path: "/" },
            { name: "用途別", path: "/use-cases" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "APLZの用途別カテゴリ",
            url: absoluteUrl("/use-cases"),
            hasPart: USE_CASES.map((useCase) => ({
              "@type": "WebPage",
              name: useCase.title,
              description: useCase.description,
              url: absoluteUrl(`/use-cases/${useCase.slug}`),
            })),
          },
        ]}
      />
      <div className="mb-8">
        <p className="text-sm font-semibold text-[#1B4F72] mb-2">Use cases</p>
        <h1 className="text-3xl font-bold text-[#0f0f0f]">用途別に小さなアプリを探す</h1>
        <p className="text-sm text-[#606060] leading-relaxed mt-3 max-w-2xl">
          いま困っている作業の種類から、投稿例や既存の困りごとを探せます。
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {USE_CASES.map((useCase) => (
          <Link
            key={useCase.slug}
            href={`/use-cases/${useCase.slug}`}
            className="rounded-lg border border-[#e5e5e5] bg-white p-5 hover:shadow-md transition-all"
          >
            <p className="text-xs font-semibold text-[#1B4F72] mb-2">{useCase.category}</p>
            <h2 className="text-lg font-bold text-[#0f0f0f]">{useCase.title}</h2>
            <p className="text-sm text-[#606060] leading-relaxed mt-2">{useCase.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
