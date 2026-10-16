import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OPTIMITRON_LINKS } from "@/lib/optimitron-links"
import { ROUTES } from "@optimitron/site-kit/lib/routes"
import { BUDGET_CATEGORIES, type BudgetCategoryId } from "@/lib/wishocracy-data"
import type { Comparison } from "@/lib/wishocracy-calculations"
import type { PublicAllocationResults } from "@/lib/wishocracy-public-allocations"
import { biggestDifferences, type Difference, type GapRow, type PersonalResult } from "@/lib/wishocracy-results"
import { WishocracyAnswerEditor } from "./WishocracyAnswerEditor"
import { ordinal } from "./WishocracyGapChart"

function describeDifference({ yourRank, peopleRank, of }: Difference): string {
  return yourRank === null
    ? `You'd fund none of it. Other people put it ${ordinal(peopleRank)} of the ${of} programs you compared.`
    : `You put it ${ordinal(yourRank)} of the ${of} programs you'd fund. Other people put it ${ordinal(peopleRank)} of those ${of}.`
}

function describeAgreement(agreed: number, total: number, editable: boolean): string {
  if (total === 0) return ""
  if (agreed === total) return total === 1 ? " Your ranking matches your pick." : ` Your ranking matches all ${total} of your picks.`
  const conflicts = total - agreed
  return ` Your ranking matches ${agreed} of your ${total} picks. The other ${conflicts} ${conflicts === 1 ? "contradicts" : "contradict"} your other picks.${editable ? " Change them below." : ""}`
}

export function WishocracyYourAnswers({ rows, results, personal, comparisons, selectedCategoryIds, editable }: {
  rows: GapRow[]
  results: PublicAllocationResults
  personal: PersonalResult
  comparisons: Comparison[]
  selectedCategoryIds: BudgetCategoryId[]
  editable: boolean
}) {
  const differences = biggestDifferences(rows, results)
  const programCount = Object.keys(BUDGET_CATEGORIES).length
  const { agreed, total } = personal.agreement

  return (
    <section aria-labelledby="your-answers" className="mt-12 space-y-8">
      <h2 id="your-answers" className="text-2xl font-black uppercase sm:text-3xl">Your answers</h2>

      <div>
        <h3 className="mb-3 text-lg font-black uppercase">Where you differ most from other people</h3>
        {differences.length > 0 ? (
          <ul className="space-y-2">
            {differences.map((difference) => (
              <li key={difference.row.id} className="flex gap-2">
                <span aria-hidden="true" className="text-lg">{difference.row.icon}</span>
                <p><span className="font-black uppercase">{difference.row.name}.</span> {describeDifference(difference)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>You order the programs you compared about the same way other people do.</p>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-lg font-black uppercase">How complete your answers are</h3>
        <p>
          You&apos;ve compared {personal.answeredIds.length} of the {programCount} programs.
          {describeAgreement(agreed, total, editable)}
        </p>
        <Button asChild className="mt-4">
          <Link href={ROUTES.home}>Compare more programs</Link>
        </Button>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-black uppercase">Which politicians vote your way</h3>
        <p>
          Our sister site Optimitron scores politicians on whether their spending votes match your answers.
          You&apos;ll sign in there too.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <a href={OPTIMITRON_LINKS.politicianAlignment.url}>See your politician scores</a>
        </Button>
      </div>

      {editable ? <WishocracyAnswerEditor comparisons={comparisons} selectedCategoryIds={selectedCategoryIds} /> : null}
    </section>
  )
}
