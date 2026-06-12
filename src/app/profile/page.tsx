"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [snsUrl, setSnsUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [developerEnabled, setDeveloperEnabled] = useState(false);
  const [skillCategories, setSkillCategories] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setDisplayName(data.display_name || "");
          setBio(data.bio || "");
          setGithubUrl(data.github_url || "");
          setSnsUrl(data.sns_url || "");
          setWebsiteUrl(data.website_url || "");
          setDeveloperEnabled(Boolean(data.developer_enabled));
          setSkillCategories((data.skill_categories || []).join(", "));
          if (data.avatar_url) setAvatarPreview(data.avatar_url);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("画像は2MB以下にしてください");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("display_name", displayName);
    formData.append("bio", bio);
    formData.append("github_url", githubUrl);
    formData.append("sns_url", snsUrl);
    formData.append("website_url", websiteUrl);
    formData.append("developer_enabled", developerEnabled ? "true" : "false");
    formData.append("skill_categories", skillCategories);
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "保存に失敗しました");
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-[#909090]">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        <h1 className="text-2xl font-bold text-[#0f0f0f] mb-6">
          プロフィール設定
        </h1>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[#f5f5f5] flex items-center justify-center shrink-0">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="アバター"
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-2xl font-bold text-[#909090]">
                {displayName?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-lg border border-[#e5e5e5] text-sm text-[#606060] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
          >
            画像を変更
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#606060] mb-1.5">
              表示名
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
              placeholder="あなたの名前"
              className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-[#606060] mb-1.5">
              自己紹介 <span className="text-[#909090]">（{bio.length}/1000）</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 1000))}
              placeholder="自己紹介や、どんな困りごとを解決したいか"
              rows={4}
              className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors resize-none"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#606060] mb-1.5">
                GitHub URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#606060] mb-1.5">
                SNS URL
              </label>
              <input
                type="url"
                value={snsUrl}
                onChange={(e) => setSnsUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#606060] mb-1.5">
              WebサイトURL
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-[#606060] mb-1.5">
              得意カテゴリ
            </label>
            <input
              type="text"
              value={skillCategories}
              onChange={(e) => setSkillCategories(e.target.value)}
              placeholder="集計, 当番表, イベント運営"
              className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-[#0f0f0f] placeholder:text-[#909090] focus:outline-none focus:border-[#909090] transition-colors"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#606060]">
            <input
              type="checkbox"
              checked={developerEnabled}
              onChange={(e) => setDeveloperEnabled(e.target.checked)}
              className="accent-[#1B4F72]"
            />
            開発者としてプロフィールを表示する
          </label>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">
            保存しました
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 py-3 rounded-lg bg-[#1B4F72] text-white font-semibold hover:bg-[#15415F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}
