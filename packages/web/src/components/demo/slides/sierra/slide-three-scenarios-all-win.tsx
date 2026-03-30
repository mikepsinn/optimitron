"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

const deposit = 100;
const vcReturn = Math.round(deposit * GAME_PARAMS.prizePoolFallbackMultiple);
const indexReturn = Math.round(deposit * Math.pow(1.07, 15));
const voteValue = formatCurrency(GAME_PARAMS.valuePerVotePoint);

export function SlideThreeScenariosAllWin() {
  return (
    <SierraSlideWrapper act={2} className="text-brutal-cyan">
      <div className="flex flex-col items-center justify-center gap-8 max-w-[1500px] mx-auto">
        <div className="text-center">
          <div className="font-pixel text-2xl md:text-3xl text-muted-foreground mb-2">
            HOW TO BRIBE HUMANITY INTO ACTUALLY DOING THIS
          </div>
          <h1 className="font-pixel text-2xl md:text-4xl text-brutal-yellow">
            THE EARTH OPTIMIZATION PRIZE FUND
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-6 w-full">
          {/* Metrics hit */}
          <div className="bg-muted border-2 border-brutal-cyan rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">🌍</div>
            <div className="font-pixel text-xl md:text-2xl text-brutal-cyan mb-4">
              METRICS HIT
            </div>
            <div className="font-pixel text-4xl md:text-6xl text-brutal-cyan">
              {voteValue}+
            </div>
            <div className="font-pixel text-lg text-muted-foreground mt-2">
              VOTE points pay out
            </div>
          </div>

          {/* Humanity fails */}
          <div className="bg-muted border-2 border-brutal-yellow rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">📈</div>
            <div className="font-pixel text-xl md:text-2xl text-brutal-yellow mb-4">
              HUMANITY FAILS
            </div>
            <div className="font-pixel text-4xl md:text-6xl text-brutal-yellow">
              ${vcReturn.toLocaleString()}
            </div>
            <div className="font-pixel text-lg text-muted-foreground mt-2">
              deposit back + 17%/yr returns
            </div>
          </div>

          {/* Did not play */}
          <div className="bg-muted border-2 border-brutal-red rounded-lg p-6 text-center opacity-60">
            <div className="text-4xl mb-3">😐</div>
            <div className="font-pixel text-xl md:text-2xl text-brutal-red mb-4">
              DID NOT PLAY
            </div>
            <div className="font-pixel text-4xl md:text-6xl text-zinc-400">
              ${indexReturn}
            </div>
            <div className="font-pixel text-lg text-muted-foreground mt-2">
              index fund at 7%/yr
            </div>
          </div>
        </div>

      </div>
    </SierraSlideWrapper>
  );
}
export default SlideThreeScenariosAllWin;
