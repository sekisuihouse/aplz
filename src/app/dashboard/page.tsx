import { redirect } from "next/navigation";
import type { Metadata } from "next";
import DashboardTabs from "@/app/components/DashboardTabs";
import { createServerClient } from "@/lib/supabase";
import { createAuthServerClient } from "@/lib/supabase-server";

export const revalidate = 0;
export const metadata: Metadata = {
  title: "ダッシュボード | APLZ",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const auth = await createAuthServerClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const db = createServerClient();
  const [
    { data: requests },
    { data: solutions },
    { data: notifications },
  ] = await Promise.all([
    db
      .from("requests")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50),
    db
      .from("solutions")
      .select("*, requests:request_id(slug, title, status)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50),
    db
      .from("notifications")
      .select("*, requests:request_id(slug, title), solutions:solution_id(title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const solutionIds = (solutions ?? []).map((solution) => solution.id);
  const { data: feedback } = solutionIds.length
    ? await db
        .from("solution_feedback")
        .select("solution_id, feedback_type")
        .in("solution_id", solutionIds)
    : { data: [] };

  const feedbackCounts: Record<string, Record<string, number>> = {};
  for (const row of feedback ?? []) {
    feedbackCounts[row.solution_id] ??= {};
    feedbackCounts[row.solution_id][row.feedback_type] =
      (feedbackCounts[row.solution_id][row.feedback_type] ?? 0) + 1;
  }

  const enrichedSolutions = (solutions ?? []).map((solution) => ({
    ...solution,
    feedback_counts: feedbackCounts[solution.id] ?? {},
  }));

  const workedCount = (feedback ?? []).filter((item) => item.feedback_type === "worked").length;
  const thanksCount = (feedback ?? []).filter((item) => item.feedback_type === "thanks").length;
  const acceptedCount = enrichedSolutions.filter((solution) => solution.is_accepted).length;
  const unreadCount = (notifications ?? []).filter((item) => !item.read_at).length;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0f0f0f]">ダッシュボード</h1>
        <p className="text-sm text-[#606060] mt-1">
          困りごと、アプリ回答、採用実績、通知をまとめて確認できます。
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat label="投稿した困りごと" value={requests?.length ?? 0} />
        <Stat label="投稿した回答" value={solutions?.length ?? 0} />
        <Stat label="採用" value={acceptedCount} />
        <Stat label="使えた" value={workedCount} />
        <Stat label="ありがとう" value={thanksCount} />
      </div>

      {unreadCount > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-[#1B4F72]/10 text-[#1B4F72] text-sm">
          未読通知が {unreadCount} 件あります。
        </div>
      )}

      <DashboardTabs
        requests={requests ?? []}
        solutions={enrichedSolutions}
        notifications={notifications ?? []}
      />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-4">
      <p className="text-xs text-[#909090]">{label}</p>
      <p className="text-2xl font-bold text-[#0f0f0f] mt-1">{value}</p>
    </div>
  );
}
