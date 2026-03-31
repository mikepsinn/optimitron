"use client";

import { useReducedMotion, motion } from "framer-motion";
import { CountUp } from "@/components/animations/CountUp";

const ARCADE = "font-pixel";

/** Prize Investment slide — 17% vs 8% investment comparison */
export default function PrizeInvestmentSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden">
      <motion.h2
        initial={reduced ? false : { y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-xl sm:text-2xl md:text-3xl text-foreground uppercase mb-6 sm:mb-8`}
      >
        INVESTMENT COMPARISON
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl w-full mb-6 sm:mb-8">
        {/* LEFT — retirement fund (dull) */}
        <motion.div
          initial={reduced ? false : { x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="border-4 border-primary bg-muted p-5 sm:p-6 flex flex-col gap-3"
        >
          <p className={`${ARCADE} text-sm sm:text-base text-muted-foreground uppercase`}>
            YOUR RETIREMENT FUND
          </p>
          <p className="text-sm font-bold text-muted-foreground">
            Old corporations
          </p>
          <p className="text-sm font-bold text-muted-foreground">
            Rent-seeking, slow
          </p>
          <div className="border-t-2 border-primary pt-3 mt-auto">
            <p className={`${ARCADE} text-base sm:text-lg text-foreground`}>
              RETURN: 8%/YEAR
            </p>
          </div>
          <p className={`${ARCADE} text-2xl sm:text-3xl text-foreground leading-none`}>
            $100 &rarr; $317
          </p>
          <p className={`${ARCADE} text-xs text-muted-foreground`}>
            15 YEARS
          </p>
          <div className="border-t-2 border-primary pt-3">
            <p className="text-sm font-bold text-muted-foreground">
              Side effect: nothing
            </p>
          </div>
        </motion.div>

        {/* RIGHT — prize pool (bright) */}
        <motion.div
          initial={reduced ? false : { x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="border-4 border-primary bg-brutal-pink p-5 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3"
        >
          <p className={`${ARCADE} text-sm sm:text-base text-brutal-pink-foreground uppercase`}>
            PRIZE POOL
          </p>
          <p className="text-sm font-bold text-foreground">
            Innovative startups
          </p>
          <p className="text-sm font-bold text-foreground">
            High-growth, new
          </p>
          <div className="border-t-2 border-primary pt-3 mt-auto">
            <p className={`${ARCADE} text-base sm:text-lg text-foreground`}>
              RETURN: 17%/YEAR
            </p>
          </div>
          <p className={`${ARCADE} text-2xl sm:text-3xl text-foreground leading-none`}>
            $100 &rarr; $
            <CountUp value={1110} duration={1.5} />
          </p>
          <p className={`${ARCADE} text-xs text-muted-foreground`}>
            15 YEARS
          </p>
          <div className="border-t-2 border-primary pt-3">
            <p className="text-sm font-bold text-foreground">
              Side effect: curing all disease
            </p>
          </div>
        </motion.div>
      </div>

      <motion.p
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className={`${ARCADE} text-sm sm:text-base md:text-lg text-foreground uppercase max-w-2xl`}
      >
        The goal: build the biggest prize pool in history.
      </motion.p>
    </div>
  );
}
