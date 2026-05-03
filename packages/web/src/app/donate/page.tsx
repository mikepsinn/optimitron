"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  BED_NETS_COST_PER_DALY,
  CHILDHOOD_VACCINATION_ROI,
  POLITICAL_SUCCESS_PROBABILITY,
  SMALLPOX_ERADICATION_ROI,
  THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION,
  TREATY_CAMPAIGN_TOTAL_COST,
  TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER,
  TREATY_REDUCTION_PCT,
  TREATY_VS_BED_NETS_MULTIPLIER,
  fmtRaw,
} from "@optimitron/data/parameters";
import { ChaplinReference } from "@/components/donate/ChaplinReference";
import { deriveDonationImpact } from "@/components/donate/donation-impact-calc";
import { WaysToGiveCard } from "@/components/donate/WaysToGiveCard";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { Dialog } from "@/components/retroui/Dialog";
import type { DonationFrequency } from "@/lib/stripe";

const STRIPE_MAX_CUSTOM_AMOUNT_USD = 999_999;
const MIKE_EMAIL = "m@warondisease.org";
const FEDERAL_TAX_BRACKET_RATE = 0.24;
const HOURS_PER_YEAR = 24 * 365;

const EXPECTED_IMPACT = deriveDonationImpact({
  votesNeeded: THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION.value,
  costPerVote: 2,
  successProbability: POLITICAL_SUCCESS_PROBABILITY.value,
  treatyReductionPct: TREATY_REDUCTION_PCT.value,
});

const HEALTHY_YEARS_PER_DOLLAR =
  EXPECTED_IMPACT.dalys / EXPECTED_IMPACT.campaignCostUsd;
const LIVES_PER_DOLLAR =
  EXPECTED_IMPACT.livesSaved / EXPECTED_IMPACT.campaignCostUsd;
const SUFFERING_YEARS_PER_DOLLAR =
  EXPECTED_IMPACT.sufferingHours / HOURS_PER_YEAR / EXPECTED_IMPACT.campaignCostUsd;

type ProductKey = "healthy-years" | "lives";

interface Product {
  description: string;
  key: ProductKey;
  label: string;
  noun: string;
  presets: number[];
  singularLabel: string;
  shortLabel: string;
  startQuantity: number;
  unitPriceUsd: number;
}

const PRODUCTS: Product[] = [
  {
    key: "healthy-years",
    label: "Healthy Life-Years",
    shortLabel: "years",
    singularLabel: "year",
    noun: "healthy life-years",
    description:
      "A risk-adjusted year of healthy human life from the 1% Treaty model.",
    startQuantity: 1_000,
    presets: [100, 1_000, 10_000],
    unitPriceUsd: 1 / HEALTHY_YEARS_PER_DOLLAR,
  },
  {
    key: "lives",
    label: "Lives Saved",
    shortLabel: "lives",
    singularLabel: "life",
    noun: "modeled lives saved",
    description:
      "The blunt unit: risk-adjusted lives saved by funding the campaign.",
    startQuantity: 1,
    presets: [1, 10, 100],
    unitPriceUsd: 1 / LIVES_PER_DOLLAR,
  },
];

const productByKey = Object.fromEntries(
  PRODUCTS.map((product) => [product.key, product]),
) as Record<ProductKey, Product>;

