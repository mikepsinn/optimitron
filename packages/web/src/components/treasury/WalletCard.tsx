"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatWishes, useTreasuryData } from "@/hooks/useTreasuryData";

export function WalletCard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { wishBalance, maxSupply, isDemo } = useTreasuryData();

  return (
    <section id="connect" className="mb-16">
      <div className="border-y border-foreground/30 py-6">
        <h3 className="font-black uppercase text-foreground mb-3">
          Connect Wallet
        </h3>

        {!mounted ? (
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground mb-4">
              Connect your wallet to check your balance in wishes, register for UBI,
              and trigger distributions. This is the wishes monetary system — not
              the IAB public goods pool.
            </p>
          </div>
        ) : !isConnected ? (
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground mb-4">
              Connect your wallet to check your balance in wishes, register for UBI,
              and trigger distributions. This is the wishes monetary system — not
              the IAB public goods pool.
            </p>
            {connectors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    className="border border-foreground bg-background px-4 py-2.5 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
                  >
                    {connector.name === "Injected"
                      ? "Browser Wallet (MetaMask)"
                      : connector.name}
                  </button>
                ))}
              </div>
            )}
            <div className="border-l border-foreground/30 pl-3">
              <p className="text-xs font-bold">
                Need a wallet?{" "}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black underline hover:text-foreground"
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
                {chainId !== sepolia.id && (
                  <button
                    onClick={() => switchChain({ chainId: sepolia.id })}
                    className="border border-foreground bg-background px-3 py-1.5 text-xs font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
                  >
                    Switch to Sepolia
                  </button>
                )}
                <button
                  onClick={() => disconnect()}
                  className="border border-foreground bg-background px-3 py-1.5 text-xs font-black uppercase transition-colors hover:bg-foreground hover:text-background"
                >
                  Disconnect
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="min-w-0 border-y border-foreground/30 py-2">
                <div className="text-[10px] font-black uppercase">
                  Wishes Balance
                </div>
                <div className="text-sm font-black leading-tight tabular-nums [overflow-wrap:anywhere]">
                  {isDemo
                    ? "— (not deployed)"
                    : formatWishes(wishBalance)}
                </div>
              </div>
              <div className="min-w-0 border-y border-foreground/30 py-2">
                <div className="text-[10px] font-black uppercase">
                  Max Supply (Fixed)
                </div>
                <div className="text-sm font-black leading-tight tabular-nums [overflow-wrap:anywhere]">
                  {formatWishes(maxSupply)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
