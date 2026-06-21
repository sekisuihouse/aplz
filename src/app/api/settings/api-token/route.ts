import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createAuthServerClient } from "@/lib/supabase-server";
import crypto from "crypto";
import { recordAnalyticsEvent } from "@/lib/analytics";

async function getAuthUser() {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  return user;
}

// GET: list tokens
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();
  const { data } = await db
    .from("api_tokens")
    .select("id, name, created_at, last_used_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

// POST: create token
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name as string) || "default";

  const token = "aplz_" + crypto.randomBytes(20).toString("hex");

  const db = createServerClient();
  const { data, error } = await db
    .from("api_tokens")
    .insert({ user_id: user.id, token, name })
    .select("id, name, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordAnalyticsEvent({
    req,
    eventName: "api_token_created",
    userId: user.id,
    path: "/settings/api-token",
  });

  // Return full token only once
  return NextResponse.json({ ...data, token });
}

// DELETE: delete token by id
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id } = body as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = createServerClient();
  const { error } = await db
    .from("api_tokens")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
