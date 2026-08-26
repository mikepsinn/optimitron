import Layout from "../components/layout";
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
  MissouriCampaignSection,
  MontanaProofSection,
  PatientAccessFlowSection,
  RightToTryEvolutionSection,
  RoleActionSection,
  StateCampaignMapSection,
  StateSupportSection,
  UniversalRightToTryFinalCTA,
  UniversalRightToTryHero,
} from "@/components/landing/right-to-try-sections";

/**
 * Institute for Accelerated Medicine — patient access, shared evidence, and
 * pragmatic clinical-trial education.
 */
export default function HomePage() {
  return (
    <Layout>
      <UniversalRightToTryHero />
      <MontanaProofSection />
      <RightToTryEvolutionSection />
      <PatientAccessFlowSection />
      <StateSupportSection />
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
      <MissouriCampaignSection />
      <DeathClock message="while safe treatments remain untested and willing patients remain excluded" />
      <UniversalRightToTryFinalCTA />
    </Layout>
  );
}
