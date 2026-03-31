"use client";

import { useReducedMotion, motion } from "framer-motion";
import { ScanLines } from "@/components/animations/GlitchText";

const ARCADE = "font-pixel";

interface PoliticianRow {
  rank: number;
  name: string;
  party: string;
  score: number;
  funded: boolean;
}

const POLITICIANS: PoliticianRow[] = [
  { rank: 1, name: "REP. CHEN", party: "I", score: 94, funded: true },
  { rank: 2, name: "SEN. OKAFOR", party: "D", score: 87, funded: true },
  { rank: 3, name: "REP. VASQUEZ", party: "R", score: 72, funded: true },
  { rank: 4, name: "SEN. WHITFIELD", party: "R", score: 18, funded: false },
  { rank: 5, name: "REP. GRUBER", party: "D", score: 6, funded: false },
];

/** SuperPAC slide — algorithmic politician funding leaderboard */
export default function SuperpacSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden bg-foreground">
      <ScanLines />

      {/* Title */}
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-lg sm:text-2xl md:text-3xl text-background uppercase mb-6 sm:mb-8`}
      >
        THE ALIGNMENT SUPERPAC
      </motion.h2>

      {/* Leaderboard */}
      <div className="w-full max-w-2xl space-y-2 sm:space-y-3 mb-6 sm:mb-8">
        {POLITICIANS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={reduced ? false : { x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
            className={`flex items-center gap-2 sm:gap-4 border-4 border-primary px-3 py-2 sm:px-4 sm:py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              p.funded
                ? "bg-brutal-cyan"
                : "bg-muted opacity-40"
            }`}
          >
            {/* Rank */}
            <span className={`${ARCADE} text-sm sm:text-base text-foreground w-6 sm:w-8 text-left`}>
              #{p.rank}
            </span>

            {/* Name + party */}
            <span className="text-xs sm:text-sm font-bold text-foreground flex-1 text-left">
              {p.name} ({p.party})
            </span>

            {/* Score bar */}
            <div className="w-16 sm:w-24 h-3 sm:h-4 bg-background border-2 border-primary relative">
              <motion.div
                initial={reduced ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.6 }}
                style={{ originX: 0, width: `${p.score}%` }}
                className={`h-full ${p.funded ? "bg-brutal-yellow" : "bg-brutal-red"}`}
              />
            </div>

            {/* Score value */}
            <span className={`${ARCADE} text-xs sm:text-sm ${p.funded ? "text-foreground" : "text-muted-foreground"} w-8 sm:w-10 text-right`}>
              {p.score}%
            </span>

            {/* Coins or nothing */}
            <span className="text-sm sm:text-lg w-6 sm:w-8 text-right">
              {p.funded ? (
                <motion.span
                  initial={reduced ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.15, type: "spring", stiffness: 300 }}
                >
                  &#x1F4B0;
                </motion.span>
              ) : (
                <span className="opacity-30">&mdash;</span>
              )}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Lobbyist replaced by smart contract */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="border-4 border-primary bg-background px-4 sm:px-8 py-3 sm:py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-4"
      >
        <p className="text-sm sm:text-base font-bold text-foreground">
          <span className="line-through opacity-40">LOBBYIST</span>
          <span className="mx-2 sm:mx-3">&rarr;</span>
          <span className="text-brutal-cyan">SMART CONTRACT</span>
        </p>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.4 }}
        className={`${ARCADE} text-[10px] sm:text-xs text-background uppercase`}
      >
        Politicians funded by algorithm, not by dinner.
      </motion.p>
    </div>
  );
}
