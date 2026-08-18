"use client";

import { useEffect, useState } from "react";
import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { ParticleEmitter } from "../../animations/sierra/particle-emitter";
import {
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  TREATY_ANNUAL_FUNDING,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
} from "@optimitron/data/parameters";
import { PALETTE_SEMANTIC } from "@/lib/demo/palette";
import { formatCurrency } from "@/lib/demo/formatters";

const livesSaved = Math.round(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value / 1e8) * 1e8;
const militarySpending = GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value;
const treatyFunding = TREATY_ANNUAL_FUNDING.value;
const trialMultiplier = DFDA_TRIAL_CAPACITY_MULTIPLIER.value;
const incomeGain = TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA.value;
const haleGain = TREATY_HALE_GAIN_YEAR_15.value;
const incomeMultiplier = TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER.value;

const chainSteps = [
  {
    emoji: "💣",
    label: "1% OF MILITARY",
    value: formatCurrency(treatyFunding),
    sublabel: `1% of ${formatCurrency(militarySpending)}`,
    color: "text-brutal-red",
  },
  {
    emoji: "🧪",
    label: "TRIAL CAPACITY",
    value: `${trialMultiplier.toFixed(1)}×`,
    sublabel: "capacity via pragmatic trials",
    color: "text-background",
  },
  {
    emoji: "⏩",
    label: "CURES ARRIVE",
    value: "YEARS EARLIER",
    sublabel: "faster discovery pipeline",
    color: "text-background",
  },
  {
    emoji: "❤️",
    label: "LIVES SAVED",
    value: `${(livesSaved / 1e9).toFixed(1)}B`,
    sublabel: "deaths prevented",
    color: "text-background",
  },
];

export function SlideTenBillionLivesSaved() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Stagger chain steps
    chainSteps.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleSteps(i + 1), 600 + i * 800));
    });

    // Show bottom stats after chain
    timers.push(setTimeout(() => setShowStats(true), 600 + chainSteps.length * 800 + 400));

    // Confetti after everything
    timers.push(setTimeout(() => setShowConfetti(true), 600 + chainSteps.length * 800 + 1000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SierraSlideWrapper className="relative overflow-hidden">
      <style jsx>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .step-in { animation: stepIn 0.4s ease-out forwards; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease-out forwards; }
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

      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8 w-full max-w-[1600px] mx-auto">
        {/* Title */}
        <div className="font-pixel text-2xl md:text-4xl text-background text-center">
          WHAT 1% BUYS YOU
        </div>

        {/* Derivation chain */}
        <div className="flex items-center justify-center gap-2 md:gap-4 w-full flex-wrap">
          {chainSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2 md:gap-4">
              <div
                className={`text-center p-4 md:p-6 bg-muted border-2 border-primary rounded ${
                  i < visibleSteps ? "step-in" : "opacity-0"
                }`}
              >
                <div className="text-3xl md:text-4xl mb-1">{step.emoji}</div>
                <div className={`font-pixel text-2xl md:text-4xl ${step.color}`}>
                  {step.value}
                </div>
                <div className="font-pixel text-xs md:text-sm text-muted-foreground mt-1">
                  {step.sublabel}
                </div>
              </div>
              {/* Arrow between steps */}
              {i < chainSteps.length - 1 && (
                <div className={`font-pixel text-2xl md:text-3xl text-muted-foreground ${
                  i < visibleSteps ? "step-in" : "opacity-0"
                }`}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom stats row */}
        {showStats && (
          <div className="flex gap-6 md:gap-12 fade-up">
            <div className="text-center">
              <div className="font-pixel text-3xl md:text-5xl text-background">
                +{haleGain.toFixed(1)} yrs
              </div>
              <div className="font-pixel text-sm md:text-lg text-muted-foreground">
                HEALTHY YEARS GAINED
              </div>
            </div>
            <div className="text-center">
              <div className="font-pixel text-3xl md:text-5xl text-background">
                +${(incomeGain / 1e6).toFixed(1)}M
              </div>
              <div className="font-pixel text-sm md:text-lg text-muted-foreground">
                LIFETIME INCOME / PERSON
              </div>
            </div>
            <div className="text-center">
              <div className="font-pixel text-3xl md:text-5xl text-foreground">
                {Math.round(incomeMultiplier)}× richer
              </div>
              <div className="font-pixel text-sm md:text-lg text-muted-foreground">
                INCOME MULTIPLIER
              </div>
            </div>
          </div>
        )}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideTenBillionLivesSaved;
