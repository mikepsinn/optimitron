import type { ReactNode } from "react"
import { BottleneckProofSection } from "./landing/bottleneck-proof-section"
import CallToAction from "./landing/call-to-action"
import DeathClock from "./landing/death-clock"
import DecentralizedFDASection from "./landing/decentralized-fda-section"
import FinalCTA from "./landing/final-cta"
import FundingImpactBreakdownSection from "./landing/funding-impact-breakdown-section"
import HeroSection from "./landing/hero-section"
import PragmaticTrialCostProofSection from "./landing/pragmatic-trial-cost-proof-section"
import ProblemStatement from "./landing/problem-statement"
import SocietalBenefitsConcise from "./landing/societal-benefits-concise"
import SolutionBridgeSection from "./landing/solution-bridge-section"
import { SystemProblemsSection } from "./landing/SystemProblemsSection"
import TreatyVisualization from "./landing/treaty-visualization"
import WarVsCuresChart from "./landing/war-vs-cures-chart"
import YourImpactSection from "./landing/your-impact-section"

type CampaignHomePageProps = {
  primaryVoteSection?: ReactNode
  finalVoteSection?: ReactNode
}

/** The full campaign case, branded and configured by the current site variant. */
export function CampaignHomePage({
  primaryVoteSection,
  finalVoteSection,
}: CampaignHomePageProps) {
  return (
    <>
      <HeroSection />
      {primaryVoteSection}
      <ProblemStatement />
      <SystemProblemsSection />
      <WarVsCuresChart />
      <SolutionBridgeSection />
      <PragmaticTrialCostProofSection />
      <BottleneckProofSection />
      <TreatyVisualization />
      <FundingImpactBreakdownSection />
      <DecentralizedFDASection />
      <SocietalBenefitsConcise />
      {finalVoteSection}
      <YourImpactSection />
      <CallToAction />
      <DeathClock />
      <FinalCTA showDonateButton={false} />
    </>
  )
}
