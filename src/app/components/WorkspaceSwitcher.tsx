"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
}

export default function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  const communitySlug = pathname.startsWith("/c/")
    ? pathname.split("/")[2]
    : null;
  const activeCommunity = communities.find((c) => c.slug === communitySlug);
  const label = activeCommunity?.name ?? "オープン";

  useEffect(() => {
    fetch("/api/communities?mine=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCommunities(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#0f0f0f] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
      >
        {label}
        <ChevronDown size={14} className={`text-[#909090] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#e5e5e5] rounded-lg shadow-lg py-1 z-50">
          <Link
            href="/"
            className={`block px-4 py-2.5 text-sm transition-colors ${
              !communitySlug
                ? "text-[#1B4F72] font-medium bg-[#1B4F72]/10"
                : "text-[#0f0f0f] hover:bg-[#f5f5f5]"
            }`}
          >
            オープン（誰でも閲覧可）
          </Link>

          {communities.length > 0 && (
            <>
              <div className="border-t border-[#e5e5e5] my-1" />
              <p className="px-4 py-1.5 text-xs text-[#909090]">あなたのコミュニティ</p>
              {communities.map((c) => (
                <Link
                  key={c.id}
                  href={`/c/${c.slug}`}
                  className={`block px-4 py-2.5 text-sm transition-colors ${
                    communitySlug === c.slug
                      ? "text-[#1B4F72] font-medium bg-[#1B4F72]/10"
                      : "text-[#0f0f0f] hover:bg-[#f5f5f5]"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </>
          )}

          <div className="border-t border-[#e5e5e5] my-1" />
          <Link
            href="/c/join"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#606060] hover:bg-[#f5f5f5] transition-colors"
          >
            <Plus size={14} />
            コミュニティに参加
          </Link>
        </div>
      )}
    </div>
  );
}
