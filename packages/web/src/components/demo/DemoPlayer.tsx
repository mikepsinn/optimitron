"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  type DemoSegment,
  getPlaylistSegments,
  PLAYLISTS,
  DEFAULT_PLAYLIST_ID,
} from "@/lib/demo-script";
import { getDemoAudio } from "@/lib/demo-tts";
import { DemoControls } from "./DemoControls";

// Lazy-loaded slide components
import { HumanityScoreboard } from "@/components/shared/HumanityScoreboard";
import { GovernmentLeaderboard } from "@/components/shared/GovernmentLeaderboard";
import { HowToPlaySection } from "@/components/landing/HowToPlaySection";
import { WhyPlaySection } from "@/components/landing/WhyPlaySection";
import { GameCTA } from "@/components/ui/game-cta";
import { CountUp } from "@/components/animations/CountUp";
import { CTA } from "@/lib/messaging";
import { MilitaryVsTrialsPie } from "@/components/shared/MilitaryVsTrialsPie";
import { CollapseCountdownTimer } from "@/components/animations/CollapseCountdownTimer";
import { GdpTrajectoryChart } from "@/components/animations/GdpTrajectoryChart";
import { ViralDoublingChart } from "@/components/shared/ViralDoublingChart";
import { HistoricalWasteComparison } from "@/components/shared/HistoricalWasteComparison";
import { CostEffectivenessComparison } from "@/components/shared/CostEffectivenessComparison";
import { PercentagePointValue } from "@/components/shared/PercentagePointValue";
import { PrizeWorkedExample } from "@/components/prize/PrizeWorkedExample";
import { TrialCostComparison } from "@/components/shared/TrialCostComparison";
import { PersonalUpsideCard } from "@/components/shared/PersonalUpsideCard";
import { GlitchText, ScanLines } from "@/components/animations/GlitchText";
import { PulseGlow } from "@/components/animations/PulseGlow";
import { LiveDeathTicker } from "@/components/animations/LiveDeathTicker";
import { StaggerGrid } from "@/components/animations/StaggerGrid";
// WarVsCuresChart available but uses SectionContainer wrapper — MilitaryVsTrialsPie fits slides better
import { playWishFanfare, playCoinSound } from "@/lib/wish-sound";
import {
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
} from "@/lib/parameters-calculations-citations";

const bgColorMap: Record<string, string> = {
  background: "bg-background",
  foreground: "bg-foreground text-background",
  pink: "bg-brutal-pink",
  cyan: "bg-brutal-cyan",
  yellow: "bg-brutal-yellow",
};

/* ========================================================================
 * SLIDE COMPONENTS — 16-bit RPG cutscene / movie trailer aesthetic
 * Every slide fills the viewport. Minimum text. Maximum drama.
 * ======================================================================== */

const ARCADE = "font-[family-name:var(--font-arcade)]";

/** 1. Terminal slide — CRT horror, glitching transmission */
function TerminalSlide() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 bg-foreground overflow-hidden">
      <ScanLines />
      <div className="w-full max-w-6xl">
        <GlitchText intensity="high" className="block">
          <p
            className={`${ARCADE} text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-brutal-cyan leading-tight`}
            style={{
              overflow: "hidden",
              borderRight: "6px solid",
              whiteSpace: "normal",
              animation:
                "terminal-reveal 3s steps(60, end), blink-caret 0.75s step-end infinite",
            }}
          >
            MISALIGNED SUPERINTELLIGENCE
          </p>
        </GlitchText>
      </div>
      <style>{`
        @keyframes terminal-reveal { from { max-height: 0; } to { max-height: 600px; } }
        @keyframes blink-caret { from, to { border-color: transparent; } 50% { border-color: currentColor; } }
      `}</style>
    </div>
  );
}

