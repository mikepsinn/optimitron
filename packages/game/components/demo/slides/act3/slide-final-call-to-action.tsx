"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { SlideBase } from "../slide-base";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { useDemoStore } from "@/lib/demo/store";
import { PALETTE_SEMANTIC } from "@/lib/demo/palette";

export function SlideFinalCallToAction() {
  const [showQR, setShowQR] = useState(false);
  const { palette: paletteMode } = useDemoStore();
  const palette = PALETTE_SEMANTIC[paletteMode];

  useEffect(() => {
    const qrTimer = setTimeout(() => setShowQR(true), 1000);
    return () => clearTimeout(qrTimer);
  }, []);

  return (
    <SlideBase className="relative overflow-hidden">
      {/* Subtle celebration */}
      <ParticleEmitter
        emoji="✨"
        rate={2}
        lifetime={4000}
        direction="up"
        className="absolute inset-0 pointer-events-none opacity-50"
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8 text-center">
        {/* Earth emoji + title */}
        <div className="text-8xl md:text-9xl">🌍😊</div>
        <div
          className="text-4xl md:text-6xl lg:text-7xl font-pixel"
          style={{ color: palette.accent }}
        >
          EARTH OPTIMIZED
        </div>

        {/* Stats — large, no box header */}
        <div className="flex items-start gap-8 md:gap-12">
          <div
            className="px-8 md:px-12 py-6 md:py-8 rounded-lg border-2 text-left font-terminal space-y-4"
            style={{
              borderColor: `${palette.accent}40`,
              backgroundColor: `${palette.accent}10`,
            }}
          >
            <div className="flex justify-between gap-8 text-3xl md:text-4xl">
              <span className="text-zinc-200">❤️ Lives saved:</span>
              <span style={{ color: palette.success }}>all of them</span>
            </div>
            <div className="flex justify-between gap-8 text-3xl md:text-4xl">
              <span className="text-zinc-200">🏥 HALE:</span>
              <span style={{ color: palette.success }}>69.8 years ✓</span>
            </div>
            <div className="flex justify-between gap-8 text-3xl md:text-4xl">
              <span className="text-zinc-200">💰 Income:</span>
              <span style={{ color: palette.success }}>$149,000 ✓</span>
            </div>
            <div className="flex justify-between gap-8 text-3xl md:text-4xl">
              <span className="text-zinc-200">⏱️ Time played:</span>
              <span className="text-zinc-300">3 minutes</span>
            </div>
          </div>

          {/* QR Code */}
          <div
            className={`flex flex-col items-center justify-center transition-all duration-1000 ${
              showQR ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
          >
            <div
              className="p-5 rounded-lg"
              style={{ backgroundColor: "#ffffff" }}
            >
              <QRCodeSVG
                value="https://optimitron.com"
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="mt-3 text-2xl md:text-3xl opacity-70">
              Scan to Play
            </div>
            <div
              className="text-2xl md:text-4xl font-mono"
              style={{ color: palette.primary }}
            >
              optimitron.com
            </div>
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
