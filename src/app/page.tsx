import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Blocks,
  MessageCircleQuestion,
  PenLine,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { JsonLd, absoluteUrl, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "APLZ — 小さな困りごとを、小さなアプリで。",
  description:
    "APLZは、暮らしや仕事の小さな困りごとを書き、開発者と話しながら、ちょうどよいWebアプリを見つける場所です。",
  path: "/",
  keywords: ["APLZ", "困りごと 解決", "小さなWebアプリ", "アプリを探す", "開発者 募集"],
});

const AUDIENCES = [
  {
    title: "困りごとを書く",
    label: "相談したい人へ",
    description: "仕様書はいりません。いま面倒なことと、どうなったら楽かを一言から書けます。",
    href: "/for-requesters",
    action: "投稿の流れを見る",
    icon: PenLine,
    accent: "bg-[#1B4F72] text-white",
  },
  {
    title: "開発者として参加",
    label: "作る人へ",
    description: "未解決の困りごとを見つけ、質問し、小さく作って実際の反応を受け取れます。",
    href: "/for-developers",
    action: "参加方法を見る",
    icon: Blocks,
    accent: "bg-[#B83232] text-white",
  },
  {
    title: "アプリを探す",
    label: "すぐ使いたい人へ",
    description: "公開アプリや無料ツールを、目的から探して、その場ですぐ試せます。",
    href: "/find-apps",
    action: "探し方を見る",
    icon: Search,
    accent: "bg-[#F0E7DA] text-[#5A4332]",
  },
];

const FLOW = [
  {
    number: "01",
    title: "困りごとに名前をつける",
    description: "毎回ちょっと面倒、誰か一人が覚えている。そんな状態を短い言葉にします。",
  },
  {
    number: "02",
    title: "会話して輪郭をつくる",
    description: "足りない条件は、開発者からの短い質問に答えながら整理できます。",
  },
  {
    number: "03",
    title: "小さく試して確かめる",
    description: "完成を待つより、まず使う。役立ったか、直したいかをその場で返せます。",
  },
];

export default function Home() {
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
            description: "小さな困りごとを、小さなWebアプリで解決する場所",
          },
        ]}
      />

      <section className="relative flex min-h-[calc(100svh-112px)] max-h-[720px] items-center overflow-hidden border-b border-[#e5e5e5] bg-white px-5 pb-28 pt-16 sm:px-8 sm:pb-32">
        <div className="mx-auto w-full max-w-5xl">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold text-[#1B4F72]">小さな困りごとを、小さなアプリで。</p>
            <h1 className="text-6xl font-bold leading-none text-[#0f0f0f] sm:text-7xl" style={{ fontFamily: "var(--font-baloo-2)" }}>
              APLZ
            </h1>
            <p className="mt-7 text-lg font-medium leading-9 text-[#292929] sm:text-xl">
              暮らしや仕事の「毎回ちょっと面倒」を書く。
              <br />
              作る人と話して、ちょうどよい道具にする。
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#606060]">
              困っている人、作る人、使いたい人が、小さなWebアプリを通して出会う場所です。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/for-requesters"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#1B4F72] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#15415F]"
              >
                困りごとを書きたい
                <ArrowRight size={16} />
              </Link>
              <Link
                href="#choose"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-[#cfcfcf] bg-white px-5 py-3 text-sm font-semibold text-[#0f0f0f] transition-colors hover:bg-[#f5f5f5]"
              >
                自分に合う入口を選ぶ
                <ArrowDown size={16} />
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20" aria-hidden="true">
          <Image
            src="/images/aplz-brand-strip.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </section>

      <section id="choose" className="border-b border-[#e5e5e5] bg-[#f7f7f5] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-semibold text-[#909090]">目的から選ぶ</p>
            <h2 className="mt-2 text-2xl font-bold text-[#0f0f0f] sm:text-3xl">今日は、何をしに来ましたか？</h2>
            <p className="mt-3 text-sm leading-7 text-[#606060]">
              目的ごとに、必要な情報と次の行動だけをまとめています。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {AUDIENCES.map((audience) => (
              <Link
                key={audience.href}
                href={audience.href}
                className="group flex min-h-[260px] flex-col rounded-lg border border-[#dedede] bg-white p-6 transition-colors hover:border-[#a9a9a9]"
              >
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${audience.accent}`}>
                  <audience.icon size={21} />
                </span>
                <p className="mt-6 text-xs font-semibold text-[#909090]">{audience.label}</p>
                <h3 className="mt-1 text-xl font-bold text-[#0f0f0f]">{audience.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-[#606060]">{audience.description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B4F72]">
                  {audience.action}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#e5e5e5] bg-white px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-xs font-semibold text-[#909090]">APLZの進み方</p>
              <h2 className="mt-2 text-2xl font-bold leading-tight text-[#0f0f0f] sm:text-3xl">
                仕様書からではなく、
                <br />
                ひとつの違和感から。
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#606060]">
                大きな計画や完璧な説明は必要ありません。困る場面を言葉にし、会話し、試せる大きさまで小さくします。
              </p>
            </div>
            <ol className="divide-y divide-[#e5e5e5] border-y border-[#e5e5e5]">
              {FLOW.map((step) => (
                <li key={step.number} className="grid gap-3 py-6 sm:grid-cols-[52px_1fr]">
                  <span className="font-mono text-sm font-semibold text-[#B83232]">{step.number}</span>
                  <div>
                    <h3 className="text-base font-bold text-[#0f0f0f]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#606060]">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e5e5e5] bg-[#f7f7f5] px-4 py-14 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <Principle icon={MessageCircleQuestion} title="会話で補える" text="分からないことは質問できる。最初から全部を決める必要はありません。" />
          <Principle icon={Sparkles} title="小さく始められる" text="一つの作業、一つの画面から。使えるかどうかを先に確かめます。" />
          <Principle icon={ShieldCheck} title="安全を先に考える" text="扱うデータや外部通信を明記し、個人情報を持ちすぎない設計を大切にします。" />
        </div>
      </section>

      <section className="bg-white px-4 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-[#0f0f0f] sm:text-3xl">その面倒、まず一言にしてみる。</h2>
          <p className="mt-3 text-sm leading-7 text-[#606060]">3分ほどで書き始められます。細かい条件は、あとから足せます。</p>
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

function Principle({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[40px_1fr] gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#dedede] bg-white text-[#1B4F72]">
        <Icon size={19} />
      </span>
      <div>
        <h3 className="font-semibold text-[#0f0f0f]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#606060]">{text}</p>
      </div>
    </div>
  );
}
