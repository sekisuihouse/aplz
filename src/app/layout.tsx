import type { Metadata } from "next";
import { Baloo_2, DM_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase-server";
import { createServerClient } from "@/lib/supabase";
import NavLogo from "./components/NavLogo";
import NavUser from "./components/NavUser";
import WorkspaceSwitcher from "./components/WorkspaceSwitcher";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aplz.dev";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const baloo2 = Baloo_2({
  variable: "--font-baloo-2",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: "APLZ",
  title: {
    default: "APLZ — 小さな困りごとを小さなアプリで解決",
    template: "%s",
  },
  description:
    "APLZは、町内会・学校・個人事業主・イベント運営などの日常の小さな困りごとを投稿し、開発者が小さなWebアプリで解決するプラットフォームです。",
  keywords: [
    "APLZ",
    "小さな業務アプリ",
    "困りごと 解決",
    "業務改善",
    "当番表 アプリ",
    "集計 アプリ",
    "個人事業主 業務改善",
  ],
  authors: [{ name: "APLZ" }],
  creator: "APLZ",
  publisher: "APLZ",
  alternates: {
    canonical: appUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "APLZ — 小さな困りごとを小さなアプリで解決",
    description:
      "町内会・学校・個人事業主・イベント運営などの日常の小さな困りごとを投稿し、小さなWebアプリで解決する場所です。",
    url: appUrl,
    siteName: "APLZ",
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/ogp.png", width: 1200, height: 630, alt: "APLZ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "APLZ — 小さな困りごとを小さなアプリで解決",
    description:
      "日常の小さな困りごとを投稿し、小さなWebアプリで解決する場所です。",
    images: ["/ogp.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let displayName: string | null = null;
  if (user) {
    const db = createServerClient();
    const { data: profile } = await db
      .from("profiles")
      .select("avatar_url, display_name")
      .eq("id", user.id)
      .single();
    if (profile) {
      avatarUrl = profile.avatar_url;
      displayName = profile.display_name;
    }
  }

  return (
    <html lang="ja">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} ${baloo2.variable} font-sans antialiased bg-white text-[#0f0f0f]`}
      >
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-[#e5e5e5]">
          <nav className="max-w-[1800px] mx-auto flex items-center justify-between gap-3 px-4 h-16">
            <div className="flex items-center gap-3">
              <NavLogo />
              <WorkspaceSwitcher />
              <Link
                href="/requests"
                className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-sm text-[#606060] hover:text-[#0f0f0f] hover:bg-[#f5f5f5] transition-colors"
              >
                困りごとを見る
              </Link>
              <Link
                href="/templates"
                className="hidden md:inline-flex px-3 py-1.5 rounded-lg text-sm text-[#606060] hover:text-[#0f0f0f] hover:bg-[#f5f5f5] transition-colors"
              >
                テンプレート
              </Link>
              <Link
                href="/apps"
                className="hidden lg:inline-flex px-3 py-1.5 rounded-lg text-sm text-[#606060] hover:text-[#0f0f0f] hover:bg-[#f5f5f5] transition-colors"
              >
                アプリ
              </Link>
              <Link
                href="/use-cases"
                className="hidden lg:inline-flex px-3 py-1.5 rounded-lg text-sm text-[#606060] hover:text-[#0f0f0f] hover:bg-[#f5f5f5] transition-colors"
              >
                用途別
              </Link>
              <Link
                href="/articles"
                className="hidden lg:inline-flex px-3 py-1.5 rounded-lg text-sm text-[#606060] hover:text-[#0f0f0f] hover:bg-[#f5f5f5] transition-colors"
              >
                記事
              </Link>
              <Link
                href="/tools"
                className="hidden xl:inline-flex px-3 py-1.5 rounded-lg text-sm text-[#606060] hover:text-[#0f0f0f] hover:bg-[#f5f5f5] transition-colors"
              >
                ツール
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  <Link
                    href="/requests/new"
                    className="inline-flex min-h-10 items-center px-3 sm:px-4 py-2 rounded-lg bg-[#1B4F72] text-white text-sm font-semibold hover:bg-[#15415F] transition-colors"
                  >
                    困りごとを書く
                  </Link>
                  <Link
                    href="/new"
                    className="hidden md:inline-flex min-h-10 items-center px-3 py-2 rounded-lg border border-[#e5e5e5] text-[#606060] text-sm font-medium hover:bg-[#f5f5f5] transition-colors"
                  >
                    アプリを作る
                  </Link>
                  <NavUser email={user.email ?? ""} avatarUrl={avatarUrl} displayName={displayName} />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex min-h-10 items-center px-3 py-2 rounded-lg text-[#0f0f0f] text-sm font-medium hover:bg-[#f5f5f5] transition-colors"
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/requests/new"
                    className="inline-flex min-h-10 items-center px-3 sm:px-4 py-2 rounded-lg bg-[#1B4F72] text-white text-sm font-semibold hover:bg-[#15415F] transition-colors"
                  >
                    困りごとを書く
                  </Link>
                  <Link
                    href="/new"
                    className="hidden md:inline-flex min-h-10 items-center px-3 py-2 rounded-lg border border-[#e5e5e5] text-[#606060] text-sm font-medium hover:bg-[#f5f5f5] transition-colors"
                  >
                    アプリを作る
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        {children}
        <footer className="border-t border-[#e5e5e5] py-8">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-sm text-[#909090]">
              <span className="font-semibold text-[#1a1a1a]" style={{ fontFamily: "var(--font-baloo-2)" }}>APLZ</span>
              {" "}— 小さな困りごとを小さなアプリで解決する場所
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-[#606060]">
              <Link href="/requests" className="hover:text-[#0f0f0f]">困りごと</Link>
              <Link href="/apps" className="hover:text-[#0f0f0f]">アプリ</Link>
              <Link href="/use-cases" className="hover:text-[#0f0f0f]">用途別</Link>
              <Link href="/articles" className="hover:text-[#0f0f0f]">記事</Link>
              <Link href="/tools" className="hover:text-[#0f0f0f]">ツール</Link>
              <Link href="/templates" className="hover:text-[#0f0f0f]">テンプレート</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
