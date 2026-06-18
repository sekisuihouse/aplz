"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Sparkles } from "lucide-react";
import { REQUEST_CATEGORIES } from "@/lib/request-platform";

const EXAMPLES = [
  {
    label: "当番表",
    title: "町内会の当番表を作るのが大変",
    category: "町内会",
    description: "人が増えたり休んだりするたびに、紙やExcelで当番を組み直しています。",
    desired_outcome: "名前と当番の種類を入れたら、偏りが少ない当番表を作ってほしい。",
    input_data: "名前、当番の種類、必要人数",
    output_data: "誰がどの当番か分かる表",
  },
  {
    label: "集計",
    title: "アンケート結果を毎回まとめるのが面倒",
    category: "集計",
    description: "回答をコピーして、人数や割合を手で数えています。",
    desired_outcome: "回答を貼り付けたら、人数・割合・簡単なまとめを出してほしい。",
    input_data: "アンケート回答",
    output_data: "集計表と要約",
  },
  {
    label: "予約",
    title: "イベントの参加希望を整理したい",
    category: "イベント運営",
    description: "参加者、希望時間、人数をLINEやメールから拾っています。",
    desired_outcome: "参加者情報を入れたら、時間ごとの一覧を作ってほしい。",
    input_data: "名前、希望時間、人数",
    output_data: "時間別の参加者リスト",
  },
];

