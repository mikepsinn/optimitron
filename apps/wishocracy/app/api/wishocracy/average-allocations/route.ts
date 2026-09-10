import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateAverageAllocations } from "@/lib/wishocracy-average-allocations"
import { BUDGET_CATEGORIES } from "@/lib/wishocracy-data"
import { createLogger } from "@/lib/logger"

const log = createLogger("wishocracy-average-allocations")

export async function GET() {
  try {
    const categoryIds = Object.keys(BUDGET_CATEGORIES)
    const allocations = await prisma.wishocraticAllocation.findMany({
      where: {
        deletedAt: null,
        user: { deletedAt: null },
        itemAId: { in: categoryIds },
        itemBId: { in: categoryIds },
      },
      select: {
        userId: true,
        itemAId: true,
        itemBId: true,
        allocationA: true,
        allocationB: true,
        updatedAt: true,
      },
    })
    return NextResponse.json(calculateAverageAllocations(allocations))
  } catch (error) {
    log.error("Failed to calculate average allocations", { error })
    return NextResponse.json(
      { error: "Failed to fetch average allocations" },
      { status: 500 },
    )
  }
}
