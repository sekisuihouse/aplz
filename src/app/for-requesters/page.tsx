import { PenLine } from "lucide-react";
import AudienceLanding from "@/app/components/AudienceLanding";
import { breadcrumbJsonLd, JsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "困りごとを書く人へ | APLZ",
  description: "APLZで日常や仕事の小さな困りごとを投稿する流れ、書く内容、安全上の注意を説明します。",
  path: "/for-requesters",
  keywords: ["困りごと 投稿", "アプリを作ってほしい", "小さな業務改善", "APLZ"],
});

export default function ForRequestersPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "APLZ", path: "/" }, { name: "困りごとを書く人へ", path: "/for-requesters" }])} />
      <AudienceLanding
        icon={PenLine}
        eyebrow="困りごとを書く人へ"
        title="仕様ではなく、困っている場面から。"
        description="「毎回同じ集計をしている」「当番を決め直すのが大変」。その一言で十分です。足りない条件は、開発者との質問と回答であとから整理できます。"
        primaryAction={{ label: "困りごとを書く", href: "/requests/new" }}
        secondaryAction={{ label: "投稿例を見る", href: "/templates" }}
        steps={[
          { title: "一言で書く", description: "まずはタイトルと期限だけ。完璧な説明や画面設計は必要ありません。" },
          { title: "質問に答える", description: "使う人や必要な結果など、不足している条件を短いやりとりで補います。" },
          { title: "試して返す", description: "提案されたアプリを開き、使えたことや直してほしい点を返します。" },
        ]}
        destinations={[
          { title: "新しく投稿する", description: "タイトルと期限から、3分ほどで書き始められます。", href: "/requests/new", label: "投稿画面へ" },
          { title: "書き方の例を見る", description: "職種や場面ごとの困りごとと、解決イメージを確認できます。", href: "/templates", label: "テンプレートへ" },
          { title: "ほかの困りごとを見る", description: "似た投稿や、すでに回答された困りごとを探せます。", href: "/requests", label: "一覧を見る" },
        ]}
        note={{
          title: "個人情報は書かないでください",
          description: "名前、住所、電話番号、児童・患者・顧客を特定できる情報は投稿本文に入れません。必要な場合も、実データではなく項目名や架空の例で説明してください。",
        }}
      />
    </>
  );
}
