"use client"

import { useMemo, useState, useEffect } from "react"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Input } from "@optimitron/neobrutalist-ui/ui/input"
import { BUDGET_CATEGORIES, getActualGovernmentAllocations } from "@/lib/wishocracy-data"
import type { BudgetCategoryId } from "@/lib/wishocracy-data"
import { calculateAllocationsFromPairwise } from "@/lib/wishocracy-calculations"
import type { Comparison } from "@/lib/wishocracy-calculations"
import { ArrowUpDown } from "lucide-react"
import { AllocationBar } from "@optimitron/neobrutalist-ui/ui/allocation-bar"
import type { AverageAllocationResults } from "@/lib/wishocracy-average-allocations"

interface BudgetAllocationBarsProps {
  comparisons?: Comparison[]
  initialResults?: AverageAllocationResults
}

const allocationLabels = {
  user: "Your preferred allocation",
  average: "Average preferred allocation",
  government: "Current government allocation",
}

export function BudgetAllocationBars({ comparisons, initialResults }: BudgetAllocationBarsProps) {
  const showPersonal = comparisons !== undefined
  const [sortBy, setSortBy] = useState<"user" | "government" | "average">(showPersonal ? "user" : "average")
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState(initialResults)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const averageAllocations = results?.totalUsers ? results.averageAllocations : undefined
  const sortOptions: Array<"user" | "average" | "government"> = [
    ...(showPersonal ? ["user" as const] : []),
    ...(averageAllocations ? ["average" as const] : []),
    "government",
  ]
  const activeSort = sortOptions.includes(sortBy) ? sortBy : "government"

  const allocations = useMemo(() => {
    return calculateAllocationsFromPairwise(comparisons ?? [])
  }, [comparisons])

  const governmentAllocations = useMemo(() => {
    return getActualGovernmentAllocations()
  }, [])

  // Fetch community average allocations
  useEffect(() => {
    if (initialResults) return
    const controller = new AbortController()
    async function fetchAverageAllocations() {
      try {
        const response = await fetch("/api/wishocracy/average-allocations", { signal: controller.signal })
        if (!response.ok) throw new Error("Failed to fetch average allocations")
        setResults(await response.json())
      } catch {
        if (!controller.signal.aborted) setFailed(true)
      }
    }
    void fetchAverageAllocations()
    return () => controller.abort()
  }, [initialResults, attempt])

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
        if (activeSort === "government") {
          return b.govPercent - a.govPercent
        } else if (activeSort === "average") {
          return b.avgPercent - a.avgPercent
        }
        return b.percentage - a.percentage
      })
  }, [allocations, governmentAllocations, averageAllocations, activeSort, searchQuery])

  return (
    <div>
      {!results && !failed && <p role="status" className="mb-4">Loading average allocations…</p>}
      {failed && (
        <div role="alert" className="mb-4 flex flex-wrap items-center gap-3">
          <p>Average allocations could not be loaded.</p>
          <Button variant="outline" onClick={() => { setFailed(false); setAttempt((value) => value + 1) }}>Try again</Button>
        </div>
      )}
      {results?.totalUsers === 0 && <p className="mb-4">Add your priorities to start the average allocation.</p>}
      {/* Search and Sort Controls */}
      <div className="mb-4 space-y-3">
        <Input
          type="text"
          aria-label="Search programs"
          placeholder="Search programs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-2 border-primary"
        />
        {sortOptions.length > 1 && <Button
          onClick={() => setSortBy(sortOptions[(sortOptions.indexOf(activeSort) + 1) % sortOptions.length] ?? "government")}
          variant="outline"
          size="sm"
          className="h-auto min-h-8 w-full whitespace-normal py-2 font-bold uppercase border-2 border-primary"
        >
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Sort by: {allocationLabels[activeSort]}
        </Button>}
      </div>

      <div className="space-y-3">
        {sortedCategories.map(({ categoryId, percentage, category, govPercent, avgPercent }) => {
          return (
            <div key={categoryId} className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-lg">{category.icon}</span>
                <span className="uppercase">{category.name}</span>
              </div>
              {showPersonal && <AllocationBar
                label={allocationLabels.user}
                size="compact"
                segments={[{ label: allocationLabels.user, value: percentage, displayValue: percentage.toFixed(1) + "%", colorClassName: "bg-brutal-cyan" }]}
              />}
              {averageAllocations && <AllocationBar
                label={allocationLabels.average}
                size="compact"
                segments={[{ label: allocationLabels.average, value: avgPercent, displayValue: avgPercent.toFixed(1) + "%", colorClassName: "bg-brutal-pink" }]}
              />}
              <AllocationBar
                label={allocationLabels.government}
                size="compact"
                segments={[{ label: allocationLabels.government, value: govPercent, displayValue: govPercent.toFixed(1) + "%", colorClassName: "bg-black" }]}
              />
            </div>
          )
        })}
      </div>
      {sortedCategories.length === 0 && <p>No programs match your search.</p>}
      <div className="mt-4 pt-4 border-t-2 border-primary">
        <div className="flex items-center justify-center gap-3 text-xs mb-2 flex-wrap">
          {showPersonal && <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-brutal-cyan border-2 border-primary" />
            <span className="font-bold">{allocationLabels.user}</span>
          </div>}
          {averageAllocations && <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-brutal-pink border-2 border-brutal-pink" />
            <span className="font-bold">{allocationLabels.average}</span>
          </div>}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-black border-2 border-primary" />
            <span className="font-bold">{allocationLabels.government}</span>
          </div>
        </div>
        <p className="text-center text-[10px] text-muted-foreground">
          Percentages are shares of the spending areas shown, not the entire US budget.
        </p>
      </div>
    </div>
  )
}
