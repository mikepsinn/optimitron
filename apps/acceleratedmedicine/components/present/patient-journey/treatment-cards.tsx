import { Card } from "@/components/present/card"
import type { TreatmentEstimate } from "@/components/present/patient-journey/alzheimers"

// Treatment rankings in the decentralized-fda prototype's style (apps/web/components/demo), drawn on slide 8 as a
// picture of the product: one row per treatment, ranked by estimated effectiveness.
const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

// The two score columns, shared by the header and every row so they line up.
export const RANKING_COLUMNS = "grid grid-cols-[72px_minmax(0,1fr)_210px_210px] items-center gap-8"

function Score({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-4">
      <div aria-hidden="true" className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
      <span className="w-14 text-right text-[30px] font-semibold tabular-nums">{value}</span>
    </div>
  )
}

export function TreatmentRankingRow({ treatment, rank }: { treatment: TreatmentEstimate; rank: number }) {
  const cost = treatment.annualCost == null ? "Cost not available" : `${dollars.format(treatment.annualCost)} a year`
  return (
    <Card className={`${RANKING_COLUMNS} px-8 py-5`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-[26px] font-semibold text-primary"
        aria-label={`Rank ${rank} by estimated effectiveness`}>{rank}</span>
      <div className="min-w-0">
        <h3 className="truncate text-[32px] font-semibold leading-tight">{treatment.name}</h3>
        <p className="mt-1 text-[22px] text-muted-foreground">
          {cost}
          {treatment.timeToEffect && <> · effect in {treatment.timeToEffect}</>}
        </p>
      </div>
      <Score value={treatment.effectiveness} />
      <Score value={treatment.safetyScore} />
    </Card>
  )
}
