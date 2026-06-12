"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/utils";
import FeedbackButtons from "./FeedbackButtons";
import ReportButton from "./ReportButton";

interface SolutionCardProps {
  solution: {
    id: string;
    title: string;
    app_url: string | null;
    app_slug: string | null;
    description: string | null;
    usage_guide: string | null;
    can_do: string | null;
    cannot_do: string | null;
    data_handled: string | null;
    external_communication: boolean | null;
    data_storage?: boolean | null;
    recommended_environment: string | null;
    version_note: string | null;
    caution_note?: string | null;
    is_accepted: boolean;
    updated_at: string;
    author?: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
    feedback_counts?: Record<string, number>;
  };
  canAccept?: boolean;
}

export default function SolutionCard({ solution, canAccept = false }: SolutionCardProps) {
  const [accepted, setAccepted] = useState(solution.is_accepted);
  const [accepting, setAccepting] = useState(false);
  const [message, setMessage] = useState("");
  const href = solution.app_slug ? `/apps/${solution.app_slug}` : solution.app_url || "#";
  const isExternal = !solution.app_slug && Boolean(solution.app_url);

  const accept = async () => {
    if (accepting) return;
    setAccepting(true);
    setMessage("");
    try {
      const res = await fetch(`/api/solutions/${solution.id}/accept`, {
        method: "POST",
      });
      if (!res.ok) {
        setMessage("採用できませんでした");
        return;
      }
      setAccepted(true);
      setMessage("採用しました");
    } catch {
      setMessage("通信エラーが発生しました");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {accepted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                <CheckCircle2 size={12} />
                採用済み
              </span>
            )}
            {solution.external_communication && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
                <ShieldAlert size={12} />
                外部通信あり
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-[#0f0f0f]">{solution.title}</h3>
          {solution.author?.display_name && (
            <p className="text-xs text-[#909090] mt-0.5">
              作者: {solution.author.display_name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1B4F72] text-white text-xs font-medium hover:bg-[#15415F] transition-colors"
          >
            起動
            {isExternal && <ExternalLink size={12} />}
          </Link>
          <ReportButton targetType="solution" targetId={solution.id} />
        </div>
      </div>

      {solution.description && (
        <p className="text-sm text-[#606060] mt-3 whitespace-pre-wrap">{solution.description}</p>
      )}

      <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
        {solution.usage_guide && <InfoBlock label="使い方" value={solution.usage_guide} />}
        {solution.can_do && <InfoBlock label="できること" value={solution.can_do} />}
        {solution.cannot_do && <InfoBlock label="できないこと" value={solution.cannot_do} />}
        {solution.data_handled && <InfoBlock label="扱うデータ" value={solution.data_handled} />}
        {solution.recommended_environment && (
          <InfoBlock label="推奨環境" value={solution.recommended_environment} />
        )}
        {solution.version_note && <InfoBlock label="バージョンメモ" value={solution.version_note} />}
      </div>

      {(solution.external_communication || solution.data_storage || solution.caution_note) && (
        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-800">
          {solution.external_communication && <p>外部通信を行う可能性があります。</p>}
          {solution.data_storage && <p>データ保存を行う可能性があります。</p>}
          {solution.caution_note && <p>{solution.caution_note}</p>}
        </div>
      )}

      <div className="mt-4">
        <FeedbackButtons
          solutionId={solution.id}
          initialCounts={solution.feedback_counts ?? {}}
        />
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-[#909090]">
        <span>{formatDate(solution.updated_at)}に更新</span>
        {canAccept && (
          <button
            onClick={accept}
            disabled={accepting}
            className="px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-[#606060] hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {accepting ? "採用中..." : accepted ? "採用済み" : "この回答を採用"}
          </button>
        )}
      </div>
      {message && <p className="text-xs text-[#909090] mt-2">{message}</p>}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg p-3">
      <p className="text-xs text-[#909090] mb-1">{label}</p>
      <p className="text-[#0f0f0f] whitespace-pre-wrap">{value}</p>
    </div>
  );
}