export default function NewRequestPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    category: "その他",
    target_user_type: "",
    current_workflow: "",
    pain_point: "",
    desired_outcome: "",
    usage_frequency: "",
    input_data: "",
    output_data: "",
    privacy_level: "unknown",
    deadline: "",
    reference_url: "",
    description: "",
    is_public: true,
    is_beginner_friendly: true,
  });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyExample = (example: (typeof EXAMPLES)[number]) => {
    setForm((prev) => ({
      ...prev,
      title: example.title,
      category: example.category,
      description: example.description,
      desired_outcome: example.desired_outcome,
      input_data: example.input_data,
      output_data: example.output_data,
      privacy_level: "none",
      is_beginner_friendly: true,
    }));
    setDetailsOpen(true);
  };

  const submit = async () => {
    if (submitting || !form.title.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 401) {
        router.push("/login?mode=signup&next=/requests/new");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "投稿できませんでした");
        return;
      }
      router.push(`/requests/${data.request.slug}`);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = form.title.trim().length > 0;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/requests" className="text-sm text-[#606060] hover:underline">
          ← 困りごと一覧へ
        </Link>
        <h1 className="text-2xl font-bold text-[#0f0f0f] mt-3">
          困りごとを書く
        </h1>
        <p className="text-sm text-[#606060] mt-1">
          まずは一言で大丈夫です。あとから質問で補えます。
        </p>
      </div>

      <section className="bg-white border border-[#e5e5e5] rounded-lg p-5">
        <div className="flex flex-wrap gap-2 mb-5">
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => applyExample(example)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-sm text-[#606060] hover:border-[#1B4F72] hover:text-[#1B4F72] transition-colors cursor-pointer"
            >
              <Sparkles size={13} />
              {example.label}の例
            </button>
          ))}
        </div>

        <label className="block">
          <span className="block text-sm text-[#606060] mb-1.5">
            タイトル<span className="text-[#B83232] ml-1">*</span>
          </span>
          <input
            value={form.title}
            onChange={(event) => update("title", event.target.value.slice(0, 120))}
            className="w-full border-0 border-b border-[#e5e5e5] px-0 py-3 text-2xl font-bold text-[#0f0f0f] placeholder:text-[#c0c0c0] focus:outline-none focus:border-[#1B4F72]"
            placeholder="何に困っていますか？"
          />
        </label>

        <label className="block mt-5">
          <span className="block text-sm text-[#606060] mb-1.5">本文</span>
          <textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            rows={8}
            className="w-full border-0 px-0 py-2 text-base leading-7 text-[#0f0f0f] placeholder:text-[#b0b0b0] focus:outline-none resize-none"
            placeholder={[
              "例:",
              "今は紙やExcelで管理しています。",
              "人数が変わるたびに直すのが大変です。",
              "名前と条件を入れたら、自動で表にしてほしいです。",
            ].join("\n")}
          />
        </label>

        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <label className="block">
            <span className="block text-sm text-[#606060] mb-1.5">カテゴリ</span>
            <select
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
              className="input"
            >
              {REQUEST_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm text-[#606060] mb-1.5">個人情報</span>
            <select
              value={form.privacy_level}
              onChange={(event) => update("privacy_level", event.target.value)}
              className="input"
            >
              <option value="unknown">よくわからない</option>
              <option value="none">個人情報なし</option>
              <option value="low">名前・ニックネーム程度</option>
              <option value="medium">メール・電話番号など</option>
              <option value="high">住所・子ども・学校・支払いなど</option>
            </select>
          </label>
        </div>

        {form.privacy_level === "high" && (
          <p className="text-sm text-red-600 mt-3">
            具体的な氏名、住所、連絡先、支払い情報は公開本文に書かないでください。
          </p>
        )}

        <button
          type="button"
          onClick={() => setDetailsOpen((value) => !value)}
          className="mt-5 inline-flex items-center gap-1.5 text-sm text-[#1B4F72] hover:underline cursor-pointer"
        >
          もう少し詳しく書く
          <ChevronDown
            size={16}
            className={`transition-transform ${detailsOpen ? "rotate-180" : ""}`}
          />
        </button>

        {detailsOpen && (
          <div className="mt-5 pt-5 border-t border-[#e5e5e5] space-y-4 animate-fade-in">
            <Field label="どうなったら嬉しいか">
              <textarea
                value={form.desired_outcome}
                onChange={(event) => update("desired_outcome", event.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="名前と条件を入れるだけで、見やすい表ができる"
              />
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="今のやり方">
                <textarea
                  value={form.current_workflow}
                  onChange={(event) => update("current_workflow", event.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder="紙、Excel、LINE、手計算など"
                />
              </Field>
              <Field label="何が面倒か">
                <textarea
                  value={form.pain_point}
                  onChange={(event) => update("pain_point", event.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder="ミスが多い、毎回時間がかかる、共有しづらいなど"
                />
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="入力するもの">
                <textarea
                  value={form.input_data}
                  onChange={(event) => update("input_data", event.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder="名前、人数、日付、金額など"
                />
              </Field>
              <Field label="出てほしいもの">
                <textarea
                  value={form.output_data}
                  onChange={(event) => update("output_data", event.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder="表、PDF、文章、チェックリストなど"
                />
              </Field>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="誰が使うか">
                <input
                  value={form.target_user_type}
                  onChange={(event) => update("target_user_type", event.target.value)}
                  className="input"
                  placeholder="PTA、町内会、先生など"
                />
              </Field>
              <Field label="使う頻度">
                <input
                  value={form.usage_frequency}
                  onChange={(event) => update("usage_frequency", event.target.value)}
                  className="input"
                  placeholder="毎週 / 年1回"
                />
              </Field>
              <Field label="期限">
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(event) => update("deadline", event.target.value)}
                  className="input"
                />
              </Field>
            </div>
            <Field label="参考URL">
              <input
                value={form.reference_url}
                onChange={(event) => update("reference_url", event.target.value)}
                className="input"
                placeholder="https://..."
              />
            </Field>
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-[#e5e5e5] flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-[#606060]">
            <input
              type="checkbox"
              checked={form.is_beginner_friendly}
              onChange={(event) => update("is_beginner_friendly", event.target.checked)}
              className="accent-[#1B4F72]"
            />
            気軽な回答・質問を歓迎
          </label>
        </div>
      </section>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 mt-6 px-4 py-3 bg-white/90 backdrop-blur border-t border-[#e5e5e5] flex items-center justify-between gap-3">
        <p className="text-xs text-[#909090]">
          {canSubmit ? "この内容で投稿できます" : "タイトルだけ入力すれば投稿できます"}
        </p>
        <div className="flex items-center gap-3">
          <Link href="/requests" className="text-sm text-[#606060] hover:underline">
            キャンセル
          </Link>
          <button
            onClick={submit}
            disabled={submitting || !canSubmit}
            className="px-6 py-2.5 rounded-lg bg-[#1B4F72] text-white text-sm font-semibold hover:bg-[#15415F] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {submitting ? "投稿中..." : "投稿する"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm text-[#606060] mb-1.5">{label}</span>
      {children}
    </label>
  );
}
