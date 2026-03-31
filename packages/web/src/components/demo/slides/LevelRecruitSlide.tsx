"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CountUp } from "@/components/animations/CountUp";
import { StaggerGrid } from "@/components/animations/StaggerGrid";

const ARCADE = "font-pixel";

/** 13. Level recruit slide — exponential doubling visualization */
export default function LevelRecruitSlide() {
  const reduced = useReducedMotion();
  const doublings = [1, 2, 4, 8, 16, 32, 64, 128];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 overflow-hidden">
      <motion.div
        initial={reduced ? false : { y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-brutal-yellow border-4 border-primary px-8 py-3 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <p className={`${ARCADE} text-base sm:text-lg text-foreground uppercase`}>LEVEL 3</p>
      </motion.div>

      {/* Hero number */}
      <motion.div
        initial={reduced ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        className="mb-8"
      >
        <p className={`${ARCADE} text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] text-foreground leading-none`}>
          <CountUp value={268000000} duration={3} />
        </p>
      </motion.div>

      {/* Staggered doubling grid */}
      <StaggerGrid
        staggerDelay={0.12}
        direction="up"
        className="flex items-center gap-3 sm:gap-4 mb-8 flex-wrap justify-center"
      >
        {doublings.map((n) => (
          <div
            key={n}
            className={`border-4 border-primary px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              n === 128 ? "bg-brutal-cyan" : "bg-muted"
            }`}
          >
            <p className={`${ARCADE} text-lg sm:text-xl text-foreground`}>{n}</p>
          </div>
        ))}
      </StaggerGrid>

      <motion.p
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl text-brutal-pink`}
      >
        3.5% TIPPING POINT
      </motion.p>
    </div>
  );
}
