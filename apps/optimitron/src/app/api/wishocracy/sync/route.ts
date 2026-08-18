import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { calculateAllocationsFromPairwise } from "@/lib/wishocracy-calculations";
import { WISHOCRATIC_ITEMS, WishocraticItemId } from "@/lib/wishocracy-data";
import {
  isWishocraticItemId,
  isValidWishocraticAllocation,
  normalizeWishocraticAllocation,
} from "@/lib/wishocracy-community";
import { serverEnv } from "@/lib/env";
import { ensureWishocraticItemsExist } from "@/lib/wishocracy-catalog.server";

interface AllocationData {
  itemAId: string;
  itemBId: string;
  allocationA: number;
  allocationB: number;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const { comparisons, includedItemIds } = body as {
      comparisons: AllocationData[];
      includedItemIds?: string[];
    };

    if (
      (!comparisons || comparisons.length === 0) &&
      (!includedItemIds || includedItemIds.length === 0)
    ) {
      return NextResponse.json(
        { error: "At least one comparison or item inclusion is required." },
        { status: 400 },
      );
    }

    if (includedItemIds?.length) {
      if (!includedItemIds.every(isWishocraticItemId)) {
        return NextResponse.json({ error: "Invalid item inclusions." }, { status: 400 });
      }

      const allItems = Object.keys(WISHOCRATIC_ITEMS) as WishocraticItemId[];
      await ensureWishocraticItemsExist(allItems);
      await prisma.wishocraticItemInclusion.deleteMany({ where: { userId } });
      await prisma.wishocraticItemInclusion.createMany({
        data: allItems.map((itemId) => ({
          userId,
          itemId,
          included: includedItemIds.includes(itemId),
        })),
      });
    }

    let syncedAllocations = 0;
    let finalAllocations: Record<string, number> = {};

    if (comparisons?.length) {
      const normalizedAllocations = comparisons.map(normalizeWishocraticAllocation);
      const validAllocations: Array<
        AllocationData & { itemAId: WishocraticItemId; itemBId: WishocraticItemId }
      > = [];

      for (const allocation of normalizedAllocations) {
        if (!isValidWishocraticAllocation(allocation)) {
          return NextResponse.json(
            { error: "Allocations must reference valid items and sum to 100 or 0." },
            { status: 400 },
          );
        }

        validAllocations.push(allocation);
      }

      const allocationItemIds = validAllocations.reduce<WishocraticItemId[]>(
        (itemIds, allocation) => {
          itemIds.push(allocation.itemAId, allocation.itemBId);
          return itemIds;
        },
        [],
      );

      await ensureWishocraticItemsExist(allocationItemIds);

      finalAllocations = calculateAllocationsFromPairwise(validAllocations);

      await prisma.wishocraticAllocation.deleteMany({ where: { userId } });

      const createResult = await prisma.wishocraticAllocation.createMany({
        data: validAllocations.map((allocation) => ({
          userId,
          itemAId: allocation.itemAId,
          itemBId: allocation.itemBId,
          allocationA: allocation.allocationA,
          allocationB: allocation.allocationB,
        })),
      });

      syncedAllocations = createResult.count;
    }

    // Encrypt all user allocations as a single blob for breach protection
    const jurisdictionKey = serverEnv.WISHOCRACY_JURISDICTION_KEY;
    if (jurisdictionKey && syncedAllocations > 0) {
      try {
        const { importKey, encryptJson } = await import("@optimitron/storage/crypto");
        const allAllocations = await prisma.wishocraticAllocation.findMany({
          where: { userId, deletedAt: null },
          select: { itemAId: true, itemBId: true, allocationA: true, allocationB: true },
        });
        const key = await importKey(jurisdictionKey);
        const encrypted = await encryptJson(allAllocations, key);
        await prisma.wishocraticEncryptedAllocation.upsert({
          where: { userId },
          update: {
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            algorithm: encrypted.algorithm,
          },
          create: {
            userId,
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            algorithm: encrypted.algorithm,
          },
        });
      } catch (encryptError) {
        console.error("Failed to store encrypted allocation:", encryptError);
        // Don't fail the request — plaintext write already succeeded
      }
    }

    return NextResponse.json({
      success: true,
      finalAllocations,
      syncedInclusions: includedItemIds?.length || 0,
      syncedAllocations,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Wishocracy sync error:", error);
    return NextResponse.json({ error: "Sync failed. Please try again." }, { status: 500 });
  }
}
