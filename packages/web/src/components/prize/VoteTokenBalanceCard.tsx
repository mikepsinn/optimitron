"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface VoteTokenMint {
  id: string;
  referendumId: string;
  walletAddress: string;
  amount: string;
  txHash: string | null;
  chainId: number;
  status: "PENDING" | "SUBMITTED" | "CONFIRMED" | "FAILED";
  createdAt: string;
  referendum: { title: string; slug: string };
}

interface BalanceResponse {
  totalVotes: number;
  totalBalance: string;
  mints: VoteTokenMint[];
}

function formatVOTE(weiAmount: string): string {
  const value = Number(BigInt(weiAmount)) / 1e18;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: "bg-green-100", text: "text-green-800" },
  PENDING: { bg: "bg-brutal-yellow/30", text: "text-black" },
  SUBMITTED: { bg: "bg-brutal-cyan/30", text: "text-black" },
  FAILED: { bg: "bg-red-100", text: "text-red-700" },
};

export function VoteTokenBalanceCard() {
  const [data, setData] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch("/api/vote-tokens/balance");
        if (res.status === 401) {
          setError("sign-in");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");
        const json = (await res.json()) as BalanceResponse;
        setData(json);
      } catch {
        setError("Failed to load VOTE token balance");
      } finally {
        setLoading(false);
      }
    }
    void fetchBalance();
  }, []);

  if (loading) {
    return (
      <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-black/10 w-1/3" />
          <div className="h-8 bg-black/10 w-1/2" />
        </div>
      </div>
    );
  }

  if (error === "sign-in") {
    return (
      <div className="border-4 border-black bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-black uppercase text-black mb-2">
          Sign In to View VOTE Balance
        </h3>
        <p className="text-sm font-medium text-black/70">
          Vote on referendums with a verified World ID to earn VOTE tokens.
          Each verified vote = 1 VOTE.
        </p>
        <Link
          href="/auth/signin?callbackUrl=/voter-prize"
          className="mt-4 inline-flex items-center justify-center border-4 border-black bg-black px-6 py-2 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-4 border-black bg-red-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-sm font-black text-red-700">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Balance Summary */}
      <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-black uppercase text-black mb-4">
          Your VOTE Tokens
        </h3>
        <div className="grid gap-4 grid-cols-2">
          <div className="border-2 border-black bg-brutal-cyan/20 p-4">
            <div className="text-xs font-black uppercase text-black/50">
              Confirmed Votes
            </div>
            <div className="text-3xl font-black text-black">
              {data.totalVotes}
            </div>
          </div>
          <div className="border-2 border-black bg-brutal-yellow/20 p-4">
            <div className="text-xs font-black uppercase text-black/50">
              Total VOTE Balance
            </div>
            <div className="text-3xl font-black text-black">
              {formatVOTE(data.totalBalance)}
            </div>
          </div>
        </div>

        {data.totalVotes === 0 && (
          <div className="mt-4 border-2 border-black bg-brutal-yellow/10 p-3">
            <p className="text-xs font-medium text-black/60">
              You don&apos;t have any VOTE tokens yet. Vote on a{" "}
              <Link
                href="/referendum"
                className="font-black text-brutal-pink underline hover:text-black"
              >
                referendum
              </Link>{" "}
              and verify with World ID to earn 1 VOTE per verified vote.
            </p>
          </div>
        )}
      </div>

      {/* Mint History */}
      {data.mints.length > 0 && (
        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="font-black uppercase text-black mb-4">
            Mint History
          </h3>
          <div className="space-y-2">
            {data.mints.map((mint) => {
              const style = STATUS_STYLES[mint.status] ?? STATUS_STYLES.PENDING;
              return (
                <div
                  key={mint.id}
                  className="border-2 border-black p-3 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/referendum/${mint.referendum.slug}`}
                      className="text-sm font-black text-black hover:text-brutal-pink transition-colors truncate block"
                    >
                      {mint.referendum.title}
                    </Link>
                    <div className="text-[10px] font-medium text-black/40">
                      {new Date(mint.createdAt).toLocaleDateString()}
                      {mint.txHash && (
                        <>
                          {" "}
                          &middot; tx: {mint.txHash.slice(0, 10)}...
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black">
                      {formatVOTE(mint.amount)} VOTE
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 border border-black ${style.bg} ${style.text}`}
                    >
                      {mint.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
