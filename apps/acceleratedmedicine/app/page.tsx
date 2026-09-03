import Layout from "../components/layout";
import { parseTrialAbundanceVisualState } from "@optimitron/site-kit/lib/trial-abundance-visual";
import ProblemStatement from "@/components/landing/problem-statement";
import DeathClock from "@/components/landing/death-clock";
import DecentralizedFDASection from "@/components/landing/decentralized-fda-section";
import { SystemProblemsSection } from "@/components/landing/SystemProblemsSection";
import { BottleneckProofSection } from "@/components/landing/bottleneck-proof-section";
import {
  MedicalFreedomAccessSection,
  MedicalFreedomBridgeSection,
  ModeledBenefitsSection,
  ParticipationGapSection,
  PatientImpactSection,
  PragmaticTrialEvidenceSection,
} from "@/components/landing/medical-freedom-sections";
import {
  MontanaProofSection,
  PatientAccessFlowSection,
  RightToTrialImpactPreviewSection,
  RightToTryEvolutionSection,
  RoleActionSection,
  StateCampaignMapSection,
  StateSupportSection,
  UniversalRightToTryFinalCTA,
  UniversalRightToTryHero,
} from "@/components/landing/right-to-try-sections";

/**
 * Right to Trial Initiative — patient access, shared evidence, and
 * pragmatic clinical-trial education.
 */
export default async function HomePage({ searchParams }: {
  searchParams?: Promise<{ visual?: string }>
}) {
  const visualState = parseTrialAbundanceVisualState((await searchParams)?.visual);
  return (
    <Layout>
      <StateSupportSection headingAs="h1" visualState={visualState} />
      <UniversalRightToTryHero />
      <MontanaProofSection />
      <RightToTryEvolutionSection />
      <PatientAccessFlowSection />
      <RightToTrialImpactPreviewSection />
      <StateCampaignMapSection />
      <ParticipationGapSection />
      <ProblemStatement useExactPatientCount />
      <SystemProblemsSection />
      <MedicalFreedomAccessSection />
      <MedicalFreedomBridgeSection />
      <PragmaticTrialEvidenceSection />
      <BottleneckProofSection scenario="medical-freedom" />
      <ModeledBenefitsSection />
      <DecentralizedFDASection showDisclaimer={false} />
      <PatientImpactSection />
      <RoleActionSection />
      <DeathClock message="while safe treatments remain untested and willing patients remain excluded" />
      <UniversalRightToTryFinalCTA />
    </Layout>
  );
}
