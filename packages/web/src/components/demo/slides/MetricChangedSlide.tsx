"use client";

import { useReducedMotion, motion } from "framer-motion";
import { ScanLines } from "@/components/animations/GlitchText";

const ARCADE = "font-pixel";

/** Metric Changed slide — single devastating punchline, mic drop */
export default function MetricChangedSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden bg-foreground">
      <ScanLines />

      <div className="flex flex-col items-center gap-6 sm:gap-10 max-w-3xl">
        {/* Old metric with strikethrough */}
        <div className="relative inline-block">
          <motion.p
            initial={reduced ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-background/60 uppercase`}
          >
            RE-ELECTION PROBABILITY
          </motion.p>
          {/* Red strikethrough line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.0, duration: 0.6, ease: "easeInOut" }}
            className="absolute top-1/2 left-0 w-full h-1 sm:h-1.5 bg-brutal-red"
            style={{ transformOrigin: "left" }}
          />
        </div>

        {/* New metric — typewriter reveal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-brutal-cyan uppercase`}
          >
            CITIZEN ALIGNMENT SCORE
          </motion.p>
        </motion.div>

        {/* Devastating line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1.0 }}
          className="text-base sm:text-lg md:text-xl font-bold text-background/80 max-w-xl leading-relaxed"
        >
          Your leaders are not evil. They are just optimising for the wrong
          metric. We changed the metric.
        </motion.p>
      </div>
    </div>
  );
}
