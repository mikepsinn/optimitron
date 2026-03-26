"use client";

import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { PARAMETERS } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

const TOTAL_TOWERS = PARAMETERS.deaths.september11Equivalent; // 59

export function SlideDeathCounter() {
  const [phase, setPhase] = useState(0);
  const [towersVisible, setTowersVisible] = useState(0);
  const [skullCount, setSkullCount] = useState(0);

  useEffect(() => {
    // Phase 1 (0s): "BUGS IN YOUR MEAT SOFTWARE / KILL" fades in
    setTimeout(() => setPhase(1), 500);
    // Phase 2 (1s): Counter starts
    setTimeout(() => setPhase(2), 1000);
    // Phase 3 (4s): "OF YOU EVERY DAY" + towers start filling
    setTimeout(() => setPhase(3), 4000);
    // Phase 4 (after towers): Punchline text
    setTimeout(() => setPhase(4), 4000 + TOTAL_TOWERS * 120 + 500);

    // Towers fill in one by one
    const towerInterval = setInterval(() => {
      setTowersVisible((prev) => {
        if (prev >= TOTAL_TOWERS) {
          clearInterval(towerInterval);
          return TOTAL_TOWERS;
        }
        return prev + 1;
      });
    }, 120);

    // Skulls accumulate
    const skullInterval = setInterval(() => {
      setSkullCount((prev) => Math.min(prev + 1, 80));
    }, 200);

    return () => {
      clearInterval(towerInterval);
      clearInterval(skullInterval);
    };
  }, []);

  return (
    <SlideBase act={1} className="text-red-500">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center gap-4 relative h-full">
        {/* Top: "BUGS IN YOUR MEAT SOFTWARE / KILL" */}
        <div
          className={`text-center transition-opacity duration-1000 ${
            phase >= 1 ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="font-pixel text-lg md:text-2xl text-red-400/70 tracking-widest">
            BUGS IN YOUR MEAT SOFTWARE
          </div>
          <div className="font-pixel text-2xl md:text-4xl text-red-500 mt-1">
            KILL
          </div>
        </div>

        {/* Giant counter */}
        <div className="relative">
          <div
            className={`font-pixel text-6xl md:text-8xl lg:text-9xl text-red-500 tabular-nums transition-opacity duration-500 ${
              phase >= 2 ? "opacity-100" : "opacity-0"
            }`}
          >
            <AnimatedCounter
              end={PARAMETERS.deaths.perDay}
              duration={3000}
              format="number"
              easing="easeOut"
            />
          </div>
          {/* Glow */}
          <div className="absolute inset-0 blur-3xl bg-red-500/20 animate-pulse -z-10" />
        </div>

        {/* "OF YOU EVERY DAY" */}
        <div
          className={`font-pixel text-lg md:text-2xl text-red-400 transition-opacity duration-1000 ${
            phase >= 3 ? "opacity-100" : "opacity-0"
          }`}
        >
          OF YOU EVERY DAY
        </div>

        {/* 59 towers */}
        {phase >= 3 && (
          <div className="flex flex-wrap justify-center gap-1 max-w-[600px] mt-2">
            {Array.from({ length: TOTAL_TOWERS }).map((_, i) => (
              <span
                key={i}
                className={`text-base md:text-lg transition-opacity duration-200 ${
                  i < towersVisible ? "opacity-80" : "opacity-0"
                }`}
              >
                🏢
              </span>
            ))}
          </div>
        )}

        {/* "THAT IS 59 SEPTEMBER 11THS." */}
        <div
          className={`text-center transition-opacity duration-1000 mt-2 ${
            phase >= 4 ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="font-pixel text-base md:text-xl text-red-400">
            THAT IS {TOTAL_TOWERS} SEPTEMBER 11THS.
          </div>
        </div>

        {/* Punchline */}
        <div
          className={`text-center transition-opacity duration-1000 ${
            phase >= 4 ? "opacity-70" : "opacity-0"
          }`}
        >
          <div className="font-pixel text-sm md:text-lg text-red-300/50">
            NOBODY INVADES ANYBODY ABOUT IT
          </div>
          <div className="font-pixel text-sm md:text-lg text-red-300/50 mt-1">
            BECAUSE CANCER DOES NOT HAVE OIL.
          </div>
        </div>

        {/* Skulls accumulating at bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center pointer-events-none overflow-hidden h-16">
          {Array.from({ length: skullCount }).map((_, i) => (
            <span
              key={i}
              className="text-sm opacity-40"
              style={{
                position: "absolute",
                bottom: `${Math.floor(i / 20) * 16}px`,
                left: `${(i % 20) * 5 + Math.random() * 2}%`,
              }}
            >
              💀
            </span>
          ))}
        </div>
      </div>
    </SlideBase>
  );
}
