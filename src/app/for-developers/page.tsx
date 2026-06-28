import Link from "next/link";
import { Blocks } from "lucide-react";
import AudienceLanding from "@/app/components/AudienceLanding";
import { breadcrumbJsonLd, JsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "開発者として参加する | APLZ",
  description: "APLZで未解決の困りごとを見つけ、質問し、小さなWebアプリで回答する流れを説明します。",
  path: "/for-developers",
  keywords: ["Webアプリ 開発", "小さなアプリ", "開発課題を探す", "APLZ 開発者"],
});

export default function ForDevelopersPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "APLZ", path: "/" }, { name: "開発者として参加", path: "/for-developers" }])} />
      <AudienceLanding
        icon={Blocks}
        eyebrow="開発者として参加する人へ"
        title="小さく作って、実際の反応を受け取る。"
        description="未解決の困りごとから、自分が理解できるものを選びます。分からない点は気軽に質問し、一つの作業を助ける大きさで提案できます。"
        primaryAction={{ label: "未解決の困りごとを見る", href: "/requests?filter=unsolved" }}
        secondaryAction={{ label: "プロフィールを整える", href: "/profile" }}
        steps={[
          { title: "困りごとを選ぶ", description: "カテゴリ、期限、個人情報レベルを見て、無理なく対応できる投稿を探します。" },
          { title: "先に質問する", description: "作り始める前に、入力・出力・利用環境など必要な条件だけを確認します。" },
          { title: "URLで回答する", description: "外部で公開したアプリ、またはAPLZへアップロードしたHTMLアプリを提案します。" },
        ]}
        destinations={[
          { title: "未解決から探す", description: "まだ解決案が決まっていない困りごとを新しい順に確認します。", href: "/requests?filter=unsolved", label: "探しに行く" },
          { title: "すべての困りごとを見る", description: "質問中、回答あり、解決済みを含めて事例を見比べられます。", href: "/requests", label: "一覧を見る" },
          { title: "HTMLアプリを公開する", description: "完成済みのHTMLまたはZIPをアップロードし、回答へ紐づけられます。", href: "/publish", label: "公開画面へ" },
        ]}
        note={{
          title: "動くことより、安心して試せること",
          description: "扱うデータ、外部通信、保存の有無、できないことを明記してください。個人情報が必要な設計は避け、まずダミーデータで試せる形を推奨します。",
        }}
      />
      <section className="border-t border-[#e5e5e5] bg-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-3">
            <DeveloperNote title="実績として掲載できる" text="公開アプリには制作者名を表示できます。プロフィールには制作実績を載せられます。" />
            <DeveloperNote title="報酬は案件ごとに確認" text="無償、有償、相談可能を投稿者と確認します。条件が未記載なら先にコメントで聞いてください。" />
            <DeveloperNote title="再利用は合意を優先" text="自分の部品やテンプレートは使えます。投稿者固有の内容を含む場合は再利用条件を確認してください。" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-[#e5e5e5] bg-[#fbfbfb] p-5">
              <h2 className="text-lg font-bold text-[#0f0f0f]">標準フロー</h2>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-[#606060]">
                <li>1. 募集中の困りごとを選ぶ</li>
                <li>2. 入力・出力・必須条件・個人情報の有無を質問する</li>
                <li>3. 1画面または小さな試作品を作る</li>
                <li>4. データ保存、外部通信、できないことを明記して回答する</li>
                <li>5. 投稿者のフィードバックを受けて、修正範囲を決める</li>
              </ol>
            </div>
            <div className="rounded-lg border border-[#e5e5e5] bg-[#fbfbfb] p-5">
              <h2 className="text-lg font-bold text-[#0f0f0f]">やりとりのルール</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[#606060]">
                <li>・作り始める前に、不明点を短く質問する</li>
                <li>・医療、法律、金融などの判断を断定しない</li>
                <li>・個人情報を必要以上に集めない</li>
                <li>・納品後の修正範囲は、最初の回答に書く</li>
                <li>・トラブル時は通報ボタンとコメントで記録を残す</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/requests?filter=unsolved" className="rounded-lg bg-[#1B4F72] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15415F]">
              募集中の困りごとを見る
            </Link>
            <Link href="/profile" className="rounded-lg border border-[#e5e5e5] px-5 py-2.5 text-sm font-semibold text-[#404040] hover:bg-[#f5f5f5]">
              開発者プロフィールを整える
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function DeveloperNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white p-5">
      <h2 className="text-base font-bold text-[#0f0f0f]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[#606060]">{text}</p>
    </div>
  );
}
