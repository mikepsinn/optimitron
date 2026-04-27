"use client";

import { useMemo, useState } from "react";
import {
  POLITICAL_SUCCESS_PROBABILITY,
  THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION,
  TREATY_REDUCTION_PCT,
  fmtRaw,
} from "@optimitron/data/parameters";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Select } from "@/components/retroui/Select";
import { STATES } from "@/lib/tax-optimizer/brackets";
import {
  compareDonationStrategies,
  type AssetType,
  type HoldingPeriod,
  type StrategyOutcome,
  type TaxOptimizerInputs,
} from "@/lib/tax-optimizer/calculate";
import type { FilingStatus } from "@/lib/tax-optimizer/brackets";
import { deriveDonationImpact } from "./donation-impact-calc";

const SKEPTICAL_INPUTS = {
  votesNeeded: THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION.value,
  costPerVote: 2,
  successProbability: POLITICAL_SUCCESS_PROBABILITY.value,
  treatyReductionPct: TREATY_REDUCTION_PCT.value,
};
const skepticalImpact = deriveDonationImpact(SKEPTICAL_INPUTS);
const livesPerDollar =
  skepticalImpact.livesSaved / skepticalImpact.campaignCostUsd;
const dalysPerDollar = skepticalImpact.dalys / skepticalImpact.campaignCostUsd;
const sufferingHoursPerDollar =
  skepticalImpact.sufferingHours / skepticalImpact.campaignCostUsd;

interface Props {
  onClose?: () => void;
}

