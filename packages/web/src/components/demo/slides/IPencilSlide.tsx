"use client";

import { useState, useEffect } from "react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import { CountUp } from "@/components/animations/CountUp";
import { ScanLines } from "@/components/animations/GlitchText";

const ARCADE = "font-pixel";

const PENCIL_ROLES = [
  { icon: "\uD83E\uDE93", label: "Lumberjack" },
  { icon: "\u26CF", label: "Miner" },
  { icon: "\uD83C\uDFED", label: "Factory" },
  { icon: "\uD83C\uDFA8", label: "Painter" },
] as const;

const CURE_ROLES = [
  { icon: "\uD83D\uDCBB", label: "Developer" },
  { icon: "\uD83D\uDC69\u200D\u2695\uFE0F", label: "Doctor" },
  { icon: "\uD83D\uDCCA", label: "Data Scientist" },
  { icon: "\uD83C\uDFE5", label: "Patient" },
] as const;

/** IPencil / Billions of Brains slide — I, Pencil argument */
export default function IPencilSlide() {
  const reduced = useReducedMotion();
  const [morphed, setMorphed] = useState(false);

  useEffect(() => {
    if (reduced) {
      setMorphed(true);
      return;
    }
    const timer = setTimeout(() => setMorphed(true), 2500);
    return () => clearTimeout(timer);
  }, [reduced]);

  const roles = morphed ? CURE_ROLES : PENCIL_ROLES;

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden bg-foreground">
      <ScanLines />

      {/* Title */}
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-xl sm:text-2xl md:text-3xl text-background uppercase mb-8`}
      >
        BILLIONS OF BRAINS
      </motion.h2>

      {/* Center icon + supply chain */}
      <motion.div
        initial={reduced ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="relative mb-8"
      >
        {/* Central icon */}
        <div className="flex items-center justify-center mb-6">
          <AnimatePresence mode="wait">
            <motion.span
              key={morphed ? "cure" : "pencil"}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5 }}
              className="text-6xl sm:text-7xl"
            >
              {morphed ? "\uD83E\uDDEA" : "\u270F\uFE0F"}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Role labels radiating out */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {roles.map((role, i) => (
              <motion.div
                key={`${morphed ? "c" : "p"}-${role.label}`}
                initial={reduced ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: morphed ? i * 0.1 : 0.5 + i * 0.15, duration: 0.3 }}
                className="border-4 border-background/30 bg-background/10 p-2 sm:p-3"
              >
                <span className="text-xl sm:text-2xl">{role.icon}</span>
                <p className={`${ARCADE} text-[10px] sm:text-xs text-brutal-cyan mt-1`}>
                  {role.label}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Stat boxes */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: morphed ? 0.5 : 1.5, duration: 0.4 }}
        className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 mb-6"
      >
        {[
          { label: "BRAINS", value: 4_000_000_000, prefix: "" },
          { label: "VOTE VALUE", value: 194_000, prefix: "$" },
          { label: "PRIZE POOL", value: 774, prefix: "$", suffix: "T" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border-4 border-background/30 bg-background/10 px-4 sm:px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <p className={`${ARCADE} text-lg sm:text-xl md:text-2xl text-brutal-cyan leading-none`}>
              <CountUp value={stat.value} prefix={stat.prefix} suffix={stat.suffix} duration={2} />
            </p>
            <p className={`${ARCADE} text-[10px] text-background/70 uppercase mt-1`}>
              {stat.label}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: morphed ? 1.0 : 2.0, duration: 0.4 }}
        className={`${ARCADE} text-xs sm:text-sm text-brutal-cyan leading-relaxed`}
      >
        You do not need a plan. You need an incentive.
      </motion.p>
    </div>
  );
}
