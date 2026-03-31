"use client";

import { useReducedMotion, motion } from "framer-motion";
import { ScanLines, GlitchText } from "@/components/animations/GlitchText";

const ARCADE = "font-pixel";

const CITY_BEFORE = ["🏢", "🏥", "🏫", "🏦", "🏭", "🏗", "🏢", "🏥", "🏫", "🏦", "🏭", "🏗"];
const CITY_AFTER = ["💀", "🔥", "🏚", "💀", "🔥", "🏚", "💀", "🔥", "🏚", "💀", "🔥", "🏚"];

const EXAMPLES = ["SOMALIA", "VENEZUELA", "LEBANON"];

/** 6. Failed state slide — what happens when stealing > producing */
export default function FailedStateSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden bg-foreground">
      <ScanLines />

      {/* Heading */}
      <GlitchText intensity="medium">
        <h1
          className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-brutal-red leading-none mb-8`}
        >
          GLOBAL FAILED STATE
        </h1>
      </GlitchText>

      {/* City decay grid */}
      <div className="grid grid-cols-6 gap-2 sm:gap-3 mb-8 max-w-md">
        {CITY_BEFORE.map((emoji, i) => (
          <motion.div
            key={i}
            className="text-2xl sm:text-3xl md:text-4xl"
            initial={reduced ? false : { opacity: 1 }}
            animate={{ opacity: 1 }}
          >
            {/* Before state */}
            <motion.span
              initial={reduced ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.3 }}
              className="absolute"
            >
              {emoji}
            </motion.span>
            {/* After state — decayed */}
            <motion.span
              initial={reduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.15, duration: 0.3 }}
            >
              {CITY_AFTER[i]}
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* Country examples */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6">
        {EXAMPLES.map((country, i) => (
          <motion.div
            key={country}
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5 + i * 0.3, duration: 0.4 }}
            className="border-4 border-primary px-4 py-2 bg-brutal-red"
          >
            <span
              className={`${ARCADE} text-sm sm:text-base md:text-lg text-brutal-red-foreground font-black uppercase`}
            >
              {country}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Closing text */}
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5, duration: 0.8 }}
        className="max-w-2xl text-sm sm:text-base md:text-lg text-background font-bold uppercase leading-relaxed tracking-wide"
      >
        When destruction exceeds production, nothing gets built.
        <br />
        Nothing gets maintained.{" "}
        <span className="text-brutal-red">Nothing gets cured.</span>
      </motion.p>
    </div>
  );
}
