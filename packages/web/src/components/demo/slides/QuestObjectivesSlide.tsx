"use client";

import { useReducedMotion, motion } from "framer-motion";

const ARCADE = "font-pixel";

/** Quest objectives slide — Sierra quest log with two win conditions */
export default function QuestObjectivesSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden">
      {/* Quest log container */}
      <motion.div
        initial={reduced ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.87, 0, 0.13, 1] }}
        className="w-full max-w-2xl bg-background border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        {/* Header */}
        <div className="border-b-4 border-primary px-4 py-3 sm:px-6 sm:py-4 bg-brutal-yellow">
          <p className={`${ARCADE} text-sm sm:text-base md:text-lg text-foreground uppercase`}>
            📖 QUEST LOG — EARTH OPTIMIZATION
          </p>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-6">
          {/* Objective 1: HALE */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <p className={`${ARCADE} text-xs sm:text-sm text-foreground uppercase font-black mb-2 text-left`}>
              OBJECTIVE 1: HEALTHY LIFE EXPECTANCY
            </p>
            <div className="flex justify-between mb-2">
              <span className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground`}>
                CURRENT: 63.3 YEARS
              </span>
              <span className={`${ARCADE} text-[10px] sm:text-xs text-foreground`}>
                TARGET: 69.8 YEARS (+6.5)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-6 sm:h-8 bg-muted border-2 border-primary relative">
              <motion.div
                initial={reduced ? false : { width: 0 }}
                animate={{ width: "0%" }}
                transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                className="h-full bg-brutal-cyan"
              />
              <span
                className={`${ARCADE} absolute right-2 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-muted-foreground`}
              >
                0%
              </span>
            </div>
          </motion.div>

          {/* Objective 2: Income */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <p className={`${ARCADE} text-xs sm:text-sm text-foreground uppercase font-black mb-2 text-left`}>
              OBJECTIVE 2: GLOBAL MEDIAN INCOME
            </p>
            <div className="flex justify-between mb-2">
              <span className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground`}>
                CURRENT: $18,700/YR
              </span>
              <span className={`${ARCADE} text-[10px] sm:text-xs text-foreground`}>
                TARGET: $149,000/YR (8×)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-6 sm:h-8 bg-muted border-2 border-primary relative">
              <motion.div
                initial={reduced ? false : { width: 0 }}
                animate={{ width: "0%" }}
                transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
                className="h-full bg-brutal-yellow"
              />
              <span
                className={`${ARCADE} absolute right-2 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-muted-foreground`}
              >
                0%
              </span>
            </div>
          </motion.div>

          {/* Deadline */}
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.4 }}
            className="border-t-4 border-primary pt-4 flex flex-col sm:flex-row justify-between items-center gap-2"
          >
            <div className="flex gap-6">
              <div>
                <p className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground uppercase`}>DEADLINE</p>
                <p className={`${ARCADE} text-lg sm:text-xl text-foreground font-black`}>2040</p>
              </div>
              <div>
                <p className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground uppercase`}>TIME LEFT</p>
                <p className={`${ARCADE} text-lg sm:text-xl text-brutal-red font-black`}>14 YEARS</p>
              </div>
            </div>
            <div>
              <p className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground uppercase`}>REWARD</p>
              <p className={`${ARCADE} text-sm sm:text-base text-foreground font-black`}>8B LIVES ALIGNED</p>
            </div>
          </motion.div>
        </div>

        {/* Quote footer */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="border-t-4 border-primary px-4 py-3 sm:px-6 sm:py-4 bg-muted"
        >
          <p className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground uppercase leading-relaxed text-left`}>
            &ldquo;Move these two numbers. Everything else follows.&rdquo;{" "}
            <span className="text-brutal-pink">— Wishonia</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
