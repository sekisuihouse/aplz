import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  REPORT_REASONS,
  asOptionalString,
  asString,
  getUserFromRequest,
  isReportTargetType,
} from "@/lib/request-platform";
import { recordAnalyticsEvent } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const targetId = asString(body.target_id, 100);
    const reason = asString(body.reason, 100);

    if (!isReportTargetType(body.target_type)) {
      return NextResponse.json({ error: "invalid target_type" }, { status: 400 });
    }
    if (!targetId) return NextResponse.json({ error: "target_id is required" }, { status: 400 });
    if (!reason) return NextResponse.json({ error: "reason is required" }, { status: 400 });
    if (!(REPORT_REASONS as readonly string[]).includes(reason)) {
      return NextResponse.json({ error: "invalid reason" }, { status: 400 });
    }

    const db = createServerClient();
    const { data, error } = await db
      .from("reports")
      .insert({
        reporter_id: user.id,
        target_type: body.target_type,
        target_id: targetId,
        reason,
        detail: asOptionalString(body.detail, 1000),
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await recordAnalyticsEvent({
      req,
      eventName: "report_created",
      userId: user.id,
      metadata: { target_type: String(body.target_type), reason },
    });

    return NextResponse.json({ success: true, report: data });
  } catch (err) {
    console.error("reports POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
