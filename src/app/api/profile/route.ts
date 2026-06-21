import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { uploadToR2, getPublicUrl } from "@/lib/r2";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { recordAnalyticsEvent } from "@/lib/analytics";

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
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return NextResponse.json(
    profile ?? {
      id: user.id,
      display_name: "",
      bio: "",
      avatar_url: "",
      github_url: "",
      sns_url: "",
      website_url: "",
      developer_enabled: false,
      skill_categories: [],
    }
  );
}

export async function PUT(req: NextRequest) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const displayName = formData.get("display_name") as string | null;
  const bio = formData.get("bio") as string | null;
  const githubUrl = formData.get("github_url") as string | null;
  const snsUrl = formData.get("sns_url") as string | null;
  const websiteUrl = formData.get("website_url") as string | null;
  const developerEnabled = formData.get("developer_enabled") as string | null;
  const skillCategories = formData.get("skill_categories") as string | null;
  const avatar = formData.get("avatar") as File | null;

  const supabase = createServerClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (displayName !== null) updates.display_name = displayName;
  if (bio !== null) updates.bio = bio.slice(0, 1000);
  if (githubUrl !== null) updates.github_url = githubUrl.slice(0, 500);
  if (snsUrl !== null) updates.sns_url = snsUrl.slice(0, 500);
  if (websiteUrl !== null) updates.website_url = websiteUrl.slice(0, 500);
  if (developerEnabled !== null) updates.developer_enabled = developerEnabled === "true";
  if (skillCategories !== null) {
    updates.skill_categories = skillCategories
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  // Upload avatar if provided
  if (avatar && avatar.size > 0) {
    if (avatar.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "画像は2MB以下にしてください" },
        { status: 400 }
      );
    }

    const ext = avatar.name.split(".").pop()?.toLowerCase() || "jpg";
    const validExts = ["jpg", "jpeg", "png", "webp"];
    if (!validExts.includes(ext)) {
      return NextResponse.json(
        { error: "jpg, png, webp形式のみ対応しています" },
        { status: 400 }
      );
    }

    const key = `avatars/${user.id}/avatar.${ext}`;
    const buffer = new Uint8Array(await avatar.arrayBuffer());
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    await uploadToR2(key, buffer, mimeMap[ext] || "image/jpeg");
    updates.avatar_url = getPublicUrl(key);
  }

  // Upsert profile
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...updates })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAnalyticsEvent({
    req,
    eventName: "profile_updated",
    userId: user.id,
    path: "/profile",
    metadata: { developer_enabled: developerEnabled === "true", avatar_updated: Boolean(avatar?.size) },
  });

  return NextResponse.json({ success: true, profile: data });
}
