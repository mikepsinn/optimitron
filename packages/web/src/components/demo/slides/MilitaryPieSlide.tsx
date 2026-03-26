"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ScanLines } from "@/components/animations/GlitchText";
import { MilitaryVsTrialsPie } from "@/components/shared/MilitaryVsTrialsPie";
import { MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO } from "@optimitron/data/parameters";

const ARCADE = "font-[family-name:var(--font-arcade)]";

const ratio = Math.round(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value);
const milPct = (ratio / (ratio + 1)) * 100;
const trialPct = (1 / (ratio + 1)) * 100;

/** 4. Military pie slide — the absurd 604:1 ratio */
export default function MilitaryPieSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 bg-foreground overflow-hidden">
      <ScanLines />
      <motion.div
        initial={reduced ? false : { scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.87, 0, 0.13, 1] }}
        className={`${ARCADE} text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] text-brutal-yellow leading-none mb-6`}
      >
        {ratio}:1
      </motion.div>
      <div className="w-full flex justify-center">
        <MilitaryVsTrialsPie
          militaryPct={milPct}
          trialsPct={trialPct}
          militaryDollars={2.24e12}
          trialsDollars={3.7e9}
          size={500}
          militaryLabel="Capacity for Mass Murder"
        />
      </div>
    </div>
  );
}
