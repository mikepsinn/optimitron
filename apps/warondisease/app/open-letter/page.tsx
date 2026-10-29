import type { Metadata } from "next"
import { Libre_Baskerville } from "next/font/google"
import Layout from "@/components/layout"
import { TreatySignatureBox } from "@/components/landing/TreatySignatureBox"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { getSessionUserId } from "@/lib/auth-utils"
import { getUserTreatyVote } from "@/lib/treaty-votes.server"

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--v0-font-libre-baskerville",
})

export const metadata: Metadata = {
  title: "Open Letter: Universal Care-Integrated Clinical Trials",
  description:
    "Sign the open letter calling for every patient to have the right and practical ability to join clinical trials through ordinary care.",
}

export default async function OpenLetterPage() {
  const userId = await getSessionUserId()
  let initialSignedYes = false
  if (userId) {
    const existingVote = await getUserTreatyVote(userId)
    initialSignedYes = existingVote?.answer === "YES"
  }

  return (
    <Layout>
      <SectionContainer
        bgColor="background"
        borderPosition="bottom"
        padding="md"
      >
        <Container size="md">
          <article className={`mx-auto max-w-3xl ${libreBaskerville.variable}`}>
            <header className="mb-10 text-center">
              <h1 className="text-4xl font-bold tracking-[0.04em] [font-family:var(--v0-font-libre-baskerville)] sm:text-5xl md:text-6xl">
                Open Letter
              </h1>
              <p className="mt-6 text-xl font-black uppercase tracking-[0.06em] sm:text-2xl md:text-3xl">
                Universal Care-Integrated Clinical Trials
              </p>
            </header>

            <div className="[font-family:var(--v0-font-libre-baskerville)]">
              <section className="mb-12">
                <p className="mb-8 text-left text-lg leading-9 sm:mb-10 sm:text-[1.35rem]">
                  Every patient should have the right and practical ability to:
                </p>
                <ol className="list-decimal space-y-4 pl-8 text-lg leading-8 sm:text-xl">
                  <li>Visit their own doctor.</li>
                  <li>
                    Compare treatment rankings and Outcome Labels showing
                    benefits and harms.
                  </li>
                  <li>
                    Join trials of promising treatments through ordinary care.
                  </li>
                  <li>
                    Have every result improve the evidence for the next patient.
                  </li>
                </ol>
              </section>

              <section className="mb-12 border-t-4 border-primary pt-10">
                <p className="mb-8 text-left text-lg leading-9 sm:mb-10 sm:text-[1.35rem]">
                  We call on policymakers, health systems, and research funders
                  to:
                </p>
                <ol className="list-decimal space-y-6 pl-8 text-lg leading-8 sm:text-xl">
                  <li>
                    <span className="font-bold">
                      Enable participation through ordinary care:
                    </span>{" "}
                    put the policies and trial infrastructure in place so
                    patients can join through their own doctor.
                  </li>
                  <li>
                    <span className="font-bold">
                      Fund clinics&apos; research work:
                    </span>{" "}
                    pay for the extra staff time, monitoring, and outcome
                    reporting needed to make participation practical.
                  </li>
                  <li>
                    <span className="font-bold">Make every result count:</span>{" "}
                    require timely public reporting of positive, negative, and
                    inconclusive results, with patient privacy protected.
                  </li>
                </ol>
              </section>
            </div>

            <section id="sign" className="mt-12">
              <h2 className="mb-6 text-center text-2xl font-black uppercase tracking-[0.08em]">
                Add Your Name
              </h2>
              <TreatySignatureBox initialSignedYes={initialSignedYes} />
            </section>
          </article>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
