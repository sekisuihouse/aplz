import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const VISITOR_COOKIE = "aplz_visitor_id";
export const SESSION_COOKIE = "aplz_session_id";

export const PUBLIC_ANALYTICS_EVENTS = [
  "page_view",
  "auth_attempt",
  "auth_link_sent",
  "logout",
] as const;

export const SERVER_ANALYTICS_EVENTS = [
  ...PUBLIC_ANALYTICS_EVENTS,
  "auth_completed",
  "request_created",
  "request_comment_created",
  "solution_created",
  "solution_accepted",
  "solution_feedback_created",
  "app_published",
  "profile_updated",
  "report_created",
  "community_joined",
  "api_token_created",
] as const;

export type AnalyticsEventName = (typeof SERVER_ANALYTICS_EVENTS)[number];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function safeAnalyticsPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  const path = value.trim().slice(0, 300);
  return path.startsWith("/") ? path.split("?")[0] || "/" : "/";
}

export function safeReferrerHost(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    return new URL(value).hostname.slice(0, 255) || null;
  } catch {
    return null;
  }
}

export function safeAnalyticsMetadata(value: unknown): Record<string, string | number | boolean | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, raw] of Object.entries(value).slice(0, 12)) {
    if (!/^[a-z0-9_]{1,40}$/i.test(key)) continue;
    if (typeof raw === "string") result[key] = raw.slice(0, 120);
    else if (typeof raw === "number" && Number.isFinite(raw)) result[key] = raw;
    else if (typeof raw === "boolean" || raw === null) result[key] = raw;
  }
  return result;
}

function cookieUuid(req: NextRequest, name: string): string | null {
  const value = req.cookies.get(name)?.value ?? "";
  return UUID_PATTERN.test(value) ? value : null;
}

export async function recordAnalyticsEvent(input: {
  req: NextRequest;
  eventName: AnalyticsEventName;
  userId?: string | null;
  path?: string;
  metadata?: Record<string, unknown>;
}) {
  const visitorId = cookieUuid(input.req, VISITOR_COOKIE);
  const sessionId = cookieUuid(input.req, SESSION_COOKIE);
  const db = createServerClient();

  const { error } = await db.from("analytics_events").insert({
    event_name: input.eventName,
    visitor_id: visitorId,
    session_id: sessionId,
    user_id: input.userId ?? null,
    path: safeAnalyticsPath(input.path ?? input.req.nextUrl.pathname),
    metadata: safeAnalyticsMetadata(input.metadata),
  });

  if (error) console.error(`analytics ${input.eventName} error:`, error.message);
}