/** 2. Game title slide — neon arcade title screen */
function GameTitleSlide() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 bg-foreground overflow-hidden">
      <ScanLines />
      <PulseGlow color="rgba(255,105,180,0.4)" className="mb-8">
        <h1 className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-brutal-pink leading-none tracking-tight`}>
          THE EARTH
          <br />
          OPTIMIZATION
          <br />
          GAME
        </h1>
      </PulseGlow>
      <p
        className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl text-background`}
        style={{ animation: "press-start-blink 1s step-end infinite" }}
      >
        PRESS START
      </p>
      <style>{`
        @keyframes press-start-blink { from, to { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}

/** 3. Death count slide — real-time ticking death counter, fills the screen */
function DeathCountSlide() {
  const reduced = useReducedMotion();
  const SKULLS = 200;
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 bg-foreground overflow-hidden">
      <ScanLines />
      {/* Real-time death ticker — ticks every 50ms */}
      <div className="w-full max-w-6xl mb-6">
        <LiveDeathTicker className="[&_div]:text-5xl [&_div]:sm:text-6xl [&_div]:md:text-7xl" />
      </div>
      {/* Skull grid — bigger, fills viewport */}
      <div className="flex flex-wrap justify-center gap-1 max-w-5xl opacity-70">
        {Array.from({ length: SKULLS }, (_, i) => (
          <motion.span
            key={i}
            initial={reduced ? false : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.015, duration: 0.2 }}
            className="text-xl sm:text-2xl"
          >
            💀
          </motion.span>
        ))}
      </div>
    </div>
  );
}

const ratio = Math.round(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value);
const milPct = (ratio / (ratio + 1)) * 100;
const trialPct = (1 / (ratio + 1)) * 100;

/** 4. Military pie slide — the absurd 604:1 ratio */
function MilitaryPieSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 bg-foreground overflow-hidden">
      <ScanLines />
      <motion.div
        initial={reduced ? false : { scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.87, 0, 0.13, 1] }}
        className={`${ARCADE} text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] text-brutal-yellow leading-none mb-6`}
      >
        {ratio}:1
      </motion.div>
      <div className="w-full flex justify-center">
        <MilitaryVsTrialsPie
          militaryPct={milPct}
          trialsPct={trialPct}
          militaryDollars={2.24e12}
          trialsDollars={3.7e9}
          size={500}
          militaryLabel="Capacity for Mass Murder"
        />
      </div>
    </div>
  );
}

const capacityX = DFDA_TRIAL_CAPACITY_MULTIPLIER.value.toFixed(1);
const oldQueue = Math.round(STATUS_QUO_QUEUE_CLEARANCE_YEARS.value);
const newQueue = Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value);

/** 5. Collapse clock slide — doom countdown fills viewport */
function CollapseClockSlide() {
  return (
    <div className="relative flex flex-col items-stretch justify-center h-full overflow-hidden">
      <ScanLines />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-4xl [&_*]:!text-4xl [&_*]:sm:!text-5xl [&_*]:md:!text-6xl">
          <CollapseCountdownTimer />
        </div>
      </div>
      <div className="flex-1 w-full px-2">
        <GdpTrajectoryChart />
      </div>
    </div>
  );
}

/** 6. Moronia slide — GAME OVER, screen is dying */
function MoroniaSlide() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 bg-foreground overflow-hidden">
      <ScanLines />
      {/* Screen shake animation */}
      <motion.div
        animate={{ x: [0, -3, 3, -2, 2, 0], y: [0, 2, -2, 1, -1, 0] }}
        transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 3 }}
        className="flex flex-col items-center"
      >
        <PulseGlow color="rgba(239,68,68,0.6)">
          <h1 className={`${ARCADE} text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] text-brutal-red leading-none mb-6`}>
            GAME OVER
          </h1>
        </PulseGlow>
        <GlitchText intensity="medium">
          <p className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl text-brutal-red leading-none mb-4`}>
            94.7% MATCH
          </p>
        </GlitchText>
        <p className={`${ARCADE} text-lg sm:text-xl md:text-2xl text-background uppercase tracking-wider`}>
          WITH EARTH
        </p>
      </motion.div>
    </div>
  );
}

