"use client";

import { useState, type KeyboardEvent } from "react";
import { formatDate } from "@/lib/utils";

interface Comment {
  id: string;
  app_id: string;
  body: string;
  author_name: string;
  created_at: string;
}

interface Props {
  appId: string;
  initialComments: Comment[];
}

export default function CommentSection({ appId, initialComments }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = body.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: appId,
          body: body.trim(),
          author_name: authorName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setBody("");
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-lg font-bold text-[#0f0f0f] mb-4">
        フィードバック{" "}
        {comments.length > 0 && (
          <span className="text-[#909090] font-normal">
            ({comments.length})
          </span>
        )}
      </h2>

      {/* Comment Form */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-4 mb-6">
        <p className="text-xs text-[#909090] mb-3">
          使ってみた感想や改善アイデアを共有しましょう
        </p>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value.slice(0, 30))}
          placeholder="名前（任意）"
          className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors mb-3"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          placeholder="このアプリについてどう思いますか？"
          rows={3}
          className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors resize-none min-h-[80px]"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#909090] font-mono">
            {body.length}/500
          </span>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-5 py-1.5 rounded-lg bg-[#22d3ee] text-black text-sm font-medium hover:bg-[#06b6d4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "送信中..." : "送信"}
          </button>
        </div>
      </div>

      {/* Comment List */}
      {comments.length === 0 ? (
        <div className="text-center py-12 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg">
          <p className="text-[#909090]">
            まだフィードバックはありません。最初の感想を書いてみましょう！
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {comments.map((comment, i) => (
            <div
              key={comment.id}
              className={`flex gap-3 py-4 ${
                i < comments.length - 1 ? "border-b border-[#f0f0f0]" : ""
              }`}
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-[#f5f5f5] text-[#606060] flex items-center justify-center text-sm font-semibold">
                {comment.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[#0f0f0f]">
                    {comment.author_name}
                  </span>
                  <span className="text-xs text-[#909090]">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-[#0f0f0f] break-words leading-relaxed">
                  {comment.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
