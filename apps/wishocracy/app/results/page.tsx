import Link from "next/link"
import Layout from "@/components/layout"
import { Button } from "@/components/ui/button"
import { WishocracyGapChart } from "@/components/wishocracy/WishocracyGapChart"
import { WishocracyYourAnswers } from "@/components/wishocracy/WishocracyYourAnswers"
import { BUDGET_CATEGORIES, type BudgetCategoryId } from "@/lib/wishocracy-data"
import type { Comparison } from "@/lib/wishocracy-calculations"
import { buildGapRows, buildPersonalResult, militaryPerTrialDollar, MILITARY_ID, TRIALS_ID } from "@/lib/wishocracy-results"
import { loadPublicAllocations, loadSignedInAnswers } from "@/lib/wishocracy-results.server"
import { getWishocracyVisualFixture } from "@/lib/wishocracy-visual"
import { calculatePublicAllocations } from "@/lib/wishocracy-public-allocations"
import { createLogger } from "@/lib/logger"
import { getPageMetadata } from "@optimitron/site-kit/lib/nav-items"
import { getSignInPath, ROUTES } from "@optimitron/site-kit/lib/routes"

const log = createLogger("wishocracy-results")

/** Below this many people, numbers can still swing a lot. */
const FEW_PEOPLE = 30

export function generateMetadata() {
  return getPageMetadata("wishocracyResults")
}

function formatDollars(amount: number): string {
  if (amount >= 10) return `$${Math.round(amount).toLocaleString("en-US")}`
  if (amount >= 1) return `$${amount.toFixed(2)}`
  const cents = Math.round(amount * 100)
  return cents < 1 ? "less than 1 cent" : `${cents} ${cents === 1 ? "cent" : "cents"}`
}

function SourceLink({ id, children }: { id: BudgetCategoryId; children: React.ReactNode }) {
  const href = BUDGET_CATEGORIES[id].budgetSourceUrl
  return href ? <a href={href} className="underline">{children}</a> : <>{children}</>
}

async function loadViewer(fixture: ReturnType<typeof getWishocracyVisualFixture>): Promise<
  | { signedIn: false }
  | { signedIn: true; editable: boolean; comparisons: Comparison[]; selectedCategoryIds: BudgetCategoryId[] }
> {
  if (fixture) {
    return fixture.showPersonal
      ? { signedIn: true, editable: false, comparisons: fixture.comparisons, selectedCategoryIds: [] }
      : { signedIn: false }
  }
  const answers = await loadSignedInAnswers()
  return answers ? { signedIn: true, editable: true, ...answers } : { signedIn: false }
}

export default async function ResultsPage({ searchParams }: {
  searchParams?: Promise<{ visual?: string }>
}) {
  const visual = (await searchParams)?.visual
  const fixture = getWishocracyVisualFixture(visual)
  const [loaded, viewer] = await Promise.all([
    fixture ? Promise.resolve(fixture.results) : loadPublicAllocations().catch((error: unknown) => {
      log.error("Failed to load public allocations", { error })
      return null
    }),
    loadViewer(fixture),
  ])
  const results = loaded ?? calculatePublicAllocations([])
  const personal = viewer.signedIn && viewer.comparisons.length > 0 ? buildPersonalResult(viewer.comparisons) : undefined
  const rows = buildGapRows(results, personal)
  const hasAnswers = results.totalUsers > 0
  const dollars = militaryPerTrialDollar(results)
  const military = BUDGET_CATEGORIES[MILITARY_ID].name.toLowerCase()
  const trials = BUDGET_CATEGORIES[TRIALS_ID].name.toLowerCase()
  const people = `${results.totalUsers.toLocaleString("en-US")} ${results.totalUsers === 1 ? "person" : "people"}`

  return (
    <Layout>
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="mb-4 text-4xl font-black uppercase sm:text-5xl">Wishocracy results</h1>
        <p className="mb-6 max-w-3xl text-lg">
          People split $100 between two programs at a time. Here&apos;s what they&apos;d fund, next to what the US government funds now.
        </p>
        <div className="mb-8 flex flex-wrap items-center gap-5">
          <Button asChild><Link href={ROUTES.home}>Add your priorities</Link></Button>
          <Link href={ROUTES.about} className="font-bold underline">How the results work</Link>
        </div>

        <section className="mb-12 border-4 border-primary bg-brutal-yellow p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-6">
          <p className="text-xl font-black uppercase sm:text-2xl">
            The US government spends {formatDollars(dollars.government)} on the {military} for every $1 on {trials}.
          </p>
          {dollars.everyone !== null ? (
            <p className="mt-3 text-lg font-bold sm:text-xl">
              The {people} who answered would spend {formatDollars(dollars.everyone)}.
            </p>
          ) : null}
          <p className="mt-4 text-sm">
            Based on the <SourceLink id={MILITARY_ID}>${BUDGET_CATEGORIES[MILITARY_ID].annualBudget}B {military}</SourceLink>{" "}
            and <SourceLink id={TRIALS_ID}>${BUDGET_CATEGORIES[TRIALS_ID].annualBudget}B for {trials}</SourceLink>.
          </p>
        </section>

        <section aria-labelledby="gap-chart">
          <h2 id="gap-chart" className="mb-2 text-2xl font-black uppercase sm:text-3xl">
            {hasAnswers ? "What people want vs. what the government funds" : "What the US government funds now"}
          </h2>
          {loaded === null ? (
            <p role="alert" className="max-w-3xl">The results didn&apos;t load. Refresh the page to try again.</p>
          ) : hasAnswers ? (
            <p className="max-w-3xl">
              {people} {results.totalUsers === 1 ? "has" : "have"} answered. Programs the government underfunds most, compared with what they want, come first.
              {results.totalUsers < FEW_PEOPLE ? ` With only ${people} so far, expect these numbers to move.` : ""}
            </p>
          ) : (
            <p className="max-w-3xl">Nobody has answered yet. Be the first.</p>
          )}
          <WishocracyGapChart
            rows={rows}
            hasAnswers={hasAnswers}
            yourProgramCount={personal && hasAnswers ? personal.answeredIds.length : undefined}
          />
          {!viewer.signedIn ? (
            <p className="mt-6 text-center">
              Already compared programs?{" "}
              <Link href={getSignInPath(ROUTES.wishocracyResults)} className="font-bold underline">Sign in</Link>{" "}
              to see your answers on this chart.
            </p>
          ) : null}
        </section>

        {viewer.signedIn && personal ? (
          <WishocracyYourAnswers
            rows={rows}
            personal={personal}
            comparisons={viewer.comparisons}
            selectedCategoryIds={viewer.selectedCategoryIds}
            editable={viewer.editable}
          />
        ) : null}
        {viewer.signedIn && !personal ? (
          <section aria-labelledby="your-answers" className="mt-12">
            <h2 id="your-answers" className="mb-3 text-2xl font-black uppercase sm:text-3xl">Your answers</h2>
            <p className="mb-4">You haven&apos;t compared any programs yet.</p>
            <Button asChild><Link href={ROUTES.home}>Start comparing</Link></Button>
          </section>
        ) : null}
      </main>
    </Layout>
  )
}
