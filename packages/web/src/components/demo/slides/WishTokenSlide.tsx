"use client";

import { useReducedMotion, motion } from "framer-motion";

const ARCADE = "font-pixel";

const REPLACEMENTS = [
  {
    old: {
      icon: "\uD83C\uDFDB",
      label: "THE IRS",
      stats: ["74,000 pages", "83,000 people"],
    },
    new: {
      icon: "\uD83D\uDCDC",
      label: "0.5% TX TAX",
      stats: ["4 lines of code", "0 employees"],
    },
  },
  {
    old: {
      icon: "\uD83C\uDFDB",
      label: "WELFARE",
      stats: ["83 programs", "6 agencies"],
    },
    new: {
      icon: "\uD83D\uDCDC",
      label: "UBI VIA WORLD ID",
      stats: ["automatic", "no bureaucracy"],
    },
  },
  {
    old: {
      icon: "\uD83C\uDFDB",
      label: "FED RESERVE",
      stats: ["-97% since 1913"],
    },
    new: {
      icon: "\uD83D\uDCDC",
      label: "0% INFLATION",
      stats: ["algorithmic", "productivity-anchored"],
    },
  },
] as const;

/** $WISH Token slide — three government replacements */
export default function WishTokenSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden">
      {/* Title */}
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-xl sm:text-2xl md:text-3xl text-foreground uppercase mb-8`}
      >
        THE $WISH TOKEN
      </motion.h2>

      {/* Replacement rows */}
      <div className="w-full max-w-3xl space-y-4 mb-8">
        {REPLACEMENTS.map((row, i) => (
          <motion.div
            key={row.old.label}
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.3, duration: 0.4 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4"
          >
            {/* Old system */}
            <div className="flex-1 border-4 border-primary bg-muted p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className={`${ARCADE} text-xs sm:text-sm text-muted-foreground uppercase mb-1`}>
                {row.old.icon} {row.old.label}
              </p>
              {row.old.stats.map((stat) => (
                <p
                  key={stat}
                  className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground`}
                >
                  {stat}
                </p>
              ))}
            </div>

            {/* Arrow */}
            <motion.span
              initial={reduced ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.3, type: "spring" }}
              className={`${ARCADE} text-xl sm:text-2xl text-foreground flex-shrink-0 self-center`}
            >
              &rarr;
            </motion.span>

            {/* New system */}
            <div className="flex-1 border-4 border-primary bg-brutal-yellow p-3 sm:p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className={`${ARCADE} text-xs sm:text-sm text-foreground uppercase mb-1`}>
                {row.new.icon} {row.new.label}
              </p>
              {row.new.stats.map((stat) => (
                <p
                  key={stat}
                  className={`${ARCADE} text-[10px] sm:text-xs text-foreground`}
                >
                  {stat}
                </p>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.4 }}
        className={`${ARCADE} text-[10px] sm:text-xs text-foreground leading-relaxed max-w-xl`}
      >
        Tax + Welfare + Money = 3 smart contracts.
        <br />
        Your government uses 200,000 employees.
      </motion.p>
    </div>
  );
}
