"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import {
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
} from "@optimitron/data/parameters";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/demo/formatters";

const militarySpent = formatCurrency(CUMULATIVE_MILITARY_SPENDING_FED_ERA.value);
const pctLost = GAME_PARAMS.dollarPurchasingPowerLost;

// 1/(1-0.97) ≈ 33x — how much richer you'd be without the devaluation
const richerMultiple = Math.round(1 / (1 - pctLost / 100));

export function SlideMilitaryWaste170t() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setTimeout(() => setPhase(1), 800);
    setTimeout(() => setPhase(2), 2800);
    setTimeout(() => setPhase(3), 4800);
    setTimeout(() => setPhase(4), 6500);
  }, []);

  const line = "font-pixel text-xl md:text-2xl leading-relaxed";
  const big = "font-pixel text-4xl md:text-5xl";
  const dim = "text-zinc-400";
  const fade = (p: number) =>
    `transition-all duration-700 ${phase >= p ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`;

  return (
    <SierraSlideWrapper act={1} className="text-red-500">
      <div className="w-full max-w-[1500px] mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="font-pixel text-2xl md:text-3xl text-zinc-200">
            SINCE 1913, YOUR &quot;GOVERNMENTS&quot; HAVE:
          </div>
        </div>

        {/* Line 1: Printed $170T */}
        <div className={`${fade(1)} pl-4`}>
          <span className={`${line} ${dim}`}>PRINTED </span>
          <span className={`${big} text-amber-400`}>{militarySpent}</span>
          <span className={`${line} ${dim}`}> OUT OF NOTHING AND SPENT IT ON</span>
        </div>

        {/* Line 2: Murdering 97M */}
        <div className={`${fade(2)} pl-4`}>
          <span className={`${line} ${dim}`}>MURDERING </span>
          <span className={`${big} text-red-500`}>97M</span>
          <span className={`${line} ${dim}`}> HUMANS AND DESTROYING MANY VALUABLE THINGS THOSE HUMANS SPENT THEIR ENTIRE LIVES BUILDING</span>
        </div>

        {/* Line 3: 97% less */}
        <div className={`${fade(3)} pl-4`}>
          <span className={`${line} ${dim}`}>CONSEQUENTLY YOUR PAYCHECK NOW BUYS </span>
          <span className={`${big} text-red-400`}>{pctLost}%</span>
          <span className={`${line} ${dim}`}> LESS DUE TO THE AFOREMENTIONED DESTRUCTION</span>
        </div>

      </div>
    </SierraSlideWrapper>
  );
}
export default SlideMilitaryWaste170t;
