"use client";

import { useReducedMotion, motion } from "framer-motion";
import { StaggerGrid } from "@/components/animations/StaggerGrid";
import { VOTE_TOKEN_VALUE, fmtParam } from "@optimitron/data/parameters";

const ARCADE = "font-[family-name:var(--font-arcade)]";

const VOTING_ITEMS = [
  "Drive to polling station",
  "Wait in line",
  "1 in 30M chance",
  "Winner ignores you",
  "Cost: free",
  "Reward: nothing",
];

const GAME_ITEMS = [
  "Click buttons on website",
  "30 seconds",
  `Each point worth ${fmtParam(VOTE_TOKEN_VALUE)}`,
  "Everyone gets 10× richer",
  "Cost: free",
  "Reward: $15.7M",
];

/** Level share slide — regular voting vs playing this game, side by side */
export default function LevelShareSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden">
      {/* Level badge */}
      <motion.div
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-brutal-yellow border-4 border-primary px-6 py-2 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <p className={`${ARCADE} text-sm sm:text-base text-foreground uppercase`}>LEVEL 3</p>
      </motion.div>

      <motion.h2
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className={`${ARCADE} text-lg sm:text-xl md:text-2xl text-foreground uppercase mb-6`}
      >
        GET YOUR FRIENDS TO PLAY
      </motion.h2>

      {/* Side by side comparison */}
      <StaggerGrid
        staggerDelay={0.15}
        direction="up"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl"
      >
        {/* LEFT: Regular Voting (greyed out) */}
        <div className="bg-muted border-4 border-primary px-4 py-4 sm:px-6 sm:py-6 opacity-70">
          <p className={`${ARCADE} text-base sm:text-lg text-muted-foreground uppercase mb-4`}>
            🗳 REGULAR VOTING
          </p>
          <div className="space-y-2 text-left">
            {VOTING_ITEMS.map((item) => (
              <p
                key={item}
                className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground uppercase leading-relaxed`}
              >
                {item}
              </p>
            ))}
          </div>
          {/* Punchline */}
          <div className="border-t-4 border-primary mt-4 pt-3">
            <p className={`${ARCADE} text-xs sm:text-sm text-muted-foreground uppercase font-black`}>
              PEOPLE WHO DO THIS:
            </p>
            <p className={`${ARCADE} text-xl sm:text-2xl md:text-3xl text-muted-foreground font-black`}>
              4B
            </p>
          </div>
        </div>

        {/* RIGHT: Playing This Game (glowing) */}
        <div className="bg-brutal-yellow border-4 border-primary px-4 py-4 sm:px-6 sm:py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className={`${ARCADE} text-base sm:text-lg text-foreground uppercase mb-4`}>
            🎮 PLAYING THIS GAME
          </p>
          <div className="space-y-2 text-left">
            {GAME_ITEMS.map((item) => (
              <p
                key={item}
                className={`${ARCADE} text-[10px] sm:text-xs text-foreground uppercase leading-relaxed`}
              >
                {item}
              </p>
            ))}
          </div>
          {/* Punchline */}
          <div className="border-t-4 border-primary mt-4 pt-3">
            <p className={`${ARCADE} text-xs sm:text-sm text-foreground uppercase font-black`}>
              PEOPLE NEEDED:
            </p>
            <motion.p
              animate={reduced ? {} : { scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={`${ARCADE} text-xl sm:text-2xl md:text-3xl text-foreground font-black`}
            >
              4B
            </motion.p>
          </div>
        </div>
      </StaggerGrid>

      {/* Bottom insight */}
      <motion.p
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
        className={`${ARCADE} text-[10px] sm:text-xs text-brutal-pink uppercase mt-6 max-w-lg`}
      >
        THE SAME PEOPLE. EASIER TASK. BETTER REWARD. THIS IS NOT A MARKETING CHALLENGE. IT IS ARITHMETIC.
      </motion.p>
    </div>
  );
}
