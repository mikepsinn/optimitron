import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth-utils";
import { createLogger } from "@/lib/logger";
import {
  isValidWishocraticComparison,
  normalizeWishocraticComparison,
} from "@/lib/wishocracy-community";

const logger = createLogger("api/wishocracy/allocations");

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ allocations: [] });
    }

    const dbAllocations = await prisma.wishocraticAllocation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "asc" },
      select: {
        categoryA: true,
        categoryB: true,
        allocationA: true,
        allocationB: true,
        updatedAt: true,
      },
    });

    const seen = new Map<string, (typeof dbAllocations)[number]>();
    for (const allocation of dbAllocations) {
      const normalized = normalizeWishocraticComparison(allocation);
      if (!isValidWishocraticComparison(normalized)) {
        continue;
      }

      const key = `${normalized.categoryA}_${normalized.categoryB}`;
      const existing = seen.get(key);
      if (!existing || allocation.updatedAt > existing.updatedAt) {
        seen.set(key, allocation);
      }
    }

    const allocations = Array.from(seen.values()).map((allocation) => {
      const normalized = normalizeWishocraticComparison(allocation);
      return {
        categoryA: normalized.categoryA,
        categoryB: normalized.categoryB,
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
    const normalized = normalizeWishocraticComparison(body);

    if (!isValidWishocraticComparison(normalized)) {
      return NextResponse.json(
        { error: "Allocations must reference valid categories and sum to 100 or 0." },
        { status: 400 },
      );
    }

    const existing = await prisma.wishocraticAllocation.findFirst({
      where: {
        userId,
        categoryA: normalized.categoryA,
        categoryB: normalized.categoryB,
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
          categoryA: normalized.categoryA,
          categoryB: normalized.categoryB,
          allocationA: normalized.allocationA,
          allocationB: normalized.allocationB,
        },
      });
    }

    // Encrypt all user allocations as a single blob for breach protection
    const jurisdictionKey = process.env.WISHOCRACY_JURISDICTION_KEY;
    if (jurisdictionKey) {
      try {
        const { importKey, encryptJson } = await import("@optomitron/storage");
        const allAllocations = await prisma.wishocraticAllocation.findMany({
          where: { userId, deletedAt: null },
          select: { categoryA: true, categoryB: true, allocationA: true, allocationB: true },
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

    return NextResponse.json({ success: true });
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
    const { updatedComparisons, deletedCategories } = body as {
      updatedComparisons: Array<{
        categoryA: string;
        categoryB: string;
        allocationA: number;
        allocationB: number;
      }>;
      deletedCategories: string[];
    };

    if (deletedCategories?.length) {
      await prisma.wishocraticAllocation.deleteMany({
        where: {
          userId: user.id,
          OR: [
            { categoryA: { in: deletedCategories } },
            { categoryB: { in: deletedCategories } },
          ],
        },
      });
    }

    if (updatedComparisons?.length) {
      const normalizedComparisons = updatedComparisons.map(normalizeWishocraticComparison);

      if (!normalizedComparisons.every(isValidWishocraticComparison)) {
        return NextResponse.json(
          { error: "Allocations must reference valid categories and sum to 100 or 0." },
          { status: 400 },
        );
      }

      for (const comparison of normalizedComparisons) {
        await prisma.wishocraticAllocation.deleteMany({
          where: {
            userId: user.id,
            OR: [
              { categoryA: comparison.categoryA, categoryB: comparison.categoryB },
              { categoryA: comparison.categoryB, categoryB: comparison.categoryA },
            ],
          },
        });
      }

      await prisma.wishocraticAllocation.createMany({
        data: normalizedComparisons.map((comparison) => ({
          userId: user.id,
          categoryA: comparison.categoryA,
          categoryB: comparison.categoryB,
          allocationA: comparison.allocationA,
          allocationB: comparison.allocationB,
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
