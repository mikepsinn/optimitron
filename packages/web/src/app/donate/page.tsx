"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  BED_NETS_COST_PER_DALY,
  CHILDHOOD_VACCINATION_ROI,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  SMALLPOX_ERADICATION_ROI,
  TREATY_CAMPAIGN_TOTAL_COST,
  TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER,
  TREATY_VS_BED_NETS_MULTIPLIER,
} from "@optimitron/data/parameters";
import { ChaplinReference } from "@/components/donate/ChaplinReference";
import { DonationImpactCalculator } from "@/components/donate/DonationImpactCalculator";
import { MonthlyLifetimeImpact } from "@/components/donate/MonthlyLifetimeImpact";
import { WaysToGiveCard } from "@/components/donate/WaysToGiveCard";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { Dialog } from "@/components/retroui/Dialog";
import { PRESET_DONATION_AMOUNTS, type DonationFrequency } from "@/lib/stripe";
import {
  formatDonationImpactNumber,
  getTreatyDonationImpactPerDollar,
} from "@/lib/treaty-donation-impact";

const STRIPE_MAX_CUSTOM_AMOUNT_USD = 999_999;
const MIKE_EMAIL = "m@warondisease.org";
const MAJOR_GIFT_THRESHOLD_USD = 5_000;
const FEDERAL_TAX_BRACKET_RATE = 0.24;

