"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinCommunityPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ name: string; slug: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/communities/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
        return;
      }

      setSuccess({ name: data.name, slug: data.slug });
      setTimeout(() => router.push(`/c/${data.slug}`), 1500);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <h1 className="text-2xl font-bold text-[#0f0f0f] mb-2">
            参加しました！
          </h1>
          <p className="text-[#606060]">
            <span className="font-medium text-[#0f0f0f]">{success.name}</span> にリダイレクトしています...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <h1 className="text-2xl font-bold text-[#0f0f0f] mb-2">
          コミュニティに参加
        </h1>
        <p className="text-[#606060] mb-6">
          招待コードを入力してください
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="招待コード"
            className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors font-mono tracking-wider"
          />

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full mt-4 py-3 rounded-lg bg-[#1B4F72] text-white font-semibold hover:bg-[#15415F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "参加中..." : "参加する"}
          </button>
        </form>

        <p className="text-xs text-[#909090] mt-4">
          招待コードはコミュニティの管理者から受け取ってください。
        </p>
      </div>
    </div>
  );
}
