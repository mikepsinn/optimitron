import Layout from "../components/layout";
import HeroSection from "@/components/landing/hero-section";
import ProblemStatement from "@/components/landing/problem-statement";
import WarVsCuresChart from "@/components/landing/war-vs-cures-chart";
import SolutionBridgeSection from "@/components/landing/solution-bridge-section";
import PragmaticTrialCostProofSection from "@/components/landing/pragmatic-trial-cost-proof-section";
import CallToAction from "@/components/landing/call-to-action";
import FinalCTA from "@/components/landing/final-cta";
import Link from "next/link";
import { SurveyEmbed } from "@optimitron/survey-embed";
import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";

/**
 * Institute for Accelerated Medicine — case + donate + embedded survey.
 * Survey origin is trialabundancesurvey.org (not this host).
 */
export default function HomePage() {
  const surveyOrigin =
    process.env.NEXT_PUBLIC_SURVEY_ORIGIN ?? "https://trialabundancesurvey.org";

  return (
    <Layout>
      <HeroSection />
      <ProblemStatement />
      <WarVsCuresChart />
      <SolutionBridgeSection />
      <PragmaticTrialCostProofSection />

      <SectionContainer
        id="vote"
        bgColor="yellow"
        borderPosition="both"
        padding="lg"
      >
        <Container>
          <h2 className="text-3xl sm:text-5xl font-black uppercase mb-4">
            Take the survey
          </h2>
          <p className="text-lg font-bold mb-6 max-w-3xl">
            The Global Clinical Trial Abundance Survey is hosted on a neutral
            research site. Your response is recorded there — we embed it here so
            you don’t leave the case for cures.
          </p>
          <SurveyEmbed origin={surveyOrigin} height={780} />
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="pink" borderPosition="both" padding="lg">
        <Container className="text-center">
          <h2 className="text-3xl sm:text-5xl font-black uppercase mb-4">
            Fund the work
          </h2>
          <p className="text-lg font-bold mb-6">
            Donations go to the Institute for Accelerated Medicine.
          </p>
          <Link
            href="/donate"
            className="inline-block border-4 border-primary bg-background px-6 py-3 text-xl font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            Donate
          </Link>
        </Container>
      </SectionContainer>

      <CallToAction />
      <FinalCTA />

      <SectionContainer bgColor="background" borderPosition="none" padding="md">
        <Container>
          <h2 className="text-2xl font-black uppercase mb-4">
            Related projects
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 font-bold">
            <li>
              <a className="underline" href="https://warondisease.org">
                War on Disease
              </a>
            </li>
            <li>
              <a className="underline" href="https://dfda.earth">
                dFDA encyclopedia
              </a>
            </li>
            <li>
              <a className="underline" href="https://wishocracy.org">
                Wishocracy
              </a>
            </li>
            <li>
              <a className="underline" href="https://trialabundancesurvey.org">
                Trial Abundance Survey
              </a>
            </li>
            <li>
              <a className="underline" href="https://curedao.org">
                CureDAO
              </a>
            </li>
          </ul>
        </Container>
      </SectionContainer>
    </Layout>
  );
}
