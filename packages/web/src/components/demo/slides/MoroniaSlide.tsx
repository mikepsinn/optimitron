"use client";

import { motion } from "framer-motion";
import { ScanLines, GlitchText } from "@/components/animations/GlitchText";
import { PulseGlow } from "@/components/animations/PulseGlow";

const ARCADE = "font-pixel";

/** 6. Moronia slide — GAME OVER, screen is dying */
export default function MoroniaSlide() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 bg-foreground overflow-hidden">
      <ScanLines />
      {/* Screen shake animation */}
      <motion.div
        animate={{ x: [0, -3, 3, -2, 2, 0], y: [0, 2, -2, 1, -1, 0] }}
        transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 3 }}
        className="flex flex-col items-center"
      >
        <PulseGlow color="rgba(239,68,68,0.6)">
          <h1 className={`${ARCADE} text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] text-brutal-red leading-none mb-6`}>
            GAME OVER
          </h1>
        </PulseGlow>
        <GlitchText intensity="medium">
          <p className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl text-brutal-red leading-none mb-4`}>
            94.7% MATCH
          </p>
        </GlitchText>
        <p className={`${ARCADE} text-lg sm:text-xl md:text-2xl text-background uppercase tracking-wider`}>
          WITH EARTH
        </p>
      </motion.div>
    </div>
  );
}
