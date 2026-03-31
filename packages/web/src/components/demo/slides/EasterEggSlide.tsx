"use client";

import { useReducedMotion, motion } from "framer-motion";

const ARCADE = "font-pixel";

/** Post-credits easter egg — pure black, one devastating line */
export default function EasterEggSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-8 bg-foreground overflow-hidden">
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className={`${ARCADE} text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl`}
      >
        Oh, and if you&apos;re wondering — yes, this is the actual game.
        You&apos;re playing it right now. The demo was level one.
      </motion.p>
    </div>
  );
}
