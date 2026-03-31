"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CountUp } from "@/components/animations/CountUp";
import {
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/data/parameters";

const ARCADE = "font-pixel";

const oldQueue = Math.round(STATUS_QUO_QUEUE_CLEARANCE_YEARS.value);
const newQueue = Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value);

/** 9. Trial acceleration slide — massive old vs new numbers */
export default function TrialAccelerationSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 mb-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="border-4 border-primary bg-foreground px-8 sm:px-12 py-6 sm:py-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-5xl sm:text-6xl md:text-[8rem] text-background line-through opacity-50 leading-none`}>
            {oldQueue}
          </p>
          <p className={`${ARCADE} text-sm text-background uppercase mt-2`}>YEARS</p>
        </motion.div>
        <motion.p
          initial={reduced ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className={`${ARCADE} text-5xl sm:text-6xl text-brutal-pink`}
        >
          →
        </motion.p>
        <motion.div
          initial={reduced ? false : { opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-4 border-primary bg-brutal-yellow px-8 sm:px-12 py-6 sm:py-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-5xl sm:text-6xl md:text-[8rem] text-foreground font-black leading-none`}>
            {newQueue}
          </p>
          <p className={`${ARCADE} text-sm text-foreground uppercase mt-2`}>YEARS</p>
        </motion.div>
      </div>
      <motion.div
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
        className="text-8xl sm:text-9xl md:text-[10rem] font-black text-brutal-pink leading-none mb-2"
      >
        <CountUp value={DFDA_TRIAL_CAPACITY_MULTIPLIER.value} duration={2} suffix="×" />
      </motion.div>
    </div>
  );
}
