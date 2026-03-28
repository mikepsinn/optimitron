"use client";

import { SlideBase } from "../slide-base";
import { useDemoStore } from "@/lib/demo/store";
import { INVENTORY_ITEMS } from "@/lib/demo/parameters";
import { MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO } from "@optimitron/data/parameters";
import { useEffect, useState } from "react";

const militaryRatio = MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value;
const militaryPct = Math.round((militaryRatio / (militaryRatio + 1)) * 100);

export function SlideOnePercentReferendumVote() {
  const addInventoryItem = useDemoStore((s) => s.addInventoryItem);
  const [phase, setPhase] = useState(0);
  const [sliderValue, setSliderValue] = useState(militaryPct); // starts at current reality
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
  }, [addInventoryItem]);

  // Animate the slider movement
  useEffect(() => {
    if (!animating) return;
    const target = 50;
    const interval = setInterval(() => {
      setSliderValue((prev) => {
        if (Math.abs(prev - target) < 1) {
          clearInterval(interval);
          setAnimating(false);
          return target;
        }
        return prev + (target - prev) * 0.08;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [animating]);

  const clinicalPct = 100 - Math.round(sliderValue);
  const militaryDisplay = Math.round(sliderValue);

  return (
    <SlideBase act={2} className="text-cyan-400">
      {/* Level header */}
      <div className="text-center mb-4">
        <div className="font-pixel text-xl text-cyan-400 mb-1">LEVEL 2</div>
        <h1 className="font-pixel text-2xl md:text-4xl text-cyan-400">
          VOTE ON THE ALLOCATION
        </h1>
        <div className="font-terminal text-xl md:text-2xl text-zinc-200 mt-2">
          How should humanity split its budget?
        </div>
      </div>

      <div className="w-full max-w-[1700px] mx-auto space-y-6">
        {/* Current reality callout */}
        {phase >= 1 && (
          <div className="text-center animate-fade-in">
            <div className="font-pixel text-xl md:text-2xl text-red-400">
              CURRENT REALITY: ${Math.round(militaryRatio)} on military for every $1 on clinical trials
            </div>
          </div>
        )}

        {/* Slider allocation */}
        {phase >= 2 && (
          <div className="bg-black/40 border-2 border-cyan-500/30 rounded-lg p-6 animate-fade-in">
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

            {/* Visual bar */}
            <div className="relative h-10 rounded overflow-hidden border-2 border-zinc-700">
              <div
                className="absolute inset-y-0 left-0 bg-red-500/60 transition-all duration-100"
                style={{ width: `${militaryDisplay}%` }}
              />
              <div
                className="absolute inset-y-0 right-0 bg-emerald-500/60 transition-all duration-100"
                style={{ width: `${clinicalPct}%` }}
              />
              {/* Center divider */}
              <div
                className="absolute inset-y-0 w-1 bg-white/80 transition-all duration-100"
                style={{ left: `${militaryDisplay}%`, transform: "translateX(-50%)" }}
              />
            </div>

            {/* Labels under bar */}
            <div className="flex justify-between mt-2">
              <span className="font-pixel text-lg text-red-400">💣 EXPLOSIONS</span>
              <span className="font-pixel text-lg text-emerald-400">🧪 CURES</span>
            </div>
          </div>
        )}

        {/* The question */}
        {phase >= 3 && (
          <div className="animate-fade-in">
            <div className="bg-black/40 border-2 border-emerald-500/30 rounded-lg p-5">
              <div className="font-pixel text-2xl md:text-3xl text-emerald-400 text-center mb-4">
                THE REFERENDUM
              </div>

              <div className="space-y-3">
                <div className="p-3 border-2 border-emerald-500 bg-emerald-500/10 rounded flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-emerald-500 rounded flex items-center justify-center">
                    <div className="w-4 h-4 bg-emerald-500 rounded-sm" />
                  </div>
                  <div className="font-pixel text-xl md:text-2xl text-emerald-400">
                    YES — Redirect 1% from military to clinical trials
                  </div>
                </div>

                <div className="p-3 border border-zinc-700 rounded flex items-center gap-3 opacity-40">
                  <div className="w-6 h-6 border-2 border-zinc-600 rounded" />
                  <div className="font-pixel text-xl md:text-2xl text-zinc-200">
                    NO — Keep manufacturing orphans
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom punchline */}
        {phase >= 3 && (
          <div className="text-center animate-fade-in">
            <div className="font-terminal text-xl md:text-2xl text-zinc-200">
              30 seconds. One slider. One vote.
            </div>
            <div className="font-pixel text-xl md:text-2xl text-emerald-400 mt-1">
              That is the entire ask.
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
