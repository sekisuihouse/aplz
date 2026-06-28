import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "運営者情報 | APLZ",
  description: "APLZの運営方針、問い合わせ、掲載基準、通報対応についてまとめています。",
  path: "/operator",
});

export default function OperatorPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#0f0f0f]">運営者情報</h1>
      <div className="mt-6 space-y-6 text-sm leading-8 text-[#404040]">
        <section>
          <h2 className="text-lg font-bold text-[#0f0f0f]">運営方針</h2>
          <p>APLZは、日常の小さな困りごとを言葉にし、制作者との会話を通じて小さなWebアプリに近づけるための場として運営しています。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-[#0f0f0f]">掲載基準</h2>
          <p>小さく試せること、入力・処理・出力が説明できること、個人情報や外部通信の扱いを明記できることを重視します。高リスク分野は掲載を制限する場合があります。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-[#0f0f0f]">通報と確認</h2>
          <p>各投稿・アプリ・コメントには通報ボタンがあります。不適切な内容、リンク切れ、危険な外部遷移を見つけた場合は通報してください。</p>
        </section>
      </div>
    </main>
  );
}
