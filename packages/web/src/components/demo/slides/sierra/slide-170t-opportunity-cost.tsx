"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import {
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
} from "@optimitron/data/parameters";
import { GAME_PARAMS } from "@/lib/demo/parameters";

const militarySpent = CUMULATIVE_MILITARY_SPENDING_FED_ERA.value;
const trialsAnnual = GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value;
const yearsOfTrials = Math.round(militarySpent / trialsAnnual);
const pctLost = GAME_PARAMS.dollarPurchasingPowerLost;
const richerMultiple = Math.round(1 / (1 - pctLost / 100));

export function Slide170tOpportunityCost() {
  return (
    <SierraSlideWrapper act={1} className="text-brutal-cyan">
      <div className="flex flex-col items-center justify-center gap-6 max-w-[1600px] mx-auto">
        {/* Price tag */}
        <div className="font-pixel text-2xl md:text-3xl text-muted-foreground text-center">
          $170 TRILLION — TWO RECEIPTS
        </div>

        {/* Side by side */}
        <div className="grid grid-cols-2 gap-6 w-full">
          {/* What they bought */}
          <div className="bg-muted border-2 border-brutal-red rounded-lg p-6 text-center">
            <div className="font-pixel text-xl md:text-2xl text-brutal-red mb-4">
              WHAT THEY BOUGHT
            </div>
            <div className="text-6xl md:text-8xl mb-4">💣</div>
            <div className="font-pixel text-4xl md:text-6xl text-brutal-red">
              97M DEAD
            </div>
            <div className="font-pixel text-lg md:text-xl text-muted-foreground mt-3">
              + everything they built, destroyed
            </div>
          </div>

          {/* What they could have bought */}
          <div className="bg-muted border-2 border-brutal-cyan rounded-lg p-6 text-center">
            <div className="font-pixel text-xl md:text-2xl text-brutal-cyan mb-4">
              WHAT THEY COULD HAVE BOUGHT
            </div>
            <div className="text-6xl md:text-8xl mb-4">🧪</div>
            <div className="font-pixel text-4xl md:text-6xl text-brutal-cyan">
              {yearsOfTrials.toLocaleString()} YEARS
            </div>
            <div className="font-pixel text-lg md:text-xl text-muted-foreground mt-3">
              of clinical trials
            </div>
          </div>
        </div>

        {/* Punchline */}
        <div className="font-pixel text-2xl md:text-3xl text-brutal-yellow text-center">
          They bought the other thing.
        </div>

        {/* 33× richer */}
        <div className="text-center">
          <div className="font-pixel text-2xl md:text-3xl text-brutal-cyan">
            YOU WOULD BE {richerMultiple}× RICHER TODAY.
          </div>
          <div className="font-pixel text-xl md:text-2xl text-brutal-yellow mt-1">
            SO THAT&apos;S WHAT YOU&apos;RE GOING TO FIX.
          </div>
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default Slide170tOpportunityCost;
