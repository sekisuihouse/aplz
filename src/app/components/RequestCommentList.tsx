import Image from "next/image";
import { formatDate } from "@/lib/utils";
import ReportButton from "./ReportButton";

interface RequestCommentListProps {
  comments: Array<{
    id: string;
    user_id: string | null;
    body: string;
    comment_type: string;
    created_at: string;
    author?: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  }>;
  requestOwnerId?: string | null;
  currentUserId?: string | null;
}

const COMMENT_TYPE_LABELS: Record<string, string> = {
  question: "質問",
  answer: "返答",
  comment: "補足",
  system: "システム",
};

export default function RequestCommentList({
  comments,
  requestOwnerId,
  currentUserId,
}: RequestCommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg">
        <p className="text-sm text-[#909090]">まだやりとりはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => {
        const isOwner = comment.user_id && comment.user_id === requestOwnerId;
        const isMine = comment.user_id && comment.user_id === currentUserId;
        const isQuestion = comment.comment_type === "question";
        return (
          <div
            key={comment.id}
            className={`bg-white border rounded-lg p-3 ${
              isQuestion ? "border-[#1B4F72]/30" : "border-[#e5e5e5]"
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {comment.author?.avatar_url && (
                  <Image
                    src={comment.author.avatar_url}
                    alt=""
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full object-cover"
                    unoptimized
                  />
                )}
                <span className="text-sm font-medium text-[#0f0f0f] truncate">
                  {comment.author?.display_name || "匿名ユーザー"}
                </span>
                {isOwner && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#1B4F72]/10 text-[#1B4F72]">
                    投稿者
                  </span>
                )}
                {isMine && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[#606060]">
                    自分
                  </span>
                )}
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[#909090]">
                  {COMMENT_TYPE_LABELS[comment.comment_type] ?? "コメント"}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[#909090]">
                  {formatDate(comment.created_at)}
                </span>
                <ReportButton targetType="comment" targetId={comment.id} />
              </div>
            </div>
            <p className="text-sm text-[#606060] whitespace-pre-wrap">{comment.body}</p>
          </div>
        );
      })}
    </div>
  );
}
