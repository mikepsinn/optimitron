import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getCurrentUser, requireAuth } from "@/lib/auth-utils";
import { createLogger } from "@/lib/logger";
import {
  isValidWishocraticAllocation,
  normalizeWishocraticAllocation,
} from "@/lib/wishocracy-community";
import { serverEnv } from "@/lib/env";
import { ensureWishocraticItemsExist } from "@/lib/wishocracy-catalog.server";
import { grantWishes } from "@/lib/wishes.server";
import { checkBadgesAfterWish } from "@/lib/badges.server";

const logger = createLogger("api/wishocracy/allocations");

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ allocations: [] });
    }

    const dbAllocations = await prisma.wishocraticAllocation.findMany({
      where: { userId },
      orderBy: { updatedAt: "asc" },
      select: {
        itemAId: true,
        itemBId: true,
        allocationA: true,
        allocationB: true,
        updatedAt: true,
      },
    });

    const seen = new Map<string, (typeof dbAllocations)[number]>();
    for (const allocation of dbAllocations) {
      const normalized = normalizeWishocraticAllocation(allocation);
      if (!isValidWishocraticAllocation(normalized)) {
        continue;
      }

      const key = `${normalized.itemAId}_${normalized.itemBId}`;
      const existing = seen.get(key);
      if (!existing || allocation.updatedAt > existing.updatedAt) {
        seen.set(key, allocation);
      }
    }

    const allocations = Array.from(seen.values()).map((allocation) => {
      const normalized = normalizeWishocraticAllocation(allocation);
      return {
        itemAId: normalized.itemAId,
        itemBId: normalized.itemBId,
        allocationA: normalized.allocationA,
        allocationB: normalized.allocationB,
        timestamp: allocation.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ allocations });
  } catch (error) {
    logger.error("Failed to fetch allocations:", error);
    return NextResponse.json({ allocations: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const normalized = normalizeWishocraticAllocation(body);

    if (!isValidWishocraticAllocation(normalized)) {
      return NextResponse.json(
        { error: "Allocations must reference valid items and sum to 100 or 0." },
        { status: 400 },
      );
    }

    await ensureWishocraticItemsExist([normalized.itemAId, normalized.itemBId]);

    const existing = await prisma.wishocraticAllocation.findFirst({
      where: {
        userId,
        itemAId: normalized.itemAId,
        itemBId: normalized.itemBId,
      },
    });

    if (existing) {
      await prisma.wishocraticAllocation.update({
        where: { id: existing.id },
        data: {
          allocationA: normalized.allocationA,
          allocationB: normalized.allocationB,
        },
      });
    } else {
      await prisma.wishocraticAllocation.create({
        data: {
          userId,
          itemAId: normalized.itemAId,
          itemBId: normalized.itemBId,
          allocationA: normalized.allocationA,
          allocationB: normalized.allocationB,
        },
      });
    }

    // Encrypt all user allocations as a single blob for breach protection
    const jurisdictionKey = serverEnv.WISHOCRACY_JURISDICTION_KEY;
    if (jurisdictionKey) {
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

    // Grant wish points for allocation
    let wishesEarned = 0;
    try {
      const wishResult = await grantWishes({
        userId,
        reason: "WISHOCRATIC_ALLOCATION",
        amount: 2,
      });
      if (wishResult) wishesEarned = wishResult.amount;
      void checkBadgesAfterWish(userId, "WISHOCRATIC_ALLOCATION");
    } catch (wishError) {
      console.error("[WISHOCRATIC ALLOCATION] Wish grant error:", wishError);
    }

    return NextResponse.json({ success: true, wishesEarned });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Failed to save allocation:", error);
    return NextResponse.json({ error: "Failed to save allocation." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { updatedAllocations, deletedItemIds } = body as {
      updatedAllocations: Array<{
        itemAId: string;
        itemBId: string;
        allocationA: number;
        allocationB: number;
      }>;
      deletedItemIds: string[];
    };

    if (deletedItemIds?.length) {
      await prisma.wishocraticAllocation.deleteMany({
        where: {
          userId: user.id,
          OR: [
            { itemAId: { in: deletedItemIds } },
            { itemBId: { in: deletedItemIds } },
          ],
        },
      });
    }

    if (updatedAllocations?.length) {
      const normalizedAllocations = updatedAllocations.map(normalizeWishocraticAllocation);

      if (!normalizedAllocations.every(isValidWishocraticAllocation)) {
        return NextResponse.json(
          { error: "Allocations must reference valid items and sum to 100 or 0." },
          { status: 400 },
        );
      }

      await ensureWishocraticItemsExist(
        normalizedAllocations.flatMap((allocation) => [allocation.itemAId, allocation.itemBId]),
      );

      for (const allocation of normalizedAllocations) {
        await prisma.wishocraticAllocation.deleteMany({
          where: {
            userId: user.id,
            OR: [
              { itemAId: allocation.itemAId, itemBId: allocation.itemBId },
              { itemAId: allocation.itemBId, itemBId: allocation.itemAId },
            ],
          },
        });
      }

      await prisma.wishocraticAllocation.createMany({
        data: normalizedAllocations.map((allocation) => ({
          userId: user.id,
          itemAId: allocation.itemAId,
          itemBId: allocation.itemBId,
          allocationA: allocation.allocationA,
          allocationB: allocation.allocationB,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to update allocations:", error);
    return NextResponse.json({ error: "Failed to update allocations." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.wishocraticAllocation.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete allocations:", error);
    return NextResponse.json({ error: "Failed to delete allocations." }, { status: 500 });
  }
}
