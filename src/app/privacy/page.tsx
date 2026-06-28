import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "プライバシーポリシー | APLZ",
  description: "APLZにおける個人情報、投稿内容、アクセス解析、外部アプリ利用時の注意についてまとめています。",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#0f0f0f]">プライバシーポリシー</h1>
      <div className="mt-6 space-y-6 text-sm leading-8 text-[#404040]">
        <section>
          <h2 className="text-lg font-bold text-[#0f0f0f]">公開投稿に書かないでほしい情報</h2>
          <p>氏名、住所、電話番号、メールアドレス、支払い情報、子どもや学校を特定できる情報は、公開本文に書かないでください。必要な場合は、公開しない方法で扱えるか確認してください。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-[#0f0f0f]">アクセス解析</h2>
          <p>APLZは、サービス改善のためにページ閲覧や操作イベントをSupabase上で集計します。IPアドレス、メールアドレス、フォーム本文、完全なURLクエリは保存しない方針です。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-[#0f0f0f]">外部アプリ</h2>
          <p>公開アプリが外部サイトで動作する場合、APLZ外の通信や保存が発生することがあります。各アプリの説明と注意事項を確認してください。</p>
        </section>
      </div>
    </main>
  );
}
