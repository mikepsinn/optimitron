"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { AnimatedCounter } from "../../animations/sierra/animated-counter";
import {
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  TREATY_ANNUAL_FUNDING,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/data/parameters";
import { useEffect, useState } from "react";

const military = GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value;
const trials = GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value;
const treatyFunding = TREATY_ANNUAL_FUNDING.value;
const total = military + trials;
const currentTrialsPct = (trials / total) * 100; // ~0.17%
const treatyTrialsPct = ((trials + treatyFunding) / total) * 100; // ~1.16%
const trialMultiplier = DFDA_TRIAL_CAPACITY_MULTIPLIER.value;
const oldQueue = Math.round(STATUS_QUO_QUEUE_CLEARANCE_YEARS.value);
const newQueue = Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value);

export function SlideOnePercentTreaty() {
  const [sliderValue, setSliderValue] = useState(currentTrialsPct); // start at real ~0.2%
  const [showImpact, setShowImpact] = useState(false);
  const [fingerPhase, setFingerPhase] = useState<"waiting" | "dragging" | "done">("waiting");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: finger appears, pauses, then starts dragging
    timers.push(setTimeout(() => {
      setFingerPhase("dragging");

      // Sweep: explore around then settle on treaty target
      const keyframes = [
        { target: 2, speed: 0.04 },
        { target: 0.3, speed: 0.03 },
        { target: 1.5, speed: 0.03 },
        { target: treatyTrialsPct, speed: 0.015 },
      ];
      let step = 0;

      function animateToTarget() {
        const kf = keyframes[step];
        if (!kf) {
          setFingerPhase("done");
          setTimeout(() => setShowImpact(true), 500);
          return;
        }
        const interval = setInterval(() => {
          setSliderValue((prev) => {
            const diff = kf.target - prev;
            if (Math.abs(diff) < 0.03) {
              clearInterval(interval);
              step++;
              setTimeout(animateToTarget, 200);
              return kf.target;
            }
            return prev + Math.sign(diff) * kf.speed;
          });
        }, 30);
      }

      animateToTarget();
    }, 800));

    return () => timers.forEach(clearTimeout);
  }, []);

  const redirectedAmount = (sliderValue / 100) * military;

  return (
    <SierraSlideWrapper act={2} className="text-brutal-cyan">
      {/* Title */}
      <h1 className="font-pixel text-2xl md:text-4xl text-brutal-cyan text-center mb-8">
        THE 1% TREATY
      </h1>

      <div className="w-full max-w-[1700px] mx-auto space-y-8">
        {/* Animated slider */}
        <div className="space-y-4">
          <div className="relative h-14 bg-zinc-900 border-2 border-primary rounded flex">
            {/* Military portion */}
            <div
              className="relative bg-brutal-red transition-all duration-100 flex items-center justify-center overflow-hidden rounded-l"
              style={{ width: `${100 - sliderValue}%` }}
            >
              <span className="font-pixel text-xl text-brutal-red-foreground whitespace-nowrap">
                💣 Military: {(100 - sliderValue).toFixed(1)}%
              </span>
            </div>

            {/* Trials portion */}
            <div
              className="relative bg-brutal-cyan transition-all duration-100 flex items-center overflow-hidden rounded-r"
              style={{ width: `${Math.max(sliderValue, 0.5)}%` }}
            >
              {sliderValue > 0.3 && (
                <span className="font-pixel text-xl text-brutal-cyan-foreground whitespace-nowrap pl-2">
                  🧪 {sliderValue.toFixed(1)}%
                </span>
              )}
            </div>

            {/* Animated finger — below the bar */}
            <div
              className="absolute top-full mt-1 z-10 pointer-events-none transition-all duration-100"
              style={{
                left: `${100 - sliderValue}%`,
                transform: "translateX(-50%)",
                opacity: fingerPhase === "waiting" ? 0.6 : 1,
              }}
            >
              <span className={`text-4xl ${fingerPhase === "waiting" ? "animate-bounce" : fingerPhase === "done" ? "animate-pulse" : ""}`}>
                ☝️
              </span>
            </div>
          </div>

          {/* Labels */}
          <div className="flex justify-between font-pixel text-2xl">
            <span className="text-brutal-red">{(100 - sliderValue).toFixed(1)}% Military</span>
            <span className="text-brutal-cyan">{sliderValue.toFixed(1)}% Clinical Trials</span>
          </div>
        </div>

        {/* Impact reveal — $27B + timeline compression */}
        {showImpact && (
          <div className="space-y-6 animate-fade-in">
            {/* Redirected amount */}
            <div className="text-center">
              <div className="font-pixel text-3xl md:text-6xl text-brutal-cyan">
                <AnimatedCounter
                  end={treatyFunding}
                  duration={2000}
                  format="currency"
                  decimals={1}
                />
                <span className="text-2xl md:text-3xl text-muted-foreground"> / year</span>
              </div>
            </div>

            {/* Two key stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-muted border-2 border-brutal-cyan rounded">
                <div className="font-pixel text-xl text-muted-foreground mb-1">TRIAL CAPACITY</div>
                <div className="font-pixel text-4xl md:text-6xl text-brutal-cyan">
                  {trialMultiplier.toFixed(1)}×
                </div>
              </div>
              <div className="text-center p-4 bg-muted border-2 border-brutal-yellow rounded">
                <div className="font-pixel text-xl text-muted-foreground mb-1">TIME TO CURE ALL DISEASES</div>
                <div className="font-pixel text-4xl md:text-6xl text-brutal-red line-through">
                  {oldQueue} yrs
                </div>
                <div className="font-pixel text-4xl md:text-6xl text-brutal-cyan">
                  {newQueue} yrs
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </SierraSlideWrapper>
  );
}
export default SlideOnePercentTreaty;
