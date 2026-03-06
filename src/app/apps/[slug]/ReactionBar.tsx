"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, Bookmark, Sparkles, MessageSquarePlus } from "lucide-react";
import type { ReactionType } from "@/lib/utils";

const REACTIONS: {
  type: ReactionType;
  label: string;
  icon: typeof ThumbsUp;
  color: string;
  bgActive: string;
  borderActive: string;
}[] = [
  { type: "like", label: "いいね", icon: ThumbsUp, color: "text-[#065fd4]", bgActive: "bg-[#065fd4]/10", borderActive: "border-[#065fd4]" },
  { type: "want", label: "使いたい", icon: Bookmark, color: "text-[#ea580c]", bgActive: "bg-[#ea580c]/10", borderActive: "border-[#ea580c]" },
  { type: "amazing", label: "すごい", icon: Sparkles, color: "text-[#7c3aed]", bgActive: "bg-[#7c3aed]/10", borderActive: "border-[#7c3aed]" },
  { type: "feedback", label: "改善点あり", icon: MessageSquarePlus, color: "text-[#059669]", bgActive: "bg-[#059669]/10", borderActive: "border-[#059669]" },
];

interface Props {
  appId: string;
  initialReactions: Record<string, number>;
}

export default function ReactionBar({ appId, initialReactions }: Props) {
  const [reactions, setReactions] = useState(initialReactions);
  const [clicked, setClicked] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reactions?app_id=${appId}`)
      .then((r) => r.json())
      .then((data: { counts: Record<string, number>; userReactions: string[] }) => {
        if (data.counts) setReactions(data.counts);
        if (data.userReactions) setClicked(new Set(data.userReactions));
      })
      .catch(() => {});
  }, [appId]);

  const handleReact = async (type: string) => {
    if (sending) return;
    setSending(type);

    const isActive = clicked.has(type);

    // Optimistic update
    if (isActive) {
      setReactions((prev) => ({ ...prev, [type]: Math.max(0, (prev[type] || 0) - 1) }));
      setClicked((prev) => { const s = new Set(prev); s.delete(type); return s; });
    } else {
      setReactions((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
      setClicked((prev) => new Set(prev).add(type));
    }

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId, emoji: type }),
      });
      if (!res.ok) {
        // Rollback
        if (isActive) {
          setReactions((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
          setClicked((prev) => new Set(prev).add(type));
        } else {
          setReactions((prev) => ({ ...prev, [type]: Math.max(0, (prev[type] || 1) - 1) }));
          setClicked((prev) => { const s = new Set(prev); s.delete(type); return s; });
        }
      }
    } catch {
      // Rollback
      if (isActive) {
        setReactions((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
        setClicked((prev) => new Set(prev).add(type));
      } else {
        setReactions((prev) => ({ ...prev, [type]: Math.max(0, (prev[type] || 1) - 1) }));
        setClicked((prev) => { const s = new Set(prev); s.delete(type); return s; });
      }
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap mb-8 animate-fade-in">
      {REACTIONS.map(({ type, label, icon: Icon, color, bgActive, borderActive }) => {
        const isActive = clicked.has(type);
        const count = reactions[type] || 0;
        return (
          <button
            key={type}
            onClick={() => handleReact(type)}
            disabled={sending !== null}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm transition-all disabled:opacity-60 cursor-pointer ${
              isActive
                ? `${bgActive} ${color} ${borderActive}`
                : "bg-white text-[#606060] border-[#e5e5e5] hover:bg-gray-50"
            }`}
          >
            <Icon size={16} />
            <span>{label}</span>
            {count > 0 && (
              <span className="font-mono text-xs">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
