import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface NotificationListProps {
  notifications: Array<{
    id: string;
    type: string;
    read_at: string | null;
    created_at: string;
    requests?: { slug: string; title: string } | null;
    solutions?: { title: string } | null;
  }>;
}

const NOTIFICATION_LABELS: Record<string, string> = {
  request_comment: "困りごとにコメントが届きました",
  solution_created: "困りごとにアプリ回答が届きました",
  solution_accepted: "回答が採用されました",
  solution_feedback_worked: "回答に「使えた」が届きました",
  solution_feedback_thanks: "回答に「ありがとう」が届きました",
  solution_feedback_needs_fix: "修正依頼が届きました",
};

export default function NotificationList({ notifications }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg">
        <p className="text-sm text-[#909090]">通知はありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const href = notification.requests?.slug
          ? `/requests/${notification.requests.slug}`
          : "/dashboard";
        return (
          <Link
            key={notification.id}
            href={href}
            className="block bg-white border border-[#e5e5e5] rounded-lg p-3 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#0f0f0f]">
                  {NOTIFICATION_LABELS[notification.type] ?? "通知"}
                </p>
                {notification.requests?.title && (
                  <p className="text-xs text-[#606060] mt-1 line-clamp-1">
                    {notification.requests.title}
                  </p>
                )}
              </div>
              {!notification.read_at && (
                <span className="shrink-0 w-2 h-2 rounded-full bg-[#1B4F72] mt-1.5" />
              )}
            </div>
            <p className="text-xs text-[#909090] mt-2">
              {formatDate(notification.created_at)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
