import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/prisma";
import { ethers } from "ethers";
import {
  getMinterWallet,
  getEarthOptimizationPointContract,
} from "@/lib/contracts/server-client";
import { serverEnv } from "@/lib/env";
import { syncPendingReferralPointMints } from "@/lib/referral-point-mint.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BATCH_SIZE = 200;

/**
 * Batch minting cron job for Earth Optimization Points.
 *
 * 1. Backfills referral-based point-mint rows for newly eligible rewards
 * 2. Fetches all PENDING point-mint records
 * 3. Groups into batches of ~200
 * 4. Calls EarthOptimizationPoint.batchMintForVoters() on-chain
 * 5. Updates status to SUBMITTED → CONFIRMED on tx confirmation
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let syncedReferralMints = 0;
    try {
      syncedReferralMints = (await syncPendingReferralPointMints(BATCH_SIZE))
        .length;
    } catch (syncError) {
      console.error("[POINT MINT CRON] Referral sync error:", syncError);
    }

    const pendingMints = await prisma.pointMint.findMany({
      where: { status: "PENDING", deletedAt: null },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    if (pendingMints.length === 0) {
      return NextResponse.json({
        processed: 0,
        syncedReferralMints,
        message: "No pending mints",
      });
    }

    const ids = pendingMints.map((m) => m.id);

    // Mark as SUBMITTED before on-chain call
    await prisma.pointMint.updateMany({
      where: { id: { in: ids } },
      data: { status: "SUBMITTED" },
    });

    const chainId = Number(serverEnv.EOP_CHAIN_ID ?? "84532");
    let txHash: string | null = null;

    try {
      const signer = getMinterWallet(chainId);
      const pointToken = getEarthOptimizationPointContract(chainId, signer);

      const voters = pendingMints.map((m) => m.walletAddress);
      const referendumIds = pendingMints.map((m) =>
        ethers.keccak256(ethers.toUtf8Bytes(m.referendumId)),
      );
      const nullifierHashes = pendingMints.map((m) =>
        ethers.keccak256(ethers.toUtf8Bytes(m.nullifierHash)),
      );
      const amounts = pendingMints.map((m) => m.amount);

      const tx = await pointToken.batchMintForVoters(
        voters,
        referendumIds,
        nullifierHashes,
        amounts,
      );
      const receipt = await tx.wait();
      txHash = receipt.hash;

      // Mark as CONFIRMED with tx hash
      await prisma.pointMint.updateMany({
        where: { id: { in: ids } },
        data: { status: "CONFIRMED", txHash },
      });
    } catch (onChainError) {
      console.error("[POINT MINT CRON] On-chain error:", onChainError);

      // Revert to FAILED so they can be retried
      await prisma.pointMint.updateMany({
        where: { id: { in: ids } },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        {
          error: "On-chain minting failed",
          processed: 0,
          failedIds: ids,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      processed: pendingMints.length,
      syncedReferralMints,
      ids,
      txHash,
    });
  } catch (error) {
    console.error("[POINT MINT CRON] Error:", error);
    return NextResponse.json(
      { error: "Failed to process point mints" },
      { status: 500 },
    );
  }
}
