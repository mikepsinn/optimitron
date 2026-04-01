/**
 * Demo slide registry.
 *
 * Every `slideId` must resolve to an explicit renderer entry. Unknown ids
 * should fail loudly in development and typecheck.
 */

import type { ComponentType } from "react";
import { lazy } from "react";

type DemoSlideComponent = ComponentType<any>;
interface DemoSlideComponentEntry {
  component: DemoSlideComponent;
  sourcePath: string;
}

const demoSlide = (file: string) =>
  ({
    component: lazy(
      () => import(/* webpackInclude: /\.tsx$/ */ `./sierra/${file}.tsx`),
    ) as unknown as DemoSlideComponent,
    sourcePath: `packages/web/src/components/demo/slides/sierra/${file}.tsx`,
  }) satisfies DemoSlideComponentEntry;

export const slideRegistry = {
  "170t-opportunity-cost": demoSlide("slide-170t-opportunity-cost"),
  "ai-hacker-breach": demoSlide("slide-ai-hacker-breach"),
  "ai-hacker-spiral": demoSlide("slide-ai-hacker-spiral"),
  "ai-terminal": demoSlide("slide-ai-terminal"),
  "alignment-switch": demoSlide("slide-alignment-switch"),
  armory: demoSlide("slide-armory"),
  "compound-growth-scenarios": demoSlide("slide-compound-growth-scenarios"),
  "congress-military-trials-ratio": demoSlide(
    "slide-congress-military-trials-ratio",
  ),
  "daily-death-toll": demoSlide("slide-daily-death-toll"),
  "decentralized-fda": demoSlide("slide-decentralized-fda"),
  "decentralized-federal-reserve": demoSlide(
    "slide-decentralized-federal-reserve",
  ),
  "decentralized-irs": demoSlide("slide-decentralized-irs"),
  "decentralized-welfare": demoSlide("slide-decentralized-welfare"),
  "disease-cure-supply-chain": demoSlide("slide-disease-cure-supply-chain"),
  "dominant-assurance-contract": demoSlide("slide-dominant-assurance-contract"),
  "drug-policy-natural-experiment": demoSlide(
    "slide-drug-policy-natural-experiment",
  ),
  "dysfunction-tax-101t": demoSlide("slide-dysfunction-tax-101t"),
  "earth-optimization-game": demoSlide("slide-earth-optimization-game"),
  "economic-collapse-clock": demoSlide("slide-economic-collapse-clock"),
  "economic-virtuous-loop": demoSlide("slide-economic-virtuous-loop"),
  "eigenvector-budget-result": demoSlide("slide-eigenvector-budget-result"),
  "fda-approval-delay-8yr": demoSlide("slide-fda-approval-delay-8yr"),
  "final-call-to-action": demoSlide("slide-final-call-to-action"),
  "game-over-moronia": demoSlide("slide-game-over-moronia"),
  "gdp-20-year-forecast": demoSlide("slide-gdp-20-year-forecast"),
  "global-failed-state": demoSlide("slide-global-failed-state"),
  "government-body-count": demoSlide("slide-government-body-count"),
  "government-track-record": demoSlide("slide-government-track-record"),
  "hale-leaderboard-by-country": demoSlide(
    "slide-hale-leaderboard-by-country",
  ),
  "healthcare-vs-military-roi": demoSlide("slide-healthcare-vs-military-roi"),
  "impact-certificates": demoSlide("slide-impact-certificates"),
  "incentive-alignment-bonds": demoSlide("slide-incentive-alignment-bonds"),
  "inflation-wage-theft": demoSlide("slide-inflation-wage-theft"),
  "ipfs-immutable-storage": demoSlide("slide-ipfs-immutable-storage"),
  "military-health-ratio": demoSlide("slide-military-health-ratio"),
  "military-waste-170t": demoSlide("slide-military-waste-170t"),
  "misaligned-superintelligence": demoSlide(
    "slide-misaligned-superintelligence",
  ),
  "one-percent-referendum-vote": demoSlide(
    "slide-one-percent-referendum-vote",
  ),
  "one-percent-treaty": demoSlide("slide-one-percent-treaty"),
  "optimal-budget-generator": demoSlide("slide-optimal-budget-generator"),
  "optimal-policy-generator": demoSlide("slide-optimal-policy-generator"),
  "pairwise-budget-allocation": demoSlide("slide-pairwise-budget-allocation"),
  "pencil-supply-chain": demoSlide("slide-pencil-supply-chain"),
  "personal-income-3-timelines": demoSlide("slide-personal-income-3-timelines"),
  "pluralistic-ignorance": demoSlide("slide-pluralistic-ignorance"),
  "pluralistic-ignorance-bug": demoSlide("slide-pluralistic-ignorance-bug"),
  "post-credits-aliens": demoSlide("slide-post-credits-aliens"),
  "prize-pool-vs-index-fund": demoSlide("slide-prize-pool-vs-index-fund"),
  "public-vs-lobbyist-90to1": demoSlide("slide-public-vs-lobbyist-90to1"),
  "recruit-network-effect": demoSlide("slide-recruit-network-effect"),
  "restore-from-wishonia": demoSlide("slide-restore-from-wishonia"),
  "smart-contract-superpac": demoSlide("slide-smart-contract-superpac"),
  "ten-billion-lives-saved": demoSlide("slide-ten-billion-lives-saved"),
  "three-scenarios-all-win": demoSlide("slide-three-scenarios-all-win"),
  "trial-acceleration-12x": demoSlide("slide-trial-acceleration-12x"),
  "viral-doubling-to-4b": demoSlide("slide-viral-doubling-to-4b"),
  "vote-point-dollar-value": demoSlide("slide-vote-point-dollar-value"),
  "vote-value-asymmetry": demoSlide("slide-vote-value-asymmetry"),
  "win-conditions-hale-income": demoSlide("slide-win-conditions-hale-income"),
} satisfies Record<string, DemoSlideComponentEntry>;

export type DemoSlideId = keyof typeof slideRegistry;
const slideRegistryById: Record<string, DemoSlideComponentEntry> = slideRegistry;

export function getSlideComponent(slideId: string): DemoSlideComponent {
  const entry = slideRegistryById[slideId];
  if (!entry) {
    throw new Error(`Unknown demo slide renderer: ${slideId}`);
  }
  return entry.component;
}

export function hasSlideComponent(slideId: string): boolean {
  return slideRegistryById[slideId] !== undefined;
}

export function getSlideComponentSourcePath(slideId: string): string | null {
  return slideRegistryById[slideId]?.sourcePath ?? null;
}
