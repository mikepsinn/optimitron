import Layout from "../components/layout"
import HeroSection from "@/components/landing/hero-section"
import YourImpactSection from "@/components/landing/your-impact-section"
import ProblemStatement from "@/components/landing/problem-statement"
import WarVsCuresChart from "@/components/landing/war-vs-cures-chart"
import SolutionBridgeSection from "@/components/landing/solution-bridge-section"
import TreatyVisualization from "@/components/landing/treaty-visualization"
import PragmaticTrialCostProofSection from "@/components/landing/pragmatic-trial-cost-proof-section"
import FundingImpactBreakdownSection from "@/components/landing/funding-impact-breakdown-section"
import TreatyVoteSection from "@/components/landing/treaty-vote-section"
import CallToAction from "@/components/landing/call-to-action"
import SocietalBenefitsConcise from "@/components/landing/societal-benefits-concise"
import DeathClock from "@/components/landing/death-clock"
import FinalCTA from "@/components/landing/final-cta"
import DecentralizedFDASection from "@/components/landing/decentralized-fda-section"
import { SystemProblemsSection } from "@/components/landing/SystemProblemsSection"
import { BottleneckProofSection } from "@/components/landing/bottleneck-proof-section"
import { hasVotingEnabled } from "@/lib/voting"

export default async function HomePage() {
  return (
    <Layout>
      <HeroSection />
      {hasVotingEnabled() && <TreatyVoteSection />}
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
      {hasVotingEnabled() && <TreatyVoteSection sectionId="vote-final" />}
      <YourImpactSection />
      <CallToAction />
      <DeathClock />
      <FinalCTA showDonateButton={false} />
    </Layout>
  )
}
