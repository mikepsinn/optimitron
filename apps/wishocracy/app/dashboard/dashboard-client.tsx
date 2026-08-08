"use client"

import { useMemo, useState } from "react"
import Layout from "@/components/layout"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { BudgetAllocationBars } from "@/components/wishocracy/BudgetAllocationBars"
import { WishocracyEditSection } from "@/components/wishocracy/WishocracyEditSection"
import { BUDGET_CATEGORIES, type BudgetCategoryId } from "@/lib/wishocracy-data"
import type { Comparison } from "@/lib/wishocracy-calculations"
import { createLogger } from "@/lib/logger"

const log = createLogger("wishocracy-dashboard")

type Props = {
  user: {
    email: string
    name: string
    handle: string | null
  }
  initialComparisons: Comparison[]
  selectedCategoryIds: string[]
}

export function WishocracyDashboardClient({
  user,
  initialComparisons,
  selectedCategoryIds,
}: Props) {
  const [comparisons, setComparisons] = useState(initialComparisons)
  const [selectedCategories, setSelectedCategories] = useState(
    () =>
      new Set(
        selectedCategoryIds.filter(
          (id): id is BudgetCategoryId => id in BUDGET_CATEGORIES,
        ),
      ),
  )

  const hasAllocations = comparisons.length > 0

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
      await fetch("/api/wishocracy/category-selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selections: allKeys.map((categoryId) => ({
            categoryId,
            selected: updatedCategories.has(categoryId),
          })),
        }),
      })

      setComparisons(updatedComparisons)
      setSelectedCategories(updatedCategories)
    } catch (error) {
      log.error("Failed to save wishocracy dashboard", { error })
      throw error
    }
  }

  const statusLabel = useMemo(() => {
    if (!hasAllocations) return "No pairings saved yet — run the exercise on the home page."
    return `${comparisons.length} pair${comparisons.length === 1 ? "" : "s"} saved`
  }, [comparisons.length, hasAllocations])

  return (
    <Layout>
      <div className="min-h-screen bg-background py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black uppercase mb-2">
                YOUR <span className="text-brutal-pink">ALLOCATIONS</span>
              </h1>
              <p className="text-lg font-bold text-muted-foreground">
                {user.name || user.email}
                {user.handle ? ` · @${user.handle}` : ""}
              </p>
              <p className="text-sm font-bold mt-2">{statusLabel}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="border-4 border-primary font-black uppercase">
                <Link href="/">Continue pairing</Link>
              </Button>
              <Button
                variant="outline"
                className="border-4 border-primary font-black uppercase"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>

          {hasAllocations ? (
            <div className="space-y-8">
              <section className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-2xl font-black uppercase mb-4">Your budget weights</h2>
                <BudgetAllocationBars comparisons={comparisons} />
              </section>

              <WishocracyEditSection
                comparisons={comparisons}
                selectedCategories={
                  selectedCategories.size > 0
                    ? selectedCategories
                    : new Set(Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[])
                }
                onSave={handleSave}
              />
            </div>
          ) : (
            <div className="border-4 border-primary bg-brutal-yellow p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xl font-black uppercase mb-2">No allocations yet</p>
              <p className="font-bold mb-6">
                Wishocracy is the pairwise catalog. Complete pairs on the home page — this
                dashboard shows your results and lets you edit them.
              </p>
              <Button asChild className="border-4 border-primary bg-brutal-pink font-black uppercase">
                <Link href="/">Start allocating</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
