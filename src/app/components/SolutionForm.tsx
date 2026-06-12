"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MineApp {
  slug: string;
  name: string;
}

export default function SolutionForm({ requestSlug }: { requestSlug: string }) {
  const router = useRouter();
  const [apps, setApps] = useState<MineApp[]>([]);
  const [mode, setMode] = useState<"url" | "app">("url");
  const [title, setTitle] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [appSlug, setAppSlug] = useState("");
  const [description, setDescription] = useState("");
  const [usageGuide, setUsageGuide] = useState("");
  const [canDo, setCanDo] = useState("");
  const [cannotDo, setCannotDo] = useState("");
  const [dataHandled, setDataHandled] = useState("");
  const [externalCommunication, setExternalCommunication] = useState(false);
  const [dataStorage, setDataStorage] = useState(false);
  const [recommendedEnvironment, setRecommendedEnvironment] = useState("");
  const [versionNote, setVersionNote] = useState("");
  const [cautionNote, setCautionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/apps/mine?limit=50")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setApps(data);
      })
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const selectedApp = apps.find((app) => app.slug === appSlug);
      const res = await fetch(`/api/requests/${requestSlug}/solutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: mode === "app" ? title || selectedApp?.name : title,
          app_url: mode === "url" ? appUrl : undefined,
          app_slug: mode === "app" ? appSlug : undefined,
          description,
          usage_guide: usageGuide,
          can_do: canDo,
          cannot_do: cannotDo,
          data_handled: dataHandled,
          external_communication: externalCommunication,
          data_storage: dataStorage,
          recommended_environment: recommendedEnvironment,
          version_note: versionNote,
          caution_note: cautionNote,
        }),
      });
      if (res.status === 401) {
        setError("ログインすると回答できます");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "回答を投稿できませんでした");
        return;
      }
      setTitle("");
      setAppUrl("");
      setAppSlug("");
      setDescription("");
      setUsageGuide("");
      setCanDo("");
      setCannotDo("");
      setDataHandled("");
      setExternalCommunication(false);
      setDataStorage(false);
      setRecommendedEnvironment("");
      setVersionNote("");
      setCautionNote("");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    mode === "url" ? title.trim() && appUrl.trim() : appSlug.trim();

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setMode("url")}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
            mode === "url"
              ? "bg-[#1B4F72] text-white"
              : "bg-[#f5f5f5] text-[#606060] hover:bg-[#ebebeb]"
          }`}
        >
          外部URL
        </button>
        <button
          onClick={() => setMode("app")}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
            mode === "app"
              ? "bg-[#1B4F72] text-white"
              : "bg-[#f5f5f5] text-[#606060] hover:bg-[#ebebeb]"
          }`}
        >
          既存APLZアプリ
        </button>
      </div>

      {mode === "url" ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="アプリ名">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, 120))}
              className="input"
              placeholder="例: 当番表メーカー"
            />
          </Field>
          <Field label="アプリURL">
            <input
              value={appUrl}
              onChange={(event) => setAppUrl(event.target.value)}
              className="input"
              placeholder="https://..."
            />
          </Field>
        </div>
      ) : (
        <Field label="既存APLZアプリ">
          <select
            value={appSlug}
            onChange={(event) => {
              const slug = event.target.value;
              setAppSlug(slug);
              const app = apps.find((item) => item.slug === slug);
              if (app && !title) setTitle(app.name);
            }}
            className="input"
          >
            <option value="">選択してください</option>
            {apps.map((app) => (
              <option key={app.slug} value={app.slug}>
                {app.name}
              </option>
            ))}
          </select>
          {apps.length === 0 && (
            <p className="text-xs text-[#909090] mt-2">
              公開済みアプリがない場合は{" "}
              <Link href={`/publish?request=${requestSlug}`} className="text-[#1B4F72] underline">
                ファイルをアップロード
              </Link>
              できます。
            </p>
          )}
        </Field>
      )}

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <Field label="説明">
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="input resize-none" />
        </Field>
        <Field label="使い方">
          <textarea value={usageGuide} onChange={(event) => setUsageGuide(event.target.value)} rows={3} className="input resize-none" />
        </Field>
        <Field label="できること">
          <textarea value={canDo} onChange={(event) => setCanDo(event.target.value)} rows={3} className="input resize-none" />
        </Field>
        <Field label="できないこと">
          <textarea value={cannotDo} onChange={(event) => setCannotDo(event.target.value)} rows={3} className="input resize-none" />
        </Field>
        <Field label="扱うデータ">
          <textarea value={dataHandled} onChange={(event) => setDataHandled(event.target.value)} rows={3} className="input resize-none" />
        </Field>
        <Field label="推奨環境">
          <input value={recommendedEnvironment} onChange={(event) => setRecommendedEnvironment(event.target.value)} className="input" placeholder="PC Chrome / スマホ対応など" />
        </Field>
        <Field label="バージョンメモ">
          <input value={versionNote} onChange={(event) => setVersionNote(event.target.value)} className="input" />
        </Field>
        <Field label="注意事項">
          <input value={cautionNote} onChange={(event) => setCautionNote(event.target.value)} className="input" />
        </Field>
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <label className="flex items-center gap-2 text-sm text-[#606060]">
          <input
            type="checkbox"
            checked={externalCommunication}
            onChange={(event) => setExternalCommunication(event.target.checked)}
            className="accent-[#1B4F72]"
          />
          外部通信あり
        </label>
        <label className="flex items-center gap-2 text-sm text-[#606060]">
          <input
            type="checkbox"
            checked={dataStorage}
            onChange={(event) => setDataStorage(event.target.checked)}
            className="accent-[#1B4F72]"
          />
          データ保存あり
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-5">
        <button
          onClick={submit}
          disabled={!canSubmit || submitting}
          className="px-4 py-2 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] disabled:opacity-50 transition-colors cursor-pointer"
        >
          {submitting ? "投稿中..." : "アプリで回答する"}
        </button>
        <Link
          href={`/publish?request=${requestSlug}`}
          className="text-sm text-[#1B4F72] hover:underline"
        >
          HTML/ZIPをアップロードして回答
        </Link>
      </div>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
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
