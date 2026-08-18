"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  BED_NETS_COST_PER_DALY,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  GLOBAL_REGISTERED_VOTERS,
  POLITICAL_SUCCESS_PROBABILITY,
  THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION,
  TREATY_CAMPAIGN_TOTAL_COST,
  TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  TREATY_EXPECTED_COST_PER_DALY,
  TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER,
  TREATY_REDUCTION_PCT,
  TREATY_VS_BED_NETS_MULTIPLIER,
} from "@optimitron/data/parameters";
import { Dialog } from "@/components/retroui/Dialog";
import { NONPROFIT } from "@/lib/nonprofit-identity";
import type { DonationFrequency } from "@/lib/stripe";
import { DonationCalculationNarrative } from "./DonationCalculationNarrative";
import { deriveDonationImpact } from "./donation-impact-calc";

const STRIPE_MAX_CUSTOM_AMOUNT_USD = 999_999;
const HOURS_PER_YEAR = 24 * 365;
const FEDERAL_TAX_BRACKET_RATE = 0.24;

const COST_PER_VOTE_MIN = 0.5;
const COST_PER_VOTE_MAX = 10;
const COST_PER_VOTE_DEFAULT = 2;
const COST_PER_VOTE_STEP = 0.1;

const VOTES_MIN = Math.round(
  THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION.value,
);
const VOTES_MAX = Math.round(GLOBAL_REGISTERED_VOTERS.value);
const VOTES_DEFAULT = Math.round(
  TREATY_CAMPAIGN_TOTAL_COST.value / COST_PER_VOTE_DEFAULT,
);
const VOTES_STEP = 10_000_000;

const SUCCESS_MIN = POLITICAL_SUCCESS_PROBABILITY.value;
const SUCCESS_MAX = 1;
// Default 10% - Ottawa Treaty-anchored central estimate. Slider goes 1%
// (skeptical floor) to 100% (if it works).
const SUCCESS_DEFAULT = 0.10;
const SUCCESS_STEP = 0.01;

const REDUCTION_MIN = 0.005;
const REDUCTION_MAX = 0.05;
const REDUCTION_DEFAULT = TREATY_REDUCTION_PCT.value;
const REDUCTION_STEP = 0.001;

type Field = "usd" | "lives" | "sufferingYears";

interface Draft {
  field: Field;
  value: string;
}

const FIELD_LABELS: Record<Field, string> = {
  usd: "Your donation (USD)",
  lives: "Lives saved",
  sufferingYears: "Years of suffering and disability prevented",
};

