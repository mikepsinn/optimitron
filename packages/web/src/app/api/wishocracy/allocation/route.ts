import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

function isValidAllocationPair(allocationA: number, allocationB: number): boolean {
  const sum = allocationA + allocationB;
  const inRange =
    allocationA >= 0 &&
    allocationA <= 100 &&
    allocationB >= 0 &&
    allocationB <= 100;

  return inRange && (sum === 100 || sum === 0);
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    let { categoryA, categoryB, allocationA, allocationB } = body;

    if (!categoryA || !categoryB || allocationA === undefined || allocationB === undefined) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!isValidAllocationPair(allocationA, allocationB)) {
      return NextResponse.json(
        { error: "Allocations must stay between 0 and 100 and sum to either 100 or 0." },
        { status: 400 },
      );
    }

    if (categoryA > categoryB) {
      [categoryA, categoryB] = [categoryB, categoryA];
      [allocationA, allocationB] = [allocationB, allocationA];
    }

    const existing = await prisma.wishocraticAllocation.findFirst({
      where: { userId, categoryA, categoryB },
    });

    if (existing) {
      await prisma.wishocraticAllocation.update({
        where: { id: existing.id },
        data: { allocationA, allocationB },
      });
    } else {
      await prisma.wishocraticAllocation.create({
        data: { userId, categoryA, categoryB, allocationA, allocationB },
      });
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
