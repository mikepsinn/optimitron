"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { POINTS } from "@/lib/messaging";
import {
  EARTH_OPTIMIZATION_POINT_VALUE,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
} from "@optimitron/data/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

const voteValue = formatCurrency(EARTH_OPTIMIZATION_POINT_VALUE.value);
const lifetimeGain = formatCurrency(TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA.value);

export function SlideThreeScenariosAllWin() {
  return (
    <SierraSlideWrapper act={2} className="text-background">
      <div className="flex flex-col items-center justify-center gap-8 max-w-[1500px] mx-auto">
        <div className="text-center">
          <div className="font-pixel text-2xl md:text-3xl text-muted-foreground mb-2">
            HOW TO BRIBE HUMANITY INTO ACTUALLY DOING THIS
          </div>
          <h1 className="font-pixel text-2xl md:text-4xl text-background">
            THE EARTH OPTIMIZATION PRIZE FUND
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-6 w-full">
          {/* Metrics hit */}
          <div className="bg-muted border-2 border-background rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">🌍</div>
            <div className="font-pixel text-xl md:text-2xl text-sierra-cyan mb-4">
              METRICS HIT
            </div>
            <div className="font-pixel text-4xl md:text-6xl text-sierra-cyan">
              {voteValue}+
            </div>
            <div className="font-pixel text-lg text-muted-foreground mt-2">
              {POINTS} pay out
            </div>
            <div className="mt-3 border-t border-background/30 pt-3">
              <div className="font-pixel text-3xl md:text-5xl text-sierra-cyan">
                +{lifetimeGain}
              </div>
              <div className="font-pixel text-sm md:text-base text-muted-foreground mt-1">
                LIFETIME INCOME
              </div>
            </div>
          </div>

          {/* Humanity fails */}
          <div className="bg-muted border-2 border-background rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">📈</div>
            <div className="font-pixel text-xl md:text-2xl text-background mb-4">
              HUMANITY FAILS
            </div>
            <div className="font-pixel text-4xl md:text-6xl text-background">
              {Math.round(GAME_PARAMS.prizePoolFallbackMultiple)}x RETURN
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
            <div className="font-pixel text-3xl md:text-4xl text-brutal-red">
              SOMALIA
            </div>
            <div className="font-pixel text-lg text-muted-foreground mt-2">
              status quo life expectancy
            </div>
          </div>
        </div>

      </div>
    </SierraSlideWrapper>
  );
}
export default SlideThreeScenariosAllWin;
