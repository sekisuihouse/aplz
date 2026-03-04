"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createAuthBrowserClient } from "@/lib/supabase";

interface Props {
  email: string;
}

export default function NavUser({ email }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    const supabase = createAuthBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  const initial = email.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-[#22d3ee] text-black font-semibold text-sm flex items-center justify-center hover:bg-[#06b6d4] transition-colors cursor-pointer"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-56 bg-white border border-[#e5e5e5] rounded-lg shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-[#e5e5e5]">
            <p className="text-xs text-[#909090] truncate">{email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 text-sm text-[#0f0f0f] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
