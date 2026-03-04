import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AppCardProps {
  slug: string;
  name: string;
  appUrl: string;
  avgRating: number;
  ratingCount: number;
  commentCount: number;
  createdAt: string;
  authorName?: string;
  version?: number;
}

export default function AppCard({
  slug,
  name,
  appUrl,
  avgRating,
  ratingCount,
  commentCount,
  createdAt,
  authorName,
  version,
}: AppCardProps) {
  return (
    <Link
      href={`/apps/${slug}`}
      className="group bg-white border border-[#e5e5e5] rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
    >
      {/* iframe thumbnail */}
      <div
        className="relative w-full overflow-hidden bg-white"
        style={{ height: "180px" }}
      >
        <iframe
          src={appUrl}
          className="absolute top-0 left-0 border-0"
          style={{
            width: "200%",
            height: "200%",
            transform: "scale(0.5)",
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
          sandbox="allow-scripts"
          loading="lazy"
          tabIndex={-1}
          title={name}
        />
      </div>

      {/* Card body */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-[#0f0f0f] truncate">
          {name}
          {version && version > 1 && (
            <span className="ml-1 text-xs text-[#909090] font-normal">
              v{version}
            </span>
          )}
        </h3>
        {authorName && (
          <p className="text-xs text-[#606060] truncate mt-0.5">
            {authorName}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5 text-xs text-[#909090]">
          {ratingCount > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="text-amber-500">★</span>
              <span>{avgRating.toFixed(1)}</span>
              <span>({ratingCount}件)</span>
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageCircle size={12} />
              <span>{commentCount}</span>
            </span>
          )}
        </div>
        <p className="text-xs text-[#909090] mt-1">
          {formatDate(createdAt)}
        </p>
      </div>
    </Link>
  );
}
