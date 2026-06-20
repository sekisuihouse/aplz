"use client";

import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Upload } from "lucide-react";

interface PublishResult {
  app_id: string;
  slug: string;
  app_url: string;
  platform_url: string;
  solution_id?: string | null;
}

interface Community {
  id: string;
  name: string;
  slug: string;
}

interface CommunitySelection {
  community: Community;
  selected: boolean;
}

export default function PublishPage() {
  return (
    <Suspense>
      <PublishForm />
    </Suspense>
  );
}

function PublishForm() {
  const searchParams = useSearchParams();
  const communitySlug = searchParams.get("community");
  const requestSlug = searchParams.get("request");

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [communitySelections, setCommunitySelections] = useState<CommunitySelection[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/communities?mine=true")
      .then((r) => r.json())
      .then((data: Community[]) => {
        const selections = data.map((c) => ({
          community: c,
          selected: c.slug === communitySlug,
        }));
        setCommunitySelections(selections);
        const preselected = data.find((c) => c.slug === communitySlug);
        if (preselected) {
          setSelectedCommunityId(preselected.id);
        }
      })
      .catch(() => {});
  }, [communitySlug]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) {
        setFile(dropped);
        if (!name) {
          setName(dropped.name.replace(/\.(zip|html)$/i, ""));
        }
      }
    },
    [name]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!name) {
        setName(selected.name.replace(/\.(zip|html)$/i, ""));
      }
    }
  };

  const handlePublish = async () => {
    if (!file) return;
    setPublishing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name || "Untitled App");
      formData.append("description", description);
      formData.append("is_public", isPublic ? "true" : "false");
      if (selectedCommunityId) {
        formData.append("community_id", selectedCommunityId);
      }
      if (requestSlug) {
        formData.append("request", requestSlug);
      }

      const res = await fetch("/api/publish", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "公開に失敗しました");
        return;
      }

      setResult(data);
    } catch {
      setError("ネットワークエラーが発生しました。もう一度お試しください。");
    } finally {
      setPublishing(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const reset = () => {
    setFile(null);
    setName("");
    setDescription("");
    setIsPublic(true);
    setSelectedCommunityId(null);
    setCommunitySelections((prev) => prev.map((s) => ({ ...s, selected: false })));
    setResult(null);
    setError("");
  };

  if (result) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white border border-[#e5e5e5] rounded-xl p-8 animate-fade-in">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#0f0f0f]">
              公開しました！
            </h2>
            <p className="text-[#606060] mt-1">アプリが公開されました</p>
            {result.solution_id && (
              <p className="text-sm text-[#1B4F72] mt-2">
                困りごとへの回答として紐づけました
              </p>
            )}
          </div>

          <div className="space-y-4">
            <ResultRow
              label="アプリURL"
              value={result.app_url}
              copied={copied === "app_url"}
              onCopy={() => copyToClipboard(result.app_url, "app_url")}
            />
            <ResultRow
              label="フィードバックページ"
              value={result.platform_url}
              copied={copied === "platform_url"}
              onCopy={() =>
                copyToClipboard(result.platform_url, "platform_url")
              }
            />
          </div>

          <button
            onClick={reset}
            className="w-full mt-6 py-3 rounded-lg bg-[#1B4F72] text-white font-semibold hover:bg-[#15415F] transition-colors cursor-pointer"
          >
            もう一つ公開する
          </button>
          <div className="text-center">
            <Link
              href={requestSlug ? `/requests/${requestSlug}` : "/"}
              className="text-[#606060] underline text-sm mt-2 inline-block"
            >
              {requestSlug ? "困りごとに戻る" : "ホームに戻る"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <h1 className="text-3xl font-bold text-[#0f0f0f] mb-2">
          アプリを公開
        </h1>
        <p className="text-[#606060] mb-8">
          ZIPまたはHTMLファイルをアップロードして、すぐに公開できます。
        </p>
        {requestSlug && (
          <div className="mb-6 p-3 rounded-lg bg-[#1B4F72]/10 text-[#1B4F72] text-sm">
            この公開は困りごと「{requestSlug}」へのアプリ回答として紐づきます。
          </div>
        )}

        {/* Publish Targets */}
        {communitySelections.length > 0 && (
          <div className="mb-6 space-y-2">
            <label className="block text-sm text-[#606060] mb-1.5">
              公開先
            </label>
            <label className="flex items-center gap-3 px-4 py-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg cursor-pointer hover:bg-[#ebebeb] transition-colors">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 accent-[#1B4F72]"
              />
              <span className="text-sm text-[#0f0f0f]">
                オープン（誰でも閲覧可）
              </span>
            </label>
            {communitySelections.map((cs) => (
              <label
                key={cs.community.id}
                className="flex items-center gap-3 px-4 py-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg cursor-pointer hover:bg-[#ebebeb] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={cs.selected}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setCommunitySelections((prev) =>
                      prev.map((s) =>
                        s.community.id === cs.community.id
                          ? { ...s, selected: checked }
                          : { ...s, selected: false }
                      )
                    );
                    setSelectedCommunityId(checked ? cs.community.id : null);
                  }}
                  className="w-4 h-4 accent-[#1B4F72]"
                />
                <span className="text-sm text-[#0f0f0f]">
                  {cs.community.name}（メンバー限定）
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
            ${
              dragging
                ? "border-[#909090] bg-[#f5f5f5]"
                : file
                  ? "border-[#e5e5e5] bg-[#f5f5f5]"
                  : "border-[#e5e5e5] bg-[#f5f5f5] hover:shadow-md"
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".zip,.html"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div>
              <Upload size={20} className="mx-auto mb-2 text-[#606060]" />
              <p className="text-[#0f0f0f] font-medium">{file.name}</p>
              <p className="text-[#909090] text-sm mt-1">
                {(file.size / 1024).toFixed(1)} KB
                — クリックまたはドラッグで変更
              </p>
            </div>
          ) : (
            <div>
              <Upload size={24} className="mx-auto mb-3 text-[#909090]" />
              <p className="text-[#0f0f0f]">
                ファイルをドラッグ&ドロップ
              </p>
              <p className="text-[#909090] text-sm mt-2">
                ZIPまたはHTMLファイル
              </p>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-[#606060] mb-1.5">
              アプリ名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="アプリの名前"
              className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-[#606060] mb-1.5">
              説明 <span className="text-[#909090]">（任意）</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="アプリの説明"
              rows={3}
              className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePublish}
          disabled={!file || publishing}
          className="w-full mt-6 py-3 rounded-lg bg-[#1B4F72] text-white font-semibold hover:bg-[#15415F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {publishing ? "公開中..." : "公開する"}
        </button>

        <div className="text-center text-sm text-[#909090] my-4">または</div>
        <Link
          href="/requests"
          className="block text-center text-sm text-[#1B4F72] hover:underline"
        >
          困りごと一覧を見る →
        </Link>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  copied,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-[#909090] mb-1">{label}</label>
      <div className="flex items-center gap-2 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-3 py-2">
        <span
          className={`flex-1 text-sm truncate ${mono ? "font-mono text-[#606060]" : "text-[#0f0f0f]"}`}
        >
          {value}
        </span>
        <button
          onClick={onCopy}
          className="shrink-0 text-xs px-2 py-1 rounded bg-[#e5e5e5] text-[#0f0f0f] hover:bg-[#d5d5d5] transition-colors cursor-pointer"
        >
          {copied ? "コピー済み" : "コピー"}
        </button>
      </div>
    </div>
  );
}
