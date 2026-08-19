import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Layout from "@/components/layout"
import TreatyVoteSection from "@/components/landing/treaty-vote-section"
import { getSessionUserId } from "@/lib/auth-utils"
import { getUserTreatyVote } from "@/lib/treaty-votes.server"
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
} from "@/lib/parameters-calculations-citations"

const statusQuoYears = Math.round(
  STATUS_QUO_QUEUE_CLEARANCE_YEARS.value,
).toLocaleString("en-US")
const dfdaYears = Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value).toLocaleString(
  "en-US",
)
const apocalypseCount = Math.round(
  NUCLEAR_WINTER_OVERKILL_FACTOR.value,
).toLocaleString("en-US")

export const metadata: Metadata = {
  title: "Vote",
  description: `One question, thirty seconds: should humanity trade one of its ${apocalypseCount} apocalypses for disease eradication in ${dfdaYears} years instead of ${statusQuoYears}?`,
}

export default async function VotePage() {
  // A signed-in user who already voted gets the dashboard instead of
  // re-rendering the slider they already filled out. Vote upserts are
  // idempotent (no data harm if they re-submit), but the dashboard is the
  // right post-vote experience.
  const userId = await getSessionUserId()
  if (userId) {
    const existingVote = await getUserTreatyVote(userId)
    if (existingVote) {
      redirect("/dashboard")
    }
  }

  return (
    <Layout>
      <TreatyVoteSection sectionId="vote" />
    </Layout>
  )
}
