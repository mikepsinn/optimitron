"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ScanLines } from "@/components/animations/GlitchText";

const ARCADE = "font-pixel";

/** 10. Pluralistic ignorance slide — wave of dots from center, dark bg */
export default function PluralisiticIgnoranceSlide() {
  const reduced = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const DOTS = 300;
  const COLS = 20;

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Compute distance from center for wave effect
  const centerRow = Math.floor((DOTS / COLS) / 2);
  const centerCol = Math.floor(COLS / 2);

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 bg-foreground overflow-hidden">
      <ScanLines />
      <motion.h2
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl text-brutal-cyan uppercase mb-8`}
      >
        EVERYONE WANTS THIS
      </motion.h2>
      <div
        className="grid gap-1.5 sm:gap-2 max-w-4xl w-full"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
        {Array.from({ length: DOTS }, (_, i) => {
          const row = Math.floor(i / COLS);
          const col = i % COLS;
          const dist = Math.sqrt(Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2));
          const maxDist = Math.sqrt(Math.pow(centerRow, 2) + Math.pow(centerCol, 2));
          const delay = (dist / maxDist) * 600; // wave from center

          return (
            <div
              key={i}
              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-500 ${
                revealed ? "bg-brutal-cyan scale-110" : "bg-muted-foreground"
              }`}
              style={{
                transitionDelay: revealed ? `${delay}ms` : "0ms",
              }}
            />
          );
        })}
      </div>
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.4 }}
        className={`${ARCADE} text-xs sm:text-sm text-muted-foreground uppercase mt-6 tracking-wider`}
      >
        THEY JUST COULDN&apos;T SEE EACH OTHER
      </motion.p>
    </div>
  );
}
