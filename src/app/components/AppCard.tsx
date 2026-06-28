import Link from "next/link";
import Image from "next/image";
import { ExternalLink, MessageCircle, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AppCardProps {
  slug: string;
  name: string;
  description?: string | null;
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
  description,
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
        {description && (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#606060]">
            {description}
          </p>
        )}
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
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#f5f5f5] px-1.5 py-0.5 text-[11px] text-[#606060]">
            <ShieldCheck size={11} />
            ブラウザ
          </span>
          <span className="rounded-md bg-[#f5f5f5] px-1.5 py-0.5 text-[11px] text-[#606060]">
            保存要確認
          </span>
        </div>
        <span className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-lg bg-[#1B4F72] px-3 py-2 text-xs font-semibold text-white group-hover:bg-[#15415F]">
          アプリを試す
          <ExternalLink size={12} />
        </span>
      </div>
    </Link>
  );
}
