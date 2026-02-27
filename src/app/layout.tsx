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
  title: "aplz — Publish AI Apps Instantly",
  description:
    "Upload your HTML or ZIP and get a live URL. Collect feedback from the community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#0a0a0b] text-gray-100`}
      >
        <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0a0a0b]/80 border-b border-[#2a2a2e]">
          <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#22d3ee]">aplz</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#22d3ee]/15 text-[#22d3ee] uppercase tracking-wider">
                beta
              </span>
            </Link>
            <Link
              href="/publish"
              className="px-4 py-2 rounded-lg bg-[#22d3ee] text-black text-sm font-semibold hover:bg-[#06b6d4] transition-colors"
            >
              Publish App
            </Link>
          </nav>
        </header>
        {children}
        <footer className="border-t border-[#2a2a2e] py-8 text-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-[#22d3ee]">aplz</span>
            {" "}— the home for AI-built apps
          </p>
        </footer>
      </body>
    </html>
  );
}
