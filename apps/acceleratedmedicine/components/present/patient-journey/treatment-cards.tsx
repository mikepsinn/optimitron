import { ArrowRight } from "lucide-react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/present/card"
import type { TreatmentEstimate } from "@/components/present/patient-journey/alzheimers"

// The decentralized-fda prototype's treatment ranking card and scores (apps/web/components/demo), drawn on
// slide 8 as a picture of the product. The prototype's links to its Outcome Label pages are left out.
const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

export function TreatmentScores({ effectiveness, safetyScore }: { effectiveness: number; safetyScore: number }) {
  return (
    <dl className="grid grid-cols-2 gap-6">
      {[
        { label: "Effectiveness estimate", value: effectiveness },
        { label: "Safety estimate", value: safetyScore },
      ].map(metric => (
        <div key={metric.label}>
          <dt className="min-h-10 text-sm text-muted-foreground sm:min-h-0">{metric.label}</dt>
          <dd className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
            {metric.value}<span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span>
          </dd>
          <div aria-hidden="true" className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${metric.value}%` }} />
          </div>
        </div>
      ))}
    </dl>
  )
}

export function TreatmentRankingCard({ treatment, rank }: { treatment: TreatmentEstimate; rank: number }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-start gap-3 space-y-0 md:min-h-[100px]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary"
          aria-label={`Rank ${rank} by estimated effectiveness`}>{rank}</span>
        <h3 className="pt-1 text-lg font-semibold leading-snug">{treatment.name}</h3>
      </CardHeader>
      <CardContent className="flex-1 space-y-5">
        <TreatmentScores effectiveness={treatment.effectiveness} safetyScore={treatment.safetyScore} />
        <dl className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Annual cost estimate</dt>
            <dd className="mt-1 font-medium tabular-nums">
              {treatment.annualCost == null ? "Not available" : dollars.format(treatment.annualCost)}{" "}
              <span className="font-normal text-muted-foreground">USD</span>
            </dd>
          </div>
          <div><dt className="text-muted-foreground">Time to effect</dt><dd className="mt-1 font-medium">{treatment.timeToEffect || "Not available"}</dd></div>
        </dl>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2">
        {/* Drawn like the prototype's button, but nothing to open from a slide. */}
        <Button asChild variant="outline" className="justify-between gap-2">
          <span aria-hidden="true">View Outcome Label <ArrowRight className="h-4 w-4" /></span>
        </Button>
      </CardFooter>
    </Card>
  )
}