const donationImpact = getTreatyDonationImpactPerDollar();
const conditionalSufferingYearsPerDollarText = formatDonationImpactNumber(
  donationImpact.conditionalSufferingYearsPreventedPerDollar,
);
const conditionalLivesPerDollarText = formatDonationImpactNumber(
  donationImpact.conditionalLivesAvertedPerDollar,
  1,
);
const riskAdjustedSufferingYearsPerDollarText = formatDonationImpactNumber(
  donationImpact.riskAdjustedSufferingYearsPreventedPerDollar,
  1,
);
const riskAdjustedSuccessProbabilityText = formatDonationImpactNumber(
  donationImpact.successProbability * 100,
);
const globalMilitarySpendingTrillions = (
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value / 1e12
).toFixed(2);

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
  const [majorGiftDialogOpen, setMajorGiftDialogOpen] = useState(false);

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
      const sourceUrl =
        typeof window !== "undefined" ? window.location.href : "";
      const sourceReferrer =
        typeof document !== "undefined" ? document.referrer : "";

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
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="max-w-3xl border-b border-black pb-8">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Buy healthy life-years.
          </h1>
          <p className="mt-5 text-lg leading-8 text-neutral-700 sm:text-xl">
            Your donation funds the campaign to pass the 1% Treaty: identity
            verification, fraud prevention, translation, hosting, outreach, and
            public evidence pages. Use the calculator to change assumptions and
            add the modeled price to checkout.
          </p>
          <p className="mt-4 text-sm leading-6 text-neutral-600">
            Donations are processed for the Institute for Accelerated Medicine,
            a U.S. 501(c)(3). Tax-deductible in the United States.
          </p>
        </header>

        {canceled ? (
          <div className="mt-6 border border-black p-4 text-sm">
            Checkout canceled. Nothing was charged.
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="space-y-8">
            <DonationImpactCalculator
              onSetAmount={(amount) => setCustomAmount(String(amount))}
            />

            <section className="border-t border-black pt-8">
              <h2 className="text-2xl font-semibold">Calculation summary</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-neutral-700">
                <p>
                  The current model estimates{" "}
                  <strong className="text-black">
                    <ParameterValue
                      param={{
                        ...TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
                        unit: "USD",
                      }}
                      figures={3}
                    />
                  </strong>{" "}
                  to save one healthy life-year. Anti-malaria bed nets are
                  commonly benchmarked at{" "}
                  <strong className="text-black">
                    <ParameterValue
                      param={{ ...BED_NETS_COST_PER_DALY, unit: "USD" }}
                      figures={2}
                    />
                  </strong>
                  .
                </p>
                <p>
                  In the published assumptions, the treaty campaign is{" "}
                  <strong className="text-black">
                    <ParameterValue
                      param={TREATY_VS_BED_NETS_MULTIPLIER}
                      display="withUnit"
                      figures={3}
                    />{" "}
                    cheaper
                  </strong>{" "}
                  per healthy life-year than bed nets. Even at the model&apos;s
                  skeptical success probability, expected impact is{" "}
                  <strong className="text-black">
                    <ParameterValue
                      param={TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER}
                      display="withUnit"
                      figures={3}
                    />{" "}
                    better
                  </strong>{" "}
                  than bed nets.
                </p>
                <p>
                  Conditional on success,{" "}
                  <ParameterValue
                    param={TREATY_CAMPAIGN_TOTAL_COST}
                    figures={1}
                  />{" "}
                  of campaign cost buys about{" "}
                  <strong className="text-black">
                    {conditionalLivesPerDollarText} modeled deaths averted
                  </strong>{" "}
                  and{" "}
                  <strong className="text-black">
                    {conditionalSufferingYearsPerDollarText} years of suffering
                    prevented
                  </strong>{" "}
                  per campaign dollar. At{" "}
                  <strong className="text-black">
                    {riskAdjustedSuccessProbabilityText}% success probability
                  </strong>
                  , the risk-adjusted estimate is{" "}
                  <strong className="text-black">
                    {riskAdjustedSufferingYearsPerDollarText} expected years of
                    suffering prevented
                  </strong>{" "}
                  per dollar.
                </p>
                <p>
                  Historical public-health wins such as smallpox eradication (
                  <ParameterValue param={SMALLPOX_ERADICATION_ROI} figures={3} />{" "}
                  to 1) and childhood vaccination (
                  <ParameterValue
                    param={CHILDHOOD_VACCINATION_ROI}
                    figures={2}
                  />{" "}
                  to 1) are included for comparison.
                </p>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6">
            <form
              onSubmit={handleSubmit}
              className="border border-black bg-white p-5 sm:p-6"
            >
              <h2 className="text-2xl font-semibold">Checkout</h2>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold">Frequency</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={frequencyButtonClass(frequency === "monthly")}
                    onClick={() => setFrequency("monthly")}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    className={frequencyButtonClass(frequency === "one-time")}
                    onClick={() => setFrequency("one-time")}
                  >
                    One-time
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold">
                  Amount{frequency === "monthly" ? " per month" : ""}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[...PRESET_DONATION_AMOUNTS].map((presetAmount) => (
                    <button
                      key={presetAmount}
                      type="button"
                      className={amountButtonClass(
                        !customAmount.trim() && amount === presetAmount,
                      )}
                      onClick={() => {
                        setAmount(presetAmount);
                        setCustomAmount("");
                      }}
                    >
                      ${presetAmount.toLocaleString()}
                      {frequency === "monthly" ? "/mo" : ""}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={amountButtonClass(false)}
                    onClick={() => setMajorGiftDialogOpen(true)}
                  >
                    ${globalMilitarySpendingTrillions} trillion
                  </button>
                </div>

                <label className="mt-4 block text-sm font-semibold">
                  Custom amount
                  <input
                    className="mt-2 w-full border border-black px-3 py-2 text-base outline-none focus:ring-2 focus:ring-black"
                    type="number"
                    min={1}
                    max={STRIPE_MAX_CUSTOM_AMOUNT_USD}
                    step={1}
                    placeholder={`Up to $${STRIPE_MAX_CUSTOM_AMOUNT_USD.toLocaleString()}`}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                </label>
                <p className="mt-2 text-xs leading-5 text-neutral-600">
                  Card checkout supports up to $
                  {STRIPE_MAX_CUSTOM_AMOUNT_USD.toLocaleString()}. Larger gifts
                  can be wired.
                </p>

                {frequency === "monthly" && effectiveAmount >= 1 ? (
                  <div className="mt-4">
                    <MonthlyLifetimeImpact monthlyAmountUsd={effectiveAmount} />
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-3">
                <label className="text-sm font-semibold">
                  Full name
                  <input
                    className="mt-2 w-full border border-black px-3 py-2 text-base outline-none focus:ring-2 focus:ring-black"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
                <label className="text-sm font-semibold">
                  Email
                  <input
                    className="mt-2 w-full border border-black px-3 py-2 text-base outline-none focus:ring-2 focus:ring-black"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
              </div>

              {error ? (
                <div className="mt-4 border border-black p-3 text-sm">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full border border-black bg-black px-5 py-3 text-base font-semibold text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Opening checkout..."
                  : `Donate $${effectiveAmount.toLocaleString()}${
                      frequency === "monthly" ? "/mo" : ""
                    }`}
              </button>

              <p className="mt-3 text-xs leading-5 text-neutral-600">
                Estimated out-of-pocket after federal deduction: $
                {Math.round(
                  effectiveAmount * (1 - FEDERAL_TAX_BRACKET_RATE),
                ).toLocaleString()}{" "}
                if you itemize in a {Math.round(FEDERAL_TAX_BRACKET_RATE * 100)}
                % bracket.
              </p>

              {effectiveAmount >= MAJOR_GIFT_THRESHOLD_USD ? (
                <p className="mt-3 text-xs leading-5 text-neutral-700">
                  Donating ${MAJOR_GIFT_THRESHOLD_USD.toLocaleString()}+?
                  Email{" "}
                  <a
                    href={`mailto:${MIKE_EMAIL}?subject=${encodeURIComponent(
                      "Wire instructions for major gift",
                    )}`}
                    className="underline"
                  >
                    {MIKE_EMAIL}
                  </a>{" "}
                  for wire instructions and lower processing fees.
                </p>
              ) : null}
            </form>
          </aside>
        </div>

        <div className="mt-10">
          <WaysToGiveCard />
        </div>

        <div className="mt-12">
          <ChaplinReference />
        </div>
      </div>

      <Dialog open={majorGiftDialogOpen} onOpenChange={setMajorGiftDialogOpen}>
        <Dialog.Content title="Large gift">
          <div className="space-y-4 p-5 text-sm leading-6">
            <p>
              Card checkout is capped at $
              {STRIPE_MAX_CUSTOM_AMOUNT_USD.toLocaleString()}. For larger
              gifts, use wire, stock, crypto, or DAF transfer instructions.
            </p>
            <a
              href={`mailto:${MIKE_EMAIL}?subject=${encodeURIComponent(
                `Large donation inquiry: $${globalMilitarySpendingTrillions} trillion`,
              )}`}
              className="inline-block border border-black bg-black px-4 py-2 font-semibold text-white"
            >
              Email transfer instructions
            </a>
          </div>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}

function frequencyButtonClass(active: boolean) {
  return [
    "border border-black px-4 py-2 text-sm font-semibold transition",
    active ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100",
  ].join(" ");
}

function amountButtonClass(active: boolean) {
  return [
    "min-h-12 border border-black px-3 py-2 text-sm font-semibold transition",
    active ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100",
  ].join(" ");
}
