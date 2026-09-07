import Link from "next/link"
import Layout from "../../components/layout"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import { SurveyResultsCard } from "@optimitron/site-kit/components/dashboard/SurveyResultsCard"
import { getPageMetadata } from "@optimitron/site-kit/lib/nav-items"
import { ROUTES } from "@optimitron/site-kit/lib/routes"
import { getTrialAbundanceSurveyResults } from "@optimitron/site-kit/lib/survey-results.server"
import { getSurveyResultsVisualFixture } from "@optimitron/site-kit/lib/survey-results-visual"

export const dynamic = "force-dynamic"

export function generateMetadata() {
  return getPageMetadata("surveyResults")
}

export default async function SurveyResultsPage({ searchParams }: {
  searchParams?: Promise<{ visual?: string }>
}) {
  const visual = (await searchParams)?.visual
  const results = getSurveyResultsVisualFixture(visual) ?? await getTrialAbundanceSurveyResults()
  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="none" padding="lg">
        <Container>
          <SurveyResultsCard results={results} headingAs="h1" />
          <div className="mt-8">
            <Button asChild><Link href={ROUTES.home}>Add your response</Link></Button>
          </div>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
