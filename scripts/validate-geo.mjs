import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getArticleGeo } from "../src/lib/article-geo.ts";
import { GENERATED_ARTICLES } from "../src/lib/generated-articles.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

function readLegacyArticles() {
  const source = fs.readFileSync(path.join(root, "src/lib/articles.ts"), "utf8");
  const match = source.match(/export const ARTICLES: Article\[] = (\[[\s\S]*?\n\]);/);
  if (!match) throw new Error("ARTICLESを読み取れませんでした");
  return Function(`"use strict"; return ${match[1]};`)();
}

const articles = [...readLegacyArticles(), ...GENERATED_ARTICLES];
const failures = [];

for (const article of articles) {
  const geo = getArticleGeo(article);
  const reasons = [];
  if (geo.directAnswer.length < 30) reasons.push("結論が短い");
  if (geo.keyPoints.length < 2) reasons.push("要点が2件未満");
  if (geo.keyPoints.some((point) => !point.summary || !point.anchor)) reasons.push("要点の要約またはアンカーがない");
  if (geo.sources.length < 2) reasons.push("関連する公的資料が2件未満");
  if (geo.sources.some((source) => !source.url.startsWith("https://"))) reasons.push("HTTPSではない資料URLがある");
  if (!article.publishedAt || !geo.updatedAt) reasons.push("公開日または更新日がない");
  if (!article.faqs || article.faqs.length < 2) reasons.push("FAQが2件未満");
  if (!article.keywords || article.keywords.length < 3) reasons.push("キーワードが3件未満");
  if (reasons.length) failures.push({ slug: article.slug, reasons });
}

const articlePage = fs.readFileSync(path.join(root, "src/app/articles/[slug]/page.tsx"), "utf8");
const robots = fs.readFileSync(path.join(root, "src/app/robots.ts"), "utf8");
const templateChecks = [
  [articlePage.includes("abstract: geo.directAnswer"), "Article JSON-LDにabstractがない"],
  [articlePage.includes("citation: geo.sources"), "Article JSON-LDにcitationがない"],
  [articlePage.includes("APLZ編集部"), "編集主体が表示されていない"],
  [articlePage.includes("関連する一次情報・公的資料"), "関連資料が画面に表示されていない"],
  [robots.includes('userAgent: "OAI-SearchBot"'), "OAI-SearchBotの規則がない"],
];
const templateFailures = templateChecks.filter(([passed]) => !passed).map(([, message]) => message);

const report = `# GEO検証

検証日: ${new Date().toISOString()}

## 結果

- 記事総数: ${articles.length}
- 記事データの不備: ${failures.length}
- 共通テンプレートの不備: ${templateFailures.length}
- 各記事の結論・要点: ${articles.length - failures.length}/${articles.length}
- 各記事の公的資料: ${articles.length - failures.length}/${articles.length}

## 記事データの不備

${failures.length ? failures.map((failure) => `- ${failure.slug}: ${failure.reasons.join("、")}`).join("\n") : "なし"}

## 共通テンプレートの不備

${templateFailures.length ? templateFailures.map((failure) => `- ${failure}`).join("\n") : "なし"}
`;

fs.writeFileSync(path.join(root, "reports/geo-validation.md"), report);

if (failures.length || templateFailures.length || articles.length !== 210) {
  console.error(report);
  process.exit(1);
}

console.log(report);
