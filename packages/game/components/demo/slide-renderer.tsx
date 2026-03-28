"use client";

import { useDemoStore } from "@/lib/demo/store";
import { SLIDES } from "@/lib/demo/demo-config";

// Act I slides
import { SlideDeathCounter } from "./slides/act1/slide-death-counter";
import { SlideGovernmentsAreAI } from "./slides/act1/slide-governments-are-ai";
import { SlideMisalignedProof } from "./slides/act1/slide-misaligned-proof";
import { SlideGameTitle } from "./slides/act1/slide-game-title";
import { SlideRatio } from "./slides/act1/slide-ratio";
import { SlideCollapseClock } from "./slides/act1/slide-collapse-clock";
import { SlideFailedState } from "./slides/act1/slide-failed-state";
import { SlideAIHackers } from "./slides/act1/slide-ai-hackers";
import { SlidePaycheckTheft } from "./slides/act1/slide-paycheck-theft";
import { SlideGameOver } from "./slides/act1/slide-game-over";
import { SlideBodyCount } from "./slides/act1/slide-body-count";

// Turn
import { SlideWishoniaRestore } from "./slides/turn/slide-wishonia-restore";

// Act II slides - Part 1: The Solution
import { SlideOnePercent } from "./slides/act2/slide-one-percent";
import { SlideAcceleration } from "./slides/act2/slide-acceleration";
import { SlideRoiComparison } from "./slides/act2/slide-roi-comparison";
import { SlideVirtuousLoop } from "./slides/act2/slide-virtuous-loop";
import { SlideGDPTrajectory } from "./slides/act2/slide-gdp-trajectory";
import { SlideCompoundPunchline } from "./slides/act2/slide-compound-punchline";
import { SlideTheBug } from "./slides/act2/slide-the-bug";
import { SlideTheMismatch } from "./slides/act2/slide-the-mismatch";
import { SlidePluristicIgnorance } from "./slides/act2/slide-pluralistic-ignorance";
import { SlideDysfunctionTax } from "./slides/act2/slide-dysfunction-tax";
import { SlideScoreboard } from "./slides/act2/slide-scoreboard";

// Act II slides - Part 2: The Game
import { SlideLevelAllocate } from "./slides/act2/slide-level-allocate";
import { SlideYourBudget } from "./slides/act2/slide-your-budget";
import { SlideLevelVote } from "./slides/act2/slide-level-vote";
import { SlideYoureIn } from "./slides/act2/slide-youre-in";
import { SlideAsymmetry } from "./slides/act2/slide-asymmetry";
import { SlideLevelShare } from "./slides/act2/slide-level-share";

// Act II slides - Part 3: The Money
import { SlidePrizePool } from "./slides/act2/slide-prize-pool";
import { SlidePrizeMechanism } from "./slides/act2/slide-prize-mechanism";
import { SlideVotePointValue } from "./slides/act2/slide-vote-point-value";
import { SlideCannotLose } from "./slides/act2/slide-cannot-lose";

// Act II slides - Part 4: Accountability
import { SlideLeaderboard } from "./slides/act2/slide-leaderboard";
import { SlideChangedMetric } from "./slides/act2/slide-changed-metric";
import { SlideUsReportCard } from "./slides/act2/slide-us-report-card";

// Act II slides - Part 5: The Armory
import { SlideFdaQueue } from "./slides/act2/slide-fda-queue";
import { SlideDfda } from "./slides/act2/slide-dfda";
import { SlideIabs } from "./slides/act2/slide-iabs";
import { SlideSuperpac } from "./slides/act2/slide-superpac";
import { SlideStoracha } from "./slides/act2/slide-storacha";
import { SlideHypercerts } from "./slides/act2/slide-hypercerts";
import { SlideWishToken } from "./slides/act2/slide-wish-token";
import { SlideReplaceWelfare } from "./slides/act2/slide-replace-welfare";
import { SlideReplaceFed } from "./slides/act2/slide-replace-fed";
import { SlidePolicyEngine } from "./slides/act2/slide-policy-engine";
import { SlideOptimizer } from "./slides/act2/slide-optimizer";
import { SlideBudgetOptimizer } from "./slides/act2/slide-budget-optimizer";
import { SlideIPencil } from "./slides/act2/slide-i-pencil";
import { SlideCuredDisease } from "./slides/act2/slide-cured-disease";
import { SlideTheSwitch } from "./slides/act2/slide-the-switch";

