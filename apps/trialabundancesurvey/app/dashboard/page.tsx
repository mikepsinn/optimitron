import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Layout from "../../components/layout"
import { requireAuth } from "@/lib/auth-utils"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { getUserTreatyVote } from "@/lib/treaty-votes.server"
import Link from "next/link"

export const dynamic = "force-dynamic"

/**
 * Lite participant home — vote status + share survey.
 * Scores / badges / soldiers stay on warondisease.org (optional opt-in).
 */
export default async function LiteDashboardPage() {
  let userId: string
  try {
    ;({ userId } = await requireAuth())
  } catch {
    redirect("/auth/signin?callbackUrl=/dashboard")
  }

  const vote = await getUserTreatyVote(userId).catch(() => null)
  const headersList = await headers()
  const host = headersList.get("host") ?? "trialabundancesurvey.org"
  const proto = host.includes("localhost") ? "http" : "https"
  const surveyUrl = `${proto}://${host}`

  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="none" padding="lg">
        <Container>
          <h1 className="text-4xl sm:text-5xl font-black uppercase mb-6">
            Your survey response
          </h1>
          <Card className="border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
            {vote ? (
              <p className="text-lg font-bold">
                Recorded:{" "}
                <span className="text-brutal-cyan">{String(vote.answer)}</span>
              </p>
            ) : (
              <p className="text-lg font-bold">
                No response on file yet.{" "}
                <Link href="/#vote" className="underline">
                  Take the survey
                </Link>
              </p>
            )}
          </Card>

          <Card className="border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
            <h2 className="text-2xl font-black uppercase mb-3">Share the survey</h2>
            <p className="mb-4 font-medium">
              Help measure support for pragmatic trials. Copy and share this link.
            </p>
            <code className="block border-4 border-primary bg-brutal-yellow p-3 font-mono text-sm break-all">
              {surveyUrl}
            </code>
          </Card>

          <Card className="border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black uppercase mb-3">
              Optional: campaign dashboard
            </h2>
            <p className="mb-4 font-medium">
              Scores, badges, and campaign tools live on War on Disease — only if you want
              that. This site stays the research instrument.
            </p>
            <a
              href="https://warondisease.org/dashboard"
              rel="noopener noreferrer"
              className="inline-block border-4 border-primary bg-brutal-cyan px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Open campaign dashboard
            </a>
          </Card>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
