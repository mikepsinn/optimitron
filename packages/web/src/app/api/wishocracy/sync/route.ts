import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { calculateAllocationsFromPairwise } from "@/lib/wishocracy-calculations";
import { BUDGET_CATEGORIES, BudgetCategoryId } from "@/lib/wishocracy-data";

interface ComparisonData {
  categoryA: string;
  categoryB: string;
  allocationA: number;
  allocationB: number;
  timestamp: string;
}

function isValidAllocationPair(allocationA: number, allocationB: number): boolean {
  const sum = allocationA + allocationB;
  const inRange =
    allocationA >= 0 &&
    allocationA <= 100 &&
    allocationB >= 0 &&
    allocationB <= 100;

  return inRange && (sum === 100 || sum === 0);
}

function normalizeComparison(comparison: ComparisonData): ComparisonData {
  if (comparison.categoryA <= comparison.categoryB) {
    return comparison;
  }

  return {
    ...comparison,
    categoryA: comparison.categoryB,
    categoryB: comparison.categoryA,
    allocationA: comparison.allocationB,
    allocationB: comparison.allocationA,
  };
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
      const allCategories = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[];
      await prisma.wishocraticCategorySelection.deleteMany({ where: { userId } });
      await prisma.wishocraticCategorySelection.createMany({
        data: allCategories.map((categoryId) => ({
          userId,
          categoryId,
          selected: selectedCategories.includes(categoryId),
        })),
      });
    }

    let syncedComparisons = 0;
    let finalAllocations: Record<string, number> = {};

    if (comparisons?.length) {
      for (const comparison of comparisons) {
        if (!isValidAllocationPair(comparison.allocationA, comparison.allocationB)) {
          return NextResponse.json(
            {
              error: `Invalid allocation: ${comparison.allocationA} + ${comparison.allocationB}`,
            },
            { status: 400 },
          );
        }
      }

      const normalizedComparisons = comparisons.map(normalizeComparison);
      finalAllocations = calculateAllocationsFromPairwise(normalizedComparisons);

      const createResult = await prisma.wishocraticAllocation.createMany({
        data: normalizedComparisons.map((comparison) => ({
          userId,
          categoryA: comparison.categoryA,
          categoryB: comparison.categoryB,
          allocationA: comparison.allocationA,
          allocationB: comparison.allocationB,
        })),
        skipDuplicates: true,
      });

      syncedComparisons = createResult.count;
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
