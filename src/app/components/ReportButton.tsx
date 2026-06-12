"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { REPORT_REASONS, type ReportTargetType } from "@/lib/request-platform";

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
}

export default function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("危険なアプリ");
  const [detail, setDetail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason,
          detail,
        }),
      });
      if (res.status === 401) {
        setMessage("ログインすると通報できます");
        return;
      }
      if (!res.ok) {
        setMessage("通報を保存できませんでした");
        return;
      }
      setMessage("通報しました");
      setTimeout(() => setOpen(false), 800);
    } catch {
      setMessage("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg border border-[#e5e5e5] text-[#909090] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
        title="通報"
      >
        <Flag size={14} />
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e5e5e5] w-full max-w-sm p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#0f0f0f]">通報</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[#909090] hover:text-[#0f0f0f] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <label className="block text-sm text-[#606060] mb-1.5">理由</label>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72]"
            >
              {REPORT_REASONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <label className="block text-sm text-[#606060] mb-1.5 mt-4">
              詳細 <span className="text-[#909090]">（任意）</span>
            </label>
            <textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              rows={3}
              className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#1B4F72]"
            />
            {message && <p className="text-xs text-[#909090] mt-3">{message}</p>}
            <button
              onClick={submit}
              disabled={submitting}
              className="w-full mt-4 py-2.5 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? "送信中..." : "通報する"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
