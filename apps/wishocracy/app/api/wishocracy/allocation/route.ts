import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import {
  ensureWishocraticItemsExist,
  isValidPairAllocation,
  resolvePairAllocations,
} from "@/lib/wishocracy-item-ids"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()

    const body = await req.json()
    const { categoryA, categoryB, allocationA, allocationB } = body

    if (!isValidPairAllocation({ categoryA, categoryB, allocationA, allocationB })) {
      return NextResponse.json(
        { error: "Invalid allocation: unknown category or allocations must be integers in [0,100] summing to 100" },
        { status: 400 },
      )
    }

    const resolved = resolvePairAllocations({
      categoryA,
      categoryB,
      allocationA,
      allocationB,
    })

    if (resolved.length === 0) {
      return NextResponse.json({ success: true, skipped: true })
    }

    await ensureWishocraticItemsExist(
      resolved.flatMap((r) => [r.itemAId, r.itemBId]),
    )

    for (const pair of resolved) {
      const existing = await prisma.wishocraticAllocation.findFirst({
        where: {
          userId,
          itemAId: pair.itemAId,
          itemBId: pair.itemBId,
        },
      })

      if (existing) {
        await prisma.wishocraticAllocation.update({
          where: { id: existing.id },
          data: {
            allocationA: pair.allocationA,
            allocationB: pair.allocationB,
          },
        })
      } else {
        await prisma.wishocraticAllocation.create({
          data: {
            userId,
            itemAId: pair.itemAId,
            itemBId: pair.itemBId,
            allocationA: pair.allocationA,
            allocationB: pair.allocationB,
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save allocation:", error)
    return NextResponse.json(
      { error: "Failed to save allocation" },
      { status: 500 },
    )
  }
}