export function DonationImpactCalculator() {
  const searchParams = useSearchParams();
  const canceled = searchParams?.get("canceled") === "true";

  const [votesNeeded, setVotesNeeded] = useState(VOTES_DEFAULT);
  const [costPerVote, setCostPerVote] = useState(COST_PER_VOTE_DEFAULT);
  const [successProbability, setSuccessProbability] = useState(SUCCESS_DEFAULT);
  const [treatyReductionPct, setTreatyReductionPct] =
    useState(REDUCTION_DEFAULT);
  const [draft, setDraft] = useState<Draft>({ field: "usd", value: "100" });
  const [frequency, setFrequency] = useState<DonationFrequency>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [largeGiftOpen, setLargeGiftOpen] = useState(false);

  const derived = useMemo(
    () =>
      deriveDonationImpact({
        votesNeeded,
        costPerVote,
        successProbability,
        treatyReductionPct,
      }),
    [votesNeeded, costPerVote, successProbability, treatyReductionPct],
  );

  const livesPerDollar = derived.livesSaved / derived.campaignCostUsd;
  const sufferingYearsPerDollar =
    derived.sufferingHours / HOURS_PER_YEAR / derived.campaignCostUsd;
  const reductionRatio = treatyReductionPct / TREATY_REDUCTION_PCT.value;
  const sufferingYears = derived.sufferingHours / HOURS_PER_YEAR;

  const draftRaw = parseNumber(draft.value);
  const usdFromDraft = (() => {
    if (!Number.isFinite(draftRaw) || draftRaw <= 0) return 0;
    if (draft.field === "usd") return draftRaw;
    if (draft.field === "lives") return draftRaw / livesPerDollar;
    return draftRaw / sufferingYearsPerDollar;
  })();

  function valueFor(field: Field): number {
    if (field === "usd") return usdFromDraft;
    if (field === "lives") return usdFromDraft * livesPerDollar;
    return usdFromDraft * sufferingYearsPerDollar;
  }

  function displayFor(field: Field): string {
    if (field === draft.field) return draft.value;
    const value = valueFor(field);
    if (!Number.isFinite(value) || value <= 0) return "";
    if (field === "usd") return formatNumber(value, 2);
    return formatQuantity(value);
  }

  function handleFieldChange(field: Field, value: string) {
    setDraft({ field, value });
  }

  const checkoutAmount = Math.max(1, Math.ceil(usdFromDraft));
  const exceedsCardLimit = checkoutAmount > STRIPE_MAX_CUSTOM_AMOUNT_USD;
  const hasValidAmount = usdFromDraft > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!hasValidAmount) {
      setError("Enter an amount above zero in any box.");
      return;
    }

    if (exceedsCardLimit) {
      setLargeGiftOpen(true);
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

  function reset() {
    setVotesNeeded(VOTES_DEFAULT);
    setCostPerVote(COST_PER_VOTE_DEFAULT);
    setSuccessProbability(SUCCESS_DEFAULT);
    setTreatyReductionPct(REDUCTION_DEFAULT);
  }

  return (
    <form onSubmit={handleSubmit} className="border-2 border-foreground">
      {canceled ? (
        <div className="border-b-2 border-foreground p-4 text-sm font-bold">
          Checkout canceled. Nothing was charged.
        </div>
      ) : null}

      <div className="grid gap-0 lg:grid-cols-2">
        <div className="space-y-6 border-b-2 border-foreground p-5 sm:p-6 lg:border-b-0 lg:border-r-2">
          <h2 className="text-2xl font-black uppercase">
            How much death and suffering do you want to prevent?
          </h2>
          <p className="text-sm font-bold leading-6 text-muted-foreground">
            Enter a donation amount, a lives-saved target, or years of
            suffering prevented. The other boxes recalculate from the treaty
            campaign model. These are probability-adjusted estimates, not a
            receipt from the universe.{" "}
            <a
              href="#how-this-is-calculated"
              className="font-bold underline underline-offset-2"
            >
              See how this is calculated ↓
            </a>
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(Object.keys(FIELD_LABELS) as Field[]).map((field) => (
              <label key={field} className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {FIELD_LABELS[field]}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="mt-1 w-full border-2 border-foreground bg-background px-3 py-3 text-2xl font-bold tabular-nums outline-none focus:ring-2 focus:ring-foreground"
                  value={displayFor(field)}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleFieldChange(field, e.target.value)
                  }
                />
              </label>
            ))}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Frequency
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFrequency("monthly")}
                className={toggleClass(frequency === "monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setFrequency("one-time")}
                className={toggleClass(frequency === "one-time")}
              >
                One-time
              </button>
            </div>
          </div>

          {error ? (
            <div className="border-2 border-foreground p-3 text-sm font-bold">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !hasValidAmount}
            className="w-full border-2 border-foreground bg-foreground px-5 py-4 text-base font-bold text-background transition hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Opening Stripe..."
              : exceedsCardLimit
                ? "Email transfer instructions"
                : `Donate $${checkoutAmount.toLocaleString()}${frequency === "monthly" ? "/mo" : ""}`}
          </button>

          <p className="text-xs font-bold leading-5 text-muted-foreground">
            Estimated out-of-pocket after federal deduction: $
            {Math.round(
              checkoutAmount * (1 - FEDERAL_TAX_BRACKET_RATE),
            ).toLocaleString()}{" "}
            if you itemize in a {Math.round(FEDERAL_TAX_BRACKET_RATE * 100)}%
            bracket. Processed for {NONPROFIT.legalName} (EIN {NONPROFIT.ein}),
            a U.S. 501(c)(3) public charity.
          </p>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-2xl font-black uppercase">Adjust the model</h2>
            <button
              type="button"
              onClick={reset}
              className="text-xs font-bold uppercase tracking-wide underline"
            >
              Reset
            </button>
          </div>
          <p className="text-sm font-bold leading-6 text-muted-foreground">
            Don&apos;t trust an assumption? Drag it. The math doesn&apos;t care.
            Every box on the left recomputes.
          </p>
          <div className="border-2 border-foreground p-3 text-sm font-bold leading-6">
            <p>Published campaign model</p>
            <p className="text-muted-foreground">
              If it works: $
              {formatPrice(
                TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG.value,
              )}
              /DALY,{" "}
              {Math.round(TREATY_VS_BED_NETS_MULTIPLIER.value).toLocaleString()}
              × bed nets. Risk-adjusted at 1% success: $
              {formatPrice(TREATY_EXPECTED_COST_PER_DALY.value)}/DALY,{" "}
              {Math.round(
                TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER.value,
              ).toLocaleString()}
              × bed nets. Bed nets are $
              {formatPrice(BED_NETS_COST_PER_DALY.value)}/DALY.
            </p>
            <p className="mt-2 text-muted-foreground">
              Assuming a 99% chance humanity fumbles this, this model still
              estimates the treaty campaign is{" "}
              {Math.round(
                TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER.value,
              ).toLocaleString()}
              × more cost-effective than bed nets per healthy life-year. If
              that sounds insane, good. Change the assumptions or attack the
              citations below.
            </p>
          </div>

          <SliderRow
            label="Voter-equivalent reach needed"
            valueText={formatNumber(votesNeeded)}
            footnote={`Default: ${formatNumber(VOTES_DEFAULT)} people at $${COST_PER_VOTE_DEFAULT.toFixed(2)} each, matching the published $${formatNumber(TREATY_CAMPAIGN_TOTAL_COST.value)} campaign model.`}
            min={VOTES_MIN}
            max={VOTES_MAX}
            step={VOTES_STEP}
            value={votesNeeded}
            onChange={setVotesNeeded}
          />
          <SliderRow
            label="Cost to reach one voter"
            valueText={`$${costPerVote.toFixed(2)}`}
            prefix="$"
            footnote="Meta and Google petition CPC. Cheaper if it goes viral."
            min={COST_PER_VOTE_MIN}
            max={COST_PER_VOTE_MAX}
            step={COST_PER_VOTE_STEP}
            value={costPerVote}
            onChange={setCostPerVote}
          />
          <SliderRow
            label="Political success probability"
            valueText={`${(successProbability * 100).toFixed(successProbability < 0.1 ? 1 : 0)}%`}
            inputScale={100}
            suffix="%"
            footnote="Default 10%. Drag to 1% for the skeptical floor or 100% for the if-it-works case."
            min={SUCCESS_MIN}
            max={SUCCESS_MAX}
            step={SUCCESS_STEP}
            value={successProbability}
            onChange={setSuccessProbability}
          />
          <SliderRow
            label="Share of military spending the treaty redirects"
            valueText={`${(treatyReductionPct * 100).toFixed(2)}%`}
            inputScale={100}
            suffix="%"
            footnote="Default 1% — the treaty as written. Linear above 1%."
            min={REDUCTION_MIN}
            max={REDUCTION_MAX}
            step={REDUCTION_STEP}
            value={treatyReductionPct}
            onChange={setTreatyReductionPct}
          />

          <div className="border-t-2 border-foreground pt-4 text-sm font-bold leading-6">
            <Row label="Lives saved per $1">
              {formatQuantity(livesPerDollar)}
            </Row>
            <Row label="Years of suffering prevented per $1">
              {formatQuantity(sufferingYearsPerDollar)}
            </Row>
            <Row label="Cost per life saved">
              ${formatPrice(1 / livesPerDollar)}
            </Row>
            <Row label="Cost per year of suffering and disability prevented">
              ${formatPrice(1 / sufferingYearsPerDollar)}
            </Row>
            <Row label="Cost-effectiveness vs bed nets">
              {formatQuantity(derived.vsBedNetsMultiplier)}×
            </Row>
            <Row label="Total campaign cost">
              ${formatNumber(derived.campaignCostUsd)}
            </Row>
          </div>

          <details className="border-t-2 border-foreground pt-4 text-sm font-bold">
            <summary className="cursor-pointer font-bold">
              Live derivation
            </summary>
            <div
              id="formula-view"
              className="mt-4 scroll-mt-8 space-y-3"
            >
              <DerivationRow
                formula={`${formatNumber(votesNeeded)} people × $${costPerVote.toFixed(2)}`}
                label="Campaign cost"
                value={`$${formatNumber(derived.campaignCostUsd)}`}
              />
              <DerivationRow
                formula={`${formatNumber(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value)} conditional lives × ${(successProbability * 100).toFixed(successProbability < 0.1 ? 1 : 0)}% success × ${reductionRatio.toFixed(2)} treaty scale`}
                label="Expected lives saved"
                value={formatQuantity(derived.livesSaved)}
              />
              <DerivationRow
                formula={`${formatNumber(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.value)} conditional DALYs × ${(successProbability * 100).toFixed(successProbability < 0.1 ? 1 : 0)}% success × ${reductionRatio.toFixed(2)} treaty scale`}
                label="Expected healthy life-years"
                value={formatQuantity(derived.dalys)}
              />
              <DerivationRow
                formula={`${formatQuantity(derived.dalys)} healthy life-years ÷ $${formatNumber(derived.campaignCostUsd)}`}
                label="Healthy life-years per $1"
                value={formatQuantity(derived.dalys / derived.campaignCostUsd)}
              />
              <DerivationRow
                formula={`$${formatNumber(derived.campaignCostUsd)} ÷ ${formatQuantity(derived.dalys)} healthy life-years`}
                label="Cost per healthy life-year"
                value={`$${formatPrice(derived.costPerDaly)}`}
              />
              <DerivationRow
                formula={`$${formatPrice(BED_NETS_COST_PER_DALY.value)} bed nets ÷ $${formatPrice(derived.costPerDaly)} treaty`}
                label="Cost-effectiveness vs bed nets"
                value={`${formatQuantity(derived.vsBedNetsMultiplier)}×`}
              />
              <DerivationRow
                formula={`${formatQuantity(derived.sufferingHours)} suffering hours ÷ ${HOURS_PER_YEAR.toLocaleString()}`}
                label="Years of suffering prevented"
                value={formatQuantity(sufferingYears)}
              />
            </div>
          </details>
        </div>
      </div>

      <DonationCalculationNarrative
        costPerVote={costPerVote}
        derived={derived}
        onCostPerVoteChange={setCostPerVote}
        onSuccessProbabilityChange={setSuccessProbability}
        onTreatyReductionPctChange={setTreatyReductionPct}
        onVotesNeededChange={setVotesNeeded}
        successProbability={successProbability}
        treatyReductionPct={treatyReductionPct}
        votesNeeded={votesNeeded}
      />

      <Dialog open={largeGiftOpen} onOpenChange={setLargeGiftOpen}>
        <Dialog.Content title="Large gift">
          <div className="space-y-4 p-5 text-sm font-bold leading-6">
            <p>
              Card checkout is capped at $
              {STRIPE_MAX_CUSTOM_AMOUNT_USD.toLocaleString()}. This order wants
              ${checkoutAmount.toLocaleString()}. Use wire, stock, crypto, or
              DAF transfer instructions.
            </p>
            <a
              href={`mailto:${NONPROFIT.donationsEmail}?subject=${encodeURIComponent(
                `Large donation inquiry: $${checkoutAmount.toLocaleString()}`,
              )}`}
              className="inline-block border-2 border-foreground bg-foreground px-4 py-2 font-bold text-background"
            >
              Email transfer instructions
            </a>
          </div>
        </Dialog.Content>
      </Dialog>
    </form>
  );
}

