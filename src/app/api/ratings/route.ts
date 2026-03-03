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
    .from("ratings")
    .select("usability, design, idea")
    .eq("app_id", appId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const count = data.length;
  const averages =
    count > 0
      ? {
          usability: data.reduce((sum, r) => sum + r.usability, 0) / count,
          design: data.reduce((sum, r) => sum + r.design, 0) / count,
          idea: data.reduce((sum, r) => sum + r.idea, 0) / count,
        }
      : { usability: 0, design: 0, idea: 0 };

  return NextResponse.json({ averages, count });
}

export async function POST(req: NextRequest) {
  try {
    const { app_id, usability, design, idea } = await req.json();

    if (!app_id || usability == null || design == null || idea == null) {
      return NextResponse.json(
        { error: "app_id, usability, design, and idea are required" },
        { status: 400 }
      );
    }

    for (const val of [usability, design, idea]) {
      if (!Number.isInteger(val) || val < 1 || val > 5) {
        return NextResponse.json(
          { error: "Each rating must be an integer between 1 and 5" },
          { status: 400 }
        );
      }
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from("ratings")
      .insert({ app_id, usability, design, idea });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
