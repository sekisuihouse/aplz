"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createAuthBrowserClient } from "@/lib/supabase";
import EditorLayout from "@/app/components/editor/EditorLayout";

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [app, setApp] = useState<{
    id: string;
    name: string;
    description: string;
    slug: string;
    version: number;
    last_published_at: string;
    user_id: string;
  } | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createAuthBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const res = await fetch(`/api/apps/${slug}/source`);
      if (!res.ok) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.app.user_id !== user.id) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setApp(data.app);
      setCode(data.code);
      setLoading(false);
    };
    load();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="text-[#909090]">読み込み中...</p>
      </div>
    );
  }

  if (unauthorized || !app) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-white">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#0f0f0f] mb-2">
            編集権限がありません
          </h1>
          <p className="text-[#606060]">このアプリの編集権限がありません。</p>
        </div>
      </div>
    );
  }

  return (
    <EditorLayout
      app={app}
      initialCode={code}
      isNewApp={false}
      backUrl={`/apps/${slug}`}
    />
  );
}
