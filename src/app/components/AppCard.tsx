import Link from "next/link";
import Image from "next/image";
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
  avatarUrl?: string | null;
  version?: number;
  communitySlug?: string;
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
  avatarUrl,
  version,
  communitySlug,
}: AppCardProps) {
  const href = communitySlug ? `/apps/${slug}?from=${communitySlug}` : `/apps/${slug}`;
  return (
    <Link
      href={href}
      className="group bg-white border border-[#e5e5e5] rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
    >
      {/* iframe thumbnail */}
      <div
        className="relative w-full overflow-hidden bg-white"
        style={{ aspectRatio: "16/10" }}
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
        {/* Transparent overlay to ensure Link receives clicks */}
        <div className="absolute inset-0 z-10" />
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
          <div className="flex items-center gap-1.5 mt-0.5">
            {avatarUrl && (
              <Image
                src={avatarUrl}
                alt=""
                width={16}
                height={16}
                className="w-4 h-4 rounded-full object-cover"
                unoptimized
              />
            )}
            <p className="text-xs text-[#606060] truncate">
              {authorName}
            </p>
          </div>
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
