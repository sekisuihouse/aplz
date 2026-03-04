import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#0a0a0b] text-gray-100`}
      >
        <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0a0a0b]/80 border-b border-[#1e1e22]">
          <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#22d3ee]">aplz</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#22d3ee]/15 text-[#22d3ee] uppercase tracking-wider">
                beta
              </span>
            </Link>
            <Link
              href="/publish"
              className="px-4 py-2 rounded-lg bg-[#22d3ee] text-black text-sm font-medium hover:bg-[#06b6d4] transition-colors"
            >
              アプリを公開
            </Link>
          </nav>
        </header>
        {children}
        <footer className="border-t border-[#1e1e22] py-8 text-center">
          <p className="text-sm text-zinc-600">
            <span className="font-semibold text-[#22d3ee]">aplz</span>
            {" "}— AIで作ったアプリの集まる場所
          </p>
        </footer>
      </body>
    </html>
  );
}
