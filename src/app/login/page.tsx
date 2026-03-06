"use client";

import { useState } from "react";
import { createAuthBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    const supabase = createAuthBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

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
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-[#0f0f0f] mb-2">
              ログイン
            </h1>
            <p className="text-[#606060] mb-6">
              アカウントにログインして、アプリを公開しましょう。
            </p>

            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-white border border-[#e5e5e5] text-[#0f0f0f] font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Googleでログイン
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[#e5e5e5]" />
              <span className="text-sm text-[#909090]">または</span>
              <div className="flex-1 h-px bg-[#e5e5e5]" />
            </div>

            {/* Magic Link */}
            <form onSubmit={handleSubmit}>
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
                className="w-full mt-4 py-3 rounded-lg bg-[#1B4F72] text-white font-semibold hover:bg-[#15415F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "送信中..." : "ログインリンクを送信"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
