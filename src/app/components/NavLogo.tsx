"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavLogo() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const getHomeUrl = () => {
    // /c/xxx にいる場合 → そのコミュニティトップ
    const communityMatch = pathname.match(/^\/c\/([^/]+)/);
    if (communityMatch) return `/c/${communityMatch[1]}`;

    // /apps/[slug] で from パラメータがある場合 → そのコミュニティトップ
    if (pathname.startsWith("/apps/") && from) return `/c/${from}`;

    return "/";
  };

  return (
    <Link href={getHomeUrl()} className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 36 36" className="flex-shrink-0">
        <g transform="translate(18,18)">
          <path d="M-13,-9 C-3,-9 3,9 13,9" fill="none" stroke="#1B4F72" strokeWidth="2.8" strokeLinecap="round"/>
          <path d="M-13,9 C-3,9 3,-9 13,-9" fill="none" stroke="#B83232" strokeWidth="2.8" strokeLinecap="round"/>
          <circle cx="0" cy="0" r="2.2" fill="#1B4F72"/>
        </g>
      </svg>
      <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: '22px', color: '#1a1a1a', letterSpacing: '0.5px' }}>
        APLZ
      </span>
    </Link>
  );
}
