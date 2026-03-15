"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { type Address } from "viem";
import { alignmentTreasuryAbi } from "@/lib/contracts/alignment-treasury-abi";
import { formatWish, useTreasuryData } from "@/hooks/useTreasuryData";

export function DistributeUBICard() {
  const { isConnected } = useAccount();
  const {
    treasuryBalance,
    ubiAllocationBps,
    citizenCount,
    isDeployed,
    isDemo,
    treasuryAddress,
  } = useTreasuryData();

  const [distributed, setDistributed] = useState(false);

  const ubiPool =
    (treasuryBalance * ubiAllocationBps) / 10_000n;
  const citizenCountNum = Number(citizenCount);
  const perCitizen = citizenCountNum > 0 ? ubiPool / citizenCount : 0n;

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
    if (!treasuryAddress) return;
    writeDistribute({
      address: treasuryAddress as Address,
      abi: alignmentTreasuryAbi,
      functionName: "distributeUBI",
    });
  }

  const isBusy = isDistributing || isConfirming;

  return (
    <section className="mb-16">
      <div className="border-4 border-black bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-black uppercase text-black mb-3">
          Trigger UBI Distribution
        </h3>
        <p className="text-xs font-medium text-black/70 mb-4">
          Anyone can call this. No permission needed. The smart contract splits
          the UBI pool equally among all registered citizens. Gas cost is the
          only barrier. On my planet we automated even that, but one step at a
          time.
        </p>

        <div className="grid gap-3 grid-cols-3 mb-4">
          <div className="border-2 border-black bg-white p-2">
            <div className="text-[10px] font-black uppercase text-black/50">
              UBI Pool
            </div>
            <div className="text-sm font-black">
              {formatWish(ubiPool)} $WISH
            </div>
          </div>
          <div className="border-2 border-black bg-white p-2">
            <div className="text-[10px] font-black uppercase text-black/50">
              Citizens
            </div>
            <div className="text-sm font-black">{citizenCountNum}</div>
          </div>
          <div className="border-2 border-black bg-white p-2">
            <div className="text-[10px] font-black uppercase text-black/50">
              Per Citizen
            </div>
            <div className="text-sm font-black">
              {citizenCountNum > 0 ? `${formatWish(perCitizen)}` : "—"}
            </div>
          </div>
        </div>

        {!isDeployed && isDemo && (
          <div className="border-2 border-black bg-brutal-yellow/30 p-3 mb-4">
            <p className="text-xs font-black uppercase text-black/60">
              Not yet deployed — illustrative data shown above
            </p>
          </div>
        )}

        {isConnected && isDeployed && (
          <button
            onClick={handleDistribute}
            disabled={isBusy || distributed || citizenCountNum === 0}
            className="border-2 border-black bg-black px-6 py-2.5 text-sm font-black uppercase text-white hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)]"
          >
            {isBusy
              ? "Distributing..."
              : distributed
                ? "Distributed!"
                : "Distribute UBI Now"}
          </button>
        )}

        {distributed && distributeHash && (
          <p className="text-xs font-black text-black mt-2">
            Distribution complete! Tx: {distributeHash.slice(0, 10)}...
          </p>
        )}
      </div>
    </section>
  );
}
