"use client"

import { useRouter } from "next/navigation"
import { WishocracyEditSection } from "@/components/wishocracy/WishocracyEditSection"
import { BUDGET_CATEGORIES, type BudgetCategoryId } from "@/lib/wishocracy-data"
import type { Comparison } from "@/lib/wishocracy-calculations"
import { createLogger } from "@/lib/logger"

const log = createLogger("wishocracy-results")

export function WishocracyAnswerEditor({ comparisons, selectedCategoryIds }: {
  comparisons: Comparison[]
  selectedCategoryIds: BudgetCategoryId[]
}) {
  const router = useRouter()

  const handleSave = async (
    updatedComparisons: Comparison[],
    updatedCategories: Set<BudgetCategoryId>,
    deletedCategories: Set<BudgetCategoryId>,
  ) => {
    try {
      const response = await fetch("/api/wishocracy/allocations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updatedComparisons,
          deletedCategories: Array.from(deletedCategories),
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to save allocations")
      }

      const allKeys = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]
      const selectionsResponse = await fetch("/api/wishocracy/category-selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selections: allKeys.map((categoryId) => ({
            categoryId,
            selected: updatedCategories.has(categoryId),
          })),
        }),
      })
      if (!selectionsResponse.ok) {
        throw new Error("Failed to save category selections")
      }
      router.refresh()
    } catch (error) {
      log.error("Failed to save wishocracy answers", { error })
      throw error
    }
  }

  return (
    <WishocracyEditSection
      // The editor copies its props into state once. Remount it when the refreshed
      // answers arrive so a later save cannot resend comparisons the server deleted.
      key={JSON.stringify([comparisons, selectedCategoryIds])}
      comparisons={comparisons}
      selectedCategories={
        new Set(selectedCategoryIds.length > 0 ? selectedCategoryIds : (Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]))
      }
      onSave={handleSave}
    />
  )
}
