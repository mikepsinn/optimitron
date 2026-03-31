"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GameCTA } from "@/components/ui/game-cta";
import { CTA } from "@/lib/messaging";
import { PulseGlow } from "@/components/animations/PulseGlow";

const ARCADE = "font-pixel";

/** 17. Close slide — alignment software for human-made AIs */
export default function CloseSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden">
      <motion.p
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`${ARCADE} text-xl sm:text-2xl md:text-3xl lg:text-4xl text-foreground uppercase leading-relaxed mb-4 max-w-5xl`}
      >
        ALIGNMENT SOFTWARE FOR THE MOST POWERFUL AIs ON YOUR PLANET
      </motion.p>
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className={`${ARCADE} text-lg sm:text-xl md:text-2xl text-brutal-pink uppercase mb-10`}
      >
        — THE ONES MADE OF PEOPLE
      </motion.p>
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
        className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
      >
        <PulseGlow color="rgba(255,105,180,0.3)">
          <GameCTA href="/#vote" variant="primary" size="lg">
            {CTA.playNow}
          </GameCTA>
        </PulseGlow>
        <GameCTA href="/prize" variant="secondary" size="lg">
          {CTA.seeTheMath}
        </GameCTA>
      </motion.div>
    </div>
  );
}
