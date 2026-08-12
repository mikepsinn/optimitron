import Layout from "../components/layout";
import HeroSection from "@/components/landing/hero-section";
import YourImpactSection from "@/components/landing/your-impact-section";
import ProblemStatement from "@/components/landing/problem-statement";
import WarVsCuresChart from "@/components/landing/war-vs-cures-chart";
import SolutionBridgeSection from "@/components/landing/solution-bridge-section";
import TreatyVisualization from "@/components/landing/treaty-visualization";
import PragmaticTrialCostProofSection from "@/components/landing/pragmatic-trial-cost-proof-section";
import FundingImpactBreakdownSection from "@/components/landing/funding-impact-breakdown-section";
import CallToAction from "@/components/landing/call-to-action";
import SocietalBenefitsConcise from "@/components/landing/societal-benefits-concise";
import DeathClock from "@/components/landing/death-clock";
import FinalCTA from "@/components/landing/final-cta";
import DecentralizedFDASection from "@/components/landing/decentralized-fda-section";
import { SystemProblemsSection } from "@/components/landing/SystemProblemsSection";
import { BottleneckProofSection } from "@/components/landing/bottleneck-proof-section";
import { SurveyEmbed, SurveyEmbedPreview } from "@optimitron/survey-embed";
import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";

/**
 * Institute for Accelerated Medicine — case + donate + embedded survey.
 * Survey origin is trialabundancesurvey.org (not this host).
 */
type HomePageProps = {
  searchParams?: Promise<{ visual?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const surveyOrigin =
    process.env.NEXT_PUBLIC_SURVEY_ORIGIN ?? "https://trialabundancesurvey.org";
  const visualCapture = (await searchParams)?.visual === "1";

  return (
    <Layout>
      <HeroSection />

      {visualCapture ? (
        <SurveyEmbedPreview />
      ) : (
        <SectionContainer
          id="vote"
          bgColor="yellow"
          borderPosition="both"
          padding="lg"
        >
          <Container>
            <h2 className="text-3xl sm:text-5xl font-black uppercase mb-4">
              Answer the question
            </h2>
            <p className="text-lg font-bold mb-6 max-w-3xl">
              Would you trade 1% of military spending for pragmatic clinical
              trials? Answer here without leaving the evidence.
            </p>
            <SurveyEmbed origin={surveyOrigin} height={780} />
          </Container>
        </SectionContainer>
      )}

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
      <YourImpactSection />
      <CallToAction />
      <DeathClock />
      <FinalCTA />
    </Layout>
  );
}
