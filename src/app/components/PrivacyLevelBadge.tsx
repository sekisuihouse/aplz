import { PRIVACY_LEVEL_LABELS, type PrivacyLevel } from "@/lib/request-platform";

const PRIVACY_STYLES: Record<PrivacyLevel, string> = {
  none: "bg-green-50 text-green-700",
  low: "bg-[#f5f5f5] text-[#606060]",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
  unknown: "bg-[#f5f5f5] text-[#909090]",
};

export default function PrivacyLevelBadge({ level }: { level: string | null | undefined }) {
  const safeLevel = (level && level in PRIVACY_LEVEL_LABELS ? level : "unknown") as PrivacyLevel;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${PRIVACY_STYLES[safeLevel]}`}>
      {PRIVACY_LEVEL_LABELS[safeLevel]}
    </span>
  );
}
