"use client";

import { useDemoStore } from "@/lib/demo/store";
import { SLIDES } from "@/lib/demo/demo-config";

// Act I slides
import { SlideDeathCounter } from "./slides/act1/slide-death-counter";
import { SlideAITerminal } from "./slides/act1/slide-ai-terminal";
import { SlideGovernmentsAreAI } from "./slides/act1/slide-governments-are-ai";
import { SlideMisalignedProof } from "./slides/act1/slide-misaligned-proof";
import { SlideGameTitle } from "./slides/act1/slide-game-title";
import { SlideRatio } from "./slides/act1/slide-ratio";
import { SlideCollapseClock } from "./slides/act1/slide-collapse-clock";
import { SlideFailedState } from "./slides/act1/slide-failed-state";
import { SlideAIHackers } from "./slides/act1/slide-ai-hackers";
import { SlidePaycheckTheft } from "./slides/act1/slide-paycheck-theft";
import { SlideGameOver } from "./slides/act1/slide-game-over";

// Turn
import { SlideWishoniaRestore } from "./slides/turn/slide-wishonia-restore";

// Act II slides - Part 1: The Solution
import { SlideOnePercent } from "./slides/act2/slide-one-percent";
import { SlideAcceleration } from "./slides/act2/slide-acceleration";
import { SlideGDPTrajectory } from "./slides/act2/slide-gdp-trajectory";
import { SlidePluristicIgnorance } from "./slides/act2/slide-pluralistic-ignorance";
import { SlideDysfunctionTax } from "./slides/act2/slide-dysfunction-tax";
import { SlideScoreboard } from "./slides/act2/slide-scoreboard";

// Act II slides - Part 2: The Game
import { SlideLevelAllocate } from "./slides/act2/slide-level-allocate";
import { SlideLevelVote } from "./slides/act2/slide-level-vote";
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

// Act II slides - Part 5: The Armory
import { SlideDfda } from "./slides/act2/slide-dfda";
import { SlideIabs } from "./slides/act2/slide-iabs";
import { SlideSuperpac } from "./slides/act2/slide-superpac";
import { SlideStoracha } from "./slides/act2/slide-storacha";
import { SlideHypercerts } from "./slides/act2/slide-hypercerts";
import { SlideWishToken } from "./slides/act2/slide-wish-token";
import { SlideOptimizer } from "./slides/act2/slide-optimizer";
import { SlideIPencil } from "./slides/act2/slide-i-pencil";

// Act III slides
import { SlidePersonalUpside } from "./slides/act3/slide-personal-upside";
import { SlideLivesSaved } from "./slides/act3/slide-lives-saved";
import { SlideFinal } from "./slides/act3/slide-final";
import { SlideEasterEgg } from "./slides/act3/slide-easter-egg";

// Placeholder for slides not yet implemented
function PlaceholderSlide({ id, narration }: { id: string; narration: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-900 p-8">
      <div className="text-center space-y-4 max-w-2xl">
        <div className="font-pixel text-sm text-zinc-500 uppercase tracking-wider">
          Slide: {id}
        </div>
        <div className="font-terminal text-lg text-zinc-400 leading-relaxed">
          {narration}
        </div>
      </div>
    </div>
  );
}

// Map slide IDs to components (IDs from demo-config.ts)
const slideComponents: Record<string, React.ComponentType> = {
  // Act I - The Horror
  "cold-open": SlideDeathCounter,
  "governments-are-ai": SlideGovernmentsAreAI,
  "misaligned": SlideMisalignedProof,
  "game-title": SlideGameTitle,
  "ratio-604": SlideRatio,
  "clock": SlideCollapseClock,
  "failed-state": SlideFailedState,
  "ai-spiral": SlideAIHackers,
  "paycheck-theft": SlidePaycheckTheft,
  "moronia": SlideGameOver,

  // The Turn
  "wishonia": SlideWishoniaRestore,

  // Act II - Part 1: The Solution
  "the-fix": SlideOnePercent,
  "acceleration": SlideAcceleration,
  "compounding": SlideGDPTrajectory,
  "pluralistic-ignorance": SlidePluristicIgnorance,
  "dysfunction-tax": SlideDysfunctionTax,
  "scoreboard": SlideScoreboard,

  // Act II - Part 2: The Game
  "allocate": SlideLevelAllocate,
  "vote": SlideLevelVote,
  "asymmetry": SlideAsymmetry,
  "get-friends": SlideLevelShare,

  // Act II - Part 3: The Money
  "prize-investment": SlidePrizePool,
  "prize-mechanism": SlidePrizeMechanism,
  "vote-point-value": SlideVotePointValue,
  "cannot-lose": SlideCannotLose,

  // Act II - Part 4: Accountability
  "leaderboard": SlideLeaderboard,
  "changed-metric": SlideChangedMetric,

  // Act II - Part 5: The Armory
  "dfda": SlideDfda,
  "iabs": SlideIabs,
  "superpac": SlideSuperpac,
  "storacha": SlideStoracha,
  "hypercerts": SlideHypercerts,
  "wish-token": SlideWishToken,
  "optimizer": SlideOptimizer,
  "i-pencil": SlideIPencil,

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

  // Return placeholder for unimplemented slides
  return <PlaceholderSlide id={slideConfig.id} narration={slideConfig.narration} />;
}
