"use client"

import { useMemo, useState, useEffect } from "react"
import { Card } from "@/components/retroui/Card"
import { Button } from "@/components/retroui/Button"
import { Input } from "@/components/retroui/Input"
import { API_ROUTES } from "@/lib/api-routes"
import { WISHOCRATIC_ITEMS, WishocraticItemId, getActualGovernmentAllocations } from "@/lib/wishocracy-data"
import type { WishocraticAllocationInput } from "@/lib/wishocracy-allocation"
import { calculateAllocationsFromPairwise } from "@/lib/wishocracy-calculations"
import { ArrowUpDown } from "lucide-react"

function ItemRow({ item, percentage, govPercent, avgPercent }: {
  item: (typeof WISHOCRATIC_ITEMS)[keyof typeof WISHOCRATIC_ITEMS]
  percentage: number
  govPercent: number
  avgPercent: number
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm font-bold">
        <span className="text-lg">{item.icon}</span>
        <span className="uppercase flex-1">{item.name}</span>
        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="text-[10px] text-muted-foreground hover:text-brutal-pink transition-colors font-bold"
        >
          {detailsOpen ? "\u25BE Details" : "\u25B8 Details"}
        </button>
      </div>
      {/* Your allocation bar */}
      <div className="h-6 bg-muted border-4 border-primary relative overflow-visible">
        <div
          className="h-full bg-brutal-cyan border-r-2 border-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
        <span
          className="absolute top-1/2 -translate-y-1/2 text-xs font-black whitespace-nowrap"
          style={{ left: `calc(${percentage}% + 4px)` }}
        >
          {percentage.toFixed(1)}% YOU
        </span>
      </div>
      {/* Community average allocation bar */}
      <div className="h-6 bg-muted border-2 border-brutal-pink relative overflow-visible">
        <div
          className="h-full bg-brutal-pink border-r-2 border-primary transition-all duration-300"
          style={{ width: `${avgPercent}%` }}
        />
        <span
          className="absolute top-1/2 -translate-y-1/2 text-xs font-bold whitespace-nowrap"
          style={{ left: `calc(${avgPercent}% + 4px)` }}
        >
          {avgPercent.toFixed(1)}% AVG
        </span>
      </div>
      {/* Government allocation bar */}
      <div className="h-6 border-4 border-primary relative overflow-visible">
        <div
          className="h-full bg-foreground transition-all duration-300"
          style={{ width: `${govPercent}%` }}
        />
        <span
          className="absolute top-1/2 -translate-y-1/2 text-xs font-bold whitespace-nowrap text-foreground"
          style={{ left: `calc(${govPercent}% + 4px)` }}
        >
          {govPercent.toFixed(1)}% GOVT
        </span>
      </div>
      {/* Expandable details */}
      {detailsOpen && (
        <div className="pt-1 pb-2 px-2 text-xs text-muted-foreground leading-relaxed">
          <p>{item.description}</p>
          {item.sources && item.sources.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
              {item.sources.map((s: { name: string; url: string }) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground/70 hover:text-brutal-pink transition-colors"
                  title={s.name}
                >
                  {s.name}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface WishocraticAllocationBarsProps {
  allocations: WishocraticAllocationInput[]
}

export function WishocraticAllocationBars({ allocations: pairwiseAllocations }: WishocraticAllocationBarsProps) {
  const [sortBy, setSortBy] = useState<"user" | "government" | "average">("user")
  const [searchQuery, setSearchQuery] = useState("")
  const [averageAllocations, setAverageAllocations] = useState<Record<WishocraticItemId, number> | null>(null)

  const percentages = useMemo(() => {
    return calculateAllocationsFromPairwise(pairwiseAllocations)
  }, [pairwiseAllocations])

  const governmentAllocations = useMemo(() => {
    return getActualGovernmentAllocations()
  }, [])

  // Fetch community average allocations
  useEffect(() => {
    async function fetchAverageAllocations() {
      try {
        const response = await fetch(API_ROUTES.wishocracy.averageAllocations)
        if (response.ok) {
          const data = await response.json()
          setAverageAllocations(data.averageAllocations)
        }
      } catch (error) {
        console.error("Failed to fetch average allocations:", error)
      }
    }
    fetchAverageAllocations()
  }, [])

  const sortedItems = useMemo(() => {
    return Object.entries(percentages)
      .map(([itemId, percentage]) => {
        const wishocraticItemId = itemId as WishocraticItemId
        return {
          itemId: wishocraticItemId,
          percentage,
          item: WISHOCRATIC_ITEMS[wishocraticItemId],
          govPercent: governmentAllocations[wishocraticItemId] || 0,
          avgPercent: averageAllocations?.[wishocraticItemId] || 0,
        }
      })
      .filter((entry) => {
        if (!entry.item) return false

        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
          entry.item.name.toLowerCase().includes(query) ||
          entry.item.description.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => {
        if (sortBy === "government") {
          return b.govPercent - a.govPercent
        } else if (sortBy === "average") {
          return b.avgPercent - a.avgPercent
        }
        return b.percentage - a.percentage
      })
  }, [percentages, governmentAllocations, averageAllocations, sortBy, searchQuery])

  return (
    <div>
      {/* Search and Sort Controls */}
      <div className="mb-4 space-y-3">
        <Input
          type="text"
          placeholder="Search programs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-4 border-primary"
        />
        <Button
          onClick={() => setSortBy(
            sortBy === "user" ? "average" :
            sortBy === "average" ? "government" :
            "user"
          )}
          variant="outline"
          size="sm"
          className="w-full font-bold uppercase border-4 border-primary"
        >
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Sort by: {sortBy === "user" ? "Your Priorities" : sortBy === "average" ? "Community Average" : "Gov Spending"}
        </Button>
      </div>

      <div className="space-y-3">
        {sortedItems.map(({ itemId, percentage, item, govPercent, avgPercent }) => {
          return (
            <ItemRow
              key={itemId}
              item={item}
              percentage={percentage}
              govPercent={govPercent}
              avgPercent={avgPercent}
            />
          )
        })}
      </div>
      <div className="mt-4 pt-4 border-t-2 border-primary">
        <div className="flex items-center justify-center gap-3 text-xs mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-brutal-cyan border-4 border-primary" />
            <span className="font-bold">Your Priorities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-brutal-pink border-2 border-brutal-pink" />
            <span className="font-bold">Community Avg</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-foreground border-4 border-primary" />
            <span className="font-bold">Gov Spending</span>
          </div>
        </div>
        <p className="text-center text-[10px] text-muted-foreground">
          Percentages show relative importance among these areas
        </p>
      </div>
    </div>
  )
}
