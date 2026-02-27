import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const appId = req.nextUrl.searchParams.get("app_id");
  if (!appId) {
    return NextResponse.json(
      { error: "app_id is required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("app_id", appId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data });
}

export async function POST(req: NextRequest) {
  try {
    const { app_id, body, author_name } = await req.json();

    if (!app_id || !body) {
      return NextResponse.json(
        { error: "app_id and body are required" },
        { status: 400 }
      );
    }

    if (body.length > 500) {
      return NextResponse.json(
        { error: "Comment must be 500 characters or less" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({
        app_id,
        body,
        author_name: author_name?.trim() || "Anonymous",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comment: data });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
