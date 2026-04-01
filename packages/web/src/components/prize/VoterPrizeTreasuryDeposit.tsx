"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { parseUnits, formatUnits, type Address } from "viem";
import { baseSepolia } from "wagmi/chains";
import { voterPrizeTreasuryAbi, voteTokenAbi } from "@optimitron/treasury-prize/abi";
import { getContracts } from "@optimitron/treasury-shared/addresses";

const USDC_DECIMALS = 6;
const PRESET_AMOUNTS = ["100", "500", "1,000", "5,000"];

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

function stripCommas(value: string): string {
  return value.replace(/,/g, "");
}

function formatUSDC(value: bigint): string {
  return Number(formatUnits(value, USDC_DECIMALS)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatVOTE(value: bigint): string {
  return Number(formatUnits(value, 18)).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function VoterPrizeTreasuryDeposit() {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<
    "idle" | "approving" | "depositing" | "claiming" | "redeeming"
  >("idle");

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const contracts = getContracts(chainId);
  const treasuryAddress = contracts?.voterPrizeTreasury;
  const usdcAddress = contracts?.usdc;
  const voteTokenAddress = contracts?.voteToken;
  const isDeployed =
    treasuryAddress &&
    treasuryAddress !== "0x0000000000000000000000000000000000000000";

  // --- Read treasury state ---

  const { data: totalAssets } = useReadContract({
    address: treasuryAddress as Address,
    abi: voterPrizeTreasuryAbi,
    functionName: "totalAssets",
    query: { enabled: !!isDeployed && isConnected },
  });

  const { data: depositorCount } = useReadContract({
    address: treasuryAddress as Address,
    abi: voterPrizeTreasuryAbi,
    functionName: "depositorCount",
    query: { enabled: !!isDeployed && isConnected },
  });

  const { data: maturityTs } = useReadContract({
    address: treasuryAddress as Address,
    abi: voterPrizeTreasuryAbi,
    functionName: "maturityTimestamp",
    query: { enabled: !!isDeployed && isConnected },
  });

  const { data: thresholdMet } = useReadContract({
    address: treasuryAddress as Address,
    abi: voterPrizeTreasuryAbi,
    functionName: "thresholdMet",
    query: { enabled: !!isDeployed && isConnected },
  });

  const { data: healthMetric } = useReadContract({
    address: treasuryAddress as Address,
    abi: voterPrizeTreasuryAbi,
    functionName: "currentHealthMetric",
    query: { enabled: !!isDeployed && isConnected },
  });

  const { data: incomeMetric } = useReadContract({
    address: treasuryAddress as Address,
    abi: voterPrizeTreasuryAbi,
    functionName: "currentIncomeMetric",
    query: { enabled: !!isDeployed && isConnected },
  });

  const { data: sharePrice } = useReadContract({
    address: treasuryAddress as Address,
    abi: voterPrizeTreasuryAbi,
    functionName: "sharePrice",
    query: { enabled: !!isDeployed && isConnected },
  });

  // --- Read user state ---

  const { data: userDeposit } = useReadContract({
    address: treasuryAddress as Address,
    abi: voterPrizeTreasuryAbi,
    functionName: "getBalance",
    args: address ? [address] : undefined,
    query: { enabled: !!isDeployed && isConnected && !!address },
  });

  const { data: prizeShares } = useReadContract({
    address: treasuryAddress as Address,
    abi: voterPrizeTreasuryAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!isDeployed && isConnected && !!address },
  });

  const { data: voteBalance } = useReadContract({
    address: voteTokenAddress as Address,
    abi: voteTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled:
        !!isDeployed &&
        isConnected &&
        !!address &&
        !!voteTokenAddress &&
        voteTokenAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  const { data: voteRedemptionPreview } = useReadContract({
    address: treasuryAddress as Address,
    abi: voterPrizeTreasuryAbi,
    functionName: "previewVoteRedemption",
    args: address ? [address] : undefined,
    query: { enabled: !!isDeployed && isConnected && !!address && !!thresholdMet },
  });

  const { data: usdcBalance } = useReadContract({
    address: usdcAddress as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!isDeployed && isConnected && !!address },
  });

  const { data: allowance } = useReadContract({
    address: usdcAddress as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && treasuryAddress ? [address, treasuryAddress] : undefined,
    query: { enabled: !!isDeployed && isConnected && !!address },
  });

  // --- Write: Approve USDC ---
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApproving,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveHash });

  // --- Write: Deposit ---
  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositing,
  } = useWriteContract();

  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } =
    useWaitForTransactionReceipt({ hash: depositHash });

  // --- Write: Claim Refund ---
  const {
    writeContract: writeClaim,
    data: claimHash,
    isPending: isClaiming,
  } = useWriteContract();

  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } =
    useWaitForTransactionReceipt({ hash: claimHash });

  // --- Write: Redeem VOTE tokens ---
  const {
    writeContract: writeRedeem,
    data: redeemHash,
    isPending: isRedeeming,
  } = useWriteContract();

  const { isLoading: isRedeemConfirming, isSuccess: isRedeemConfirmed } =
    useWaitForTransactionReceipt({ hash: redeemHash });

  // After approval, auto-deposit
  useEffect(() => {
    if (isApproveConfirmed && step === "approving" && treasuryAddress) {
      setStep("depositing");
      const parsedAmount = parseUnits(stripCommas(amount), USDC_DECIMALS);
      writeDeposit({
        address: treasuryAddress,
        abi: voterPrizeTreasuryAbi,
        functionName: "deposit",
        args: [parsedAmount],
      });
    }
  }, [isApproveConfirmed, step, amount, treasuryAddress, writeDeposit]);

  useEffect(() => {
    if (isDepositConfirmed) {
      // Track deposit for wish points before clearing amount
      if (depositHash && amount) {
        const depositUsd = Number(formatUnits(parseUnits(stripCommas(amount), USDC_DECIMALS), USDC_DECIMALS));
        fetch("/api/prize/deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: depositHash, depositUsd }),
        }).catch(() => {});
      }
      setStep("idle");
      setAmount("");
    }
  }, [isDepositConfirmed, depositHash, amount]);

  useEffect(() => {
    if (isClaimConfirmed) setStep("idle");
  }, [isClaimConfirmed]);

  useEffect(() => {
    if (isRedeemConfirmed) setStep("idle");
  }, [isRedeemConfirmed]);

  const parsedAmount = amount
    ? parseUnits(stripCommas(amount), USDC_DECIMALS)
    : 0n;
  const needsApproval =
    allowance !== undefined && parsedAmount > 0n && allowance < parsedAmount;

  function handleDeposit() {
    if (!treasuryAddress || !usdcAddress || parsedAmount === 0n) return;

    if (needsApproval) {
      setStep("approving");
      writeApprove({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [treasuryAddress, parsedAmount],
      });
    } else {
      setStep("depositing");
      writeDeposit({
        address: treasuryAddress,
        abi: voterPrizeTreasuryAbi,
        functionName: "deposit",
        args: [parsedAmount],
      });
    }
  }

  function handleClaimRefund() {
    if (!treasuryAddress) return;
    setStep("claiming");
    writeClaim({
      address: treasuryAddress,
      abi: voterPrizeTreasuryAbi,
      functionName: "claimRefund",
    });
  }

  function handleRedeemVotes() {
    if (!treasuryAddress) return;
    setStep("redeeming");
    writeRedeem({
      address: treasuryAddress,
      abi: voterPrizeTreasuryAbi,
      functionName: "redeemVoteTokens",
    });
  }

  const isBusy =
    isApproving ||
    isApproveConfirming ||
    isDepositing ||
    isDepositConfirming ||
    isClaiming ||
    isClaimConfirming ||
    isRedeeming ||
    isRedeemConfirming;

  const userSharesBigint = (prizeShares as bigint) ?? 0n;
  const hasDeposit = userSharesBigint > 0n;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isMatured = maturityTs ? now >= (maturityTs as bigint) : false;
  const canClaimRefund = isMatured && !thresholdMet && hasDeposit;

  const voteBalanceBigint = (voteBalance as bigint) ?? 0n;
  const hasVotes = voteBalanceBigint > 0n;
  const canRedeemVotes = thresholdMet && hasVotes;

  return (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <div className="border-4 border-primary bg-background p-6">
        <h3 className="font-black uppercase mb-3">
          Connect Wallet
        </h3>

        {!isConnected ? (
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground mb-4">
              Connect your wallet. Your deposit earns yield in the Earth Optimization Prize fund while
              it waits for your species to get its act together.
            </p>
            {connectors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    className="border-4 border-primary bg-brutal-pink px-4 py-2.5 text-sm font-black uppercase text-brutal-pink-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    {connector.name === "Injected"
                      ? "Browser Wallet (MetaMask)"
                      : connector.name}
                  </button>
                ))}
              </div>
            )}
            <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-3">
              <p className="text-xs font-bold">
                Need a wallet?{" "}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black underline hover:text-brutal-pink"
                >
                  Install MetaMask
                </a>{" "}
                — it takes about 30 seconds.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="text-xs font-black uppercase text-muted-foreground">
                  Connected
                </div>
                <code className="text-sm font-bold text-foreground break-all">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </code>
              </div>
              <div className="flex gap-2">
                {chainId !== baseSepolia.id && (
                  <button
                    onClick={() => switchChain({ chainId: baseSepolia.id })}
                    className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground px-3 py-1.5 text-xs font-black uppercase hover:bg-brutal-yellow/80 transition-colors"
                  >
                    Switch to Base Sepolia
                  </button>
                )}
                <button
                  onClick={() => disconnect()}
                  className="border-4 border-primary bg-background px-3 py-1.5 text-xs font-black uppercase hover:bg-brutal-red/20 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Balances */}
            <div className="grid gap-2 grid-cols-3">
              <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-2">
                <div className="text-[10px] font-black uppercase">
                  USDC Balance
                </div>
                <div className="text-sm font-black">
                  {usdcBalance !== undefined
                    ? `$${formatUSDC(usdcBalance as bigint)}`
                    : "\u2014"}
                </div>
              </div>
              <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-2">
                <div className="text-[10px] font-black uppercase">
                  Your Contribution
                </div>
                <div className="text-sm font-black">
                  {userDeposit !== undefined
                    ? `$${formatUSDC(userDeposit as bigint)}`
                    : "\u2014"}
                </div>
              </div>
              <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-2">
                <div className="text-[10px] font-black uppercase">
                  VOTE Points
                </div>
                <div className="text-sm font-black">
                  {voteBalance !== undefined
                    ? formatVOTE(voteBalance as bigint)
                    : "\u2014"}
                </div>
              </div>
            </div>

            {/* PRIZE share info */}
            {hasDeposit && (
              <div className="border-4 border-primary bg-green-50 p-2">
                <div className="text-[10px] font-black uppercase text-muted-foreground">
                  Your PRIZE Shares / USDC Value
                </div>
                <div className="text-sm font-black">
                  {formatUSDC(userSharesBigint)} PRIZE {"\u2192"} $
                  {userDeposit !== undefined
                    ? formatUSDC(userDeposit as bigint)
                    : "\u2014"}{" "}
                  <span className="text-[10px] text-muted-foreground">
                    (share price: $
                    {sharePrice !== undefined
                      ? formatUSDC(sharePrice as bigint)
                      : "1.00"}
                    )
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deposit Form */}
      <div className="border-4 border-primary bg-background p-6">
        <h3 className="font-black uppercase mb-3">
          Contribute to the Prize
        </h3>

        {!isDeployed && (
          <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-3 mb-4">
            <div className="text-xs font-black uppercase">
              Not Yet Deployed
            </div>
            <p className="text-xs font-bold mt-1">
              The prize contract has not been deployed to this network yet.
              Switch to Base Sepolia once contracts are live.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-3">
            <label className="text-xs font-black uppercase block mb-1">
              Amount (USDC)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="1000"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9.,]/g, ""))
                }
                className="flex-1 border-4 border-primary bg-background px-3 py-2 text-lg font-black focus:outline-none focus:border-brutal-pink"
                disabled={!isConnected || !isDeployed || isBusy}
              />
              <button
                onClick={handleDeposit}
                disabled={
                  !isConnected ||
                  !isDeployed ||
                  isBusy ||
                  !amount ||
                  parsedAmount === 0n
                }
                className="border-4 border-primary bg-brutal-pink px-4 py-2 text-sm font-black uppercase text-brutal-pink-foreground hover:bg-brutal-pink/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBusy
                  ? step === "approving"
                    ? "Approving..."
                    : "Depositing..."
                  : needsApproval
                    ? "Approve & Contribute"
                    : "Contribute"}
              </button>
            </div>
            {isDepositConfirmed && (
              <p className="text-xs font-black text-brutal-cyan mt-2">
                Contribution confirmed!{" "}
                <a href={`https://sepolia.basescan.org/tx/${depositHash}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  View transaction &rarr;
                </a>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className="flex-1 border-4 border-primary bg-background px-2 py-1.5 text-xs font-black uppercase hover:bg-brutal-yellow/20 transition-colors disabled:opacity-50"
                disabled={!isConnected || !isDeployed || isBusy}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Redeem VOTE Points (success path) */}
      {isDeployed && isConnected && canRedeemVotes && (
        <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-6">
          <h3 className="font-black uppercase mb-3">
            Redeem Your VOTE Points
          </h3>
          <p className="text-xs font-bold mb-4">
            Outcome thresholds have been met. Your VOTE points from verified
            referendum votes entitle you to a proportional share of the prize
            treasury.
          </p>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] font-black uppercase">
                Your VOTE Balance
              </div>
              <div className="text-lg font-black">
                {formatVOTE(voteBalanceBigint)} VOTE
              </div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase">
                Estimated Payout
              </div>
              <div className="text-lg font-black">
                $
                {voteRedemptionPreview !== undefined
                  ? formatUSDC(voteRedemptionPreview as bigint)
                  : "\u2014"}
              </div>
            </div>
            <button
              onClick={handleRedeemVotes}
              disabled={isBusy}
              className="border-4 border-primary bg-brutal-cyan px-6 py-2.5 text-sm font-black uppercase text-brutal-cyan-foreground hover:bg-brutal-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRedeeming || isRedeemConfirming
                ? "Redeeming..."
                : "Redeem VOTE"}
            </button>
          </div>
          {isRedeemConfirmed && (
            <p className="text-xs font-black text-green-700 mt-2">
              Redeemed!{" "}
              <a href={`https://sepolia.basescan.org/tx/${redeemHash}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                View transaction &rarr;
              </a>
            </p>
          )}
        </div>
      )}

      {/* Claim Refund (failure path) */}
      {isDeployed && isConnected && canClaimRefund && (
        <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-6">
          <h3 className="font-black uppercase mb-3">
            Claim Your Refund
          </h3>
          <p className="text-xs font-bold mb-4">
            The prize period has ended and outcome thresholds were not met.
            You can reclaim your full contribution plus all accrued interest.
          </p>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] font-black uppercase">
                Refund Amount
              </div>
              <div className="text-lg font-black">
                $
                {userDeposit !== undefined
                  ? formatUSDC(userDeposit as bigint)
                  : "\u2014"}
              </div>
            </div>
            <button
              onClick={handleClaimRefund}
              disabled={isBusy}
              className="border-4 border-primary bg-brutal-cyan px-6 py-2.5 text-sm font-black uppercase text-brutal-cyan-foreground hover:bg-brutal-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClaiming || isClaimConfirming
                ? "Claiming..."
                : "Claim Refund"}
            </button>
          </div>
          {isClaimConfirmed && (
            <p className="text-xs font-black text-green-700 mt-2">
              Refund claimed!{" "}
              <a href={`https://sepolia.basescan.org/tx/${claimHash}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                View transaction &rarr;
              </a>
            </p>
          )}
        </div>
      )}

      {/* Live Treasury Status */}
      {isDeployed && isConnected && (
        <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-6">
          <h3 className="font-black uppercase mb-3">
            Live Prize Status
          </h3>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <div className="border-4 border-primary bg-background p-2">
              <div className="text-[10px] font-black uppercase text-muted-foreground">
                Total Value Locked
              </div>
              <div className="text-sm font-black text-brutal-cyan">
                {totalAssets !== undefined
                  ? `$${formatUSDC(totalAssets as bigint)}`
                  : "\u2014"}
              </div>
            </div>
            <div className="border-4 border-primary bg-background p-2">
              <div className="text-[10px] font-black uppercase text-muted-foreground">
                Depositors
              </div>
              <div className="text-sm font-black">
                {depositorCount !== undefined
                  ? String(depositorCount)
                  : "\u2014"}
              </div>
            </div>
            <div className="border-4 border-primary bg-background p-2">
              <div className="text-[10px] font-black uppercase text-muted-foreground">
                Maturity Date
              </div>
              <div className="text-sm font-black">
                {maturityTs !== undefined
                  ? formatDate(maturityTs as bigint)
                  : "\u2014"}
              </div>
            </div>
            <div className="border-4 border-primary bg-background p-2">
              <div className="text-[10px] font-black uppercase text-muted-foreground">
                Threshold Status
              </div>
              <div className="text-sm font-black">
                {thresholdMet !== undefined
                  ? thresholdMet
                    ? "Met"
                    : "Not yet met"
                  : "\u2014"}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid gap-3 grid-cols-2 mt-3">
            <div className="border-4 border-primary bg-background p-2">
              <div className="text-[10px] font-black uppercase text-muted-foreground">
                Health Metric (bps)
              </div>
              <div className="text-sm font-black">
                {healthMetric !== undefined
                  ? String(healthMetric)
                  : "\u2014"}
                <span className="text-[10px] text-muted-foreground ml-1">
                  / 100 threshold
                </span>
              </div>
            </div>
            <div className="border-4 border-primary bg-background p-2">
              <div className="text-[10px] font-black uppercase text-muted-foreground">
                Income Metric (bps)
              </div>
              <div className="text-sm font-black">
                {incomeMetric !== undefined
                  ? String(incomeMetric)
                  : "\u2014"}
                <span className="text-[10px] text-muted-foreground ml-1">
                  / 50 threshold
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
