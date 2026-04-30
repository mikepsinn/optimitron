"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrutalCard } from "@/components/ui/brutal-card";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/retroui/Button";
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

  return (
    <SectionContainer bgColor="background">
      <Container size="md">
        <SectionHeader
          title="DONATION RECORDED"
          subtitle={
            session
              ? `Stripe processed your ${isMonthly ? "recurring" : "one-time"} donation${
                  dollars ? ` of $${dollars}` : ""
                }. The Commission has noted it.`
              : error
                ? "Donation status pending."
                : "Confirming your donation with Stripe…"
          }
          size="md"
        />

        <BrutalCard bgColor="cyan" shadowSize={8}>
          {error ? (
            <p className="font-bold">{error}</p>
          ) : session ? (
            <div className="space-y-4">
              <p className="font-black uppercase text-2xl">
                ${dollars}{isMonthly ? "/mo" : ""} — {session.payment_status}
              </p>
              <p className="font-bold">
                Receipt sent to {session.customer_email ?? "your email"}. Funds route through
                the Institute for Accelerated Medicine 501(c)(3) to the Earth Optimization
                referendum campaign and platform operations.
              </p>
              <p className="font-bold">
                Your donation funds the survey hosting, identity verification, coordination,
                translation, fraud prevention, and public evidence pages. The most leveraged
                thing you can do next is recruit one more voter — that is how the referendum
                signal compounds.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href={DASHBOARD_INVITE_HREF}>Invite one voter</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href={ROUTES.dashboard}>Open dashboard</Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="font-bold">Loading donation details…</p>
          )}
        </BrutalCard>
      </Container>
    </SectionContainer>
  );
}

export default function DonateSuccessPage() {
  return (
    <Suspense fallback={null}>
      <DonateSuccessInner />
    </Suspense>
  );
}
