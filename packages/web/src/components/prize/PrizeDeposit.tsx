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
import { parseEther, formatEther, type Address } from "viem";
import { sepolia } from "wagmi/chains";
import { prizePoolAbi } from "@/lib/contracts/prize-pool-abi";
import { wishTokenAbi } from "@/lib/contracts/wish-token-abi";
import { getContracts } from "@/lib/contracts/addresses";

const PRESET_AMOUNTS = ["100", "500", "1,000", "5,000"];

function formatAmount(value: string): string {
  return value.replace(/,/g, "");
}

export function PrizeDeposit() {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"idle" | "approving" | "depositing">("idle");

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const contracts = getContracts(chainId);
  const prizePoolAddress = contracts?.prizePool;
  const wishTokenAddress = contracts?.wishToken;
  const isDeployed =
    prizePoolAddress && prizePoolAddress !== "0x0000000000000000000000000000000000000000";

  // Read pool status
  const { data: poolStatus } = useReadContract({
    address: prizePoolAddress as Address,
    abi: prizePoolAbi,
    functionName: "status",
    query: { enabled: !!isDeployed && isConnected },
  });

  // Read total deposits
  const { data: totalDeposits } = useReadContract({
    address: prizePoolAddress as Address,
    abi: prizePoolAbi,
    functionName: "totalDeposits",
    query: { enabled: !!isDeployed && isConnected },
  });

  // Read donor count
  const { data: donorCount } = useReadContract({
    address: prizePoolAddress as Address,
    abi: prizePoolAbi,
    functionName: "donorCount",
    query: { enabled: !!isDeployed && isConnected },
  });

  // Read user's deposit
  const { data: userDeposit } = useReadContract({
    address: prizePoolAddress as Address,
    abi: prizePoolAbi,
    functionName: "donorDeposit",
    args: address ? [address] : undefined,
    query: { enabled: !!isDeployed && isConnected && !!address },
  });

  // Read user's $WISH balance
  const { data: wishBalance } = useReadContract({
    address: wishTokenAddress as Address,
    abi: wishTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!isDeployed && isConnected && !!address },
  });

  // Read user's allowance for PrizePool
  const { data: allowance } = useReadContract({
    address: wishTokenAddress as Address,
    abi: wishTokenAbi,
    functionName: "allowance",
    args: address && prizePoolAddress ? [address, prizePoolAddress] : undefined,
    query: { enabled: !!isDeployed && isConnected && !!address },
  });

  // Approve transaction
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApproving,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveHash });

  // Deposit transaction
  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositing,
  } = useWriteContract();

  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } =
    useWaitForTransactionReceipt({ hash: depositHash });

  // After approval confirmed, proceed to deposit
  useEffect(() => {
    if (isApproveConfirmed && step === "approving" && prizePoolAddress) {
      setStep("depositing");
      const parsedAmount = parseEther(formatAmount(amount));
      writeDeposit({
        address: prizePoolAddress,
        abi: prizePoolAbi,
        functionName: "deposit",
        args: [parsedAmount],
      });
    }
  }, [isApproveConfirmed, step, amount, prizePoolAddress, writeDeposit]);

  // Reset after deposit confirmed
  useEffect(() => {
    if (isDepositConfirmed) {
      setStep("idle");
      setAmount("");
    }
  }, [isDepositConfirmed]);

  const parsedAmount = amount ? parseEther(formatAmount(amount)) : 0n;
  const needsApproval = allowance !== undefined && parsedAmount > 0n && allowance < parsedAmount;

  function handleDeposit() {
    if (!prizePoolAddress || !wishTokenAddress || parsedAmount === 0n) return;

    if (needsApproval) {
      setStep("approving");
      writeApprove({
        address: wishTokenAddress,
        abi: wishTokenAbi,
        functionName: "approve",
        args: [prizePoolAddress, parsedAmount],
      });
    } else {
      setStep("depositing");
      writeDeposit({
        address: prizePoolAddress,
        abi: prizePoolAbi,
        functionName: "deposit",
        args: [parsedAmount],
      });
    }
  }

  const isBusy = isApproving || isApproveConfirming || isDepositing || isDepositConfirming;
  const statusLabels = ["Open", "Locked", "Allocating", "Distributed"];

  return (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <div className="border-4 border-black bg-white p-6">
        <h3 className="font-black uppercase text-black mb-3">
          Connect Wallet
        </h3>

        {!isConnected ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-black/60 mb-4">
              Connect your wallet to deposit $WISH into the PrizePool contract.
              You can withdraw any time before the pool locks.
            </p>
            <div className="flex flex-wrap gap-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  className="border-2 border-black bg-pink-500 px-4 py-2.5 text-sm font-black uppercase text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  {connector.name === "Injected" ? "Browser Wallet" : connector.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="text-xs font-black uppercase text-black/50">
                  Connected
                </div>
                <code className="text-sm font-bold text-black break-all">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </code>
              </div>
              <div className="flex gap-2">
                {chainId !== sepolia.id && (
                  <button
                    onClick={() => switchChain({ chainId: sepolia.id })}
                    className="border-2 border-black bg-yellow-200 px-3 py-1.5 text-xs font-black uppercase hover:bg-yellow-300 transition-colors"
                  >
                    Switch to Sepolia
                  </button>
                )}
                <button
                  onClick={() => disconnect()}
                  className="border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase hover:bg-red-100 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Balances */}
            <div className="grid gap-2 grid-cols-2">
              <div className="border-2 border-black bg-cyan-50 p-2">
                <div className="text-[10px] font-black uppercase text-black/50">
                  $WISH Balance
                </div>
                <div className="text-sm font-black">
                  {wishBalance !== undefined
                    ? formatEther(wishBalance as bigint)
                    : "—"}
                </div>
              </div>
              <div className="border-2 border-black bg-emerald-50 p-2">
                <div className="text-[10px] font-black uppercase text-black/50">
                  Your Deposit
                </div>
                <div className="text-sm font-black">
                  {userDeposit !== undefined
                    ? formatEther(userDeposit as bigint)
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deposit Form */}
      <div className="border-4 border-black bg-white p-6">
        <h3 className="font-black uppercase text-black mb-3">
          Deposit $WISH Tokens
        </h3>

        {!isDeployed && (
          <div className="border-2 border-black bg-yellow-100 p-3 mb-4">
            <div className="text-xs font-black uppercase text-black/60">
              Not Yet Deployed
            </div>
            <p className="text-xs font-medium text-black/50 mt-1">
              The PrizePool contract has not been deployed to this network yet.
              Connect your wallet to Sepolia once contracts are live.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="border-2 border-black bg-yellow-100 p-3">
            <label className="text-xs font-black uppercase text-black/60 block mb-1">
              Amount ($WISH)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                className="flex-1 border-2 border-black bg-white px-3 py-2 text-lg font-black focus:outline-none focus:border-pink-500"
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
                className="border-2 border-black bg-pink-500 px-4 py-2 text-sm font-black uppercase text-white hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBusy
                  ? step === "approving"
                    ? "Approving..."
                    : "Depositing..."
                  : needsApproval
                    ? "Approve & Deposit"
                    : "Deposit"}
              </button>
            </div>
            {isDepositConfirmed && (
              <p className="text-xs font-black text-emerald-600 mt-2">
                Deposit confirmed! Transaction: {depositHash?.slice(0, 10)}...
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className="flex-1 border-2 border-black bg-white px-2 py-1.5 text-xs font-black uppercase hover:bg-yellow-100 transition-colors disabled:opacity-50"
                disabled={!isConnected || !isDeployed || isBusy}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Pool Status */}
      {isDeployed && isConnected && (
        <div className="border-4 border-black bg-emerald-50 p-6">
          <h3 className="font-black uppercase text-black mb-3">
            Live Pool Status
          </h3>
          <div className="grid gap-3 grid-cols-3">
            <div className="border-2 border-black bg-white p-2">
              <div className="text-[10px] font-black uppercase text-black/50">
                Status
              </div>
              <div className="text-sm font-black text-emerald-600">
                {poolStatus !== undefined
                  ? statusLabels[Number(poolStatus)] ?? "Unknown"
                  : "—"}
              </div>
            </div>
            <div className="border-2 border-black bg-white p-2">
              <div className="text-[10px] font-black uppercase text-black/50">
                Total Deposits
              </div>
              <div className="text-sm font-black">
                {totalDeposits !== undefined
                  ? `${formatEther(totalDeposits as bigint)} WISH`
                  : "—"}
              </div>
            </div>
            <div className="border-2 border-black bg-white p-2">
              <div className="text-[10px] font-black uppercase text-black/50">
                Donors
              </div>
              <div className="text-sm font-black">
                {donorCount !== undefined ? String(donorCount) : "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ETH/USDC Direct */}
      <div className="border-4 border-black bg-white p-6">
        <h3 className="font-black uppercase text-black mb-3">
          Donate ETH / USDC
        </h3>
        <p className="text-xs font-medium text-black/60 mb-4">
          Donate directly via cryptocurrency. Funds are converted to $WISH and
          deposited into the Prize Pool on your behalf.
        </p>
        <div className="border-2 border-black bg-emerald-50 p-3">
          <div className="text-xs font-black uppercase text-black/60 mb-1">
            Send directly to:
          </div>
          <code className="text-xs font-bold text-black/80 break-all">
            prize.warondisease.eth
          </code>
          <p className="text-[10px] font-bold text-black/40 mt-1">
            ENS resolves after mainnet deployment
          </p>
        </div>
      </div>

      {/* Fiat */}
      <div className="border-4 border-black bg-yellow-100 p-6">
        <h3 className="font-black uppercase text-black mb-3">
          Traditional Donation
        </h3>
        <p className="text-xs font-medium text-black/60 mb-3">
          Prefer fiat? Your contribution will be converted and deposited into the
          Prize Pool. Email{" "}
          <a
            href="mailto:mike@warondisease.org"
            className="font-black text-black underline hover:text-pink-600"
          >
            mike@warondisease.org
          </a>{" "}
          for wire transfer details, DAF contributions, or institutional commitments.
        </p>
        <div className="flex flex-wrap gap-3">
          {["$100", "$500", "$1,000", "$5,000", "$25,000", "Custom"].map(
            (tier) => (
              <a
                key={tier}
                href="mailto:mike@warondisease.org?subject=Earth%20Optimization%20Prize%20Donation"
                className="border-2 border-black bg-white px-4 py-2 text-sm font-black uppercase hover:bg-pink-100 transition-colors"
              >
                {tier}
              </a>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
