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
}

export default function AppCard({
  slug,
  name,
  appUrl,
  avgRating,
  ratingCount,
  commentCount,
  createdAt,
}: AppCardProps) {
  return (
    <Link
      href={`/apps/${slug}`}
      className="group bg-[#141416] border border-[#1e1e22] rounded-lg overflow-hidden hover:border-[#2a2a2e] transition-colors duration-200"
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
        <h3 className="text-sm font-medium text-[#e4e4e7] truncate">
          {name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
          {ratingCount > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="text-amber-400">★</span>
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
        <p className="text-xs text-zinc-600 mt-1">
          {formatDate(createdAt)}
        </p>
      </div>
    </Link>
  );
}
