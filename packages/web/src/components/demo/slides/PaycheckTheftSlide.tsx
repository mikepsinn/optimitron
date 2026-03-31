"use client";

import { useReducedMotion, motion } from "framer-motion";
import { ScanLines, GlitchText } from "@/components/animations/GlitchText";
import { CountUp } from "@/components/animations/CountUp";

const ARCADE = "font-pixel";

const THEFT_DESTINATIONS = [
  "ENDLESS WAR",
  "BANK BAILOUTS",
  "MILITARY CONTRACTORS",
];

/** 8. Paycheck theft slide — central bank devaluation since 1913 */
export default function PaycheckTheftSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden bg-foreground">
      <ScanLines />

      {/* Two numbers side by side */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 md:gap-12 mb-6">
        {/* Ghost — what you SHOULD earn */}
        <motion.div
          initial={reduced ? false : { opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <p
            className={`${ARCADE} text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-2`}
          >
            SHOULD EARN
          </p>
          <CountUp
            value={528_000}
            prefix="$"
            duration={2}
            className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-muted-foreground`}
          />
        </motion.div>

        {/* VS divider */}
        <motion.span
          initial={reduced ? false : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.3 }}
          className={`${ARCADE} text-2xl sm:text-3xl text-brutal-red`}
        >
          VS
        </motion.span>

        {/* Actual — what you DO earn */}
        <motion.div
          initial={reduced ? false : { opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <p
            className={`${ARCADE} text-xs sm:text-sm text-background uppercase tracking-wider mb-2`}
          >
            ACTUALLY EARN
          </p>
          <CountUp
            value={77_500}
            prefix="$"
            duration={2}
            className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-background`}
          />
        </motion.div>
      </div>

      {/* Arrow showing where the money went */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.5 }}
        className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6"
      >
        <span
          className={`${ARCADE} text-base sm:text-lg text-brutal-red`}
        >
          {"\u2192"}
        </span>
        {THEFT_DESTINATIONS.map((dest, i) => (
          <span key={dest} className="flex items-center gap-2 sm:gap-3">
            <span
              className={`${ARCADE} text-xs sm:text-sm md:text-base text-brutal-red font-black uppercase`}
            >
              {dest}
            </span>
            {i < THEFT_DESTINATIONS.length - 1 && (
              <span
                className={`${ARCADE} text-base sm:text-lg text-brutal-red`}
              >
                {"\u2192"}
              </span>
            )}
          </span>
        ))}
      </motion.div>

      {/* 97% stat */}
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 0.6 }}
        className="border-4 border-primary bg-brutal-red px-6 py-3 mb-4"
      >
        <GlitchText intensity="low">
          <span
            className={`${ARCADE} text-lg sm:text-xl md:text-2xl text-brutal-red-foreground font-black uppercase`}
          >
            97% OF PURCHASING POWER DESTROYED
          </span>
        </GlitchText>
      </motion.div>

      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.3, duration: 0.5 }}
        className="text-xs sm:text-sm text-muted-foreground font-bold uppercase tracking-wide"
      >
        SINCE 1913 &mdash; THEY CALL IT &ldquo;MONETARY POLICY&rdquo;
      </motion.p>
    </div>
  );
}
