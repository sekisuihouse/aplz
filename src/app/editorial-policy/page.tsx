import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "編集方針・情報の扱い | APLZ",
  description:
    "APLZ読みものの企画、執筆補助、出典、更新、訂正、広告・サービス導線に関する編集方針です。",
  path: "/editorial-policy",
});

const policies = [
  {
    title: "記事単体で役に立つこと",
    body: "APLZの宣伝を前提にせず、暮らし、学び、仕事、商売、地域、技術、文化の疑問へ具体的に答えることを優先します。サービスへの導線は、記事の内容と自然につながる場合だけ設置します。",
  },
  {
    title: "生成支援の利用を隠さないこと",
    body: "企画整理、草稿、共通構成、文章の補足に生成AIや自動生成を利用する場合があります。生成された文章を、それだけで事実の根拠にはしません。実施していない取材、実験、調査、利用実績を実施済みとして掲載しません。",
  },
  {
    title: "一次情報を優先すること",
    body: "制度、統計、安全、個人情報などを扱う場合は、官公庁、自治体、法令、企業公式資料、学術資料を優先します。各記事の末尾には、テーマの背景を確認できる公的資料を表示します。資料が記事中の全判断を保証するものではないため、制度や数値はリンク先の最新版も確認してください。",
  },
  {
    title: "事実と例を分けること",
    body: "確認できる事実、編集部の整理、仮説、想定例を混同しません。架空の人物、口コミ、企業、売上、時間削減、調査結果を実在のものとして掲載しません。取材していない人物の発言も作りません。",
  },
  {
    title: "更新日と訂正を残すこと",
    body: "記事には公開日と更新日を表示します。制度変更、リンク切れ、重要な誤りが確認できた場合は内容を見直します。文章の意味を変える更新は更新日に反映し、検索順位だけを目的に日付を変更しません。",
  },
  {
    title: "読者と検索システムへ同じ情報を見せること",
    body: "要点、見出し、著者、日付、関連資料など、構造化データに含める主要情報は画面にも表示します。検索エンジンや生成AIだけへ見せる隠し文章や、内容と一致しない構造化データは使用しません。",
  },
];

export default function EditorialPolicyPage() {
  return (
    <main className="bg-[#fbfbfa]">
      <div className="mx-auto max-w-[760px] px-5 py-12 md:py-16">
        <p className="text-sm font-semibold text-[#1B4F72]">APLZ編集部</p>
        <h1 className="mt-3 text-[32px] font-bold leading-tight text-[#0f0f0f] md:text-[44px]">
          編集方針・情報の扱い
        </h1>
        <p className="mt-6 text-base leading-8 text-[#404040] md:text-lg">
          APLZの読みものは、日常の疑問や小さな不便を具体的に考えるためのメディアです。読者が記事の成り立ちと根拠を判断できるよう、次の方針で制作・更新します。
        </p>
        <p className="mt-3 text-sm text-[#606060]">
          制定・最終更新: <time dateTime="2026-06-22">2026年6月22日</time>
        </p>

        <div className="mt-12 divide-y divide-[#e5e5e5] border-y border-[#e5e5e5]">
          {policies.map((policy, index) => (
            <section key={policy.title} className="py-7">
              <p className="text-xs font-semibold text-[#1B4F72]">{String(index + 1).padStart(2, "0")}</p>
              <h2 className="mt-2 text-xl font-bold text-[#0f0f0f]">{policy.title}</h2>
              <p className="mt-3 text-base leading-8 text-[#404040]">{policy.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#0f0f0f]">記事の見方</h2>
          <p className="mt-3 text-base leading-8 text-[#404040]">
            各記事では、冒頭に結論と要点、本文末に関連する一次情報・公的資料、公開日と更新日を表示します。医療、法律、税務など専門判断が必要な内容は、記事だけで判断せず、担当機関や専門家の最新情報を確認してください。
          </p>
          <Link
            href="/articles"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1B4F72] px-4 py-2 text-sm font-semibold text-white hover:bg-[#15415F]"
          >
            読みものを見る
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}
