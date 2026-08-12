import Layout from "../components/layout"
import HeroSection from "@/components/landing/hero-section"
import ProblemStatement from "@/components/landing/problem-statement"
import WarVsCuresChart from "@/components/landing/war-vs-cures-chart"
import SolutionBridgeSection from "@/components/landing/solution-bridge-section"
import CallToAction from "@/components/landing/call-to-action"
import FinalCTA from "@/components/landing/final-cta"
import { SystemProblemsSection } from "@/components/landing/SystemProblemsSection"
import { SectionContainer } from "@/components/ui/section-container"
import { Container } from "@/components/ui/container"

/**
 * CureDAO front door — look stays the current landing.
 * No donate. No money ask. Product links only.
 */
export default function HomePage() {
  return (
    <Layout>
      <HeroSection />
      <ProblemStatement />
      <SystemProblemsSection />
      <WarVsCuresChart />
      <SolutionBridgeSection />
      <CallToAction />
      <FinalCTA />

      <SectionContainer bgColor="background" borderPosition="none" padding="md">
        <Container>
          <h2 className="text-2xl font-black uppercase mb-4">Where to go next</h2>
          <ul className="grid gap-2 sm:grid-cols-2 font-bold">
            <li>
              <a className="underline" href="https://warondisease.org">
                War on Disease — campaign &amp; vote
              </a>
            </li>
            <li>
              <a className="underline" href="https://trialabundancesurvey.org">
                Trial Abundance Survey — research survey
              </a>
            </li>
            <li>
              <a className="underline" href="https://dfda.earth">
                dFDA — conditions &amp; treatments
              </a>
            </li>
            <li>
              <a className="underline" href="https://wishocracy.org">
                Wishocracy — priority allocation
              </a>
            </li>
          </ul>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
