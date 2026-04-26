"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  BED_NETS_COST_PER_DALY,
  CHILDHOOD_VACCINATION_ROI,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  SMALLPOX_ERADICATION_ROI,
  TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER,
  TREATY_VS_BED_NETS_MULTIPLIER,
} from "@optimitron/data/parameters";
import { AmountSelector } from "@/components/ui/amount-selector";
import { BrutalCard } from "@/components/ui/brutal-card";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { TreatyMechanismExplainer } from "@/components/shared/TreatyMechanismExplainer";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Dialog } from "@/components/retroui/Dialog";
import { PRESET_DONATION_AMOUNTS, type DonationFrequency } from "@/lib/stripe";

// Stripe's per-card transaction limit is $999,999 — anything larger
// silently rejects in checkout. We surface this in the UI rather than letting
// donors discover it after the fact.
const STRIPE_MAX_CUSTOM_AMOUNT_USD = 999_999;
const FOUNDER_EMAIL = "m@thinkbynumbers.org";

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
  const [militaryDialogOpen, setMilitaryDialogOpen] = useState(false);

  const effectiveAmount =
    customAmount.trim() && Number.isFinite(Number(customAmount))
      ? Math.min(
          STRIPE_MAX_CUSTOM_AMOUNT_USD,
          Math.max(1, Math.round(Number(customAmount))),
        )
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
          subtitle={
            <>
              Every minute you make that face at this page, 104 humans permanently
              stop. Please make a different face. Donations fund the Earth Optimization
              Prize pool (distributed to recruiters by Earth Optimization Points
              earned), plus the operating cost of running a 4 billion-person treaty
              survey: hosting, identity verification, coordination. Tax-deductible via
              the Institute for Accelerated Medicine 501(c)(3).
            </>
          }
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
          <div className="space-y-5">
            <p className="font-black uppercase text-xl">The math</p>
            <TreatyMechanismExplainer />
          </div>
        </BrutalCard>

        <BrutalCard bgColor="yellow" shadowSize={8} className="mb-6">
          <div className="space-y-3 font-bold">
            <p className="font-black uppercase text-xl">Cost-effectiveness</p>
            <p>
              <strong>
                <ParameterValue
                  param={{
                    ...TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
                    unit: "USD",
                  }}
                  figures={3}
                />
              </strong>{" "}
              to save one year of healthy human life. Anti-malaria bed nets, the gold
              standard for keeping humans alive, cost{" "}
              <strong>
                <ParameterValue
                  param={{ ...BED_NETS_COST_PER_DALY, unit: "USD" }}
                  figures={2}
                />
              </strong>
              . This is{" "}
              <strong>
                <ParameterValue
                  param={TREATY_VS_BED_NETS_MULTIPLIER}
                  display="withUnit"
                  figures={3}
                />{" "}
                cheaper
              </strong>
              . It beats smallpox eradication (
              <ParameterValue param={SMALLPOX_ERADICATION_ROI} figures={3} /> to 1) and
              childhood vaccinations (
              <ParameterValue param={CHILDHOOD_VACCINATION_ROI} figures={2} /> to 1),
              which were humanity&apos;s previous greatest hits in the &quot;not
              dying&quot; genre.
            </p>
            <p>
              Even if you assume only a 1% probability of the treaty actually passing
              (because you&apos;re you), the expected return is still{" "}
              <strong>
                <ParameterValue
                  param={TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER}
                  display="withUnit"
                  figures={3}
                />{" "}
                better
              </strong>{" "}
              than anti-malaria bed nets. Your calculator will display an error, emit a
              tiny electronic scream, and attempt to leave the desk. This is correct.
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
              <div className="mt-3 space-y-2">
                <Input
                  type="number"
                  min={1}
                  max={STRIPE_MAX_CUSTOM_AMOUNT_USD}
                  step={1}
                  placeholder={`Or enter a custom amount (up to $${STRIPE_MAX_CUSTOM_AMOUNT_USD.toLocaleString()})`}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
                <p className="text-xs font-bold text-muted-foreground">
                  Stripe declines transactions above $999,999. The Commission has noted this.
                </p>
              </div>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => setMilitaryDialogOpen(true)}
                >
                  ${" "}
                  {(GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value / 1e12).toFixed(2)}{" "}
                  trillion (match the global murder budget)
                </Button>
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

        <BrutalCard bgColor="pink" shadowSize={8} className="mt-6">
          <p className="font-black text-xl leading-tight">
            <ParameterValue
              param={{ ...GLOBAL_MILITARY_SPENDING_ANNUAL_2024, unit: "USD" }}
              figures={3}
            />{" "}
            a year exists. The child is dying because every single person who could
            change that decided it wasn&apos;t their problem.
          </p>
        </BrutalCard>

        <Dialog open={militaryDialogOpen} onOpenChange={setMilitaryDialogOpen}>
          <Dialog.Content title="Stripe limit">
            <div className="space-y-3 p-2 font-bold">
              <p>
                Sorry, Stripe only accepts up to $
                {STRIPE_MAX_CUSTOM_AMOUNT_USD.toLocaleString()}. So just do that{" "}
                {Math.ceil(
                  GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value /
                    STRIPE_MAX_CUSTOM_AMOUNT_USD,
                ).toLocaleString()}{" "}
                times.
              </p>
              <p>
                Or wire it. Email{" "}
                <a
                  href={`mailto:${FOUNDER_EMAIL}?subject=${encodeURIComponent(
                    "Wire instructions for major gift",
                  )}`}
                  className="underline"
                >
                  {FOUNDER_EMAIL}
                </a>{" "}
                for instructions.
              </p>
            </div>
          </Dialog.Content>
        </Dialog>
      </Container>
    </SectionContainer>
  );
}
