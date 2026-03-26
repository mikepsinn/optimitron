"use client";

import { SlideBase } from "../slide-base";
import { AnimatedLineChart } from "../../animations/animated-line-chart";
import { AnimatedCounter } from "../../animations/animated-counter";
import { PARAMETERS } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

export function SlideGDPTrajectory() {
  const [showLoop, setShowLoop] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowLoop(true), 2500);
  }, []);

  // Generate GDP trajectory data
  const baselineData = Array.from({ length: 30 }, (_, i) => ({
    x: 2025 + i,
    y: PARAMETERS.economic.currentGDPperCapita * Math.pow(1 + PARAMETERS.growth.statusQuoRate / 100, i),
  }));

  const optimizedData = Array.from({ length: 30 }, (_, i) => ({
    x: 2025 + i,
    y: PARAMETERS.economic.currentGDPperCapita * Math.pow(1 + PARAMETERS.growth.treatyRate / 100, i),
  }));

  const wishoniaData = Array.from({ length: 30 }, (_, i) => ({
    x: 2025 + i,
    y: PARAMETERS.economic.currentGDPperCapita * Math.pow(1 + PARAMETERS.growth.wishoniaRate / 100, i),
  }));

  return (
    <SlideBase act={2} className="text-amber-400">
      {/* Title */}
      <h1 className="font-pixel text-lg md:text-2xl text-amber-400 text-center mb-6">
        COMPOUND RETURNS
      </h1>

      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* GDP Chart */}
        <div className="bg-black/30 border border-amber-500/30 rounded p-4">
          <AnimatedLineChart
            lines={[
              { points: baselineData, color: "#ef4444", label: "Status Quo", dashed: true },
              { points: optimizedData, color: "#22c55e", label: "1% Treaty" },
              { points: wishoniaData, color: "#eab308", label: "Wishonia" },
            ]}
            width={500}
            height={220}
            animate
            duration={2500}
            showArea
            xAxisLabel="Year"
            yAxisLabel="GDP/Capita"
            formatY={(v) => `$${(v / 1000).toFixed(0)}K`}
          />
        </div>

        {/* Key numbers */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          <div className="text-center p-3 bg-red-500/10 border border-red-500/30 rounded">
            <div className="font-pixel text-sm text-red-400 mb-2">2055: STATUS QUO</div>
            <div className="font-pixel text-xl md:text-2xl text-red-400">
              <AnimatedCounter
                end={PARAMETERS.economic.currentGDPperCapita * Math.pow(1 + PARAMETERS.growth.statusQuoRate / 100, 30)}
                duration={2000}
                format="currency"
                decimals={0}
              />
            </div>
            <div className="font-pixel text-xs text-zinc-500 mt-1">per capita</div>
          </div>

          <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
            <div className="font-pixel text-sm text-emerald-400 mb-2">2055: 1% TREATY</div>
            <div className="font-pixel text-xl md:text-2xl text-emerald-400">
              <AnimatedCounter
                end={PARAMETERS.economic.projectedGDPperCapita_treaty}
                duration={2000}
                format="currency"
                decimals={0}
              />
            </div>
            <div className="font-pixel text-xs text-zinc-500 mt-1">per capita</div>
          </div>

          <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
            <div className="font-pixel text-sm text-yellow-400 mb-2">2055: WISHONIA</div>
            <div className="font-pixel text-xl md:text-2xl text-yellow-400">
              <AnimatedCounter
                end={PARAMETERS.economic.projectedGDPperCapita_wishonia}
                duration={2000}
                format="currency"
                decimals={0}
              />
            </div>
            <div className="font-pixel text-xs text-zinc-500 mt-1">per capita</div>
          </div>
        </div>

        {/* Compounding loop visualization */}
        {showLoop && (
          <div className="flex flex-col items-center space-y-4 animate-fade-in">
            <div className="font-pixel text-sm text-amber-300/70">
              THE VIRTUOUS CYCLE
            </div>
            
            {/* Circular loop diagram */}
            <div className="relative w-64 h-64">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Circular arrow path */}
                <path
                  d="M 50 10 A 40 40 0 1 1 49 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-amber-500/50"
                />
                {/* Animated arrow head */}
                <circle r="4" fill="#f59e0b">
                  <animateMotion
                    dur="4s"
                    repeatCount="indefinite"
                    path="M 50 10 A 40 40 0 1 1 49 10"
                  />
                </circle>
              </svg>

              {/* Loop labels */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center">
                <div className="text-xl">💰</div>
                <div className="font-pixel text-xs text-amber-400">Investment</div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-center">
                <div className="text-xl">🧪</div>
                <div className="font-pixel text-xs text-emerald-400">Research</div>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <div className="text-xl">💊</div>
                <div className="font-pixel text-xs text-cyan-400">Treatments</div>
              </div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-center">
                <div className="text-xl">📈</div>
                <div className="font-pixel text-xs text-purple-400">Productivity</div>
              </div>

              {/* Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="font-pixel text-lg text-amber-400">{PARAMETERS.growth.treatyRate}%</div>
              </div>
            </div>

            <div className="font-terminal text-xs text-zinc-400 text-center max-w-md">
              Healthier people are more productive, generating more tax revenue,
              funding more research, creating a self-reinforcing cycle of prosperity
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
