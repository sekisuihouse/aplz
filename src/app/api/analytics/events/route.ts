import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  PUBLIC_ANALYTICS_EVENTS,
  SESSION_COOKIE,
  VISITOR_COOKIE,
  safeAnalyticsMetadata,
  safeAnalyticsPath,
  safeReferrerHost,
} from "@/lib/analytics";
import { getUserFromRequest } from "@/lib/request-platform";
import { createServerClient } from "@/lib/supabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COOKIE_YEAR = 60 * 60 * 24 * 365;
const SESSION_MINUTES = 30;

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ success: true, skipped: "development" }, { status: 202 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const eventName = typeof body.event_name === "string" ? body.event_name : "";
    if (!(PUBLIC_ANALYTICS_EVENTS as readonly string[]).includes(eventName)) {
      return NextResponse.json({ error: "invalid event" }, { status: 400 });
    }

    const oldVisitorId = req.cookies.get(VISITOR_COOKIE)?.value ?? "";
    const oldSessionId = req.cookies.get(SESSION_COOKIE)?.value ?? "";
    const isNewVisitor = !UUID_PATTERN.test(oldVisitorId);
    const isNewSession = !UUID_PATTERN.test(oldSessionId);
    const visitorId = isNewVisitor ? randomUUID() : oldVisitorId;
    const sessionId = isNewSession ? randomUUID() : oldSessionId;
    const path = safeAnalyticsPath(body.path);
    const referrerHost = safeReferrerHost(body.referrer);
    const user = await getUserFromRequest(req);
    const now = new Date().toISOString();
    const db = createServerClient();

    const { error: visitorError } = await db.from("analytics_visitors").upsert(
      {
        id: visitorId,
        last_seen_at: now,
        ...(isNewVisitor ? { first_seen_at: now, first_path: path, first_referrer_host: referrerHost } : {}),
      },
      { onConflict: "id" }
    );
    if (visitorError) throw visitorError;

    const { error: sessionError } = await db.from("analytics_sessions").upsert(
      {
        id: sessionId,
        visitor_id: visitorId,
        user_id: user?.id ?? null,
        last_seen_at: now,
        ...(isNewSession ? { started_at: now, landing_path: path, referrer_host: referrerHost } : {}),
      },
      { onConflict: "id" }
    );
    if (sessionError) throw sessionError;

    const events = [
      ...(isNewVisitor
        ? [{ event_name: "visitor_created", visitor_id: visitorId, session_id: sessionId, user_id: user?.id ?? null, path, metadata: {} }]
        : []),
      ...(isNewSession
        ? [{ event_name: "session_started", visitor_id: visitorId, session_id: sessionId, user_id: user?.id ?? null, path, metadata: { referrer_host: referrerHost } }]
        : []),
      {
        event_name: eventName,
        visitor_id: visitorId,
        session_id: sessionId,
        user_id: user?.id ?? null,
        path,
        metadata: safeAnalyticsMetadata(body.metadata),
      },
    ];

    const { error: eventError } = await db.from("analytics_events").insert(events);
    if (eventError) throw eventError;

    const response = NextResponse.json({ success: true }, { status: 202 });
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_YEAR,
      path: "/",
    });
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MINUTES * 60,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("analytics event error:", error);
    return NextResponse.json({ error: "analytics unavailable" }, { status: 503 });
  }
}
