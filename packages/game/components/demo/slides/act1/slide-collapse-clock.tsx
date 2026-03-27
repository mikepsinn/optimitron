"use client";

import { SlideBase } from "../slide-base";
import { AnimatedLineChart } from "../../animations/animated-line-chart";
import { useEffect, useState } from "react";

export function SlideCollapseClock() {
  const [showClock, setShowClock] = useState(false);
  const [clockAngle, setClockAngle] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowClock(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Animate clock hands racing
  useEffect(() => {
    if (!showClock) return;
    const interval = setInterval(() => {
      setClockAngle((prev) => prev + 2);
    }, 50);
    return () => clearInterval(interval);
  }, [showClock]);

  // Debt vs GDP data - showing intersection point
  const debtData = Array.from({ length: 20 }, (_, i) => ({
    x: 2020 + i,
    y: 100 + i * i * 0.8, // Exponential debt growth
  }));

  const gdpData = Array.from({ length: 20 }, (_, i) => ({
    x: 2020 + i,
    y: 100 + i * 3, // Linear GDP growth
  }));

  return (
    <SlideBase act={1} className="text-amber-500">
      <div className="w-full max-w-[1700px] mx-auto space-y-6">
        {/* Title */}
        <h1 className="font-pixel text-2xl md:text-4xl text-amber-400 text-center">
          THE ECONOMIC COLLAPSE CLOCK
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Animated clock */}
          <div
            className={`flex justify-center transition-all duration-1000 ${
              showClock ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
          >
            <div className="relative w-64 h-64 md:w-96 md:h-96">
              {/* Clock face */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Outer ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-amber-500"
                />
                {/* Inner ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-amber-500"
                />
                {/* Hour markers */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const x1 = 50 + Math.cos(angle) * 40;
                  const y1 = 50 + Math.sin(angle) * 40;
                  const x2 = 50 + Math.cos(angle) * 44;
                  const y2 = 50 + Math.sin(angle) * 44;
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-amber-500"
                    />
                  );
                })}
                {/* Hour hand (debt) - red, racing */}
                <line
                  x1="50"
                  y1="50"
                  x2={50 + Math.cos((clockAngle * 0.1 - 90) * (Math.PI / 180)) * 25}
                  y2={50 + Math.sin((clockAngle * 0.1 - 90) * (Math.PI / 180)) * 25}
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Minute hand (GDP) - green, slow */}
                <line
                  x1="50"
                  y1="50"
                  x2={50 + Math.cos((clockAngle * 0.02 - 90) * (Math.PI / 180)) * 35}
                  y2={50 + Math.sin((clockAngle * 0.02 - 90) * (Math.PI / 180)) * 35}
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Center dot */}
                <circle cx="50" cy="50" r="3" fill="currentColor" className="text-amber-500" />
              </svg>

              {/* Clock hand labels */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center mt-16">
                  <div className="font-pixel text-sm md:text-xl text-red-400">PARASITIC (15%/yr)</div>
                  <div className="font-pixel text-sm md:text-xl text-green-400">PRODUCTIVE (3%/yr)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Line chart showing intersection */}
          <div className="space-y-4">
            <AnimatedLineChart
              lines={[
                { points: debtData, color: "#ef4444", label: "Debt" },
                { points: gdpData, color: "#22c55e", label: "GDP" },
              ]}
              width={350}
              height={200}
              animate
              duration={3000}
              delay={500}
              showArea
              xAxisLabel="Year"
              yAxisLabel="% of 2020"
              formatY={(v) => `${v}%`}
            />

            <div className="font-pixel text-xl text-center text-red-500 animate-pulse">
              2040: COLLAPSE THRESHOLD
            </div>
          </div>
        </div>

        {/* Warning text */}
        <div className="text-center space-y-2">
          <div className="font-pixel text-xl md:text-2xl text-red-500 animate-pulse">
            POINT OF NO RETURN APPROACHING
          </div>
          <div className="font-terminal text-xl text-zinc-200">
            Healthcare spending becomes mathematically impossible
          </div>
        </div>

        {/* Countdown style display */}
        <div className="flex justify-center gap-4 md:gap-8">
          {[
            { label: "YEARS", value: "14" },
            { label: "DAYS", value: "247" },
            { label: "HRS", value: "08" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="font-pixel text-2xl md:text-4xl text-red-500 bg-black/50 px-3 py-2 border border-red-500/30">
                {item.value}
              </div>
              <div className="font-pixel text-xl text-zinc-200 mt-1">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideBase>
  );
}
