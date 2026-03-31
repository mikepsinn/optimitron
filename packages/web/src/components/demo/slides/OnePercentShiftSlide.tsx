"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/data/parameters";

const ARCADE = "font-pixel";

const capacityX = DFDA_TRIAL_CAPACITY_MULTIPLIER.value.toFixed(1);
const oldQueue = Math.round(STATUS_QUO_QUEUE_CLEARANCE_YEARS.value);
const newQueue = Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value);

/** 8. One percent shift slide — FULL WIDTH before/after bars */
export default function OnePercentShiftSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-8">
      <p className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl font-black text-foreground uppercase tracking-wider mb-10`}>
        THE FIX
      </p>
      <div className="w-full space-y-8 mb-10 px-2">
        {/* Before bar */}
        <div>
          <p className={`${ARCADE} text-sm sm:text-base font-black uppercase text-muted-foreground mb-2 text-left`}>BEFORE</p>
          <motion.div
            initial={reduced ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: [0.87, 0, 0.13, 1] }}
            style={{ originX: 0 }}
            className="h-20 sm:h-24 w-full bg-brutal-red border-4 border-primary flex items-center justify-center"
          >
            <span className={`${ARCADE} text-xl sm:text-2xl font-black text-brutal-red-foreground`}>100% BOMBS</span>
          </motion.div>
        </div>
        {/* After bar */}
        <div>
          <p className={`${ARCADE} text-sm sm:text-base font-black uppercase text-muted-foreground mb-2 text-left`}>AFTER</p>
          <motion.div
            initial={reduced ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, ease: [0.87, 0, 0.13, 1], delay: 0.4 }}
            style={{ originX: 0 }}
            className="h-20 sm:h-24 w-full flex border-4 border-primary"
          >
            <div className="bg-brutal-red flex-grow flex items-center justify-center">
              <span className={`${ARCADE} text-xl sm:text-2xl font-black text-brutal-red-foreground`}>99%</span>
            </div>
            <motion.div
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              className="bg-brutal-cyan w-[5%] min-w-[60px] flex items-center justify-center border-l-4 border-primary"
            >
              <span className={`${ARCADE} text-base sm:text-lg font-black text-foreground`}>1%</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
      {/* Impact stats */}
      <div className="flex gap-8 sm:gap-16">
        <div>
          <p className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl font-black text-foreground`}>{capacityX}×</p>
          <p className={`${ARCADE} text-xs sm:text-sm font-black uppercase text-muted-foreground`}>MORE TRIALS</p>
        </div>
        <div>
          <p className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl font-black text-foreground`}>{oldQueue} → {newQueue}</p>
          <p className={`${ARCADE} text-xs sm:text-sm font-black uppercase text-muted-foreground`}>YEARS TO CURE ALL</p>
        </div>
      </div>
    </div>
  );
}
