"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createAuthBrowserClient } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

interface AppData {
  id: string;
  name: string;
  description: string;
  slug: string;
  version: number;
  last_published_at: string;
  user_id: string;
}

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [app, setApp] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createAuthBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: appData } = await supabase
        .from("apps")
        .select("id, name, description, slug, version, last_published_at, user_id")
        .eq("slug", slug)
        .single();

      if (!appData || appData.user_id !== user.id) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setApp(appData);
      setName(appData.name);
      setDescription(appData.description || "");
      setLoading(false);
    };
    load();
  }, [slug, router]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) setFile(dropped);
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleUpdate = async () => {
    if (!app) return;
    setUpdating(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("slug", slug);
      formData.append("name", name);
      formData.append("description", description);
      if (file) formData.append("file", file);

      const res = await fetch("/api/publish", {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "更新に失敗しました");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push(`/apps/${slug}`), 1500);
    } catch {
      setError("ネットワークエラーが発生しました。");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-[#909090]">読み込み中...</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#0f0f0f] mb-2">
            編集権限がありません
          </h1>
          <p className="text-[#606060]">
            このアプリの編集権限がありません。
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <h1 className="text-2xl font-bold text-[#0f0f0f] mb-2">
            更新しました！
          </h1>
          <p className="text-[#606060]">リダイレクトしています...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <h1 className="text-3xl font-bold text-[#0f0f0f] mb-2">
          「{app?.name}」を更新
        </h1>
        <div className="flex items-center gap-2 text-sm text-[#909090] mb-8">
          <span>現在のバージョン: v{app?.version ?? 1}</span>
          <span>・</span>
          <span>最終更新: {app?.last_published_at ? formatDate(app.last_published_at) : "—"}</span>
        </div>

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
                新しいファイルをドラッグ&ドロップ
              </p>
              <p className="text-[#909090] text-sm mt-2">
                ZIPまたはHTMLファイル（任意）
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
          onClick={handleUpdate}
          disabled={updating}
          className="w-full mt-6 py-3 rounded-lg bg-[#22d3ee] text-black font-semibold hover:bg-[#06b6d4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {updating ? "更新中..." : "更新する"}
        </button>
      </div>
    </div>
  );
}
