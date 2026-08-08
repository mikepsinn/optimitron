import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { ActivityType } from "@optimitron/db"
import { calculateAllocationsFromPairwise } from "@/lib/wishocracy-calculations"
import { BUDGET_CATEGORIES, BudgetCategoryId } from "@/lib/wishocracy-data"
import {
  ensureWishocraticItemsExist,
  isValidPairAllocation,
  resolveItemIds,
  resolvePairAllocations,
} from "@/lib/wishocracy-item-ids"

interface ComparisonData {
  categoryA: string
  categoryB: string
  allocationA: number
  allocationB: number
  timestamp: string
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()

    const body = await req.json()
    const { comparisons, selectedCategories } = body as {
      comparisons: ComparisonData[]
      selectedCategories?: string[]
    }

    if (
      (!comparisons || comparisons.length === 0) &&
      (!selectedCategories || selectedCategories.length === 0)
    ) {
      return NextResponse.json(
        { error: "At least one comparison or category selection required" },
        { status: 400 },
      )
    }

    if (selectedCategories && selectedCategories.length > 0) {
      const allCategories = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]
      const inclusions = allCategories.flatMap((categoryId) =>
        resolveItemIds(categoryId).map((itemId) => ({
          userId,
          itemId,
          included: selectedCategories.includes(categoryId),
        })),
      )

      await ensureWishocraticItemsExist(inclusions.map((i) => i.itemId))
      await prisma.wishocraticItemInclusion.deleteMany({ where: { userId } })
      await prisma.wishocraticItemInclusion.createMany({ data: inclusions })
    }

    let finalAllocations = {}
    let createResult = { count: 0 }

    if (comparisons && comparisons.length > 0) {
      for (const comp of comparisons) {
        if (!isValidPairAllocation(comp)) {
          return NextResponse.json(
            {
              error: "Invalid allocation: unknown category or allocations must be integers in [0,100] summing to 100",
            },
            { status: 400 },
          )
        }
      }

      finalAllocations = calculateAllocationsFromPairwise(comparisons)

      const resolvedPairs = comparisons.flatMap(resolvePairAllocations)
      await ensureWishocraticItemsExist(
        resolvedPairs.flatMap((p) => [p.itemAId, p.itemBId]),
      )

      // Upsert (not createMany+skipDuplicates) so a newer local value for a
      // pair the user already has in the DB overwrites the stale row instead
      // of being silently discarded.
      let syncedCount = 0
      for (const pair of resolvedPairs) {
        await prisma.wishocraticAllocation.upsert({
          where: {
            userId_itemAId_itemBId: {
              userId,
              itemAId: pair.itemAId,
              itemBId: pair.itemBId,
            },
          },
          update: {
            allocationA: pair.allocationA,
            allocationB: pair.allocationB,
          },
          create: {
            userId,
            itemAId: pair.itemAId,
            itemBId: pair.itemBId,
            allocationA: pair.allocationA,
            allocationB: pair.allocationB,
          },
        })
        syncedCount++
      }
      createResult = { count: syncedCount }

      if (createResult.count > 0) {
        await prisma.activity.create({
          data: {
            userId,
            type: ActivityType.SUBMITTED_COMPARISON,
            description: `Completed ${createResult.count} Wishocracy budget allocation${createResult.count === 1 ? "" : "s"}`,
            metadata: JSON.stringify({
              finalAllocations,
              comparisonCount: createResult.count,
            }),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      finalAllocations,
      syncedSelections: selectedCategories?.length || 0,
      syncedComparisons: createResult.count,
    })
  } catch (error) {
    console.error("Wishocracy sync error:", error)
    return NextResponse.json(
      { error: "Sync failed. Please try again." },
      { status: 500 },
    )
  }
}
