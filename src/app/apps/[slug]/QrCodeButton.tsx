"use client";

import { useState } from "react";
import { QrCode, X } from "lucide-react";

export default function QrCodeButton({ appUrl }: { appUrl: string }) {
  const [open, setOpen] = useState(false);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-[#606060] hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <QrCode size={16} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-xl max-w-xs relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-[#909090] hover:text-[#0f0f0f] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="flex flex-col items-center">
              <img
                src={qrSrc}
                alt="QR Code"
                width={200}
                height={200}
              />
              <p className="text-sm text-[#606060] mt-4 text-center">
                スマホで読み取ってプレイ
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
