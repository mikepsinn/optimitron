import Layout from "../components/layout"
import TrialAbundanceSurveySection, {
  type TrialAbundanceVisualState,
} from "@/components/landing/trial-abundance-survey-section"

interface HomePageProps {
  searchParams?: Promise<{ visual?: string }>
}

/**
 * Trial Abundance Survey home — neutral instrument, not War on Disease.
 * Full campaign dashboard lives on warondisease.org (soft CTA only after vote).
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const visual = (await searchParams)?.visual
  const visualState: TrialAbundanceVisualState | undefined =
    visual === "question" || visual === "complete" ? visual : undefined

  return (
    <Layout>
      <TrialAbundanceSurveySection
        disableIntroAnimation={Boolean(visualState)}
        visualState={visualState}
      />
    </Layout>
  )
}
