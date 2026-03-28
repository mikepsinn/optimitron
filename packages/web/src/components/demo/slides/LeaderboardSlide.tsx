"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GovernmentLeaderboard } from "@/components/shared/GovernmentLeaderboard";

const ARCADE = "font-[family-name:var(--font-arcade)]";

/** 15. Government leaderboard slide — arcade high score table */
export default function LeaderboardSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 sm:px-8 overflow-hidden">
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase text-foreground mb-8 text-center`}
      >
        MOST MISALIGNED
      </motion.h2>
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-full max-w-5xl"
      >
        <GovernmentLeaderboard limit={5} compact />
      </motion.div>
    </div>
  );
}
