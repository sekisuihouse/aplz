"use client";

import { useState } from "react";
import Link from "next/link";
import NotificationList from "./NotificationList";
import RequestStatusBadge from "./RequestStatusBadge";
import { FEEDBACK_LABELS } from "@/lib/request-platform";
import { formatDate } from "@/lib/utils";

interface DashboardTabsProps {
  requests: Array<{
    slug: string;
    title: string;
    status: string;
    updated_at: string;
  }>;
  solutions: Array<{
    id: string;
    title: string;
    is_accepted: boolean;
    updated_at: string;
    feedback_counts?: Record<string, number>;
    requests?: { slug: string; title: string; status: string } | null;
  }>;
  notifications: React.ComponentProps<typeof NotificationList>["notifications"];
}

export default function DashboardTabs({
  requests,
  solutions,
  notifications,
}: DashboardTabsProps) {
  const [tab, setTab] = useState<"requests" | "solutions" | "notifications">("requests");

  return (
    <div>
      <div className="flex gap-2 mb-4 border-b border-[#e5e5e5]">
        <TabButton active={tab === "requests"} onClick={() => setTab("requests")}>
          自分の困りごと
        </TabButton>
        <TabButton active={tab === "solutions"} onClick={() => setTab("solutions")}>
          自分の回答
        </TabButton>
        <TabButton active={tab === "notifications"} onClick={() => setTab("notifications")}>
          通知
        </TabButton>
      </div>

      {tab === "requests" && (
        <div className="space-y-2">
          {requests.length === 0 ? (
            <Empty text="まだ困りごとを投稿していません" />
          ) : (
            requests.map((request) => (
              <Link
                key={request.slug}
                href={`/requests/${request.slug}`}
                className="flex items-center justify-between gap-3 bg-white border border-[#e5e5e5] rounded-lg p-3 hover:shadow-md transition-all"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#0f0f0f] truncate">{request.title}</p>
                  <p className="text-xs text-[#909090] mt-1">{formatDate(request.updated_at)}</p>
                </div>
                <RequestStatusBadge status={request.status} />
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "solutions" && (
        <div className="space-y-2">
          {solutions.length === 0 ? (
            <Empty text="まだアプリ回答を投稿していません" />
          ) : (
            solutions.map((solution) => (
              <Link
                key={solution.id}
                href={solution.requests?.slug ? `/requests/${solution.requests.slug}` : "/dashboard"}
                className="block bg-white border border-[#e5e5e5] rounded-lg p-3 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0f0f0f] truncate">
                      {solution.title}
                    </p>
                    {solution.requests?.title && (
                      <p className="text-xs text-[#606060] mt-1 truncate">
                        回答先: {solution.requests.title}
                      </p>
                    )}
                  </div>
                  {solution.is_accepted && (
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-green-50 text-green-700">
                      採用済み
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-[#909090]">
                  {Object.entries(solution.feedback_counts ?? {}).map(([key, count]) => (
                    <span key={key}>
                      {(FEEDBACK_LABELS as Record<string, string>)[key] ?? key}: {count}
                    </span>
                  ))}
                  <span>{formatDate(solution.updated_at)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "notifications" && <NotificationList notifications={notifications} />}
    </div>
  );
}

function TabButton({
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
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
        active
          ? "border-[#1B4F72] text-[#1B4F72]"
          : "border-transparent text-[#909090] hover:text-[#606060]"
      }`}
    >
      {children}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-center py-8 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg">
      <p className="text-sm text-[#909090]">{text}</p>
    </div>
  );
}
