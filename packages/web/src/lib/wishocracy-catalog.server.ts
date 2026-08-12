import { prisma } from "@/lib/prisma";
import { ensureWishocraticItemsExist as ensureFromDb } from "@optimitron/db";
import {
  WISHOCRATIC_ITEMS,
  buildWishocraticCatalogRecord,
  type WishocraticItemId,
} from "@/lib/wishocracy-data";

const ALL_WISHOCRATIC_ITEM_IDS = Object.keys(WISHOCRATIC_ITEMS) as WishocraticItemId[];

export { buildWishocraticCatalogRecord };
export async function ensureWishocraticItemsExist(
  itemIds: WishocraticItemId[] = ALL_WISHOCRATIC_ITEM_IDS,
): Promise<void> {
  await ensureFromDb(prisma, itemIds);
}
