"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { AnimatedCounter } from "../../animations/sierra/animated-counter";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { GLOBAL_DISEASE_DEATHS_DAILY } from "@optimitron/data/parameters";
import { useEffect, useState } from "react";

const TOTAL_TOWERS = GAME_PARAMS.september11Equivalent; // 59

export function SlideDailyDeathToll() {
  const [phase, setPhase] = useState(0);
  const [towersVisible, setTowersVisible] = useState(0);
  const [skullCount, setSkullCount] = useState(0);

  // Grid: how many skulls fit per row and how many rows fill the screen
  const SKULL_SIZE = 40; // px per skull cell
  const COLS = Math.ceil(1920 / SKULL_SIZE); // ~48 columns
  const MAX_ROWS = Math.ceil(1080 / SKULL_SIZE); // ~27 rows
  const MAX_SKULLS = COLS * MAX_ROWS;

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

    // Skulls accumulate — fill entire background bottom-up
    const skullInterval = setInterval(() => {
      setSkullCount((prev) => {
        if (prev >= MAX_SKULLS) {
          clearInterval(skullInterval);
          return MAX_SKULLS;
        }
        return prev + 3; // 3 skulls per tick for faster fill
      });
    }, 50);

    return () => {
      clearInterval(towerInterval);
      clearInterval(skullInterval);
    };
  }, [MAX_SKULLS]);

  return (
    <SierraSlideWrapper act={1} className="text-red-500">
      {/* Skulls piling up over entire background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: Math.min(skullCount, MAX_SKULLS) }).map((_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          return (
            <span
              key={i}
              className="absolute text-lg leading-none"
              style={{
                bottom: row * SKULL_SIZE,
                left: col * SKULL_SIZE,
                width: SKULL_SIZE,
                textAlign: "center",
                opacity: 0.3 + row * 0.02,
              }}
            >
              💀
            </span>
          );
        })}
      </div>

      <div className="w-full max-w-[1700px] mx-auto flex flex-col items-center justify-center gap-4 relative h-full z-10">
        {/* Dark translucent card so text is readable over skulls */}
        <div className="bg-foreground/85 backdrop-blur-sm rounded-md px-12 py-10 flex flex-col items-center gap-4 border-2 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
        {/* Top: "BUGS IN YOUR MEAT SOFTWARE / KILL" */}
        <div
          className={`text-center transition-opacity duration-1000 ${
            phase >= 1 ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="font-pixel text-2xl md:text-4xl text-red-400 tracking-widest">
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
              end={GLOBAL_DISEASE_DEATHS_DAILY.value}
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
          className={`font-pixel text-2xl md:text-4xl text-red-400 transition-opacity duration-1000 ${
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
                className={`text-xl md:text-2xl transition-opacity duration-200 ${
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
          <div className="font-pixel text-xl md:text-3xl text-red-400">
            THAT IS {TOTAL_TOWERS} SEPTEMBER 11THS.
          </div>
        </div>

        {/* Punchline */}
        <div
          className={`text-center transition-opacity duration-1000 ${
            phase >= 4 ? "opacity-70" : "opacity-0"
          }`}
        >
          <div className="font-pixel text-xl md:text-2xl text-red-400">
            NOBODY INVADES ANYBODY ABOUT IT
          </div>
          <div className="font-pixel text-xl md:text-2xl text-red-400 mt-1">
            BECAUSE CANCER DOES NOT HAVE OIL.
          </div>
        </div>

        </div>{/* end translucent card */}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideDailyDeathToll;
