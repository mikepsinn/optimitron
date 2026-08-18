"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { ParticleEmitter } from "../../animations/sierra/particle-emitter";
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
  const paletteMode = "vga";
  const palette = PALETTE_SEMANTIC[paletteMode];

  useEffect(() => {
    const qrTimer = setTimeout(() => setShowQR(true), 1000);
    return () => clearTimeout(qrTimer);
  }, []);

  return (
    <SierraSlideWrapper className="relative overflow-hidden">
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
          PLAY NOW!
        </div>

        {/* Left stats | QR Code | Right stats */}
        <div className="flex w-full max-w-[1600px] flex-col items-center justify-center gap-6 md:flex-row md:gap-10">
          {/* Left column — 2 stats */}
          <div className="flex w-full max-w-[400px] flex-col gap-4 md:flex-1 md:gap-6">
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
                +{haleGain.toFixed(1)} yrs
              </div>
              <div className="font-terminal text-xl md:text-2xl text-zinc-200 mt-1">
                extra healthy life
              </div>
            </div>
          </div>

          {/* Center — QR Code */}
          <div
            className={`flex flex-col items-center justify-center shrink-0 transition-all duration-1000 ${
              showQR ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
          >
            <div
              className="p-5 rounded-lg"
              style={{ backgroundColor: "#ffffff" }}
            >
              <QRCodeSVG
                value="https://optimitron.com"
                size={160}
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

          {/* Right column — 2 stats */}
          <div className="flex w-full max-w-[400px] flex-col gap-4 md:flex-1 md:gap-6">
            <div
              className="rounded-lg border-2 p-4 md:p-5 text-center"
              style={{ borderColor: `${palette.success}40`, backgroundColor: `${palette.success}10` }}
            >
              <div className="text-3xl md:text-4xl mb-1">💰</div>
              <div className="font-pixel text-3xl md:text-4xl" style={{ color: palette.success }}>
                {formatCurrency(incomeGain)}
              </div>
              <div className="font-terminal text-xl md:text-2xl text-zinc-200 mt-1">
                lifetime income
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
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideFinalCallToAction;