/** 7. Wishonia slide — NEW GAME+, burst of light after darkness */
function WishoniaSlideComponent() {
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

/** 8. One percent shift slide — FULL WIDTH before/after bars */
function OnePercentShiftSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-8">
      <p className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl font-black text-foreground uppercase tracking-wider mb-10`}>
        THE FIX
      </p>
      <div className="w-full space-y-8 mb-10 px-2">
        {/* Before bar */}
        <div>
          <p className={`${ARCADE} text-sm sm:text-base font-black uppercase text-muted-foreground mb-2 text-left`}>BEFORE</p>
          <motion.div
            initial={reduced ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: [0.87, 0, 0.13, 1] }}
            style={{ originX: 0 }}
            className="h-20 sm:h-24 w-full bg-brutal-red border-4 border-primary flex items-center justify-center"
          >
            <span className={`${ARCADE} text-xl sm:text-2xl font-black text-brutal-red-foreground`}>100% BOMBS</span>
          </motion.div>
        </div>
        {/* After bar */}
        <div>
          <p className={`${ARCADE} text-sm sm:text-base font-black uppercase text-muted-foreground mb-2 text-left`}>AFTER</p>
          <motion.div
            initial={reduced ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, ease: [0.87, 0, 0.13, 1], delay: 0.4 }}
            style={{ originX: 0 }}
            className="h-20 sm:h-24 w-full flex border-4 border-primary"
          >
            <div className="bg-brutal-red flex-grow flex items-center justify-center">
              <span className={`${ARCADE} text-xl sm:text-2xl font-black text-brutal-red-foreground`}>99%</span>
            </div>
            <motion.div
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              className="bg-brutal-cyan w-[5%] min-w-[60px] flex items-center justify-center border-l-4 border-primary"
            >
              <span className={`${ARCADE} text-base sm:text-lg font-black text-foreground`}>1%</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
      {/* Impact stats */}
      <div className="flex gap-8 sm:gap-16">
        <div>
          <p className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl font-black text-foreground`}>{capacityX}×</p>
          <p className={`${ARCADE} text-xs sm:text-sm font-black uppercase text-muted-foreground`}>MORE TRIALS</p>
        </div>
        <div>
          <p className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl font-black text-foreground`}>{oldQueue} → {newQueue}</p>
          <p className={`${ARCADE} text-xs sm:text-sm font-black uppercase text-muted-foreground`}>YEARS TO CURE ALL</p>
        </div>
      </div>
    </div>
  );
}

/** 9. Trial acceleration slide — massive old vs new numbers */
function TrialAccelerationSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 mb-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="border-4 border-primary bg-foreground px-8 sm:px-12 py-6 sm:py-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-5xl sm:text-6xl md:text-[8rem] text-background line-through opacity-50 leading-none`}>
            {oldQueue}
          </p>
          <p className={`${ARCADE} text-sm text-background uppercase mt-2`}>YEARS</p>
        </motion.div>
        <motion.p
          initial={reduced ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className={`${ARCADE} text-5xl sm:text-6xl text-brutal-pink`}
        >
          →
        </motion.p>
        <motion.div
          initial={reduced ? false : { opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-4 border-primary bg-brutal-yellow px-8 sm:px-12 py-6 sm:py-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-5xl sm:text-6xl md:text-[8rem] text-foreground font-black leading-none`}>
            {newQueue}
          </p>
          <p className={`${ARCADE} text-sm text-foreground uppercase mt-2`}>YEARS</p>
        </motion.div>
      </div>
      <motion.div
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
        className="text-8xl sm:text-9xl md:text-[10rem] font-black text-brutal-pink leading-none mb-2"
      >
        <CountUp value={DFDA_TRIAL_CAPACITY_MULTIPLIER.value} duration={2} suffix="×" />
      </motion.div>
    </div>
  );
}

/** 10. Pluralistic ignorance slide — wave of dots from center, dark bg */
function PluralisiticIgnoranceSlide() {
  const reduced = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const DOTS = 300;
  const COLS = 20;

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Compute distance from center for wave effect
  const centerRow = Math.floor((DOTS / COLS) / 2);
  const centerCol = Math.floor(COLS / 2);

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 bg-foreground overflow-hidden">
      <ScanLines />
      <motion.h2
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl text-brutal-cyan uppercase mb-8`}
      >
        EVERYONE WANTS THIS
      </motion.h2>
      <div
        className="grid gap-1.5 sm:gap-2 max-w-4xl w-full"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
        {Array.from({ length: DOTS }, (_, i) => {
          const row = Math.floor(i / COLS);
          const col = i % COLS;
          const dist = Math.sqrt(Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2));
          const maxDist = Math.sqrt(Math.pow(centerRow, 2) + Math.pow(centerCol, 2));
          const delay = (dist / maxDist) * 600; // wave from center

          return (
            <div
              key={i}
              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-500 ${
                revealed ? "bg-brutal-cyan scale-110" : "bg-muted-foreground"
              }`}
              style={{
                transitionDelay: revealed ? `${delay}ms` : "0ms",
              }}
            />
          );
        })}
      </div>
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.4 }}
        className={`${ARCADE} text-xs sm:text-sm text-muted-foreground uppercase mt-6 tracking-wider`}
      >
        THEY JUST COULDN&apos;T SEE EACH OTHER
      </motion.p>
    </div>
  );
}

/** 11. Level allocate slide — fighting game versus screen */
function LevelAllocateSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 overflow-hidden">
      <motion.div
        initial={reduced ? false : { y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-brutal-yellow border-4 border-primary px-8 py-3 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <p className={`${ARCADE} text-base sm:text-lg text-foreground uppercase`}>LEVEL 1</p>
      </motion.div>

      <div className="flex items-center justify-center w-full gap-4 sm:gap-8 md:gap-12">
        {/* BOMBS — left 45% */}
        <motion.div
          initial={reduced ? false : { x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          className="border-4 border-primary bg-brutal-red px-8 sm:px-12 md:px-16 py-10 sm:py-14 md:py-20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-shrink-0"
        >
          <p className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl text-brutal-red-foreground`}>BOMBS</p>
        </motion.div>

        {/* VS */}
        <PulseGlow color="rgba(255,105,180,0.5)">
          <motion.p
            initial={reduced ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            className={`${ARCADE} text-6xl sm:text-7xl md:text-[8rem] text-brutal-pink leading-none`}
          >
            VS
          </motion.p>
        </PulseGlow>

        {/* CURES — right 45% */}
        <motion.div
          initial={reduced ? false : { x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          className="border-4 border-primary bg-brutal-cyan px-8 sm:px-12 md:px-16 py-10 sm:py-14 md:py-20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-shrink-0"
        >
          <p className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl text-foreground`}>CURES</p>
        </motion.div>
      </div>
    </div>
  );
}

/** 12. Level vote slide — MASSIVE binary choice */
function LevelVoteSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 overflow-hidden">
      <motion.div
        initial={reduced ? false : { y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-brutal-pink border-4 border-primary px-8 py-3 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <p className={`${ARCADE} text-base sm:text-lg text-brutal-pink-foreground uppercase`}>LEVEL 2</p>
      </motion.div>

      <div className="flex items-center gap-6 sm:gap-12 md:gap-20 w-full justify-center">
        <motion.button
          initial={reduced ? false : { x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          whileHover={{ scale: 1.05, y: -4 }}
          className="border-4 border-primary bg-brutal-cyan px-12 sm:px-20 md:px-28 py-10 sm:py-14 md:py-20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-shadow"
        >
          <p className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl text-foreground`}>YES</p>
        </motion.button>

        <motion.button
          initial={reduced ? false : { x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          whileHover={{ scale: 1.05, y: -4 }}
          className="border-4 border-primary bg-brutal-red px-12 sm:px-20 md:px-28 py-10 sm:py-14 md:py-20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-shadow"
        >
          <p className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl text-brutal-red-foreground`}>NO</p>
        </motion.button>
      </div>
    </div>
  );
}

/** 13. Level recruit slide — exponential doubling visualization */
function LevelRecruitSlide() {
  const reduced = useReducedMotion();
  const doublings = [1, 2, 4, 8, 16, 32, 64, 128];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 overflow-hidden">
      <motion.div
        initial={reduced ? false : { y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-brutal-yellow border-4 border-primary px-8 py-3 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <p className={`${ARCADE} text-base sm:text-lg text-foreground uppercase`}>LEVEL 3</p>
      </motion.div>

      {/* Hero number */}
      <motion.div
        initial={reduced ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        className="mb-8"
      >
        <p className={`${ARCADE} text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] text-foreground leading-none`}>
          <CountUp value={268000000} duration={3} />
        </p>
      </motion.div>

      {/* Staggered doubling grid */}
      <StaggerGrid
        staggerDelay={0.12}
        direction="up"
        className="flex items-center gap-3 sm:gap-4 mb-8 flex-wrap justify-center"
      >
        {doublings.map((n) => (
          <div
            key={n}
            className={`border-4 border-primary px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              n === 128 ? "bg-brutal-cyan" : "bg-muted"
            }`}
          >
            <p className={`${ARCADE} text-lg sm:text-xl text-foreground`}>{n}</p>
          </div>
        ))}
      </StaggerGrid>

      <motion.p
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl text-brutal-pink`}
      >
        3.5% TIPPING POINT
      </motion.p>
    </div>
  );
}

/** 14. Prize slide — INSERT COIN arcade machine */
function PrizeSlideCompact() {
  const reduced = useReducedMotion();
  useEffect(() => {
    playCoinSound();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 overflow-hidden">
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl text-brutal-pink uppercase tracking-wider mb-6`}
        style={{ animation: "insert-coin-blink 1.2s step-end infinite" }}
      >
        INSERT COIN
      </motion.p>

      <motion.div
        initial={reduced ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="border-4 border-primary bg-foreground px-12 sm:px-16 py-4 sm:py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8"
      >
        <p className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl text-background`}>$100</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-6 sm:gap-10 max-w-2xl w-full mb-8">
        <motion.div
          initial={reduced ? false : { x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="border-4 border-primary bg-brutal-yellow p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-sm sm:text-base text-foreground uppercase mb-3`}>MISS</p>
          <p className={`${ARCADE} text-4xl sm:text-5xl text-foreground leading-none`}>$1.1K</p>
          <p className={`${ARCADE} text-xs text-muted-foreground mt-2`}>11× BACK</p>
        </motion.div>
        <motion.div
          initial={reduced ? false : { x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="border-4 border-primary bg-brutal-cyan p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className={`${ARCADE} text-sm sm:text-base text-foreground uppercase mb-3`}>HIT</p>
          <p className={`${ARCADE} text-4xl sm:text-5xl text-foreground leading-none`}>$387K</p>
          <p className={`${ARCADE} text-xs text-muted-foreground mt-2`}>3,870× BACK</p>
        </motion.div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="border-4 border-primary bg-foreground px-8 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        style={{ animation: "insert-coin-blink 2s step-end infinite" }}
      >
        <p className={`${ARCADE} text-base sm:text-lg text-brutal-pink`}>
          BREAK-EVEN: 0.0067%
        </p>
      </motion.div>

      <style>{`
        @keyframes insert-coin-blink { from, to { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

/** 15. Government leaderboard slide — arcade high score table */
function LeaderboardSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 sm:px-8 overflow-hidden">
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase text-foreground mb-8 text-center`}
      >
        HIGH SCORES
      </motion.h2>
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-full max-w-5xl"
      >
        <GovernmentLeaderboard limit={5} compact />
      </motion.div>
    </div>
  );
}

/** Scoreboard slide */
function ScoreboardSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 sm:px-8 overflow-hidden">
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase text-foreground mb-8 text-center`}
      >
        THE SCOREBOARD
      </motion.h2>
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-full max-w-5xl"
      >
        <HumanityScoreboard />
      </motion.div>
    </div>
  );
}

/** 16. Architecture stats slide — staggered stat blocks filling viewport */
function ArchitectureStatsSlide() {
  const reduced = useReducedMotion();
  const stats = [
    { value: 15, label: "PACKAGES", color: "bg-brutal-cyan" },
    { value: 2600, label: "TESTS", color: "bg-brutal-pink", suffix: "+" },
    { value: 100, label: "OPEN SOURCE", color: "bg-brutal-yellow", suffix: "%" },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 overflow-hidden">
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl text-foreground uppercase mb-12`}
      >
        UNDER THE HOOD
      </motion.h2>
      <StaggerGrid
        staggerDelay={0.2}
        direction="up"
        className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12"
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className={`${s.color} border-4 border-primary px-12 sm:px-16 py-8 sm:py-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
          >
            <p className={`${ARCADE} text-5xl sm:text-6xl md:text-7xl text-foreground mb-3 leading-none`}>
              <CountUp value={s.value} duration={1.5} suffix={s.suffix} />
            </p>
            <p className={`${ARCADE} text-sm sm:text-base text-foreground uppercase tracking-wider`}>
              {s.label}
            </p>
          </div>
        ))}
      </StaggerGrid>
    </div>
  );
}

/** 17. Close slide — alignment software for human-made AIs */
function CloseSlide() {
  const reduced = useReducedMotion();
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden">
      <motion.p
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`${ARCADE} text-xl sm:text-2xl md:text-3xl lg:text-4xl text-foreground uppercase leading-relaxed mb-4 max-w-5xl`}
      >
        ALIGNMENT SOFTWARE FOR THE MOST POWERFUL AIs ON YOUR PLANET
      </motion.p>
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className={`${ARCADE} text-lg sm:text-xl md:text-2xl text-brutal-pink uppercase mb-10`}
      >
        — THE ONES MADE OF PEOPLE
      </motion.p>
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
        className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
      >
        <PulseGlow color="rgba(255,105,180,0.3)">
          <GameCTA href="/#vote" variant="primary" size="lg">
            {CTA.playNow}
          </GameCTA>
        </PulseGlow>
        <GameCTA href="/prize" variant="secondary" size="lg">
          {CTA.seeTheMath}
        </GameCTA>
      </motion.div>
    </div>
  );
}

/** Placeholder for components that need server data or are too heavy to embed */
function PlaceholderSlide({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <h2 className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl font-black uppercase text-foreground mb-6`}>
        {title}
      </h2>
      <p className="text-xl sm:text-2xl font-bold text-muted-foreground max-w-2xl">
        {description}
      </p>
    </div>
  );
}

function getSlideComponent(componentId: string) {
  switch (componentId) {
    case "hook":
    case "death-count":
      return <DeathCountSlide />;
    case "military-pie":
      return <MilitaryPieSlide />;
    case "one-percent-shift":
      return <OnePercentShiftSlide />;
    case "scoreboard":
      return <ScoreboardSlide />;
    case "government-leaderboard":
      return <LeaderboardSlide />;
    case "the-question":
      return (
        <PlaceholderSlide
          title="The Question"
          description="Should all nations allocate just 1% of military spending to clinical trials? Slide the bar and vote."
        />
      );
    case "how-to-win":
      return (
        <PlaceholderSlide
          title="How to Win"
          description="Win: VOTE holders get $194K+ per point. Lose: depositors get 11x back. Every player wins."
        />
      );
    case "how-to-play":
      return (
        <PlaceholderSlide
          title="How to Play"
          description="Vote & Allocate. Get Your Link. Share With Friends. Deposit. Four steps. The only losing move is not playing."
        />
      );
    case "why-play":
      return (
        <PlaceholderSlide
          title="What Happens If Nobody Plays"
          description="2037: parasitic economy hits 35% of GDP. Every civilisation that hit this threshold collapsed. You are currently on this trajectory."
        />
      );
    case "wishocracy":
      return (
        <PlaceholderSlide
          title="Build Your Budget"
          description="Pick between two things. Eigenvector decomposition produces stable preference weights from 10 comparisons. Democracy in four minutes."
        />
      );
    case "alignment":
      return (
        <PlaceholderSlide
          title="Who Agrees With You?"
          description="Compare your priorities against real politician voting records. Each official gets a Citizen Alignment Score."
        />
      );
    case "tools":
      return (
        <PlaceholderSlide
          title="The Armory"
          description="18 tools. Policy generators. Budget optimizers. Causal inference engines. All free. All open source."
        />
      );
    case "viral-doubling":
      return <ViralDoublingChart />;
    case "historical-waste":
      return <HistoricalWasteComparison />;
    case "cost-effectiveness":
      return <CostEffectivenessComparison />;
    case "per-pct-point":
      return <PercentagePointValue />;
    case "prize-worked-example":
      return <PrizeSlideCompact />;
    case "trial-cost":
      return <TrialCostComparison />;
    case "personal-upside":
      return <PersonalUpsideCard />;
    case "terminal":
      return <TerminalSlide />;
    case "game-title":
      return <GameTitleSlide />;
    case "collapse-clock":
      return <CollapseClockSlide />;
    case "moronia":
      return <MoroniaSlide />;
    case "wishonia-slide":
      return <WishoniaSlideComponent />;
    case "trial-acceleration":
      return <TrialAccelerationSlide />;
    case "pluralistic-ignorance":
      return <PluralisiticIgnoranceSlide />;
    case "level-allocate":
      return <LevelAllocateSlide />;
    case "level-vote":
      return <LevelVoteSlide />;
    case "level-recruit":
      return <LevelRecruitSlide />;
    case "architecture-stats":
      return <ArchitectureStatsSlide />;
    case "close":
      return <CloseSlide />;
    default:
      return null;
  }
}

interface DemoPlayerProps {
  playlistId?: string;
}

export function DemoPlayer({ playlistId = DEFAULT_PLAYLIST_ID }: DemoPlayerProps) {
  const reduced = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const slides = getPlaylistSegments(playlistId);
  const slide = slides[currentIndex]!;

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const playSlideAudio = useCallback(
    async (index: number) => {
      const s = slides[index]!;
      setSubtitle(s.narration);

      if (isMuted) return;

      setIsLoadingAudio(true);
      try {
        const audio = await getDemoAudio(s.id, s.narration);
        if (audio) {
          audioRef.current = audio;
          audio.onended = () => {
            if (isPlaying && index < slides.length - 1) {
              setCurrentIndex(index + 1);
            } else {
              setIsPlaying(false);
            }
          };
          await audio.play();
        } else {
          // No audio available — auto-advance after estimated duration
          const words = s.narration.split(/\s+/).length;
          const ms = (words / 150) * 60 * 1000;
          if (isPlaying && index < slides.length - 1) {
            setTimeout(() => setCurrentIndex(index + 1), ms);
          }
        }
      } catch {
        // TTS failed — subtitle-only mode
      } finally {
        setIsLoadingAudio(false);
      }
    },
    [isMuted, isPlaying],
  );

  useEffect(() => {
    stopAudio();
    if (isPlaying) {
      void playSlideAudio(currentIndex);
    } else {
      setSubtitle(slides[currentIndex]!.narration);
    }
  }, [currentIndex, isPlaying, stopAudio, playSlideAudio]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (currentIndex < slides.length - 1) {
          stopAudio();
          setCurrentIndex((i) => i + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (currentIndex > 0) {
          stopAudio();
          setCurrentIndex((i) => i - 1);
        }
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "m") {
        setIsMuted((m) => !m);
      } else if (e.key === "f") {
        containerRef.current?.requestFullscreen?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, stopAudio]);

  const goTo = (index: number) => {
    stopAudio();
    setCurrentIndex(index);
  };

  const bgClass = bgColorMap[slide.bgColor ?? "background"] ?? "bg-background";

  return (
    <div
      ref={containerRef}
      className="relative h-full group"
    >
      {/* Full-bleed slide area */}
      <div className={`absolute inset-0 ${bgClass}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={reduced ? false : { opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {getSlideComponent(slide.componentId)}
          </motion.div>
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoadingAudio && (
          <div className="absolute top-4 right-4 text-xs font-black uppercase text-muted-foreground animate-pulse">
            Loading audio...
          </div>
        )}
      </div>

      {/* Overlay controls — visible on hover/tap, auto-hide */}
      <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-10">
        {/* Subtitle */}
        <div className="bg-foreground/90 backdrop-blur-sm px-3 sm:px-6 py-2 sm:py-3">
          <p className="text-xs sm:text-sm font-bold text-background leading-relaxed line-clamp-2">
            {subtitle}
          </p>
        </div>

        {/* Controls */}
        <DemoControls
          current={currentIndex}
          total={slides.length}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onPrev={() => goTo(Math.max(0, currentIndex - 1))}
          onNext={() => goTo(Math.min(slides.length - 1, currentIndex + 1))}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onToggleMute={() => setIsMuted((m) => !m)}
          onGoTo={goTo}
          onFullscreen={() => containerRef.current?.requestFullscreen?.()}
        />
      </div>

      {/* Minimal progress bar — always visible */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30 z-20 pointer-events-none">
        <div
          className="h-full bg-brutal-pink transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
