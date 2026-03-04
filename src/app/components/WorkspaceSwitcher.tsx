"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

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

  // Determine active workspace from pathname
  const communitySlug = pathname.startsWith("/c/")
    ? pathname.split("/")[2]
    : null;
  const activeCommunity = communities.find((c) => c.slug === communitySlug);
  const label = activeCommunity?.name ?? "aplz";

  useEffect(() => {
    fetch("/api/communities")
      .then((r) => r.json())
      .then((data) => setCommunities(data))
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xl font-bold text-[#22d3ee] hover:opacity-80 transition-opacity cursor-pointer"
      >
        {label}
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-[#e5e5e5] rounded-lg shadow-lg py-1 z-50">
          <Link
            href="/"
            className={`block px-4 py-2.5 text-sm transition-colors ${
              !communitySlug
                ? "text-[#22d3ee] font-medium bg-[#f5f5f5]"
                : "text-[#0f0f0f] hover:bg-[#f5f5f5]"
            }`}
          >
            すべてのアプリ
          </Link>

          {communities.length > 0 && (
            <div className="border-t border-[#e5e5e5] my-1" />
          )}

          {communities.map((c) => (
            <Link
              key={c.id}
              href={`/c/${c.slug}`}
              className={`block px-4 py-2.5 text-sm transition-colors ${
                communitySlug === c.slug
                  ? "text-[#22d3ee] font-medium bg-[#f5f5f5]"
                  : "text-[#0f0f0f] hover:bg-[#f5f5f5]"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
