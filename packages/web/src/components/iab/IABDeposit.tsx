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
import { sepolia } from "wagmi/chains";
import { iabVaultAbi } from "@optimitron/treasury-iab/abi";
import { getContracts } from "@optimitron/treasury-shared/addresses";

const USDC_DECIMALS = 6;
const PRESET_AMOUNTS = ["100", "500", "1,000", "5,000"];

/** Minimal ERC20 ABI for balanceOf + approve + allowance */
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

function formatAmount(value: string): string {
  return value.replace(/,/g, "");
}

function formatUSDC(value: bigint): string {
  return Number(formatUnits(value, USDC_DECIMALS)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function IABDeposit() {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<
    "idle" | "approving" | "depositing" | "claiming"
  >("idle");

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const contracts = getContracts(chainId);
  const vaultAddress = contracts?.iabVault;
  const usdcAddress = contracts?.usdc;
  const isDeployed =
    vaultAddress &&
    vaultAddress !== "0x0000000000000000000000000000000000000000";

  // --- Read vault state ---

  const { data: totalPoolValue } = useReadContract({
    address: vaultAddress as Address,
    abi: iabVaultAbi,
    functionName: "totalPoolValue",
    query: { enabled: !!isDeployed && isConnected },
  });

  const { data: depositorCount } = useReadContract({
    address: vaultAddress as Address,
    abi: iabVaultAbi,
    functionName: "depositorCount",
    query: { enabled: !!isDeployed && isConnected },
  });

  const { data: maturityTs } = useReadContract({
    address: vaultAddress as Address,
    abi: iabVaultAbi,
    functionName: "maturityTimestamp",
    query: { enabled: !!isDeployed && isConnected },
  });

  const { data: thresholdMet } = useReadContract({
    address: vaultAddress as Address,
    abi: iabVaultAbi,
    functionName: "thresholdMet",
    query: { enabled: !!isDeployed && isConnected },
  });

  const { data: fundsAllocated } = useReadContract({
    address: vaultAddress as Address,
    abi: iabVaultAbi,
    functionName: "fundsAllocated",
    query: { enabled: !!isDeployed && isConnected },
  });

  // --- Read user state ---

  const { data: userBalance } = useReadContract({
    address: vaultAddress as Address,
    abi: iabVaultAbi,
    functionName: "getBalance",
    args: address ? [address] : undefined,
    query: { enabled: !!isDeployed && isConnected && !!address },
  });

  const { data: iabShares } = useReadContract({
    address: vaultAddress as Address,
    abi: iabVaultAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!isDeployed && isConnected && !!address },
  });

  const { data: sharePrice } = useReadContract({
    address: vaultAddress as Address,
    abi: iabVaultAbi,
    functionName: "sharePrice",
    query: { enabled: !!isDeployed && isConnected },
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
    args: address && vaultAddress ? [address, vaultAddress] : undefined,
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

  // After approval, auto-deposit
  useEffect(() => {
    if (isApproveConfirmed && step === "approving" && vaultAddress) {
      setStep("depositing");
      const parsedAmount = parseUnits(formatAmount(amount), USDC_DECIMALS);
      writeDeposit({
        address: vaultAddress,
        abi: iabVaultAbi,
        functionName: "deposit",
        args: [parsedAmount],
      });
    }
  }, [isApproveConfirmed, step, amount, vaultAddress, writeDeposit]);

  // Reset after deposit
  useEffect(() => {
    if (isDepositConfirmed) {
      setStep("idle");
      setAmount("");
    }
  }, [isDepositConfirmed]);

  // Reset after claim
  useEffect(() => {
    if (isClaimConfirmed) {
      setStep("idle");
    }
  }, [isClaimConfirmed]);

  const parsedAmount = amount
    ? parseUnits(formatAmount(amount), USDC_DECIMALS)
    : 0n;
  const needsApproval =
    allowance !== undefined && parsedAmount > 0n && allowance < parsedAmount;

  function handleDeposit() {
    if (!vaultAddress || !usdcAddress || parsedAmount === 0n) return;

    if (needsApproval) {
      setStep("approving");
      writeApprove({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [vaultAddress, parsedAmount],
      });
    } else {
      setStep("depositing");
      writeDeposit({
        address: vaultAddress,
        abi: iabVaultAbi,
        functionName: "deposit",
        args: [parsedAmount],
      });
    }
  }

  function handleClaimRefund() {
    if (!vaultAddress) return;
    setStep("claiming");
    writeClaim({
      address: vaultAddress,
      abi: iabVaultAbi,
      functionName: "claimRefund",
    });
  }

  const isBusy =
    isApproving ||
    isApproveConfirming ||
    isDepositing ||
    isDepositConfirming ||
    isClaiming ||
    isClaimConfirming;

  const userSharesBigint = (iabShares as bigint) ?? 0n;
  const hasDeposit = userSharesBigint > 0n;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isMatured = maturityTs ? now >= (maturityTs as bigint) : false;
  const canClaimRefund = isMatured && !thresholdMet && hasDeposit;

  return (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <div className="border-4 border-primary bg-background p-6">
        <h3 className="font-black uppercase text-foreground mb-3">
          Connect Wallet
        </h3>

        {!isConnected ? (
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground mb-4">
              Connect your wallet to purchase Incentive Alignment Bonds with
              USDC. Your deposit earns yield in the Prize fund while it waits.
            </p>
            {connectors.length > 0 ? (
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
            ) : null}
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
                — it takes about 30 seconds. Then refresh this page and click
                &quot;Browser Wallet&quot; above.
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
                {chainId !== sepolia.id && (
                  <button
                    onClick={() => switchChain({ chainId: sepolia.id })}
                    className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground px-3 py-1.5 text-xs font-black uppercase hover:bg-brutal-yellow/80 transition-colors"
                  >
                    Switch to Sepolia
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
            <div className="grid gap-2 grid-cols-2">
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
                  Your Bond Value
                </div>
                <div className="text-sm font-black">
                  {userBalance !== undefined
                    ? `$${formatUSDC(userBalance as bigint)}`
                    : "\u2014"}
                </div>
              </div>
            </div>

            {/* IAB token info for existing depositor */}
            {hasDeposit && (
              <div className="border-4 border-primary bg-green-50 p-2">
                <div className="text-[10px] font-black uppercase text-muted-foreground">
                  Your IAB Tokens / USDC Value
                </div>
                <div className="text-sm font-black">
                  {formatUSDC(userSharesBigint)} IAB {"\u2192"}{" "}
                  ${userBalance !== undefined
                    ? formatUSDC(userBalance as bigint)
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
        <h3 className="font-black uppercase text-foreground mb-3">
          Buy Incentive Alignment Bond
        </h3>

        {!isDeployed && (
          <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-3 mb-4">
            <div className="text-xs font-black uppercase">
              Not Yet Deployed
            </div>
            <p className="text-xs font-bold mt-1">
              The IABVault contract has not been deployed to this network yet.
              Connect your wallet to Sepolia once contracts are live.
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
                    ? "Approve & Deposit"
                    : "Buy Bond"}
              </button>
            </div>
            {isDepositConfirmed && (
              <p className="text-xs font-black text-brutal-cyan mt-2">
                Bond purchased! Tx: {depositHash?.slice(0, 10)}...
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

      {/* Claim Refund (visible after maturity if thresholds not met) */}
      {isDeployed && isConnected && canClaimRefund && (
        <div className="border-4 border-primary bg-green-100 p-6">
          <h3 className="font-black uppercase text-foreground mb-3">
            Claim Your Refund
          </h3>
          <p className="text-xs font-bold text-muted-foreground mb-4">
            The bond has matured and thresholds were not met. You can reclaim
            your principal plus all accrued yield.
          </p>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] font-black uppercase text-muted-foreground">
                Refund Amount
              </div>
              <div className="text-lg font-black text-green-700">
                ${userBalance !== undefined
                  ? formatUSDC(userBalance as bigint)
                  : "\u2014"}
              </div>
            </div>
            <button
              onClick={handleClaimRefund}
              disabled={isBusy}
              className="border-4 border-primary bg-brutal-cyan px-6 py-2.5 text-sm font-black uppercase text-brutal-cyan-foreground hover:bg-brutal-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClaiming || isClaimConfirming ? "Claiming..." : "Claim Refund"}
            </button>
          </div>
          {isClaimConfirmed && (
            <p className="text-xs font-black text-green-700 mt-2">
              Refund claimed! Tx: {claimHash?.slice(0, 10)}...
            </p>
          )}
        </div>
      )}

      {/* Live Pool Status */}
      {isDeployed && isConnected && (
        <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-6">
          <h3 className="font-black uppercase mb-3">
            Live Vault Status
          </h3>
          <div className="grid gap-3 grid-cols-2">
            <div className="border-4 border-primary bg-background p-2">
              <div className="text-[10px] font-black uppercase text-muted-foreground">
                Pool Value
              </div>
              <div className="text-sm font-black text-brutal-cyan">
                {totalPoolValue !== undefined
                  ? `$${formatUSDC(totalPoolValue as bigint)}`
                  : "\u2014"}
              </div>
            </div>
            <div className="border-4 border-primary bg-background p-2">
              <div className="text-[10px] font-black uppercase text-muted-foreground">
                Bond Holders
              </div>
              <div className="text-sm font-black">
                {depositorCount !== undefined ? String(depositorCount) : "\u2014"}
              </div>
            </div>
          </div>

          {/* Maturity & threshold status */}
          <div className="grid gap-3 grid-cols-2 mt-3">
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
                    ? fundsAllocated
                      ? "Met & Allocated"
                      : "Met (pending allocation)"
                    : "Not yet met"
                  : "\u2014"}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
