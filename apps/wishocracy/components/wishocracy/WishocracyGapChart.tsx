import { cn } from "@/lib/utils"
import type { Gap, GapRow } from "@/lib/wishocracy-results"

export function formatShare(value: number): string {
  if (value === 0) return "0%"
  if (value < 0.1) return "<0.1%"
  return `${value.toFixed(1)}%`
}

export function formatRatio(ratio: number): string {
  return ratio >= 10 ? `${Math.round(ratio)}×` : `${ratio.toFixed(1)}×`
}

function gapBadge(gap: Gap): { label: string; className: string } | null {
  switch (gap.kind) {
    case "not-funded": return { label: "Not funded now", className: "bg-brutal-pink text-white" }
    case "more": return { label: `Want ${formatRatio(gap.ratio)} more`, className: "bg-brutal-pink text-white" }
    case "less": return { label: `Want ${formatRatio(gap.ratio)} less`, className: "bg-foreground text-background" }
    case "unclear": return { label: "No clear gap", className: "bg-muted" }
    case "no-answers": return null
  }
}

function Bar({ label, value, max, colorClassName, children }: {
  label: string
  value: number
  max: number
  colorClassName: string
  children?: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr_3.75rem] items-center gap-2 text-xs font-bold sm:grid-cols-[7rem_1fr_4.5rem]">
      <dt>{label}</dt>
      <dd className="relative h-5 border-2 border-primary bg-muted">
        <div className={cn("h-full", colorClassName)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
        {children}
      </dd>
      <dd className="text-right tabular-nums">{formatShare(value)}</dd>
    </div>
  )
}

export function WishocracyGapChart({ rows, hasAnswers, yourProgramCount }: {
  rows: GapRow[]
  hasAnswers: boolean
  /** Programs the signed-in person answered; omit to hide their dots. */
  yourProgramCount?: number
}) {
  const showYou = yourProgramCount !== undefined
  const max = Math.max(1, ...rows.flatMap((row) => [row.everyoneHigh, row.government, row.you ?? 0]))
  const position = (value: number) => `${Math.min(100, (value / max) * 100)}%`
  const visibleRows = hasAnswers ? rows : [...rows].sort((a, b) => b.government - a.government)

  return (
    <div>
      <ol className="divide-y-2 divide-primary/20">
        {visibleRows.map((row) => {
          const badge = hasAnswers ? gapBadge(row.gap) : null
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
                {hasAnswers && row.answerCount > 0 ? (
                  <Bar label="People" value={row.everyone} max={max} colorClassName="bg-brutal-pink">
                    {row.everyoneHigh > row.everyoneLow ? (
                      <div
                        className="absolute top-1/2 h-2.5 -translate-y-1/2 border-x-2 border-foreground"
                        style={{ left: position(row.everyoneLow), width: `calc(${position(row.everyoneHigh)} - ${position(row.everyoneLow)})` }}
                      >
                        <div className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 bg-foreground" />
                        <span className="sr-only">Likely range {formatShare(row.everyoneLow)} to {formatShare(row.everyoneHigh)}</span>
                      </div>
                    ) : null}
                    {showYou && row.you !== undefined ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-brutal-cyan"
                        style={{ left: position(row.you) }}
                      />
                    ) : null}
                  </Bar>
                ) : null}
                <Bar label="Government" value={row.government} max={max} colorClassName="bg-foreground" />
              </dl>
              {showYou && row.you !== undefined ? (
                <p className="mt-1 text-xs font-bold">
                  <span aria-hidden="true" className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-primary bg-brutal-cyan align-middle" />
                  You: {formatShare(row.you)}
                </p>
              ) : null}
            </li>
          )
        })}
      </ol>
      <div className="mt-4 border-t-2 border-primary pt-4 text-xs">
        <ul className="mb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-bold">
          {hasAnswers ? (
            <li className="flex items-center gap-2"><span aria-hidden="true" className="h-4 w-4 border-2 border-primary bg-brutal-pink" />People who answered</li>
          ) : null}
          <li className="flex items-center gap-2"><span aria-hidden="true" className="h-4 w-4 border-2 border-primary bg-foreground" />US government now</li>
          {hasAnswers ? (
            <li className="flex items-center gap-2"><span aria-hidden="true" className="relative h-2.5 w-5 border-x-2 border-foreground"><span className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 bg-foreground" /></span>Likely range (95%)</li>
          ) : null}
          {showYou ? (
            <li className="flex items-center gap-2"><span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border-2 border-primary bg-brutal-cyan" />You</li>
          ) : null}
        </ul>
        <p className="text-center text-muted-foreground">
          Percentages are shares of the {rows.length} programs shown, not the whole US budget.
          {showYou
            ? ` You compared ${yourProgramCount} programs. Your dot takes what other people would give those ${yourProgramCount} and splits it your way.`
            : ""}
        </p>
      </div>
    </div>
  )
}
