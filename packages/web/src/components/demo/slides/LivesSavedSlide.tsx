"use client";

import { useReducedMotion, motion } from "framer-motion";
import { CountUp } from "@/components/animations/CountUp";
import { PulseGlow } from "@/components/animations/PulseGlow";
import {
  GLOBAL_DISEASE_DEATHS_DAILY,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  fmtRaw,
} from "@optimitron/data/parameters";

const ARCADE = "font-[family-name:var(--font-arcade)]";

const livesSaved = Math.round(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value);
const accelerationYears = Math.round(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS.value);

/** Lives Saved slide — Act III emotional peak, 10.7 billion lives */
export default function LivesSavedSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden bg-brutal-cyan">
      {/* Massive count */}
      <motion.div
        initial={reduced ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <PulseGlow color="rgba(0, 200, 200, 0.6)" className="inline-block p-4">
          <p className={`${ARCADE} text-7xl sm:text-8xl md:text-9xl text-foreground leading-none`}>
            <CountUp value={livesSaved} duration={3.5} />
          </p>
        </PulseGlow>
      </motion.div>

      {/* Label */}
      <motion.h2
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4 }}
        className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl text-foreground uppercase mt-6 mb-4`}
      >
        LIVES SAVED
      </motion.h2>

      {/* Derivation */}
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0, duration: 0.5 }}
        className={`${ARCADE} text-xs sm:text-sm text-foreground leading-relaxed max-w-lg`}
      >
        {fmtRaw(GLOBAL_DISEASE_DEATHS_DAILY.value)} deaths/day &times; {accelerationYears} years of acceleration &times; 33.8% avoidable
      </motion.p>
    </div>
  );
}
