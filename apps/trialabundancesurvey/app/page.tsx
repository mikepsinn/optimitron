import Layout from "../components/layout"
import TrialAbundanceSurveySection from "@/components/landing/trial-abundance-survey-section"
import { parseTrialAbundanceVisualState } from "@optimitron/site-kit/lib/trial-abundance-visual"
import Link from "next/link"
import { ROUTES } from "@optimitron/site-kit/lib/routes"

interface HomePageProps {
  searchParams?: Promise<{ visual?: string }>
}

/**
 * Trial Abundance Survey home — neutral instrument, not War on Disease.
 * Full campaign dashboard lives on warondisease.org (soft CTA only after vote).
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const visual = (await searchParams)?.visual
  const visualState = parseTrialAbundanceVisualState(visual)

  return (
    <Layout>
      <TrialAbundanceSurveySection
        disableIntroAnimation={Boolean(visualState)}
        visualState={visualState}
      />
      <p className="px-6 py-8 text-center font-bold">
        <Link href={ROUTES.surveyResults} className="underline underline-offset-4">View current survey results</Link>
      </p>
    </Layout>
  )
}
