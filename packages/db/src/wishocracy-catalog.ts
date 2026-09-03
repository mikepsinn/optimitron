import {
  DEFAULT_WISHOCRATIC_JURISDICTION,
  DEFAULT_WISHOCRATIC_ITEMS_JURISDICTION_CODE,
  getDefaultWishocraticCatalogRecord,
  type DefaultWishocraticItemId,
  DEFAULT_WISHOCRATIC_ITEMS,
} from "@optimitron/data/wishocratic-items-registry"
import type { PrismaClient } from "./generated/prisma/client.js"
import { JurisdictionType } from "./generated/prisma/client.js"

const ALL_WISHOCRATIC_ITEM_IDS = Object.keys(DEFAULT_WISHOCRATIC_ITEMS) as DefaultWishocraticItemId[]

export async function ensureWishocraticItemsExist(
  prisma: PrismaClient,
  itemIds: DefaultWishocraticItemId[] = ALL_WISHOCRATIC_ITEM_IDS,
): Promise<void> {
  const uniqueIds = Array.from(new Set(itemIds))
  if (!uniqueIds.length) return

  for (const itemId of uniqueIds) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_WISHOCRATIC_ITEMS, itemId)) {
      throw new Error(`Unknown WishocraticItem id: ${itemId}`)
    }
  }

  const jurisdiction = await prisma.jurisdiction.upsert({
    where: { code: DEFAULT_WISHOCRATIC_ITEMS_JURISDICTION_CODE },
    // Keep initialization atomic when concurrent first responses need the catalogue.
    update: { code: DEFAULT_WISHOCRATIC_ITEMS_JURISDICTION_CODE },
    create: {
      name: DEFAULT_WISHOCRATIC_JURISDICTION.name,
      type: JurisdictionType.COUNTRY,
      code: DEFAULT_WISHOCRATIC_ITEMS_JURISDICTION_CODE,
    },
    select: { id: true },
  })

  await Promise.all(uniqueIds.map((itemId) => {
    const record = getDefaultWishocraticCatalogRecord(itemId)
    return prisma.wishocraticItem.upsert({
      where: { id: itemId },
      create: {
        id: record.id,
        name: record.name,
        description: record.description,
        sourceUrl: record.sourceUrl,
        currentAllocationUsd: record.currentAllocationUsd,
        currentAllocationPct: record.currentAllocationPct,
        jurisdictionId: jurisdiction.id,
        active: true,
      },
      update: {
        name: record.name,
        description: record.description,
        currentAllocationUsd: record.currentAllocationUsd,
        currentAllocationPct: record.currentAllocationPct,
        sourceUrl: record.sourceUrl,
        active: true,
        deletedAt: null,
      },
    })
  }))
}
