import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateAllocationsFromPairwise } from "@/lib/wishocracy-calculations"
import { BudgetCategoryId, BUDGET_CATEGORIES } from "@/lib/wishocracy-data"
import { toClientCategoryId } from "@/lib/wishocracy-item-ids"

/**
 * GET /api/wishocracy/average-allocations
 * Returns the community average allocation percentages across all users
 */
export async function GET() {
  try {
    const allAllocations = await prisma.wishocraticAllocation.findMany({
      select: {
        userId: true,
        itemAId: true,
        itemBId: true,
        allocationA: true,
        allocationB: true,
      },
    })

    if (allAllocations.length === 0) {
      const emptyAllocations: Record<BudgetCategoryId, number> =
        {} as Record<BudgetCategoryId, number>
      Object.keys(BUDGET_CATEGORIES).forEach((categoryId) => {
        emptyAllocations[categoryId as BudgetCategoryId] = 0
      })

      return NextResponse.json({
        averageAllocations: emptyAllocations,
        totalUsers: 0,
      })
    }

    const allocationsByUser = new Map<
      string,
      Array<{
        categoryA: string
        categoryB: string
        allocationA: number
        allocationB: number
      }>
    >()

    for (const allocation of allAllocations) {
      if (!allocationsByUser.has(allocation.userId)) {
        allocationsByUser.set(allocation.userId, [])
      }
      allocationsByUser.get(allocation.userId)!.push({
        categoryA: toClientCategoryId(allocation.itemAId),
        categoryB: toClientCategoryId(allocation.itemBId),
        allocationA: allocation.allocationA,
        allocationB: allocation.allocationB,
      })
    }

    const userAllocations: Array<Record<string, number>> = []
    for (const [, comparisons] of allocationsByUser.entries()) {
      const userAllocation = calculateAllocationsFromPairwise(comparisons)
      userAllocations.push(userAllocation)
    }

    const categoryTotals: Record<string, number> = {}
    const categoryCounts: Record<string, number> = {}

    for (const userAllocation of userAllocations) {
      for (const [categoryId, percentage] of Object.entries(userAllocation)) {
        if (!categoryTotals[categoryId]) {
          categoryTotals[categoryId] = 0
          categoryCounts[categoryId] = 0
        }
        categoryTotals[categoryId] += percentage
        categoryCounts[categoryId] += 1
      }
    }

    const averageAllocations: Record<BudgetCategoryId, number> =
      {} as Record<BudgetCategoryId, number>
    for (const categoryId of Object.keys(BUDGET_CATEGORIES)) {
      const total = categoryTotals[categoryId] || 0
      const count = categoryCounts[categoryId] || 1
      averageAllocations[categoryId as BudgetCategoryId] = total / count
    }

    return NextResponse.json({
      averageAllocations,
      totalUsers: allocationsByUser.size,
    })
  } catch (error) {
    console.error("Failed to calculate average allocations:", error)
    return NextResponse.json(
      { error: "Failed to fetch average allocations" },
      { status: 500 },
    )
  }
}
