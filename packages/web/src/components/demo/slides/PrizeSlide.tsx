"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { playCoinSound } from "@/lib/wish-sound";
import {
  VOTE_2_CLAIMS_PAYOUT,
  PRIZE_POOL_HORIZON_MULTIPLE,
  fmtParam,
  fmtRaw,
} from "@optimitron/data/parameters";

const ARCADE = "font-[family-name:var(--font-arcade)]";

/** 14. Prize slide — INSERT COIN arcade machine */
export default function PrizeSlide() {
  const reduced = useReducedMotion();
  useEffect(() => {
    playCoinSound();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 overflow-hidden">
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl text-brutal-pink uppercase tracking-wider mb-6`}
        style={{ animation: "insert-coin-blink 1.2s step-end infinite" }}
      >
        INSERT COIN
      </motion.p>

      <motion.div
        initial={reduced ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="border-4 border-primary bg-foreground px-12 sm:px-16 py-4 sm:py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8"
      >
        <p className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl text-background`}>$100</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-6 sm:gap-10 max-w-2xl w-full mb-8">
        <motion.div
          initial={reduced ? false : { x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="border-4 border-primary bg-brutal-yellow p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-sm sm:text-base text-foreground uppercase mb-3`}>MISS</p>
          <p className={`${ARCADE} text-4xl sm:text-5xl text-foreground leading-none`}>${fmtRaw(100 * PRIZE_POOL_HORIZON_MULTIPLE.value)}</p>
          <p className={`${ARCADE} text-xs text-muted-foreground mt-2`}>{fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} BACK</p>
        </motion.div>
        <motion.div
          initial={reduced ? false : { x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="border-4 border-primary bg-brutal-cyan p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-sm sm:text-base text-foreground uppercase mb-3`}>HIT</p>
          <p className={`${ARCADE} text-4xl sm:text-5xl text-foreground leading-none`}>{fmtParam(VOTE_2_CLAIMS_PAYOUT)}</p>
          <p className={`${ARCADE} text-xs text-muted-foreground mt-2`}>{fmtRaw(Math.round(VOTE_2_CLAIMS_PAYOUT.value / 100))}x BACK</p>
        </motion.div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="border-4 border-primary bg-foreground px-8 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        style={{ animation: "insert-coin-blink 2s step-end infinite" }}
      >
        <p className={`${ARCADE} text-base sm:text-lg text-brutal-pink`}>
          BREAK-EVEN: 0.0067%
        </p>
      </motion.div>

      <style>{`
        @keyframes insert-coin-blink { from, to { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
