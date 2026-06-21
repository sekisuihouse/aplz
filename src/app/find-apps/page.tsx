import { Search } from "lucide-react";
import AudienceLanding from "@/app/components/AudienceLanding";
import { breadcrumbJsonLd, JsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "アプリを探す | APLZ",
  description: "APLZの公開アプリ、無料ツール、用途別ページから、いま必要な小さなWebアプリを探せます。",
  path: "/find-apps",
  keywords: ["無料Webアプリ", "業務アプリを探す", "便利ツール", "APLZ アプリ"],
});

export default function FindAppsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "APLZ", path: "/" }, { name: "アプリを探す", path: "/find-apps" }])} />
      <AudienceLanding
        icon={Search}
        eyebrow="アプリを探している人へ"
        title="目的から探して、その場で試す。"
        description="インストールせずブラウザで使える公開アプリと無料ツールを集めています。何を選べばよいか分からない時は、場面別のページから探せます。"
        primaryAction={{ label: "公開アプリを見る", href: "/apps" }}
        secondaryAction={{ label: "無料ツールを見る", href: "/tools" }}
        steps={[
          { title: "目的を選ぶ", description: "当番、集計、予約、イベントなど、いま片づけたい作業から探します。" },
          { title: "説明を確認する", description: "できること、扱うデータ、利用環境、注意事項を読んでから開きます。" },
          { title: "まず試す", description: "実データを入れる前に、架空の内容で期待した結果になるか確かめます。" },
        ]}
        destinations={[
          { title: "公開アプリ", description: "APLZで公開された小さなWebアプリを一覧から探します。", href: "/apps", label: "アプリ一覧へ" },
          { title: "無料ツール", description: "当番、計算、文章作成など、登録なしで使える道具を試せます。", href: "/tools", label: "ツール一覧へ" },
          { title: "用途別に探す", description: "町内会、学校、イベント、個人事業などの場面から選べます。", href: "/use-cases", label: "用途別ページへ" },
          { title: "困りごとの例から探す", description: "現場の課題と、どんなアプリが合いそうかを見比べられます。", href: "/templates", label: "例を見る" },
        ]}
        note={{
          title: "最初は架空のデータで試してください",
          description: "公開アプリへ個人情報、顧客情報、機密情報を入力しないでください。外部通信やデータ保存の説明が不明な場合は、入力せず投稿者へ確認してください。",
        }}
      />
    </>
  );
}
