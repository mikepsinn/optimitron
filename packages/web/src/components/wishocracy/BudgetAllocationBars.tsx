"use client"

import { useMemo, useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BUDGET_CATEGORIES, BudgetCategoryId, getActualGovernmentAllocations } from "@/lib/wishocracy-data"
import { calculateAllocationsFromPairwise, Comparison } from "@/lib/wishocracy-calculations"
import { ArrowUpDown } from "lucide-react"

interface BudgetAllocationBarsProps {
  comparisons: Comparison[]
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
          className="w-full font-bold uppercase border-2 border-primary"
        >
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Sort by: {sortBy === "user" ? "Your Priorities" : sortBy === "average" ? "Community Average" : "Gov Spending"}
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
              {/* Your allocation bar */}
              <div className="h-6 bg-muted border-2 border-primary relative overflow-visible">
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
              <div className="h-6 border-2 border-black relative overflow-visible">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${govPercent}%` }}
                />
                <span
                  className="absolute top-1/2 -translate-y-1/2 text-xs font-bold whitespace-nowrap text-black"
                  style={{ left: `calc(${govPercent}% + 4px)` }}
                >
                  {govPercent.toFixed(1)}% GOVT
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 pt-4 border-t-2 border-primary">
        <div className="flex items-center justify-center gap-3 text-xs mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-brutal-cyan border-2 border-primary" />
            <span className="font-bold">Your Priorities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-brutal-pink border-2 border-brutal-pink" />
            <span className="font-bold">Community Avg</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-black border-2 border-primary" />
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
