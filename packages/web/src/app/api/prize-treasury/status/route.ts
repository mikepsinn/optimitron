import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getProvider,
  getVoterPrizeTreasuryContract,
} from "@/lib/contracts/server-client";
import { serverEnv } from "@/lib/env";

/**
 * GET /api/prize-treasury/status
 *
 * Returns the current state of the Voter Prize Treasury:
 * - DB aggregates: deposits, point mints
 * - On-chain data: totalAssets (with yield), metrics, thresholds
 */
export async function GET() {
  try {
    const [deposits, pointMintsCount] = await Promise.all([
      prisma.prizeTreasuryDeposit.findMany({
        where: { deletedAt: null },
        select: { amount: true, depositorAddress: true },
      }),
      prisma.pointMint.count({
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
    const chainId = Number(serverEnv.EOP_CHAIN_ID ?? "84532");

    try {
      const provider = getProvider(chainId);
      const treasury = getVoterPrizeTreasuryContract(chainId, provider);

      const [
        totalAssets,
        healthMetric,
        incomeMetric,
        thresholdMet,
        maturityTimestamp,
        pointTotalSupplySnapshot,
        sharePrice,
        depositorCount,
      ] = await Promise.all([
        treasury.totalAssets() as Promise<bigint>,
        treasury.currentHealthMetric() as Promise<bigint>,
        treasury.currentIncomeMetric() as Promise<bigint>,
        treasury.thresholdMet() as Promise<boolean>,
        treasury.maturityTimestamp() as Promise<bigint>,
        treasury.pointTotalSupplySnapshot() as Promise<bigint>,
        treasury.sharePrice() as Promise<bigint>,
        treasury.depositorCount() as Promise<bigint>,
      ]);

      onChain = {
        totalAssets: totalAssets.toString(),
        healthMetric: healthMetric.toString(),
        incomeMetric: incomeMetric.toString(),
        thresholdMet,
        maturityTimestamp: maturityTimestamp.toString(),
        pointTotalSupplySnapshot: pointTotalSupplySnapshot.toString(),
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
      confirmedPointMints: pointMintsCount,
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
