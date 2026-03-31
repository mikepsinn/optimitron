"use client";

import { useReducedMotion, motion } from "framer-motion";
import { CountUp } from "@/components/animations/CountUp";

const ARCADE = "font-pixel";

interface StatRow {
  label: string;
  left: string;
  right: string;
  rightCountUp?: { value: number; prefix?: string; suffix?: string };
}

const STAT_ROWS: StatRow[] = [
  { label: "COST", left: "$41,000/patient", right: "$929/patient", rightCountUp: { value: 929, prefix: "$", suffix: "/patient" } },
  { label: "TIME", left: "8.2 yrs after proven safe", right: "Real-time" },
  { label: "CAPACITY", left: "1.9M slots/yr", right: "23.4M slots/yr" },
  { label: "CURES", left: "15 diseases/yr", right: "All in 36 years" },
  { label: "DEATHS", left: "102 million", right: "Zero" },
  { label: "ACCOUNTABILITY", left: "Executives jailed: 0", right: "Code is auditable." },
];

/** dFDA slide — Traditional FDA vs Decentralized FDA side-by-side duel */
export default function DfdaSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-2 sm:px-8 overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full max-w-4xl mb-3 sm:mb-5">
        <motion.div
          initial={reduced ? false : { y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="border-4 border-primary bg-muted px-2 py-2 sm:px-6 sm:py-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-[10px] sm:text-sm md:text-base text-muted-foreground uppercase`}>
            TRADITIONAL FDA
          </p>
        </motion.div>
        <motion.div
          initial={reduced ? false : { y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="border-4 border-primary bg-brutal-cyan px-2 py-2 sm:px-6 sm:py-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-[10px] sm:text-sm md:text-base text-brutal-cyan-foreground uppercase`}>
            DECENTRALIZED FDA
          </p>
        </motion.div>
      </div>

      {/* Stat rows — each row animates in simultaneously left-to-right */}
      <div className="w-full max-w-4xl space-y-2 sm:space-y-3">
        {STAT_ROWS.map((row, i) => (
          <div key={row.label} className="grid grid-cols-2 gap-2 sm:gap-4">
            {/* Left card (crumbling / muted) */}
            <motion.div
              initial={reduced ? false : { x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.12 }}
              className="border-4 border-primary bg-muted px-2 py-1.5 sm:px-4 sm:py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left"
            >
              <p className={`${ARCADE} text-[8px] sm:text-[10px] text-muted-foreground uppercase mb-0.5`}>
                {row.label}
              </p>
              <p className="text-[10px] sm:text-sm font-bold text-foreground opacity-50">
                {row.left}
              </p>
            </motion.div>

            {/* Right card (gleaming / cyan) */}
            <motion.div
              initial={reduced ? false : { x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.12 }}
              className="border-4 border-primary bg-brutal-cyan px-2 py-1.5 sm:px-4 sm:py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left"
            >
              <p className={`${ARCADE} text-[8px] sm:text-[10px] text-brutal-cyan-foreground uppercase mb-0.5`}>
                {row.label}
              </p>
              <p className="text-[10px] sm:text-sm font-bold text-foreground">
                {row.rightCountUp ? (
                  <CountUp
                    value={row.rightCountUp.value}
                    prefix={row.rightCountUp.prefix}
                    suffix={row.rightCountUp.suffix}
                    duration={1.5}
                  />
                ) : (
                  row.right
                )}
              </p>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
