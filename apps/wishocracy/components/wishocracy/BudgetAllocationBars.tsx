"use client"

import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BUDGET_CATEGORIES, getActualGovernmentAllocations } from "@/lib/wishocracy-data"
import type { BudgetCategoryId } from "@/lib/wishocracy-data"
import { calculateAllocationsFromPairwise } from "@/lib/wishocracy-calculations"
import type { Comparison } from "@/lib/wishocracy-calculations"
import { ArrowUpDown } from "lucide-react"
import { AllocationBar } from "@optimitron/neobrutalist-ui/ui/allocation-bar"

interface BudgetAllocationBarsProps {
  comparisons: Comparison[]
}

const allocationLabels = {
  user: "Your preferred allocation",
  average: "Average preferred allocation",
  government: "Current government allocation",
}

export function BudgetAllocationBars({ comparisons }: BudgetAllocationBarsProps) {
  const [sortBy, setSortBy] = useState<"user" | "government" | "average">("user")
  const [searchQuery, setSearchQuery] = useState("")
  const [averageAllocations, setAverageAllocations] = useState<Record<BudgetCategoryId, number> | null>(null)

  const allocations = useMemo(() => {
    return calculateAllocationsFromPairwise(comparisons)
  }, [comparisons])

  const governmentAllocations = useMemo(() => {
    return getActualGovernmentAllocations()
  }, [])

  // Fetch community average allocations
  useEffect(() => {
    async function fetchAverageAllocations() {
      try {
        const response = await fetch("/api/wishocracy/average-allocations")
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

  // Sort and filter categories
  const sortedCategories = useMemo(() => {
    return Object.entries(allocations)
      .map(([categoryId, percentage]) => {
        const budgetCategoryId = categoryId as BudgetCategoryId
        return {
          categoryId: budgetCategoryId,
          percentage,
          category: BUDGET_CATEGORIES[budgetCategoryId],
          govPercent: governmentAllocations[budgetCategoryId] || 0,
          avgPercent: averageAllocations?.[budgetCategoryId] || 0,
        }
      })
      .filter((item) => {
        // Skip categories that have been removed from BUDGET_CATEGORIES
        if (!item.category) return false

        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
          item.category.name.toLowerCase().includes(query) ||
          item.category.description.toLowerCase().includes(query)
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
  }, [allocations, governmentAllocations, averageAllocations, sortBy, searchQuery])

  return (
    <div>
      {/* Search and Sort Controls */}
      <div className="mb-4 space-y-3">
        <Input
          type="text"
          placeholder="Search programs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-2 border-primary"
        />
        <Button
          onClick={() => setSortBy(
            sortBy === "user" ? "average" :
            sortBy === "average" ? "government" :
            "user"
          )}
          variant="outline"
          size="sm"
          className="h-auto min-h-8 w-full whitespace-normal py-2 font-bold uppercase border-2 border-primary"
        >
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Sort by: {allocationLabels[sortBy]}
        </Button>
      </div>

      <div className="space-y-3">
        {sortedCategories.map(({ categoryId, percentage, category, govPercent, avgPercent }) => {
          return (
            <div key={categoryId} className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-lg">{category.icon}</span>
                <span className="uppercase">{category.name}</span>
              </div>
              <AllocationBar
                label={allocationLabels.user}
                size="compact"
                segments={[{ label: allocationLabels.user, value: percentage, displayValue: percentage.toFixed(1) + "%", colorClassName: "bg-brutal-cyan" }]}
              />
              <AllocationBar
                label={allocationLabels.average}
                size="compact"
                segments={[{ label: allocationLabels.average, value: avgPercent, displayValue: avgPercent.toFixed(1) + "%", colorClassName: "bg-brutal-pink" }]}
              />
              <AllocationBar
                label={allocationLabels.government}
                size="compact"
                segments={[{ label: allocationLabels.government, value: govPercent, displayValue: govPercent.toFixed(1) + "%", colorClassName: "bg-black" }]}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-4 pt-4 border-t-2 border-primary">
        <div className="flex items-center justify-center gap-3 text-xs mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-brutal-cyan border-2 border-primary" />
            <span className="font-bold">{allocationLabels.user}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-brutal-pink border-2 border-brutal-pink" />
            <span className="font-bold">{allocationLabels.average}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-black border-2 border-primary" />
            <span className="font-bold">{allocationLabels.government}</span>
          </div>
        </div>
        <p className="text-center text-[10px] text-muted-foreground">
          Percentages show relative importance among these areas
        </p>
      </div>
    </div>
  )
}
