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

const GEO_IMPLEMENTED_AT = "2026-06-22T15:30:00+09:00";

const SEARCH_ANGLE_MODIFIERS = [
  {
    pattern: /誰のために続いている/,
    modifiers: ["誰のため", "続く理由", "役割", "必要な理由", "負担している人", "見直す基準", "なくならない理由", "関係者"],
  },
  {
    pattern: /少しだけ面倒なまま残る/,
    modifiers: ["面倒なまま残る理由", "変わらない原因", "改善しにくい理由", "不便が残る", "面倒を減らす方法", "変える手順", "最初の一歩", "対処法"],
  },
  {
    pattern: /一人で抱えない/,
    modifiers: ["一人で抱えない方法", "共有方法", "分担の決め方", "見える化", "小さな表", "担当者の負担", "属人化を防ぐ", "相談の仕方"],
  },
  {
    pattern: /見取り図にする/,
    modifiers: ["迷う場所", "見取り図", "流れを整理", "手順を可視化", "最初に確認すること", "判断基準", "困る場面", "選び方"],
  },
  {
    pattern: /失敗例を先に並べてみる/,
    modifiers: ["失敗例", "よくある失敗", "注意点", "やってはいけないこと", "失敗を防ぐ", "トラブル例", "改善例", "確認項目"],
  },
] as const;

const FORMAT_MODIFIERS: Record<string, string[]> = {
  F01: ["なぜ", "理由", "どうすればいい", "考え方", "原因", "対処法", "具体例", "わかりやすく"],
  F02: ["方法", "やり方", "手順", "始め方", "準備", "進め方", "コツ", "具体例"],
  F03: ["仕組み", "なぜ", "理由", "背景", "構造", "わかりやすく", "具体例", "問題点"],
  F04: ["比較", "選び方", "違い", "判断基準", "どちら", "メリット", "デメリット", "注意点"],
  F05: ["チェックリスト", "テンプレート", "確認項目", "書き方", "作り方", "抜け漏れ", "記入例", "注意点"],
  F06: ["無料ツール", "計算", "自動", "シミュレーション", "使い方", "入力項目", "結果の見方", "注意点"],
  F07: ["種類", "一覧", "分類", "事例", "探し方", "違い", "特徴", "データベース"],
  F08: ["仕事", "経験", "現場", "始めた理由", "一日の流れ", "工夫", "悩み", "続ける理由"],
  F09: ["一日", "現場", "仕事の流れ", "時間", "作業内容", "準備", "終わった後", "実態"],
  F10: ["作り方", "制作過程", "試作", "失敗", "改善", "完成まで", "振り返り", "記録"],
  F11: ["なぜ", "意味", "必要性", "問題点", "考え方", "違和感", "問い", "見直す"],
  F12: ["統計", "データ", "実態", "調査", "数字", "傾向", "分析", "資料"],
  F13: ["検証", "試してみた", "結果", "比較", "条件", "実験方法", "わかったこと", "注意点"],
  F14: ["図解", "仕組み", "わかりやすく", "流れ", "構造", "具体例", "見取り図", "整理"],
  F15: ["診断", "チェック", "セルフチェック", "目安", "判断", "質問", "結果", "改善方法"],
  F16: ["相談", "質問", "回答", "悩み", "困ったとき", "聞き方", "答え方", "事例"],
  F17: ["歴史", "由来", "いつから", "なぜ生まれた", "変化", "昔", "文化", "現在"],
  F18: ["最新", "動向", "今後", "変化", "影響", "背景", "注目点", "考え方"],
};

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
  const topic = getSearchTopic(article);
  const sections = article.sections.map((section, index) => ({
    ...section,
    heading: getDisplayHeading(article, topic, section.heading),
    anchor: `section-${index + 1}`,
  }));
  const keyPoints = sections.slice(0, 4).map((section) => ({
    heading: section.heading,
    summary: firstSentence(section.body[0] ?? article.lead),
    anchor: section.anchor,
  }));

  return {
    directAnswer: article.lead.trim(),
    keyPoints,
    sections,
    searchQueries: getArticleSearchQueries(article),
    sources: getArticleSources(article),
    readingMinutes: Math.max(3, Math.ceil((article.wordCount ?? 1500) / 500)),
    updatedAt:
      new Date(article.updatedAt).getTime() > new Date(GEO_IMPLEMENTED_AT).getTime()
        ? article.updatedAt
        : GEO_IMPLEMENTED_AT,
  };
}

