"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REQUEST_STATUS_LABELS, REQUEST_STATUSES } from "@/lib/request-platform";

export default function RequestOwnerActions({
  requestSlug,
  currentStatus,
}: {
  requestSlug: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async (nextStatus = status) => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/requests/${requestSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        setMessage("更新できませんでした");
        return;
      }
      setStatus(nextStatus);
      setMessage("更新しました");
      router.refresh();
    } catch {
      setMessage("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-4">
      <h2 className="text-sm font-semibold text-[#0f0f0f] mb-3">投稿者メニュー</h2>
      <div className="flex gap-2">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="input"
        >
          {REQUEST_STATUSES.filter((item) => item !== "hidden").map((item) => (
            <option key={item} value={item}>
              {REQUEST_STATUS_LABELS[item]}
            </option>
          ))}
        </select>
        <button
          onClick={() => save()}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] disabled:opacity-50 transition-colors cursor-pointer"
        >
          保存
        </button>
      </div>
      <button
        onClick={() => save("solved")}
        disabled={saving}
        className="mt-3 w-full py-2 rounded-lg border border-[#e5e5e5] text-[#606060] text-sm font-medium hover:bg-[#f5f5f5] disabled:opacity-50 transition-colors cursor-pointer"
      >
        解決済みにする
      </button>
      {message && <p className="text-xs text-[#909090] mt-2">{message}</p>}
    </div>
  );
}
