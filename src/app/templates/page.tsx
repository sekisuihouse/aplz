"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Category = "all" | "local" | "school" | "shop" | "home" | "work";

type Template = {
  id: string;
  title: string;
  category: Category;
  categoryLabel: string;
  problem: string;
  input: string;
  output: string;
  time: string;
  beginner: boolean;
  skills: string;
};

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "local", label: "町内会・地域" },
  { key: "school", label: "学校・PTA" },
  { key: "shop", label: "店・商売" },
  { key: "home", label: "家・生活" },
  { key: "work", label: "小さな仕事" },
];

const TEMPLATES: Template[] = [
  {
    id: "duty-roster",
    title: "当番表を自動で並べたい",
    category: "local",
    categoryLabel: "町内会",
    problem: "名前と当番の種類を入れるだけで、偏りが少ない当番表を作りたい。",
    input: "名前、当番名、必要人数",
    output: "名前と当番の対応表",
    time: "半日〜2日",
    beginner: true,
    skills: "フォーム / 表示 / シャッフル",
  },
  {
    id: "event-staff",
    title: "イベントの必要スタッフ数を見積もりたい",
    category: "local",
    categoryLabel: "地域イベント",
    problem: "受付、誘導、片付けなど、何人必要か毎回あいまいになる。",
    input: "来場予定人数、受付数、開催時間",
    output: "役割別の必要人数メモ",
    time: "1〜3日",
    beginner: true,
    skills: "計算 / 条件分岐",
  },
  {
    id: "school-items",
    title: "持ち物チェック表を作りたい",
    category: "school",
    categoryLabel: "学校・PTA",
    problem: "行事ごとに持ち物が変わり、連絡文を作るたびに抜け漏れが出る。",
    input: "行事名、日付、必要な持ち物",
    output: "印刷しやすいチェック表",
    time: "半日〜2日",
    beginner: true,
    skills: "チェックリスト / 印刷CSS",
  },
  {
    id: "shop-menu-label",
    title: "小さな店のメニュー札を作りたい",
    category: "shop",
    categoryLabel: "店舗",
    problem: "商品名と価格を入力して、見やすいメニュー札をすぐ作りたい。",
    input: "商品名、価格、ひとこと説明",
    output: "スマホでも印刷でも見やすい札",
    time: "1〜3日",
    beginner: true,
    skills: "レイアウト / 印刷",
  },
  {
    id: "family-schedule",
    title: "家族の予定を1週間分だけ共有したい",
    category: "home",
    categoryLabel: "家・生活",
    problem: "アプリを増やすほどではないけれど、今週の予定だけ見える表がほしい。",
    input: "人、曜日、予定",
    output: "1週間の共有表",
    time: "半日〜2日",
    beginner: true,
    skills: "表 / localStorage",
  },
  {
    id: "handover-list",
    title: "引き継ぎ項目を漏れなく並べたい",
    category: "work",
    categoryLabel: "小さな仕事",
    problem: "担当が変わるとき、何を伝えればよいか毎回思い出すのが大変。",
    input: "作業名、頻度、注意点",
    output: "引き継ぎチェックリスト",
    time: "1〜3日",
    beginner: true,
    skills: "フォーム / テンプレート生成",
  },
];

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const filtered = useMemo(
    () => selectedCategory === "all" ? TEMPLATES : TEMPLATES.filter((template) => template.category === selectedCategory),
    [selectedCategory]
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <section className="mb-10">
        <p className="text-sm font-semibold text-[#1B4F72]">Templates</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0f0f0f]">小さく作れる困りごとテンプレート</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#606060]">
          実データなしで試せる、1画面から作れる例だけを載せています。医療判断や大量の個人情報を扱う例は掲載しません。
        </p>
      </section>

      <section className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === cat.key
                ? "bg-[#1B4F72] text-white"
                : "border border-[#e5e5e5] text-[#606060] hover:bg-[#f5f5f5]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => (
          <article key={template.id} className="flex flex-col rounded-lg border border-[#e5e5e5] bg-white p-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-[#f5f5f5] px-2 py-0.5 text-xs text-[#606060]">{template.categoryLabel}</span>
              <span className="rounded-md bg-[#1B4F72]/10 px-2 py-0.5 text-xs text-[#1B4F72]">
                {template.beginner ? "初心者向け" : "経験者向け"}
              </span>
              <span className="rounded-md bg-[#f5f5f5] px-2 py-0.5 text-xs text-[#606060]">{template.time}</span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#0f0f0f]">{template.title}</h2>
            <p className="mt-2 text-sm leading-7 text-[#606060]">{template.problem}</p>
            <div className="mt-4 grid gap-2 rounded-lg bg-[#f8f8f8] p-3 text-sm">
              <SmallSpec label="入力" value={template.input} />
              <SmallSpec label="出力" value={template.output} />
              <SmallSpec label="必要技術" value={template.skills} />
            </div>
            <Link
              href={`/requests/new?template=${template.id}`}
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#1B4F72] px-4 py-2 text-sm font-semibold text-white hover:bg-[#15415F]"
            >
              このテンプレートで投稿する
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

function SmallSpec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#909090]">{label}</p>
      <p className="mt-0.5 text-[#0f0f0f]">{value}</p>
    </div>
  );
}
