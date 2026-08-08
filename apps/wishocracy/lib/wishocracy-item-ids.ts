import { prisma } from "@/lib/prisma"
import { JurisdictionType } from "@optimitron/db"
import { BUDGET_CATEGORIES } from "@/lib/wishocracy-data"

const KNOWN_CATEGORY_IDS = new Set(Object.keys(BUDGET_CATEGORIES))

/**
 * DIH budget category IDs → Optimitron WishocraticItem.id values.
 * Most are identity; a few aliases exist from the DIH catalog split.
 */
const CATEGORY_TO_ITEM_IDS: Record<string, string[]> = {
  DRUG_WAR_ENFORCEMENT: ["DRUG_WAR"],
  PRISON_CONSTRUCTION: ["VIOLENT_CRIME_INCARCERATION"],
  ICE_IMMIGRATION_ENFORCEMENT: [
    "ICE_CRIMINAL_DEPORTATION",
    "ICE_NONCRIMINAL_DEPORTATION",
  ],
}

const ITEM_TO_CATEGORY: Record<string, string> = {
  DRUG_WAR: "DRUG_WAR_ENFORCEMENT",
  VIOLENT_CRIME_INCARCERATION: "PRISON_CONSTRUCTION",
  ICE_CRIMINAL_DEPORTATION: "ICE_IMMIGRATION_ENFORCEMENT",
  ICE_NONCRIMINAL_DEPORTATION: "ICE_IMMIGRATION_ENFORCEMENT",
}

/** Resolve a DIH category id to one or more WishocraticItem ids. */
export function resolveItemIds(categoryId: string): string[] {
  return CATEGORY_TO_ITEM_IDS[categoryId] ?? [categoryId]
}

/** Map a WishocraticItem id back to the DIH client category id. */
export function toClientCategoryId(itemId: string): string {
  return ITEM_TO_CATEGORY[itemId] ?? itemId
}

export type PairAllocationInput = {
  categoryA: string
  categoryB: string
  allocationA: number
  allocationB: number
}

export type ResolvedPairAllocation = {
  itemAId: string
  itemBId: string
  allocationA: number
  allocationB: number
}

/**
 * Expand a DIH category pair into WishocraticAllocation row(s).
 * ICE expands to both deportation items; if both sides expand to multiple
 * items we take the cartesian product. Pairs that would be self-vs-self are skipped.
 */
export function resolvePairAllocations(
  pair: PairAllocationInput,
): ResolvedPairAllocation[] {
  const aIds = resolveItemIds(pair.categoryA)
  const bIds = resolveItemIds(pair.categoryB)
  const results: ResolvedPairAllocation[] = []

  for (const rawA of aIds) {
    for (const rawB of bIds) {
      if (rawA === rawB) continue

      let itemAId = rawA
      let itemBId = rawB
      let allocationA = pair.allocationA
      let allocationB = pair.allocationB

      // Normalize pair order alphabetically (matches allocation/route.ts)
      if (itemAId > itemBId) {
        ;[itemAId, itemBId] = [itemBId, itemAId]
        ;[allocationA, allocationB] = [allocationB, allocationA]
      }

      results.push({ itemAId, itemBId, allocationA, allocationB })
    }
  }

  return results
}

/** Flatten category ids for deleteMany OR filters (includes expanded aliases). */
export function resolveItemIdsForFilter(categoryIds: string[]): string[] {
  return Array.from(new Set(categoryIds.flatMap(resolveItemIds)))
}

/**
 * Validate a single pairwise allocation before it is persisted:
 * - both categories must be known budget category ids
 * - categories must differ
 * - both allocations must be integers in [0, 100] that sum to 100
 */
export function isValidPairAllocation(pair: {
  categoryA: unknown
  categoryB: unknown
  allocationA: unknown
  allocationB: unknown
}): pair is PairAllocationInput {
  const { categoryA, categoryB, allocationA, allocationB } = pair

  if (
    typeof categoryA !== "string" ||
    typeof categoryB !== "string" ||
    !KNOWN_CATEGORY_IDS.has(categoryA) ||
    !KNOWN_CATEGORY_IDS.has(categoryB) ||
    categoryA === categoryB
  ) {
    return false
  }

  if (
    typeof allocationA !== "number" ||
    typeof allocationB !== "number" ||
    !Number.isInteger(allocationA) ||
    !Number.isInteger(allocationB) ||
    allocationA < 0 ||
    allocationA > 100 ||
    allocationB < 0 ||
    allocationB > 100 ||
    allocationA + allocationB !== 100
  ) {
    return false
  }

  return true
}

/**
 * Minimal ensure: upsert WishocraticItem rows so FKs succeed.
 * Does not pull the full packages/web catalog.
 */
export async function ensureWishocraticItemsExist(
  itemIds: string[],
): Promise<void> {
  const uniqueIds = Array.from(new Set(itemIds.filter(Boolean)))
  if (!uniqueIds.length) return

  const jurisdiction = await prisma.jurisdiction.upsert({
    where: { code: "US" },
    update: {},
    create: {
      name: "United States",
      type: JurisdictionType.COUNTRY,
      code: "US",
    },
    select: { id: true },
  })

  await Promise.all(
    uniqueIds.map((itemId) =>
      prisma.wishocraticItem.upsert({
        where: { id: itemId },
        create: {
          id: itemId,
          name: itemId,
          jurisdictionId: jurisdiction.id,
          active: true,
        },
        update: {
          active: true,
          deletedAt: null,
        },
      }),
    ),
  )
}
