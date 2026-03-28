import { prisma } from "@/lib/prisma";
import {
  WISHOCRATIC_ITEMS,
  DEFAULT_WISHOCRACY_JURISDICTION_CODE,
  getActualGovernmentAllocations,
  type WishocraticItemId,
} from "@/lib/wishocracy-data";

const ALL_WISHOCRATIC_ITEM_IDS = Object.keys(WISHOCRATIC_ITEMS) as WishocraticItemId[];

export interface WishocraticCatalogRecord {
  id: WishocraticItemId;
  name: string;
  description: string;
  currentAllocationUsd: number;
  currentAllocationPct: number;
  sourceUrl: string | null;
}

export function buildWishocraticCatalogRecord(itemId: WishocraticItemId): WishocraticCatalogRecord {
  const item = WISHOCRATIC_ITEMS[itemId];
  const allocations = getActualGovernmentAllocations();

  return {
    id: itemId,
    name: item.name,
    description: item.description,
    currentAllocationUsd: item.annualBudgetBillions * 1e9,
    currentAllocationPct: allocations[itemId],
    sourceUrl: item.roiData?.sourceUrl ?? item.sources[0]?.url ?? null,
  };
}

export async function ensureWishocraticItemsExist(
  itemIds: WishocraticItemId[] = ALL_WISHOCRATIC_ITEM_IDS,
): Promise<void> {
  const uniqueIds = Array.from(new Set(itemIds));
  if (!uniqueIds.length) {
    return;
  }

  const jurisdiction = await prisma.jurisdiction.upsert({
    where: { code: DEFAULT_WISHOCRACY_JURISDICTION_CODE },
    update: {},
    create: {
      name: "United States",
      type: "COUNTRY",
      code: DEFAULT_WISHOCRACY_JURISDICTION_CODE,
    },
    select: { id: true },
  });

  await Promise.all(
    uniqueIds.map((itemId) => {
      const record = buildWishocraticCatalogRecord(itemId);

      return prisma.wishocraticItem.upsert({
        where: { id: itemId },
        create: {
          ...record,
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
      });
    }),
  );
}
