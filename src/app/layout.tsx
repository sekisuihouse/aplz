import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase-server";
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
  title: "aplz — AIで作ったアプリを公開",
  description:
    "HTMLやZIPをアップロードして即座に公開。コミュニティからフィードバックを集めよう。",
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

  return (
    <html lang="ja">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-white text-[#0f0f0f]`}
      >
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-[#e5e5e5]">
          <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 h-16">
            <div className="flex items-center gap-2">
              <WorkspaceSwitcher />
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#22d3ee]/10 text-[#22d3ee] uppercase tracking-wider">
                beta
              </span>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    href="/publish"
                    className="px-4 py-2 rounded-lg bg-[#22d3ee] text-black text-sm font-medium hover:bg-[#06b6d4] transition-colors"
                  >
                    アプリを公開
                  </Link>
                  <NavUser email={user.email ?? ""} />
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
                    href="/publish"
                    className="px-4 py-2 rounded-lg bg-[#22d3ee] text-black text-sm font-medium hover:bg-[#06b6d4] transition-colors"
                  >
                    アプリを公開
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        {children}
        <footer className="border-t border-[#e5e5e5] py-8 text-center">
          <p className="text-sm text-[#909090]">
            <span className="font-semibold text-[#22d3ee]">aplz</span>
            {" "}— AIで作ったアプリの集まる場所
          </p>
        </footer>
      </body>
    </html>
  );
}
