import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { BudgetCategoryId, BUDGET_CATEGORIES } from "@/lib/wishocracy-data"
import {
  ensureWishocraticItemsExist,
  resolveItemIds,
} from "@/lib/wishocracy-item-ids"
import { createLogger } from "@/lib/logger"

const log = createLogger("wishocracy-category-selections")

export const runtime = "nodejs"

/**
 * POST /api/wishocracy/category-selections
 * Save user's category selections (which categories they want to fund vs skip)
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()

    const body = await req.json()
    const { selections } = body as {
      selections: Array<{
        categoryId: BudgetCategoryId
        selected: boolean
      }>
    }

    if (!selections || !Array.isArray(selections)) {
      return NextResponse.json(
        { error: "Invalid selections format" },
        { status: 400 },
      )
    }

    const invalidCategories = selections.filter(
      (s) => !BUDGET_CATEGORIES[s.categoryId as BudgetCategoryId],
    )

    if (invalidCategories.length > 0) {
      return NextResponse.json(
        { error: "Invalid category IDs" },
        { status: 400 },
      )
    }

    const inclusionRows = selections.flatMap((selection) =>
      resolveItemIds(selection.categoryId).map((itemId) => ({
        itemId,
        included: selection.selected,
      })),
    )

    await ensureWishocraticItemsExist(inclusionRows.map((r) => r.itemId))

    await Promise.all(
      inclusionRows.map((entry) =>
        prisma.wishocraticItemInclusion.upsert({
          where: {
            userId_itemId: {
              userId,
              itemId: entry.itemId,
            },
          },
          create: {
            userId,
            itemId: entry.itemId,
            included: entry.included,
          },
          update: {
            included: entry.included,
          },
        }),
      ),
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error("Failed to save category selections", { error })
    return NextResponse.json(
      { error: "Failed to save category selections" },
      { status: 500 },
    )
  }
}

/**
 * GET /api/wishocracy/category-selections
 * Fetch user's category selections
 */
export async function GET() {
  try {
    const { userId } = await requireAuth()

    const inclusions = await prisma.wishocraticItemInclusion.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    })

    // Client uses Optimitron WishocraticItem ids (same as DB itemAId/itemBId)
    const selections = inclusions.map((row) => ({
      categoryId: row.itemId,
      selected: row.included,
    }))

    return NextResponse.json({ selections })
  } catch (error) {
    log.error("Failed to fetch category selections", { error })
    return NextResponse.json(
      { error: "Failed to fetch category selections" },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/wishocracy/category-selections
 * Delete all user's category selections (used on reset)
 */
export async function DELETE() {
  try {
    const { userId } = await requireAuth()

    await prisma.wishocraticItemInclusion.deleteMany({
      where: { userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error("Failed to delete category selections", { error })
    return NextResponse.json(
      { error: "Failed to delete category selections" },
      { status: 500 },
    )
  }
}
