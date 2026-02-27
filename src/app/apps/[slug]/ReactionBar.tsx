"use client";

import { useState } from "react";
import { REACTION_EMOJIS } from "@/lib/utils";

interface Props {
  appId: string;
  initialReactions: Record<string, number>;
}

export default function ReactionBar({ appId, initialReactions }: Props) {
  const [reactions, setReactions] = useState(initialReactions);
  const [sending, setSending] = useState<string | null>(null);

  const handleReact = async (emoji: string) => {
    if (sending) return;
    setSending(emoji);

    // Optimistic update
    setReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId, emoji }),
      });
      if (!res.ok) {
        // Revert
        setReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] || 1) - 1 }));
      }
    } catch {
      // Revert
      setReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] || 1) - 1 }));
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-8 animate-fade-in">
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleReact(emoji)}
          disabled={sending !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2a2a2e] bg-[#141416] hover:border-[#22d3ee]/50 transition-colors disabled:opacity-60 cursor-pointer"
        >
          <span className="text-lg">{emoji}</span>
          {reactions[emoji] > 0 && (
            <span className="text-xs font-mono text-gray-400">
              {reactions[emoji]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
