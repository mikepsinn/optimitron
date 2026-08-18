"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { GlitchText } from "../../animations/sierra/glitch-text";
import { useEffect, useState } from "react";

// Sharper exponential curve — singularity style
const COLS = 30;
const MAX_COL_HEIGHT = 18;
const ROBOT_SIZE = 30; // px per robot cell

// Steep exponential: almost nothing on the left, explosion on the right
const columnHeights = Array.from({ length: COLS }, (_, i) => {
  const t = i / (COLS - 1);
  return Math.max(0, Math.round(MAX_COL_HEIGHT * Math.pow(t, 4)));
});
const TOTAL_ROBOTS = columnHeights.reduce((a, b) => a + b, 0);

// Build ordered positions: left-to-right, bottom-to-top
const robotPositions: { col: number; row: number }[] = [];
for (let col = 0; col < COLS; col++) {
  for (let row = 0; row < columnHeights[col]; row++) {
    robotPositions.push({ col, row });
  }
}

const TARGETS = [
  { emoji: "🏦", label: "BANKS" },
  { emoji: "🏥", label: "HOSPITALS" },
  { emoji: "⚡", label: "POWER GRIDS" },
  { emoji: "🚀", label: "WEAPONS" },
  { emoji: "🏛️", label: "GOVERNMENTS" },
  { emoji: "📱", label: "YOUR PHONE" },
];

export function SlideAiHackerSpiral() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [phase, setPhase] = useState(0);
  const [visibleTargets, setVisibleTargets] = useState(0);
  const displayCount = Math.min(visibleCount, TOTAL_ROBOTS);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: title
    timers.push(setTimeout(() => setPhase(1), 500));

    // Robots fill in rapidly
    const robotInterval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= TOTAL_ROBOTS) {
          clearInterval(robotInterval);
          return TOTAL_ROBOTS;
        }
        return prev + 3;
      });
    }, 20);

    // Phase 2: targets appear
    timers.push(setTimeout(() => setPhase(2), 3000));
    TARGETS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleTargets(i + 1), 3500 + i * 400));
    });

    // Phase 3: recursive loop
    timers.push(setTimeout(() => setPhase(3), 6000));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(robotInterval);
    };
  }, []);

  return (
    <SierraSlideWrapper act={1} className="text-purple-500">
      {/* Title */}
      <div className="text-center mb-4">
        <GlitchText
          text="AI HACKERS ARE COMING"
          className="font-pixel text-3xl md:text-5xl text-purple-400"
          intensity="medium"
        />
      </div>

      {/* Robot singularity visualization — steep exponential curve */}
      <div className="relative w-full max-w-[1700px] aspect-[2.2/1] bg-black/50 border border-purple-500/30 rounded-lg overflow-hidden">
        {/* Chart title */}
        <div className="absolute top-3 left-4 z-10 font-pixel text-xl text-purple-400/80 tracking-wider">
          AUTONOMOUS HACKER GESTATION PERIOD
        </div>
        {/* Exponential curve of robots */}
        <div className="absolute inset-0">
          {robotPositions.slice(0, displayCount).map((pos, i) => (
            <span
              key={i}
              className="absolute text-xl"
              style={{
                left: `${(pos.col / COLS) * 100}%`,
                bottom: pos.row * ROBOT_SIZE,
                width: `${100 / COLS}%`,
                textAlign: "center",
                opacity: 0.5 + (pos.row / MAX_COL_HEIGHT) * 0.5,
              }}
            >
              🤖
            </span>
          ))}
        </div>

        {/* Glitch overlay at peak */}
        {visibleCount > TOTAL_ROBOTS * 0.5 && (
          <div className="absolute inset-0 bg-purple-500/10 animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Target list — what they hack */}
      {phase >= 2 && (
        <div className="mt-4 text-center">
          <div className="font-pixel text-xl text-purple-200 mb-3">
            AI HACKERS EXPLOIT EVERY VULNERABILITY
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {TARGETS.slice(0, visibleTargets).map((target, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 bg-red-500/15 border border-red-500/40 px-4 py-2 rounded animate-target-in"
              >
                <span className="text-2xl">{target.emoji}</span>
                <span className="font-pixel text-xl text-red-400">{target.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recursive loop */}
      {phase >= 3 && (
        <div className="mt-4 text-center animate-target-in">
          <div className="inline-block border border-purple-500/40 bg-black/60 px-6 py-4 rounded">
            <div className="flex items-center justify-center gap-2 flex-wrap font-pixel text-xl">
              <span className="text-red-400">STEAL $$$</span>
              <span className="text-purple-400">&rarr;</span>
              <span className="text-amber-400">BUY COMPUTE</span>
              <span className="text-purple-400">&rarr;</span>
              <span className="text-purple-300">TRAIN MORE HACKERS</span>
              <span className="text-purple-400">&rarr; (loop)</span>
            </div>
            <div className="text-2xl text-red-500 mt-3 animate-pulse font-pixel">
              RECURSIVE EXPONENTIAL THEFT
            </div>
          </div>
        </div>
      )}

      {/* spawn(self) decoration */}
      <div className="absolute top-4 left-4 opacity-20">
        <div className="font-pixel text-xl text-purple-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ paddingLeft: i * 8 }}>
              {">"} spawn(self)
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes target-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-target-in {
          animation: target-in 0.3s ease-out forwards;
        }
      `}</style>
    </SierraSlideWrapper>
  );
}
export default SlideAiHackerSpiral;
