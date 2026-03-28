"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { SlideBase } from "../slide-base";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { useDemoStore } from "@/lib/demo/store";
import { PALETTE_SEMANTIC } from "@/lib/demo/palette";
import {
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  TREATY_PROJECTED_HALE_YEAR_15,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  TREATY_HALE_GAIN_YEAR_15,
} from "@optimitron/data/parameters";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

const livesSaved = Math.round(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value / 1e8) * 1e8;
const hale = Math.round(TREATY_PROJECTED_HALE_YEAR_15.value * 10) / 10;
const haleGain = TREATY_HALE_GAIN_YEAR_15.value;
const income = GAME_PARAMS.projectedGDPperCapita;
const incomeGain = TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA.value;

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

      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-6 text-center">
        {/* Earth emoji + title */}
        <div className="text-7xl md:text-8xl">🌍😊</div>
        <div
          className="text-5xl md:text-7xl lg:text-8xl font-pixel"
          style={{ color: palette.accent }}
        >
          EARTH OPTIMIZED
        </div>

        {/* Stats + QR side by side */}
        <div className="flex items-start gap-8 md:gap-12 w-full max-w-[1600px] justify-center">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 flex-1 max-w-[900px]">
            <div
              className="rounded-lg border-2 p-4 md:p-5 text-center"
              style={{ borderColor: `${palette.success}40`, backgroundColor: `${palette.success}10` }}
            >
              <div className="text-3xl md:text-4xl mb-1">❤️</div>
              <div className="font-pixel text-3xl md:text-4xl" style={{ color: palette.success }}>
                {(livesSaved / 1e9).toFixed(1)}B
              </div>
              <div className="font-terminal text-xl md:text-2xl text-zinc-200 mt-1">lives saved</div>
            </div>

            <div
              className="rounded-lg border-2 p-4 md:p-5 text-center"
              style={{ borderColor: `${palette.success}40`, backgroundColor: `${palette.success}10` }}
            >
              <div className="text-3xl md:text-4xl mb-1">🏥</div>
              <div className="font-pixel text-3xl md:text-4xl" style={{ color: palette.success }}>
                {hale} yrs
              </div>
              <div className="font-terminal text-xl md:text-2xl text-zinc-200 mt-1">
                HALE (+{haleGain.toFixed(1)} yrs)
              </div>
            </div>

            <div
              className="rounded-lg border-2 p-4 md:p-5 text-center"
              style={{ borderColor: `${palette.success}40`, backgroundColor: `${palette.success}10` }}
            >
              <div className="text-3xl md:text-4xl mb-1">💰</div>
              <div className="font-pixel text-3xl md:text-4xl" style={{ color: palette.success }}>
                {formatCurrency(income)}/yr
              </div>
              <div className="font-terminal text-xl md:text-2xl text-zinc-200 mt-1">
                income (+{formatCurrency(incomeGain)})
              </div>
            </div>

            <div
              className="rounded-lg border-2 p-4 md:p-5 text-center"
              style={{ borderColor: `${palette.accent}40`, backgroundColor: `${palette.accent}10` }}
            >
              <div className="text-3xl md:text-4xl mb-1">⏱️</div>
              <div className="font-pixel text-3xl md:text-4xl" style={{ color: palette.accent }}>
                3 min
              </div>
              <div className="font-terminal text-xl md:text-2xl text-zinc-200 mt-1">time played</div>
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
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="mt-3 text-2xl md:text-3xl opacity-70">
              Scan to Play
            </div>
            <div
              className="text-3xl md:text-4xl font-mono"
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
