"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ShieldCheck } from "lucide-react";
import { WorldIdVerificationCard } from "@/components/personhood/WorldIdVerificationCard";
import { useTreasuryData } from "@/hooks/useTreasuryData";
import { API_ROUTES } from "@/lib/api-routes";

export function UBIRegistrationCard() {
  const { data: session } = useSession();
  const { address, isConnected } = useAccount();
  const { isRegisteredCitizen, isDemo } = useTreasuryData();

  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const isVerified = Boolean(session?.user?.personhoodVerified);
  const isLoggedIn = Boolean(session?.user);

  async function handleRegister() {
    if (!address) return;
    setIsRegistering(true);
    setRegisterError(null);

    try {
      const response = await fetch(API_ROUTES.treasury.registerUbi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        txHash?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Registration failed.");
      }

      setRegisterSuccess(true);
    } catch (error) {
      setRegisterError(
        error instanceof Error ? error.message : "Registration failed.",
      );
    } finally {
      setIsRegistering(false);
    }
  }

  // Already registered
  if (isRegisteredCitizen && !isDemo) {
    return (
      <section className="mb-16">
        <div className="border-4 border-primary bg-green-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            <h3 className="font-black uppercase text-foreground">
              Registered for UBI
            </h3>
          </div>
          <p className="text-sm text-muted-foreground font-bold mt-3">
            Your wallet is registered. When someone triggers distribution, your
            equal share of the UBI pool will be sent automatically. No
            applications. No bureaucracy. Just math.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-black uppercase text-foreground mb-3">
          Register for UBI
        </h3>
        <p className="text-xs font-bold text-muted-foreground mb-4">
          Three steps: sign in, verify you&apos;re a real person with World ID,
          then register your wallet on-chain. One person, one share. Sybil
          resistance via proof of personhood.
        </p>

        {/* Step 1: Sign in */}
        {!isLoggedIn && (
          <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-4">
            <div className="text-xs font-black uppercase mb-1">
              Step 1
            </div>
            <p className="text-sm font-bold">
              Sign in first to verify your identity.
            </p>
          </div>
        )}

        {/* Step 2: World ID */}
        {isLoggedIn && !isVerified && (
          <div>
            <div className="text-xs font-black uppercase text-muted-foreground mb-2">
              Step 2 — Prove Personhood
            </div>
            <WorldIdVerificationCard show />
          </div>
        )}

        {/* Step 3: Register on-chain */}
        {isLoggedIn && isVerified && !isConnected && (
          <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-4">
            <div className="text-xs font-black uppercase mb-1">
              Step 3
            </div>
            <p className="text-sm font-bold">
              Connect your wallet above to register for UBI.
            </p>
          </div>
        )}

        {isLoggedIn && isVerified && isConnected && (
          <div className="space-y-3">
            <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-black uppercase">
                  Personhood Verified
                </span>
              </div>
              <p className="text-xs font-bold">
                World ID verification complete. Register your wallet to receive
                UBI distributions.
              </p>
            </div>

            {isDemo && (
              <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-3">
                <div className="text-xs font-black uppercase">
                  Not Yet Deployed
                </div>
                <p className="text-xs font-bold mt-1">
                  Contracts are not deployed yet. Registration will be available
                  once the treasury launches.
                </p>
              </div>
            )}

            {!isDemo && (
              <button
                onClick={handleRegister}
                disabled={isRegistering || registerSuccess}
                className="border-4 border-primary bg-brutal-cyan px-6 py-2.5 text-sm font-black uppercase text-brutal-cyan-foreground hover:bg-brutal-cyan/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
              >
                {isRegistering
                  ? "Registering..."
                  : registerSuccess
                    ? "Registered!"
                    : "Register for UBI"}
              </button>
            )}

            {registerError && (
              <p className="text-xs font-black text-red-600">{registerError}</p>
            )}
            {registerSuccess && (
              <p className="text-xs font-black text-green-600">
                Successfully registered for UBI!
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
