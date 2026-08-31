import Layout from "../components/layout"
import TreatyVoteSection from "@/components/landing/treaty-vote-section"

/**
 * Trial Abundance Survey home — neutral instrument, not War on Disease.
 * Full campaign dashboard lives on warondisease.org (soft CTA only after vote).
 */
export default function HomePage() {
  return (
    <Layout>
      <TreatyVoteSection postVoteMode="lite" />
    </Layout>
  )
}
