"use client";

import { useRef, useEffect } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  prompt: string;
  onPromptChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export default function ChatPanel({
  messages,
  prompt,
  onPromptChange,
  onSend,
  isLoading,
}: ChatPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#1B4F72] text-white"
                  : "bg-[#f5f5f5] text-[#0f0f0f]"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#f5f5f5] rounded-xl px-3 py-2 text-sm text-[#909090]">
              考え中...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#e5e5e5] p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="指示を入力..."
            className="flex-1 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72] transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={onSend}
            disabled={isLoading || !prompt.trim()}
            className="bg-[#1B4F72] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#15415F] disabled:opacity-50 transition-colors cursor-pointer"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
