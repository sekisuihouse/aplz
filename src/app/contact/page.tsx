import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "問い合わせ | APLZ",
  description: "APLZへの問い合わせ、通報、掲載内容の確認方法についてまとめています。",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#0f0f0f]">問い合わせ</h1>
      <div className="mt-6 space-y-6 text-sm leading-8 text-[#404040]">
        <section>
          <h2 className="text-lg font-bold text-[#0f0f0f]">投稿・アプリの問題</h2>
          <p>各ページの通報ボタンから、対象と理由を送ってください。リンク切れ、動かないアプリ、不適切な外部遷移、個人情報の表示などを確認します。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-[#0f0f0f]">一般的な相談</h2>
          <p>困りごとの書き方に迷う場合は、まず投稿フォームに下書きしてください。公開前にプレビューで内容を確認できます。</p>
          <Link href="/requests/new" className="mt-3 inline-flex rounded-lg bg-[#1B4F72] px-4 py-2 text-sm font-semibold text-white hover:bg-[#15415F]">
            困りごとを書く
          </Link>
        </section>
      </div>
    </main>
  );
}
