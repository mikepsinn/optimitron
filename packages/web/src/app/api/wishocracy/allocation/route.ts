import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  isValidWishocraticComparison,
  normalizeWishocraticComparison,
} from "@/lib/wishocracy-community";

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
