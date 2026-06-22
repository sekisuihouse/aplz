import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const siteUrl = (process.env.AUDIT_SITE_URL || "https://aplz.dev").replace(/\/$/, "");

function normalizePath(value) {
  const pathname = decodeURIComponent(new URL(value).pathname).replace(/\/$/, "");
  return pathname || "/";
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" },
  });
  return { response, body: await response.text() };
}

const { response: sitemapResponse, body: sitemap } = await fetchText(`${siteUrl}/sitemap.xml`);
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const failures = [];
let cursor = 0;

async function auditWorker() {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    try {
      const { response, body } = await fetchText(url);
      const canonical = body.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? "";
      const canonicalMatches = Boolean(
        canonical &&
          new URL(canonical).origin === siteUrl &&
          normalizePath(canonical) === normalizePath(url)
      );
      const checks = {
        status: response.status === 200,
        title: /<title>[^<]+<\/title>/i.test(body),
        description: /<meta name="description" content="[^"]+"/i.test(body),
        h1: /<h1(?:\s|>)/i.test(body),
        indexable: !/<meta name="robots" content="[^"]*noindex/i.test(body),
        canonical: canonicalMatches,
      };
      const failedChecks = Object.entries(checks)
        .filter(([, passed]) => !passed)
        .map(([name]) => name);
      if (failedChecks.length) {
        failures.push({ url, failedChecks, status: response.status, canonical });
      }
    } catch (error) {
      failures.push({ url, failedChecks: ["fetch"], error: String(error) });
    }
  }
}

await Promise.all(Array.from({ length: 10 }, auditWorker));

const robots = await fetchText(`${siteUrl}/robots.txt`);
const robotsOk = robots.response.status === 200 && robots.body.includes(`Sitemap: ${siteUrl}/sitemap.xml`);
const report = `# 公開URLインデックス監査

検証日: ${new Date().toISOString()}

- 対象サイト: ${siteUrl}
- sitemap.xml応答: ${sitemapResponse.status}
- サイトマップURL数: ${urls.length}
- 合格URL数: ${urls.length - failures.length}
- 不合格URL数: ${failures.length}
- robots.txtのサイトマップ指定: ${robotsOk ? "正常" : "不備あり"}

## 判定項目

- HTTP 200
- title
- meta description
- H1
- noindexなし
- canonicalとサイトマップURLの一致

## 不合格URL

${failures.length ? failures.map((failure) => `- ${failure.url}: ${failure.failedChecks.join("、")} (canonical: ${failure.canonical || "なし"})`).join("\n") : "なし"}
`;

fs.writeFileSync(path.join(root, "reports/indexability-audit.md"), report);

if (sitemapResponse.status !== 200 || !urls.length || failures.length || !robotsOk) {
  console.error(report);
  process.exit(1);
}

console.log(report);
