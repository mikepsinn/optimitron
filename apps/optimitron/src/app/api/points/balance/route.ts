import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

/**
 * GET /api/points/balance
 *
 * Returns the authenticated user's point mint history
 * and total confirmed balance.
 */
export async function GET() {
  try {
    const { userId } = await requireAuth();

    const mints = await prisma.pointMint.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        referendumId: true,
        walletAddress: true,
        amount: true,
        txHash: true,
        chainId: true,
        status: true,
        createdAt: true,
        referendum: {
          select: { title: true, slug: true },
        },
      },
    });

    const confirmedMints = mints.filter((m) => m.status === "CONFIRMED");
    const totalPoints = confirmedMints.length;

    // Each confirmed mint = 1 EOP (1e18 wei)
    const totalBalance = confirmedMints
      .reduce((sum, m) => sum + BigInt(m.amount), 0n)
      .toString();

    return NextResponse.json({
      totalPoints,
      totalBalance,
      mints,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POINTS BALANCE] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch point balance" },
      { status: 500 },
    );
  }
}
