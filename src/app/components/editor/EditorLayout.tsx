"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Undo2, Redo2, History, X } from "lucide-react";
import { ResizableHorizontal, ResizableVertical } from "../ResizablePanels";
import ChatPanel, { type ChatMessage } from "./ChatPanel";
import PreviewPanel from "./PreviewPanel";
import StyleEditor, { type SelectedElementInfo } from "./StyleEditor";
import CodeEditor from "./CodeEditor";

interface AppData {
  id: string;
  name: string;
  description: string;
  slug: string;
  version: number;
  last_published_at: string;
  user_id: string;
}

interface HistoryEntry {
  code: string;
  timestamp: Date;
  label: string;
}

interface EditorLayoutProps {
  /** null for new app mode */
  app: AppData | null;
  initialCode: string;
  isNewApp: boolean;
  backUrl: string;
}

const INITIAL_GREETING =
  "こんにちは！何を作りますか？\n\n例:\n• 「ToDoアプリを作って」\n• 「タイマーアプリを作って」\n• 「じゃんけんゲームを作って」\n\n何でも指示してください！";
const EDIT_GREETING =
  "このアプリを編集できます。\n\n例:\n• 「ボタンの色を青にして」\n• 「レスポンシブ対応にして」\n• 「アニメーションを追加して」";

