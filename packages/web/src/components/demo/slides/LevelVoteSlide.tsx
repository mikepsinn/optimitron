"use client";

import { motion, useReducedMotion } from "framer-motion";

const ARCADE = "font-pixel";

/** 12. Level vote slide — MASSIVE binary choice */
export default function LevelVoteSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 overflow-hidden">
      <motion.div
        initial={reduced ? false : { y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-brutal-pink border-4 border-primary px-8 py-3 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <p className={`${ARCADE} text-base sm:text-lg text-brutal-pink-foreground uppercase`}>LEVEL 2</p>
      </motion.div>

      <div className="flex items-center gap-6 sm:gap-12 md:gap-20 w-full justify-center">
        <motion.button
          initial={reduced ? false : { x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          whileHover={{ scale: 1.05, y: -4 }}
          className="border-4 border-primary bg-brutal-cyan px-12 sm:px-20 md:px-28 py-10 sm:py-14 md:py-20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-shadow"
        >
          <p className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl text-foreground`}>YES</p>
        </motion.button>

        <motion.button
          initial={reduced ? false : { x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          whileHover={{ scale: 1.05, y: -4 }}
          className="border-4 border-primary bg-brutal-red px-12 sm:px-20 md:px-28 py-10 sm:py-14 md:py-20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-shadow"
        >
          <p className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl text-brutal-red-foreground`}>NO</p>
        </motion.button>
      </div>
    </div>
  );
}
