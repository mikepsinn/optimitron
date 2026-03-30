"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import {
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
} from "@optimitron/data/parameters";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

const militarySpent = CUMULATIVE_MILITARY_SPENDING_FED_ERA.value;
const trialsAnnual = GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value;
const yearsOfTrials = Math.round(militarySpent / trialsAnnual);
const pctLost = GAME_PARAMS.dollarPurchasingPowerLost;
const richerMultiple = Math.round(1 / (1 - pctLost / 100));

export function Slide170tOpportunityCost() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setTimeout(() => setPhase(1), 500);
    setTimeout(() => setPhase(2), 2500);
    setTimeout(() => setPhase(3), 4500);
    setTimeout(() => setPhase(4), 6500);
  }, []);

  const fade = (p: number) =>
    `transition-all duration-700 ${phase >= p ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`;

  return (
    <SierraSlideWrapper act={1} className="text-brutal-cyan">
      <div className="flex flex-col items-center justify-center gap-8 max-w-[1500px] mx-auto">
        {/* What they bought */}
        <div className={fade(1)}>
          <div className="text-center">
            <div className="font-pixel text-2xl md:text-3xl text-muted-foreground mb-2">
              WHAT THEY BOUGHT
            </div>
            <div className="font-pixel text-5xl md:text-8xl text-brutal-red">
              97M DEAD
            </div>
          </div>
        </div>

        {/* What they could have bought */}
        <div className={fade(2)}>
          <div className="text-center">
            <div className="font-pixel text-2xl md:text-3xl text-muted-foreground mb-2">
              WHAT THAT MONEY COULD HAVE FUNDED
            </div>
            <div className="font-pixel text-5xl md:text-8xl text-brutal-cyan">
              {yearsOfTrials.toLocaleString()} YEARS
            </div>
            <div className="font-pixel text-2xl md:text-3xl text-muted-foreground mt-2">
              OF CLINICAL TRIALS
            </div>
          </div>
        </div>

        {/* Punchline */}
        <div className={fade(3)}>
          <div className="font-pixel text-2xl md:text-3xl text-brutal-yellow text-center">
            They bought the other thing.
          </div>
        </div>

        {/* 33× richer */}
        <div className={fade(4)}>
          <div className="text-center">
            <div className="font-pixel text-3xl md:text-5xl text-brutal-cyan">
              YOU WOULD BE {richerMultiple}× RICHER TODAY IF SOMEONE HAD PROPERLY ALIGNED YOUR GOVERNMENTS WITH HUMANITY IN 1913.
            </div>
            <div className="font-pixel text-xl md:text-2xl text-brutal-yellow mt-2">
              THEY DIDN&apos;T. SO THAT&apos;S WHAT YOU&apos;RE GOING TO DO.
            </div>
          </div>
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default Slide170tOpportunityCost;
