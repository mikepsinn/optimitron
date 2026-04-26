"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  PRAGMATIC_TRIAL_COST_PER_QALY,
} from "@optimitron/data/parameters";
import { AmountSelector } from "@/components/ui/amount-selector";
import { BrutalCard } from "@/components/ui/brutal-card";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { PRESET_DONATION_AMOUNTS, type DonationFrequency } from "@/lib/stripe";

// One-percent redirect math used in the impact card.
const ONE_PERCENT_OF_GLOBAL_MILITARY_USD =
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value * 0.01;
const TREATY_LIFETIME_YEARS = 30;
const ASSUMED_FUNDRAISE_USD = 1_000_000_000;

// Annual healthy life-years unlocked when the treaty redirects 1% of military
// into pragmatic trials at the published per-QALY cost.
const ANNUAL_QALYS_UNLOCKED =
  ONE_PERCENT_OF_GLOBAL_MILITARY_USD / PRAGMATIC_TRIAL_COST_PER_QALY.value;
const LIFETIME_QALYS_UNLOCKED = ANNUAL_QALYS_UNLOCKED * TREATY_LIFETIME_YEARS;
const QALYS_PER_DONATED_DOLLAR = LIFETIME_QALYS_UNLOCKED / ASSUMED_FUNDRAISE_USD;

export default function DonatePage() {
  const searchParams = useSearchParams();
  const canceled = searchParams?.get("canceled") === "true";

  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [frequency, setFrequency] = useState<DonationFrequency>("monthly");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveAmount =
    customAmount.trim() && Number.isFinite(Number(customAmount))
      ? Math.max(1, Math.round(Number(customAmount)))
      : amount;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!effectiveAmount || effectiveAmount < 1) {
      setError("Pick an amount of at least $1.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const sourceUrl = typeof window !== "undefined" ? window.location.href : "";
      const sourceReferrer = typeof document !== "undefined" ? document.referrer : "";

      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          donationType: frequency,
          name: name.trim(),
          email: email.trim(),
          sourceUrl,
          sourceReferrer,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Failed to start checkout. Try again.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError("Could not reach the donation server.");
      setLoading(false);
    }
  }

  return (
    <SectionContainer bgColor="background">
      <Container size="md">
        <SectionHeader
          title="FUND THE TASK"
          subtitle="Donations fund the Earth Optimization Prize pool — distributed to recruiters by Earth Optimization Points earned — and the operating cost of running a 4 billion-person treaty survey: hosting, identity verification, coordination. Tax-deductible via the Institute for Accelerated Medicine 501(c)(3)."
          size="md"
        />

        {canceled ? (
          <BrutalCard bgColor="yellow" className="mb-6">
            <p className="font-bold">
              Checkout canceled. Nothing was charged. The task remains overdue.
            </p>
          </BrutalCard>
        ) : null}

        <BrutalCard bgColor="cyan" shadowSize={8} className="mb-6">
          <div className="space-y-3 font-bold">
            <p className="font-black uppercase text-xl">The leverage chain</p>
            <p>
              Pragmatic clinical trials cost about{" "}
              <ParameterValue param={PRAGMATIC_TRIAL_COST_PER_QALY} display="withUnit" /> —
              one healthy life-year for the price of a sandwich. The 1% Treaty redirects 1% of
              global military spending —{" "}
              <ParameterValue
                param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024}
                display="withUnit"
              />{" "}
              annually — into those trials. That's roughly{" "}
              <strong>
                {(ANNUAL_QALYS_UNLOCKED / 1e9).toFixed(1)} billion healthy life-years per year
              </strong>{" "}
              of treaty effect.
            </p>
            <p>
              If donations totaling about{" "}
              <strong>${(ASSUMED_FUNDRAISE_USD / 1e9).toFixed(0)} billion</strong>{" "}
              fund the platform that gets the treaty across the line, the per-dollar leverage
              over a {TREATY_LIFETIME_YEARS}-year treaty horizon comes out to roughly{" "}
              <strong>
                {Math.round(QALYS_PER_DONATED_DOLLAR).toLocaleString()} healthy life-years per
                dollar donated
              </strong>
              .
            </p>
            <p className="text-sm text-muted-foreground">
              Upper-bound estimate. Assumes the treaty passes, operates at scale for{" "}
              {TREATY_LIFETIME_YEARS} years, and that platform donations are the marginal
              contribution that gets it ratified. Trial cost-effectiveness benchmark from the
              RECOVERY trial; click the parameter values for the math and citations.
            </p>
          </div>
        </BrutalCard>

        <BrutalCard bgColor="background" shadowSize={8}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="font-black uppercase mb-3">How often</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={frequency === "monthly" ? "default" : "outline"}
                  onClick={() => setFrequency("monthly")}
                >
                  Monthly
                </Button>
                <Button
                  type="button"
                  variant={frequency === "one-time" ? "default" : "outline"}
                  onClick={() => setFrequency("one-time")}
                >
                  One-time
                </Button>
              </div>
            </div>

            <div>
              <p className="font-black uppercase mb-3">
                Amount {frequency === "monthly" ? "per month" : ""}
              </p>
              <AmountSelector
                amounts={[...PRESET_DONATION_AMOUNTS]}
                value={customAmount.trim() ? null : amount}
                onChange={(value) => {
                  setAmount(value);
                  setCustomAmount("");
                }}
                columns={3}
                formatPrefix="$"
                formatSuffix={frequency === "monthly" ? "/mo" : ""}
                activeColor="pink"
              />
              <div className="mt-3">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Or enter a custom amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error ? (
              <BrutalCard bgColor="red" shadowSize={4}>
                <p className="font-bold text-brutal-red-foreground">{error}</p>
              </BrutalCard>
            ) : null}

            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? "Opening checkout…"
                : `Donate $${effectiveAmount}${frequency === "monthly" ? "/mo" : ""}`}
            </Button>

            <p className="text-sm font-bold text-muted-foreground">
              Donations are routed through the Institute for Accelerated Medicine, a U.S.
              501(c)(3), which administers the Earth Optimization Prize pool and the platform
              operations budget (hosting, identity verification, coordination). Tax-deductible
              in the United States. Stripe processes the payment; we never see your card number.
            </p>
          </form>
        </BrutalCard>
      </Container>
    </SectionContainer>
  );
}
