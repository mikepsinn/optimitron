"use client";

import { useReducedMotion, motion } from "framer-motion";
import { CountUp } from "@/components/animations/CountUp";
import {
  VOTE_TOKEN_VALUE,
  VOTE_2_CLAIMS_PAYOUT,
  PRIZE_POOL_SIZE,
  GLOBAL_COORDINATION_TARGET_SUPPORTERS,
  fmtParam,
  fmtRaw,
} from "@optimitron/data/parameters";

const ARCADE = "font-pixel";

const FRIENDS_TABLE = [
  { friends: 2, value: fmtParam(VOTE_2_CLAIMS_PAYOUT) },
  { friends: 5, value: `$${fmtRaw(5 * VOTE_TOKEN_VALUE.value)}` },
  { friends: 10, value: `$${fmtRaw(10 * VOTE_TOKEN_VALUE.value)}` },
  { friends: 50, value: `$${fmtRaw(50 * VOTE_TOKEN_VALUE.value)}` },
];

/** Vote Point Value slide — game stats panel showing VOTE point value */
export default function VotePointValueSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden">
      <motion.div
        initial={reduced ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: "spring" }}
        className="border-4 border-primary bg-foreground w-full max-w-lg p-5 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        {/* Title */}
        <h2 className={`${ARCADE} text-base sm:text-lg md:text-xl text-background uppercase mb-5`}>
          &#x2694;&#xFE0F; CHARACTER &mdash; VOTE POINT LEDGER
        </h2>

        {/* Stats */}
        <div className="space-y-3 mb-5 text-left">
          <div className="flex justify-between items-baseline border-b border-background/20 pb-2">
            <span className={`${ARCADE} text-xs sm:text-sm text-background/70 uppercase`}>
              POINTS EARNED
            </span>
            <span className={`${ARCADE} text-lg sm:text-xl text-background`}>
              2
            </span>
          </div>
          <div className="flex justify-between items-baseline border-b border-background/20 pb-2">
            <span className={`${ARCADE} text-xs sm:text-sm text-background/70 uppercase`}>
              VALUE PER POINT
            </span>
            <span className={`${ARCADE} text-lg sm:text-xl text-brutal-cyan`}>
              $<CountUp value={Math.round(VOTE_TOKEN_VALUE.value)} prefix="" duration={1.5} />
            </span>
          </div>
          <div className="flex justify-between items-baseline border-b border-background/20 pb-2">
            <span className={`${ARCADE} text-xs sm:text-sm text-background/70 uppercase`}>
              TOTAL IF HIT
            </span>
            <span className={`${ARCADE} text-lg sm:text-xl text-brutal-pink`}>
              $<CountUp value={Math.round(VOTE_2_CLAIMS_PAYOUT.value)} prefix="" duration={1.8} />
            </span>
          </div>
        </div>

        {/* Friends table */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="border-4 border-background/30 bg-background/10 p-3 sm:p-4 mb-5"
        >
          <p className={`${ARCADE} text-xs text-background/70 uppercase mb-3`}>
            FRIENDS PLAYING TABLE
          </p>
          <div className="space-y-2">
            {FRIENDS_TABLE.map((row, i) => (
              <motion.div
                key={row.friends}
                initial={reduced ? false : { x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
                className="flex justify-between items-baseline"
              >
                <span className={`${ARCADE} text-xs sm:text-sm text-background`}>
                  {row.friends} friends
                </span>
                <span className={`${ARCADE} text-xs sm:text-sm text-brutal-cyan`}>
                  &rarr; {row.value}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Warnings */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
          className="space-y-1 mb-4 text-left"
        >
          <p className={`${ARCADE} text-xs text-brutal-yellow`}>
            &#x26A0; Points are NON-TRADABLE.
          </p>
          <p className={`${ARCADE} text-xs text-brutal-yellow`}>
            &#x26A0; Cannot be purchased. Ever.
          </p>
          <p className={`${ARCADE} text-xs text-brutal-yellow`}>
            &#x26A0; Earned ONLY by getting friends to play.
          </p>
        </motion.div>

        {/* Flywheel footer */}
        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.4 }}
          className={`${ARCADE} text-xs text-brutal-cyan leading-relaxed`}
        >
          More players &rarr; bigger pool &rarr; bigger prize &rarr; more incentive to make sure Earth wins
        </motion.p>

        {/* Derivation */}
        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.3 }}
          className={`${ARCADE} text-[10px] text-muted-foreground mt-3`}
        >
          {fmtParam(PRIZE_POOL_SIZE)} pool &divide; {fmtRaw(GLOBAL_COORDINATION_TARGET_SUPPORTERS.value)} players = {fmtParam(VOTE_TOKEN_VALUE)}/point
        </motion.p>
      </motion.div>
    </div>
  );
}
