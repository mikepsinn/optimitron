import { unstable_cache } from "next/cache"
import { getCurrentUser } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import type { Comparison } from "./wishocracy-calculations"
import { BUDGET_CATEGORIES, isBudgetCategoryId, type BudgetCategoryId } from "./wishocracy-data"
import { calculatePublicAllocations, latestAnswersByUser } from "./wishocracy-public-allocations"

const ANSWER_FIELDS = {
  id: true,
  userId: true,
  itemAId: true,
  itemBId: true,
  allocationA: true,
  allocationB: true,
  updatedAt: true,
} as const

/** Everyone's result, recomputed at most once a minute because the bootstrap reads every saved answer. */
export const loadPublicAllocations = unstable_cache(async () => {
  const categoryIds = Object.keys(BUDGET_CATEGORIES)
  const [rows, inclusions] = await Promise.all([
    prisma.wishocraticAllocation.findMany({
      where: {
        deletedAt: null,
        user: { deletedAt: null },
        itemAId: { in: categoryIds },
        itemBId: { in: categoryIds },
      },
      select: ANSWER_FIELDS,
    }),
    prisma.wishocraticItemInclusion.findMany({
      where: { deletedAt: null, user: { deletedAt: null }, itemId: { in: categoryIds } },
      select: { userId: true, itemId: true, included: true },
    }),
  ])
  return calculatePublicAllocations(rows, inclusions)
}, ["wishocracy-public-allocations"], { revalidate: 60 })

/** The signed-in person's latest answer per pair and chosen programs, or null when nobody is signed in. */
export async function loadSignedInAnswers(): Promise<{
  comparisons: Comparison[]
  selectedCategoryIds: BudgetCategoryId[]
} | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const userId = user.id
  const [rows, inclusions] = await Promise.all([
    prisma.wishocraticAllocation.findMany({ where: { userId, deletedAt: null }, select: ANSWER_FIELDS }),
    prisma.wishocraticItemInclusion.findMany({ where: { userId }, select: { itemId: true, included: true } }),
  ])
  const latest = latestAnswersByUser(rows).get(userId) ?? []
  return {
    comparisons: latest.map((row) => {
      const [categoryA, categoryB] = [row.itemAId, row.itemBId].sort() as [string, string]
      const swapped = categoryA !== row.itemAId
      return {
        categoryA,
        categoryB,
        allocationA: swapped ? row.allocationB : row.allocationA,
        allocationB: swapped ? row.allocationA : row.allocationB,
      }
    }),
    selectedCategoryIds: inclusions.filter((row) => row.included).map((row) => row.itemId).filter(isBudgetCategoryId),
  }
}
