"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, History, Sparkles, X, Upload } from "lucide-react";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; }
    .container { text-align: center; padding: 40px; }
    h1 { font-size: 24px; margin-bottom: 16px; }
    p { color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello, APLZ!</h1>
    <p>ここからアプリを作り始めましょう</p>
  </div>
</body>
</html>`;

interface HistoryEntry {
  code: string;
  timestamp: Date;
  label: string;
}

export default function NewAppPage() {
  const router = useRouter();

  // Editor states
  const [code, setCode] = useState(DEFAULT_TEMPLATE);
  const [previewCode, setPreviewCode] = useState(DEFAULT_TEMPLATE);

  // AI chat
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Publish modal
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishTitle, setPublishTitle] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Check AI availability
  useEffect(() => {
    fetch("/api/ai-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "<html></html>", prompt: "test" }),
    })
      .then((r) => {
        if (r.status === 503) setAiEnabled(false);
      })
      .catch(() => setAiEnabled(false));
  }, []);

  // Debounced preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewCode(code);
    }, 300);
    return () => clearTimeout(timer);
  }, [code]);

  // History helpers
  const saveToHistory = useCallback(
    (currentCode: string, label?: string) => {
      setHistory((prev) =>
        [
          {
            code: currentCode,
            timestamp: new Date(),
            label: label || `変更 ${prev.length + 1}`,
          },
          ...prev,
        ].slice(0, 50)
      );
    },
    []
  );

  const restoreFromHistory = (index: number) => {
    const entry = history[index];
    if (entry) {
      saveToHistory(code, "復元前");
      setCode(entry.code);
    }
  };

  // AI edit
  const handleAiEdit = async () => {
    if (!aiPrompt.trim() || isAiLoading) return;

    setIsAiLoading(true);
    saveToHistory(code, `AI編集前: ${aiPrompt.slice(0, 30)}`);

    try {
      const res = await fetch("/api/ai-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, prompt: aiPrompt }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "AI編集に失敗しました");
        return;
      }

      const data = await res.json();
      setCode(data.code);
      setAiPrompt("");
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Publish
  const handleConfirmPublish = async () => {
    if (!publishTitle.trim() || isPublishing) return;
    setIsPublishing(true);

    try {
      const blob = new Blob([code], { type: "text/html" });
      const file = new File([blob], "index.html", { type: "text/html" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", publishTitle);
      formData.append("description", publishDescription);
      formData.append("is_public", "true");

      const res = await fetch("/api/publish", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "公開に失敗しました");
        return;
      }

      const data = await res.json();
      router.push(`/apps/${data.slug}`);
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-[#e5e5e5] bg-white flex-shrink-0">
        <Link
          href="/publish"
          className="flex items-center gap-1 text-sm text-[#606060] hover:text-[#0f0f0f] transition-colors"
        >
          <ArrowLeft size={16} />
          戻る
        </Link>

        <div className="text-sm font-medium text-[#0f0f0f]">
          新しいアプリを作成
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center gap-1 text-sm text-[#606060] hover:text-[#0f0f0f] px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer"
          >
            <History size={16} />
            履歴
          </button>
          <button
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-1 text-sm text-white bg-[#1B4F72] hover:bg-[#15415F] px-4 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
          >
            <Upload size={16} />
            公開する
          </button>
        </div>
      </div>

      {/* Main: Editor + Preview */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Code Editor */}
        <div className="w-1/2 border-r border-[#e5e5e5]">
          <Editor
            height="100%"
            defaultLanguage="html"
            value={code}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 8 },
            }}
          />
        </div>

        {/* Live Preview */}
        <div className="w-1/2 bg-white">
          <iframe
            srcDoc={previewCode}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="プレビュー"
          />
        </div>

        {/* History Panel */}
        {historyOpen && (
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white border-l border-[#e5e5e5] shadow-lg z-20 overflow-y-auto">
            <div className="p-4 border-b border-[#e5e5e5] flex items-center justify-between">
              <h3 className="font-medium text-sm">変更履歴</h3>
              <button
                onClick={() => setHistoryOpen(false)}
                className="cursor-pointer text-[#909090] hover:text-[#0f0f0f]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="divide-y divide-[#f0f0f0]">
              {history.length === 0 ? (
                <p className="p-4 text-sm text-[#909090]">
                  まだ変更履歴がありません
                </p>
              ) : (
                history.map((entry, i) => (
                  <button
                    key={i}
                    onClick={() => restoreFromHistory(i)}
                    className="w-full text-left p-3 hover:bg-[#f5f5f5] transition-colors cursor-pointer"
                  >
                    <div className="text-sm font-medium text-[#0f0f0f]">
                      {entry.label}
                    </div>
                    <div className="text-xs text-[#909090]">
                      {entry.timestamp.toLocaleTimeString("ja-JP")}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Chat Footer */}
      {aiEnabled && (
        <div className="h-14 flex items-center gap-2 px-4 border-t border-[#e5e5e5] bg-[#fafafa] flex-shrink-0">
          <Sparkles size={18} className="text-[#1B4F72] flex-shrink-0" />
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiEdit()}
            placeholder='AIに指示: 「ToDoアプリ作って」「ボタンの色を青にして」'
            className="flex-1 bg-white border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72] transition-colors"
            disabled={isAiLoading}
          />
          <button
            onClick={handleAiEdit}
            disabled={isAiLoading || !aiPrompt.trim()}
            className="bg-[#1B4F72] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#15415F] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isAiLoading ? "処理中..." : "送信"}
          </button>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in">
            <h2 className="text-lg font-bold text-[#0f0f0f] mb-4">
              アプリを公開
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#606060] mb-1.5">
                  アプリ名
                </label>
                <input
                  type="text"
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  placeholder="アプリの名前"
                  className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#1B4F72] transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-[#606060] mb-1.5">
                  説明 <span className="text-[#909090]">（任意）</span>
                </label>
                <textarea
                  value={publishDescription}
                  onChange={(e) => setPublishDescription(e.target.value)}
                  placeholder="アプリの説明"
                  rows={3}
                  className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#1B4F72] transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPublishModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#e5e5e5] text-[#606060] text-sm font-medium hover:bg-[#f5f5f5] transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmPublish}
                disabled={!publishTitle.trim() || isPublishing}
                className="flex-1 py-2.5 rounded-lg bg-[#1B4F72] text-white text-sm font-medium hover:bg-[#15415F] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isPublishing ? "公開中..." : "公開する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
