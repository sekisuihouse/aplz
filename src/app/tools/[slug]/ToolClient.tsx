"use client";

import { useMemo, useState } from "react";

export default function ToolClient({
  title,
  description,
  inputLabel,
  unit,
  formula,
}: {
  title: string;
  description: string;
  inputLabel: string;
  unit: string;
  formula: string;
}) {
  const [value, setValue] = useState("10");
  const [buffer, setBuffer] = useState("20");
  const result = useMemo(() => {
    const base = Number(value);
    const extra = Number(buffer);
    if (!Number.isFinite(base) || base < 0) return null;
    if (!Number.isFinite(extra) || extra < 0) return null;
    const withBuffer = Math.ceil(base * (1 + extra / 100));
    return {
      base,
      extra,
      withBuffer,
      checklist: [
        `${inputLabel}を ${base}${unit} として見る`,
        `予備を ${extra}% 足す`,
        `目安は ${withBuffer}${unit}`,
      ],
    };
  }, [buffer, inputLabel, unit, value]);

  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white p-5">
      <p className="text-sm text-[#606060] leading-7 mb-5">{description}</p>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="grid gap-2 text-sm font-semibold text-[#0f0f0f]">
          {inputLabel}
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            inputMode="numeric"
            className="input"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#0f0f0f]">
          予備・余裕（%）
          <input
            value={buffer}
            onChange={(event) => setBuffer(event.target.value)}
            inputMode="numeric"
            className="input"
          />
        </label>
      </div>
      <div className="mt-5 rounded-lg bg-[#f8f8f8] border border-[#e5e5e5] p-4">
        <h2 className="text-lg font-bold text-[#0f0f0f]">{title}の結果</h2>
        {result ? (
          <div className="mt-3">
            <p className="text-2xl font-bold text-[#1B4F72]">{result.withBuffer}{unit}</p>
            <ul className="mt-3 space-y-2 text-sm text-[#404040]">
              {result.checklist.map((item) => (
                <li key={item}>・{item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-red-600 mt-2">0以上の数字を入力してください。</p>
        )}
      </div>
      <div className="mt-5 text-sm text-[#606060] leading-7">
        <p className="font-semibold text-[#0f0f0f]">計算根拠</p>
        <p>{formula}</p>
        <p className="mt-3">個人名、住所、連絡先などは入力しないでください。このツールはブラウザ上の目安計算です。</p>
      </div>
    </div>
  );
}
