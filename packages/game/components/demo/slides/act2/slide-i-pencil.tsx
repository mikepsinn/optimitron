"use client";

import { SlideBase } from "../slide-base";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";
import { useEffect, useState } from "react";

// Pre-generate brain positions scattered around edges (avoiding center content)
const BRAIN_COUNT = 50;
const brainPositions = Array.from({ length: BRAIN_COUNT }, (_, i) => {
  // Distribute around edges: top strip, bottom strip, left strip, right strip
  const zone = i % 4;
  switch (zone) {
    case 0: // top
      return { x: Math.random() * 100, y: Math.random() * 18 };
    case 1: // bottom
      return { x: Math.random() * 100, y: 82 + Math.random() * 18 };
    case 2: // left
      return { x: Math.random() * 12, y: 18 + Math.random() * 64 };
    default: // right
      return { x: 88 + Math.random() * 12, y: 18 + Math.random() * 64 };
  }
});

const BRAIN_EMOJIS = ["🧠", "👤", "🧑‍🔬", "👩‍⚕️", "🧑‍💻", "👨‍🏫"];

export function SlideIPencil() {
  const [brainsVisible, setBrainsVisible] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBrainsVisible((prev) => {
        if (prev >= BRAIN_COUNT) {
          clearInterval(interval);
          return BRAIN_COUNT;
        }
        return prev + 2;
      });
    }, 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <SlideBase act={2} className="text-amber-400">
      {/* Brain emojis popping up around edges */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {brainPositions.slice(0, brainsVisible).map((pos, i) => (
          <span
            key={i}
            className="absolute text-2xl md:text-3xl animate-bounce"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -50%)",
              animationDelay: `${(i * 137) % 2000}ms`,
              animationDuration: `${2000 + (i * 97) % 1500}ms`,
              opacity: 0.5 + (i % 3) * 0.15,
            }}
          >
            {BRAIN_EMOJIS[i % BRAIN_EMOJIS.length]}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-2xl md:text-4xl text-amber-400 text-center">
          BILLIONS OF BRAINS
        </h1>

        {/* Central pencil → test tube icon */}
        <div className="flex items-center justify-center gap-4">
          <span className="text-5xl md:text-6xl">✏️</span>
          <span className="font-pixel text-3xl md:text-4xl text-amber-500">→</span>
          <span className="text-5xl md:text-6xl">🧪</span>
        </div>

        {/* Supply chain text */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
          <p className="font-terminal text-2xl md:text-4xl text-zinc-200 leading-relaxed">
            Nobody knows how to make a pencil. Millions of people each doing one
            tiny step.
          </p>
        </div>

        {/* Counter displays */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="bg-black/40 border border-amber-500/30 rounded-lg p-4 text-center">
            <div className="font-pixel text-xl md:text-2xl text-zinc-200 mb-2">
              BRAINS INCENTIVIZED
            </div>
            <div className="font-pixel text-2xl md:text-3xl text-amber-400">
              4,000,000,000
            </div>
          </div>

          <div className="bg-black/40 border border-amber-500/30 rounded-lg p-4 text-center">
            <div className="font-pixel text-xl md:text-2xl text-zinc-200 mb-2">
              VOTE POINT VALUE
            </div>
            <div className="font-pixel text-2xl md:text-3xl text-emerald-400">
              {formatCurrency(GAME_PARAMS.valuePerVotePoint)}
            </div>
          </div>

          <div className="bg-black/40 border border-amber-500/30 rounded-lg p-4 text-center">
            <div className="font-pixel text-xl md:text-2xl text-zinc-200 mb-2">
              PRIZE POOL (15yr)
            </div>
            <div className="font-pixel text-2xl md:text-3xl text-yellow-400">
              {formatCurrency(GAME_PARAMS.prizePoolAfter15yr)}
            </div>
          </div>
        </div>

        {/* Key text */}
        <p className="font-pixel text-2xl md:text-3xl text-zinc-200 text-center italic">
          You do not need a plan. You need an incentive.
        </p>
      </div>
    </SlideBase>
  );
}
