"use client";

import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import {
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  TREATY_ANNUAL_FUNDING,
} from "@optimitron/data/parameters";
import { formatCurrency } from "@/lib/demo/formatters";
import { useEffect, useState } from "react";

const militaryGlobal = GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value;
const onePercentMilitary = TREATY_ANNUAL_FUNDING.value;

export function SlideOnePercent() {
  const [sliderValue, setSliderValue] = useState(0);
  const [showImpact, setShowImpact] = useState(false);

  useEffect(() => {
    // Animate slider from 0 to 1%
    const interval = setInterval(() => {
      setSliderValue((prev) => {
        if (prev >= 1) {
          clearInterval(interval);
          setTimeout(() => setShowImpact(true), 500);
          return 1;
        }
        return prev + 0.05;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const redirectedAmount = (sliderValue / 100) * militaryGlobal;

  return (
    <SlideBase act={2} className="text-emerald-400">
      {/* Title */}
      <h1 className="font-pixel text-xl md:text-2xl text-emerald-400 text-center mb-8">
        THE 1% SOLUTION
      </h1>

      <div className="w-full max-w-[1700px] mx-auto space-y-8">
        {/* Before/After comparison */}
        <div className="grid grid-cols-2 gap-4 md:gap-8">
          {/* Before */}
          <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded">
            <div className="font-pixel text-xl text-red-400 mb-2">CURRENT</div>
            <div className="text-3xl mb-2">⚔️</div>
            <div className="font-pixel text-xl text-red-400">
              {formatCurrency(militaryGlobal)}
            </div>
            <div className="font-pixel text-2xl text-zinc-200 mt-1">
              100% to military
            </div>
          </div>

          {/* After */}
          <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded">
            <div className="font-pixel text-xl text-emerald-400 mb-2">PROPOSED</div>
            <div className="flex justify-center gap-2 mb-2">
              <span className="text-2xl">⚔️</span>
              <span className="text-2xl">🧪</span>
            </div>
            <div className="font-pixel text-xl text-emerald-400">
              99% + 1%
            </div>
            <div className="font-pixel text-2xl text-zinc-200 mt-1">
              Tiny shift, massive impact
            </div>
          </div>
        </div>

        {/* Animated slider */}
        <div className="space-y-4">
          <div className="font-pixel text-2xl text-center text-zinc-200">
            REALLOCATION SLIDER
          </div>
          
          <div className="relative h-12 bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
            {/* Military portion */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-500 transition-all duration-100"
              style={{ width: `${100 - sliderValue}%` }}
            >
              <div className="absolute inset-0 flex items-center justify-center font-pixel text-xl text-white/80">
                Military: {(100 - sliderValue).toFixed(1)}%
              </div>
            </div>
            
            {/* Trials portion */}
            <div
              className="absolute inset-y-0 right-0 bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-100"
              style={{ width: `${sliderValue}%` }}
            >
              {sliderValue > 0.5 && (
                <div className="absolute inset-0 flex items-center justify-center font-pixel text-xl text-white/80">
                  Trials: {sliderValue.toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Slider track visualization */}
          <div className="flex justify-between font-pixel text-2xl text-zinc-200">
            <span>0%</span>
            <span className="text-emerald-400">1% = THE TREATY</span>
            <span>100%</span>
          </div>
        </div>

        {/* Amount being redirected */}
        <div className="text-center">
          <div className="font-pixel text-2xl text-zinc-200 mb-2">
            FUNDS REDIRECTED TO CLINICAL TRIALS
          </div>
          <div className="font-pixel text-3xl md:text-5xl text-emerald-400">
            <AnimatedCounter
              end={onePercentMilitary}
              duration={2000}
              format="currency"
              decimals={1}
            />
          </div>
          <div className="font-pixel text-2xl text-zinc-200 mt-2">
            per year
          </div>
        </div>

        {/* Impact reveal */}
        {showImpact && (
          <div className="grid grid-cols-3 gap-4 animate-fade-in">
            <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
              <div className="text-2xl mb-1">🧬</div>
              <div className="font-pixel text-2xl text-emerald-400">12.3x</div>
              <div className="font-pixel text-2xl text-zinc-200">Faster trials</div>
            </div>
            <div className="text-center p-3 bg-cyan-500/10 border border-cyan-500/30 rounded">
              <div className="text-2xl mb-1">💊</div>
              <div className="font-pixel text-2xl text-cyan-400">1000+</div>
              <div className="font-pixel text-2xl text-zinc-200">New treatments</div>
            </div>
            <div className="text-center p-3 bg-amber-500/10 border border-amber-500/30 rounded">
              <div className="text-2xl mb-1">🌍</div>
              <div className="font-pixel text-2xl text-amber-400">10.7B</div>
              <div className="font-pixel text-2xl text-zinc-200">Lives saved</div>
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
    </SlideBase>
  );
}
