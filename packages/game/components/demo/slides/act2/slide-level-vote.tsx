"use client";

import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { ProgressRing } from "../../animations/progress-ring";
import { useDemoStore } from "@/lib/demo/store";
import { GAME_PARAMS, INVENTORY_ITEMS } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

export function SlideLevelVote() {
  const addInventoryItem = useDemoStore((s) => s.addInventoryItem);
  const [voteCount, setVoteCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCost, setShowCost] = useState(false);

  const targetVotes = 1000000;

  useEffect(() => {
    // Animate votes coming in
    const interval = setInterval(() => {
      setVoteCount((prev) => {
        const increment = Math.floor(Math.random() * 5000) + 1000;
        const next = Math.min(prev + increment, targetVotes);
        setProgress(next / targetVotes);
        return next;
      });
    }, 100);

    // Show cost comparison
    setTimeout(() => setShowCost(true), 2000);

    // Add inventory item
    setTimeout(() => {
      addInventoryItem(INVENTORY_ITEMS[2]); // slot 3: VOTE
    }, 3000);

    return () => clearInterval(interval);
  }, [addInventoryItem]);

  return (
    <SlideBase act={2} className="text-cyan-400">
      {/* Level header */}
      <div className="text-center mb-6">
        <div className="font-pixel text-xl text-cyan-400 mb-1">LEVEL 2</div>
        <h1 className="font-pixel text-3xl md:text-4xl text-cyan-400">
          VOTE
        </h1>
        <div className="font-terminal text-xl text-zinc-200 mt-2">
          Support the 1% Treaty referendum
        </div>
      </div>

      <div className="w-full max-w-[1700px] mx-auto space-y-8">
        {/* Vote counter with progress ring */}
        <div className="flex flex-col items-center gap-4">
          <ProgressRing
            progress={progress}
            size={180}
            strokeWidth={12}
            color="#22d3ee"
            animate={false}
          >
            <div className="text-center">
              <div className="font-pixel text-2xl md:text-3xl text-cyan-400">
                <AnimatedCounter
                  end={voteCount}
                  duration={100}
                  format="compact"
                />
              </div>
              <div className="font-pixel text-xl text-zinc-200">VOTES</div>
            </div>
          </ProgressRing>

          <div className="font-pixel text-xl text-zinc-200">
            Target: {(targetVotes / 1000000).toFixed(1)}M signatures
          </div>
        </div>

        {/* Cost comparison */}
        {showCost && (
          <div className="animate-fade-in">
            <div className="text-center mb-4">
              <div className="font-pixel text-xl text-emerald-400">
                COST TO PARTICIPATE
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 md:gap-8">
              {/* Coffee */}
              <div className="text-center">
                <div className="text-4xl mb-2">☕</div>
                <div className="font-pixel text-xl text-amber-400">
                  ${GAME_PARAMS.costPerVote.toFixed(2)}
                </div>
                <div className="font-pixel text-xl text-zinc-200">per vote</div>
              </div>

              {/* Equals */}
              <div className="font-pixel text-2xl text-zinc-300">=</div>

              {/* Impact */}
              <div className="text-center">
                <div className="text-4xl mb-2">💊</div>
                <div className="font-pixel text-xl text-emerald-400">
                  1 life
                </div>
                <div className="font-pixel text-xl text-zinc-200">potentially saved</div>
              </div>
            </div>

            <div className="text-center mt-4 font-terminal text-xl text-zinc-200">
              The most cost-effective intervention ever discovered
            </div>
          </div>
        )}

        {/* Ballot visualization */}
        <div className="bg-black/40 border-2 border-cyan-500/30 p-4 rounded">
          <div className="font-pixel text-xl text-cyan-400 mb-3">REFERENDUM BALLOT</div>
          
          <div className="space-y-3">
            <div className="p-3 border border-emerald-500 bg-emerald-500/10 rounded flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-emerald-500 rounded flex items-center justify-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
              </div>
              <div className="font-pixel text-xl text-emerald-400">
                YES - Redirect 1% to clinical trials
              </div>
            </div>
            
            <div className="p-3 border border-zinc-700 rounded flex items-center gap-3 opacity-50">
              <div className="w-5 h-5 border-2 border-zinc-600 rounded" />
              <div className="font-pixel text-xl text-zinc-200">
                NO - Maintain current allocation
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-black/30 border border-zinc-800 p-3 rounded">
            <div className="font-pixel text-xl text-cyan-400">78%</div>
            <div className="font-pixel text-xl text-zinc-200">Support rate</div>
          </div>
          <div className="bg-black/30 border border-zinc-800 p-3 rounded">
            <div className="font-pixel text-xl text-emerald-400">147</div>
            <div className="font-pixel text-xl text-zinc-200">Countries</div>
          </div>
          <div className="bg-black/30 border border-zinc-800 p-3 rounded">
            <div className="font-pixel text-xl text-amber-400">$24B</div>
            <div className="font-pixel text-xl text-zinc-200">At stake</div>
          </div>
        </div>
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
