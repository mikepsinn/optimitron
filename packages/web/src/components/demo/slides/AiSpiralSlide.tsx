"use client";

import { useReducedMotion, motion } from "framer-motion";
import { ScanLines, GlitchText } from "@/components/animations/GlitchText";
import { CountUp } from "@/components/animations/CountUp";

const ARCADE = "font-pixel";

const LOOP_STEPS = [
  { label: "STEAL $$$", icon: "💰" },
  { label: "BUY COMPUTE", icon: "🖥" },
  { label: "TRAIN MORE HACKERS", icon: "🤖" },
];

const STATS = [
  { label: "North Korea crypto theft (2025)", value: "$2B" },
  { label: "FBI cybercrimes (2024)", value: "$16.6B" },
];

/** 7. AI spiral slide — recursive exponential theft loop */
export default function AiSpiralSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden bg-foreground">
      <ScanLines />

      {/* Heading */}
      <GlitchText intensity="high">
        <h1
          className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-brutal-red leading-none mb-6`}
        >
          RECURSIVE EXPONENTIAL THEFT
        </h1>
      </GlitchText>

      {/* AI hacker counter */}
      <div className="mb-6">
        <p
          className={`${ARCADE} text-sm sm:text-base text-background uppercase tracking-wider mb-2`}
        >
          AI HACKERS ONLINE
        </p>
        <CountUp
          value={1_000_000}
          duration={3}
          className={`${ARCADE} text-5xl sm:text-6xl md:text-7xl text-brutal-red`}
        />
      </div>

      {/* Flow diagram loop */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0 mb-6 max-w-3xl w-full">
        {LOOP_STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center">
            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.5, duration: 0.4 }}
              className="border-4 border-primary bg-foreground px-3 py-2 sm:px-4 sm:py-3"
            >
              <span className="text-xl sm:text-2xl block mb-1">
                {step.icon}
              </span>
              <span
                className={`${ARCADE} text-xs sm:text-sm text-brutal-red font-black uppercase`}
              >
                {step.label}
              </span>
            </motion.div>
            {/* Arrow between steps */}
            {i < LOOP_STEPS.length - 1 && (
              <motion.span
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 + i * 0.5, duration: 0.3 }}
                className={`${ARCADE} text-brutal-red text-xl sm:text-2xl mx-1 sm:mx-2 hidden sm:block`}
              >
                {"\u2192"}
              </motion.span>
            )}
          </div>
        ))}
        {/* Loop-back arrow */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.5 }}
          className="sm:ml-2"
        >
          <span
            className={`${ARCADE} text-brutal-red text-xl sm:text-2xl`}
          >
            {"\u21BA"}
          </span>
        </motion.div>
      </div>

      {/* Loop label */}
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 0.5 }}
        className="border-4 border-primary bg-brutal-red px-4 py-2 mb-6"
      >
        <span
          className={`${ARCADE} text-xs sm:text-sm text-brutal-red-foreground font-black uppercase tracking-widest`}
        >
          INFINITE LOOP
        </span>
      </motion.div>

      {/* Stats */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={reduced ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.2 + i * 0.3, duration: 0.4 }}
            className="border-4 border-primary bg-foreground px-4 py-3"
          >
            <span
              className={`${ARCADE} text-xl sm:text-2xl text-brutal-yellow block mb-1`}
            >
              {stat.value}
            </span>
            <span className="text-xs sm:text-sm text-background font-bold uppercase">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
