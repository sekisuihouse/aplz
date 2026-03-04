import { nanoid } from "nanoid";

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "app"}-${nanoid(6)}`;
}

const MIME_MAP: Record<string, string> = {
  ".html": "text/html",
  ".htm": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".wasm": "application/wasm",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".pdf": "application/pdf",
};

export function getMimeType(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return MIME_MAP[ext] || "application/octet-stream";
}

export function formatDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  const months = Math.floor(days / 30);
  return `${months}ヶ月前`;
}

export const REACTION_EMOJIS = ["🔥", "👍", "💡", "🎨", "🚀"] as const;

export const REACTION_TYPES = ["like", "want", "amazing", "feedback"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

// Map legacy emoji reactions to new types
export const LEGACY_EMOJI_MAP: Record<string, ReactionType> = {
  "👍": "like",
  "🚀": "want",
  "🔥": "amazing",
  "🎨": "amazing",
  "💡": "feedback",
};
