"use client";

import { useEffect, useState } from "react";

interface StripeConnectStatus {
  status: "NOT_CREATED" | string;
  transferReady: boolean;
  transfersCapabilityStatus: string;
  requirementsCurrentlyDueCount: number;
  requirementsEventuallyDueCount: number;
  requirementsPastDueCount: number;
}

export interface StripeConnectStatusPanelProps {
  signedIn: boolean;
  signInHref: string;
}

function getStatusLabel(status: StripeConnectStatus | null) {
  if (!status) return "Checking payout setup";
  if (status.transferReady) return "Ready to claim paid work";
  if (status.status === "NOT_CREATED") return "Set up payouts first";
  if (status.requirementsPastDueCount > 0) return "Payout setup needs attention";
  return "Payout setup pending";
}

export function StripeConnectStatusPanel({
  signedIn,
  signInHref,
}: StripeConnectStatusPanelProps) {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;

    fetch("/api/stripe/connect/status")
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled && payload?.data) {
          setStatus(payload.data as StripeConnectStatus);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load payout status.");
      });

    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  async function startOnboarding() {
    setError(null);
    if (window.location.protocol !== "https:") {
      setError(
        "Open the HTTPS preview to continue Stripe onboarding. Localhost stops here.",
      );
      return;
    }

    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?stripe_connect=return`;
      const refreshUrl = `${window.location.origin}${window.location.pathname}?stripe_connect=refresh`;
      const response = await fetch("/api/stripe/connect/onboarding-link", {
        body: JSON.stringify({ refreshUrl, returnUrl }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: { url?: string }; error?: string }
        | null;

      if (!response.ok || !payload?.data?.url) {
        throw new Error(payload?.error ?? "Could not create onboarding link.");
      }

      window.location.assign(payload.data.url);
    } catch (connectError) {
      setError(
        connectError instanceof Error
          ? connectError.message
          : "Could not create onboarding link.",
      );
      setLoading(false);
    }
  }

  if (!signedIn) {
    return (
      <section
        className="scroll-mt-24 space-y-3 border border-foreground bg-background p-4 text-foreground"
        id="payouts"
      >
        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
          Want to do this paid task?
        </p>
        <p className="text-sm font-bold">
          Sign in, set up payouts, then claim it. Verified work gets paid
          automatically.
        </p>
        <a
          className="inline-flex min-h-10 items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
          href={signInHref}
        >
          Sign in to claim
        </a>
      </section>
    );
  }

  return (
    <section
      className="scroll-mt-24 space-y-3 border border-foreground bg-background p-4 text-foreground"
      id="payouts"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            Want to do this paid task?
          </p>
          <p className="text-base font-black">{getStatusLabel(status)}</p>
          <p className="mt-1 text-sm font-bold text-muted-foreground">
            Verified work gets paid automatically after approval.
          </p>
        </div>
        {status?.transferReady ? (
          <span className="border border-foreground px-3 py-1 text-xs font-black uppercase">
            Ready
          </span>
        ) : null}
      </div>

      {!status?.transferReady ? (
        <button
          className="inline-flex min-h-10 items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground disabled:opacity-60"
          disabled={loading}
          onClick={startOnboarding}
          type="button"
        >
          {loading ? "Opening Stripe..." : "Set up payouts"}
        </button>
      ) : null}

      {error ? <p className="text-sm font-bold text-destructive">{error}</p> : null}
    </section>
  );
}
