import { NextRequest } from "next/server";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createServerClient } from "@/lib/supabase";

export const REQUEST_CATEGORIES = [
  "集計",
  "予約・申込",
  "当番表",
  "イベント運営",
  "学校・委員会",
  "町内会",
  "個人事業主",
  "文章作成",
  "画像・資料",
  "その他",
] as const;

export const REQUEST_STATUSES = [
  "open",
  "questions",
  "in_progress",
  "answered",
  "testing",
  "solved",
  "on_hold",
  "hidden",
] as const;

export const PRIVACY_LEVELS = ["none", "low", "medium", "high", "unknown"] as const;

export const FEEDBACK_TYPES = [
  "worked",
  "thanks",
  "saved_time",
  "clear",
  "use_again",
  "needs_fix",
  "did_not_work",
] as const;

export const REPORT_TARGET_TYPES = ["request", "solution", "comment", "app"] as const;

export const REPORT_REASONS = [
  "危険なアプリ",
  "個人情報が見えている",
  "動かない",
  "不適切な内容",
  "スパム",
  "著作権的に怪しい",
  "悪意のあるリンク",
  "その他",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type PrivacyLevel = (typeof PRIVACY_LEVELS)[number];
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  open: "募集中",
  questions: "質問あり",
  in_progress: "作成中",
  answered: "回答あり",
  testing: "試用中",
  solved: "解決済み",
  on_hold: "保留",
  hidden: "非公開",
};

export const PRIVACY_LEVEL_LABELS: Record<PrivacyLevel, string> = {
  none: "個人情報なし",
  low: "注意",
  medium: "要注意",
  high: "高リスク",
  unknown: "不明",
};

export const FEEDBACK_LABELS: Record<FeedbackType, string> = {
  worked: "役に立った",
  thanks: "ありがとう",
  saved_time: "作業が楽になった",
  clear: "わかりやすかった",
  use_again: "また使いたい",
  needs_fix: "改善希望",
  did_not_work: "使えなかった",
};

export interface AuthUser {
  id: string;
  email?: string | null;
}

export interface RequestRecord {
  id: string;
  slug: string;
  user_id: string | null;
  title: string;
  category: string | null;
  target_user_type: string | null;
  current_workflow: string | null;
  pain_point: string | null;
  desired_outcome: string | null;
  usage_frequency: string | null;
  input_data: string | null;
  output_data: string | null;
  privacy_level: PrivacyLevel;
  deadline: string | null;
  reference_url: string | null;
  description: string | null;
  status: RequestStatus;
  is_public: boolean;
  is_beginner_friendly: boolean;
  created_at: string;
  updated_at: string;
}

export function makeRequestSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "request"}-${nanoid(6)}`;
}

export function asString(value: unknown, max = 5000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function asOptionalString(value: unknown, max = 5000): string | null {
  const str = asString(value, max);
  return str ? str : null;
}

export function isValidUrl(value: string | null): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isRequestStatus(value: unknown): value is RequestStatus {
  return REQUEST_STATUSES.includes(value as RequestStatus);
}

export function isPrivacyLevel(value: unknown): value is PrivacyLevel {
  return PRIVACY_LEVELS.includes(value as PrivacyLevel);
}

export function isFeedbackType(value: unknown): value is FeedbackType {
  return FEEDBACK_TYPES.includes(value as FeedbackType);
}

export function isReportTargetType(value: unknown): value is ReportTargetType {
  return REPORT_TARGET_TYPES.includes(value as ReportTargetType);
}

export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const db = createServerClient();
    const { data } = await db
      .from("api_tokens")
      .select("user_id")
      .eq("token", token)
      .single();
    if (data) {
      await db
        .from("api_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("token", token);
      return { id: data.user_id };
    }
  }

  const supabaseResponse = NextResponse.next({ request: req });
  const supabase = createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email } : null;
}

export async function createNotification(input: {
  userId: string | null | undefined;
  actorId?: string | null;
  type: string;
  requestId?: string | null;
  solutionId?: string | null;
  commentId?: string | null;
}) {
  if (!input.userId || input.userId === input.actorId) return;
  const db = createServerClient();
  await db.from("notifications").insert({
    user_id: input.userId,
    actor_id: input.actorId ?? null,
    type: input.type,
    request_id: input.requestId ?? null,
    solution_id: input.solutionId ?? null,
    comment_id: input.commentId ?? null,
  });
}

export function countByKey<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  key: keyof T
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows ?? []) {
    const value = String(row[key] ?? "");
    if (!value) continue;
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}
