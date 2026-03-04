import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";

async function getUser(req: NextRequest) {
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
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    const { invite_code } = await req.json();
    if (!invite_code) {
      return NextResponse.json(
        { error: "招待コードを入力してください" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Find community by invite code
    const { data: community } = await supabase
      .from("communities")
      .select("id, slug, name")
      .eq("invite_code", invite_code)
      .single();

    if (!community) {
      return NextResponse.json(
        { error: "無効な招待コードです" },
        { status: 400 }
      );
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        already_member: true,
        slug: community.slug,
        name: community.name,
      });
    }

    // Insert membership
    const { error } = await supabase
      .from("community_members")
      .insert({
        community_id: community.id,
        user_id: user.id,
        role: "member",
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      slug: community.slug,
      name: community.name,
    });
  } catch {
    return NextResponse.json(
      { error: "無効なリクエストです" },
      { status: 400 }
    );
  }
}
