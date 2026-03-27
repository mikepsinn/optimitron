"use client";

import { useReducedMotion, motion } from "framer-motion";
import {
  VOTE_TOKEN_VALUE,
  PRIZE_POOL_HORIZON_MULTIPLE,
  fmtParam,
  fmtRaw,
} from "@optimitron/data/parameters";

const ARCADE = "font-[family-name:var(--font-arcade)]";

/** Prize Mechanism slide — two-path branching, both green, no losing path */
export default function PrizeMechanismSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden">
      {/* Deposit box */}
      <motion.div
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: "spring" }}
        className="border-4 border-primary bg-brutal-yellow px-6 sm:px-10 py-3 sm:py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-4"
      >
        <p className={`${ARCADE} text-lg sm:text-2xl text-foreground`}>
          YOU ($100)
        </p>
      </motion.div>

      {/* Arrow down */}
      <motion.div
        initial={reduced ? false : { scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="text-foreground text-3xl leading-none mb-2"
        style={{ transformOrigin: "top" }}
      >
        &#x25BC;
      </motion.div>

      {/* Smart contract box */}
      <motion.div
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4, type: "spring" }}
        className="border-4 border-primary bg-foreground px-6 sm:px-10 py-3 sm:py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6"
      >
        <p className={`${ARCADE} text-sm sm:text-base text-background uppercase`}>
          PRIZE POOL SMART CONTRACT
        </p>
      </motion.div>

      {/* Two branches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl w-full">
        {/* Branch 1: Targets hit */}
        <motion.div
          initial={reduced ? false : { x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="border-4 border-brutal-cyan bg-background p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-2xl sm:text-3xl mb-3`}>
            &#x1F30D;
          </p>
          <p className={`${ARCADE} text-sm sm:text-base text-brutal-cyan uppercase mb-2`}>
            TARGETS HIT
          </p>
          <p className="text-sm font-bold text-foreground">
            Pool unlocks.
          </p>
          <p className="text-sm font-bold text-foreground">
            VOTE holders split it.
          </p>
          <div className="mt-3 border-t-2 border-brutal-cyan pt-2">
            <p className={`${ARCADE} text-xs text-brutal-cyan`}>
              {fmtParam(VOTE_TOKEN_VALUE)} PER POINT
            </p>
          </div>
        </motion.div>

        {/* Branch 2: Targets missed — still green/positive */}
        <motion.div
          initial={reduced ? false : { x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="border-4 border-brutal-cyan bg-background p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-2xl sm:text-3xl mb-3`}>
            &#x274C;
          </p>
          <p className={`${ARCADE} text-sm sm:text-base text-brutal-cyan uppercase mb-2`}>
            TARGETS MISSED
          </p>
          <p className="text-sm font-bold text-foreground">
            Your $100 &rarr; ${fmtRaw(100 * PRIZE_POOL_HORIZON_MULTIPLE.value)} back
          </p>
          <p className="text-sm font-bold text-foreground">
            ({fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} over 15 years at 17%)
          </p>
          <div className="mt-3 border-t-2 border-brutal-cyan pt-2">
            <p className={`${ARCADE} text-xs text-brutal-cyan`}>
              STILL OUTPERFORMS RETIREMENT
            </p>
          </div>
        </motion.div>
      </div>

      {/* No losing path callout */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4 }}
        className="mt-6 border-4 border-brutal-cyan bg-foreground px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <p className={`${ARCADE} text-xs sm:text-sm text-brutal-cyan uppercase`}>
          BOTH PATHS PAY. THERE IS NO PATH WHERE YOU LOSE.
        </p>
      </motion.div>
    </div>
  );
}
