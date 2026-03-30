"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { useEffect, useState } from "react";
import {
  PRIZE_POOL_SIZE,
  VOTE_TOKEN_VALUE,
  PRIZE_POOL_HORIZON_MULTIPLE,
  GLOBAL_INVESTABLE_ASSETS,
  PRIZE_POOL_PARTICIPATION_RATE,
} from "@optimitron/data/parameters";

const depositT = Math.round((GLOBAL_INVESTABLE_ASSETS.value * PRIZE_POOL_PARTICIPATION_RATE.value) / 1e12 * 10) / 10;
const poolT = Math.round(PRIZE_POOL_SIZE.value / 1e12);
const multiple = Math.round(PRIZE_POOL_HORIZON_MULTIPLE.value);
const voteValue = `$${Math.round(VOTE_TOKEN_VALUE.value).toLocaleString()}`;

export function SlideDominantAssuranceContract() {
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
    <SierraSlideWrapper act={2} className="text-brutal-cyan">
      <div className="flex flex-col items-center justify-center gap-6 max-w-[1400px] mx-auto">
        <h1
          className="font-pixel text-2xl md:text-4xl text-brutal-cyan text-center transition-opacity duration-500"
          style={{ opacity: phase >= 1 ? 1 : 0 }}
        >
          VOTE → SHARE → EARN
        </h1>

        {/* Flow: vote → share link → earn VOTE points → value */}
        <div
          className="flex items-center justify-center gap-3 md:gap-6 transition-opacity duration-500"
          style={{ opacity: phase >= 2 ? 1 : 0 }}
        >
          <div className="text-center p-4 bg-muted border-2 border-brutal-cyan rounded">
            <div className="text-4xl mb-2">🗳️</div>
            <div className="font-pixel text-xl md:text-2xl text-brutal-cyan">VOTE</div>
            <div className="font-terminal text-sm md:text-lg text-muted-foreground">10 pairwise choices</div>
          </div>
          <div className="font-pixel text-2xl text-muted-foreground">→</div>
          <div className="text-center p-4 bg-muted border-2 border-brutal-pink rounded">
            <div className="text-4xl mb-2">🔗</div>
            <div className="font-pixel text-xl md:text-2xl text-brutal-pink">SHARE LINK</div>
            <div className="font-terminal text-sm md:text-lg text-muted-foreground">Get friends to vote</div>
          </div>
          <div className="font-pixel text-2xl text-muted-foreground">→</div>
          <div className="text-center p-4 bg-muted border-2 border-brutal-yellow rounded">
            <div className="text-4xl mb-2">🏆</div>
            <div className="font-pixel text-xl md:text-2xl text-brutal-yellow">EARN VOTE POINTS</div>
            <div className="font-terminal text-sm md:text-lg text-muted-foreground">1 point per voter recruited</div>
          </div>
        </div>

        {/* VOTE point value */}
        <div
          className="text-center transition-opacity duration-500"
          style={{ opacity: phase >= 3 ? 1 : 0 }}
        >
          <div className="font-pixel text-lg text-muted-foreground mb-1">EACH VOTE POINT COULD BE WORTH UP TO</div>
          <div className="font-pixel text-5xl md:text-7xl text-brutal-yellow">{voteValue}</div>
          <div className="font-pixel text-lg text-muted-foreground mt-1">if the fund receives 1% of global savings and targets are hit</div>
        </div>

        {/* Two outcomes */}
        <div
          className="grid grid-cols-2 gap-6 w-full transition-opacity duration-500"
          style={{ opacity: phase >= 4 ? 1 : 0 }}
        >
          <div className="bg-muted border-2 border-brutal-cyan rounded-lg p-5 text-center space-y-2">
            <div className="text-4xl">🌍</div>
            <div className="font-pixel text-xl md:text-2xl text-brutal-cyan">TARGETS HIT</div>
            <div className="font-terminal text-lg md:text-xl text-zinc-200">
              Prize pool splits by your VOTE points
            </div>
          </div>
          <div className="bg-muted border-2 border-brutal-yellow rounded-lg p-5 text-center space-y-2">
            <div className="text-4xl">📈</div>
            <div className="font-pixel text-xl md:text-2xl text-brutal-yellow">TARGETS MISSED</div>
            <div className="font-terminal text-lg md:text-xl text-zinc-200">
              Keep your compound returns
            </div>
          </div>
        </div>

        <div
          className="font-pixel text-xl md:text-2xl text-brutal-cyan text-center transition-opacity duration-500"
          style={{ opacity: phase >= 5 ? 1 : 0 }}
        >
          The only way to lose is not to play.
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideDominantAssuranceContract;
