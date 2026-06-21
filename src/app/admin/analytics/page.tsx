import Link from "next/link";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase-server";
import { createServerClient } from "@/lib/supabase";

export const revalidate = 0;

type AnalyticsEvent = {
  event_name: string;
  user_id: string | null;
  path: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
};

const EVENT_LABELS: Record<string, string> = {
  page_view: "ページ表示",
  auth_attempt: "認証開始",
  auth_link_sent: "認証リンク送信",
  login_completed: "ログイン完了",
  signup_completed: "新規登録完了",
  logout: "ログアウト",
  request_created: "困りごと投稿",
  request_comment_created: "質問・回答",
  solution_created: "解決案投稿",
  solution_accepted: "解決案採用",
  solution_feedback_created: "解決案フィードバック",
  app_published: "アプリ公開",
  profile_updated: "プロフィール更新",
};

export default async function AdminAnalyticsPage() {
  const auth = await createAuthServerClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user?.email) redirect("/login?next=/admin/analytics");

  const db = createServerClient();
  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single();
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  if (!adminEmails.includes(user.email) && profile?.role !== "admin") redirect("/");

  // Server-render timestamp anchors all 30-day calculations to one instant.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const since = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [
    { count: visitorCount },
    { count: sessionCount },
    { count: eventCount },
    { data: events, error: eventsError },
    { data: profiles },
    authUsersResult,
  ] = await Promise.all([
    db.from("analytics_visitors").select("*", { count: "exact", head: true }),
    db.from("analytics_sessions").select("*", { count: "exact", head: true }),
    db.from("analytics_events").select("*", { count: "exact", head: true }),
    db
      .from("analytics_events")
      .select("event_name, user_id, path, metadata, occurred_at")
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(50000),
    db.from("profiles").select("role, developer_enabled"),
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const rows = (events ?? []) as AnalyticsEvent[];
  const eventCounts = countBy(rows, (event) => event.event_name);
  eventCounts.login_completed = rows.filter(
    (event) => event.event_name === "auth_completed" && event.metadata?.mode !== "signup"
  ).length;
  eventCounts.signup_completed = rows.filter(
    (event) => event.event_name === "auth_completed" && event.metadata?.mode === "signup"
  ).length;
  const pageCounts = countBy(
    rows.filter((event) => event.event_name === "page_view"),
    (event) => event.path || "/"
  );
  const referrerCounts = countBy(
    rows.filter((event) => event.event_name === "session_started"),
    (event) => String(event.metadata?.referrer_host || "直接・不明")
  );
  const activeUsers = new Set(rows.map((event) => event.user_id).filter(Boolean)).size;
  const daily = dailyCounts(rows, now);
  const roleCounts = countBy(profiles ?? [], (item) => item.role || "user");
  const developerCount = (profiles ?? []).filter((item) => item.developer_enabled).length;
  const authUserCount = authUsersResult.data.users.length;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f0f0f]">アクセス解析</h1>
          <p className="text-sm text-[#606060] mt-1">Supabaseに保存した自社計測データです。期間表示は直近30日です。</p>
        </div>
        <Link href="/admin/reports" className="text-sm text-[#1B4F72] hover:underline">
          通報管理へ
        </Link>
      </div>

      {eventsError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          分析テーブルを読めません。最新のSupabase migrationを実行してください。
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <Stat label="累計訪問者" value={visitorCount ?? 0} />
        <Stat label="累計セッション" value={sessionCount ?? 0} />
        <Stat label="累計イベント" value={eventCount ?? 0} />
        <Stat label="登録アカウント" value={authUserCount} />
        <Stat label="30日アクティブ会員" value={activeUsers} />
        <Stat label="開発者プロフィール" value={developerCount} />
      </section>

      <section className="grid lg:grid-cols-2 gap-6 mb-8">
        <Panel title="主要イベント（30日）">
          <div className="divide-y divide-[#e5e5e5]">
            {Object.entries(EVENT_LABELS).map(([name, label]) => (
              <MetricRow key={name} label={label} value={eventCounts[name] ?? 0} />
            ))}
          </div>
        </Panel>
        <Panel title="アカウント種別">
          <div className="divide-y divide-[#e5e5e5]">
            <MetricRow label="認証アカウント" value={authUserCount} />
            <MetricRow label="プロフィール作成済み" value={profiles?.length ?? 0} />
            <MetricRow label="開発者参加ON" value={developerCount} />
            {Object.entries(roleCounts).map(([role, count]) => (
              <MetricRow key={role} label={`role: ${role}`} value={count} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid lg:grid-cols-[1.35fr_1fr] gap-6">
        <Panel title="日別推移（30日）">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[#909090]">
                <tr>
                  <th className="py-2 font-medium">日付</th>
                  <th className="py-2 font-medium text-right">PV</th>
                  <th className="py-2 font-medium text-right">認証完了</th>
                  <th className="py-2 font-medium text-right">投稿</th>
                  <th className="py-2 font-medium text-right">解決案</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {daily.map((day) => (
                  <tr key={day.date}>
                    <td className="py-2.5">{day.date}</td>
                    <td className="py-2.5 text-right">{day.page_view}</td>
                    <td className="py-2.5 text-right">{day.auth_completed}</td>
                    <td className="py-2.5 text-right">{day.request_created}</td>
                    <td className="py-2.5 text-right">{day.solution_created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="閲覧ページ・流入元（30日）">
          <h3 className="text-xs font-medium text-[#909090] mb-1">よく見られたページ</h3>
          <div className="divide-y divide-[#e5e5e5]">
            {topEntries(pageCounts, 15).map(([path, count]) => (
              <MetricRow key={path} label={path} value={count} mono />
            ))}
            {Object.keys(pageCounts).length === 0 && <Empty />}
          </div>
          <h3 className="text-xs font-medium text-[#909090] mt-5 mb-1">流入元ホスト</h3>
          <div className="divide-y divide-[#e5e5e5]">
            {topEntries(referrerCounts, 10).map(([host, count]) => (
              <MetricRow key={host} label={host} value={count} mono />
            ))}
            {Object.keys(referrerCounts).length === 0 && <Empty />}
          </div>
        </Panel>
      </section>

      <p className="text-xs text-[#909090] mt-6">
        IPアドレス、メールアドレス、投稿本文、検索語は分析テーブルへ保存していません。セッションは30分で更新されます。
      </p>
    </main>
  );
}

function countBy<T>(rows: T[], key: (row: T) => string) {
  const result: Record<string, number> = {};
  for (const row of rows) {
    const value = key(row);
    result[value] = (result[value] ?? 0) + 1;
  }
  return result;
}

function topEntries(values: Record<string, number>, limit: number) {
  return Object.entries(values).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function dailyCounts(events: AnalyticsEvent[], now: number) {
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(now - (29 - index) * 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(date);
  });
  const map = new Map(
    days.map((date) => [date, { date, page_view: 0, auth_completed: 0, request_created: 0, solution_created: 0 }])
  );
  for (const event of events) {
    const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date(event.occurred_at));
    const day = map.get(date);
    if (!day || !(event.event_name in day)) continue;
    const key = event.event_name as "page_view" | "auth_completed" | "request_created" | "solution_created";
    day[key] += 1;
  }
  return [...map.values()].reverse();
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
      <p className="text-xs text-[#909090]">{label}</p>
      <p className="text-2xl font-bold text-[#0f0f0f] mt-1">{value.toLocaleString("ja-JP")}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white p-5">
      <h2 className="text-sm font-semibold text-[#0f0f0f] mb-3">{title}</h2>
      {children}
    </div>
  );
}

function MetricRow({ label, value, mono = false }: { label: string; value: number; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className={`min-w-0 truncate text-[#606060] ${mono ? "font-mono text-xs" : ""}`}>{label}</span>
      <strong className="shrink-0 text-[#0f0f0f]">{value.toLocaleString("ja-JP")}</strong>
    </div>
  );
}

function Empty() {
  return <p className="py-6 text-center text-sm text-[#909090]">まだデータがありません</p>;
}
