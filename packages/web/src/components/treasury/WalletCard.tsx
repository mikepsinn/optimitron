"use client";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatWish, useTreasuryData } from "@/hooks/useTreasuryData";

export function WalletCard() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { wishBalance, maxSupply, isDemo } = useTreasuryData();

  return (
    <section id="connect" className="mb-16">
      <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-black uppercase text-foreground mb-3">
          Connect Wallet
        </h3>

        {!isConnected ? (
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground mb-4">
              Connect your wallet to check your $WISH balance, register for UBI,
              and trigger distributions. This is the $WISH monetary system — not
              the IAB public goods pool.
            </p>
            {connectors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    className="border-4 border-primary bg-brutal-cyan px-4 py-2.5 text-sm font-black uppercase text-brutal-cyan-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
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

            <div className="grid gap-2 grid-cols-2">
              <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-2">
                <div className="text-[10px] font-black uppercase">
                  $WISH Balance
                </div>
                <div className="text-sm font-black">
                  {isDemo
                    ? "— (not deployed)"
                    : `${formatWish(wishBalance)} $WISH`}
                </div>
              </div>
              <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-2">
                <div className="text-[10px] font-black uppercase">
                  Max Supply (Fixed)
                </div>
                <div className="text-sm font-black">
                  {formatWish(maxSupply)} $WISH
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
