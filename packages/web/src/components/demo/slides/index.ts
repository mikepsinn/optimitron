/**
 * Demo slide registry.
 *
 * Legacy neobrutalist component ids now resolve to Sierra-native slides or a
 * generic Sierra narration slide so we can keep the written deck content
 * without carrying two visual systems.
 */

import type { ComponentType } from "react";
import { lazy } from "react";
import LegacyNarrationSlide from "./sierra/LegacyNarrationSlide";

type DemoSlideComponent = ComponentType<any>;

const sierraSlide = (file: string) =>
  lazy(
    () => import(/* webpackInclude: /\.tsx$/ */ `./sierra/${file}.tsx`),
  ) as unknown as DemoSlideComponent;

const sierraRegistry: Record<string, DemoSlideComponent> = {
  "sierra-170t-opportunity-cost": sierraSlide("slide-170t-opportunity-cost"),
  "sierra-ai-hacker-breach": sierraSlide("slide-ai-hacker-breach"),
  "sierra-ai-hacker-spiral": sierraSlide("slide-ai-hacker-spiral"),
  "sierra-ai-terminal": sierraSlide("slide-ai-terminal"),
  "sierra-alignment-switch": sierraSlide("slide-alignment-switch"),
  "sierra-armory": sierraSlide("slide-armory"),
  "sierra-compound-growth-scenarios": sierraSlide(
    "slide-compound-growth-scenarios",
  ),
  "sierra-congress-military-trials-ratio": sierraSlide(
    "slide-congress-military-trials-ratio",
  ),
  "sierra-daily-death-toll": sierraSlide("slide-daily-death-toll"),
  "sierra-decentralized-fda": sierraSlide("slide-decentralized-fda"),
  "sierra-decentralized-federal-reserve": sierraSlide(
    "slide-decentralized-federal-reserve",
  ),
  "sierra-decentralized-irs": sierraSlide("slide-decentralized-irs"),
  "sierra-decentralized-welfare": sierraSlide("slide-decentralized-welfare"),
  "sierra-disease-cure-supply-chain": sierraSlide(
    "slide-disease-cure-supply-chain",
  ),
  "sierra-dominant-assurance-contract": sierraSlide(
    "slide-dominant-assurance-contract",
  ),
  "sierra-drug-policy-natural-experiment": sierraSlide(
    "slide-drug-policy-natural-experiment",
  ),
  "sierra-dysfunction-tax-101t": sierraSlide("slide-dysfunction-tax-101t"),
  "sierra-earth-optimization-game": sierraSlide(
    "slide-earth-optimization-game",
  ),
  "sierra-economic-collapse-clock": sierraSlide(
    "slide-economic-collapse-clock",
  ),
  "sierra-economic-virtuous-loop": sierraSlide(
    "slide-economic-virtuous-loop",
  ),
  "sierra-eigenvector-budget-result": sierraSlide(
    "slide-eigenvector-budget-result",
  ),
  "sierra-fda-approval-delay-8yr": sierraSlide(
    "slide-fda-approval-delay-8yr",
  ),
  "sierra-final-call-to-action": sierraSlide("slide-final-call-to-action"),
  "sierra-game-over-moronia": sierraSlide("slide-game-over-moronia"),
  "sierra-gdp-20-year-forecast": sierraSlide("slide-gdp-20-year-forecast"),
  "sierra-global-failed-state": sierraSlide("slide-global-failed-state"),
  "sierra-government-body-count": sierraSlide("slide-government-body-count"),
  "sierra-government-track-record": sierraSlide("slide-government-track-record"),
  "sierra-hale-leaderboard-by-country": sierraSlide(
    "slide-hale-leaderboard-by-country",
  ),
  "sierra-healthcare-vs-military-roi": sierraSlide(
    "slide-healthcare-vs-military-roi",
  ),
  "sierra-impact-certificates": sierraSlide("slide-impact-certificates"),
  "sierra-incentive-alignment-bonds": sierraSlide(
    "slide-incentive-alignment-bonds",
  ),
  "sierra-inflation-wage-theft": sierraSlide("slide-inflation-wage-theft"),
  "sierra-ipfs-immutable-storage": sierraSlide(
    "slide-ipfs-immutable-storage",
  ),
  "sierra-military-health-ratio": sierraSlide("slide-military-health-ratio"),
  "sierra-military-waste-170t": sierraSlide("slide-military-waste-170t"),
  "sierra-misaligned-superintelligence": sierraSlide(
    "slide-misaligned-superintelligence",
  ),
  "sierra-one-percent-referendum-vote": sierraSlide(
    "slide-one-percent-referendum-vote",
  ),
  "sierra-one-percent-treaty": sierraSlide("slide-one-percent-treaty"),
  "sierra-optimal-budget-generator": sierraSlide(
    "slide-optimal-budget-generator",
  ),
  "sierra-optimal-policy-generator": sierraSlide(
    "slide-optimal-policy-generator",
  ),
  "sierra-pairwise-budget-allocation": sierraSlide(
    "slide-pairwise-budget-allocation",
  ),
  "sierra-pencil-supply-chain": sierraSlide("slide-pencil-supply-chain"),
  "sierra-personal-income-3-timelines": sierraSlide(
    "slide-personal-income-3-timelines",
  ),
  "sierra-pluralistic-ignorance": sierraSlide("slide-pluralistic-ignorance"),
  "sierra-pluralistic-ignorance-bug": sierraSlide(
    "slide-pluralistic-ignorance-bug",
  ),
  "sierra-post-credits-aliens": sierraSlide("slide-post-credits-aliens"),
  "sierra-prize-pool-vs-index-fund": sierraSlide(
    "slide-prize-pool-vs-index-fund",
  ),
  "sierra-public-vs-lobbyist-90to1": sierraSlide(
    "slide-public-vs-lobbyist-90to1",
  ),
  "sierra-recruit-network-effect": sierraSlide("slide-recruit-network-effect"),
  "sierra-restore-from-wishonia": sierraSlide("slide-restore-from-wishonia"),
  "sierra-smart-contract-superpac": sierraSlide(
    "slide-smart-contract-superpac",
  ),
  "sierra-ten-billion-lives-saved": sierraSlide(
    "slide-ten-billion-lives-saved",
  ),
  "sierra-three-scenarios-all-win": sierraSlide(
    "slide-three-scenarios-all-win",
  ),
  "sierra-trial-acceleration-12x": sierraSlide(
    "slide-trial-acceleration-12x",
  ),
  "sierra-viral-doubling-to-4b": sierraSlide("slide-viral-doubling-to-4b"),
  "sierra-vote-point-dollar-value": sierraSlide(
    "slide-vote-point-dollar-value",
  ),
  "sierra-vote-value-asymmetry": sierraSlide("slide-vote-value-asymmetry"),
  "sierra-win-conditions-hale-income": sierraSlide(
    "slide-win-conditions-hale-income",
  ),
};

