"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestCommentForm({ requestSlug }: { requestSlug: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [commentType, setCommentType] = useState("comment");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/requests/${requestSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, comment_type: commentType }),
      });
      if (res.status === 401) {
        router.push(`/login?mode=signup&next=/requests/${requestSlug}`);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "コメントに失敗しました");
        return;
      }
      setBody("");
      setCommentType("comment");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const placeholder =
    commentType === "question"
      ? "例: 入力する人数の上限はありますか？スマホでも使いますか？"
      : commentType === "answer"
        ? "例: そこは毎月10人前後です。スマホでも使えると助かります。"
        : "例: 補足です。今はExcelで管理しています。";

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-4">
      <div className="flex flex-wrap gap-2 mb-3">
        <TypeButton active={commentType === "question"} onClick={() => setCommentType("question")}>
          質問する
        </TypeButton>
        <TypeButton active={commentType === "answer"} onClick={() => setCommentType("answer")}>
          返答する
        </TypeButton>
        <TypeButton active={commentType === "comment"} onClick={() => setCommentType("comment")}>
          補足する
        </TypeButton>
      </div>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value.slice(0, 2000))}
        rows={3}
        placeholder={placeholder}
        className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm placeholder:text-[#909090] focus:outline-none focus:border-[#1B4F72] transition-colors resize-none"
      />
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <button
        onClick={submit}
        disabled={!body.trim() || submitting}
        className="mt-3 px-4 py-2 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] disabled:opacity-50 transition-colors cursor-pointer"
      >
        {submitting ? "送信中..." : "送る"}
      </button>
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer ${
        active
          ? "border-[#1B4F72] bg-[#1B4F72]/10 text-[#1B4F72]"
          : "border-[#e5e5e5] bg-white text-[#606060] hover:border-[#1B4F72] hover:text-[#1B4F72]"
      }`}
    >
      {children}
    </button>
  );
}
