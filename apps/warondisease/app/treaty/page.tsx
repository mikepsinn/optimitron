import type { Metadata } from "next"
import Layout from "@/components/layout"
import { TreatySignatureBox } from "@/components/landing/TreatySignatureBox"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { getSessionUserId } from "@/lib/auth-utils"
import { getTreatyPageContent } from "@/lib/treaty-content.server"
import { getUserTreatyVote } from "@/lib/treaty-votes.server"
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_REDUCTION_PCT,
} from "@/lib/parameters-calculations-citations"
import { TreatyMarkdown } from "./treaty-markdown"

const treatyReduction = `${Math.round(TREATY_REDUCTION_PCT.value * 100)}%`
const statusQuoYears = Math.round(
  STATUS_QUO_QUEUE_CLEARANCE_YEARS.value,
).toLocaleString("en-US")
const dfdaYears = Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value).toLocaleString(
  "en-US",
)

export const metadata: Metadata = {
  title: "Sign the Treaty",
  description: `The 1% Treaty redirects ${treatyReduction} of military spending to clinical trials, cutting the disease-eradication timeline from ${statusQuoYears} years to ${dfdaYears}. Nobody gets weaker. Everyone gets more medicine.`,
}

/**
 * `/treaty` — the skim-and-sign surface: one centered headline, the treaty
 * body rendered as a single continuous markdown document, and a single
 * signature box at the bottom. No multi-step prelude, no competing CTAs.
 */
export default async function TreatyPage() {
  const treaty = await getTreatyPageContent()

  const userId = await getSessionUserId()
  let initialSignedYes = false
  if (userId) {
    const existingVote = await getUserTreatyVote(userId)
    initialSignedYes = existingVote?.answer === "YES"
  }

  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="bottom" padding="md">
        <Container size="md">
          <article className="mx-auto max-w-3xl">
            <h1 className="text-center text-3xl font-black uppercase sm:text-4xl md:text-5xl">
              Please quickly skim and sign to end war and disease.
            </h1>
            <TreatyMarkdown markdown={treaty.bodyMarkdown} />
            <section id="sign" className="mt-12">
              <TreatySignatureBox initialSignedYes={initialSignedYes} />
            </section>
          </article>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
