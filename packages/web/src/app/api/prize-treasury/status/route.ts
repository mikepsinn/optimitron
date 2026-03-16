import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getProvider,
  getVoterPrizeTreasuryContract,
} from "@/lib/contracts/server-client";

/**
 * GET /api/prize-treasury/status
 *
 * Returns the current state of the Voter Prize Treasury:
 * - DB aggregates: deposits, vote mints
 * - On-chain data: totalAssets (with yield), metrics, thresholds
 */
export async function GET() {
  try {
    const [deposits, voteMintsCount] = await Promise.all([
      prisma.prizeTreasuryDeposit.findMany({
        where: { deletedAt: null },
        select: { amount: true, depositorAddress: true },
      }),
      prisma.voteTokenMint.count({
        where: { status: "CONFIRMED", deletedAt: null },
      }),
    ]);

    const totalDeposited = deposits
      .reduce((sum, d) => sum + BigInt(d.amount), 0n)
      .toString();

    const uniqueDepositors = new Set(deposits.map((d) => d.depositorAddress))
      .size;

    // Fetch on-chain data if contract is deployed
    let onChain: Record<string, unknown> | null = null;
    const chainId = Number(process.env.VOTE_TOKEN_CHAIN_ID ?? "84532");

    try {
      const provider = getProvider(chainId);
      const treasury = getVoterPrizeTreasuryContract(chainId, provider);

      const [
        totalAssets,
        healthMetric,
        incomeMetric,
        thresholdMet,
        maturityTimestamp,
        voteTotalSupplySnapshot,
        sharePrice,
        depositorCount,
      ] = await Promise.all([
        treasury.totalAssets() as Promise<bigint>,
        treasury.currentHealthMetric() as Promise<bigint>,
        treasury.currentIncomeMetric() as Promise<bigint>,
        treasury.thresholdMet() as Promise<boolean>,
        treasury.maturityTimestamp() as Promise<bigint>,
        treasury.voteTotalSupplySnapshot() as Promise<bigint>,
        treasury.sharePrice() as Promise<bigint>,
        treasury.depositorCount() as Promise<bigint>,
      ]);

      onChain = {
        totalAssets: totalAssets.toString(),
        healthMetric: healthMetric.toString(),
        incomeMetric: incomeMetric.toString(),
        thresholdMet,
        maturityTimestamp: maturityTimestamp.toString(),
        voteTotalSupplySnapshot: voteTotalSupplySnapshot.toString(),
        sharePrice: sharePrice.toString(),
        onChainDepositorCount: depositorCount.toString(),
      };
    } catch {
      // Contract not deployed or not reachable — return DB-only data
    }

    return NextResponse.json({
      totalDeposited,
      depositCount: deposits.length,
      uniqueDepositors,
      confirmedVoteMints: voteMintsCount,
      ...onChain,
    });
  } catch (error) {
    console.error("[PRIZE TREASURY STATUS] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prize treasury status" },
      { status: 500 },
    );
  }
}
