import {
  generateCampaignResearchMetadata,
  ResearchPage,
} from "@optimitron/site-kit/components/research-page"

export function generateMetadata() {
  return generateCampaignResearchMetadata()
}

export default function WarOnDiseaseResearchPage() {
  return <ResearchPage variant="campaign" />
}
