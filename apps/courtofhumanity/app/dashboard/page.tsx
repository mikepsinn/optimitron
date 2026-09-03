import Link from "next/link"
import { redirect } from "next/navigation"
import { VotePosition } from "@optimitron/db"
import Layout from "../../components/layout"
import { requireAuth } from "@/lib/auth-utils"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { ROUTES } from "@/lib/routes"
import { getUserTreatyVote } from "@/lib/treaty-votes.server"

export const dynamic = "force-dynamic"

/**
 * Lite participant home for the Court: standing on the case + where to act.
 * Case management (plaintiff records, evidence) arrives with the court
 * routes in issue #254; until then the actions deep-link to the live case
 * surfaces on warondisease.org.
 */
export default async function CourtDashboardPage() {
  let userId: string
  try {
    ;({ userId } = await requireAuth())
  } catch {
    redirect("/auth/signin?callbackUrl=/dashboard")
  }

  // No .catch here: a failed lookup must surface as an error, not render as
  // "not on the plaintiff register".
  const vote = await getUserTreatyVote(userId)
  const isPlaintiff = vote?.answer === VotePosition.YES

  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="none" padding="lg">
        <Container>
          <h1 className="mb-6 text-4xl font-black uppercase sm:text-5xl">
            Your standing
          </h1>
          <Card className="mb-6 border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {isPlaintiff ? (
              <p className="text-lg font-bold">
                You are on the record as a plaintiff in{" "}
                <span className="text-brutal-pink">Humanity v. Government</span>.
              </p>
            ) : (
              <p className="text-lg font-bold">
                You are not on the plaintiff register yet.{" "}
                <a
                  href="https://warondisease.org/plaintiffs"
                  className="underline"
                >
                  Register a plaintiff
                </a>.
              </p>
            )}
          </Card>

          <Card className="border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="mb-3 text-2xl font-black uppercase">
              Act on the case
            </h2>
            <p className="mb-4 font-medium">
              Register someone you love who can no longer sign, or render your
              verdict on the case.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={ROUTES.plaintiffs}
                className="inline-block border-4 border-primary bg-brutal-pink px-4 py-2 font-black uppercase text-brutal-pink-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Register a plaintiff
              </Link>
              <a
                href="/humanity-v-government#verdict"
                className="inline-block border-4 border-primary bg-brutal-cyan px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Render your verdict
              </a>
            </div>
          </Card>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
