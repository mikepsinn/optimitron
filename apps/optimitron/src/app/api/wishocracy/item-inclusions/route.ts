import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { WISHOCRATIC_ITEMS, WishocraticItemId } from "@/lib/wishocracy-data";
import { ensureWishocraticItemsExist } from "@/lib/wishocracy-catalog.server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const { inclusions } = body as {
      inclusions: Array<{ itemId: WishocraticItemId; included: boolean }>;
    };

    if (!Array.isArray(inclusions)) {
      return NextResponse.json({ error: "Invalid inclusions format." }, { status: 400 });
    }

    const invalidItems = inclusions.filter(
      (entry) => !WISHOCRATIC_ITEMS[entry.itemId as WishocraticItemId],
    );

    if (invalidItems.length > 0) {
      return NextResponse.json({ error: "Invalid item IDs." }, { status: 400 });
    }

    await ensureWishocraticItemsExist(inclusions.map((entry) => entry.itemId));

    await Promise.all(
      inclusions.map((entry) =>
        prisma.wishocraticItemInclusion.upsert({
          where: {
            userId_itemId: {
              userId,
              itemId: entry.itemId,
            },
          },
          create: {
            userId,
            itemId: entry.itemId,
            included: entry.included,
          },
          update: {
            included: entry.included,
          },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Failed to save item inclusions:", error);
    return NextResponse.json({ error: "Failed to save item inclusions." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const inclusions = await prisma.wishocraticItemInclusion.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ inclusions });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ inclusions: [] }, { status: 401 });
    }

    console.error("Failed to fetch item inclusions:", error);
    return NextResponse.json({ error: "Failed to fetch item inclusions." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = await requireAuth();

    await prisma.wishocraticItemInclusion.deleteMany({
      where: { userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Failed to delete item inclusions:", error);
    return NextResponse.json({ error: "Failed to delete item inclusions." }, { status: 500 });
  }
}
