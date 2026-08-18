import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const body = (await request.json()) as {
      billId?: string;
      billTitle?: string;
      position?: string;
      reasoning?: string;
      cbaSnapshot?: string;
    };

    const { billId, billTitle, position, reasoning, cbaSnapshot } = body;

    if (!billId || !billTitle || !position) {
      return NextResponse.json(
        { error: "billId, billTitle, and position are required" },
        { status: 400 },
      );
    }

    if (!["YES", "NO", "ABSTAIN"].includes(position)) {
      return NextResponse.json(
        { error: "position must be YES, NO, or ABSTAIN" },
        { status: 400 },
      );
    }

    const vote = await prisma.citizenBillVote.upsert({
      where: {
        userId_billId: { userId, billId },
      },
      create: {
        userId,
        billId,
        billTitle,
        position: position as "YES" | "NO" | "ABSTAIN",
        reasoning: reasoning ?? null,
        cbaSnapshot: cbaSnapshot ?? null,
      },
      update: {
        billTitle,
        position: position as "YES" | "NO" | "ABSTAIN",
        reasoning: reasoning ?? null,
        cbaSnapshot: cbaSnapshot ?? null,
      },
    });

    return NextResponse.json({
      id: vote.id,
      shareIdentifier: vote.shareIdentifier,
      position: vote.position,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("civic/votes POST error:", err);
    return NextResponse.json(
      { error: "Failed to save vote" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const votes = await prisma.citizenBillVote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ votes });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("civic/votes GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 },
    );
  }
}