// Act III slides
import { SlidePersonalUpside } from "./slides/act3/slide-personal-upside";
import { SlideLivesSaved } from "./slides/act3/slide-lives-saved";
import { SlideFinal } from "./slides/act3/slide-final";
import { SlideEasterEgg } from "./slides/act3/slide-easter-egg";

import { DataSlide } from "./slides/data-slide";

// Map slide IDs to components (IDs from demo-config.ts)
const slideComponents: Record<string, React.ComponentType> = {
  // Act I - The Horror
  "cold-open": SlideDeathCounter,
  "governments-are-ai": SlideGovernmentsAreAI,
  "war-spending": SlideMisalignedProof,
  "body-count": SlideBodyCount,
  "paycheck-heist": SlidePaycheckTheft,
  "game-title": SlideGameTitle,
  "ratio-604": SlideRatio,
  "clock": SlideCollapseClock,
  "failed-state": SlideFailedState,
  "ai-spiral": SlideAIHackers,
  "moronia": SlideGameOver,

  // The Turn
  "wishonia": SlideWishoniaRestore,

  // Act II - Part 1: The Solution
  "the-fix": SlideOnePercent,
  "acceleration": SlideAcceleration,
  "roi-comparison": SlideRoiComparison,
  "virtuous-loop": SlideVirtuousLoop,
  "twenty-year-gap": SlideGDPTrajectory,
  "compound-punchline": SlideCompoundPunchline,
  "the-bug": SlideTheBug,
  "the-mismatch": SlideTheMismatch,
  "pluralistic-ignorance": SlidePluristicIgnorance,
  "dysfunction-tax": SlideDysfunctionTax,
  "scoreboard": SlideScoreboard,

  // Act II - Part 2: The Game
  "allocate": SlideLevelAllocate,
  "your-budget": SlideYourBudget,
  "referendum": SlideLevelVote,
  "youre-in": SlideYoureIn,
  "asymmetry": SlideAsymmetry,
  "get-friends": SlideLevelShare,

  // Act II - Part 3: The Money
  "prize-investment": SlidePrizePool,
  "prize-mechanism": SlidePrizeMechanism,
  "vote-point-value": SlideVotePointValue,
  "cannot-lose": SlideCannotLose,

  // Act II - Part 4: Accountability
  "arsonist-board": SlideLeaderboard,
  "track-record": SlideChangedMetric,
  "us-report-card": SlideUsReportCard,

  // Act II - Part 5: The Armory
  "fda-queue": SlideFdaQueue,
  "dfda-fix": SlideDfda,
  "iabs": SlideIabs,
  "superpac": SlideSuperpac,
  "storacha": SlideStoracha,
  "hypercerts": SlideHypercerts,
  "replace-irs": SlideWishToken,
  "replace-welfare": SlideReplaceWelfare,
  "replace-fed": SlideReplaceFed,
  "policy-engine": SlidePolicyEngine,
  "optimizer": SlideOptimizer,
  "budget-optimizer": SlideBudgetOptimizer,
  "i-pencil": SlideIPencil,
  "cured-disease": SlideCuredDisease,
  "the-switch": SlideTheSwitch,

  // Act III - The Endgame
  "personal-upside": SlidePersonalUpside,
  "lives-saved": SlideLivesSaved,
  "close": SlideFinal,
  "easter-egg": SlideEasterEgg,
};

export function SlideRenderer() {
  const currentSlide = useDemoStore((s) => s.currentSlide);
  const slideConfig = SLIDES[currentSlide];

  if (!slideConfig) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="font-pixel text-red-500">ERROR: Invalid slide index</div>
      </div>
    );
  }

  const SlideComponent = slideComponents[slideConfig.id];

  if (SlideComponent) {
    return <SlideComponent key={slideConfig.id} />;
  }

  // Generic data-driven fallback for slides without dedicated components
  return <DataSlide key={slideConfig.id} config={slideConfig} />;
}
