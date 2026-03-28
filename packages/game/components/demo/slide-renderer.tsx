"use client";

import { useDemoStore } from "@/lib/demo/store";
import { SLIDES } from "@/lib/demo/demo-config";

// Act I slides
import { SlideDailyDeathToll } from "./slides/act1/slide-daily-death-toll";
import { SlideMisalignedSuperintelligence } from "./slides/act1/slide-misaligned-superintelligence";
import { SlideMilitaryWaste170t } from "./slides/act1/slide-military-waste-170t";
import { SlideGovernmentBodyCount } from "./slides/act1/slide-government-body-count";
import { SlideInflationWageTheft } from "./slides/act1/slide-inflation-wage-theft";
import { SlideEarthOptimizationGame } from "./slides/act1/slide-earth-optimization-game";
import { SlideMilitaryHealthRatio } from "./slides/act1/slide-military-health-ratio";
import { SlideEconomicCollapseClock } from "./slides/act1/slide-economic-collapse-clock";
import { SlideGlobalFailedState } from "./slides/act1/slide-global-failed-state";
import { SlideAiHackerSpiral } from "./slides/act1/slide-ai-hacker-spiral";
import { SlideAiHackerBreach } from "./slides/act1/slide-ai-hacker-breach";
import { SlideGameOverMoronia } from "./slides/act1/slide-game-over-moronia";

// Turn
import { SlideRestoreFromWishonia } from "./slides/turn/slide-restore-from-wishonia";

// Act II slides
import { SlideOnePercentTreaty } from "./slides/act2/slide-one-percent-treaty";
import { SlideTrialAcceleration12x } from "./slides/act2/slide-trial-acceleration-12x";
import { SlideHealthcareVsMilitaryRoi } from "./slides/act2/slide-healthcare-vs-military-roi";
import { SlideEconomicVirtuousLoop } from "./slides/act2/slide-economic-virtuous-loop";
import { SlideGdp20YearForecast } from "./slides/act2/slide-gdp-20-year-forecast";
import { SlideCompoundGrowthScenarios } from "./slides/act2/slide-compound-growth-scenarios";
import { SlidePluralisticIgnoranceBug } from "./slides/act2/slide-pluralistic-ignorance-bug";
import { SlidePublicVsLobbyist90to1 } from "./slides/act2/slide-public-vs-lobbyist-90to1";
import { SlideDysfunctionTax101t } from "./slides/act2/slide-dysfunction-tax-101t";
import { SlideWinConditionsHaleIncome } from "./slides/act2/slide-win-conditions-hale-income";
import { SlidePairwiseBudgetAllocation } from "./slides/act2/slide-pairwise-budget-allocation";
import { SlideEigenvectorBudgetResult } from "./slides/act2/slide-eigenvector-budget-result";
import { SlideOnePercentReferendumVote } from "./slides/act2/slide-one-percent-referendum-vote";
import { SlideViralDoublingTo4b } from "./slides/act2/slide-viral-doubling-to-4b";
import { SlideVoteValueAsymmetry } from "./slides/act2/slide-vote-value-asymmetry";
import { SlideRecruitNetworkEffect } from "./slides/act2/slide-recruit-network-effect";
import { SlidePrizePoolVsIndexFund } from "./slides/act2/slide-prize-pool-vs-index-fund";
import { SlideDominantAssuranceContract } from "./slides/act2/slide-dominant-assurance-contract";
import { SlideVotePointDollarValue } from "./slides/act2/slide-vote-point-dollar-value";
import { SlideThreeScenariosAllWin } from "./slides/act2/slide-three-scenarios-all-win";
import { SlideGovernmentTrackRecord } from "./slides/act2/slide-government-track-record";
import { SlideCongressMilitaryTrialsRatio } from "./slides/act2/slide-congress-military-trials-ratio";
import { SlideHaleLeaderboardByCountry } from "./slides/act2/slide-hale-leaderboard-by-country";
import { SlideFdaApprovalDelay8yr } from "./slides/act2/slide-fda-approval-delay-8yr";
import { SlideDecentralizedFda } from "./slides/act2/slide-decentralized-fda";
import { SlideIncentiveAlignmentBonds } from "./slides/act2/slide-incentive-alignment-bonds";
import { SlideSmartContractSuperpac } from "./slides/act2/slide-smart-contract-superpac";
import { SlideIpfsImmutableStorage } from "./slides/act2/slide-ipfs-immutable-storage";
import { SlideImpactCertificates } from "./slides/act2/slide-impact-certificates";
import { SlideDecentralizedIrs } from "./slides/act2/slide-decentralized-irs";
import { SlideDecentralizedWelfare } from "./slides/act2/slide-decentralized-welfare";
import { SlideDecentralizedFederalReserve } from "./slides/act2/slide-decentralized-federal-reserve";
import { SlideOptimalPolicyGenerator } from "./slides/act2/slide-optimal-policy-generator";
import { SlideDrugPolicyNaturalExperiment } from "./slides/act2/slide-drug-policy-natural-experiment";
import { SlideOptimalBudgetGenerator } from "./slides/act2/slide-optimal-budget-generator";
import { SlidePencilSupplyChain } from "./slides/act2/slide-pencil-supply-chain";
import { SlideDiseaseCureSupplyChain } from "./slides/act2/slide-disease-cure-supply-chain";
import { SlideAlignmentSwitch } from "./slides/act2/slide-alignment-switch";

