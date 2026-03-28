"use client";

import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { AnimatedBarChart } from "../../animations/animated-bar-chart";
import {
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
} from "@optimitron/data/parameters";
import { formatCurrency } from "@/lib/demo/formatters";
import { useEffect, useState } from "react";

export function SlideMilitaryHealthRatio() {
  const [showComparison, setShowComparison] = useState(false);
  const [showRatio, setShowRatio] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowComparison(true), 1500);
    const timer2 = setTimeout(() => setShowRatio(true), 3500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const barData = [
    {
      label: "Military",
      value: GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value,
      color: "#ef4444", // red
      icon: "⚔️",
    },
    {
      label: "Trials",
      value: GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value,
      color: "#22c55e", // green
      icon: "🧪",
    },
  ];

  return (
    <SlideBase act={1} className="text-red-400">
      {/* Title removed — the bars ARE the title */}

      {/* Two counters racing */}
      <div className="w-full max-w-[1700px] mx-auto space-y-8">
        {/* Counter display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Military */}
          <div className="text-center">
            <div className="font-pixel text-xl md:text-2xl text-zinc-200 mb-2">
              GLOBAL MILITARY SPENDING
            </div>
            <div className="font-pixel text-2xl md:text-4xl text-red-500">
              <AnimatedCounter
                end={GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value}
                duration={2500}
                format="currency"
                decimals={2}
              />
            </div>
            <div className="text-4xl mt-2">⚔️</div>
          </div>

          {/* Clinical Trials */}
          <div className="text-center">
            <div className="font-pixel text-xl md:text-2xl text-zinc-200 mb-2">
              CLINICAL TRIAL FUNDING
            </div>
            <div className="font-pixel text-2xl md:text-4xl text-green-500">
              <AnimatedCounter
                end={GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value}
                duration={2500}
                format="currency"
                decimals={1}
              />
            </div>
            <div className="text-4xl mt-2">🧪</div>
          </div>
        </div>

        {/* Visual bar comparison */}
        <div
          className={`transition-all duration-1000 ${
            showComparison ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="space-y-4">
            {/* Military bar - takes full width */}
            <div>
              <div className="flex justify-between text-xl font-pixel mb-1">
                <span className="text-red-400">⚔️ Military</span>
                <span className="text-red-400">{formatCurrency(GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value)}</span>
              </div>
              <div className="h-8 md:h-12 bg-zinc-900 border border-zinc-700 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-2000"
                  style={{ width: showComparison ? "100%" : "0%" }}
                />
              </div>
            </div>

            {/* Trials bar - tiny sliver */}
            <div>
              <div className="flex justify-between text-xl font-pixel mb-1">
                <span className="text-green-400">🧪 Clinical Trials</span>
                <span className="text-green-400">{formatCurrency(GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value)}</span>
              </div>
              <div className="h-8 md:h-12 bg-zinc-900 border border-zinc-700 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-500 transition-all duration-2000"
                  style={{ 
                    width: showComparison
                      ? `${(GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value / GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value) * 100}%`
                      : "0%",
                    minWidth: showComparison ? "4px" : "0px",
                  }}
                />
                {/* Arrow pointing to tiny bar */}
                {showComparison && (
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-green-400 animate-pulse">
                    <span className="font-pixel text-xl">← BARELY VISIBLE</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* The ratio reveal */}
        <div
          className={`text-center transition-all duration-1000 ${
            showRatio ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <div className="font-pixel text-6xl md:text-9xl text-red-500 animate-pulse">
            {Math.round(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value)}:1
          </div>
          <div className="font-pixel text-xl md:text-2xl text-zinc-200 mt-4">
            ${Math.round(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value)} spent on orphan manufacturing for every $1 on clinical trials.
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
