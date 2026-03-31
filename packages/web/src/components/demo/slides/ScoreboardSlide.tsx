"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HumanityScoreboard } from "@/components/shared/HumanityScoreboard";

const ARCADE = "font-pixel";

/** Scoreboard slide */
export default function ScoreboardSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 sm:px-8 overflow-hidden">
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase text-foreground mb-8 text-center`}
      >
        THE SCOREBOARD
      </motion.h2>
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-full max-w-5xl"
      >
        <HumanityScoreboard />
      </motion.div>
    </div>
  );
}
