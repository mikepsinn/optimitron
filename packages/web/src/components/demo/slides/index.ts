/**
 * Slide component registry.
 *
 * Maps componentId strings (from demo-script.ts segments) to React components.
 * Each slide is in its own file for clean separation.
 */

import type { ComponentType } from "react";

// Extracted existing slides
import TerminalSlide from "./TerminalSlide";
import GameTitleSlide from "./GameTitleSlide";
import DeathCountSlide from "./DeathCountSlide";
import MilitaryPieSlide from "./MilitaryPieSlide";
import CollapseClockSlide from "./CollapseClockSlide";
import MoroniaSlide from "./MoroniaSlide";
import WishoniaSlide from "./WishoniaSlide";
import OnePercentShiftSlide from "./OnePercentShiftSlide";
import TrialAccelerationSlide from "./TrialAccelerationSlide";
import PluralisiticIgnoranceSlide from "./PluralisiticIgnoranceSlide";
import LevelAllocateSlide from "./LevelAllocateSlide";
import LevelVoteSlide from "./LevelVoteSlide";
import LevelRecruitSlide from "./LevelRecruitSlide";
import PrizeSlide from "./PrizeSlide";
import LeaderboardSlide from "./LeaderboardSlide";
import ScoreboardSlide from "./ScoreboardSlide";
import ArchitectureStatsSlide from "./ArchitectureStatsSlide";
import CloseSlide from "./CloseSlide";

// New slides — Act I horror
import FailedStateSlide from "./FailedStateSlide";
import AiSpiralSlide from "./AiSpiralSlide";
import PaycheckTheftSlide from "./PaycheckTheftSlide";

// New slides — Solution
import CompoundingLoopSlide from "./CompoundingLoopSlide";
import DysfunctionTaxSlide from "./DysfunctionTaxSlide";
import QuestObjectivesSlide from "./QuestObjectivesSlide";

// New slides — Game
import AsymmetrySlide from "./AsymmetrySlide";
import LevelShareSlide from "./LevelShareSlide";

// New slides — Money
import PrizeInvestmentSlide from "./PrizeInvestmentSlide";
import PrizeMechanismSlide from "./PrizeMechanismSlide";
import VotePointValueSlide from "./VotePointValueSlide";
import PrizeFreeOptionSlide from "./PrizeFreeOptionSlide";

// New slides — Accountability
import MetricChangedSlide from "./MetricChangedSlide";

// New slides — Armory
import DfdaSlide from "./DfdaSlide";
import IabSlide from "./IabSlide";
import SuperpacSlide from "./SuperpacSlide";
import OptimizerSlide from "./OptimizerSlide";
import StorachaSlide from "./StorachaSlide";
import HypercertsSlide from "./HypercertsSlide";
import WishTokenSlide from "./WishTokenSlide";
import IPencilSlide from "./IPencilSlide";

// New slides — Climax + Act III
import PersonalUpsideSlide from "./PersonalUpsideSlide";
import LivesSavedSlide from "./LivesSavedSlide";
import EasterEggSlide from "./EasterEggSlide";

// Fallback
import PlaceholderSlide from "./PlaceholderSlide";

// ---------------------------------------------------------------------------
// Registry: componentId → Component
// ---------------------------------------------------------------------------

const slideRegistry: Record<string, ComponentType> = {
  // Act I — The Horror
  hook: DeathCountSlide,
  "death-count": DeathCountSlide,
  terminal: TerminalSlide,
  "game-title": GameTitleSlide,
  "military-pie": MilitaryPieSlide,
  "collapse-clock": CollapseClockSlide,
  "failed-state": FailedStateSlide,
  "ai-spiral": AiSpiralSlide,
  "paycheck-theft": PaycheckTheftSlide,
  moronia: MoroniaSlide,
  "wishonia-slide": WishoniaSlide,

  // Act II — Solution
  "one-percent-shift": OnePercentShiftSlide,
  "trial-acceleration": TrialAccelerationSlide,
  "gdp-trajectory": CompoundingLoopSlide,
  "pluralistic-ignorance": PluralisiticIgnoranceSlide,
  "dysfunction-tax": DysfunctionTaxSlide,
  "quest-objectives": QuestObjectivesSlide,
  scoreboard: ScoreboardSlide,

  // Act II — The Game
  "level-allocate": LevelAllocateSlide,
  "level-vote": LevelVoteSlide,
  "level-recruit": LevelRecruitSlide,
  "level-share": LevelShareSlide,
  asymmetry: AsymmetrySlide,

  // Act II — The Money
  "prize-investment": PrizeInvestmentSlide,
  "prize-mechanism": PrizeMechanismSlide,
  "prize-worked-example": PrizeSlide,
  "how-to-win": PrizeSlide,
  "vote-point-value": VotePointValueSlide,
  "prize-free-option": PrizeFreeOptionSlide,

  // Act II — Accountability
  "government-leaderboard": LeaderboardSlide,
  "metric-changed": MetricChangedSlide,

  // Act II — Armory
  dfda: DfdaSlide,
  iab: IabSlide,
  superpac: SuperpacSlide,
  optimizer: OptimizerSlide,
  storacha: StorachaSlide,
  hypercerts: HypercertsSlide,
  "wish-token": WishTokenSlide,
  "i-pencil": IPencilSlide,
  "architecture-stats": ArchitectureStatsSlide,

  // Act II — Climax
  "personal-upside": PersonalUpsideSlide,

  // Act III — Endgame
  "lives-saved": LivesSavedSlide,
  close: CloseSlide,
  "easter-egg": EasterEggSlide,

  // Legacy placeholders (used by non-hackathon playlists)
  "the-question": PlaceholderSlide,
  "how-to-play": PlaceholderSlide,
  "why-play": PlaceholderSlide,
  wishocracy: PlaceholderSlide,
  alignment: PlaceholderSlide,
  tools: PlaceholderSlide,
  "per-pct-point": PlaceholderSlide,
  "viral-doubling": PlaceholderSlide,
  "historical-waste": PlaceholderSlide,
  "cost-effectiveness": PlaceholderSlide,
  "trial-cost": PlaceholderSlide,
};

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

export function getSlideComponent(componentId: string): ComponentType {
  return slideRegistry[componentId] ?? PlaceholderSlide;
}

export { PlaceholderSlide };
