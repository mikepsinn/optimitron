"use client";

import { useReducedMotion, motion } from "framer-motion";
import { CountUp } from "@/components/animations/CountUp";
import {
  TREATY_PERSONAL_UPSIDE_BLEND,
  TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
} from "@optimitron/data/parameters";

const ARCADE = "font-[family-name:var(--font-arcade)]";
const treatyIncome = Math.round(TREATY_PERSONAL_UPSIDE_BLEND.value);
const treatyMultiplier = Math.round(TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER.value);

const SLOTS = [
  {
    id: 1,
    label: "STATUS QUO",
    tag: "[LOADED]",
    bg: "bg-muted",
    textColor: "text-muted-foreground",
    shadow: "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
    scale: "scale-[0.95]",
    income: 1_340_000,
    incomePrefix: "$",
    incomeSuffix: "",
    multiplier: "",
    hale: "+0 years",
    dysfunction: "-$12,600/yr",
  },
  {
    id: 2,
    label: "1% TREATY",
    tag: "\u25C4\u25C4\u25C4",
    bg: "bg-brutal-yellow",
    textColor: "text-foreground",
    shadow: "shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]",
    scale: "scale-100",
    income: treatyIncome,
    incomePrefix: "$",
    incomeSuffix: "",
    multiplier: ` (${treatyMultiplier}\u00D7)`,
    hale: "+6.5 years",
    dysfunction: "eliminated",
  },
  {
    id: 3,
    label: "WISHONIA TRAJECTORY",
    tag: "",
    bg: "bg-brutal-cyan",
    textColor: "text-foreground",
    shadow: "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
    scale: "scale-[0.97]",
    income: 54_300_000,
    incomePrefix: "$",
    incomeSuffix: "",
    multiplier: " (40\u00D7)",
    hale: "+15.7 years",
    dysfunction: "what is that",
  },
];

/** Personal Upside slide — TREATY_PERSONAL_UPSIDE_BLEND climax with three save-game slots */
export default function PersonalUpsideSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden">
      {/* Title */}
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-lg sm:text-xl md:text-2xl text-foreground uppercase mb-6`}
      >
        &#x1F4BE; SAVE SLOTS &mdash; CHOOSE YOUR TIMELINE
      </motion.h2>

      {/* Slot cards */}
      <div className="w-full max-w-xl space-y-4 mb-6">
        {SLOTS.map((slot, i) => (
          <motion.div
            key={slot.id}
            initial={reduced ? false : { opacity: 0, x: i === 0 ? -40 : i === 2 ? 40 : 0, y: i === 1 ? 20 : 0 }}
            animate={{ opacity: slot.id === 1 ? 0.7 : 1, x: 0, y: 0 }}
            transition={{ delay: 0.3 + i * 0.25, duration: 0.4, type: "spring" }}
            className={`${slot.bg} ${slot.scale} border-4 border-primary ${slot.shadow} p-3 sm:p-4 text-left transition-transform ${
              slot.id === 2 ? "ring-2 ring-brutal-yellow ring-offset-2 ring-offset-background" : ""
            }`}
          >
            {/* Slot header */}
            <div className="flex items-center justify-between mb-2">
              <p className={`${ARCADE} text-xs sm:text-sm ${slot.textColor} uppercase`}>
                SLOT {slot.id}: {slot.label}
              </p>
              {slot.tag && (
                <span
                  className={`${ARCADE} text-[10px] sm:text-xs ${
                    slot.id === 2 ? "text-brutal-pink" : slot.textColor
                  }`}
                  style={slot.id === 2 ? { animation: "tag-pulse 1.2s step-end infinite" } : undefined}
                >
                  {slot.tag}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <span className={`${ARCADE} text-[10px] sm:text-xs ${slot.textColor} uppercase`}>
                  Lifetime income:
                </span>
                <span className={`${ARCADE} text-sm sm:text-base ${
                  slot.id === 2 ? "text-foreground" : slot.textColor
                }`}>
                  {slot.id >= 2 ? (
                    <>
                      <CountUp
                        value={slot.income}
                        prefix={slot.incomePrefix}
                        suffix={slot.incomeSuffix}
                        duration={slot.id === 2 ? 2 : 1.5}
                      />
                      <span className={`${ARCADE} text-[10px] sm:text-xs`}>
                        {slot.multiplier}
                      </span>
                    </>
                  ) : (
                    `$1.34M`
                  )}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className={`${ARCADE} text-[10px] sm:text-xs ${slot.textColor} uppercase`}>
                  HALE gain:
                </span>
                <span className={`${ARCADE} text-xs sm:text-sm ${slot.textColor}`}>
                  {slot.hale}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className={`${ARCADE} text-[10px] sm:text-xs ${slot.textColor} uppercase`}>
                  Dysfunction tax:
                </span>
                <span className={`${ARCADE} text-xs sm:text-sm ${
                  slot.id === 1 ? "text-brutal-red" : slot.textColor
                }`}>
                  {slot.dysfunction}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.4 }}
        className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground leading-relaxed`}
      >
        You are currently on Slot 1. You chose it by not choosing.
      </motion.p>

      <style>{`
        @keyframes tag-pulse {
          from, to { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
