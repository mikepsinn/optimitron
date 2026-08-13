import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/logger"
import {
  ensureWishocraticItemsExist,
  isValidPairAllocation,
  resolveItemIdsForFilter,
  resolvePairAllocations,
  toClientCategoryId,
} from "@/lib/wishocracy-item-ids"

const logger = createLogger("api/wishocracy/allocations")

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ allocations: [] })
    }

    const dbAllocations = await prisma.wishocraticAllocation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: {
        itemAId: true,
        itemBId: true,
        allocationA: true,
        allocationB: true,
        createdAt: true,
      },
    })

    // Deduplicate pairs (in case of historical data with both A vs B and B vs A)
    const seen = new Map<string, (typeof dbAllocations)[number]>()
    for (const alloc of dbAllocations) {
      const [catA, catB] = [alloc.itemAId, alloc.itemBId].sort()
      const key = `${catA}_${catB}`

      if (!seen.has(key)) {
        seen.set(key, alloc)
      } else {
        const existing = seen.get(key)!
        if (alloc.createdAt > existing.createdAt) {
          seen.set(key, alloc)
        }
      }
    }

    const allocations = Array.from(seen.values()).map((alloc) => {
      const [itemA, itemB] = [alloc.itemAId, alloc.itemBId].sort()
      const needsSwap = itemA !== alloc.itemAId

      return {
        categoryA: toClientCategoryId(itemA),
        categoryB: toClientCategoryId(itemB),
        allocationA: needsSwap ? alloc.allocationB : alloc.allocationA,
        allocationB: needsSwap ? alloc.allocationA : alloc.allocationB,
        timestamp: alloc.createdAt.toISOString(),
      }
    })

    return NextResponse.json({ allocations })
  } catch (error) {
    logger.error("Failed to fetch allocations:", error)
    return NextResponse.json({ allocations: [] })
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { updatedComparisons, deletedCategories } = body as {
      updatedComparisons: Array<{
        categoryA: string
        categoryB: string
        allocationA: number
        allocationB: number
      }>
      deletedCategories: string[]
    }

    const deletedCategorySet = new Set(deletedCategories ?? [])

    if (deletedCategorySet.size > 0) {
      const deletedItemIds = resolveItemIdsForFilter(Array.from(deletedCategorySet))
      await prisma.wishocraticAllocation.deleteMany({
        where: {
          userId: user.id,
          OR: [
            { itemAId: { in: deletedItemIds } },
            { itemBId: { in: deletedItemIds } },
          ],
        },
      })
    }

    // Exclude any submitted pair that touches a category the user just
    // deleted — the client may still include it in updatedComparisons, but
    // recreating it here would undo the deletion above.
    const survivingComparisons = (updatedComparisons ?? []).filter(
      (comp) =>
        !deletedCategorySet.has(comp.categoryA) &&
        !deletedCategorySet.has(comp.categoryB),
    )

    if (survivingComparisons.length > 0) {
      for (const comp of survivingComparisons) {
        if (!isValidPairAllocation(comp)) {
          return NextResponse.json(
            { error: "Invalid allocation: unknown category or allocations must be integers in [0,100] summing to 100" },
            { status: 400 },
          )
        }
      }

      const resolvedPairs = survivingComparisons.flatMap(resolvePairAllocations)

      await ensureWishocraticItemsExist(
        resolvedPairs.flatMap((p) => [p.itemAId, p.itemBId]),
      )

      for (const pair of resolvedPairs) {
        await prisma.wishocraticAllocation.deleteMany({
          where: {
            userId: user.id,
            OR: [
              { itemAId: pair.itemAId, itemBId: pair.itemBId },
              { itemAId: pair.itemBId, itemBId: pair.itemAId },
            ],
          },
        })
      }

      if (resolvedPairs.length > 0) {
        await prisma.wishocraticAllocation.createMany({
          data: resolvedPairs.map((pair) => ({
            userId: user.id,
            itemAId: pair.itemAId,
            itemBId: pair.itemBId,
            allocationA: pair.allocationA,
            allocationB: pair.allocationB,
          })),
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Failed to update allocations:", error)
    return NextResponse.json({ error: "Failed to update allocations" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.wishocraticAllocation.deleteMany({
      where: { userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Failed to delete allocations:", error)
    return NextResponse.json({ error: "Failed to delete allocations" }, { status: 500 })
  }
}
