"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/retroui/Button";
import { defaultButtonClassName } from "@/components/ui/default-button";
import { NONPROFIT } from "@/lib/nonprofit-identity";
import { DASHBOARD_INVITE_HREF, ROUTES } from "@/lib/routes";

interface SessionData {
  amount_total: number | null;
  currency: string | null;
  customer_email: string | null;
  payment_status: string;
  mode: string;
}

function DonateSuccessInner() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const sessionId = searchParams?.get("session_id");
  const [session, setSession] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session id.");
      return;
    }
    fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data: SessionData & { error?: string }) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setSession(data);
      })
      .catch(() => setError("Could not load donation details."));
  }, [sessionId]);

  const dollars =
    session?.amount_total != null ? (session.amount_total / 100).toFixed(0) : null;
  const isMonthly = session?.mode === "subscription";
  const subtitle = session
    ? `Stripe processed your ${isMonthly ? "recurring" : "one-time"} donation${
        dollars ? ` of $${dollars}` : ""
      }.`
    : error
      ? "Donation status pending."
      : "Confirming your donation with Stripe...";
  const trackHref =
    status === "authenticated"
      ? ROUTES.dashboard
      : `/auth/signin?callbackUrl=${encodeURIComponent(ROUTES.dashboard)}`;

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="border-b border-black pb-8">
          <h1 className="text-4xl font-semibold tracking-tight">
            Donation recorded
          </h1>
          <p className="mt-4 text-lg leading-8 text-neutral-700">{subtitle}</p>
        </header>

        <section className="mt-8 border border-black p-5 sm:p-6">
          {error ? (
            <p className="font-semibold">{error}</p>
          ) : session ? (
            <div className="space-y-4">
              <p className="text-2xl font-semibold">
                ${dollars}
                {isMonthly ? "/mo" : ""} - {session.payment_status}
              </p>
              <p className="leading-7 text-neutral-700">
                Receipt sent to {session.customer_email ?? "your email"}. Funds
                route through {NONPROFIT.legalName} (EIN {NONPROFIT.ein}), a
                U.S. 501(c)(3) public charity, to the 1% Treaty campaign.
              </p>
              <p className="leading-7 text-neutral-700">
                It pays for hosting, identity checks, translation, fraud
                prevention, and public evidence pages. Your best next move:
                get one more human to vote.
              </p>
              <p className="leading-7 text-neutral-700">
                Want to watch it work? Sign in with the same email you
                used in Stripe.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className={`${defaultButtonClassName} flex-1`}
                >
                  <Link href={trackHref}>Track your impact</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className={`${defaultButtonClassName} flex-1`}
                >
                  <Link href={DASHBOARD_INVITE_HREF}>Invite one voter</Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="font-semibold">Loading donation details...</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default function DonateSuccessPage() {
  return (
    <Suspense fallback={null}>
      <DonateSuccessInner />
    </Suspense>
  );
}
