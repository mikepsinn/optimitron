"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { useEffect, useState } from "react";

const RANKINGS = [
  { name: "PM NAKAMURA", oldRank: 1, newRank: 4, score: "87%" },
  { name: "PRES. OKONKWO", oldRank: 2, newRank: 1, score: "96%" },
  { name: "MIN. CHEN", oldRank: 3, newRank: 2, score: "93%" },
  { name: "GOV. SANTOS", oldRank: 4, newRank: 3, score: "91%" },
  { name: "SEN. WILLIAMS", oldRank: 5, newRank: 6, score: "62%" },
  { name: "PM JOHANSSON", oldRank: 6, newRank: 5, score: "78%" },
];

export function SlideGovernmentTrackRecord() {
  const [phase, setPhase] = useState<"old" | "crossing" | "new">("old");
  const [showNewHeader, setShowNewHeader] = useState(false);
  const [newHeaderText, setNewHeaderText] = useState("");
  const [shuffled, setShuffled] = useState(false);

  const fullNewHeader = "CITIZEN ALIGNMENT SCORE";

  useEffect(() => {
    // Phase 1: Show old header, then cross it out
    const crossTimer = setTimeout(() => {
      setPhase("crossing");
    }, 1500);

    // Phase 2: Start typewriter for new header
    const typeTimer = setTimeout(() => {
      setPhase("new");
      setShowNewHeader(true);
    }, 2500);

    // Shuffle rankings after new header typed
    const shuffleTimer = setTimeout(() => {
      setShuffled(true);
    }, 4500);

    return () => {
      clearTimeout(crossTimer);
      clearTimeout(typeTimer);
      clearTimeout(shuffleTimer);
    };
  }, []);

  // Typewriter effect for new header
  useEffect(() => {
    if (!showNewHeader) return;

    let charIndex = 0;
    const interval = setInterval(() => {
      charIndex++;
      setNewHeaderText(fullNewHeader.slice(0, charIndex));
      if (charIndex >= fullNewHeader.length) {
        clearInterval(interval);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [showNewHeader]);

  const sortedRankings = shuffled
    ? [...RANKINGS].sort((a, b) => a.newRank - b.newRank)
    : [...RANKINGS].sort((a, b) => a.oldRank - b.oldRank);

  return (
    <SierraSlideWrapper act={2} className="text-cyan-400">
      <div className="flex flex-col items-center justify-center gap-8 max-w-[1700px] mx-auto">
        {/* Header Area */}
        <div className="text-center space-y-3 min-h-[80px] flex flex-col items-center justify-center">
          {/* Old Header */}
          <div className="relative inline-block">
            <h1
              className={`font-pixel text-2xl md:text-4xl text-zinc-200 ${
                phase !== "old" ? "opacity-50" : ""
              }`}
            >
              RE-ELECTION PROBABILITY
            </h1>
            {/* Red X strikethrough */}
            {phase !== "old" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500 rotate-[-3deg]" />
                <div className="absolute text-3xl text-red-500 font-bold">
                  ✕
                </div>
              </div>
            )}
          </div>

          {/* New Header - Typewriter */}
          {showNewHeader && (
            <h1 className="font-pixel text-2xl md:text-4xl text-cyan-400">
              {newHeaderText}
              <span className="animate-pulse">▊</span>
            </h1>
          )}
        </div>

        {/* Rankings */}
        <div className="w-full space-y-2">
          {sortedRankings.map((entry) => {
            const rank = shuffled ? entry.newRank : entry.oldRank;
            const isRising = entry.newRank < entry.oldRank;
            const isFalling = entry.newRank > entry.oldRank;

            return (
              <div
                key={entry.name}
                className={`flex items-center justify-between px-4 py-2 bg-zinc-900/60 border rounded transition-all duration-700 ${
                  shuffled && isRising
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : shuffled && isFalling
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-pixel text-xl text-zinc-200 w-6 text-right">
                    #{rank}
                  </span>
                  <span className="font-pixel text-xl text-zinc-300">
                    {entry.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {shuffled && (
                    <span
                      className={`font-pixel text-xl ${
                        isRising ? "text-emerald-400" : isFalling ? "text-red-400" : "text-zinc-200"
                      }`}
                    >
                      {entry.score}
                    </span>
                  )}
                  {shuffled && isRising && (
                    <span className="text-emerald-400 text-xl">▲</span>
                  )}
                  {shuffled && isFalling && (
                    <span className="text-red-400 text-xl">▼</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideGovernmentTrackRecord;
