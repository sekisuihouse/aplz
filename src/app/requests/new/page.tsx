"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { REQUEST_CATEGORIES } from "@/lib/request-platform";

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
    is_beginner_friendly: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 401) {
        router.push("/login?next=/requests/new");
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

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/requests" className="text-sm text-[#606060] hover:underline">
          ← 困りごと一覧へ
        </Link>
        <h1 className="text-2xl font-bold text-[#0f0f0f] mt-3">
          困りごとを投稿
        </h1>
        <p className="text-sm text-[#606060] mt-1">
          完璧な仕様でなくて大丈夫です。今困っている作業と、どうなったら楽かを書いてください。
        </p>
      </div>

      <div className="space-y-6">
        <Section title="まず最低限">
          <Field label="タイトル" required>
            <input
              value={form.title}
              onChange={(event) => update("title", event.target.value.slice(0, 120))}
              className="input"
              placeholder="例: 町内会の当番表を毎月作るのが大変"
            />
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="カテゴリ" required>
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
            </Field>
            <Field label="使う頻度">
              <input
                value={form.usage_frequency}
                onChange={(event) => update("usage_frequency", event.target.value)}
                className="input"
                placeholder="毎週 / 月1回 / イベント前だけ"
              />
            </Field>
          </div>
          <Field label="どうなったら嬉しいか" required>
            <textarea
              value={form.desired_outcome}
              onChange={(event) => update("desired_outcome", event.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="例: 名前と日付を入れるだけで、見やすい当番表が自動でできる"
            />
          </Field>
          <Field label="詳細説明" required>
            <textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              rows={5}
              className="input resize-none"
              placeholder="誰が、どんな場面で、何に困っているかを書いてください"
            />
          </Field>
        </Section>

        <Section title="今のやり方と面倒な点">
          <Field label="誰が困っているか">
            <input
              value={form.target_user_type}
              onChange={(event) => update("target_user_type", event.target.value)}
              className="input"
              placeholder="例: PTAの役員、町内会の会計、個人教室の先生"
            />
          </Field>
          <Field label="今どうやっているか">
            <textarea
              value={form.current_workflow}
              onChange={(event) => update("current_workflow", event.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="例: Excelに手入力して、LINEにスクショを送っている"
            />
          </Field>
          <Field label="何が面倒か">
            <textarea
              value={form.pain_point}
              onChange={(event) => update("pain_point", event.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="例: 人が変わるたびに調整が必要で、ミスが多い"
            />
          </Field>
        </Section>

        <Section title="入出力と安全">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="入力データ">
              <textarea
                value={form.input_data}
                onChange={(event) => update("input_data", event.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="名前、日付、人数など"
              />
            </Field>
            <Field label="出力結果">
              <textarea
                value={form.output_data}
                onChange={(event) => update("output_data", event.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="表、PDF、文章、画像など"
              />
            </Field>
          </div>
          <Field label="個人情報を扱うか">
            <select
              value={form.privacy_level}
              onChange={(event) => update("privacy_level", event.target.value)}
              className="input"
            >
              <option value="none">個人情報なし</option>
              <option value="low">名前・ニックネーム程度</option>
              <option value="medium">メール・電話番号など</option>
              <option value="high">住所・子ども・学校・支払いなど</option>
              <option value="unknown">よくわからない</option>
            </select>
            {form.privacy_level === "high" && (
              <p className="text-sm text-red-600 mt-2">
                高リスクの情報は、公開投稿に具体的な個人情報を書かないでください。
              </p>
            )}
          </Field>
        </Section>

        <Section title="補足">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="期限">
              <input
                type="date"
                value={form.deadline}
                onChange={(event) => update("deadline", event.target.value)}
                className="input"
              />
            </Field>
            <Field label="参考URL">
              <input
                value={form.reference_url}
                onChange={(event) => update("reference_url", event.target.value)}
                className="input"
                placeholder="https://..."
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-[#606060]">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(event) => update("is_public", event.target.checked)}
                className="accent-[#1B4F72]"
              />
              公開する
            </label>
            <label className="flex items-center gap-2 text-sm text-[#606060]">
              <input
                type="checkbox"
                checked={form.is_beginner_friendly}
                onChange={(event) => update("is_beginner_friendly", event.target.checked)}
                className="accent-[#1B4F72]"
              />
              初心者向けの回答歓迎
            </label>
          </div>
        </Section>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={submit}
          disabled={submitting}
          className="px-6 py-2.5 rounded-lg bg-[#1B4F72] text-white text-sm font-semibold hover:bg-[#15415F] disabled:opacity-50 transition-colors cursor-pointer"
        >
          {submitting ? "投稿中..." : "投稿する"}
        </button>
        <Link href="/requests" className="text-sm text-[#606060] hover:underline">
          キャンセル
        </Link>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-[#e5e5e5] rounded-lg p-5">
      <h2 className="text-sm font-semibold text-[#0f0f0f] mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm text-[#606060] mb-1.5">
        {label}
        {required && <span className="text-[#B83232] ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
