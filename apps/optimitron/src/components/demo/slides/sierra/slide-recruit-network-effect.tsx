"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { INVENTORY_ITEMS } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

// Doubling stages: 1 → 2 → 4 → 8 → 16 → 32 → 64 → 128
const DOUBLING_STAGES = [1, 2, 4, 8, 16, 32, 64, 128];

// Pre-generate face positions in a growing cluster
function generateFacePositions(count: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  // Center node
  positions.push({ x: 50, y: 50 });

  // Spiral outward from center
  for (let i = 1; i < count; i++) {
    const angle = i * 2.4; // golden angle spread
    const radius = 4 * Math.sqrt(i);
    positions.push({
      x: Math.max(3, Math.min(97, 50 + Math.cos(angle) * radius)),
      y: Math.max(5, Math.min(95, 50 + Math.sin(angle) * radius)),
    });
  }
  return positions;
}

const ALL_POSITIONS = generateFacePositions(128);

export function SlideRecruitNetworkEffect() {
  const addInventoryItem = (_item: any) => {};
  const [stage, setStage] = useState(0); // index into DOUBLING_STAGES
  const [showPunchline, setShowPunchline] = useState(false);

  const visibleCount = DOUBLING_STAGES[Math.min(stage, DOUBLING_STAGES.length - 1)];

  useEffect(() => {
    // Doubling every 700ms
    const interval = setInterval(() => {
      setStage((prev) => {
        if (prev >= DOUBLING_STAGES.length - 1) {
          clearInterval(interval);
          return DOUBLING_STAGES.length - 1;
        }
        return prev + 1;
      });
    }, 700);

    // Show punchline after all stages
    setTimeout(() => setShowPunchline(true), DOUBLING_STAGES.length * 700 + 500);

    // Add inventory item
    setTimeout(() => {
      addInventoryItem(INVENTORY_ITEMS[3]);
    }, 3000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  return (
    <SierraSlideWrapper act={2} className="text-purple-400">
      {/* Level header */}
      <div className="text-center mb-4">
        <div className="font-pixel text-xl text-purple-400 mb-1">LEVEL 3</div>
        <h1 className="font-pixel text-2xl md:text-4xl text-purple-400">
          GET ALL YOUR FRIENDS TO PLAY
        </h1>
        <div className="font-terminal text-2xl md:text-4xl text-zinc-200 mt-2">
          Prove everyone wants to be rich and healthy. Then demanding it isn&apos;t crazy.
        </div>
      </div>

      <div className="w-full max-w-[1700px] mx-auto space-y-4 overflow-hidden">
        {/* Network visualization with emoji faces */}
        <div className="relative w-full aspect-video bg-black/40 border border-purple-500/30 rounded overflow-hidden">
          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {ALL_POSITIONS.slice(1, visibleCount).map((pos, i) => {
              // Connect to a "parent" — roughly i/3 for tree-like structure
              const parentIdx = Math.max(0, Math.floor((i + 1) / 3));
              const parent = ALL_POSITIONS[parentIdx];
              return (
                <line
                  key={i}
                  x1={`${parent.x}%`}
                  y1={`${parent.y}%`}
                  x2={`${pos.x}%`}
                  y2={`${pos.y}%`}
                  stroke="rgba(168, 85, 247, 0.25)"
                  strokeWidth="1"
                />
              );
            })}
          </svg>

          {/* Emoji face nodes */}
          {ALL_POSITIONS.slice(0, visibleCount).map((pos, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <span className={i === 0 ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"}>
                😊
              </span>
            </div>
          ))}

          {/* "YOU" label on center */}
          <div
            className="absolute font-pixel text-xl md:text-2xl text-purple-400"
            style={{ left: "50%", top: "50%", transform: "translate(-50%, -180%)" }}
          >
            YOU
          </div>

          {/* Stats overlay */}
          <div className="absolute top-3 left-3 font-pixel text-xl md:text-3xl">
            <div className="text-purple-400">
              NETWORK: {visibleCount} 😊
            </div>
            <div className="text-purple-400">
              CYCLE: ×{visibleCount}
            </div>
          </div>
        </div>

        {/* Doubling chain */}
        <div className="bg-black/30 border border-purple-500/30 p-4 rounded text-center">
          <div className="font-pixel text-xl md:text-2xl text-zinc-200 mb-3">EXPONENTIAL SPREAD</div>
          <div className="flex items-center justify-center gap-1 md:gap-2 flex-wrap">
            {DOUBLING_STAGES.map((count, i) => (
              <span key={count} className="flex items-center gap-1 md:gap-2">
                <span
                  className={`font-pixel text-2xl md:text-3xl transition-all duration-300 ${
                    i <= stage ? "text-purple-400" : "text-zinc-700"
                  }`}
                >
                  {count}😊
                </span>
                {i < DOUBLING_STAGES.length - 1 && (
                  <span
                    className={`font-pixel text-2xl md:text-3xl ${
                      i < stage ? "text-purple-500" : "text-zinc-800"
                    }`}
                  >
                    →
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Pluralistic ignorance punchline */}
        {showPunchline && (
          <div className="text-center space-y-3 animate-fade-in">
            <div className="font-pixel text-2xl md:text-3xl text-amber-400">
              PLURALISTIC IGNORANCE BROKEN
            </div>
            <div className="font-terminal text-xl md:text-3xl text-zinc-200 max-w-5xl mx-auto leading-relaxed">
              Once you prove 8 billion people all want to be rich and healthy,
              demanding your government optimize for it stops sounding crazy.
              It starts sounding obvious.
            </div>
            <div className="font-pixel text-2xl md:text-4xl text-emerald-400 mt-2">
              CONSENSUS UNLOCKED: 🧪 CURES &gt; 💣 ORPHANS
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </SierraSlideWrapper>
  );
}
export default SlideRecruitNetworkEffect;
