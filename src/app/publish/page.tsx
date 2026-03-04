"use client";

import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Upload } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";

interface PublishResult {
  app_id: string;
  slug: string;
  app_url: string;
  platform_url: string;
  edit_token: string;
}

interface Community {
  id: string;
  name: string;
  slug: string;
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

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!communitySlug) return;
    const supabase = createBrowserClient();
    supabase
      .from("communities")
      .select("id, name, slug")
      .eq("slug", communitySlug)
      .single()
      .then(({ data }) => {
        if (data) setCommunity(data);
      });
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
      if (community) {
        formData.append("community_id", community.id);
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
    setResult(null);
    setError("");
  };

  if (result) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#141416] border border-[#1e1e22] rounded-xl p-8 animate-fade-in">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#e4e4e7]">
              公開しました！
            </h2>
            <p className="text-zinc-500 mt-1">アプリが公開されました</p>
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
            <ResultRow
              label="編集トークン"
              value={result.edit_token}
              copied={copied === "edit_token"}
              onCopy={() => copyToClipboard(result.edit_token, "edit_token")}
              mono
            />
          </div>

          <p className="text-xs text-zinc-600 mt-4">
            編集トークンを保存してください。アプリの更新・削除に必要です。
          </p>

          <button
            onClick={reset}
            className="w-full mt-6 py-3 rounded-lg bg-[#22d3ee] text-black font-semibold hover:bg-[#06b6d4] transition-colors cursor-pointer"
          >
            もう一つ公開する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <h1 className="text-3xl font-bold text-[#e4e4e7] mb-2">
          アプリを公開
        </h1>
        <p className="text-zinc-500 mb-8">
          ZIPまたはHTMLファイルをアップロードして、すぐに公開できます。
        </p>

        {community && (
          <div className="mb-6 px-4 py-3 bg-white/5 border border-[#1e1e22] rounded-lg">
            <p className="text-sm text-zinc-400">
              <span className="text-[#e4e4e7] font-medium">
                {community.name}
              </span>{" "}
              に公開
            </p>
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
            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
            ${
              dragging
                ? "border-zinc-500 bg-white/5"
                : file
                  ? "border-zinc-600 bg-[#141416]"
                  : "border-[#1e1e22] bg-[#141416] hover:border-[#2a2a2e]"
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
              <Upload size={20} className="mx-auto mb-2 text-zinc-400" />
              <p className="text-[#e4e4e7] font-medium">{file.name}</p>
              <p className="text-zinc-500 text-sm mt-1">
                {(file.size / 1024).toFixed(1)} KB
                — クリックまたはドラッグで変更
              </p>
            </div>
          ) : (
            <div>
              <Upload size={24} className="mx-auto mb-3 text-zinc-500" />
              <p className="text-zinc-300">
                ファイルをドラッグ&ドロップ
              </p>
              <p className="text-zinc-600 text-sm mt-2">
                ZIPまたはHTMLファイル
              </p>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">
              アプリ名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="アプリの名前"
              className="w-full bg-[#141416] border border-[#1e1e22] rounded-lg px-4 py-2.5 text-[#e4e4e7] placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">
              説明 <span className="text-zinc-600">（任意）</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="アプリの説明"
              rows={3}
              className="w-full bg-[#141416] border border-[#1e1e22] rounded-lg px-4 py-2.5 text-[#e4e4e7] placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePublish}
          disabled={!file || publishing}
          className="w-full mt-6 py-3 rounded-lg bg-[#22d3ee] text-black font-semibold hover:bg-[#06b6d4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {publishing ? "公開中..." : "公開する"}
        </button>
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
      <label className="block text-xs text-zinc-500 mb-1">{label}</label>
      <div className="flex items-center gap-2 bg-[#0a0a0b] border border-[#1e1e22] rounded-lg px-3 py-2">
        <span
          className={`flex-1 text-sm truncate ${mono ? "font-mono text-zinc-300" : "text-[#e4e4e7]"}`}
        >
          {value}
        </span>
        <button
          onClick={onCopy}
          className="shrink-0 text-xs px-2 py-1 rounded bg-white/10 text-zinc-300 hover:bg-white/15 transition-colors cursor-pointer"
        >
          {copied ? "コピー済み" : "コピー"}
        </button>
      </div>
    </div>
  );
}
