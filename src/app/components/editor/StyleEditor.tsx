"use client";

export interface SelectedElementInfo {
  tagName: string;
  textContent: string;
  styles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    padding: string;
    margin: string;
    borderRadius: string;
    border: string;
    width: string;
    height: string;
    textAlign: string;
  };
}

interface StyleEditorProps {
  selectedElement: SelectedElementInfo | null;
  onStyleChange: (property: string, value: string) => void;
}

function rgbToHex(rgb: string): string {
  if (rgb.startsWith("#")) return rgb;
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return "#000000";
  return (
    "#" +
    match
      .slice(0, 3)
      .map((x) => parseInt(x).toString(16).padStart(2, "0"))
      .join("")
  );
}

export default function StyleEditor({
  selectedElement,
  onStyleChange,
}: StyleEditorProps) {
  if (!selectedElement) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[#909090]">
        <div className="text-center">
          <p>プレビューの要素をクリックして</p>
          <p>スタイルを編集できます</p>
        </div>
      </div>
    );
  }

  const { tagName, textContent, styles } = selectedElement;

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="text-xs text-[#909090] mb-2">
        選択中: &lt;{tagName}&gt;{" "}
        {textContent?.slice(0, 20)}
        {textContent && textContent.length > 20 ? "..." : ""}
      </div>

      {/* Color */}
      <div className="flex items-center gap-3">
        <div>
          <label className="text-xs text-[#606060] block mb-1">文字色</label>
          <input
            type="color"
            value={rgbToHex(styles.color)}
            onChange={(e) => onStyleChange("color", e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-[#e5e5e5]"
          />
        </div>
        <div>
          <label className="text-xs text-[#606060] block mb-1">背景色</label>
          <input
            type="color"
            value={rgbToHex(styles.backgroundColor)}
            onChange={(e) => onStyleChange("backgroundColor", e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-[#e5e5e5]"
          />
        </div>
      </div>

      {/* Font size */}
      <div>
        <label className="text-xs text-[#606060] block mb-1">
          フォントサイズ: {styles.fontSize}
        </label>
        <input
          type="range"
          min="8"
          max="72"
          value={parseInt(styles.fontSize) || 16}
          onChange={(e) => onStyleChange("fontSize", `${e.target.value}px`)}
          className="w-full accent-[#1B4F72]"
        />
      </div>

      {/* Border radius */}
      <div>
        <label className="text-xs text-[#606060] block mb-1">
          角丸: {styles.borderRadius}
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={parseInt(styles.borderRadius) || 0}
          onChange={(e) => onStyleChange("borderRadius", `${e.target.value}px`)}
          className="w-full accent-[#1B4F72]"
        />
      </div>

      {/* Padding */}
      <div>
        <label className="text-xs text-[#606060] block mb-1">
          内側余白: {styles.padding}
        </label>
        <input
          type="range"
          min="0"
          max="60"
          value={parseInt(styles.padding) || 0}
          onChange={(e) => onStyleChange("padding", `${e.target.value}px`)}
          className="w-full accent-[#1B4F72]"
        />
      </div>

      {/* Text align */}
      <div>
        <label className="text-xs text-[#606060] block mb-1">
          テキスト揃え
        </label>
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              onClick={() => onStyleChange("textAlign", align)}
              className={`px-3 py-1 text-xs rounded cursor-pointer transition-colors ${
                styles.textAlign === align
                  ? "bg-[#1B4F72] text-white"
                  : "bg-[#f5f5f5] text-[#606060] hover:bg-[#e5e5e5]"
              }`}
            >
              {align === "left" ? "左" : align === "center" ? "中央" : "右"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
