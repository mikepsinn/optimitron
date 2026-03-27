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

export function SlideLivesSaved() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [ringProgress, setRingProgress] = useState(0);
  const { palette: paletteMode } = useDemoStore();
  const palette = PALETTE_SEMANTIC[paletteMode];

  useEffect(() => {
    // Start confetti after counter reaches halfway
    const confettiTimer = setTimeout(() => setShowConfetti(true), 2000);
    
    // Animate ring progress
    const ringTimer = setTimeout(() => setRingProgress(100), 500);

    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(ringTimer);
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
          background: `radial-gradient(circle at center, ${palette.success} 0%, transparent 70%)`
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8">
        {/* Main counter */}
        <div className="text-center">
          <div className="text-sm md:text-base uppercase tracking-widest mb-4 opacity-70">
            Lives Saved Over 100 Years
          </div>
          
          <div 
            className="text-4xl md:text-6xl lg:text-8xl font-pixel"
            style={{ color: palette.success }}
          >
            <AnimatedCounter
              end={livesSaved}
              duration={4000}
              format="compact"
            />
          </div>
          
          <div className="text-lg md:text-xl mt-4 opacity-80">
            {formatNumber(livesSaved)} human lives
          </div>
        </div>

        {/* Progress ring visualization */}
        <div className="flex items-center gap-8">
          <div className="text-center">
            <ProgressRing
              progress={ringProgress}
              size={120}
              strokeWidth={8}
              color={palette.success}
              backgroundColor={palette.background}
            />
            <div className="mt-2 text-sm opacity-70">Mission Progress</div>
          </div>

          {/* Before/After comparison */}
          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="p-4 rounded" style={{ backgroundColor: `${palette.danger}20` }}>
              <div className="text-2xl mb-1">☠️</div>
              <div className="text-xs uppercase tracking-wider opacity-70">Before</div>
              <div className="text-lg font-bold" style={{ color: palette.danger }}>
                {formatNumber(deathsPerYear, 'compact')}/yr
              </div>
            </div>
            <div className="p-4 rounded" style={{ backgroundColor: `${palette.success}20` }}>
              <div className="text-2xl mb-1">💚</div>
              <div className="text-xs uppercase tracking-wider opacity-70">After</div>
              <div className="text-lg font-bold" style={{ color: palette.success }}>
                Optimized
              </div>
            </div>
          </div>
        </div>

        {/* Impact statement */}
        <div 
          className="text-center max-w-[1700px] px-4 py-6 rounded-lg border-2"
          style={{ 
            borderColor: palette.success,
            backgroundColor: `${palette.success}10`
          }}
        >
          <div className="text-lg md:text-xl font-medium">
            That&apos;s more lives than were lost in all wars of the 20th century.
          </div>
          <div className="text-sm mt-2 opacity-70">
            Combined.
          </div>
        </div>
      </div>

      {/* Pulsing border effect */}
      <div 
        className="absolute inset-0 pointer-events-none border-4 rounded-lg animate-pulse"
        style={{ borderColor: `${palette.success}40` }}
      />
    </SlideBase>
  );
}
