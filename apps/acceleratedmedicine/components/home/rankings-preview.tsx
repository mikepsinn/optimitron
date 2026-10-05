"use client"

import { useState } from "react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

export interface RankingsPreviewCondition {
  slug: string
  name: string
  treatmentCount: number
  treatments: { slug: string; name: string; effectiveness: number; safetyScore: number }[]
}

// Copied from the decentralized-fda prototype (apps/web/components/demo/rankings-preview.tsx), without
// the links into the prototype.
export function RankingsPreview({ conditions }: { conditions: RankingsPreviewCondition[] }) {
  const [selected, setSelected] = useState(conditions[0]?.slug)
  const condition = conditions.find(item => item.slug === selected) ?? conditions[0]
  if (!condition) return null

  return (
    <div className="space-y-6">
      <div role="group" aria-label="Example conditions" className="flex flex-wrap justify-center gap-2">
        {conditions.map(item => (
          <Button key={item.slug} type="button" className="rounded-full"
            variant={item.slug === condition.slug ? "default" : "outline"}
            aria-pressed={item.slug === condition.slug} onClick={() => setSelected(item.slug)}>
            {item.name}
          </Button>
        ))}
      </div>

      <ol className="space-y-4" aria-label={`Top ${condition.name} treatments by estimated effectiveness`}>
        {condition.treatments.map((treatment, index) => (
          <li key={treatment.slug} className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Rank {index + 1}</p>
                <h3 className="break-words font-medium">{treatment.name}</h3>
              </div>
              <div className="sm:shrink-0 sm:text-right">
                <div className="text-2xl font-bold tabular-nums text-primary">
                  {treatment.effectiveness}<span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span>
                </div>
                <p className="text-xs text-muted-foreground">Effectiveness estimate</p>
              </div>
            </div>
            <div aria-hidden="true" className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${treatment.effectiveness}%` }} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Safety estimate: <span className="font-medium tabular-nums text-foreground">{treatment.safetyScore} / 100</span>
            </p>
          </li>
        ))}
      </ol>

      <p className="text-sm text-muted-foreground">
        Top {condition.treatments.length} of {condition.treatmentCount} treatments. Scores use a 0–100 scale, not
        response percentages.
      </p>
    </div>
  )
}
