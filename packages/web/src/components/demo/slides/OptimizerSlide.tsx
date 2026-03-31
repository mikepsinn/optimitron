"use client";

import { useReducedMotion, motion } from "framer-motion";

const ARCADE = "font-pixel";

interface BudgetRow {
  category: string;
  currentValue: string;
  currentDetail: string;
  optimizedValue: string;
  optimizedDetail: string;
}

const BUDGET_ROWS: BudgetRow[] = [
  {
    category: "HEALTHCARE",
    currentValue: "$4.5T",
    currentDetail: "Ranked 37th",
    optimizedValue: "$1.1T",
    optimizedDetail: "Ranked 1st",
  },
  {
    category: "DEFENSE",
    currentValue: "$886B",
    currentDetail: "13 wars",
    optimizedValue: "$200B",
    optimizedDetail: "0 wars needed",
  },
  {
    category: "EDUCATION",
    currentValue: "$800B",
    currentDetail: "Declining",
    optimizedValue: "$600B",
    optimizedDetail: "+40% outcomes",
  },
];

/** Optimizer slide — OPG + OBG combined, policy and budget comparison */
export default function OptimizerSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-2 sm:px-8 overflow-hidden">
      {/* Title */}
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-sm sm:text-xl md:text-2xl lg:text-3xl text-foreground uppercase mb-4 sm:mb-6`}
      >
        THE OPTIMIZER: POLICIES &amp; BUDGETS
      </motion.h2>

      {/* Policy comparison — Portugal vs USA */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="w-full max-w-3xl mb-4 sm:mb-6"
      >
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="border-4 border-primary bg-brutal-cyan px-2 py-2 sm:px-4 sm:py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left">
            <p className={`${ARCADE} text-[10px] sm:text-xs text-brutal-cyan-foreground uppercase mb-1`}>
              PORTUGAL
            </p>
            <p className="text-[10px] sm:text-sm font-bold text-foreground">
              Decriminalized drugs, 2001
            </p>
            <p className={`${ARCADE} text-sm sm:text-xl text-foreground mt-1`}>
              Overdose deaths: &minus;80%
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-red px-2 py-2 sm:px-4 sm:py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left">
            <p className={`${ARCADE} text-[10px] sm:text-xs text-brutal-red-foreground uppercase mb-1`}>
              USA
            </p>
            <p className="text-[10px] sm:text-sm font-bold text-foreground">
              War on Drugs, $47B/yr
            </p>
            <p className={`${ARCADE} text-sm sm:text-xl text-foreground mt-1`}>
              Overdose deaths: +1,700%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Budget table — USA Current vs USA Optimized */}
      <div className="w-full max-w-3xl">
        {/* Table headers */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-2">
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="border-4 border-primary bg-muted px-2 py-1 sm:px-4 sm:py-2"
          >
            <p className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground uppercase`}>
              USA CURRENT
            </p>
          </motion.div>
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.3 }}
            className="border-4 border-primary bg-brutal-yellow px-2 py-1 sm:px-4 sm:py-2"
          >
            <p className={`${ARCADE} text-[10px] sm:text-xs text-brutal-yellow-foreground uppercase`}>
              USA OPTIMIZED
            </p>
          </motion.div>
        </div>

        {/* Budget rows */}
        <div className="space-y-1.5 sm:space-y-2">
          {BUDGET_ROWS.map((row, i) => (
            <div key={row.category} className="grid grid-cols-2 gap-2 sm:gap-4">
              {/* Current */}
              <motion.div
                initial={reduced ? false : { x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.12, duration: 0.4 }}
                className="border-4 border-primary bg-muted px-2 py-1.5 sm:px-4 sm:py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left opacity-50"
              >
                <p className={`${ARCADE} text-[8px] sm:text-[10px] text-muted-foreground uppercase`}>
                  {row.category}
                </p>
                <p className={`${ARCADE} text-xs sm:text-base text-foreground`}>
                  {row.currentValue}
                </p>
                <p className="text-[9px] sm:text-xs font-bold text-muted-foreground">
                  {row.currentDetail}
                </p>
              </motion.div>

              {/* Optimized */}
              <motion.div
                initial={reduced ? false : { x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.65 + i * 0.12, duration: 0.4 }}
                className="border-4 border-primary bg-brutal-yellow px-2 py-1.5 sm:px-4 sm:py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left"
              >
                <p className={`${ARCADE} text-[8px] sm:text-[10px] text-brutal-yellow-foreground uppercase`}>
                  {row.category}
                </p>
                <p className={`${ARCADE} text-xs sm:text-base text-foreground`}>
                  {row.optimizedValue}
                </p>
                <p className="text-[9px] sm:text-xs font-bold text-foreground">
                  {row.optimizedDetail}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="mt-4 sm:mt-6 border-4 border-primary bg-foreground px-4 sm:px-8 py-2 sm:py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <p className={`${ARCADE} text-[10px] sm:text-xs md:text-sm text-background uppercase`}>
          Less money, better outcomes. On every line item.
        </p>
      </motion.div>
    </div>
  );
}
