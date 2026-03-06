"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Trash2, Plus, Key } from "lucide-react";

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
  const [creating, setCreating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<NewToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    const res = await fetch("/api/settings/api-token");
    if (res.ok) setTokens(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    const res = await fetch("/api/settings/api-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() || "default" }),
    });
    if (res.ok) {
      const data: NewToken = await res.json();
      setGeneratedToken(data);
      setNewName("");
      fetchTokens();
    }
    setCreating(false);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      if (generatedToken?.id === id) setGeneratedToken(null);
    }
    setDeleting(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Key size={22} className="text-[#0f0f0f]" />
        <h1 className="text-2xl font-bold text-[#0f0f0f]">APIトークン</h1>
      </div>

      <p className="text-sm text-[#606060] mb-8">
        Claude Desktop / Claude Code などのMCPクライアントからaplzを操作するためのトークンです。
        トークンは生成時に一度だけ表示されます。
      </p>

      {/* Generate form */}
      <div className="bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-[#0f0f0f] mb-4">新しいトークンを生成</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="トークン名（例: claude-desktop）"
            className="flex-1 bg-white border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#22d3ee] text-black text-sm font-semibold hover:bg-[#06b6d4] transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Plus size={14} />
            生成
          </button>
        </div>
      </div>

      {/* Generated token reveal */}
      {generatedToken && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 animate-fade-in">
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
              onClick={() => handleCopy(generatedToken.token)}
              className="shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
            >
              <Copy size={12} />
              {copied ? "コピー済" : "コピー"}
            </button>
          </div>
        </div>
      )}

      {/* Token list */}
      <div>
        <h2 className="text-sm font-semibold text-[#0f0f0f] mb-3">
          既存のトークン{tokens.length > 0 && ` (${tokens.length})`}
        </h2>

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
                  disabled={deleting === token.id}
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
        <h2 className="text-sm font-semibold text-[#0f0f0f] mb-3">Claude Desktop の設定方法</h2>
        <p className="text-xs text-[#606060] mb-3">
          <code className="bg-white px-1 py-0.5 rounded text-[#0f0f0f]">
            ~/Library/Application Support/Claude/claude_desktop_config.json
          </code>{" "}
          に追加:
        </p>
        <pre className="bg-[#1e1e1e] text-[#d4d4d4] text-xs rounded-lg p-4 overflow-x-auto leading-relaxed">
{`{
  "mcpServers": {
    "aplz": {
      "command": "npx",
      "args": ["-y", "@aplz/mcp-server"],
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
