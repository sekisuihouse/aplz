"use client";

import { useState } from "react";
import { createAuthBrowserClient } from "@/lib/supabase";

type LoginMode = "signin" | "signup";

interface LoginClientProps {
  initialError: string;
  initialMode: LoginMode;
  nextPath: string;
}

export default function LoginClient({
  initialError,
  initialMode,
  nextPath,
}: LoginClientProps) {
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  const callbackUrl = () => {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  };

  const handleGoogle = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    const supabase = createAuthBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl(),
      },
    });
    if (authError) {
      setError("Googleログインは現在利用できません。メールリンクを使ってください。");
      setLoading(false);
    }
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
        emailRedirectTo: callbackUrl(),
        shouldCreateUser: mode === "signup",
      },
    });

    if (authError) {
      setError(
        mode === "signin"
          ? "このメールでログインできませんでした。初めて使う場合は「新規登録」から進んでください。"
          : authError.message
      );
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-[1fr_420px] gap-8 items-center">
        <aside className="hidden md:block">
          <p className="text-sm font-semibold text-[#1B4F72] mb-3">
            APLZを使い始める
          </p>
          <h1 className="text-3xl font-bold text-[#0f0f0f] leading-tight">
            困りごとは一言で投稿できます。
          </h1>
          <div className="mt-5 space-y-3">
            {[
              "初めてなら「新規登録」",
              "登録済みなら「ログイン」",
              "メールのリンクを開くと元の画面に戻ります",
            ].map((item, index) => (
              <div key={item} className="flex items-start gap-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-xs font-semibold text-[#1B4F72]">
                  {index + 1}
                </span>
                <p className="text-sm text-[#606060] pt-1">{item}</p>
              </div>
            ))}
          </div>
        </aside>

        <div>
        {sent ? (
          <div className="text-center animate-fade-in">
            <h1 className="text-2xl font-bold text-[#0f0f0f] mb-3">
              メールを確認してください
            </h1>
            <p className="text-[#606060]">
              <span className="font-medium text-[#0f0f0f]">{email}</span>{" "}
              に{mode === "signup" ? "登録リンク" : "ログインリンク"}を送信しました。
            </p>
            <p className="text-sm text-[#909090] mt-3">
              メール内のリンクを開くと、続きの画面に戻ります。
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0f0f0f] mb-2">
                {mode === "signup" ? "新規登録" : "ログイン"}
              </h1>
              <p className="text-[#606060]">
                {mode === "signup"
                  ? "メールだけで始められます。パスワードは不要です。"
                  : "登録済みのメールにログインリンクを送ります。"}
              </p>
              {nextPath !== "/" && (
                <p className="text-xs text-[#909090] mt-2">
                  認証後、開いていた画面に戻ります。
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#f5f5f5] mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                }}
                className={`py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  mode === "signin"
                    ? "bg-white text-[#0f0f0f] shadow-sm"
                    : "text-[#606060] hover:text-[#0f0f0f]"
                }`}
              >
                ログイン
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className={`py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  mode === "signup"
                    ? "bg-white text-[#0f0f0f] shadow-sm"
                    : "text-[#606060] hover:text-[#0f0f0f]"
                }`}
              >
                新規登録
              </button>
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-white border border-[#e5e5e5] text-[#0f0f0f] font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Googleで{mode === "signup" ? "登録" : "ログイン"}
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[#e5e5e5]" />
              <span className="text-sm text-[#909090]">または</span>
              <div className="flex-1 h-px bg-[#e5e5e5]" />
            </div>

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
              <p className="text-xs text-[#909090] mt-2">
                {mode === "signup"
                  ? "初めてのメールならアカウントを作成します。"
                  : "未登録のメールではログインできません。"}
              </p>

              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full mt-4 py-3 rounded-lg bg-[#1B4F72] text-white font-semibold hover:bg-[#15415F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading
                  ? "送信中..."
                  : mode === "signup"
                    ? "登録リンクを送信"
                    : "ログインリンクを送信"}
              </button>
            </form>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
