import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase-server";
import { createServerClient } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminReportsPage() {
  const auth = await createAuthServerClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user?.email) redirect("/login?next=/admin/reports");

  const db = createServerClient();
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  const isAdmin = adminEmails.includes(user.email) || profile?.role === "admin";
  if (!isAdmin) redirect("/");

  const { data: reports } = await db
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f0f0f]">通報一覧</h1>
          <p className="text-sm text-[#606060] mt-1">通報の保存状況を確認する簡易運営画面です。</p>
        </div>
        <Link href="/admin/analytics" className="text-sm text-[#1B4F72] hover:underline">
          アクセス解析へ
        </Link>
      </div>
      <div className="space-y-3">
        {(reports ?? []).length === 0 ? (
          <div className="text-center py-10 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg">
            <p className="text-sm text-[#909090]">通報はありません</p>
          </div>
        ) : (
          (reports ?? []).map((report) => (
            <div key={report.id} className="bg-white border border-[#e5e5e5] rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#0f0f0f]">
                    {report.reason}
                  </p>
                  <p className="text-xs text-[#909090] mt-1">
                    {report.target_type} / {report.target_id}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-[#f5f5f5] text-[#606060]">
                  {report.status}
                </span>
              </div>
              {report.detail && (
                <p className="text-sm text-[#606060] mt-3 whitespace-pre-wrap">
                  {report.detail}
                </p>
              )}
              <p className="text-xs text-[#909090] mt-3">
                {formatDate(report.created_at)}
              </p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