export function getArticleSearchQueries(article: Article): string[] {
  const topic = getSearchTopic(article);
  const modifiers = getSearchModifiers(article);
  const rawQueries = [
    cleanQuery(article.title),
    ...article.keywords.filter((keyword) => isUsefulExistingQuery(keyword, article, topic)),
    ...modifiers.map((modifier) => `${topic} ${modifier}`),
    article.originalArtifact ? `${topic} ${article.originalArtifact} 作り方` : "",
    article.audience ? `${shortAudience(article.audience)} ${topic}` : "",
  ];

  const queries: string[] = [];
  const seen = new Set<string>();
  for (const query of rawQueries) {
    const cleaned = cleanQuery(query);
    const key = normalize(cleaned);
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    queries.push(cleaned);
    if (queries.length === 10) break;
  }

  return queries;
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
  const queryTerms = new Set(getArticleSearchQueries(article).flatMap(searchTerms));
  score += getArticleSearchQueries(candidate)
    .flatMap(searchTerms)
    .filter((term) => queryTerms.has(term)).length * 0.25;
  return score;
}

function getSearchTopic(article: Article) {
  if (article.editorialWorld && article.keywords[1]) return cleanQuery(article.keywords[1]);
  return cleanQuery(article.keywords[0] ?? article.category);
}

function getDisplayHeading(article: Article, topic: string, heading: string) {
  if (!article.editorialWorld || normalize(heading).includes(normalize(topic))) return heading;
  const replacements: Record<string, string> = {
    "まず見えている困りごと": `${topic}で最初に見える困りごと`,
    "印刷して使える観察メモ": `${topic}を見直すための観察メモ`,
    "迷った時の判断チャート": `${topic}で迷った時の判断チャート`,
    "角が立ちにくい相談の言い方": `${topic}を相談する時の言い方`,
    "考え直したいこと": `${topic}で考え直したいこと`,
    "読者が検索した時に知りたいこと": `${topic}を調べる人が知りたいこと`,
    "場面を分解するための見取り図": `${topic}の場面を分ける見取り図`,
    "方法を選ぶ前に比べたいこと": `${topic}の方法を選ぶ前に比べたいこと`,
    "今日から試せる小さな手順": `${topic}で今日から試せる手順`,
    "失敗しやすい境界線": `${topic}で失敗しやすい境界線`,
    "読み終えた後のチェックリスト": `${topic}を見直すチェックリスト`,
    "公開後に見直すポイント": `${topic}を実際に試した後の見直し方`,
    "次に深掘りするなら": `${topic}をさらに深く考えるなら`,
  };
  return replacements[heading] ?? `${topic}について: ${heading}`;
}

function getSearchModifiers(article: Article) {
  const angle = SEARCH_ANGLE_MODIFIERS.find(({ pattern }) => pattern.test(article.title));
  if (angle) return [...angle.modifiers];
  const inferredFormat = /テンプレート|チェックリスト/.test(article.title)
    ? "F05"
    : /計算|逆算|シミュレーション/.test(article.title)
      ? "F06"
      : /方法|作り方|作るには|整理する|数える|決める/.test(article.title)
        ? "F02"
        : "F01";
  const formatCode = article.contentFormat?.match(/F\d{2}/)?.[0] ?? inferredFormat;
  return FORMAT_MODIFIERS[formatCode] ?? FORMAT_MODIFIERS.F01;
}

function isUsefulExistingQuery(query: string, article: Article, topic: string) {
  const cleaned = cleanQuery(query);
  if (!cleaned || cleaned.length < 2) return false;
  if (normalize(cleaned) === normalize(topic)) return false;
  if (normalize(cleaned) === normalize(article.audience ?? article.reader ?? "")) return false;
  if (normalize(cleaned) === normalize(article.category)) return false;
  return !/^[PFQ]\d{2}(?:\s|$)/.test(cleaned);
}

function shortAudience(audience: string) {
  const mappings: Array<[RegExp, string]> = [
    [/中学生|高校生|高専生/, "学生"],
    [/大学生/, "大学生"],
    [/教員|学校職員/, "教員"],
    [/保護者|PTA/, "保護者 PTA"],
    [/町内会|自治会/, "町内会 自治会"],
    [/地域イベント/, "イベント運営"],
    [/個人事業主/, "個人事業主"],
    [/副業/, "副業"],
    [/小規模店舗/, "小さな店"],
    [/飲食店|キッチンカー/, "飲食店"],
    [/サロン|教室運営/, "サロン 教室"],
    [/民泊|観光/, "民泊 観光"],
    [/フリーランス|クリエイター/, "フリーランス"],
    [/エンジニア|開発者/, "開発者"],
    [/事務担当/, "事務担当"],
    [/責任者/, "チーム責任者"],
    [/NPO|ボランティア/, "NPO ボランティア"],
    [/地方|田舎/, "地方暮らし"],
    [/家族|共同生活/, "家族"],
  ];
  return mappings.find(([pattern]) => pattern.test(audience))?.[1] ?? "一般向け";
}

function cleanQuery(value: string) {
  return value
    .replace(/[？?！!。、「」『』]/g, " ")
    .replace(/[、,:：]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function searchTerms(query: string) {
  return query
    .split(/[\s・、。/]+/)
    .map(normalize)
    .filter((term) => term.length >= 2);
}

function firstSentence(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  const match = compact.match(/^.*?[。！？]/);
  return (match?.[0] ?? compact).slice(0, 180);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[・、。]/g, "");
}
