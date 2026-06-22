import type { Article } from "@/lib/articles";

export interface ArticleSource {
  name: string;
  organization: string;
  url: string;
  description: string;
}

export interface ArticleKeyPoint {
  heading: string;
  summary: string;
  anchor: string;
}

const GEO_IMPLEMENTED_AT = "2026-06-22T12:20:00+09:00";

const SOURCES = {
  life: [
    {
      name: "令和3年社会生活基本調査",
      organization: "総務省統計局",
      url: "https://www.stat.go.jp/data/shakai/2021/index.html",
      description: "家事、仕事、学習、地域活動などの生活時間・生活行動を確認できる基幹統計",
    },
    {
      name: "消費者政策・消費生活情報",
      organization: "消費者庁",
      url: "https://www.caa.go.jp/policies/",
      description: "商品・サービス、消費者安全、表示など暮らしに関わる公的情報",
    },
  ],
  learning: [
    {
      name: "小学校、中学校、高等学校",
      organization: "文部科学省",
      url: "https://www.mext.go.jp/a_menu/01_c.htm",
      description: "学校教育、教育の情報化、学校環境に関する政策・資料",
    },
    {
      name: "学習指導要領『生きる力』",
      organization: "文部科学省",
      url: "https://www.mext.go.jp/a_menu/shotou/new-cs/index.htm",
      description: "学校での学びと教育課程を考えるための公式資料",
    },
  ],
  work: [
    {
      name: "『働き方改革』の実現に向けて",
      organization: "厚生労働省",
      url: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000148322.html",
      description: "労働時間、多様な働き方、職場環境に関する制度・施策",
    },
    {
      name: "働くときの基礎知識",
      organization: "厚生労働省",
      url: "https://www.check-roudou.mhlw.go.jp/study/",
      description: "労働条件、安全配慮、職場での権利と義務を確認できる公式教材",
    },
  ],
  business: [
    {
      name: "2025年版 小規模企業白書",
      organization: "中小企業庁",
      url: "https://www.chusho.meti.go.jp/pamflet/hakusyo/2025/shokibo/index.html",
      description: "小規模事業者の現状、課題、取組事例をまとめた公的資料",
    },
    {
      name: "小規模企業支援",
      organization: "中小企業庁",
      url: "https://www.chusho.meti.go.jp/keiei/shokibo/index.html",
      description: "小規模事業者向けの経営支援制度と関連情報",
    },
  ],
  local: [
    {
      name: "地方創生",
      organization: "内閣官房・内閣府",
      url: "https://www.chisou.go.jp/sousei/",
      description: "地域の課題、地方創生、地域での取組に関する公式情報",
    },
    {
      name: "地域循環共生圏（循環分野）",
      organization: "環境省",
      url: "https://www.env.go.jp/recycle/circul/area_cases.html",
      description: "地域資源の循環、再利用、地域内連携を考えるための公的資料",
    },
  ],
  technology: [
    {
      name: "アクセシビリティ",
      organization: "デジタル庁デザインシステム",
      url: "https://design.digital.go.jp/guidance/accessibility/",
      description: "誰もが利用できるWebサービスを設計・運用するための公式ガイダンス",
    },
    {
      name: "AIセキュリティ",
      organization: "情報処理推進機構（IPA）",
      url: "https://www.ipa.go.jp/digital/ai/security/index.html",
      description: "AI利用時の漏えい、改ざん、誤情報などのリスクに関する公的資料",
    },
    {
      name: "個人情報保護法令・ガイドライン",
      organization: "個人情報保護委員会",
      url: "https://www.ppc.go.jp/personalinfo/legal/",
      description: "個人情報を扱うサービスで確認すべき法令・ガイドライン",
    },
  ],
  people: [
    {
      name: "令和3年社会生活基本調査",
      organization: "総務省統計局",
      url: "https://www.stat.go.jp/data/shakai/2021/index.html",
      description: "仕事、余暇、学習、社会参加など人々の生活行動を確認できる基幹統計",
    },
    {
      name: "文化芸術政策",
      organization: "文化庁",
      url: "https://www.bunka.go.jp/seisaku/bunka_gyosei/",
      description: "文化、創作、地域文化に関する国の政策と公表資料",
    },
  ],
} satisfies Record<string, ArticleSource[]>;

export function getArticleGeo(article: Article) {
  const keyPoints = article.sections.slice(0, 4).map((section, index) => ({
    heading: section.heading,
    summary: firstSentence(section.body[0] ?? article.lead),
    anchor: `section-${index + 1}`,
  }));

  return {
    directAnswer: article.lead.trim(),
    keyPoints,
    sources: getArticleSources(article),
    readingMinutes: Math.max(3, Math.ceil((article.wordCount ?? 1500) / 500)),
    updatedAt:
      new Date(article.updatedAt).getTime() > new Date(GEO_IMPLEMENTED_AT).getTime()
        ? article.updatedAt
        : GEO_IMPLEMENTED_AT,
  };
}

export function getArticleSources(article: Article): ArticleSource[] {
  const world = Number(article.editorialWorld?.replace(/\D/g, ""));
  if (world >= 1 && world <= 8) return SOURCES.life;
  if (world >= 9 && world <= 13) return SOURCES.learning;
  if (world >= 14 && world <= 20) return SOURCES.work;
  if (world >= 21 && world <= 27) return SOURCES.business;
  if (world >= 28 && world <= 32) return SOURCES.local;
  if (world >= 33 && world <= 38) return SOURCES.technology;
  if (world === 39) return SOURCES.people;
  if (world === 40) return SOURCES.technology;

  const searchable = `${article.category} ${article.title} ${article.keywords.join(" ")}`;
  if (/学校|学童|学生|教育|学び|教室/.test(searchable)) return SOURCES.learning;
  if (/町内会|自治会|地域|祭り|イベント/.test(searchable)) return SOURCES.local;
  if (/個人事業|店舗|飲食|商売|サロン|民泊|売上|仕込み/.test(searchable)) return SOURCES.business;
  if (/仕事|業務|会議|採用|引き継ぎ/.test(searchable)) return SOURCES.work;
  if (/アプリ|Web|AI|デザイン|Excel|LINE|個人情報/.test(searchable)) return SOURCES.technology;
  return SOURCES.life;
}

export function getRelatedArticles(article: Article, allArticles: Article[], limit = 4) {
  return allArticles
    .filter((candidate) => candidate.slug !== article.slug)
    .map((candidate) => ({ candidate, score: relatedScore(article, candidate) }))
    .sort((a, b) => b.score - a.score || b.candidate.updatedAt.localeCompare(a.candidate.updatedAt))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

function relatedScore(article: Article, candidate: Article) {
  let score = 0;
  if (article.editorialWorld && article.editorialWorld === candidate.editorialWorld) score += 8;
  if (article.secondaryWorld && article.secondaryWorld === candidate.secondaryWorld) score += 5;
  if (article.category === candidate.category) score += 4;
  if (article.audience && article.audience === candidate.audience) score += 2;
  const keywords = new Set(article.keywords.map(normalize));
  score += candidate.keywords.filter((keyword) => keywords.has(normalize(keyword))).length;
  return score;
}

function firstSentence(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  const match = compact.match(/^.*?[。！？]/);
  return (match?.[0] ?? compact).slice(0, 180);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[・、。]/g, "");
}
