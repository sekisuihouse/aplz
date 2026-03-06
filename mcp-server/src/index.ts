#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

const server = new McpServer({
  name: "aplz",
  version: "1.0.0",
});

const API_BASE = process.env.APLZ_API_BASE ?? "https://aplz.dev";

function getToken(): string {
  const token = process.env.APLZ_API_TOKEN;
  if (!token) throw new Error("APLZ_API_TOKEN environment variable is required");
  return token;
}

// ─── Tool: publish_app ────────────────────────────────────────────────────────

server.tool(
  "publish_app",
  "aplzにWebアプリを公開する。HTMLファイルまたはZIPファイルのパスを指定。",
  {
    title: z.string().describe("アプリのタイトル"),
    file_path: z.string().describe("公開するHTMLファイルまたはZIPファイルのパス"),
    description: z.string().optional().describe("アプリの説明（省略可）"),
    community_slug: z.string().optional().describe("公開先コミュニティのslug（省略時はオープン公開）"),
    is_public: z.boolean().default(true).describe("オープンに公開するか（デフォルト: true）"),
  },
  async ({ title, file_path, description, community_slug, is_public }) => {
    const token = getToken();
    const resolvedPath = path.resolve(file_path);

    if (!fs.existsSync(resolvedPath)) {
      return {
        content: [{ type: "text", text: `エラー: ファイルが見つかりません: ${resolvedPath}` }],
      };
    }

    const stat = fs.statSync(resolvedPath);
    if (stat.isDirectory()) {
      return {
        content: [{ type: "text", text: "エラー: ディレクトリは現在未サポートです。index.htmlまたはZIPファイルを指定してください。" }],
      };
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    if (ext !== ".html" && ext !== ".zip") {
      return {
        content: [{ type: "text", text: "エラー: .htmlまたは.zipファイルのみ対応しています。" }],
      };
    }

    const fileBuffer = fs.readFileSync(resolvedPath);
    const mimeType = ext === ".zip" ? "application/zip" : "text/html";
    const blob = new Blob([fileBuffer], { type: mimeType });

    const formData = new FormData();
    formData.append("file", blob, path.basename(resolvedPath));
    formData.append("name", title);
    if (description) formData.append("description", description);
    if (community_slug) formData.append("community_slug", community_slug);
    formData.append("is_public", String(is_public));

    let response: Response;
    try {
      response = await fetch(`${API_BASE}/api/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    } catch (e) {
      return {
        content: [{ type: "text", text: `ネットワークエラー: ${e instanceof Error ? e.message : String(e)}` }],
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return {
        content: [{ type: "text", text: `公開失敗 (${response.status}): ${errorText}` }],
      };
    }

    const result = await response.json() as { success: boolean; slug?: string; app_url?: string; platform_url?: string; error?: string };
    if (!result.success) {
      return { content: [{ type: "text", text: `公開失敗: ${result.error}` }] };
    }

    return {
      content: [{
        type: "text",
        text: [
          "公開成功!",
          `アプリURL (直接起動): ${result.app_url}`,
          `フィードバックページ: ${result.platform_url}`,
          `slug: ${result.slug}`,
        ].join("\n"),
      }],
    };
  }
);

// ─── Tool: list_apps ──────────────────────────────────────────────────────────

server.tool(
  "list_apps",
  "aplzに公開した自分のアプリ一覧を取得する",
  {
    limit: z.number().int().min(1).max(50).default(10).describe("取得件数（最大50）"),
  },
  async ({ limit }) => {
    const token = getToken();

    let response: Response;
    try {
      response = await fetch(`${API_BASE}/api/apps/mine?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      return {
        content: [{ type: "text", text: `ネットワークエラー: ${e instanceof Error ? e.message : String(e)}` }],
      };
    }

    if (!response.ok) {
      return { content: [{ type: "text", text: "アプリ一覧の取得に失敗しました" }] };
    }

    const apps = await response.json() as Array<{ name: string; slug: string; avg_rating: string | null; comment_count: number }>;

    if (!apps.length) {
      return { content: [{ type: "text", text: "まだアプリを公開していません" }] };
    }

    const lines = apps.map((app, i) => {
      const rating = app.avg_rating ? `★${app.avg_rating}` : "評価なし";
      return `${i + 1}. ${app.name} (${rating}, ${app.comment_count}コメント) - ${API_BASE}/apps/${app.slug}`;
    });

    return {
      content: [{ type: "text", text: `あなたのアプリ一覧:\n${lines.join("\n")}` }],
    };
  }
);

// ─── Tool: get_feedback ───────────────────────────────────────────────────────

server.tool(
  "get_feedback",
  "aplzに公開したアプリのフィードバック（評価・コメント・リアクション）を取得する",
  {
    app_slug: z.string().describe("アプリのslug（URLの /apps/[slug] 部分）"),
  },
  async ({ app_slug }) => {
    const token = getToken();

    let response: Response;
    try {
      response = await fetch(`${API_BASE}/api/apps/${app_slug}/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      return {
        content: [{ type: "text", text: `ネットワークエラー: ${e instanceof Error ? e.message : String(e)}` }],
      };
    }

    if (response.status === 404) {
      return { content: [{ type: "text", text: `アプリ "${app_slug}" が見つかりません` }] };
    }
    if (!response.ok) {
      return { content: [{ type: "text", text: "フィードバックの取得に失敗しました" }] };
    }

    const data = await response.json() as {
      title: string;
      avg_rating: string | null;
      rating_count: number;
      reactions: { like: number; want: number; amazing: number; feedback: number };
      comments: Array<{ content: string; time_ago: string }>;
    };

    const lines = [
      `「${data.title}」のフィードバック:`,
      `評価: ${data.avg_rating ? `★${data.avg_rating}` : "なし"}（${data.rating_count}件）`,
      `リアクション: いいね ${data.reactions.like} / 使いたい ${data.reactions.want} / すごい ${data.reactions.amazing} / 改善点あり ${data.reactions.feedback}`,
      "",
      "コメント:",
    ];

    if (data.comments.length === 0) {
      lines.push("（まだコメントはありません）");
    } else {
      for (const c of data.comments) {
        lines.push(`- "${c.content}" (${c.time_ago})`);
      }
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ─── Setup mode ───────────────────────────────────────────────────────────────

function getConfigPath(): string {
  const platform = process.platform;
  if (platform === "darwin") {
    return path.join(process.env.HOME ?? "~", "Library", "Application Support", "Claude", "claude_desktop_config.json");
  } else if (platform === "win32") {
    return path.join(process.env.APPDATA ?? "", "Claude", "claude_desktop_config.json");
  } else {
    return path.join(process.env.HOME ?? "~", ".config", "Claude", "claude_desktop_config.json");
  }
}

async function runSetup(token: string): Promise<void> {
  const configPath = getConfigPath();
  const configDir = path.dirname(configPath);

  // Ensure directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Read existing config or start fresh
  let config: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch {
      // Corrupted JSON — start fresh
    }
  }

  // Merge aplz entry
  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    config.mcpServers = {};
  }
  (config.mcpServers as Record<string, unknown>).aplz = {
    command: "npx",
    args: ["@aplz/mcp-server"],
    env: { APLZ_API_TOKEN: token },
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

  console.log("セットアップ完了！Claude Desktopを再起動してください。");
  console.log("以降はClaudeに「このアプリをaplzに公開して」と言うだけで公開できます。");

  // Try to restart Claude Desktop (Mac only, best-effort)
  if (process.platform === "darwin") {
    try {
      const { execSync } = await import("child_process");
      try { execSync("killall Claude 2>/dev/null", { stdio: "ignore" }); } catch { /* not running */ }
      await new Promise((r) => setTimeout(r, 1000));
      try { execSync("open -a Claude 2>/dev/null", { stdio: "ignore" }); } catch { /* not installed */ }
    } catch { /* ignore */ }
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const setupIdx = process.argv.indexOf("--setup");
  if (setupIdx !== -1) {
    const token = process.argv[setupIdx + 1];
    if (!token || !token.startsWith("aplz_")) {
      console.error("使い方: npx @aplz/mcp-server --setup aplz_xxxxxxxxxxxxxxxx");
      process.exit(1);
    }
    await runSetup(token);
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
