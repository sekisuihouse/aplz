"use client";

import { useState } from "react";

interface Props {
  appId: string;
  initialAverages: { usability: number; design: number; idea: number };
  initialCount: number;
}

const AXES = [
  { key: "usability" as const, label: "使いやすさ" },
  { key: "design" as const, label: "デザイン" },
  { key: "idea" as const, label: "アイデア" },
];

function StarDisplay({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= rounded ? "text-amber-400" : "text-zinc-600"}
        >
          {i <= rounded ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <span
      className="inline-flex gap-0.5"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = hovered ? i <= hovered : i <= value;
        return (
          <button
            key={i}
            type="button"
            className={`text-2xl cursor-pointer transition-colors duration-150 ${
              filled
                ? hovered
                  ? "text-amber-300"
                  : "text-amber-400"
                : "text-zinc-600"
            }`}
            onMouseEnter={() => setHovered(i)}
            onClick={() => onChange(i)}
          >
            {filled ? "★" : "☆"}
          </button>
        );
      })}
    </span>
  );
}

export default function RatingSection({
  appId,
  initialAverages,
  initialCount,
}: Props) {
  const [averages, setAverages] = useState(initialAverages);
  const [count, setCount] = useState(initialCount);
  const [ratings, setRatings] = useState({ usability: 0, design: 0, idea: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const allSelected =
    ratings.usability > 0 && ratings.design > 0 && ratings.idea > 0;

  const handleSubmit = async () => {
    if (!allSelected || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: appId,
          usability: ratings.usability,
          design: ratings.design,
          idea: ratings.idea,
        }),
      });

      if (res.ok) {
        // Optimistic update
        const newCount = count + 1;
        setAverages({
          usability:
            (averages.usability * count + ratings.usability) / newCount,
          design: (averages.design * count + ratings.design) / newCount,
          idea: (averages.idea * count + ratings.idea) / newCount,
        });
        setCount(newCount);
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const overallAvg =
    count > 0
      ? (averages.usability + averages.design + averages.idea) / 3
      : 0;

  return (
    <div className="bg-[#141416] border border-[#2a2a2e] rounded-xl p-6 mb-8 animate-fade-in">
      {/* Average scores */}
      <h2 className="text-lg font-bold text-white mb-4">Rate this app</h2>

      {count > 0 ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <StarDisplay value={overallAvg} />
            <span className="text-white font-bold text-lg">
              {overallAvg.toFixed(1)}
            </span>
            <span className="text-gray-400 text-sm">
              平均 ({count}件の評価)
            </span>
          </div>

          <div className="space-y-2">
            {AXES.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-gray-300 text-sm w-24">{label}</span>
                <StarDisplay value={averages[key]} />
                <span className="text-gray-400 text-sm">
                  {averages[key].toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-400 mb-6">
          まだ評価がありません。最初の評価をしてみましょう！
        </p>
      )}

      {/* Rating form */}
      {submitted ? (
        <div className="text-center py-4">
          <p className="text-green-400 font-medium">ありがとうございます！</p>
          <p className="text-gray-500 text-sm mt-1">評価済み ✓</p>
        </div>
      ) : (
        <div className="border-t border-[#2a2a2e] pt-5">
          <h3 className="text-sm font-bold text-gray-300 mb-4">
            あなたの評価
          </h3>

          <div className="space-y-3 mb-5">
            {AXES.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-gray-300 text-sm w-24">{label}</span>
                <StarInput
                  value={ratings[key]}
                  onChange={(v) =>
                    setRatings((prev) => ({ ...prev, [key]: v }))
                  }
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!allSelected || submitting}
            className="px-5 py-2 rounded-lg bg-[#22d3ee] text-black font-medium text-sm hover:bg-[#06b6d4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "送信中..." : "評価を送信"}
          </button>
        </div>
      )}
    </div>
  );
}
