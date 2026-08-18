"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { useEffect, useState } from "react";
import { buildDrugPolicyEmojiPositions } from "@/lib/demo/deterministic";

// Floating emojis: syringes appear then turn into skulls (USA), or skulls disappear (Portugal)
const EMOJI_COUNT = 30;
const emojiPositions = buildDrugPolicyEmojiPositions(EMOJI_COUNT);

export function SlideDrugPolicyNaturalExperiment() {
  const [emojisVisible, setEmojisVisible] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setEmojisVisible((prev) => {
        if (prev >= EMOJI_COUNT) {
          clearInterval(interval);
          return EMOJI_COUNT;
        }
        return prev + 1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <SierraSlideWrapper act={2} className="text-cyan-400">
      {/* Floating syringes/skulls around edges */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {emojiPositions.slice(0, emojisVisible).map((pos, i) => {
          // Left half: skulls fading out (Portugal effect)
          // Right half: syringes turning to skulls (USA effect)
          const isLeft = pos.xPct < 50;
          return (
            <span
              key={i}
              className="absolute text-xl md:text-2xl"
              style={{
                left: `${pos.xPct}%`,
                top: `${pos.yPct}%`,
                transform: "translate(-50%, -50%)",
                opacity: isLeft ? 0.15 + (i % 3) * 0.1 : 0.3 + (i % 3) * 0.1,
                animation: isLeft
                  ? `fadeOut ${2 + (i % 3)}s ease-out ${pos.delayMs}ms forwards`
                  : undefined,
              }}
            >
              {isLeft ? "💀" : i % 2 === 0 ? "💉" : "💀"}
            </span>
          );
        })}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-4 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-2xl md:text-4xl text-cyan-400 text-center">
          THE OPTIMIZER
        </h1>
        <div className="font-terminal text-xl md:text-2xl text-zinc-200 text-center">
          Policies and Budgets
        </div>

        {/* Two machines side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          {/* LEFT: Policy Generator */}
          <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg p-4 space-y-3">
            <div className="font-pixel text-xl md:text-2xl text-cyan-400 text-center border-b border-cyan-500/20 pb-2">
              POLICY GENERATOR
            </div>
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2 font-pixel text-xl text-zinc-300">
              <div></div>
              <div className="text-center">POLICY</div>
              <div className="text-center">OVERDOSE DEATHS</div>
            </div>
            <div className="space-y-2">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3">
                <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2 items-center">
                  <span className="font-pixel text-xl md:text-2xl text-zinc-300">Portugal</span>
                  <span className="font-terminal text-xl md:text-2xl text-emerald-400 text-center">Decriminalization</span>
                  <span className="font-pixel text-2xl md:text-3xl text-emerald-400 text-center">-80%</span>
                </div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2 items-center">
                  <span className="font-pixel text-xl md:text-2xl text-zinc-300">USA</span>
                  <span className="font-terminal text-xl md:text-2xl text-red-400 text-center">$50B/yr Drug War</span>
                  <span className="font-pixel text-2xl md:text-3xl text-red-400 text-center">+1,700%</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Budget Optimizer */}
          <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg p-4 space-y-3">
            <div className="font-pixel text-xl md:text-2xl text-cyan-400 text-center border-b border-cyan-500/20 pb-2">
              BUDGET OPTIMIZER
            </div>

            {/* Header row */}
            <div className="grid grid-cols-3 gap-2 font-pixel text-xl md:text-2xl text-zinc-200">
              <div></div>
              <div className="text-center text-red-400">USA CURRENT</div>
              <div className="text-center text-emerald-400">USA OPTIMIZED</div>
            </div>

            {/* Healthcare */}
            <div className="grid grid-cols-3 gap-2 items-center bg-black/30 rounded p-2">
              <div className="font-pixel text-xl md:text-2xl text-zinc-200">Healthcare</div>
              <div className="text-center">
                <div className="font-pixel text-xl md:text-2xl text-red-400">$4.5T</div>
                <div className="font-terminal text-lg md:text-xl text-zinc-300">ranked 37th</div>
              </div>
              <div className="text-center">
                <div className="font-pixel text-xl md:text-2xl text-emerald-400">$1.1T</div>
                <div className="font-terminal text-lg md:text-xl text-emerald-400">ranked 1st</div>
              </div>
            </div>

            {/* Defense */}
            <div className="grid grid-cols-3 gap-2 items-center bg-black/30 rounded p-2">
              <div className="font-pixel text-xl md:text-2xl text-zinc-200">Military</div>
              <div className="text-center">
                <div className="font-pixel text-xl md:text-2xl text-red-400">$886B</div>
              </div>
              <div className="text-center">
                <div className="font-pixel text-xl md:text-2xl text-emerald-400">$200B</div>
              </div>
            </div>

            {/* Education */}
            <div className="grid grid-cols-3 gap-2 items-center bg-black/30 rounded p-2">
              <div className="font-pixel text-xl md:text-2xl text-zinc-200">Education</div>
              <div className="text-center">
                <div className="font-pixel text-xl md:text-2xl text-red-400">$800B</div>
                <div className="font-terminal text-lg md:text-xl text-zinc-300">declining</div>
              </div>
              <div className="text-center">
                <div className="font-pixel text-xl md:text-2xl text-emerald-400">$600B</div>
                <div className="font-terminal text-lg md:text-xl text-emerald-400">+40%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <p className="font-pixel text-2xl md:text-3xl text-zinc-200 text-center italic">
          Less money, better outcomes. On every line item.
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeOut {
          0% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          70% { opacity: 0.2; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
        }
      `}</style>
    </SierraSlideWrapper>
  );
}
export default SlideDrugPolicyNaturalExperiment;
