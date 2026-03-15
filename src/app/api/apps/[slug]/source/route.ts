import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createServerClient();

  const { data: app, error } = await supabase
    .from("apps")
    .select("id, name, description, slug, version, last_published_at, user_id")
    .eq("slug", slug)
    .single();

  if (error || !app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const r2Url = `${process.env.R2_PUBLIC_URL}/${slug}/index.html`;

  try {
    const response = await fetch(r2Url);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch source" }, { status: 500 });
    }
    const code = await response.text();
    return NextResponse.json({ code, app });
  } catch {
    return NextResponse.json({ error: "Failed to fetch source" }, { status: 500 });
  }
}
