"use client";

import { useState, useCallback, useRef } from "react";

interface PublishResult {
  app_id: string;
  slug: string;
  app_url: string;
  platform_url: string;
  edit_token: string;
}

export default function PublishPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      if (!name) {
        setName(dropped.name.replace(/\.(zip|html)$/i, ""));
      }
    }
  }, [name]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!name) {
        setName(selected.name.replace(/\.(zip|html)$/i, ""));
      }
    }
  };

  const handlePublish = async () => {
    if (!file) return;
    setPublishing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name || "Untitled App");
      formData.append("description", description);

      const res = await fetch("/api/publish", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Publish failed");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const reset = () => {
    setFile(null);
    setName("");
    setDescription("");
    setResult(null);
    setError("");
  };

  if (result) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#141416] border border-[#2a2a2e] rounded-xl p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">&#127881;</div>
            <h2 className="text-2xl font-bold text-white">Published!</h2>
            <p className="text-gray-400 mt-1">Your app is now live</p>
          </div>

          <div className="space-y-4">
            <ResultRow
              label="Live URL"
              value={result.app_url}
              copied={copied === "app_url"}
              onCopy={() => copyToClipboard(result.app_url, "app_url")}
            />
            <ResultRow
              label="Platform URL"
              value={result.platform_url}
              copied={copied === "platform_url"}
              onCopy={() => copyToClipboard(result.platform_url, "platform_url")}
            />
            <ResultRow
              label="Edit Token"
              value={result.edit_token}
              copied={copied === "edit_token"}
              onCopy={() => copyToClipboard(result.edit_token, "edit_token")}
              mono
            />
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Save your edit token — you will need it to update or delete this app.
          </p>

          <button
            onClick={reset}
            className="w-full mt-6 py-3 rounded-lg bg-[#22d3ee] text-black font-semibold hover:bg-[#06b6d4] transition-colors cursor-pointer"
          >
            Publish Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2">Publish Your App</h1>
        <p className="text-gray-400 mb-8">
          Upload a .zip or .html file and get a live URL instantly.
        </p>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
            ${
              dragging
                ? "border-[#22d3ee] bg-[#22d3ee]/10"
                : file
                  ? "border-[#22d3ee]/50 bg-[#141416]"
                  : "border-[#2a2a2e] bg-[#141416] hover:border-[#3a3a3e]"
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".zip,.html"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div>
              <div className="text-2xl mb-2">&#128230;</div>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-gray-500 text-sm mt-1">
                {(file.size / 1024).toFixed(1)} KB — Click or drag to replace
              </p>
            </div>
          ) : (
            <div>
              <div className="text-3xl mb-3">&#128194;</div>
              <p className="text-gray-300">
                Drag & drop your <span className="text-[#22d3ee]">.zip</span> or{" "}
                <span className="text-[#22d3ee]">.html</span> file here
              </p>
              <p className="text-gray-500 text-sm mt-2">or click to browse</p>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              App Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome App"
              className="w-full bg-[#141416] border border-[#2a2a2e] rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#22d3ee] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Description{" "}
              <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your app do?"
              rows={3}
              className="w-full bg-[#141416] border border-[#2a2a2e] rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#22d3ee] transition-colors resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePublish}
          disabled={!file || publishing}
          className="w-full mt-6 py-3 rounded-lg bg-[#22d3ee] text-black font-semibold hover:bg-[#06b6d4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {publishing ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  copied,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-2 bg-[#0a0a0b] border border-[#2a2a2e] rounded-lg px-3 py-2">
        <span
          className={`flex-1 text-sm truncate ${mono ? "font-mono text-gray-300" : "text-[#22d3ee]"}`}
        >
          {value}
        </span>
        <button
          onClick={onCopy}
          className="shrink-0 text-xs px-2 py-1 rounded bg-[#2a2a2e] text-gray-300 hover:bg-[#3a3a3e] transition-colors cursor-pointer"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
