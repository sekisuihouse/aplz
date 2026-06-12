"use client";

import { useState } from "react";
import { FEEDBACK_LABELS, FEEDBACK_TYPES, type FeedbackType } from "@/lib/request-platform";

interface FeedbackButtonsProps {
  solutionId: string;
  initialCounts?: Record<string, number>;
}

export default function FeedbackButtons({
  solutionId,
  initialCounts = {},
}: FeedbackButtonsProps) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [message, setMessage] = useState("");
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const sendFeedback = async (feedbackType: FeedbackType) => {
    if (loadingType) return;
    setLoadingType(feedbackType);
    setMessage("");
    try {
      const res = await fetch(`/api/solutions/${solutionId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback_type: feedbackType }),
      });
      if (res.status === 401) {
        setMessage("ログインすると反応できます");
        return;
      }
      if (!res.ok) {
        setMessage("反応を保存できませんでした");
        return;
      }
      setCounts((prev) => ({
        ...prev,
        [feedbackType]: Math.max(prev[feedbackType] ?? 0, (prev[feedbackType] ?? 0) + 1),
      }));
      setMessage("保存しました");
    } catch {
      setMessage("通信エラーが発生しました");
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FEEDBACK_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => sendFeedback(type)}
            disabled={loadingType !== null}
            className="px-2.5 py-1.5 rounded-lg border border-[#e5e5e5] text-xs text-[#606060] hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {FEEDBACK_LABELS[type]}
            {(counts[type] ?? 0) > 0 && (
              <span className="ml-1 text-[#909090]">{counts[type]}</span>
            )}
          </button>
        ))}
      </div>
      {message && <p className="text-xs text-[#909090] mt-2">{message}</p>}
    </div>
  );
}
