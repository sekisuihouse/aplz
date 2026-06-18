import fs from "node:fs";

const csvPath = "strategy/article-master.csv";
const rows = fs.readFileSync(csvPath, "utf8").trim().split("\n").map(parseCsvLine);
const header = rows.shift();
const index = Object.fromEntries(header.map((key, i) => [key, i]));

const total = rows.length;
const aplzPrimary = rows.filter((row) => row[index.aplz_primary_topic] === "true").length;
const aplzMentioned = rows.filter((row) => row[index.aplz_mentioned] === "true").length;
const aplzCta = rows.filter((row) => row[index.aplz_cta] === "true").length;
const noAplz = total - aplzMentioned;
const titles = rows.map((row) => row[index.title]);
const titleBiasWords = ["アプリ", "業務改善", "効率化"];
const titleBias = titleBiasWords.map((word) => [word, titles.filter((title) => title.includes(word)).length]);

const failures = [];
if (aplzPrimary / total > 0.1) failures.push("APLZ主題記事が10%を超えています");
if (aplzMentioned / total > 0.2) failures.push("APLZ言及記事が20%を超えています");
if (aplzCta / total > 0.2) failures.push("APLZ CTA記事が20%を超えています");
if (noAplz / total < 0.6) failures.push("APLZ非言及記事が60%未満です");
for (const [word, count] of titleBias) {
  if (count / total > 0.25) failures.push(`タイトルの「${word}」偏重が強すぎます`);
}

const report = [
  "# APLZ偏重検証",
  "",
  `- 総記事数: ${total}`,
  `- APLZ主題: ${aplzPrimary} (${percent(aplzPrimary, total)})`,
  `- APLZ言及: ${aplzMentioned} (${percent(aplzMentioned, total)})`,
  `- APLZ CTA: ${aplzCta} (${percent(aplzCta, total)})`,
  `- APLZ非言及: ${noAplz} (${percent(noAplz, total)})`,
  "",
  "## タイトル語彙",
  ...titleBias.map(([word, count]) => `- ${word}: ${count} (${percent(count, total)})`),
  "",
  failures.length ? `## NG\n\n${failures.map((item) => `- ${item}`).join("\n")}` : "## OK\n\n基準内です。",
  "",
].join("\n");

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/aplz-bias-report.md", report);
console.log(report);
if (failures.length) process.exit(1);

function percent(value, base) {
  return `${((value / base) * 100).toFixed(1)}%`;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}
