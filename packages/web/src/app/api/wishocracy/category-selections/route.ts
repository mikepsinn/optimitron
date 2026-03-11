import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { BUDGET_CATEGORIES, BudgetCategoryId } from "@/lib/wishocracy-data";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const { selections } = body as {
      selections: Array<{ categoryId: BudgetCategoryId; selected: boolean }>;
    };

    if (!Array.isArray(selections)) {
      return NextResponse.json({ error: "Invalid selections format." }, { status: 400 });
    }

    const invalidSelections = selections.filter(
      (selection) => !BUDGET_CATEGORIES[selection.categoryId as BudgetCategoryId],
    );

    if (invalidSelections.length > 0) {
      return NextResponse.json({ error: "Invalid category IDs." }, { status: 400 });
    }

    await Promise.all(
      selections.map((selection) =>
        prisma.wishocraticCategorySelection.upsert({
          where: {
            userId_categoryId: {
              userId,
              categoryId: selection.categoryId,
            },
          },
          create: {
            userId,
            categoryId: selection.categoryId,
            selected: selection.selected,
          },
          update: {
            selected: selection.selected,
          },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Failed to save category selections:", error);
    return NextResponse.json({ error: "Failed to save category selections." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const selections = await prisma.wishocraticCategorySelection.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ selections });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ selections: [] }, { status: 401 });
    }

    console.error("Failed to fetch category selections:", error);
    return NextResponse.json({ error: "Failed to fetch category selections." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = await requireAuth();

    await prisma.wishocraticCategorySelection.deleteMany({
      where: { userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Failed to delete category selections:", error);
    return NextResponse.json({ error: "Failed to delete category selections." }, { status: 500 });
  }
}
