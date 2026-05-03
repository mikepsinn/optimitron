"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { useEffect, useState } from "react";

const ACTIONS = [
  { emoji: "✊", action: "Recruit voters", result: "→ Hypercert", color: "text-brutal-cyan" },
  { emoji: "💰", action: "Deposit to fund", result: "→ Hypercert", color: "text-brutal-yellow" },
  { emoji: "⚖️", action: "Allocate budget", result: "→ Hypercert", color: "text-brutal-pink" },
];

export function SlideImpactCertificates() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3500),
      setTimeout(() => setPhase(5), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SierraSlideWrapper act={2} className="text-purple-400">
      <div className="flex flex-col items-center justify-center gap-8 max-w-[1200px] mx-auto w-full">
        {/* Title */}
        <h1
          className="font-pixel text-3xl md:text-5xl text-purple-400 text-center transition-opacity duration-500"
          style={{ opacity: phase >= 1 ? 1 : 0 }}
        >
          🏆 HYPERCERTS
        </h1>

        <div
          className="font-terminal text-2xl md:text-3xl text-zinc-200 text-center transition-opacity duration-500"
          style={{ opacity: phase >= 2 ? 1 : 0 }}
        >
          Every action leaves on-chain proof
        </div>

        {/* Three actions */}
        <div className="w-full space-y-4">
          {ACTIONS.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 transition-opacity duration-500"
              style={{ opacity: phase >= i + 3 ? 1 : 0 }}
            >
              <span className="text-4xl">{item.emoji}</span>
              <span className="font-pixel text-xl md:text-2xl text-zinc-200 flex-1">{item.action}</span>
              <span className={`font-pixel text-xl md:text-2xl ${item.color}`}>{item.result}</span>
            </div>
          ))}
        </div>

        {/* Bottom line */}
        <div
          className="flex justify-center gap-8 font-pixel text-lg text-zinc-400 transition-opacity duration-500"
          style={{ opacity: phase >= 5 ? 1 : 0 }}
        >
          <span>Verified via World ID</span>
          <span>·</span>
          <span>Published to Bluesky</span>
          <span>·</span>
          <span>Permanent</span>
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideImpactCertificates;
