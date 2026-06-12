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
        setError("ログインするとコメントできます");
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

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <select
          value={commentType}
          onChange={(event) => setCommentType(event.target.value)}
          className="bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]"
        >
          <option value="comment">コメント</option>
          <option value="question">質問</option>
          <option value="answer">回答</option>
        </select>
      </div>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value.slice(0, 2000))}
        rows={4}
        placeholder="確認したいこと、補足、試した結果などを書いてください"
        className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm placeholder:text-[#909090] focus:outline-none focus:border-[#1B4F72] transition-colors resize-none"
      />
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <button
        onClick={submit}
        disabled={!body.trim() || submitting}
        className="mt-3 px-4 py-2 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] disabled:opacity-50 transition-colors cursor-pointer"
      >
        {submitting ? "投稿中..." : "投稿する"}
      </button>
    </div>
  );
}
