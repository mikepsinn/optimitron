"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { SlideBase } from "../slide-base";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { useDemoStore } from "@/lib/demo/store";
import { PALETTE_SEMANTIC } from "@/lib/demo/palette";

export function SlideFinal() {
  const [showQR, setShowQR] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const { palette: paletteMode, score } = useDemoStore();
  const palette = PALETTE_SEMANTIC[paletteMode];

  useEffect(() => {
    const qrTimer = setTimeout(() => setShowQR(true), 1000);
    const buttonTimer = setTimeout(() => setShowButton(true), 2000);

    return () => {
      clearTimeout(qrTimer);
      clearTimeout(buttonTimer);
    };
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
        {/* Victory banner */}
        <div 
          className="px-8 py-4 rounded-lg border-4"
          style={{ 
            borderColor: palette.accent,
            backgroundColor: `${palette.accent}20`
          }}
        >
          <div className="text-xs uppercase tracking-widest mb-2 opacity-70">
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
          <div className="text-sm uppercase tracking-wider opacity-70 mb-1">
            Final Score
          </div>
          <div
            className="text-4xl md:text-6xl font-pixel"
            style={{ color: palette.success }}
          >
            {score.toLocaleString()} / 8,000,000,000
          </div>
        </div>

        {/* Congratulations stats */}
        <div
          className="px-6 py-4 rounded-lg border text-left font-terminal text-sm space-y-1"
          style={{
            borderColor: `${palette.accent}40`,
            backgroundColor: `${palette.accent}10`
          }}
        >
          <div className="font-pixel text-xs text-center mb-3 uppercase tracking-wider opacity-70">
            Run Complete
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Lives saved:</span>
            <span style={{ color: palette.success }}>all of them</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">HALE:</span>
            <span style={{ color: palette.success }}>69.8 years &#10003;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Income:</span>
            <span style={{ color: palette.success }}>$149,000 &#10003;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Time played:</span>
            <span className="text-zinc-300">3 minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Inventory:</span>
            <span className="text-zinc-300">8/8</span>
          </div>
        </div>

        {/* QR Code */}
        <div 
          className={`transition-all duration-1000 ${showQR ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
        >
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: '#ffffff' }}
          >
            <QRCodeSVG 
              value="https://wishonia.love/play" 
              size={160}
              level="H"
              includeMargin={false}
            />
          </div>
          <div className="mt-2 text-sm opacity-70">
            Scan to Play
          </div>
          <div 
            className="text-lg font-mono"
            style={{ color: palette.primary }}
          >
            wishonia.love/play
          </div>
        </div>

        {/* CTA Button */}
        <button
          className={`
            px-8 py-4 rounded-lg font-pixel text-lg md:text-xl
            transition-all duration-500 cursor-pointer
            hover:scale-105 active:scale-95
            ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ 
            backgroundColor: palette.success,
            color: '#000000',
            boxShadow: `0 4px 0 #1a5f1a, 0 8px 20px ${palette.success}40`
          }}
          onClick={() => window.open('https://wishonia.love/play', '_blank')}
        >
          [ PLAY NOW ]
        </button>

        {/* Credits hint */}
        <div className="absolute bottom-4 text-xs opacity-50">
          Press any key to see credits...
        </div>
      </div>
    </SlideBase>
  );
}
