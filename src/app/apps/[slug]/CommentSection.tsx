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
      <h2 className="text-lg font-bold text-white mb-4">
        Feedback{" "}
        {comments.length > 0 && (
          <span className="text-gray-500 font-normal">
            ({comments.length})
          </span>
        )}
      </h2>

      {/* Comment List */}
      {comments.length === 0 ? (
        <div className="text-center py-12 bg-[#141416] border border-[#2a2a2e] rounded-xl mb-6">
          <p className="text-gray-500">
            No feedback yet. Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="bg-[#141416] border border-[#2a2a2e] rounded-xl divide-y divide-[#2a2a2e] mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-[#22d3ee]/15 text-[#22d3ee] flex items-center justify-center text-sm font-semibold">
                {comment.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">
                    {comment.author_name}
                  </span>
                  <span className="text-xs text-gray-600 font-mono">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 break-words">
                  {comment.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Form */}
      <div className="bg-[#141416] border border-[#2a2a2e] rounded-xl p-4">
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value.slice(0, 30))}
          placeholder="Your name (optional)"
          className="w-full bg-[#0a0a0b] border border-[#2a2a2e] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#22d3ee] transition-colors mb-3"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          placeholder="Share your feedback..."
          rows={2}
          className="w-full bg-[#0a0a0b] border border-[#2a2a2e] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#22d3ee] transition-colors resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-600 font-mono">
            {body.length}/500
          </span>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-1.5 rounded-lg bg-[#22d3ee] text-black text-sm font-semibold hover:bg-[#06b6d4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
