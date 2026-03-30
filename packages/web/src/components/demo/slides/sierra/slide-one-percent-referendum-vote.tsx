"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { INVENTORY_ITEMS } from "@/lib/demo/parameters";
import { MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO } from "@optimitron/data/parameters";
import { useEffect, useRef, useState } from "react";

const militaryRatio = MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value;
const militaryPct = (militaryRatio / (militaryRatio + 1)) * 100; // ~99.8%

export function SlideOnePercentReferendumVote() {
  const addInventoryItem = (_item: any) => {};
  const [phase, setPhase] = useState(0);
  const [sliderValue, setSliderValue] = useState(50); // starts at 50/50
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 2000));

    // Animate slider from current reality to 50/50
    timers.push(setTimeout(() => {
      setAnimating(true);
      setPhase(3);
    }, 3500));

    // Add inventory item
    timers.push(setTimeout(() => {
      addInventoryItem(INVENTORY_ITEMS[2]);
    }, 3000));

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Animate the slider — drag back and forth before settling on 98.8%
  const sliderRef = useRef(sliderValue);
  useEffect(() => { sliderRef.current = sliderValue; }, [sliderValue]);

  useEffect(() => {
    if (!animating) return;
    // Keyframes: [value, duration_ms] — finger explores wildly then settles
    const keyframes: [number, number][] = [
      [80, 600],    // drag right toward military
      [30, 700],    // big swing left toward clinical
      [90, 600],    // back right
      [20, 800],    // way left — 80% clinical
      [70, 500],    // swing back
      [40, 600],    // left again
      [95, 500],    // almost all military
      [98.8, 700],  // settle on 1.2% clinical
    ];
    let cancelled = false;
    let frame: number;

    async function run() {
      for (const [target, duration] of keyframes) {
        if (cancelled) return;
        const start = performance.now();
        const startVal = sliderRef.current;
        await new Promise<void>((resolve) => {
          function step() {
            if (cancelled) { resolve(); return; }
            const elapsed = performance.now() - start;
            const t = Math.min(elapsed / duration, 1);
            const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
            const val = startVal + (target - startVal) * ease;
            sliderRef.current = val;
            setSliderValue(val);
            if (t < 1) {
              frame = requestAnimationFrame(step);
            } else {
              resolve();
            }
          }
          frame = requestAnimationFrame(step);
        });
      }
      setAnimating(false);
    }

    void run();
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [animating]);

  const militaryDisplay = sliderValue.toFixed(1);
  const clinicalPct = (100 - sliderValue).toFixed(1);

  return (
    <SierraSlideWrapper act={2} className="text-cyan-400">
      {/* Level header */}
      <div className="text-center mb-4">
        <div className="font-pixel text-xl text-cyan-400 mb-1">LEVEL 2</div>
        <h1 className="font-pixel text-2xl md:text-4xl text-cyan-400">
          WISHOCRATIC PAIRWISE ALLOCATION
        </h1>
        <div className="font-terminal text-xl md:text-2xl text-zinc-200 mt-2">
          How should your governments allocate their resources?
        </div>
      </div>

      <div className="w-full max-w-[1700px] mx-auto space-y-6">
        {/* Slider allocation */}
        {phase >= 1 && (
          <div className="bg-muted border-2 border-brutal-cyan rounded-lg p-6 animate-fade-in">
            <div className="font-pixel text-xl md:text-2xl text-cyan-400 text-center mb-4">
              DRAG TO ALLOCATE
            </div>

            {/* Percentage display */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 text-center">
                <div className="font-pixel text-4xl md:text-5xl text-red-400">
                  {militaryDisplay}%
                </div>
                <div className="font-pixel text-xl md:text-2xl text-zinc-200 mt-1">
                  💣 Military &amp; Weapons
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="font-pixel text-4xl md:text-5xl text-emerald-400">
                  {clinicalPct}%
                </div>
                <div className="font-pixel text-xl md:text-2xl text-zinc-200 mt-1">
                  🧪 Clinical Trials
                </div>
              </div>
            </div>

            {/* Visual bar + finger */}
            <div className="relative mb-10">
              {/* Bar */}
              <div className="relative h-10 rounded overflow-hidden border-2 border-primary">
                <div
                  className="absolute inset-y-0 left-0 bg-brutal-red"
                  style={{ width: `${sliderValue}%` }}
                />
                <div
                  className="absolute inset-y-0 right-0 bg-brutal-cyan"
                  style={{ width: `${100 - sliderValue}%` }}
                />
                {/* Center divider */}
                <div
                  className="absolute inset-y-0 w-1 bg-foreground"
                  style={{ left: `${sliderValue}%`, transform: "translateX(-50%)" }}
                />
              </div>
              {/* Finger — below the bar, outside overflow-hidden */}
              <div
                className="absolute top-full mt-1 text-4xl pointer-events-none z-20"
                style={{ left: `${sliderValue}%`, transform: "translateX(-50%)" }}
              >
                <span className={animating ? "" : "animate-pulse"}>☝️</span>
              </div>
            </div>

            {/* Labels under bar */}
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
export default SlideOnePercentReferendumVote;
