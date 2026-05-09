"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { INVENTORY_ITEMS } from "@/lib/demo/parameters";
import { US_WISHOCRATIC_ITEMS } from "@optimitron/data/datasets/us-wishocratic-items";
import { useEffect, useState } from "react";

// Pairs to cycle through — shows the pairwise comparison process
const PAIRS = [
  {
    a: US_WISHOCRATIC_ITEMS.PRAGMATIC_CLINICAL_TRIALS,
    b: US_WISHOCRATIC_ITEMS.MILITARY_OPERATIONS,
    allocationA: 76,
  },
  {
    a: US_WISHOCRATIC_ITEMS.EARLY_CHILDHOOD_EDUCATION,
    b: US_WISHOCRATIC_ITEMS.DRUG_WAR,
    allocationA: 78,
  },
  {
    a: US_WISHOCRATIC_ITEMS.UNIVERSAL_BASIC_INCOME,
    b: US_WISHOCRATIC_ITEMS.CORPORATE_WELFARE,
    allocationA: 74,
  },
];

export function SlidePairwiseBudgetAllocation() {
  const addInventoryItem = (_item: any) => {};
  const [phase, setPhase] = useState(0);
  const [activePair, setActivePair] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);
  const [animatingSlider, setAnimatingSlider] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: title
    timers.push(setTimeout(() => setPhase(1), 500));
    // Phase 2: first pair appears
    timers.push(setTimeout(() => {
      setPhase(2);
      setAnimatingSlider(true);
    }, 1500));
    // Phase 3: second pair
    timers.push(setTimeout(() => {
      setActivePair(1);
      setSliderValue(50);
      setAnimatingSlider(true);
    }, 4500));
    // Phase 4: third pair
    timers.push(setTimeout(() => {
      setActivePair(2);
      setSliderValue(50);
      setAnimatingSlider(true);
    }, 7500));
    // Phase 5: completion
    timers.push(setTimeout(() => {
      setPhase(5);
      addInventoryItem(INVENTORY_ITEMS[1]);
    }, 10500));

    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  // Animate slider to target allocation
  useEffect(() => {
    if (!animatingSlider) return;
    const target = PAIRS[activePair].allocationA;
    const interval = setInterval(() => {
      setSliderValue((prev) => {
        const diff = target - prev;
        if (Math.abs(diff) < 1) {
          clearInterval(interval);
          setAnimatingSlider(false);
          return target;
        }
        return prev + diff * 0.06;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [animatingSlider, activePair]);

  const pair = PAIRS[activePair];
  const allocationA = Math.round(sliderValue);
  const allocationB = 100 - allocationA;

  return (
    <SierraSlideWrapper act={2} className="text-emerald-400">
      {/* Level header */}
      <div className="text-center mb-4">
        <div className="font-pixel text-lg md:text-xl text-muted-foreground mb-1">
          DECENTRALIZED APPROPRIATIONS COMMITTEE
        </div>
        <h1 className="font-pixel text-2xl md:text-4xl text-background">
          MAKE YOUR WISHOCRATIC ALLOCATION
        </h1>
        <div className="font-terminal text-xl md:text-2xl text-sierra-fg mt-2">
          Compare two priorities. Drag to split funding. Repeat.
        </div>
      </div>

      <div className="w-full max-w-[1700px] mx-auto space-y-5">
        {/* Pairwise comparison slider */}
        {phase >= 2 && (
          <div className="bg-muted border-2 border-background rounded-lg p-6 animate-fade-in">
            {/* Pair counter */}
            <div className="font-pixel text-lg md:text-xl text-sierra-fg text-center mb-4">
              COMPARISON {activePair + 1} OF {PAIRS.length}
            </div>

            {/* Two items with percentages */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 text-center">
                <div className="text-4xl md:text-6xl mb-2">{pair.a.icon}</div>
                <div className="font-pixel text-3xl md:text-5xl text-sierra-green">
                  {allocationA}%
                </div>
                <div className="font-pixel text-lg md:text-2xl text-sierra-fg mt-1 px-2">
                  {pair.a.name}
                </div>
              </div>

              <div className="font-pixel text-2xl md:text-3xl text-sierra-fg px-2">vs</div>

              <div className="flex-1 text-center">
                <div className="text-4xl md:text-6xl mb-2">{pair.b.icon}</div>
                <div className="font-pixel text-3xl md:text-5xl text-sierra-red">
                  {allocationB}%
                </div>
                <div className="font-pixel text-lg md:text-2xl text-sierra-fg mt-1 px-2">
                  {pair.b.name}
                </div>
              </div>
            </div>

            {/* Visual slider bar */}
            <div className="relative mb-10">
              <div className="relative h-10 rounded overflow-hidden border-2 border-primary">
                <div
                  className="absolute inset-y-0 left-0 bg-background transition-all duration-100"
                  style={{ width: `${allocationA}%` }}
                />
                <div
                  className="absolute inset-y-0 right-0 bg-brutal-red transition-all duration-100"
                  style={{ width: `${allocationB}%` }}
                />
                <div
                  className="absolute inset-y-0 w-1 bg-foreground transition-all duration-100"
                  style={{ left: `${allocationA}%`, transform: "translateX(-50%)" }}
                />
              </div>
              {/* Finger below the bar */}
              <div
                className="absolute top-full mt-1 text-4xl pointer-events-none z-20 transition-all duration-100"
                style={{ left: `${allocationA}%`, transform: "translateX(-50%)" }}
              >
                <span className={animatingSlider ? "" : "animate-pulse"}>☝️</span>
              </div>
            </div>
          </div>
        )}

        {/* Progress dots */}
        {phase >= 2 && (
          <div className="flex justify-center gap-3">
            {PAIRS.map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  i <= activePair
                    ? "bg-emerald-400 border-emerald-400"
                    : "bg-transparent border-zinc-600"
                }`}
              />
            ))}
          </div>
        )}

        {/* Completion */}
        {phase >= 5 && (
          <div className="text-center space-y-3 animate-fade-in">
            <div className="font-pixel text-3xl md:text-4xl text-cyan-400">
              ALLOCATION COMPLETE
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
    </SierraSlideWrapper>
  );
}
export default SlidePairwiseBudgetAllocation;
