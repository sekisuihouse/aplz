"use client";

import { useState } from "react";
import Link from "next/link";

type Category = "all" | "education" | "medical" | "construction" | "food" | "agriculture" | "other";

interface Template {
  id: string;
  title: string;
  category: Category;
  categoryLabel: string;
  problem: string;
  solution: string;
}

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "education", label: "教育（教師・学校）" },
  { key: "medical", label: "医療（医師・看護師）" },
  { key: "construction", label: "建設・不動産" },
  { key: "food", label: "飲食・小売" },
  { key: "agriculture", label: "農業" },
  { key: "other", label: "その他" },
];

const TEMPLATES: Template[] = [
  {
    id: "desk-layout",
    title: "教室の机・椅子配置最適化ツール",
    category: "education",
    categoryLabel: "教育",
    problem:
      "クラス替えや席替えのたびに、教室の机と椅子の配置を手作業で考えるのが大変。生徒の視力や身長、人間関係も考慮したい。",
    solution:
      "教室のサイズと生徒情報を入力すると、最適な座席配置を自動で提案。ドラッグ＆ドロップで微調整も可能。",
  },
  {
    id: "medication-schedule",
    title: "患者の投薬スケジュール管理",
    category: "medical",
    categoryLabel: "医療",
    problem:
      "複数の患者に対する投薬タイミングの管理が煩雑。飲み合わせの確認や投薬漏れの防止に手間がかかる。",
    solution:
      "患者ごとの投薬スケジュールを一覧表示し、次の投薬時間をアラートで通知。飲み合わせチェック機能付き。",
  },
  {
    id: "daily-sales",
    title: "日次売上・在庫記録シート",
    category: "food",
    categoryLabel: "飲食",
    problem:
      "毎日の売上集計と在庫確認を紙やExcelで管理しており、入力ミスや集計に時間がかかる。",
    solution:
      "スマホからワンタップで売上・在庫を入力。日次・週次・月次のグラフを自動生成し、発注タイミングも提案。",
  },
  {
    id: "planting-calendar",
    title: "作付けカレンダー管理",
    category: "agriculture",
    categoryLabel: "農業",
    problem:
      "作物の種まき・植え付け・収穫時期の管理が複雑。天候や連作障害も考慮する必要がある。",
    solution:
      "作物ごとの栽培スケジュールをカレンダーで可視化。地域の気候データと連携し、最適な作業タイミングを通知。",
  },
  {
    id: "safety-checklist",
    title: "現場の安全チェックリスト",
    category: "construction",
    categoryLabel: "建設",
    problem:
      "建設現場の安全確認を紙のチェックリストで行っており、記録の管理や過去の確認が困難。",
    solution:
      "デジタルチェックリストで現場の安全確認を実施。写真添付・GPS記録・過去履歴の検索が可能。",
  },
];

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [showModal, setShowModal] = useState(false);

  const filtered =
    selectedCategory === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <main className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
      {/* Header */}
      <section className="text-center mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0f0f0f] mb-3">
          あなたの職業向けのアプリを見つけよう
        </h1>
        <p className="text-[#606060] text-sm sm:text-base">
          現場の課題を解決するテンプレートを選んで、すぐにアプリを作り始められます
        </p>
      </section>

      {/* Category Filter */}
      <section className="flex flex-wrap gap-2 justify-center mb-10">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat.key
                ? "bg-[#1B4F72] text-white"
                : "border border-[#e5e5e5] text-[#606060] hover:bg-[#f5f5f5]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </section>

      {/* Template Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {filtered.map((template) => (
          <div
            key={template.id}
            className="border border-[#e5e5e5] rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#f5f5f5] text-[#606060]">
                {template.categoryLabel}
              </span>
            </div>
            <h3 className="font-bold text-[#0f0f0f] text-base">
              {template.title}
            </h3>
            <div className="flex-1 flex flex-col gap-2">
              <div>
                <p className="text-xs font-medium text-[#909090] mb-1">課題</p>
                <p className="text-sm text-[#606060] leading-relaxed">
                  {template.problem}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#909090] mb-1">
                  解決するアプリ
                </p>
                <p className="text-sm text-[#606060] leading-relaxed">
                  {template.solution}
                </p>
              </div>
            </div>
            <Link
              href="/new"
              className="mt-2 px-4 py-2.5 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] transition-colors text-center"
            >
              このテンプレートで作る
            </Link>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="text-center">
        <p className="text-[#606060] text-sm mb-4">
          あなたの職業で困っていることはありませんか？
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 rounded-lg border border-[#e5e5e5] text-[#0f0f0f] text-sm font-medium hover:bg-[#f5f5f5] transition-colors"
        >
          課題を投稿する
        </button>
      </section>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-[#0f0f0f] mb-2">
              課題を投稿する
            </h2>
            <p className="text-sm text-[#606060] mb-5">
              この機能は近日公開予定です。あなたの職業で困っていることを教えてください。
            </p>
            <div className="flex flex-col gap-3 mb-5">
              <input
                type="text"
                placeholder="あなたの職業（例：小学校教師）"
                className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors"
              />
              <textarea
                placeholder="困っていること・解決したい課題を教えてください"
                rows={4}
                className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm text-[#606060] hover:bg-[#f5f5f5] transition-colors"
              >
                閉じる
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] transition-colors"
              >
                送信（準備中）
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
