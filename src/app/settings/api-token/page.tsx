"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, Trash2, Plus, Key, Terminal, Check } from "lucide-react";

interface Token {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

interface NewToken extends Token {
  token: string;
}

function formatDate(str: string): string {
  const d = new Date(str);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

export default function ApiTokenPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [creating, setCreating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<NewToken | null>(null);
  const [tokenVisible, setTokenVisible] = useState(true);
  const [tokenSaved, setTokenSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSetup, setCopiedSetup] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTokens = useCallback(async () => {
    const res = await fetch("/api/settings/api-token");
    if (res.ok) setTokens(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (fadeTimer.current) clearTimeout(fadeTimer.current); }, []);

  const handleCreate = async () => {
    if (creating) return;
    if (!newName.trim()) {
      setNameError("トークン名を入力してください");
      return;
    }
    setNameError("");
    setCreating(true);
    setTokenSaved(false);
    setTokenVisible(true);
    const res = await fetch("/api/settings/api-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const data: NewToken = await res.json();
      setGeneratedToken(data);
      setNewName("");
      fetchTokens();
    }
    setCreating(false);
  };

  const handleCopyToken = async (token: string) => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    // After 1.5s: start fade-out, then hide
    fadeTimer.current = setTimeout(() => {
      setTokenVisible(false);
      fadeTimer.current = setTimeout(() => {
        setGeneratedToken(null);
        setTokenSaved(true);
      }, 400);
    }, 1500);
  };

  const handleDelete = async (id: string) => {
    if (deleting) return;
    setDeleting(id);
    const res = await fetch("/api/settings/api-token", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setTokens((prev) => prev.filter((t) => t.id !== id));
      if (generatedToken?.id === id) { setGeneratedToken(null); setTokenSaved(false); }
    }
    setDeleting(null);
  };

  const handleDeleteAll = async () => {
    if (!confirm(`${tokens.length}個のトークンを全て削除しますか？この操作は取り消せません。`)) return;
    setDeletingAll(true);
    for (const t of tokens) {
      await fetch("/api/settings/api-token", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id }),
      });
    }
    setTokens([]);
    setGeneratedToken(null);
    setTokenSaved(false);
    setDeletingAll(false);
  };

  const hasToken = !loading && tokens.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Key size={22} className="text-[#0f0f0f]" />
        <h1 className="text-2xl font-bold text-[#0f0f0f]">APIトークン</h1>
      </div>

      <p className="text-sm text-[#606060] mb-8">
        Claude Desktop / Claude Code / ChatGPT / Cursor / Windsurf など、MCP対応のAIツールからaplzを操作するためのトークンです。
        トークンは生成時に一度だけ表示されます。
      </p>

      {/* Generate form — hidden when token already exists */}
      {!loading && (
        hasToken ? (
          <div className="bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl p-5 mb-8">
            <p className="text-sm text-[#606060]">
              既にトークンがあります。新しいトークンを生成するには既存のトークンを削除してください。
            </p>
          </div>
        ) : (
          <div className="bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl p-5 mb-8">
            <h2 className="text-sm font-semibold text-[#0f0f0f] mb-4">新しいトークンを生成</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); if (nameError) setNameError(""); }}
                placeholder="トークン名（例: claude-desktop）"
                className="flex-1 bg-white border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#22d3ee] text-black text-sm font-semibold hover:bg-[#06b6d4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plus size={14} />
                生成
              </button>
            </div>
            {nameError && <p className="text-xs text-red-500 mt-2">{nameError}</p>}
          </div>
        )
      )}

      {/* Generated token reveal */}
      {generatedToken && (
        <div
          className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 transition-opacity duration-400"
          style={{ opacity: tokenVisible ? 1 : 0 }}
        >
          <p className="text-sm font-semibold text-amber-800 mb-1">
            トークンを保存してください
          </p>
          <p className="text-xs text-amber-600 mb-3">
            このトークンは今後表示されません。今すぐコピーして安全な場所に保存してください。
          </p>
          <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
            <code className="flex-1 text-xs text-[#0f0f0f] font-mono break-all">
              {generatedToken.token}
            </code>
            <button
              onClick={() => handleCopyToken(generatedToken.token)}
              disabled={copied}
              className="shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer disabled:cursor-default"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "コピー完了" : "コピー"}
            </button>
          </div>

          {/* Easy setup */}
          <div className="mt-5 pt-5 border-t border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={14} className="text-amber-700" />
              <h3 className="text-sm font-semibold text-amber-800">かんたんセットアップ</h3>
            </div>
            <p className="text-xs text-amber-600 mb-3">
              以下のコマンドをターミナルに貼り付けるだけで、
              <br />
              Claudeから直接アプリを公開できるようになります。
            </p>
            <div className="flex items-center gap-2 bg-[#1e1e1e] rounded-lg px-3 py-2.5">
              <code className="flex-1 text-xs text-[#d4d4d4] font-mono break-all">
                npx aplz-mcp-server --setup {generatedToken.token}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`npx aplz-mcp-server --setup ${generatedToken.token}`);
                  setCopiedSetup(true);
                  setTimeout(() => setCopiedSetup(false), 2000);
                }}
                className="shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#333] text-[#d4d4d4] hover:bg-[#444] transition-colors cursor-pointer"
              >
                {copiedSetup ? <Check size={12} /> : <Copy size={12} />}
                {copiedSetup ? "コピー済" : "コピー"}
              </button>
            </div>
            <p className="text-[11px] text-amber-500 mt-2">※ Node.js 18以上が必要です</p>
          </div>
        </div>
      )}

      {/* Token saved message */}
      {tokenSaved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-8 flex items-center gap-2">
          <Check size={16} className="text-green-600 shrink-0" />
          <p className="text-sm text-green-700">トークンは安全に保存されました。</p>
        </div>
      )}

      {/* Token list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#0f0f0f]">
            既存のトークン{tokens.length > 0 && ` (${tokens.length})`}
          </h2>
          {tokens.length > 1 && (
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-40"
            >
              全てのトークンを削除
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-[#909090]">読み込み中...</p>
        ) : tokens.length === 0 ? (
          <div className="text-center py-10 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
            <p className="text-sm text-[#909090]">トークンがありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between bg-white border border-[#e5e5e5] rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#0f0f0f]">{token.name}</p>
                  <p className="text-xs text-[#909090] mt-0.5">
                    作成: {formatDate(token.created_at)}
                    {token.last_used_at && ` · 最終使用: ${formatDate(token.last_used_at)}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(token.id)}
                  disabled={deleting === token.id || deletingAll}
                  className="p-2 text-[#909090] hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40"
                  title="削除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage instructions */}
      <div className="mt-10 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#0f0f0f] mb-3">かんたんセットアップ</h2>
        <p className="text-xs text-[#606060] mb-2">
          トークン生成後、以下のコマンドを実行するだけで設定完了：
        </p>
        <pre className="bg-[#1e1e1e] text-[#d4d4d4] text-xs rounded-lg p-4 overflow-x-auto leading-relaxed mb-4">
{`npx aplz-mcp-server --setup aplz_...`}
        </pre>
        <h2 className="text-sm font-semibold text-[#0f0f0f] mb-2">手動設定</h2>
        <p className="text-xs text-[#606060] mb-2">
          <code className="bg-white px-1 py-0.5 rounded text-[#0f0f0f]">
            ~/Library/Application Support/Claude/claude_desktop_config.json
          </code>{" "}
          に追加：
        </p>
        <pre className="bg-[#1e1e1e] text-[#d4d4d4] text-xs rounded-lg p-4 overflow-x-auto leading-relaxed">
{`{
  "mcpServers": {
    "aplz": {
      "command": "npx",
      "args": ["aplz-mcp-server"],
      "env": {
        "APLZ_API_TOKEN": "aplz_..."
      }
    }
  }
}`}
        </pre>
      </div>
    </div>
  );
}
