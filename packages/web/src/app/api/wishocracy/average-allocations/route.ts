import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateAllocationsFromPairwise } from "@/lib/wishocracy-calculations";
import { BUDGET_CATEGORIES, BudgetCategoryId } from "@/lib/wishocracy-data";

export async function GET() {
  try {
    const allAllocations = await prisma.wishocraticAllocation.findMany({
      select: {
        userId: true,
        categoryA: true,
        categoryB: true,
        allocationA: true,
        allocationB: true,
      },
    });

    if (allAllocations.length === 0) {
      const emptyAllocations: Record<BudgetCategoryId, number> = {} as Record<
        BudgetCategoryId,
        number
      >;

      Object.keys(BUDGET_CATEGORIES).forEach((categoryId) => {
        emptyAllocations[categoryId as BudgetCategoryId] = 0;
      });

      return NextResponse.json({
        averageAllocations: emptyAllocations,
        totalUsers: 0,
      });
    }

    const allocationsByUser = new Map<string, typeof allAllocations>();
    for (const allocation of allAllocations) {
      if (!allocationsByUser.has(allocation.userId)) {
        allocationsByUser.set(allocation.userId, []);
      }
      allocationsByUser.get(allocation.userId)!.push(allocation);
    }

    const userAllocations: Array<Record<string, number>> = [];
    for (const comparisons of allocationsByUser.values()) {
      userAllocations.push(calculateAllocationsFromPairwise(comparisons));
    }

    const categoryTotals: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    for (const userAllocation of userAllocations) {
      for (const [categoryId, percentage] of Object.entries(userAllocation)) {
        categoryTotals[categoryId] = (categoryTotals[categoryId] || 0) + percentage;
        categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
      }
    }

    const averageAllocations: Record<BudgetCategoryId, number> = {} as Record<
      BudgetCategoryId,
      number
    >;
    for (const categoryId of Object.keys(BUDGET_CATEGORIES)) {
      averageAllocations[categoryId as BudgetCategoryId] =
        (categoryTotals[categoryId] || 0) / (categoryCounts[categoryId] || 1);
    }

    return NextResponse.json({
      averageAllocations,
      totalUsers: allocationsByUser.size,
    });
  } catch (error) {
    console.error("Failed to calculate average allocations:", error);
    return NextResponse.json(
      { error: "Failed to fetch average allocations." },
      { status: 500 },
    );
  }
}
