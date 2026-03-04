"use client";

import { useState } from "react";
import { createAuthBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setError("");

    const supabase = createAuthBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {sent ? (
          <div className="text-center animate-fade-in">
            <h1 className="text-2xl font-bold text-[#0f0f0f] mb-3">
              メールを確認してください
            </h1>
            <p className="text-[#606060]">
              <span className="font-medium text-[#0f0f0f]">{email}</span>{" "}
              にログインリンクを送信しました。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="animate-fade-in">
            <h1 className="text-2xl font-bold text-[#0f0f0f] mb-2">
              ログイン
            </h1>
            <p className="text-[#606060] mb-6">
              メールアドレスにログインリンクを送信します。
            </p>

            <label className="block text-sm text-[#606060] mb-1.5">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors"
            />

            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full mt-4 py-3 rounded-lg bg-[#22d3ee] text-black font-semibold hover:bg-[#06b6d4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "送信中..." : "ログインリンクを送信"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
