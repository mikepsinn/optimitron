import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, hardhat } from "viem/chains";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getContracts } from "@optimitron/treasury-shared/addresses";
import { ubiDistributorAbi } from "@optimitron/treasury-wish/abi";

export const runtime = "nodejs";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function getChain() {
  const chainId = Number(process.env.TREASURY_CHAIN_ID ?? "11155111");
  return chainId === 31337 ? hardhat : sepolia;
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();

    const body = (await request.json()) as { walletAddress?: string };
    const walletAddress = body.walletAddress;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address." },
        { status: 400 },
      );
    }

    // Check World ID verification
    const verification = await prisma.personhoodVerification.findFirst({
      where: {
        userId,
        provider: "WORLD_ID",
        status: "VERIFIED",
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "World ID verification required before registering for UBI." },
        { status: 403 },
      );
    }

    // Get UBI distributor owner private key
    const ownerKey = process.env.TREASURY_OWNER_PRIVATE_KEY;
    if (!ownerKey) {
      return NextResponse.json(
        { error: "UBI distributor not configured. Contact admin." },
        { status: 503 },
      );
    }

    const chain = getChain();
    const contracts = getContracts(chain.id);
    const ubiDistributorAddress = contracts?.ubiDistributor;

    if (!ubiDistributorAddress || ubiDistributorAddress === ZERO_ADDRESS) {
      return NextResponse.json(
        { error: "UBI distributor contract not deployed on this network." },
        { status: 503 },
      );
    }

    // Convert nullifier hash (externalId from World ID) to bytes32
    const nullifierHash = verification.externalId as `0x${string}`;

    const account = privateKeyToAccount(ownerKey as `0x${string}`);
    const rpcUrl = process.env.TREASURY_RPC_URL ?? chain.rpcUrls.default.http[0];

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    // Call registerForUBI on the UBI distributor contract
    const hash = await walletClient.writeContract({
      address: ubiDistributorAddress as Address,
      abi: ubiDistributorAbi,
      functionName: "registerForUBI",
      args: [walletAddress as Address, nullifierHash],
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash });

    return NextResponse.json({ success: true, txHash: hash });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "UBI registration failed.";
    console.error("[UBI REGISTER] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
