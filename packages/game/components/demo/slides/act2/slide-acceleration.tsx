"use client";

import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { PARAMETERS } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

export function SlideAcceleration() {
  const [showRace, setShowRace] = useState(false);
  const [slowProgress, setSlowProgress] = useState(0);
  const [fastProgress, setFastProgress] = useState(0);

  useEffect(() => {
    setTimeout(() => setShowRace(true), 500);
  }, []);

  useEffect(() => {
    if (!showRace) return;

    // Slow trial (10 years)
    const slowInterval = setInterval(() => {
      setSlowProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 100);

    // Fast trial (12.3x faster)
    const fastInterval = setInterval(() => {
      setFastProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 12.3;
      });
    }, 100);

    return () => {
      clearInterval(slowInterval);
      clearInterval(fastInterval);
    };
  }, [showRace]);

  return (
    <SlideBase act={2} className="text-cyan-400">
      {/* Title */}
      <h1 className="font-pixel text-lg md:text-2xl text-cyan-400 text-center mb-8">
        {PARAMETERS.trials.accelerationFactor}x FASTER TRIALS
      </h1>

      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Hourglass comparison */}
        <div className="grid grid-cols-2 gap-8">
          {/* Slow hourglass */}
          <div className="text-center">
            <div className="text-5xl md:text-7xl mb-4 opacity-50">⏳</div>
            <div className="font-pixel text-sm text-zinc-400">STATUS QUO</div>
            <div className="font-pixel text-2xl text-red-400 mt-2">
              {PARAMETERS.trials.currentDurationAllDiseases} years
            </div>
            <div className="font-pixel text-xs text-zinc-500 mt-1">
              to cure ALL diseases
            </div>
          </div>

          {/* Fast hourglass */}
          <div className="text-center">
            <div className="text-5xl md:text-7xl mb-4 animate-spin-slow">⌛</div>
            <div className="font-pixel text-sm text-emerald-400">1% TREATY</div>
            <div className="font-pixel text-2xl text-emerald-400 mt-2">
              {PARAMETERS.trials.acceleratedDurationAllDiseases} years
            </div>
            <div className="font-pixel text-xs text-zinc-500 mt-1">
              to cure ALL diseases
            </div>
          </div>
        </div>

        {/* Racing timelines */}
        {showRace && (
          <div className="space-y-6">
            <div className="font-pixel text-sm text-center text-zinc-400">
              CLINICAL TRIAL RACE
            </div>

            {/* Slow lane */}
            <div className="space-y-2">
              <div className="flex justify-between font-pixel text-xs">
                <span className="text-red-400">Standard Trial</span>
                <span className="text-zinc-500">{Math.min(slowProgress, 100).toFixed(0)}%</span>
              </div>
              <div className="h-6 bg-zinc-900 border border-zinc-700 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-100"
                  style={{ width: `${Math.min(slowProgress, 100)}%` }}
                />
                {/* Year markers */}
                {[2, 4, 6, 8, 10].map((year) => (
                  <div
                    key={year}
                    className="absolute top-0 bottom-0 w-px bg-zinc-700"
                    style={{ left: `${year * 10}%` }}
                  >
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-pixel text-xs text-zinc-600">
                      {year}yr
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fast lane */}
            <div className="space-y-2">
              <div className="flex justify-between font-pixel text-xs">
                <span className="text-emerald-400">Accelerated Trial</span>
                <span className="text-emerald-400">
                  {Math.min(fastProgress, 100).toFixed(0)}%
                  {fastProgress >= 100 && " - COMPLETE!"}
                </span>
              </div>
              <div className="h-6 bg-zinc-900 border border-emerald-500/50 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-100"
                  style={{ width: `${Math.min(fastProgress, 100)}%` }}
                />
                {fastProgress >= 100 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-pixel text-xs text-white animate-pulse">
                      APPROVED
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Impact stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-cyan-500/10 border border-cyan-500/30 rounded">
            <div className="font-pixel text-2xl text-cyan-400">
              <AnimatedCounter end={1000} duration={2000} suffix="+" />
            </div>
            <div className="font-pixel text-xs text-zinc-500">Treatments/year</div>
          </div>
          <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
            <div className="font-pixel text-2xl text-emerald-400">
              <AnimatedCounter end={90} duration={2000} suffix="%" />
            </div>
            <div className="font-pixel text-xs text-zinc-500">Cost reduction</div>
          </div>
          <div className="text-center p-3 bg-amber-500/10 border border-amber-500/30 rounded">
            <div className="font-pixel text-2xl text-amber-400">
              <AnimatedCounter end={147} duration={2000} prefix="$" suffix="M" />
            </div>
            <div className="font-pixel text-xs text-zinc-500">Per life saved</div>
          </div>
        </div>

        {/* Bottom text */}
        <div className="text-center font-terminal text-sm text-zinc-400">
          Faster trials = more treatments = more lives saved
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </SlideBase>
  );
}
