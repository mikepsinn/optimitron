"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PulseGlow } from "@/components/animations/PulseGlow";
import { playWishFanfare } from "@/lib/wish-sound";

const ARCADE = "font-pixel";

/** 7. Wishonia slide — NEW GAME+, burst of light after darkness */
export default function WishoniaSlideComponent() {
  const reduced = useReducedMotion();
  useEffect(() => {
    playWishFanfare();
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 bg-brutal-cyan overflow-hidden">
      <PulseGlow color="rgba(0,224,255,0.4)">
        <h1 className={`${ARCADE} text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] text-foreground leading-none mb-8`}>
          NEW GAME+
        </h1>
      </PulseGlow>
      <motion.p
        initial={reduced ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className={`${ARCADE} text-xl sm:text-2xl md:text-3xl text-foreground uppercase tracking-wider`}
      >
        4,297 YEARS OF GOOD GOVERNANCE
      </motion.p>
    </div>
  );
}