const legacyAliases: Record<string, string> = {
  alignment: "sierra-alignment-switch",
  "ai-spiral": "sierra-ai-hacker-spiral",
  asymmetry: "sierra-vote-value-asymmetry",
  close: "sierra-final-call-to-action",
  "collapse-clock": "sierra-economic-collapse-clock",
  "death-count": "sierra-daily-death-toll",
  dfda: "sierra-decentralized-fda",
  "dysfunction-tax": "sierra-dysfunction-tax-101t",
  "failed-state": "sierra-global-failed-state",
  "game-title": "sierra-earth-optimization-game",
  "gdp-trajectory": "sierra-economic-virtuous-loop",
  "government-leaderboard": "sierra-government-track-record",
  hook: "sierra-misaligned-superintelligence",
  "how-to-win": "sierra-three-scenarios-all-win",
  hypercerts: "sierra-impact-certificates",
  iab: "sierra-incentive-alignment-bonds",
  "i-pencil": "sierra-pencil-supply-chain",
  "level-allocate": "sierra-pairwise-budget-allocation",
  "level-recruit": "sierra-recruit-network-effect",
  "level-share": "sierra-recruit-network-effect",
  "level-vote": "sierra-one-percent-referendum-vote",
  "lives-saved": "sierra-ten-billion-lives-saved",
  "metric-changed": "sierra-alignment-switch",
  "military-pie": "sierra-military-health-ratio",
  moronia: "sierra-game-over-moronia",
  "one-percent-shift": "sierra-one-percent-treaty",
  optimizer: "sierra-optimal-policy-generator",
  "paycheck-theft": "sierra-inflation-wage-theft",
  "personal-upside": "sierra-personal-income-3-timelines",
  "pluralistic-ignorance": "sierra-pluralistic-ignorance-bug",
  "prize-free-option": "sierra-three-scenarios-all-win",
  "prize-investment": "sierra-prize-pool-vs-index-fund",
  "prize-mechanism": "sierra-dominant-assurance-contract",
  "quest-objectives": "sierra-win-conditions-hale-income",
  scoreboard: "sierra-win-conditions-hale-income",
  storacha: "sierra-ipfs-immutable-storage",
  superpac: "sierra-smart-contract-superpac",
  terminal: "sierra-ai-terminal",
  "the-question": "sierra-one-percent-referendum-vote",
  tools: "sierra-armory",
  "trial-acceleration": "sierra-trial-acceleration-12x",
  "viral-doubling": "sierra-viral-doubling-to-4b",
  "vote-point-value": "sierra-vote-point-dollar-value",
  "why-play": "sierra-economic-collapse-clock",
  wishocracy: "sierra-pairwise-budget-allocation",
  "wish-token": "sierra-decentralized-irs",
  "wishonia-slide": "sierra-restore-from-wishonia",
};

export function getSlideComponent(slideId: string): DemoSlideComponent {
  if (sierraRegistry[slideId]) {
    return sierraRegistry[slideId];
  }

  const alias = legacyAliases[slideId];
  if (alias && sierraRegistry[alias]) {
    return sierraRegistry[alias];
  }

  return LegacyNarrationSlide;
}

export { LegacyNarrationSlide };
