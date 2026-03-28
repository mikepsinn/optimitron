"use client";

import { useEffect, useState } from "react";
import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { ParticleEmitter } from "../../animations/particle-emitter";
import {
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
} from "@optimitron/data/parameters";
import { formatNumber } from "@/lib/demo/formatters";
import { useDemoStore } from "@/lib/demo/store";
import { PALETTE_SEMANTIC } from "@/lib/demo/palette";

const livesSaved = Math.round(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value / 1e8) * 1e8;
const militarySpending = GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value;
const onePercent = militarySpending * 0.01;
const incomeGain = TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA.value;
const haleGain = TREATY_HALE_GAIN_YEAR_15.value;
const incomeMultiplier = TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER.value;

// Border emoji positions — evenly around all 4 edges, inset so they don't clip
const BORDER_COUNT = 80;
const PAD = 2; // % inset from edges so emoji aren't cropped
const borderPositions = Array.from({ length: BORDER_COUNT }, (_, i) => {
  const t = i / BORDER_COUNT;
  // Walk the perimeter: top → right → bottom → left (inset by PAD%)
  if (t < 0.25) {
    const pct = t * 4;
    return { x: PAD + pct * (100 - 2 * PAD), y: PAD };
  } else if (t < 0.5) {
    const pct = (t - 0.25) * 4;
    return { x: 100 - PAD, y: PAD + pct * (100 - 2 * PAD) };
  } else if (t < 0.75) {
    const pct = (t - 0.5) * 4;
    return { x: 100 - PAD - pct * (100 - 2 * PAD), y: 100 - PAD };
  } else {
    const pct = (t - 0.75) * 4;
    return { x: PAD, y: 100 - PAD - pct * (100 - 2 * PAD) };
  }
});

export function SlideTenBillionLivesSaved() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [skullsTransformed, setSkullsTransformed] = useState(0);
  const { palette: paletteMode } = useDemoStore();
  const palette = PALETTE_SEMANTIC[paletteMode];

  useEffect(() => {
    // Start confetti after counter reaches halfway
    const confettiTimer = setTimeout(() => setShowConfetti(true), 2000);

    // Transform skulls to smiles one by one around the border
    const skullInterval = setInterval(() => {
      setSkullsTransformed((prev) => {
        if (prev >= BORDER_COUNT) {
          clearInterval(skullInterval);
          return BORDER_COUNT;
        }
        return prev + 1;
      });
    }, 80);

    return () => {
      clearTimeout(confettiTimer);
      clearInterval(skullInterval);
    };
  }, []);

  return (
    <SlideBase className="relative overflow-hidden">
      {/* Celebration particles */}
      {showConfetti && (
        <>
          <ParticleEmitter
            emoji="⭐"
            rate={8}
            lifetime={3000}
            direction="up"
            className="absolute inset-0 pointer-events-none"
          />
          <ParticleEmitter
            emoji="✨"
            rate={6}
            lifetime={2500}
            direction="up"
            className="absolute inset-0 pointer-events-none"
          />
          <ParticleEmitter
            emoji="🎉"
            rate={3}
            lifetime={3500}
            direction="up"
            className="absolute inset-0 pointer-events-none"
          />
        </>
      )}

      {/* Radial glow background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at center, ${palette.success} 0%, transparent 70%)`,
        }}
      />

      {/* Skulls → Smiles border ring */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {borderPositions.map((pos, i) => (
          <span
            key={i}
            className="absolute text-2xl md:text-3xl transition-all duration-300"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -50%)",
              opacity: i < skullsTransformed ? 1 : 0.3,
            }}
          >
            {i < skullsTransformed ? "😊" : "💀"}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-6">
        {/* Main counter */}
        <div className="text-center">
          <div className="text-xl md:text-2xl uppercase tracking-widest mb-2 opacity-70">
            1% Military → 12.3× Clinical Trial Capacity
          </div>
          <div className="text-2xl md:text-4xl uppercase tracking-widest mb-4">
            Lives Saved Over 100 Years
          </div>

          <div
            className="text-5xl md:text-7xl lg:text-9xl font-pixel"
            style={{ color: palette.success }}
          >
            <AnimatedCounter
              end={livesSaved}
              duration={4000}
              format="compact"
            />
          </div>

          <div className="text-2xl md:text-4xl mt-4 opacity-80">
            {formatNumber(livesSaved)} human lives
          </div>
        </div>

        {/* Optimized world stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-[1400px] w-full">
          {[
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
              label: "HALE GAIN",
              value: `+${haleGain.toFixed(1)} yrs`,
              color: palette.success,
            },
            {
              emoji: "💰",
              label: "INCOME GAIN",
              value: `+$${(incomeGain / 1e6).toFixed(1)}M`,
              color: palette.success,
            },
            {
              emoji: "📈",
              label: "INCOME MULTIPLIER",
              value: `${Math.round(incomeMultiplier)}× richer`,
              color: palette.success,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 md:p-5 rounded-lg border-2 text-center"
              style={{
                borderColor: `${stat.color}40`,
                backgroundColor: `${stat.color}10`,
              }}
            >
              <div className="text-3xl md:text-4xl mb-1">{stat.emoji}</div>
              <div className="text-sm md:text-base uppercase tracking-wider opacity-70 mb-1">
                {stat.label}
              </div>
              <div
                className="text-2xl md:text-3xl font-bold font-terminal"
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
