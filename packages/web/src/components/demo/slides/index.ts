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
// Sierra slides (lazy-loaded from game package port)
// ---------------------------------------------------------------------------

import { lazy } from "react";

const sierraSlide = (file: string) =>
  lazy(() => import(/* webpackInclude: /\.tsx$/ */ `./sierra/${file}.tsx`)) as unknown as ComponentType;

const sierraRegistry: Record<string, ComponentType> = {
  "sierra-earth-optimization-game": sierraSlide("slide-earth-optimization-game"),
  "sierra-military-waste-170t": sierraSlide("slide-military-waste-170t"),
  "sierra-misaligned-superintelligence": sierraSlide("slide-misaligned-superintelligence"),
  "sierra-military-health-ratio": sierraSlide("slide-military-health-ratio"),
  "sierra-game-over-moronia": sierraSlide("slide-game-over-moronia"),
  "sierra-restore-from-wishonia": sierraSlide("slide-restore-from-wishonia"),
  "sierra-one-percent-treaty": sierraSlide("slide-one-percent-treaty"),
  "sierra-one-percent-referendum-vote": sierraSlide("slide-one-percent-referendum-vote"),
  "sierra-dominant-assurance-contract": sierraSlide("slide-dominant-assurance-contract"),
  "sierra-decentralized-fda": sierraSlide("slide-decentralized-fda"),
  "sierra-optimal-policy-generator": sierraSlide("slide-optimal-policy-generator"),
  "sierra-optimal-budget-generator": sierraSlide("slide-optimal-budget-generator"),
  "sierra-incentive-alignment-bonds": sierraSlide("slide-incentive-alignment-bonds"),
  "sierra-ipfs-immutable-storage": sierraSlide("slide-ipfs-immutable-storage"),
  "sierra-impact-certificates": sierraSlide("slide-impact-certificates"),
  "sierra-ten-billion-lives-saved": sierraSlide("slide-ten-billion-lives-saved"),
  "sierra-final-call-to-action": sierraSlide("slide-final-call-to-action"),
  "sierra-post-credits-aliens": sierraSlide("slide-post-credits-aliens"),
  // Additional Sierra slides (available for other playlists)
  "sierra-daily-death-toll": sierraSlide("slide-daily-death-toll"),
  "sierra-ai-hacker-spiral": sierraSlide("slide-ai-hacker-spiral"),
  "sierra-ai-hacker-breach": sierraSlide("slide-ai-hacker-breach"),
  "sierra-economic-collapse-clock": sierraSlide("slide-economic-collapse-clock"),
  "sierra-global-failed-state": sierraSlide("slide-global-failed-state"),
  "sierra-inflation-wage-theft": sierraSlide("slide-inflation-wage-theft"),
  "sierra-trial-acceleration-12x": sierraSlide("slide-trial-acceleration-12x"),
  "sierra-healthcare-vs-military-roi": sierraSlide("slide-healthcare-vs-military-roi"),
  "sierra-economic-virtuous-loop": sierraSlide("slide-economic-virtuous-loop"),
  "sierra-gdp-20-year-forecast": sierraSlide("slide-gdp-20-year-forecast"),
  "sierra-pluralistic-ignorance-bug": sierraSlide("slide-pluralistic-ignorance-bug"),
  "sierra-public-vs-lobbyist-90to1": sierraSlide("slide-public-vs-lobbyist-90to1"),
  "sierra-dysfunction-tax-101t": sierraSlide("slide-dysfunction-tax-101t"),
  "sierra-win-conditions-hale-income": sierraSlide("slide-win-conditions-hale-income"),
  "sierra-pairwise-budget-allocation": sierraSlide("slide-pairwise-budget-allocation"),
  "sierra-eigenvector-budget-result": sierraSlide("slide-eigenvector-budget-result"),
  "sierra-vote-value-asymmetry": sierraSlide("slide-vote-value-asymmetry"),
  "sierra-recruit-network-effect": sierraSlide("slide-recruit-network-effect"),
  "sierra-prize-pool-vs-index-fund": sierraSlide("slide-prize-pool-vs-index-fund"),
  "sierra-vote-point-dollar-value": sierraSlide("slide-vote-point-dollar-value"),
  "sierra-three-scenarios-all-win": sierraSlide("slide-three-scenarios-all-win"),
  "sierra-government-track-record": sierraSlide("slide-government-track-record"),
  "sierra-congress-military-trials-ratio": sierraSlide("slide-congress-military-trials-ratio"),
  "sierra-smart-contract-superpac": sierraSlide("slide-smart-contract-superpac"),
  "sierra-decentralized-irs": sierraSlide("slide-decentralized-irs"),
  "sierra-decentralized-welfare": sierraSlide("slide-decentralized-welfare"),
  "sierra-decentralized-federal-reserve": sierraSlide("slide-decentralized-federal-reserve"),
  "sierra-drug-policy-natural-experiment": sierraSlide("slide-drug-policy-natural-experiment"),
  "sierra-pencil-supply-chain": sierraSlide("slide-pencil-supply-chain"),
  "sierra-disease-cure-supply-chain": sierraSlide("slide-disease-cure-supply-chain"),
  "sierra-alignment-switch": sierraSlide("slide-alignment-switch"),
  "sierra-personal-income-3-timelines": sierraSlide("slide-personal-income-3-timelines"),
  "sierra-compound-growth-scenarios": sierraSlide("slide-compound-growth-scenarios"),
  "sierra-170t-opportunity-cost": sierraSlide("slide-170t-opportunity-cost"),
};

// Merge registries
Object.assign(slideRegistry, sierraRegistry);

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

export function getSlideComponent(componentId: string): ComponentType {
  return slideRegistry[componentId] ?? PlaceholderSlide;
}

export { PlaceholderSlide };
