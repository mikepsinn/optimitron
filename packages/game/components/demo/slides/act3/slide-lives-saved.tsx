"use client";

import { useEffect, useState } from "react";
import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { ProgressRing } from "../../animations/progress-ring";
import {
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  GLOBAL_DISEASE_DEATHS_DAILY,
} from "@/lib/demo/parameters";
import { formatNumber } from "@/lib/demo/formatters";
import { useDemoStore } from "@/lib/demo/store";
import { PALETTE_SEMANTIC } from "@/lib/demo/palette";

const livesSaved = Math.round(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value / 1e8) * 1e8;
const deathsPerYear = GLOBAL_DISEASE_DEATHS_DAILY.value * 365;

// Border emoji positions — evenly around all 4 edges
const BORDER_COUNT = 60;
const borderPositions = Array.from({ length: BORDER_COUNT }, (_, i) => {
  const t = i / BORDER_COUNT;
  // Walk the perimeter: top → right → bottom → left
  if (t < 0.25) {
    return { x: t * 4 * 100, y: 0 };
  } else if (t < 0.5) {
    return { x: 100, y: (t - 0.25) * 4 * 100 };
  } else if (t < 0.75) {
    return { x: (1 - (t - 0.5) * 4) * 100, y: 100 };
  } else {
    return { x: 0, y: (1 - (t - 0.75) * 4) * 100 };
  }
});

export function SlideLivesSaved() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [ringProgress, setRingProgress] = useState(0);
  const [skullsTransformed, setSkullsTransformed] = useState(0);
  const { palette: paletteMode } = useDemoStore();
  const palette = PALETTE_SEMANTIC[paletteMode];

  useEffect(() => {
    // Animate ring progress smoothly
    const ringTimer = setTimeout(() => setRingProgress(100), 500);

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
      clearTimeout(ringTimer);
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
          <div className="text-2xl md:text-4xl uppercase tracking-widest mb-4 opacity-70">
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

        {/* Progress ring + Before/After */}
        <div className="flex items-center gap-8 md:gap-12">
          <div className="text-center">
            <ProgressRing
              progress={ringProgress}
              size={160}
              strokeWidth={10}
              color={palette.success}
              backgroundColor={palette.background}
            />
            <div className="mt-2 text-xl md:text-2xl opacity-70">Mission Progress</div>
          </div>

          {/* Before/After comparison */}
          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="p-5 rounded" style={{ backgroundColor: `${palette.danger}20` }}>
              <div className="text-4xl mb-2">💀</div>
              <div className="text-xl md:text-2xl uppercase tracking-wider opacity-70">Before</div>
              <div className="text-2xl md:text-3xl font-bold" style={{ color: palette.danger }}>
                {formatNumber(deathsPerYear, "compact")}/yr
              </div>
            </div>
            <div className="p-5 rounded" style={{ backgroundColor: `${palette.success}20` }}>
              <div className="text-4xl mb-2">😊</div>
              <div className="text-xl md:text-2xl uppercase tracking-wider opacity-70">After</div>
              <div className="text-2xl md:text-3xl font-bold" style={{ color: palette.success }}>
                Optimized
              </div>
            </div>
          </div>
        </div>

        {/* Impact statement */}
        <div
          className="text-center max-w-[1700px] px-6 py-6 rounded-lg border-2"
          style={{
            borderColor: palette.success,
            backgroundColor: `${palette.success}10`,
          }}
        >
          <div className="text-2xl md:text-4xl font-medium">
            That&apos;s more lives than were lost in all wars of the 20th century.
          </div>
          <div className="text-xl md:text-2xl mt-2 opacity-70">Combined.</div>
        </div>
      </div>
    </SlideBase>
  );
}
