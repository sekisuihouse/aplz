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
    </>
  );
}
