import type { Metadata } from "next"
import { Libre_Baskerville } from "next/font/google"
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

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--v0-font-libre-baskerville",
})

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
 * `/treaty` — the skim-and-sign surface: a centered title and instruction,
 * the treaty body as one continuous document, and one signature box at the
 * bottom. No multi-step prelude and no competing CTAs.
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
          <article className={`mx-auto max-w-3xl ${libreBaskerville.variable}`}>
            <header className="mb-10 text-center">
              <h1 className="text-5xl font-bold tracking-[0.04em] [font-family:var(--v0-font-libre-baskerville)] sm:text-6xl md:text-7xl">
                The 1% Treaty
              </h1>
              <p className="mt-6 text-3xl font-black uppercase tracking-[0.08em] [font-family:var(--v0-font-libre-baskerville)] sm:text-4xl md:text-5xl">
                Please quickly skim and sign to end war and disease.
              </p>
            </header>
            <div className="[font-family:var(--v0-font-libre-baskerville)]">
              <TreatyMarkdown markdown={treaty.bodyMarkdown} />
            </div>
            <section id="sign" className="mt-12">
              <TreatySignatureBox initialSignedYes={initialSignedYes} />
            </section>
          </article>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
