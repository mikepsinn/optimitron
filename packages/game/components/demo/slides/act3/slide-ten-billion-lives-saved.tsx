"use client";

import { useEffect, useState } from "react";
import { SlideBase } from "../slide-base";
import { ParticleEmitter } from "../../animations/particle-emitter";
import {
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
} from "@optimitron/data/parameters";
import { useDemoStore } from "@/lib/demo/store";
import { PALETTE_SEMANTIC } from "@/lib/demo/palette";

const livesSaved = Math.round(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value / 1e8) * 1e8;
const militarySpending = GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value;
const onePercent = militarySpending * 0.01;
const incomeGain = TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA.value;
const haleGain = TREATY_HALE_GAIN_YEAR_15.value;
const incomeMultiplier = TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER.value;

export function SlideTenBillionLivesSaved() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [visibleCards, setVisibleCards] = useState(0);
  const { palette: paletteMode } = useDemoStore();
  const palette = PALETTE_SEMANTIC[paletteMode];

  const stats = [
    {
      emoji: "💣",
      label: "MURDER BUDGET",
      value: `$${(militarySpending / 1e12).toFixed(1)}T/yr`,
      color: palette.danger,
    },
    {
      emoji: "💊",
      label: "1% REDIRECT",
      value: `$${(onePercent / 1e9).toFixed(1)}B/yr`,
      color: palette.accent,
    },
    {
      emoji: "❤️",
      label: "LIVES SAVED",
      value: `${(livesSaved / 1e9).toFixed(1)}B`,
      color: palette.success,
    },
    {
      emoji: "🏥",
      label: "HEALTHY YEARS GAINED",
      value: `+${haleGain.toFixed(1)} yrs`,
      color: palette.success,
    },
    {
      emoji: "💰",
      label: "INCOME GAIN PER PERSON",
      value: `+$${(incomeGain / 1e6).toFixed(1)}M`,
      color: palette.success,
    },
    {
      emoji: "📈",
      label: "INCOME MULTIPLIER",
      value: `${Math.round(incomeMultiplier)}× richer`,
      color: palette.success,
    },
  ];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Stagger card reveals
    stats.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCards(i + 1), 800 + i * 300));
    });

    // Confetti after all cards visible
    timers.push(setTimeout(() => setShowConfetti(true), 800 + stats.length * 300 + 500));

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SlideBase className="relative overflow-hidden">
      <style jsx>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .card-in {
          animation: cardIn 0.4s ease-out forwards;
        }
      `}</style>

      {/* Celebration particles */}
      {showConfetti && (
        <>
          <ParticleEmitter
            emoji="✨"
            rate={5}
            lifetime={3000}
            direction="up"
            className="absolute inset-0 pointer-events-none"
          />
          <ParticleEmitter
            emoji="🎉"
            rate={2}
            lifetime={3500}
            direction="up"
            className="absolute inset-0 pointer-events-none"
          />
        </>
      )}

      {/* Radial glow background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at center, ${palette.success} 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-6 w-full max-w-[1600px] mx-auto">
        {/* Title */}
        <div className="text-center">
          <div className="text-2xl md:text-3xl uppercase tracking-widest mb-2 opacity-70">
            1% Military → 12.3× Clinical Trial Capacity
          </div>
          <div
            className="text-4xl md:text-6xl lg:text-8xl uppercase tracking-widest font-pixel"
            style={{ color: palette.success }}
          >
            WHAT 1% BUYS YOU
          </div>
        </div>

        {/* Stat cards — the hero */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8 w-full">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`p-6 md:p-8 rounded-lg border-2 text-center ${i < visibleCards ? "card-in" : "opacity-0"}`}
              style={{
                borderColor: `${stat.color}40`,
                backgroundColor: `${stat.color}10`,
              }}
            >
              <div className="text-4xl md:text-6xl mb-2">{stat.emoji}</div>
              <div className="text-lg md:text-xl uppercase tracking-wider opacity-70 mb-2">
                {stat.label}
              </div>
              <div
                className="text-4xl md:text-6xl font-bold font-terminal"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideBase>
  );
}