export default function EditorLayout({
  app: initialApp,
  initialCode,
  isNewApp,
  backUrl,
}: EditorLayoutProps) {
  const router = useRouter();

  const [app, setApp] = useState(initialApp);
  const [code, setCode] = useState(initialCode);
  const [previewCode, setPreviewCode] = useState(initialCode);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: isNewApp ? INITIAL_GREETING : EDIT_GREETING,
      timestamp: new Date(),
    },
  ]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Undo / Redo
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Right bottom tab
  const [rightBottomTab, setRightBottomTab] = useState<"style" | "code">(
    "style"
  );

  // Style editor
  const [selectedElement, setSelectedElement] =
    useState<SelectedElementInfo | null>(null);

  // Save / publish
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Publish modal (new app only)
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishTitle, setPublishTitle] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Debounced preview
  useEffect(() => {
    const timer = setTimeout(() => setPreviewCode(code), 300);
    return () => clearTimeout(timer);
  }, [code]);

  // Listen for element selection from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "element-selected") {
        setSelectedElement({
          tagName: e.data.tagName,
          textContent: e.data.textContent,
          styles: e.data.styles,
        });
        setRightBottomTab("style");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // History helpers
  const saveToHistory = useCallback(
    (currentCode: string, label?: string) => {
      setUndoStack((prev) =>
        [
          {
            code: currentCode,
            timestamp: new Date(),
            label: label || `変更 ${prev.length + 1}`,
          },
          ...prev,
        ].slice(0, 50)
      );
      setRedoStack([]); // clear redo on new change
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[0];
    setRedoStack((prev) => [code, ...prev]);
    setUndoStack((prev) => prev.slice(1));
    setCode(last.code);
  }, [undoStack, code]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setUndoStack((prev) => [{ code, timestamp: new Date(), label: "Redo前" }, ...prev]);
    setRedoStack((prev) => prev.slice(1));
    setCode(next);
  }, [redoStack, code]);

  const restoreFromHistory = (index: number) => {
    const entry = undoStack[index];
    if (entry) {
      saveToHistory(code, "復元前");
      setCode(entry.code);
    }
  };

  // Keyboard shortcuts: Cmd+Z / Cmd+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Style change → send to iframe
  const handleStyleChange = (property: string, value: string) => {
    // Find the iframe element
    const iframe = document.querySelector(
      'iframe[title="プレビュー"]'
    ) as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: "apply-style", property, value },
        "*"
      );
    }
    // Update local selectedElement state for UI feedback
    if (selectedElement) {
      setSelectedElement({
        ...selectedElement,
        styles: {
          ...selectedElement.styles,
          [property]: value,
        },
      });
    }
  };

  // AI edit
  const handleAiEdit = async () => {
    if (!aiPrompt.trim() || isAiLoading) return;

    const userMessage = aiPrompt;
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);
    setAiPrompt("");
    setIsAiLoading(true);
    saveToHistory(code, `AI編集前: ${userMessage.slice(0, 30)}`);

    try {
      const res = await fetch("/api/ai-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, prompt: userMessage }),
      });

      if (!res.ok) {
        const error = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `エラー: ${error.error || "AI編集に失敗しました"}`,
            timestamp: new Date(),
          },
        ]);
        return;
      }

      const data = await res.json();
      setCode(data.code);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.summary || "修正しました！プレビューを確認してください。",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "通信エラーが発生しました。もう一度試してください。",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save (existing app)
  const handleSave = async () => {
    if (isSaving || !app) return;
    setIsSaving(true);
    setSaveMessage("");

    try {
      const blob = new Blob([code], { type: "text/html" });
      const file = new File([blob], "index.html", { type: "text/html" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", app.slug);
      formData.append("title", app.name);
      formData.append("description", app.description || "");

      const res = await fetch("/api/publish", {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "保存に失敗しました");
        return;
      }

      const data = await res.json();
      setApp((prev) => (prev ? { ...prev, version: data.version } : prev));
      setSaveMessage("反映しました！");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  // Publish (new app)
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
      <div className="h-11 flex items-center justify-between px-3 border-b border-[#e5e5e5] bg-white flex-shrink-0">
        {/* Left */}
        <div className="flex items-center gap-2">
          <Link
            href={backUrl}
            className="text-[#606060] hover:text-[#0f0f0f] transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <svg width="20" height="20" viewBox="0 0 36 36">
            <g transform="translate(18,18)">
              <path
                d="M-13,-9 C-3,-9 3,9 13,9"
                fill="none"
                stroke="#1B4F72"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M-13,9 C-3,9 3,-9 13,-9"
                fill="none"
                stroke="#B83232"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <circle cx="0" cy="0" r="2.2" fill="#1B4F72" />
            </g>
          </svg>
          <span className="text-sm font-medium text-[#0f0f0f]">
            {isNewApp ? "新しいアプリ" : app?.name}
            {app?.version && (
              <span className="text-[#909090] ml-1">v{app.version}</span>
            )}
          </span>
          {saveMessage && (
            <span className="text-xs text-green-600 ml-2">{saveMessage}</span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="p-1.5 rounded-lg text-[#606060] hover:bg-[#f5f5f5] disabled:opacity-30 cursor-pointer transition-colors"
            title="元に戻す (⌘Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-lg text-[#606060] hover:bg-[#f5f5f5] disabled:opacity-30 cursor-pointer transition-colors"
            title="やり直す (⌘⇧Z)"
          >
            <Redo2 size={16} />
          </button>
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="p-1.5 rounded-lg text-[#606060] hover:bg-[#f5f5f5] cursor-pointer transition-colors"
            title="履歴"
          >
            <History size={16} />
          </button>
          <button
            onClick={
              isNewApp ? () => setShowPublishModal(true) : handleSave
            }
            disabled={isSaving}
            className="flex items-center gap-1 text-sm text-white bg-[#1B4F72] hover:bg-[#15415F] px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isSaving
              ? "保存中..."
              : isNewApp
                ? "公開する"
                : "公開に反映"}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 min-h-0 relative">
        <ResizableHorizontal
          defaultLeftWidth={28}
          minLeftWidth={20}
          maxLeftWidth={50}
          left={
            <ChatPanel
              messages={chatMessages}
              prompt={aiPrompt}
              onPromptChange={setAiPrompt}
              onSend={handleAiEdit}
              isLoading={isAiLoading}
            />
          }
          right={
            <ResizableVertical
              defaultTopHeight={70}
              minTopHeight={40}
              maxTopHeight={90}
              top={<PreviewPanel code={previewCode} />}
              bottom={
                <div className="flex flex-col h-full">
                  {/* Tabs */}
                  <div className="flex border-b border-[#e5e5e5] bg-[#fafafa] flex-shrink-0">
                    <button
                      onClick={() => setRightBottomTab("style")}
                      className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        rightBottomTab === "style"
                          ? "text-[#1B4F72] border-b-2 border-[#1B4F72]"
                          : "text-[#909090] hover:text-[#606060]"
                      }`}
                    >
                      スタイル
                    </button>
                    <button
                      onClick={() => setRightBottomTab("code")}
                      className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        rightBottomTab === "code"
                          ? "text-[#1B4F72] border-b-2 border-[#1B4F72]"
                          : "text-[#909090] hover:text-[#606060]"
                      }`}
                    >
                      &lt;/&gt; コード
                    </button>
                  </div>
                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    {rightBottomTab === "style" ? (
                      <StyleEditor
                        selectedElement={selectedElement}
                        onStyleChange={handleStyleChange}
                      />
                    ) : (
                      <CodeEditor code={code} onChange={setCode} />
                    )}
                  </div>
                </div>
              }
            />
          }
        />

        {/* History panel overlay */}
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
              {undoStack.length === 0 ? (
                <p className="p-4 text-sm text-[#909090]">
                  まだ変更履歴がありません
                </p>
              ) : (
                undoStack.map((entry, i) => (
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

      {/* Publish modal (new app only) */}
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
                  説明{" "}
                  <span className="text-[#909090]">（任意）</span>
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