export default function DonatePage() {
  const searchParams = useSearchParams();
  const canceled = searchParams?.get("canceled") === "true";

  const [productKey, setProductKey] = useState<ProductKey>("healthy-years");
  const [quantity, setQuantity] = useState<string>(
    String(productByKey["healthy-years"].startQuantity),
  );
  const [frequency, setFrequency] = useState<DonationFrequency>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [majorGiftDialogOpen, setMajorGiftDialogOpen] = useState(false);

  const product = productByKey[productKey];
  const quantityNumber = Number(quantity.replace(/,/g, ""));
  const validQuantity = Number.isFinite(quantityNumber) && quantityNumber > 0;
  const rawPrice = validQuantity ? quantityNumber * product.unitPriceUsd : 0;
  const checkoutAmount = Math.max(1, Math.ceil(rawPrice));
  const exceedsCardLimit = checkoutAmount > STRIPE_MAX_CUSTOM_AMOUNT_USD;
  const purchasedHealthyYears = checkoutAmount * HEALTHY_YEARS_PER_DOLLAR;
  const purchasedLives = checkoutAmount * LIVES_PER_DOLLAR;
  const sufferingYearsPrevented = checkoutAmount * SUFFERING_YEARS_PER_DOLLAR;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!validQuantity) {
      setError("Enter a quantity above zero.");
      return;
    }

    if (exceedsCardLimit) {
      setMajorGiftDialogOpen(true);
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
          amount: checkoutAmount,
          donationType: frequency,
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

  function selectProduct(nextProduct: Product) {
    setProductKey(nextProduct.key);
    setQuantity(String(nextProduct.startQuantity));
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="border-b border-black pb-7">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Buy human life.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-700 sm:text-xl">
            Choose expected impact. Pick one-time or monthly. No account
            required before checkout.
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

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-6 border border-black p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Choose product</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {PRODUCTS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => selectProduct(option)}
                    className={[
                      "min-h-36 border p-4 text-left transition",
                      productKey === option.key
                        ? "border-black bg-black text-white"
                        : "border-black bg-white text-black hover:bg-neutral-100",
                    ].join(" ")}
                  >
                    <span className="block text-xl font-semibold">
                      {option.label}
                    </span>
                    <span
                      className={[
                        "mt-3 block text-sm leading-6",
                        productKey === option.key
                          ? "text-neutral-200"
                          : "text-neutral-700",
                      ].join(" ")}
                    >
                      {option.description}
                    </span>
                    <span className="mt-4 block text-sm font-semibold">
                      About ${formatMoney(option.unitPriceUsd)} per{" "}
                      {option.singularLabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
              <label className="block text-sm font-semibold">
                Quantity
                <input
                  className="mt-2 w-full border border-black px-3 py-3 text-2xl font-semibold outline-none focus:ring-2 focus:ring-black"
                  inputMode="numeric"
                  min={1}
                  type="number"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </label>
              <div className="text-sm leading-6 text-neutral-700">
                {validQuantity ? (
                  <>
                    You are buying{" "}
                    <strong className="text-black">
                      {formatQuantity(quantityNumber)} {product.noun}
                    </strong>
                    .
                  </>
                ) : (
                  "Enter a positive quantity."
                )}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Presets</p>
              <div className="grid grid-cols-3 gap-2">
                {product.presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="border border-black px-3 py-2 text-sm font-semibold hover:bg-black hover:text-white"
                    onClick={() => setQuantity(String(preset))}
                  >
                    {formatQuantity(preset)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Purchase type</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={toggleButtonClass(frequency === "monthly")}
                  onClick={() => setFrequency("monthly")}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={toggleButtonClass(frequency === "one-time")}
                  onClick={() => setFrequency("one-time")}
                >
                  One-time
                </button>
              </div>
            </div>

            {error ? (
              <div className="border border-black p-3 text-sm">{error}</div>
            ) : null}
          </section>

          <aside className="border border-black bg-black p-5 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.14em]">
              Your order
            </p>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm text-neutral-300">Product</p>
                <p className="text-2xl font-semibold">{product.label}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-300">Quantity</p>
                <p className="text-xl font-semibold">
                  {validQuantity ? formatQuantity(quantityNumber) : "0"}{" "}
                  {product.shortLabel}
                </p>
              </div>
              <div className="border-t border-white/30 pt-5">
                <p className="text-sm text-neutral-300">Total</p>
                <p className="text-5xl font-semibold tracking-tight">
                  ${checkoutAmount.toLocaleString()}
                  {frequency === "monthly" ? "/mo" : ""}
                </p>
                <p className="mt-2 text-xs leading-5 text-neutral-300">
                  Estimated out-of-pocket after federal deduction: $
                  {Math.round(
                    checkoutAmount * (1 - FEDERAL_TAX_BRACKET_RATE),
                  ).toLocaleString()}{" "}
                  if you itemize in a{" "}
                  {Math.round(FEDERAL_TAX_BRACKET_RATE * 100)}% bracket.
                </p>
              </div>

              <div className="space-y-2 border-t border-white/30 pt-5 text-sm">
                <ImpactLine
                  label="Expected healthy life-years"
                  value={formatQuantity(purchasedHealthyYears)}
                />
                <ImpactLine
                  label="Expected lives saved"
                  value={formatQuantity(purchasedLives, 1)}
                />
                <ImpactLine
                  label="Suffering-years prevented"
                  value={formatQuantity(sufferingYearsPrevented)}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !validQuantity}
                className="w-full border border-white bg-white px-5 py-3 text-base font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Opening Stripe..."
                  : exceedsCardLimit
                    ? "Email transfer instructions"
                    : `Checkout - $${checkoutAmount.toLocaleString()}${
                        frequency === "monthly" ? "/mo" : ""
                      }`}
              </button>
              <p className="text-xs leading-5 text-neutral-400">
                Stripe collects email and payment details on the next screen.
              </p>
            </div>
          </aside>
        </form>

        <details className="mt-8 border-t border-black pt-6">
          <summary className="cursor-pointer text-2xl font-semibold">
            How the estimate works
          </summary>
          <div className="mt-4 grid gap-5 text-sm leading-7 text-neutral-700 lg:grid-cols-2">
            <div className="space-y-4">
              <p>
                The estimate uses the skeptical model:{" "}
                <ParameterValue
                  param={THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION}
                  figures={2}
                />{" "}
                votes, $2 per vote,{" "}
                <ParameterValue param={POLITICAL_SUCCESS_PROBABILITY} figures={2} />{" "}
                treaty success probability, and a{" "}
                <ParameterValue param={TREATY_REDUCTION_PCT} figures={1} />{" "}
                military-spending redirect.
              </p>
              <p>
                That produces about{" "}
                <strong className="text-black">
                  ${fmtRaw(EXPECTED_IMPACT.costPerDaly, 3)}
                </strong>{" "}
                per expected healthy life-year and{" "}
                <strong className="text-black">
                  ${fmtRaw(EXPECTED_IMPACT.costPerLife, 3)}
                </strong>{" "}
                per expected life saved.
              </p>
              <p>
                The published reference estimate is{" "}
                <strong className="text-black">
                  <ParameterValue
                    param={{
                      ...TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
                      unit: "USD",
                    }}
                    figures={3}
                  />
                </strong>{" "}
                per healthy life-year. Anti-malaria bed nets are commonly
                benchmarked at{" "}
                <strong className="text-black">
                  <ParameterValue
                    param={{ ...BED_NETS_COST_PER_DALY, unit: "USD" }}
                    figures={2}
                  />
                </strong>
                .
              </p>
            </div>
            <div className="space-y-4">
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
                per healthy life-year than bed nets. Even at the skeptical
                success probability, expected impact is{" "}
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
                Historical public-health wins such as smallpox eradication (
                <ParameterValue param={SMALLPOX_ERADICATION_ROI} figures={3} />{" "}
                to 1) and childhood vaccination (
                <ParameterValue param={CHILDHOOD_VACCINATION_ROI} figures={2} />{" "}
                to 1) are included for comparison.
              </p>
              <p>
                Campaign cost baseline:{" "}
                <ParameterValue param={TREATY_CAMPAIGN_TOTAL_COST} figures={1} />
                . It converts your donation into the model's expected share of
                a political campaign.
              </p>
            </div>
          </div>
        </details>

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
              {STRIPE_MAX_CUSTOM_AMOUNT_USD.toLocaleString()}. This order wants{" "}
              ${checkoutAmount.toLocaleString()}. Use wire, stock, crypto, or
              DAF transfer instructions.
            </p>
            <a
              href={`mailto:${MIKE_EMAIL}?subject=${encodeURIComponent(
                `Large donation inquiry: $${checkoutAmount.toLocaleString()}`,
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

function ImpactLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-neutral-300">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function toggleButtonClass(active: boolean) {
  return [
    "border border-black px-4 py-2 text-sm font-semibold transition",
    active ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100",
  ].join(" ");
}

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return "many";
  if (value < 1) return value.toFixed(2);
  return Math.ceil(value).toLocaleString();
}

function formatQuantity(value: number, maximumFractionDigits = 0) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}
