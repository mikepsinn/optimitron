import Link from "next/link"

import type { StateAbbreviation } from "@/lib/right-to-try"
import { STATE_CAMPAIGNS, stateCampaignHref } from "@/lib/right-to-try"

// Standard US tile-grid map positions: [row, column] on an 11-column grid.
const STATE_TILE_POSITIONS: Record<StateAbbreviation, [number, number]> = {
  AK: [0, 0], ME: [0, 10],
  WI: [1, 5], VT: [1, 9], NH: [1, 10],
  WA: [2, 0], ID: [2, 1], MT: [2, 2], ND: [2, 3], MN: [2, 4], IL: [2, 5],
  MI: [2, 7], NY: [2, 8], MA: [2, 9],
  OR: [3, 0], NV: [3, 1], WY: [3, 2], SD: [3, 3], IA: [3, 4], IN: [3, 5],
  OH: [3, 6], PA: [3, 7], NJ: [3, 8], CT: [3, 9], RI: [3, 10],
  CA: [4, 0], UT: [4, 1], CO: [4, 2], NE: [4, 3], MO: [4, 4], KY: [4, 5],
  WV: [4, 6], VA: [4, 7], MD: [4, 8], DE: [4, 9],
  AZ: [5, 1], NM: [5, 2], KS: [5, 3], AR: [5, 4], TN: [5, 5], NC: [5, 6],
  SC: [5, 7],
  OK: [6, 3], LA: [6, 4], MS: [6, 5], AL: [6, 6], GA: [6, 7],
  HI: [7, 0], TX: [7, 3], FL: [7, 8],
}

// Tile order, so keyboard focus follows the map.
const tiles = [...STATE_CAMPAIGNS].sort((a, b) => {
  const [rowA, colA] = STATE_TILE_POSITIONS[a.abbreviation]
  const [rowB, colB] = STATE_TILE_POSITIONS[b.abbreviation]
  return rowA - rowB || colA - colB
})

/** Every state as a tile that links to its page. Montana, the enacted precedent, is filled. */
export function StateTileMap() {
  return (
    <div>
      <div className="mx-auto grid max-w-3xl grid-cols-[repeat(11,minmax(0,1fr))] gap-1 sm:gap-2">
        {tiles.map(campaign => {
          const [row, column] = STATE_TILE_POSITIONS[campaign.abbreviation]
          const precedent = campaign.stage === "enacted-model"
          return (
            <Link key={campaign.abbreviation} href={stateCampaignHref(campaign)}
              aria-label={precedent ? `${campaign.name}: enacted precedent` : campaign.name}
              title={campaign.name}
              style={{ gridColumnStart: column + 1, gridRowStart: row + 1 }}
              className={`flex aspect-square items-center justify-center rounded-md border text-[10px] font-semibold shadow-sm transition-colors sm:text-sm ${
                precedent
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-card hover:border-primary hover:text-primary"
              }`}>
              {campaign.abbreviation}
            </Link>
          )
        })}
      </div>
      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-primary" /> Enacted precedent (Montana)
      </p>
    </div>
  )
}
