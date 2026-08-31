import {
  generateSurveyResearchMetadata,
  ResearchPage,
} from "@optimitron/site-kit/components/research-page"

export function generateMetadata() {
  return generateSurveyResearchMetadata()
}

export default function TrialAbundanceSurveyResearchPage() {
  return <ResearchPage variant="survey" />
}
