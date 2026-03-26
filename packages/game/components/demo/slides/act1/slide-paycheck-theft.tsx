"use client";

import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { PARAMETERS } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

export function SlidePaycheckTheft() {
  const [showSiphon, setShowSiphon] = useState(false);
  const [showTotal, setShowTotal] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowSiphon(true), 1000);
    const timer2 = setTimeout(() => setShowTotal(true), 3000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const wasteCategories = [
    { label: "ENDLESS WAR", color: "#ef4444" },
    { label: "BANK BAILOUTS", color: "#f97316" },
    { label: "MILITARY CONTRACTORS", color: "#eab308" },
  ];

  return (
    <SlideBase act={1} className="text-amber-500">
      {/* Coin particles being siphoned */}
      {showSiphon && (
        <ParticleEmitter
          emoji={["💰", "💵", "🪙"]}
          rate={8}
          direction="up"
          speed={40}
          lifetime={2000}
          className="opacity-50"
        />
      )}

      {/* Title */}
      <h1 className="font-pixel text-lg md:text-2xl text-amber-400 text-center mb-6">
        THEY&apos;RE STEALING YOUR PAYCHECK
      </h1>

      <div className="w-full max-w-7xl mx-auto">
        {/* Sankey-style flow visualization */}
        <div className="relative h-64 md:h-80">
          {/* Your paycheck (left side) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-24 md:w-32">
            <div className="text-4xl md:text-6xl text-center">💼</div>
            <div className="font-pixel text-xs text-center text-amber-400 mt-2">
              YOUR<br />PAYCHECK
            </div>
          </div>

          {/* Flow arrows */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            {wasteCategories.map((cat, i) => {
              const startY = 100;
              const endY = 40 + i * 60;
              const controlX = 200;

              return (
                <g key={cat.label}>
                  <path
                    d={`M 80 ${startY} Q ${controlX} ${startY} ${controlX} ${endY} T 320 ${endY}`}
                    fill="none"
                    stroke={cat.color}
                    strokeWidth={4}
                    strokeOpacity={showSiphon ? 0.6 : 0}
                    className="transition-all duration-1000"
                  />
                  {/* Animated dots along path */}
                  {showSiphon && (
                    <circle r="3" fill={cat.color}>
                      <animateMotion
                        dur={`${2 + i * 0.3}s`}
                        repeatCount="indefinite"
                        path={`M 80 ${startY} Q ${controlX} ${startY} ${controlX} ${endY} T 320 ${endY}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Waste buckets (right side) */}
          <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 flex flex-col justify-around py-2">
            {wasteCategories.map((cat) => (
              <div
                key={cat.label}
                className={`flex items-center gap-2 transition-opacity duration-500 ${
                  showSiphon ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="font-pixel text-xs md:text-xs" style={{ color: cat.color }}>
                  &rarr; {cat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lifetime loss counter */}
        <div
          className={`text-center mt-4 transition-all duration-1000 ${
            showTotal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="font-pixel text-sm text-zinc-400 mb-2">
            YOUR LIFETIME LOSS TO DYSFUNCTION
          </div>
          <div className="font-pixel text-4xl md:text-6xl text-red-500">
            <AnimatedCounter
              end={PARAMETERS.economic.personalLifetimeLoss}
              duration={2500}
              format="currency"
              decimals={1}
            />
          </div>
          <div className="font-terminal text-sm text-zinc-500 mt-2">
            That&apos;s money that should be yours
          </div>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded">
            <div className="font-pixel text-xs text-red-400 mb-1">YOUR PAYCHECK</div>
            <div className="font-pixel text-xl text-red-500">
              ${PARAMETERS.economic.currentMedianIncome.toLocaleString()}
            </div>
            <div className="font-pixel text-xs text-zinc-500">per year</div>
          </div>
          <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded">
            <div className="font-pixel text-xs text-green-400 mb-1">IF WAGES KEPT PACE</div>
            <div className="font-pixel text-xl text-green-500">
              ${PARAMETERS.economic.wageKeptPaceIncome.toLocaleString()}
            </div>
            <div className="font-pixel text-xs text-zinc-500">per year</div>
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
