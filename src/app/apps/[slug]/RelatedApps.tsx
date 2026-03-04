"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RelatedApp {
  id: string;
  name: string;
  slug: string;
  author_name?: string;
  avg_rating: number;
  rating_count: number;
}

interface Props {
  currentAppId: string;
  r2PublicUrl: string;
}

export default function RelatedApps({ currentAppId, r2PublicUrl }: Props) {
  const [apps, setApps] = useState<RelatedApp[]>([]);

  useEffect(() => {
    fetch(`/api/related-apps?app_id=${currentAppId}&limit=8`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setApps(data);
      })
      .catch(() => {});
  }, [currentAppId]);

  if (apps.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-medium text-[#909090] mb-4">関連アプリ</h2>
      <div className="space-y-3">
        {apps.map((app) => (
          <Link
            key={app.id}
            href={`/apps/${app.slug}`}
            className="flex items-start gap-3 group"
          >
            <div className="relative w-28 h-20 shrink-0 overflow-hidden rounded-md border border-[#e5e5e5] bg-white">
              <iframe
                src={`${r2PublicUrl}/${app.slug}/index.html`}
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
                title={app.name}
              />
              <div className="absolute inset-0 z-10" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-[#0f0f0f] line-clamp-2 group-hover:text-[#065fd4] transition-colors">
                {app.name}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-[#606060]">
                {app.rating_count > 0 && (
                  <>
                    <span className="text-amber-500">★</span>
                    <span>{app.avg_rating.toFixed(1)}</span>
                    <span className="mx-0.5">・</span>
                  </>
                )}
                {app.author_name && <span>{app.author_name}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
