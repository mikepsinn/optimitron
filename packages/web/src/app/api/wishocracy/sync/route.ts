import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { calculateAllocationsFromPairwise } from "@/lib/wishocracy-calculations";
import { BUDGET_CATEGORIES, BudgetCategoryId } from "@/lib/wishocracy-data";
import {
  isBudgetCategoryId,
  isValidWishocraticComparison,
  normalizeWishocraticComparison,
} from "@/lib/wishocracy-community";

interface ComparisonData {
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
    const { comparisons, selectedCategories } = body as {
      comparisons: ComparisonData[];
      selectedCategories?: string[];
    };

    if (
      (!comparisons || comparisons.length === 0) &&
      (!selectedCategories || selectedCategories.length === 0)
    ) {
      return NextResponse.json(
        { error: "At least one comparison or category selection is required." },
        { status: 400 },
      );
    }

    if (selectedCategories?.length) {
      if (!selectedCategories.every(isBudgetCategoryId)) {
        return NextResponse.json({ error: "Invalid category selections." }, { status: 400 });
      }

      const allCategories = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[];
      await prisma.wishocraticCategorySelection.deleteMany({ where: { userId } });
      await prisma.wishocraticCategorySelection.createMany({
        data: allCategories.map((categoryId) => ({
          userId,
          itemId: categoryId,
          selected: selectedCategories.includes(categoryId),
        })),
      });
    }

    let syncedComparisons = 0;
    let finalAllocations: Record<string, number> = {};

    if (comparisons?.length) {
      const normalizedComparisons = comparisons.map(normalizeWishocraticComparison);

      if (!normalizedComparisons.every(isValidWishocraticComparison)) {
        return NextResponse.json(
          { error: "Allocations must reference valid categories and sum to 100 or 0." },
          { status: 400 },
        );
      }

      finalAllocations = calculateAllocationsFromPairwise(normalizedComparisons);

      await prisma.wishocraticAllocation.deleteMany({ where: { userId } });

      const createResult = await prisma.wishocraticAllocation.createMany({
        data: normalizedComparisons.map((comparison) => ({
          userId,
          itemAId: comparison.itemAId,
          itemBId: comparison.itemBId,
          allocationA: comparison.allocationA,
          allocationB: comparison.allocationB,
        })),
      });

      syncedComparisons = createResult.count;
    }

    // Encrypt all user allocations as a single blob for breach protection
    const jurisdictionKey = process.env.WISHOCRACY_JURISDICTION_KEY;
    if (jurisdictionKey && syncedComparisons > 0) {
      try {
        const { importKey, encryptJson } = await import("@optomitron/storage");
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
      syncedSelections: selectedCategories?.length || 0,
      syncedComparisons,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Wishocracy sync error:", error);
    return NextResponse.json({ error: "Sync failed. Please try again." }, { status: 500 });
  }
}
