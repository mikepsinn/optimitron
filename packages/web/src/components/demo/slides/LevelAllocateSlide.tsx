"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PulseGlow } from "@/components/animations/PulseGlow";

const ARCADE = "font-pixel";

/** 11. Level allocate slide — fighting game versus screen */
export default function LevelAllocateSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 overflow-hidden">
      <motion.div
        initial={reduced ? false : { y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-brutal-yellow border-4 border-primary px-8 py-3 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <p className={`${ARCADE} text-base sm:text-lg text-foreground uppercase`}>LEVEL 1</p>
      </motion.div>

      <div className="flex items-center justify-center w-full gap-4 sm:gap-8 md:gap-12">
        {/* BOMBS — left 45% */}
        <motion.div
          initial={reduced ? false : { x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          className="border-4 border-primary bg-brutal-red px-8 sm:px-12 md:px-16 py-10 sm:py-14 md:py-20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-shrink-0"
        >
          <p className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl text-brutal-red-foreground`}>BOMBS</p>
        </motion.div>

        {/* VS */}
        <PulseGlow color="rgba(255,105,180,0.5)">
          <motion.p
            initial={reduced ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            className={`${ARCADE} text-6xl sm:text-7xl md:text-[8rem] text-brutal-pink leading-none`}
          >
            VS
          </motion.p>
        </PulseGlow>

        {/* CURES — right 45% */}
        <motion.div
          initial={reduced ? false : { x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          className="border-4 border-primary bg-brutal-cyan px-8 sm:px-12 md:px-16 py-10 sm:py-14 md:py-20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-shrink-0"
        >
          <p className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl text-foreground`}>CURES</p>
        </motion.div>
      </div>
    </div>
  );
}
