"use client";

import { motion, useReducedMotion } from "framer-motion";
import { StaggerGrid } from "@/components/animations/StaggerGrid";
import { CountUp } from "@/components/animations/CountUp";

const ARCADE = "font-pixel";

/** 16. Architecture stats slide — staggered stat blocks filling viewport */
export default function ArchitectureStatsSlide() {
  const reduced = useReducedMotion();
  const stats = [
    { value: 15, label: "PACKAGES", color: "bg-brutal-cyan" },
    { value: 2600, label: "TESTS", color: "bg-brutal-pink", suffix: "+" },
    { value: 100, label: "OPEN SOURCE", color: "bg-brutal-yellow", suffix: "%" },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 overflow-hidden">
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl text-foreground uppercase mb-12`}
      >
        UNDER THE HOOD
      </motion.h2>
      <StaggerGrid
        staggerDelay={0.2}
        direction="up"
        className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12"
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className={`${s.color} border-4 border-primary px-12 sm:px-16 py-8 sm:py-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
          >
            <p className={`${ARCADE} text-5xl sm:text-6xl md:text-7xl text-foreground mb-3 leading-none`}>
              <CountUp value={s.value} duration={1.5} suffix={s.suffix} />
            </p>
            <p className={`${ARCADE} text-sm sm:text-base text-foreground uppercase tracking-wider`}>
              {s.label}
            </p>
          </div>
        ))}
      </StaggerGrid>
    </div>
  );
}
