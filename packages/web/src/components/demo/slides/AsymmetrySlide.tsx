"use client";

import { useReducedMotion, motion } from "framer-motion";
import { CountUp } from "@/components/animations/CountUp";
import { TREATY_PERSONAL_UPSIDE_BLEND } from "@optimitron/data/parameters";

const ARCADE = "font-pixel";
const upsideRaw = Math.round(TREATY_PERSONAL_UPSIDE_BLEND.value);
const exchangeRate = Math.round(TREATY_PERSONAL_UPSIDE_BLEND.value / 0.06);

/** Asymmetry slide — $0.06 vs TREATY_PERSONAL_UPSIDE_BLEND trade, maximum visual contrast */
export default function AsymmetrySlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden bg-foreground">
      {/* Two cards with extreme size contrast */}
      <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 w-full max-w-4xl">
        {/* LEFT: tiny card */}
        <motion.div
          initial={reduced ? false : { opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="border-4 border-primary bg-muted px-3 py-2 sm:px-4 sm:py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-shrink-0"
        >
          <p className={`${ARCADE} text-base sm:text-lg md:text-xl text-muted-foreground leading-none`}>
            $0.06
          </p>
          <p className={`${ARCADE} text-[8px] sm:text-[10px] text-muted-foreground uppercase mt-1`}>
            30 SECONDS OF
            <br />
            YOUR TIME
          </p>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
        >
          <motion.span
            animate={reduced ? {} : { x: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl text-brutal-yellow`}
          >
            →
          </motion.span>
        </motion.div>

        {/* RIGHT: massive card */}
        <motion.div
          initial={reduced ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="border-4 border-primary bg-brutal-yellow px-6 py-6 sm:px-10 sm:py-10 md:px-16 md:py-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-shrink-0"
        >
          <p className={`${ARCADE} text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground leading-none`}>
            $<CountUp value={upsideRaw} duration={2.5} />
          </p>
          <p className={`${ARCADE} text-xs sm:text-sm md:text-base text-foreground uppercase mt-2`}>
            LIFETIME INCOME GAIN
          </p>
        </motion.div>
      </div>

      {/* Exchange rate */}
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 150 }}
        className="border-4 border-primary bg-foreground px-6 py-3 sm:px-10 sm:py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <p className={`${ARCADE} text-xs sm:text-sm text-muted-foreground uppercase mb-1`}>
          EXCHANGE RATE
        </p>
        <p className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-brutal-pink leading-none`}>
          <CountUp value={exchangeRate} duration={3} /> : 1
        </p>
      </motion.div>

      {/* Wishonia quip */}
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.6 }}
        className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground uppercase mt-6 max-w-md`}
      >
        &ldquo;ON MY PLANET WE JUST CALL IT ARITHMETIC.&rdquo;
      </motion.p>
    </div>
  );
}
