import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "利用規約 | APLZ",
  description: "APLZの利用にあたっての基本ルール、投稿、公開アプリ、外部リンク、禁止事項についてまとめています。",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#0f0f0f]">利用規約</h1>
      <div className="mt-6 space-y-6 text-sm leading-8 text-[#404040]">
        <section>
          <h2 className="text-lg font-bold text-[#0f0f0f]">基本方針</h2>
          <p>APLZは、小さな困りごとを投稿し、開発者との会話から小さなWebアプリにつなげる場所です。投稿者と制作者は、公開範囲、扱うデータ、報酬条件、再利用条件を確認したうえで利用してください。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-[#0f0f0f]">禁止される投稿・アプリ</h2>
          <p>違法行為、差別や嫌がらせ、個人情報の不適切な公開、医療・法律・金融判断を断定するもの、危険な外部通信、権利侵害、スパムを目的とした投稿やアプリは禁止します。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-[#0f0f0f]">公開アプリについて</h2>
          <p>公開アプリには、APLZが直接運営していない外部アプリが含まれる場合があります。利用前に、通信、保存、個人情報の扱い、制作者情報を確認してください。</p>
        </section>
      </div>
    </main>
  );
}
