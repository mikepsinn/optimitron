"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { SlideBase } from "../slide-base";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { useDemoStore } from "@/lib/demo/store";
import { PALETTE_SEMANTIC } from "@/lib/demo/palette";

export function SlideFinal() {
  const [showQR, setShowQR] = useState(false);
  const { palette: paletteMode, score } = useDemoStore();
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

      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-6 text-center">
        {/* Victory banner */}
        <div
          className="px-8 py-4 rounded-lg border-4"
          style={{
            borderColor: palette.accent,
            backgroundColor: `${palette.accent}20`,
          }}
        >
          <div className="text-xl md:text-2xl uppercase tracking-widest mb-2 opacity-70">
            Achievement Unlocked
          </div>
          <div
            className="text-2xl md:text-4xl font-pixel"
            style={{ color: palette.accent }}
          >
            EARTH OPTIMIZED
          </div>
        </div>

        {/* Final score */}
        <div className="text-center">
          <div className="text-xl md:text-2xl uppercase tracking-wider opacity-70 mb-1">
            Final Score
          </div>
          <div
            className="text-4xl md:text-6xl font-pixel"
            style={{ color: palette.success }}
          >
            {score.toLocaleString()} / 8,000,000,000
          </div>
        </div>

        {/* Run Complete + QR Code side by side */}
        <div className="flex items-stretch gap-6 md:gap-8">
          {/* Run Complete stats */}
          <div
            className="px-6 md:px-8 py-5 rounded-lg border text-left font-terminal space-y-2 flex-1"
            style={{
              borderColor: `${palette.accent}40`,
              backgroundColor: `${palette.accent}10`,
            }}
          >
            <div className="font-pixel text-2xl md:text-3xl text-center mb-3 uppercase tracking-wider opacity-70">
              Run Complete
            </div>
            <div className="flex justify-between gap-6 text-xl md:text-2xl">
              <span className="text-zinc-200">❤️ Lives saved:</span>
              <span style={{ color: palette.success }}>all of them</span>
            </div>
            <div className="flex justify-between gap-6 text-xl md:text-2xl">
              <span className="text-zinc-200">🏥 HALE:</span>
              <span style={{ color: palette.success }}>69.8 years ✓</span>
            </div>
            <div className="flex justify-between gap-6 text-xl md:text-2xl">
              <span className="text-zinc-200">💰 Income:</span>
              <span style={{ color: palette.success }}>$149,000 ✓</span>
            </div>
            <div className="flex justify-between gap-6 text-xl md:text-2xl">
              <span className="text-zinc-200">⏱️ Time played:</span>
              <span className="text-zinc-300">3 minutes</span>
            </div>
            <div className="flex justify-between gap-6 text-xl md:text-2xl">
              <span className="text-zinc-200">🎒 Inventory:</span>
              <span className="text-zinc-300">8/8</span>
            </div>
          </div>

          {/* QR Code */}
          <div
            className={`flex flex-col items-center justify-center transition-all duration-1000 ${
              showQR ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
          >
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "#ffffff" }}
            >
              <QRCodeSVG
                value="https://optimitron.com"
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="mt-3 text-xl md:text-2xl opacity-70">
              Scan to Play
            </div>
            <div
              className="text-2xl md:text-3xl font-mono"
              style={{ color: palette.primary }}
            >
              optimitron.com
            </div>
          </div>
        </div>

        {/* Credits hint */}
        <div className="absolute bottom-4 text-xl md:text-2xl opacity-50">
          Press any key to see credits...
        </div>
      </div>
    </SlideBase>
  );
}
