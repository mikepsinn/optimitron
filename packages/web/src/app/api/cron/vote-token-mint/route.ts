import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/prisma";
import { ethers } from "ethers";
import {
  getMinterWallet,
  getVoteTokenContract,
} from "@/lib/contracts/server-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BATCH_SIZE = 200;

/**
 * Batch minting cron job for VOTE tokens.
 *
 * 1. Fetches all PENDING VoteTokenMint records
 * 2. Groups into batches of ~200
 * 3. Calls VoteToken.batchMintForVoters() on-chain
 * 4. Updates status to SUBMITTED → CONFIRMED on tx confirmation
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pendingMints = await prisma.voteTokenMint.findMany({
      where: { status: "PENDING", deletedAt: null },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    if (pendingMints.length === 0) {
      return NextResponse.json({ processed: 0, message: "No pending mints" });
    }

    const ids = pendingMints.map((m) => m.id);

    // Mark as SUBMITTED before on-chain call
    await prisma.voteTokenMint.updateMany({
      where: { id: { in: ids } },
      data: { status: "SUBMITTED" },
    });

    const chainId = Number(process.env.VOTE_TOKEN_CHAIN_ID ?? "84532");
    let txHash: string | null = null;

    try {
      const signer = getMinterWallet(chainId);
      const voteToken = getVoteTokenContract(chainId, signer);

      const voters = pendingMints.map((m) => m.walletAddress);
      const referendumIds = pendingMints.map((m) =>
        ethers.keccak256(ethers.toUtf8Bytes(m.referendumId)),
      );
      const nullifierHashes = pendingMints.map((m) =>
        ethers.keccak256(ethers.toUtf8Bytes(m.nullifierHash)),
      );
      const amounts = pendingMints.map((m) => m.amount);

      const tx = await voteToken.batchMintForVoters(
        voters,
        referendumIds,
        nullifierHashes,
        amounts,
      );
      const receipt = await tx.wait();
      txHash = receipt.hash;

      // Mark as CONFIRMED with tx hash
      await prisma.voteTokenMint.updateMany({
        where: { id: { in: ids } },
        data: { status: "CONFIRMED", txHash },
      });
    } catch (onChainError) {
      console.error("[VOTE TOKEN MINT CRON] On-chain error:", onChainError);

      // Revert to FAILED so they can be retried
      await prisma.voteTokenMint.updateMany({
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
      ids,
      txHash,
    });
  } catch (error) {
    console.error("[VOTE TOKEN MINT CRON] Error:", error);
    return NextResponse.json(
      { error: "Failed to process vote token mints" },
      { status: 500 },
    );
  }
}
