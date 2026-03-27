"use client";

import { useReducedMotion, motion } from "framer-motion";
import {
  VOTE_TOKEN_VALUE,
  VOTE_2_CLAIMS_PAYOUT,
  PRIZE_POOL_HORIZON_MULTIPLE,
  fmtParam,
  fmtRaw,
} from "@optimitron/data/parameters";

const ARCADE = "font-[family-name:var(--font-arcade)]";

/** Prize Free Option slide — three-outcome worked example */
export default function PrizeFreeOptionSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden">
      {/* Title */}
      <motion.h2
        initial={reduced ? false : { y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`${ARCADE} text-xs sm:text-sm md:text-base text-foreground uppercase mb-4 sm:mb-6`}
      >
        &#x1F4CA; WORKED EXAMPLE &mdash; $100 DEPOSIT + 2 FRIENDS PLAYING
      </motion.h2>

      <div className="flex flex-col gap-3 sm:gap-4 max-w-2xl w-full">
        {/* Card 1: Humanity Wins — LARGEST, brightest */}
        <motion.div
          initial={reduced ? false : { x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="border-4 border-brutal-cyan bg-background p-4 sm:p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-left"
        >
          <p className={`${ARCADE} text-sm sm:text-base text-brutal-cyan uppercase mb-3`}>
            &#x2705; HUMANITY WINS
          </p>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              Your deposit: goes to VOTE holders (not you)
            </p>
            <p className="text-sm font-bold text-foreground">
              Your VOTE points: 2 &times; {fmtParam(VOTE_TOKEN_VALUE)} ={" "}
              <span className="text-brutal-cyan">{fmtParam(VOTE_2_CLAIMS_PAYOUT)}</span>
            </p>
            <p className="text-sm font-bold text-foreground">
              Your lifetime income:{" "}
              <span className="text-brutal-cyan">+$15.7 MILLION</span>
            </p>
            <p className="text-sm font-bold text-muted-foreground">
              Everyone is 10&times; richer. You don&apos;t miss $100.
            </p>
          </div>
          <div className="mt-3 border-t-2 border-brutal-cyan pt-2">
            <p className={`${ARCADE} text-base sm:text-lg text-brutal-cyan`}>
              NET: +$16,087,000
            </p>
          </div>
        </motion.div>

        {/* Card 2: Humanity Misses — medium, still positive */}
        <motion.div
          initial={reduced ? false : { x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="border-4 border-primary bg-background p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left"
        >
          <p className={`${ARCADE} text-sm sm:text-base text-brutal-yellow uppercase mb-2`}>
            &#x2705; HUMANITY MISSES
          </p>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              VOTE points: expire ($0)
            </p>
            <p className="text-sm font-bold text-foreground">
              Your deposit: $100 &rarr;{" "}
              <span className="text-brutal-yellow">${fmtRaw(100 * PRIZE_POOL_HORIZON_MULTIPLE.value)}</span> ({fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} yield)
            </p>
            <p className="text-sm font-bold text-muted-foreground">
              Still outperforms your retirement fund (3.5&times;)
            </p>
          </div>
          <div className="mt-2 border-t-2 border-primary pt-2">
            <p className={`${ARCADE} text-sm sm:text-base text-brutal-yellow`}>
              NET: +$1,010
            </p>
          </div>
        </motion.div>

        {/* Card 3: Did Not Play — smallest, dim, red */}
        <motion.div
          initial={reduced ? false : { x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="border-4 border-muted-foreground bg-muted p-3 sm:p-4 text-left opacity-80"
        >
          <p className={`${ARCADE} text-sm text-brutal-red uppercase mb-2`}>
            &#x274C; DID NOT PLAY
          </p>
          <div className="space-y-1">
            <p className="text-sm font-bold text-muted-foreground">
              $0 returned. $0 earned.
            </p>
            <p className="text-sm font-bold text-muted-foreground">
              Still paying $12,600/yr dysfunction tax.
            </p>
            <p className="text-sm font-bold text-muted-foreground">
              Missed $15.7M in lifetime income.
            </p>
          </div>
          <div className="mt-2 border-t-2 border-muted-foreground pt-2">
            <p className={`${ARCADE} text-sm text-brutal-red`}>
              NET: -$15,700,000 (opportunity cost)
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer punchline */}
      <motion.p
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className={`${ARCADE} text-xs sm:text-sm text-foreground uppercase mt-4 sm:mt-6 max-w-xl`}
      >
        Two out of three outcomes are wins. The third one is your fault.
      </motion.p>
    </div>
  );
}
