import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { requireAuth } from "@/lib/auth-utils";
import { grantWishes } from "@/lib/wishes.server";
import { checkBadgesAfterWish } from "@/lib/badges.server";
import {
  publishPrizeDepositHypercert,
  resolvePrizeDepositEvent,
} from "@/lib/prize-deposit-hypercert.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const { txHash, depositUsd: requestedDepositUsd } = body as {
      txHash: string;
      depositUsd: number;
    };

    if (!txHash || typeof txHash !== "string") {
      return NextResponse.json({ error: "txHash is required." }, { status: 400 });
    }
    if (!requestedDepositUsd || typeof requestedDepositUsd !== "number" || requestedDepositUsd <= 0) {
      return NextResponse.json({ error: "depositUsd must be a positive number." }, { status: 400 });
    }

    let resolvedDeposit = null;
    try {
      resolvedDeposit = await resolvePrizeDepositEvent(txHash);
    } catch (resolveError) {
      console.error("[PRIZE DEPOSIT] Failed to resolve on-chain deposit:", resolveError);
    }

    const canonicalDepositUsd = resolvedDeposit
      ? Number(ethers.formatUnits(BigInt(resolvedDeposit.amount), 6))
      : requestedDepositUsd;
    const wishAmount = resolvedDeposit
      ? Number(BigInt(resolvedDeposit.amount) / 100_000_000n)
      : Math.floor(requestedDepositUsd / 100);

    let wishesEarned = 0;
    if (wishAmount > 0) {
      try {
        const wishResult = await grantWishes({
          userId,
          reason: "PRIZE_DEPOSIT",
          amount: wishAmount,
          dedupeKey: "deposit-" + txHash,
          metadata: { txHash, depositUsd: canonicalDepositUsd },
        });
        if (wishResult) wishesEarned = wishResult.amount;
        void checkBadgesAfterWish(userId, "PRIZE_DEPOSIT");
      } catch (wishError) {
        console.error("[PRIZE DEPOSIT] Wish grant error:", wishError);
      }
    }

    if (resolvedDeposit) {
      try {
        await publishPrizeDepositHypercert(resolvedDeposit);
      } catch (publishError) {
        console.error("[PRIZE DEPOSIT] Hypercert publication error:", publishError);
      }
    }

    return NextResponse.json({ success: true, wishesEarned });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PRIZE DEPOSIT] Failed:", error);
    return NextResponse.json({ error: "Failed to record deposit wishes." }, { status: 500 });
  }
}