// Act III slides
import { SlidePersonalIncome3Timelines } from "./slides/act3/slide-personal-income-3-timelines";
import { SlideTenBillionLivesSaved } from "./slides/act3/slide-ten-billion-lives-saved";
import { SlideFinalCallToAction } from "./slides/act3/slide-final-call-to-action";
import { SlidePostCreditsAliens } from "./slides/act3/slide-post-credits-aliens";

import { DataSlide } from "./slides/data-slide";

// Map slide IDs to components (IDs from demo-config.ts)
const slideComponents: Record<string, React.ComponentType> = {
  // Act I slides
  "daily-death-toll": SlideDailyDeathToll,
  "misaligned-superintelligence": SlideMisalignedSuperintelligence,
  "military-waste-170t": SlideMilitaryWaste170t,
  "government-body-count": SlideGovernmentBodyCount,
  "inflation-wage-theft": SlideInflationWageTheft,
  "earth-optimization-game": SlideEarthOptimizationGame,
  "military-health-ratio": SlideMilitaryHealthRatio,
  "economic-collapse-clock": SlideEconomicCollapseClock,
  "global-failed-state": SlideGlobalFailedState,
  "ai-hacker-spiral": SlideAiHackerSpiral,
  "ai-hacker-breach": SlideAiHackerBreach,
  "game-over-moronia": SlideGameOverMoronia,

  // Turn
  "restore-from-wishonia": SlideRestoreFromWishonia,

  // Act II slides
  "one-percent-treaty": SlideOnePercentTreaty,
  "trial-acceleration-12x": SlideTrialAcceleration12x,
  "healthcare-vs-military-roi": SlideHealthcareVsMilitaryRoi,
  "economic-virtuous-loop": SlideEconomicVirtuousLoop,
  "gdp-20-year-forecast": SlideGdp20YearForecast,
  "compound-growth-scenarios": SlideCompoundGrowthScenarios,
  "pluralistic-ignorance-bug": SlidePluralisticIgnoranceBug,
  "public-vs-lobbyist-90to1": SlidePublicVsLobbyist90to1,
  "dysfunction-tax-101t": SlideDysfunctionTax101t,
  "win-conditions-hale-income": SlideWinConditionsHaleIncome,
  "pairwise-budget-allocation": SlidePairwiseBudgetAllocation,
  "eigenvector-budget-result": SlideEigenvectorBudgetResult,
  "one-percent-referendum-vote": SlideOnePercentReferendumVote,
  "viral-doubling-to-4b": SlideViralDoublingTo4b,
  "vote-value-asymmetry": SlideVoteValueAsymmetry,
  "recruit-network-effect": SlideRecruitNetworkEffect,
  "prize-pool-vs-index-fund": SlidePrizePoolVsIndexFund,
  "dominant-assurance-contract": SlideDominantAssuranceContract,
  "vote-point-dollar-value": SlideVotePointDollarValue,
  "three-scenarios-all-win": SlideThreeScenariosAllWin,
  "government-track-record": SlideGovernmentTrackRecord,
  "congress-military-trials-ratio": SlideCongressMilitaryTrialsRatio,
  "hale-leaderboard-by-country": SlideHaleLeaderboardByCountry,
  "fda-approval-delay-8yr": SlideFdaApprovalDelay8yr,
  "decentralized-fda": SlideDecentralizedFda,
  "incentive-alignment-bonds": SlideIncentiveAlignmentBonds,
  "smart-contract-superpac": SlideSmartContractSuperpac,
  "ipfs-immutable-storage": SlideIpfsImmutableStorage,
  "impact-certificates": SlideImpactCertificates,
  "decentralized-irs": SlideDecentralizedIrs,
  "decentralized-welfare": SlideDecentralizedWelfare,
  "decentralized-federal-reserve": SlideDecentralizedFederalReserve,
  "optimal-policy-generator": SlideOptimalPolicyGenerator,
  "drug-policy-natural-experiment": SlideDrugPolicyNaturalExperiment,
  "optimal-budget-generator": SlideOptimalBudgetGenerator,
  "pencil-supply-chain": SlidePencilSupplyChain,
  "disease-cure-supply-chain": SlideDiseaseCureSupplyChain,
  "alignment-switch": SlideAlignmentSwitch,

  // Act III slides
  "personal-income-3-timelines": SlidePersonalIncome3Timelines,
  "ten-billion-lives-saved": SlideTenBillionLivesSaved,
  "final-call-to-action": SlideFinalCallToAction,
  "post-credits-aliens": SlidePostCreditsAliens,
};

export function SlideRenderer() {
  const currentSlide = useDemoStore((s) => s.currentSlide);
  const slideConfig = SLIDES[currentSlide];

  if (!slideConfig) return null;

  const Component = slideComponents[slideConfig.id] || DataSlide;

  return <Component />;
}
