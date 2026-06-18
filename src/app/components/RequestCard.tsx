import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MessageCircle, Sparkles, Wrench } from "lucide-react";
import { formatDate } from "@/lib/utils";
import PrivacyLevelBadge from "./PrivacyLevelBadge";
import RequestStatusBadge from "./RequestStatusBadge";

interface RequestCardProps {
  request: {
    slug: string;
    title: string;
    category: string | null;
    status: string;
    description: string | null;
    desired_outcome: string | null;
    usage_frequency: string | null;
    privacy_level: string | null;
    deadline?: string | null;
    is_beginner_friendly?: boolean;
    created_at: string;
    updated_at: string;
    answer_count?: number;
    comment_count?: number;
    author?: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  compact?: boolean;
}

export default function RequestCard({ request, compact = false }: RequestCardProps) {
  const deadlineLabel = formatDeadline(request.deadline);

  return (
    <Link
      href={`/requests/${request.slug}`}
      className="block bg-white border border-[#e5e5e5] rounded-lg p-4 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <RequestStatusBadge status={request.status} />
            <PrivacyLevelBadge level={request.privacy_level} />
            {request.category && (
              <span className="text-xs text-[#606060] bg-[#f5f5f5] px-2 py-0.5 rounded-md">
                {request.category}
              </span>
            )}
            {request.is_beginner_friendly && (
              <span className="inline-flex items-center gap-1 text-xs text-[#1B4F72] bg-[#1B4F72]/10 px-2 py-0.5 rounded-md">
                <Sparkles size={11} />
                初心者歓迎
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-[#0f0f0f] line-clamp-2">
            {request.title}
          </h3>
          {!compact && (
            <p className="text-sm text-[#606060] mt-1 line-clamp-2">
              {request.desired_outcome || request.description || "詳しい内容を見る"}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-xs text-[#909090]">
        <div className="flex items-center gap-2 min-w-0">
          {request.author?.avatar_url && (
            <Image
              src={request.author.avatar_url}
              alt=""
              width={16}
              height={16}
              className="w-4 h-4 rounded-full object-cover"
              unoptimized
            />
          )}
          <span className="truncate">
            {request.author?.display_name || "匿名ユーザー"}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 shrink-0">
          <span className="flex items-center gap-0.5">
            <Wrench size={12} />
            {request.answer_count ?? 0}件回答
          </span>
          <span className="flex items-center gap-0.5">
            <MessageCircle size={12} />
            {request.comment_count ?? 0}件やりとり
          </span>
          {request.usage_frequency && <span>{request.usage_frequency}</span>}
          {deadlineLabel && (
            <span className="flex items-center gap-0.5">
              <CalendarDays size={12} />
              {deadlineLabel}
            </span>
          )}
          <span>{formatDate(request.updated_at || request.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

function formatDeadline(deadline: string | null | undefined): string | null {
  if (!deadline) return null;
  const date = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getMonth() + 1}/${date.getDate()}期限`;
}
