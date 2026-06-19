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
  href?: string;
  selected?: boolean;
  compact?: boolean;
}

export default function RequestCard({
  request,
  href,
  selected = false,
  compact = false,
}: RequestCardProps) {
  const deadlineLabel = formatDeadline(request.deadline);
  const cardHref = href ?? `/requests/${request.slug}`;
  const summary = request.desired_outcome || request.description || "詳しい内容を見る";

  return (
    <Link
      href={cardHref}
      aria-current={selected ? "true" : undefined}
      className={`block rounded-xl border p-4 transition-all ${
        selected
          ? "border-[#1B4F72] bg-[#1B4F72]/[0.03] shadow-sm"
          : "border-[#e5e5e5] bg-white hover:border-[#1B4F72]/40 hover:shadow-md"
      }`}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <RequestStatusBadge status={request.status} />
            <PrivacyLevelBadge level={request.privacy_level} />
            {request.category && (
              <span className="text-xs text-[#404040] bg-[#f5f5f5] px-2 py-0.5 rounded-md">
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
          <h3 className="text-[17px] font-semibold text-[#0f0f0f] leading-7 line-clamp-2">
            {request.title}
          </h3>
          {!compact && (
            <p className="text-sm text-[#505050] mt-2 line-clamp-3 leading-7">
              {summary}
            </p>
          )}
        </div>

        <div className="mt-auto grid gap-2 border-t border-[#f0f0f0] pt-3 text-xs text-[#606060]">
          <div className="flex flex-wrap items-center justify-between gap-2">
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
              <span className="truncate">{request.author?.display_name || "匿名ユーザー"}</span>
            </div>
            <span>{formatDate(request.updated_at || request.created_at)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Wrench size={12} />
              {request.answer_count ?? 0}件回答
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={12} />
              {request.comment_count ?? 0}件やりとり
            </span>
            {request.usage_frequency && <span>{request.usage_frequency}</span>}
            {deadlineLabel && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={12} />
                {deadlineLabel}
              </span>
            )}
          </div>
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
