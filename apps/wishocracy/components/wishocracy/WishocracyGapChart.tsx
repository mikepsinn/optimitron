import { cn } from "@/lib/utils"
import type { Gap, GapRow, YourPlace } from "@/lib/wishocracy-results"

export function ordinal(n: number): string {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`
}

function formatBillions(budget: number): string {
  return budget >= 10 ? `$${Math.round(budget)}B` : `$${budget.toFixed(1)}B`
}

function gapBadge(gap: Gap): { label: string; className: string } | null {
  switch (gap.kind) {
    case "not-funded": return { label: "Not funded now", className: "bg-brutal-pink text-white" }
    case "higher": return { label: "People rank it higher", className: "bg-brutal-pink text-white" }
    case "lower": return { label: "People rank it lower", className: "bg-foreground text-background" }
    case "same": return { label: "Similar rank", className: "bg-muted" }
    case "no-answers": return null
  }
}

function describeYou(you: YourPlace): string {
  return you.rejected ? "You: would fund none of it" : `You: ${ordinal(you.rank)} of the ${you.of} you'd fund`
}

/** Longer bar = higher priority: rank 1 fills the bar, the last rank shows a sliver. */
function PriorityBar({ label, rank, of, colorClassName, range, detail, empty = false }: {
  label: string
  rank: number
  of: number
  colorClassName: string
  range?: [number, number]
  detail: string
  /** No bar at all, for a program with no money behind its rank. */
  empty?: boolean
}) {
  const length = (r: number) => `${((of - r + 1) / of) * 100}%`
  return (
    <div className="grid grid-cols-[5.5rem_1fr_6.5rem] items-center gap-2 text-xs font-bold sm:grid-cols-[7rem_1fr_9rem]">
      <dt>{label}</dt>
      <dd className="relative h-5 border-2 border-primary bg-muted">
        <div className={cn("h-full", colorClassName)} style={{ width: empty ? "0%" : length(rank) }} />
        {range && range[0] !== range[1] ? (
          <div
            className="absolute top-1/2 h-2.5 -translate-y-1/2 border-x-2 border-foreground"
            style={{ left: length(range[1]), width: `calc(${length(range[0])} - ${length(range[1])})` }}
          >
            <div className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 bg-foreground" />
            <span className="sr-only">Likely rank {ordinal(range[0])} to {ordinal(range[1])}</span>
          </div>
        ) : null}
      </dd>
      <dd className="text-right tabular-nums">{detail}</dd>
    </div>
  )
}

export function WishocracyGapChart({ rows, hasAnswers, showYou }: {
  rows: GapRow[]
  hasAnswers: boolean
  showYou: boolean
}) {
  const visibleRows = hasAnswers ? rows : [...rows].sort((a, b) => b.budget - a.budget)
  const rankedCount = rows[0]?.rankedCount ?? rows.length

  return (
    <div>
      <ol className="divide-y-2 divide-primary/20">
        {visibleRows.map((row) => {
          const badge = hasAnswers ? gapBadge(row.gap) : null
          const opposed = Math.round((1 - row.support) * 100)
          return (
            <li key={row.id} className="py-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase">
                  <span aria-hidden="true" className="text-lg">{row.icon}</span>
                  {row.name}
                </h3>
                {badge ? (
                  <span className={cn("shrink-0 border-2 border-primary px-2 py-0.5 text-xs font-black uppercase", badge.className)}>
                    {badge.label}
                  </span>
                ) : null}
              </div>
              <dl className="space-y-1">
                {hasAnswers && row.peopleRank !== undefined ? (
                  <PriorityBar
                    label="People"
                    rank={row.peopleRank}
                    of={rankedCount}
                    range={row.peopleRankRange}
                    colorClassName="bg-brutal-pink"
                    detail={`${ordinal(row.peopleRank)} of ${rankedCount}`}
                  />
                ) : null}
                <PriorityBar
                  label="Government"
                  rank={row.governmentRank}
                  of={rankedCount}
                  colorClassName="bg-foreground"
                  empty={row.budget === 0}
                  detail={row.budget > 0 ? `${ordinal(row.governmentRank)} · ${formatBillions(row.budget)}` : "$0"}
                />
              </dl>
              {(showYou && row.you) || (hasAnswers && opposed >= 10) ? (
                <p className="mt-1 flex flex-wrap gap-x-4 text-xs font-bold">
                  {showYou && row.you ? <span>{describeYou(row.you)}</span> : null}
                  {hasAnswers && opposed >= 10 ? <span>{opposed}% of people would fund none of it</span> : null}
                </p>
              ) : null}
              {hasAnswers && row.peopleRank === undefined ? (
                <p className="mt-1 text-xs text-muted-foreground">No answers yet</p>
              ) : null}
            </li>
          )
        })}
      </ol>
      <div className="mt-4 border-t-2 border-primary pt-4 text-xs">
        <ul className="mb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-bold">
          {hasAnswers ? (
            <li className="flex items-center gap-2"><span aria-hidden="true" className="h-4 w-4 border-2 border-primary bg-brutal-pink" />People&apos;s priority</li>
          ) : null}
          <li className="flex items-center gap-2"><span aria-hidden="true" className="h-4 w-4 border-2 border-primary bg-foreground" />Government&apos;s priority (by spending)</li>
          {hasAnswers ? (
            <li className="flex items-center gap-2"><span aria-hidden="true" className="relative h-2.5 w-5 border-x-2 border-foreground"><span className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 bg-foreground" /></span>Likely range</li>
          ) : null}
        </ul>
        <p className="text-center text-muted-foreground">
          A longer bar means a higher priority. {hasAnswers ? `Ranks cover the ${rankedCount} programs people have compared. ` : ""}
          {hasAnswers ? "People who would fund none of a program pull its rank down." : "Spending is annual federal spending."}
        </p>
      </div>
    </div>
  )
}
