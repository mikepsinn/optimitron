import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { createLogger } from "@/lib/logger";

const logger = createLogger("api/wishocracy/allocations");

function normalizeComparison(comparison: {
  categoryA: string;
  categoryB: string;
  allocationA: number;
  allocationB: number;
}) {
  if (comparison.categoryA <= comparison.categoryB) {
    return comparison;
  }

  return {
    categoryA: comparison.categoryB,
    categoryB: comparison.categoryA,
    allocationA: comparison.allocationB,
    allocationB: comparison.allocationA,
  };
}

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
      const [categoryA, categoryB] = [allocation.categoryA, allocation.categoryB].sort();
      const key = `${categoryA}_${categoryB}`;
      const existing = seen.get(key);
      if (!existing || allocation.updatedAt > existing.updatedAt) {
        seen.set(key, allocation);
      }
    }

    const allocations = Array.from(seen.values()).map((allocation) => {
      const [categoryA, categoryB] = [allocation.categoryA, allocation.categoryB].sort();
      const needsSwap = categoryA !== allocation.categoryA;

      return {
        categoryA,
        categoryB,
        allocationA: needsSwap ? allocation.allocationB : allocation.allocationA,
        allocationB: needsSwap ? allocation.allocationA : allocation.allocationB,
        timestamp: allocation.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ allocations });
  } catch (error) {
    logger.error("Failed to fetch allocations:", error);
    return NextResponse.json({ allocations: [] });
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
      const normalizedComparisons = updatedComparisons.map(normalizeComparison);

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