export function EarthOptimizationTaxCalculator({ onClose }: Props) {
  const [assetType, setAssetType] = useState<AssetType>("public-stock");
  const [fmv, setFmv] = useState("1000000");
  const [costBasis, setCostBasis] = useState("200000");
  const [holdingPeriod, setHoldingPeriod] =
    useState<HoldingPeriod>("long-term");
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("married");
  const [agi, setAgi] = useState("5000000");
  const [stateCode, setStateCode] = useState("CA");

  const inputs: TaxOptimizerInputs = {
    giftFmvUsd: Math.max(0, Number(fmv) || 0),
    costBasisUsd:
      assetType === "cash" ? 0 : Math.max(0, Number(costBasis) || 0),
    assetType,
    holdingPeriod,
    filingStatus,
    annualAgiUsd: Math.max(0, Number(agi) || 0),
    stateCode,
  };

  const comparison = useMemo(
    () => compareDonationStrategies(inputs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      inputs.giftFmvUsd,
      inputs.costBasisUsd,
      inputs.assetType,
      inputs.holdingPeriod,
      inputs.filingStatus,
      inputs.annualAgiUsd,
      inputs.stateCode,
    ],
  );

  const recommendedStrategy =
    comparison.directStrategy.charityReceivedUsd >=
    comparison.cashStrategy.charityReceivedUsd
      ? "direct"
      : "cash";
  const recommended =
    recommendedStrategy === "direct"
      ? comparison.directStrategy
      : comparison.cashStrategy;

  const livesAtRecommended = recommended.charityReceivedUsd * livesPerDollar;
  const dalysAtRecommended = recommended.charityReceivedUsd * dalysPerDollar;
  const sufferingHoursAtRecommended =
    recommended.charityReceivedUsd * sufferingHoursPerDollar;

  const allWarnings = [
    ...comparison.cashStrategy.warnings,
    ...comparison.directStrategy.warnings,
  ];

  return (
    <div className="space-y-5 text-foreground">
      <div className="border-l-4 border-primary bg-muted/40 p-3 text-xs font-bold leading-snug">
        Not tax advice. U.S.-only. Uses 2024 federal brackets and top-marginal
        state rates. Real return preparation requires your CPA, your AGI as
        actually filed, AMT analysis, and review of any state-specific
        provisions.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Asset type">
          <RadioGroup
            options={[
              { value: "cash", label: "Cash" },
              { value: "public-stock", label: "Public stock" },
              { value: "crypto", label: "Crypto" },
              { value: "private-stock", label: "Private stock" },
            ]}
            value={assetType}
            onChange={(v) => setAssetType(v as AssetType)}
          />
        </FieldGroup>

        <FieldGroup label="Holding period">
          <RadioGroup
            options={[
              { value: "long-term", label: ">1 year" },
              { value: "short-term", label: "<1 year" },
            ]}
            value={holdingPeriod}
            onChange={(v) => setHoldingPeriod(v as HoldingPeriod)}
            disabled={assetType === "cash"}
          />
        </FieldGroup>

        <FieldGroup label="Asset value (FMV)">
          <Input
            type="number"
            min={0}
            step={1000}
            value={fmv}
            onChange={(e) => setFmv(e.target.value)}
          />
        </FieldGroup>

        <FieldGroup label="Cost basis">
          <Input
            type="number"
            min={0}
            step={1000}
            value={costBasis}
            onChange={(e) => setCostBasis(e.target.value)}
            disabled={assetType === "cash"}
          />
        </FieldGroup>

        <FieldGroup label="Filing status">
          <RadioGroup
            options={[
              { value: "single", label: "Single" },
              { value: "married", label: "Married jointly" },
            ]}
            value={filingStatus}
            onChange={(v) => setFilingStatus(v as FilingStatus)}
          />
        </FieldGroup>

        <FieldGroup label="Annual AGI">
          <Input
            type="number"
            min={0}
            step={1000}
            value={agi}
            onChange={(e) => setAgi(e.target.value)}
          />
        </FieldGroup>

        <FieldGroup label="State of residence" className="sm:col-span-2">
          <Select value={stateCode} onValueChange={setStateCode}>
            <Select.Trigger className="w-full">
              <Select.Value placeholder="Pick a state" />
            </Select.Trigger>
            <Select.Content>
              {STATES.map((state) => (
                <Select.Item key={state.code} value={state.code}>
                  {state.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </FieldGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StrategyCard
          title="Strategy A: Sell, then donate cash"
          subtitle="Liquidate first. Pay capital gains. Donate the net."
          outcome={comparison.cashStrategy}
          highlighted={recommendedStrategy === "cash"}
        />
        <StrategyCard
          title="Strategy B: Donate the asset directly"
          subtitle="Hand the shares / coins / etc. to the charity. No sale, no cap gains."
          outcome={comparison.directStrategy}
          highlighted={recommendedStrategy === "direct"}
        />
      </div>

      {comparison.extraDollarsToCharity > 0 ? (
        <div className="border-4 border-primary bg-brutal-pink p-4 text-brutal-pink-foreground space-y-2">
          <p className="font-black uppercase text-sm tracking-[0.14em]">
            Wishonia&apos;s recommendation
          </p>
          <p className="font-black text-lg leading-snug">
            Donate the asset directly. The treaty receives{" "}
            <strong>${formatMoney(comparison.extraDollarsToCharity)}</strong>{" "}
            more, and your out-of-pocket drops by{" "}
            <strong>${formatMoney(comparison.extraOutOfPocket)}</strong>.
          </p>
          <p className="font-bold text-sm">
            That extra ${formatMoney(comparison.extraDollarsToCharity)} buys{" "}
            <strong>
              {(comparison.extraDollarsToCharity * livesPerDollar).toFixed(2)}{" "}
              lives
            </strong>{" "}
            and{" "}
            <strong>
              {Math.round(
                comparison.extraDollarsToCharity * dalysPerDollar,
              ).toLocaleString()}{" "}
              healthy life-years
            </strong>{" "}
            at the risk-adjusted model. Choosing Strategy A funds{" "}
            {Math.round(
              comparison.extraDollarsToCharity * livesPerDollar,
            ).toLocaleString()}{" "}
            preventable deaths instead of preventing them. The cap gains tax
            funds the missiles. Don&apos;t fund the missiles.
          </p>
        </div>
      ) : null}

      <div className="border-4 border-primary p-4 space-y-2 bg-muted/30">
        <p className="font-black uppercase text-sm tracking-[0.14em]">
          Impact at recommended strategy ({recommendedStrategy === "direct" ? "B" : "A"})
        </p>
        <p className="font-bold text-base">
          ${formatMoney(recommended.charityReceivedUsd)} to the treaty →
        </p>
        <ul className="text-sm font-bold space-y-1 list-disc list-inside">
          <li>
            <strong>{livesAtRecommended.toFixed(1)} lives</strong> permanently
            not stopped
          </li>
          <li>
            <strong>
              {Math.round(dalysAtRecommended).toLocaleString()} healthy
              life-years
            </strong>{" "}
            added to humanity
          </li>
          <li>
            <strong>
              {Math.round(sufferingHoursAtRecommended).toLocaleString()} hours
              of suffering
            </strong>{" "}
            prevented
          </li>
        </ul>
        <p className="text-xs font-bold opacity-70">
          Risk-adjusted at {(POLITICAL_SUCCESS_PROBABILITY.value * 100).toFixed(0)}%
          treaty success probability. Conditional-success figures are roughly{" "}
          {Math.round(1 / POLITICAL_SUCCESS_PROBABILITY.value).toLocaleString()}x
          higher.
        </p>
      </div>

      {allWarnings.length > 0 ? (
        <div className="border-4 border-primary bg-brutal-yellow p-4 text-brutal-yellow-foreground space-y-2">
          <p className="font-black uppercase text-sm tracking-[0.14em]">
            Caveats
          </p>
          <ul className="text-sm font-bold space-y-1 list-disc list-inside">
            {allWarnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          asChild
          className="w-full"
        >
          <a
            href={`mailto:m@warondisease.org?subject=${encodeURIComponent(
              "Major-gift transfer: " +
                (assetType === "cash"
                  ? "wire"
                  : assetType === "crypto"
                    ? "crypto"
                    : "stock") +
                " — $" +
                formatMoney(inputs.giftFmvUsd),
            )}`}
          >
            Email transfer instructions →
          </a>
        </Button>
        {onClose ? (
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function StrategyCard({
  title,
  subtitle,
  outcome,
  highlighted,
}: {
  title: string;
  subtitle: string;
  outcome: StrategyOutcome;
  highlighted: boolean;
}) {
  return (
    <div
      className={`border-4 border-primary p-4 space-y-3 ${
        highlighted ? "bg-brutal-cyan text-brutal-cyan-foreground" : "bg-background"
      }`}
    >
      <div className="space-y-1">
        <p className="font-black uppercase text-sm tracking-[0.1em]">{title}</p>
        <p className="text-xs font-bold opacity-80">{subtitle}</p>
      </div>
      <div className="space-y-1.5 text-sm">
        <Row label="Charity receives" value={`$${formatMoney(outcome.charityReceivedUsd)}`} bold />
        <Row
          label="Capital gains tax paid"
          value={`$${formatMoney(outcome.capitalGainsTaxPaidUsd)}`}
          dim={outcome.capitalGainsTaxPaidUsd === 0}
        />
        <Row
          label="Federal income tax saved"
          value={`$${formatMoney(outcome.federalIncomeTaxSavedUsd)}`}
        />
        <Row
          label="State income tax saved"
          value={`$${formatMoney(outcome.stateIncomeTaxSavedUsd)}`}
        />
        <div className="border-t-2 border-current pt-2">
          <Row
            label="Out-of-pocket cost"
            value={`$${formatMoney(outcome.outOfPocketCostUsd)}`}
            bold
          />
          <Row
            label="Effective leverage"
            value={
              Number.isFinite(outcome.effectiveLeverage)
                ? `${fmtRaw(outcome.effectiveLeverage, 3)}x`
                : "∞"
            }
            bold
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  dim,
}: {
  label: string;
  value: string;
  bold?: boolean;
  dim?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${
        dim ? "opacity-50" : ""
      }`}
    >
      <span className={bold ? "font-black" : "font-bold"}>{label}</span>
      <span className={`tabular-nums ${bold ? "font-black" : "font-bold"}`}>
        {value}
      </span>
    </div>
  );
}

function FieldGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <label className="text-xs font-black uppercase tracking-[0.14em]">
        {label}
      </label>
      {children}
    </div>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
  disabled,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`border-2 border-primary px-2 py-1.5 text-xs font-black uppercase ${
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "bg-background text-foreground hover:bg-muted"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  if (Math.abs(value) >= 1_000_000) return fmtRaw(value, 3);
  return Math.round(value).toLocaleString();
}
