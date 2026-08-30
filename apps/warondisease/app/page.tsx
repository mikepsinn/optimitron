import Layout from "../components/layout"
import TreatyVoteSection from "@/components/landing/treaty-vote-section"
import { CampaignHomePage } from "@optimitron/site-kit/components/campaign-home-page"
import { hasVotingEnabled } from "@/lib/voting"

export default function HomePage() {
  const votingEnabled = hasVotingEnabled()

  return (
    <Layout>
      <CampaignHomePage
        primaryVoteSection={votingEnabled ? <TreatyVoteSection authenticatedPostVoteRedirectUrl="/dashboard" /> : null}
        finalVoteSection={
          votingEnabled ? (
            <TreatyVoteSection authenticatedPostVoteRedirectUrl="/dashboard" sectionId="vote-final" />
          ) : null
        }
      />
    </Layout>
  )
}
