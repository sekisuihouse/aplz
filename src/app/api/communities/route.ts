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

export async function GET(req: NextRequest) {
  const mine = req.nextUrl.searchParams.get("mine") === "true";
  const supabase = createServerClient();

  if (mine) {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json([]);
    }

    // Get communities the user is a member of
    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json([]);
    }

    const communityIds = memberships.map((m) => m.community_id);
    const { data, error } = await supabase
      .from("communities")
      .select("id, name, slug")
      .in("id", communityIds)
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  }

  // Default: return all communities
  const { data, error } = await supabase
    .from("communities")
    .select("id, name, slug")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
