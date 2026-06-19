"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { type Address } from "viem";
import { ubiDistributorAbi } from "@optimitron/treasury-wish/abi";
import { formatWishes, useTreasuryData } from "@/hooks/useTreasuryData";

export function DistributeUBICard() {
  const { isConnected } = useAccount();
  const {
    ubiPendingBalance,
    citizenCount,
    isDeployed,
    isDemo,
    ubiDistributorAddress,
  } = useTreasuryData();

  const [distributed, setDistributed] = useState(false);

  const citizenCountNum = Number(citizenCount);
  const perCitizen = citizenCountNum > 0 ? ubiPendingBalance / citizenCount : 0n;

  const {
    writeContract: writeDistribute,
    data: distributeHash,
    isPending: isDistributing,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: distributeHash });

  useEffect(() => {
    if (isConfirmed) {
      setDistributed(true);
    }
  }, [isConfirmed]);

  function handleDistribute() {
    if (!ubiDistributorAddress) return;
    writeDistribute({
      address: ubiDistributorAddress as Address,
      abi: ubiDistributorAbi,
      functionName: "distributeUBI",
    });
  }

  const isBusy = isDistributing || isConfirming;

  return (
    <section className="mb-16">
      <div className="border-y border-foreground/30 py-6">
        <h3 className="font-black uppercase text-foreground mb-3">
          Trigger UBI Distribution
        </h3>
        <p className="text-xs font-bold text-foreground mb-4">
          Anyone can call this. No permission needed. The protocol splits
          the entire treasury balance equally among all registered citizens. Gas
          cost is the only barrier. On my planet we automated even that, but one
          step at a time.
        </p>

        <div className="mb-4 grid grid-cols-1 gap-3 border-y border-foreground/30 py-3 sm:grid-cols-3">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase text-muted-foreground">
              UBI Pending
            </div>
            <div className="text-sm font-black leading-tight tabular-nums [overflow-wrap:anywhere]">
              {formatWishes(ubiPendingBalance)}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase text-muted-foreground">
              Citizens
            </div>
            <div className="text-sm font-black leading-tight tabular-nums [overflow-wrap:anywhere]">
              {citizenCountNum.toLocaleString()}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase text-muted-foreground">
              Per Citizen
            </div>
            <div className="text-sm font-black leading-tight tabular-nums [overflow-wrap:anywhere]">
              {citizenCountNum > 0 ? formatWishes(perCitizen) : "\u2014"}
            </div>
          </div>
        </div>

        {!isDeployed && isDemo && (
          <div className="mb-4 border-l border-foreground/30 pl-3">
            <p className="text-xs font-black uppercase text-muted-foreground">
              Not yet deployed &mdash; illustrative data shown above
            </p>
          </div>
        )}

        {isConnected && isDeployed && (
          <button
            onClick={handleDistribute}
            disabled={isBusy || distributed || citizenCountNum === 0}
            className="border border-foreground bg-foreground px-6 py-2.5 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy
              ? "Distributing..."
              : distributed
                ? "Distributed!"
                : "Distribute UBI Now"}
          </button>
        )}

        {distributed && distributeHash && (
          <p className="text-xs font-black text-foreground mt-2">
            Distribution complete! Tx: {distributeHash.slice(0, 10)}...
          </p>
        )}
      </div>
    </section>
  );
}
