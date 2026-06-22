import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "職業別の困りごと例・投稿テンプレート | APLZ",
  description:
    "教育、医療、建設、飲食、農業など、職業ごとに起こりやすい困りごとと小さな解決案の例を確認できます。",
  path: "/templates",
  keywords: [
    "困りごと 投稿例",
    "職業別 課題",
    "業務アプリ アイデア",
    "現場の困りごと",
    "APLZ テンプレート",
  ],
});

export default function TemplatesLayout({ children }: { children: ReactNode }) {
  return children;
}
