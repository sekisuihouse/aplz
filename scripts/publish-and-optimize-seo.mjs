import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GENERATED_ARTICLES } from "../src/lib/generated-articles.ts";
import { GENERATED_TOOLS } from "../src/lib/generated-tools.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

function read(filePath) {
  return fs.readFileSync(path.join(root, filePath), "utf8");
}

function write(filePath, value) {
  const full = path.join(root, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, value);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function stringifyCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
}

function toMap(rows) {
  const [headers, ...body] = rows;
  return body.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
  );
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
}

function clampDescription(value) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= 155) return text;
  return `${text.slice(0, 152)}...`;
}

function plainTitle(value) {
  return value.replace(/[「」『』、。]/g, "").replace(/\s+/g, " ").trim();
}

function buildSeoDescription(article, row) {
  const artifact = row.original_artifact || article.sections?.[1]?.heading || "具体メモ";
  const audience = row.audience || article.reader || "このテーマが気になる人";
  const keyword = row.primary_keyword || article.keywords?.[0] || article.category;
  return clampDescription(
    `${article.title}。${audience}向けに、${keyword}の背景、よくある失敗、${artifact}で今日見直せることを整理します。`
  );
}

function buildToolSeo(tool) {
  const title = tool.title;
  const category = title.includes("家事") || title.includes("家族") || title.includes("忘れ物")
    ? "暮らし"
    : title.includes("会議") || title.includes("引き継ぎ") || title.includes("Excel") || title.includes("フォーム")
      ? "働く"
      : title.includes("イベント") || title.includes("町内会") || title.includes("席替え")
        ? "地域・学校"
        : title.includes("原価") || title.includes("値付け") || title.includes("予約") || title.includes("固定費")
          ? "商売"
          : "小さな判断";
  return {
    ...tool,
    category,
    seoTitle: `${title} | 無料${title.includes("診断") ? "診断" : "ツール"} | APLZ`,
    seoDescription: clampDescription(
      `${title}は、${tool.description}ための無料ツールです。入力例、結果の意味、計算根拠、個人情報への配慮を確認しながら使えます。`
    ),
    keywords: unique([title, `${title} 無料`, `${title} 使い方`, category, "無料ツール", "診断", "計算機"]),
  };
}

function publishMarkdownFiles() {
  const contentDir = path.join(root, "content");
  const changed = [];
  const walk = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        walk(full);
      } else if (item.isFile() && item.name.endsWith(".md")) {
        const current = fs.readFileSync(full, "utf8");
        const next = current.replace(/^status:\s*published_draft$/m, "status: published");
        if (next !== current) {
          fs.writeFileSync(full, next);
          changed.push(path.relative(root, full));
        }
      }
    }
  };
  walk(contentDir);
  return changed;
}

const rows = parseCsv(read("strategy/article-master.csv"));
const headers = rows[0];
const records = toMap(rows);
const bySlug = new Map(records.map((record) => [record.slug, record]));

const statusIndex = headers.indexOf("status");
if (statusIndex >= 0) {
  for (let i = 1; i < rows.length; i += 1) {
    rows[i][statusIndex] = "published";
  }
  write("strategy/article-master.csv", stringifyCsv(rows));
}

const enrichedArticles = GENERATED_ARTICLES.map((article) => {
  const row = bySlug.get(article.slug) ?? {};
  const seoDescription = buildSeoDescription(article, row);
  const seoKeywords = unique([
    row.primary_keyword,
    ...article.keywords,
    plainTitle(article.title),
    article.category,
    row.editorial_world,
    row.secondary_world,
    row.audience,
    row.content_format,
    row.original_artifact,
  ]);
  return {
    ...article,
    status: "published",
    seoTitle: `${article.title} | ${article.category}の読み物`,
    seoDescription,
    seoKeywords,
    contentFormat: row.content_format,
    audience: row.audience || article.reader,
    editorialWorld: row.editorial_world,
    secondaryWorld: row.secondary_world,
    originalArtifact: row.original_artifact,
    searchIntent: row.search_intent,
    aplzMentioned: row.aplz_mentioned === "true",
    aplzPrimaryTopic: row.aplz_primary_topic === "true",
    aplzCta: row.aplz_cta === "true",
    wordCount: Number(row.word_count || 900),
  };
});

const enrichedTools = GENERATED_TOOLS.map(buildToolSeo);
const changedMarkdown = publishMarkdownFiles();

write(
  "src/lib/generated-articles.ts",
  `export const GENERATED_ARTICLES = ${JSON.stringify(enrichedArticles, null, 2)} as const;\n`
);
write(
  "src/lib/generated-tools.ts",
  `export const GENERATED_TOOLS = ${JSON.stringify(enrichedTools, null, 2)} as const;\n`
);

const total = enrichedArticles.length;
const aplzPrimary = enrichedArticles.filter((article) => article.aplzPrimaryTopic).length;
const aplzMentioned = enrichedArticles.filter((article) => article.aplzMentioned).length;
const aplzCta = enrichedArticles.filter((article) => article.aplzCta).length;

write(
  "reports/seo-publication-report.md",
  `# 公開・SEO反映レポート

## 実行内容

- content配下の記事frontmatterを published に更新: ${changedMarkdown.length}件
- strategy/article-master.csv の status を published に更新: ${total}件
- 生成記事ごとに seoTitle / seoDescription / seoKeywords を付与
- 記事ごとに contentFormat / audience / editorialWorld / originalArtifact を付与
- APLZ CTAを記事ごとのフラグで制御
- 無料ツール20件へ seoTitle / seoDescription / keywords / category を付与

## SEO方針

- Google公式のSEO Starter Guide、title link、meta description、Article structured data、sitemap、helpful content guidanceに合わせる。
- 各記事の主題、読者層、検索意図、独自成果物をdescriptionとkeywordsへ反映する。
- APLZ誘導は全記事共通ではなく、article-master.csv の aplz_cta=true の記事だけに限定する。

## 公開状態

- 公開記事: ${total}
- APLZ主題: ${aplzPrimary} (${((aplzPrimary / total) * 100).toFixed(1)}%)
- APLZ言及: ${aplzMentioned} (${((aplzMentioned / total) * 100).toFixed(1)}%)
- APLZ CTA: ${aplzCta} (${((aplzCta / total) * 100).toFixed(1)}%)
`
);

console.log(`Published ${total} articles and optimized SEO metadata.`);
console.log(`Updated markdown files: ${changedMarkdown.length}`);
