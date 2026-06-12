import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/request-platform";

const STATUS_STYLES: Record<RequestStatus, string> = {
  open: "bg-[#1B4F72]/10 text-[#1B4F72]",
  questions: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  answered: "bg-emerald-50 text-emerald-700",
  testing: "bg-purple-50 text-purple-700",
  solved: "bg-green-50 text-green-700",
  on_hold: "bg-[#f5f5f5] text-[#606060]",
  hidden: "bg-red-50 text-red-700",
};

export default function RequestStatusBadge({ status }: { status: string }) {
  const safeStatus = (status in REQUEST_STATUS_LABELS ? status : "open") as RequestStatus;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_STYLES[safeStatus]}`}>
      {REQUEST_STATUS_LABELS[safeStatus]}
    </span>
  );
}
