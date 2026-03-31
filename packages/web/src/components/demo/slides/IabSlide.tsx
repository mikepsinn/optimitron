"use client";

import { useReducedMotion, motion } from "framer-motion";

const ARCADE = "font-pixel";

/** IAB slide — Incentive Alignment Bonds crafting recipe flow diagram */
export default function IabSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden">
      {/* Title */}
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-lg sm:text-2xl md:text-3xl text-foreground uppercase mb-6 sm:mb-8`}
      >
        INCENTIVE ALIGNMENT BONDS
      </motion.h2>

      {/* INPUT box */}
      <motion.div
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
        className="border-4 border-primary bg-brutal-pink px-6 sm:px-10 py-3 sm:py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-2"
      >
        <p className={`${ARCADE} text-[10px] sm:text-xs text-brutal-pink-foreground uppercase mb-1`}>
          INPUT
        </p>
        <p className={`${ARCADE} text-base sm:text-xl text-foreground`}>
          BONDS: $1 BILLION
        </p>
      </motion.div>

      {/* Arrow down */}
      <motion.div
        initial={reduced ? false : { scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="text-foreground text-2xl sm:text-3xl leading-none my-1 sm:my-2"
        style={{ transformOrigin: "top" }}
      >
        &#x25BC;
      </motion.div>

      {/* Treaty box */}
      <motion.div
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4, type: "spring" }}
        className="border-4 border-primary bg-brutal-cyan px-6 sm:px-10 py-3 sm:py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-2"
      >
        <p className={`${ARCADE} text-sm sm:text-lg text-foreground`}>
          TREATY PASSES
        </p>
        <p className={`${ARCADE} text-base sm:text-xl text-foreground`}>
          $27B/yr inflow
        </p>
      </motion.div>

      {/* Arrow down */}
      <motion.div
        initial={reduced ? false : { scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.3 }}
        className="text-foreground text-2xl sm:text-3xl leading-none my-1 sm:my-2"
        style={{ transformOrigin: "top" }}
      >
        &#x25BC;
      </motion.div>

      {/* OUTPUT label */}
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.3 }}
        className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground uppercase mb-2 sm:mb-3`}
      >
        OUTPUT (ANNUAL, ON-CHAIN)
      </motion.p>

      {/* Three output boxes */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full max-w-3xl justify-center">
        <motion.div
          initial={reduced ? false : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="flex-1 border-4 border-primary bg-brutal-cyan px-3 py-2 sm:px-4 sm:py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-xs sm:text-sm text-brutal-cyan-foreground`}>80% TRIALS</p>
          <p className={`${ARCADE} text-lg sm:text-2xl text-foreground`}>$21.6B</p>
        </motion.div>

        <motion.div
          initial={reduced ? false : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.45, duration: 0.4 }}
          className="flex-1 border-4 border-primary bg-brutal-yellow px-3 py-2 sm:px-4 sm:py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-xs sm:text-sm text-brutal-yellow-foreground`}>10% BOND HOLDERS</p>
          <p className={`${ARCADE} text-lg sm:text-2xl text-foreground`}>$2.7B</p>
        </motion.div>

        <motion.div
          initial={reduced ? false : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.4 }}
          className="flex-1 border-4 border-primary bg-brutal-pink px-3 py-2 sm:px-4 sm:py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-xs sm:text-sm text-brutal-pink-foreground`}>10% SUPERPAC</p>
          <p className={`${ARCADE} text-lg sm:text-2xl text-foreground`}>$2.7B</p>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.9, duration: 0.4 }}
        className="mt-4 sm:mt-6 border-4 border-primary bg-foreground px-4 sm:px-8 py-2 sm:py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <p className={`${ARCADE} text-[10px] sm:text-xs md:text-sm text-background uppercase`}>
          Campaign cost: $1B. Annual return: $27B. Forever.
        </p>
      </motion.div>
    </div>
  );
}
