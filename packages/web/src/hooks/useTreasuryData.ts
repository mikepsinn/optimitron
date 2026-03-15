"use client";

import { useAccount, useChainId, useReadContract } from "wagmi";
import { type Address, formatUnits } from "viem";
import { getContracts } from "@/lib/contracts/addresses";
import { alignmentTreasuryAbi } from "@/lib/contracts/alignment-treasury-abi";
import { wishTokenAbi } from "@/lib/contracts/wish-token-abi";

const WISH_DECIMALS = 18;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/** Illustrative demo data when contracts aren't deployed yet */
const DEMO_DATA = {
  treasuryBalance: 42_000_000n * 10n ** 18n,
  citizenCount: 1_247n,
  politicianCount: 6n,
  ubiAllocationBps: 5000n,
  totalAlignmentScore: 38_420n,
  totalSupply: 750_000_000n * 10n ** 18n,
  maxSupply: 1_000_000_000n * 10n ** 18n,
  taxRateBps: 100n,
  wishBalance: 0n,
  isRegisteredCitizen: false,
} as const;

export function formatWish(value: bigint): string {
  return Number(formatUnits(value, WISH_DECIMALS)).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

export function useTreasuryData() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContracts(chainId);

  const treasuryAddress = contracts?.alignmentTreasury;
  const tokenAddress = contracts?.wishToken;

  const isDeployed =
    !!treasuryAddress &&
    treasuryAddress !== ZERO_ADDRESS &&
    !!tokenAddress &&
    tokenAddress !== ZERO_ADDRESS;

  const enabled = isDeployed && isConnected;

  // --- Treasury reads ---

  const { data: treasuryBalance } = useReadContract({
    address: treasuryAddress as Address,
    abi: alignmentTreasuryAbi,
    functionName: "treasuryBalance",
    query: { enabled },
  });

  const { data: citizenCount } = useReadContract({
    address: treasuryAddress as Address,
    abi: alignmentTreasuryAbi,
    functionName: "citizenCount",
    query: { enabled },
  });

  const { data: politicianCount } = useReadContract({
    address: treasuryAddress as Address,
    abi: alignmentTreasuryAbi,
    functionName: "politicianCount",
    query: { enabled },
  });

  const { data: ubiAllocationBps } = useReadContract({
    address: treasuryAddress as Address,
    abi: alignmentTreasuryAbi,
    functionName: "ubiAllocationBps",
    query: { enabled },
  });

  const { data: totalAlignmentScore } = useReadContract({
    address: treasuryAddress as Address,
    abi: alignmentTreasuryAbi,
    functionName: "totalAlignmentScore",
    query: { enabled },
  });

  const { data: isRegisteredCitizen } = useReadContract({
    address: treasuryAddress as Address,
    abi: alignmentTreasuryAbi,
    functionName: "isRegisteredCitizen",
    args: address ? [address] : undefined,
    query: { enabled: enabled && !!address },
  });

  // --- Token reads ---

  const { data: totalSupply } = useReadContract({
    address: tokenAddress as Address,
    abi: wishTokenAbi,
    functionName: "totalSupply",
    query: { enabled },
  });

  const { data: maxSupply } = useReadContract({
    address: tokenAddress as Address,
    abi: wishTokenAbi,
    functionName: "maxSupply",
    query: { enabled },
  });

  const { data: taxRateBps } = useReadContract({
    address: tokenAddress as Address,
    abi: wishTokenAbi,
    functionName: "taxRateBps",
    query: { enabled },
  });

  const { data: wishBalance } = useReadContract({
    address: tokenAddress as Address,
    abi: wishTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: enabled && !!address },
  });

  // When not deployed, return demo data
  const isDemo = !isDeployed;

  return {
    // Global treasury
    treasuryBalance: (isDemo ? DEMO_DATA.treasuryBalance : treasuryBalance as bigint | undefined) ?? 0n,
    citizenCount: (isDemo ? DEMO_DATA.citizenCount : citizenCount as bigint | undefined) ?? 0n,
    politicianCount: (isDemo ? DEMO_DATA.politicianCount : politicianCount as bigint | undefined) ?? 0n,
    ubiAllocationBps: (isDemo ? DEMO_DATA.ubiAllocationBps : ubiAllocationBps as bigint | undefined) ?? 0n,
    totalAlignmentScore: (isDemo ? DEMO_DATA.totalAlignmentScore : totalAlignmentScore as bigint | undefined) ?? 0n,

    // Token
    totalSupply: (isDemo ? DEMO_DATA.totalSupply : totalSupply as bigint | undefined) ?? 0n,
    maxSupply: (isDemo ? DEMO_DATA.maxSupply : maxSupply as bigint | undefined) ?? 0n,
    taxRateBps: (isDemo ? DEMO_DATA.taxRateBps : taxRateBps as bigint | undefined) ?? 0n,

    // User
    wishBalance: (isDemo ? DEMO_DATA.wishBalance : wishBalance as bigint | undefined) ?? 0n,
    isRegisteredCitizen: isDemo ? DEMO_DATA.isRegisteredCitizen : (isRegisteredCitizen as boolean | undefined) ?? false,

    // Meta
    isDeployed,
    isDemo,
    isConnected,
    address,
    treasuryAddress,
    tokenAddress,
  };
}
