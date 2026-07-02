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
  if (!status) return "Checking payouts";
  if (status.transferReady) return "Payouts ready";
  if (status.status === "NOT_CREATED") return "Payouts not set up";
  if (status.requirementsPastDueCount > 0) return "Payouts need attention";
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
      setError("Stripe onboarding needs an HTTPS preview or production URL.");
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
      <section className="space-y-3 border border-foreground bg-background p-4 text-foreground">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
          Paid task
        </p>
        <p className="text-sm font-bold">
          Sign in and set up payouts before claiming paid work.
        </p>
        <a
          className="inline-flex min-h-10 items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
          href={signInHref}
        >
          Sign in
        </a>
      </section>
    );
  }

  return (
    <section className="space-y-3 border border-foreground bg-background p-4 text-foreground">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            Paid task payouts
          </p>
          <p className="text-base font-black">{getStatusLabel(status)}</p>
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
