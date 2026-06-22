import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getArticleSearchQueries } from "../src/lib/article-geo.ts";
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

function csv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function normalize(value) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[・、。]/g, "");
}

const articles = [...readLegacyArticles(), ...GENERATED_ARTICLES];
const queryOwners = new Map();
const rows = articles.map((article) => {
  const queries = getArticleSearchQueries(article);
  for (const query of queries) {
    const key = normalize(query);
    queryOwners.set(key, [...(queryOwners.get(key) ?? []), article.slug]);
  }
  return [
    article.slug,
    article.title,
    article.category,
    article.contentFormat ?? "legacy",
    article.audience ?? article.reader ?? "",
    ...queries,
    `https://aplz.dev/articles/${article.slug}`,
  ];
});

const headers = [
  "slug",
  "title",
  "category",
  "content_format",
  "audience",
  ...Array.from({ length: 10 }, (_, index) => `query_${index + 1}`),
  "canonical_url",
];
const output = [headers, ...rows].map((row) => row.map(csv).join(",")).join("\n") + "\n";
fs.writeFileSync(path.join(root, "strategy/article-search-queries.csv"), output);

const missing = rows.filter((row) => row.length !== headers.length);
const collisions = [...queryOwners.entries()].filter(([, owners]) => owners.length > 1);
const totalQueries = [...queryOwners.values()].reduce((sum, owners) => sum + owners.length, 0);
const report = `# 記事別検索文検証

検証日: ${new Date().toISOString()}

- 記事総数: ${articles.length}
- 記事あたり検索文: 10
- 検索文総数: ${totalQueries}
- 10件未満の記事: ${missing.length}
- 完全一致する記事間重複: ${collisions.length}

## 重複検索文

${collisions.length ? collisions.map(([query, owners]) => `- ${query}: ${owners.join(", ")}`).join("\n") : "なし"}
`;
fs.writeFileSync(path.join(root, "reports/article-search-query-validation.md"), report);

if (articles.length !== 210 || totalQueries !== 2100 || missing.length || collisions.length) {
  console.error(report);
  process.exit(1);
}

console.log(report);
