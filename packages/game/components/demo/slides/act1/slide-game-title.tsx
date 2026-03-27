"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";

export function SlideGameTitle() {
  const [sliderAnimated, setSliderAnimated] = useState(false);
  const [showCuresLabel, setShowCuresLabel] = useState(false);
  const [blinkVisible, setBlinkVisible] = useState(true);

  useEffect(() => {
    // Animate slider after a short delay
    const sliderTimer = setTimeout(() => {
      setSliderAnimated(true);
    }, 1200);

    // Show +$27B label after slider animates
    const labelTimer = setTimeout(() => {
      setShowCuresLabel(true);
    }, 2200);

    // Blinking cursor for PRESS START
    const blinkInterval = setInterval(() => {
      setBlinkVisible((prev) => !prev);
    }, 600);

    return () => {
      clearTimeout(sliderTimer);
      clearTimeout(labelTimer);
      clearInterval(blinkInterval);
    };
  }, []);

  return (
    <SlideBase act={1} className="text-amber-400">
      <div className="flex flex-col items-center justify-center gap-8 max-w-[1700px] mx-auto">
        {/* Main Title */}
        <h1 className="font-pixel text-2xl md:text-4xl text-amber-400 text-center leading-relaxed tracking-wide">
          THE EARTH OPTIMIZATION GAME
        </h1>

        {/* Allocation Slider */}
        <div className="w-full max-w-4xl space-y-3">
          <div className="font-pixel text-xs text-zinc-500 text-center">
            GLOBAL RESOURCE ALLOCATION
          </div>
          <div className="relative h-10 bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
            {/* Explosions portion */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-700 to-red-600 transition-all duration-1000 ease-out flex items-center justify-center"
              style={{ width: sliderAnimated ? "99%" : "100%" }}
            >
              <span className="font-pixel text-sm text-white/80">
                99% EXPLOSIONS 💥
              </span>
            </div>
            {/* Cures portion */}
            <div
              className="absolute inset-y-0 right-0 bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-1000 ease-out flex items-center justify-center"
              style={{ width: sliderAnimated ? "1%" : "0%" }}
            />
          </div>
          <div className="flex justify-between font-pixel text-xs text-zinc-500">
            <span className="text-red-400">💥 EXPLOSIONS</span>
            <span className="text-emerald-400">CURES 🧪</span>
          </div>

          {/* +$27B CURES label popup */}
          <div className="h-8 flex items-center justify-center">
            {showCuresLabel && (
              <div className="font-pixel text-sm md:text-base text-emerald-400 animate-bounce bg-emerald-500/10 border border-emerald-500/40 rounded px-4 py-1">
                +$27B → CURES
              </div>
            )}
          </div>
        </div>

        {/* Subtitle */}
        <p className="font-pixel text-sm md:text-xs text-zinc-400 text-center italic max-w-3xl">
          A Point-and-Click Adventure in Civilisational Reallocation
        </p>

        {/* Press Start */}
        <div className="mt-4">
          <span
            className="font-pixel text-sm md:text-base text-amber-400 tracking-widest"
            style={{ opacity: blinkVisible ? 1 : 0 }}
          >
            ▶ PRESS START ◀
          </span>
        </div>
      </div>
    </SlideBase>
  );
}
