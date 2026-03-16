import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase-server";
import { createServerClient } from "@/lib/supabase";
import NavLogo from "./components/NavLogo";
import NavUser from "./components/NavUser";
import WorkspaceSwitcher from "./components/WorkspaceSwitcher";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APLZ — AIで作ったアプリを共有しよう",
  description:
    "AIで作ったWebアプリを公開してフィードバックをもらえるプラットフォーム",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-white text-[#0f0f0f]`}
      >
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-[#e5e5e5]">
          <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 h-16">
            <div className="flex items-center gap-3">
              <NavLogo />
              <WorkspaceSwitcher />
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    href="/new"
                    className="px-4 py-2 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] transition-colors"
                  >
                    アプリを作る
                  </Link>
                  <NavUser email={user.email ?? ""} avatarUrl={avatarUrl} displayName={displayName} />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-lg text-[#0f0f0f] text-sm font-medium hover:bg-[#f5f5f5] transition-colors"
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/new"
                    className="px-4 py-2 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] transition-colors"
                  >
                    アプリを作る
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        {children}
        <footer className="border-t border-[#e5e5e5] py-8 text-center">
          <p className="text-sm text-[#909090]">
            <span className="font-semibold text-[#1a1a1a]" style={{ fontFamily: "'Baloo 2', sans-serif" }}>APLZ</span>
            {" "}— AIで作ったアプリの集まる場所
          </p>
        </footer>
      </body>
    </html>
  );
}
