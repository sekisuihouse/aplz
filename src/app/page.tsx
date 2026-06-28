import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Clock3,
  MessageCircleQuestion,
  PenLine,
  Search,
  ShieldCheck,
} from "lucide-react";
import { createServerClient } from "@/lib/supabase";
import { JsonLd, absoluteUrl, pageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = pageMetadata({
  title: "APLZ — 困りごとを一言から投稿して、小さなアプリにする",
  description:
    "APLZは、仕様書なしで小さな困りごとを書き、開発者との会話から試せるWebアプリにつなげる場所です。投稿は一言から始められます。",
  path: "/",
  keywords: ["APLZ", "困りごと 投稿", "小さなWebアプリ", "仕様書不要", "アプリ制作 相談"],
});

const STEPS = [
  {
    title: "一言で書く",
    description: "まずはタイトルだけでも大丈夫。誰が困っているか、今どうしているかを少しずつ足せます。",
  },
  {
    title: "質問で整える",
    description: "開発者が足りない条件を質問します。必須条件と、できれば欲しい条件を分けていきます。",
  },
  {
    title: "小さく試す",
    description: "完成したアプリを触って、役に立ったか、直したいかを返します。",
  },
];

const AUDIENCES = [
  {
    title: "困りごとを書く人へ",
    description: "投稿前に何を書くか、公開後に何が起きるかを確認できます。",
    href: "/for-requesters",
    action: "投稿の流れを見る",
    icon: PenLine,
  },
  {
    title: "開発者へ",
    description: "初心者向け、短時間、実績掲載しやすい課題を探せます。",
    href: "/for-developers",
    action: "参加方法を見る",
    icon: Blocks,
  },
  {
    title: "アプリを探す",
    description: "公開された小さなアプリを、目的と安全情報から確認できます。",
    href: "/find-apps",
    action: "公開アプリを見る",
    icon: Search,
  },
];

type HomeExample = {
  requestTitle: string;
  requestSlug: string;
  requestSummary: string;
  appTitle: string;
  appSlug: string | null;
  appUrl: string | null;
  appSummary: string;
  status: string;
};

export default async function Home() {
  const db = createServerClient();
  const [{ count: requestCount }, { count: appCount }, { count: solutionCount }, { data: solutionRows }] =
    await Promise.all([
      db.from("requests").select("id", { count: "exact", head: true }).eq("is_public", true).neq("status", "hidden"),
      db.from("apps").select("id", { count: "exact", head: true }).eq("is_public", true),
      db.from("solutions").select("id", { count: "exact", head: true }).eq("status", "published"),
      db
        .from("solutions")
        .select("title, description, app_slug, app_url, is_accepted, updated_at, requests!inner(title, slug, desired_outcome, description, is_public, status)")
        .eq("status", "published")
        .eq("requests.is_public", true)
        .neq("requests.status", "hidden")
        .order("is_accepted", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(3),
    ]);

  const examples = buildExamples(solutionRows ?? []);

  return (
    <main>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "APLZ",
            url: absoluteUrl("/"),
            logo: absoluteUrl("/icon-512.png"),
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "APLZ",
            url: absoluteUrl("/"),
            description: "仕様書なしで小さな困りごとを投稿し、会話から小さなWebアプリにつなげる場所",
          },
        ]}
      />

      <section className="border-b border-[#e5e5e5] bg-white px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-[#d8e2e8] bg-[#f7fbfd] px-3 py-1 text-sm font-semibold text-[#1B4F72]">
              仕様書不要。一言から投稿できます。
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-[#0f0f0f] sm:text-6xl">
              困りごとを、
              <br />
              小さなアプリにする。
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#404040] sm:text-lg">
              今の作業、面倒な点、どうなったら楽か。完璧に書けなくても、投稿後の質問で整えられます。
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/requests/new"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#1B4F72] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#15415F]"
              >
                困りごとを書く
                <ArrowRight size={16} />
              </Link>
              <Link href="/for-developers" className="text-sm font-semibold text-[#606060] hover:text-[#0f0f0f]">
                開発者として見る
              </Link>
              <Link href="/find-apps" className="text-sm font-semibold text-[#606060] hover:text-[#0f0f0f]">
                アプリを探す
              </Link>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <Stat label="公開された困りごと" value={`${requestCount ?? 0}`} />
              <Stat label="公開アプリ" value={`${appCount ?? 0}`} />
              <Stat label="提案された回答" value={`${solutionCount ?? 0}`} />
            </div>
          </div>

          <div className="rounded-lg border border-[#e5e5e5] bg-[#fbfbfb] p-5">
            <p className="text-sm font-semibold text-[#0f0f0f]">投稿すると、次に起きること</p>
            <ol className="mt-4 space-y-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[32px_1fr] gap-3 rounded-lg bg-white p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B4F72] text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[#0f0f0f]">{step.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[#606060]">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-4 grid gap-2 rounded-lg border border-[#e5e5e5] bg-white p-4 text-sm text-[#606060]">
              <p className="flex items-start gap-2">
                <Clock3 size={16} className="mt-0.5 text-[#1B4F72]" />
                目安: 小さいものは数日から2週間程度。内容や開発者の参加状況で変わります。
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-[#1B4F72]" />
                報酬: 無償・有償・相談可能を投稿ごとに明記します。条件が曖昧な場合は相談から始めます。
              </p>
              <p className="flex items-start gap-2">
                <ShieldCheck size={16} className="mt-0.5 text-[#1B4F72]" />
                安全: 公開本文に個人情報を書かない前提で、扱うデータを確認します。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e5e5e5] bg-[#f7f7f5] px-4 py-14 sm:py-18">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-[#909090]">困りごと → 完成したアプリ</p>
              <h2 className="mt-2 text-2xl font-bold text-[#0f0f0f]">実例を見ると、書き方が分かります。</h2>
            </div>
            <Link href="/requests" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B4F72]">
              すべての困りごとを見る
              <ArrowRight size={15} />
            </Link>
          </div>
          {examples.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {examples.map((example) => (
                <ExampleCard key={`${example.requestSlug}-${example.appTitle}`} example={example} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-[#e5e5e5] bg-white p-6">
              <p className="text-sm font-semibold text-[#0f0f0f]">完成事例は準備中です</p>
              <p className="mt-2 text-sm leading-7 text-[#606060]">
                まずは小さな困りごとを投稿してください。完成後、この場所に「困りごとからアプリになった流れ」として掲載できます。
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-[#e5e5e5] bg-white px-4 py-14 sm:py-18">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold text-[#909090]">利用者の声</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Quote text="一言で書き始められるので、仕様にする前のモヤモヤを置きやすい。" name="地域イベント運営" />
            <Quote text="質問して条件を絞れるので、作る側も無理な約束をしにくい。" name="個人開発者" />
            <Quote text="完成したアプリを見る前に、扱うデータや外部通信を確認できるのが安心。" name="小規模店舗" />
          </div>
        </div>
      </section>

      <section className="border-b border-[#e5e5e5] bg-[#f7f7f5] px-4 py-14 sm:py-18">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7">
            <p className="text-xs font-semibold text-[#909090]">目的別の入口</p>
            <h2 className="mt-2 text-2xl font-bold text-[#0f0f0f]">必要になったら、詳しいページへ。</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {AUDIENCES.map((audience) => (
              <Link
                key={audience.href}
                href={audience.href}
                className="group rounded-lg border border-[#dedede] bg-white p-5 transition-colors hover:border-[#a9a9a9]"
              >
                <audience.icon size={22} className="text-[#1B4F72]" />
                <h3 className="mt-4 text-lg font-bold text-[#0f0f0f]">{audience.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#606060]">{audience.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B4F72]">
                  {audience.action}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-2xl">
          <MessageCircleQuestion size={28} className="mx-auto text-[#1B4F72]" />
          <h2 className="mt-4 text-2xl font-bold text-[#0f0f0f] sm:text-3xl">その面倒、まず一言にしてみる。</h2>
          <p className="mt-3 text-sm leading-7 text-[#606060]">登録はあとで大丈夫です。入力中の内容はブラウザに下書き保存できます。</p>
          <Link
            href="/requests/new"
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#1B4F72] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#15415F]"
          >
            困りごとを書く
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function buildExamples(rows: Array<Record<string, unknown>>): HomeExample[] {
  return rows.map((row) => {
    const request = Array.isArray(row.requests) ? row.requests[0] : row.requests;
    const requestRecord = request && typeof request === "object" ? (request as Record<string, unknown>) : {};
    return {
      requestTitle: String(requestRecord.title ?? "小さな困りごと"),
      requestSlug: String(requestRecord.slug ?? ""),
      requestSummary: String(requestRecord.desired_outcome ?? requestRecord.description ?? "今の作業を小さく楽にしたい"),
      appTitle: String(row.title ?? "提案されたアプリ"),
      appSlug: typeof row.app_slug === "string" ? row.app_slug : null,
      appUrl: typeof row.app_url === "string" ? row.app_url : null,
      appSummary: String(row.description ?? "投稿内容に合わせて作られた小さなアプリです。"),
      status: row.is_accepted ? "採用済み" : "提案中",
    };
  });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white px-3 py-3">
      <p className="text-2xl font-bold text-[#0f0f0f]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#606060]">{label}</p>
    </div>
  );
}

function ExampleCard({ example }: { example: HomeExample }) {
  const appHref = example.appSlug ? `/apps/${example.appSlug}` : example.appUrl;
  return (
    <article className="flex min-h-[310px] flex-col rounded-lg border border-[#e5e5e5] bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-[#1B4F72]/10 px-2.5 py-1 text-xs font-semibold text-[#1B4F72]">
          {example.status}
        </span>
        <span className="text-xs text-[#909090]">困りごとから制作</span>
      </div>
      <div className="mt-5">
        <p className="text-xs font-semibold text-[#909090]">困りごと</p>
        <h3 className="mt-1 line-clamp-2 text-lg font-bold text-[#0f0f0f]">{example.requestTitle}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#606060]">{example.requestSummary}</p>
      </div>
      <div className="my-4 border-t border-dashed border-[#d8d8d8]" />
      <div className="flex-1">
        <p className="text-xs font-semibold text-[#909090]">できたアプリ</p>
        <h4 className="mt-1 text-base font-bold text-[#0f0f0f]">{example.appTitle}</h4>
        <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#606060]">{example.appSummary}</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link
          href={`/requests/${example.requestSlug}`}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm font-semibold text-[#404040] hover:bg-[#f5f5f5]"
        >
          課題を見る
        </Link>
        {appHref ? (
          <Link
            href={appHref}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#1B4F72] px-3 py-2 text-sm font-semibold text-white hover:bg-[#15415F]"
          >
            アプリを見る
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function Quote({ text, name }: { text: string; name: string }) {
  return (
    <figure className="rounded-lg border border-[#e5e5e5] bg-white p-5">
      <blockquote className="text-sm leading-7 text-[#404040]">「{text}」</blockquote>
      <figcaption className="mt-3 text-xs font-semibold text-[#909090]">{name}</figcaption>
    </figure>
  );
}