function SliderRow({
  label,
  valueText,
  footnote,
  inputScale = 1,
  min,
  max,
  prefix,
  step,
  suffix,
  value,
  onChange,
}: {
  label: string;
  valueText: string;
  footnote: string;
  inputScale?: number;
  min: number;
  max: number;
  prefix?: string;
  step: number;
  suffix?: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const [rawInput, setRawInput] = useState<string | null>(null);
  const scaledValue = value * inputScale;
  const scaledStep = step * inputScale;
  const computedInputValue =
    scaledStep >= 1
      ? String(Math.round(scaledValue))
      : String(Number(scaledValue.toFixed(3)));
  const inputValue = rawInput ?? computedInputValue;

  function handleNumberInput(raw: string) {
    setRawInput(raw);
    if (!raw.trim()) return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    onChange(clamp(parsed / inputScale, min, max));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-bold">{label}</label>
        <label className="flex shrink-0 items-center border-2 border-foreground bg-background px-2 py-1 text-sm font-bold tabular-nums">
          <span className="sr-only">{label}</span>
          {prefix ? <span>{prefix}</span> : null}
          <input
            type="number"
            min={min * inputScale}
            max={max * inputScale}
            step={scaledStep}
            value={inputValue}
            onChange={(e) => handleNumberInput(e.target.value)}
            onBlur={() => setRawInput(null)}
            className="w-24 bg-transparent text-right outline-none"
          />
          {suffix ? <span className="pl-1">{suffix}</span> : null}
        </label>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-foreground"
        aria-label={label}
      />
      <p className="text-xs font-bold leading-5 text-muted-foreground">
        {valueText}. {footnote}
      </p>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums">{children}</span>
    </div>
  );
}

function DerivationRow({
  formula,
  label,
  value,
}: {
  formula: string;
  label: string;
  value: string;
}) {
  return (
    <div className="border-2 border-foreground p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-bold">{label}</span>
        <span className="font-bold tabular-nums">{value}</span>
      </div>
      <p className="mt-1 text-xs font-bold leading-5 text-muted-foreground">
        {formula}
      </p>
    </div>
  );
}

function toggleClass(active: boolean) {
  return [
    "border-2 border-foreground px-4 py-2 text-sm font-bold transition",
    active
      ? "bg-foreground text-background"
      : "bg-background text-foreground hover:bg-muted",
  ].join(" ");
}

function parseNumber(raw: string): number {
  const cleaned = raw.replace(/[\s,]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// For lives / DALYs / suffering-years: ≥3 significant figures per the
// calculator-page rule. Previously truncated to integer for `value >= 1`
// which made a $1 donation's 2.34 averted years display as "2".
// Big values (≥100) get full integer + commas (already ≥3 sig figs and
// avoids scientific notation that `toPrecision` falls back to past 4
// digits); smaller values use `toPrecision(3)` which keeps decimals.
function formatQuantity(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value >= 100) return formatNumber(value, 0);
  return value.toPrecision(3);
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1)
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 0.01) return value.toFixed(2);
  return value.toPrecision(2);
}
