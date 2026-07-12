"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  GPU_COMPUTE_CARDS,
  GPU_COMPUTE_MACRO,
  type GpuComputeCard,
} from "@optimitron/data";
import { copyTextToClipboard } from "@/lib/clipboard";
import { evaluateRig, type RigScenario } from "@/lib/gpu-irr";
import { ROUTES } from "@/lib/routes";

export interface CalculatorInitialState {
  cardId?: string;
  cardCount?: number;
  pricePerCard?: number;
  utilizationPct?: number;
  rentalPerHour?: number;
  electricityPerKwh?: number;
  residualGrowthPct?: number;
  horizonMonths?: number;
  marketplaceFeePct?: number;
}

const CARD_COUNTS = [1, 2, 4, 8] as const;

type PresetKey = "boom" | "base" | "bust";

function midUsedPrice(card: GpuComputeCard): number {
  return Math.round((card.usedPriceLowUsd + card.usedPriceHighUsd) / 2);
}

function midRental(card: GpuComputeCard): number {
  return round2((card.rentalLowPerHourUsd + card.rentalHighPerHourUsd) / 2);
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function fmtUsd(x: number): string {
  const sign = x < 0 ? "-" : "";
  return `${sign}$${Math.round(Math.abs(x)).toLocaleString("en-US")}`;
}

function fmtPct(x: number, digits = 1): string {
  return `${(x * 100).toFixed(digits)}%`;
}

export function ComputeCalculator({
  initial,
}: {
  initial?: CalculatorInitialState;
}) {
  const defaultCard =
    GPU_COMPUTE_CARDS.find((c) => c.id === initial?.cardId) ??
    GPU_COMPUTE_CARDS.find((c) => c.id === "rtx-pro-6000") ??
    GPU_COMPUTE_CARDS[0]!;

  const [cardId, setCardId] = useState(defaultCard.id);
  const [cardCount, setCardCount] = useState(initial?.cardCount ?? 4);
  const [pricePerCard, setPricePerCard] = useState(
    initial?.pricePerCard ?? midUsedPrice(defaultCard),
  );
  const [utilizationPct, setUtilizationPct] = useState(
    initial?.utilizationPct ?? 40,
  );
  const [rentalPerHour, setRentalPerHour] = useState(
    initial?.rentalPerHour ?? defaultCard.rentalLowPerHourUsd,
  );
  const [electricityPerKwh, setElectricityPerKwh] = useState(
    initial?.electricityPerKwh ??
      GPU_COMPUTE_MACRO.usResidentialElectricityUsdPerKwh.value,
  );
  const [residualGrowthPct, setResidualGrowthPct] = useState(
    initial?.residualGrowthPct ?? 0,
  );
  const [horizonMonths, setHorizonMonths] = useState(
    initial?.horizonMonths ?? 36,
  );
  const [marketplaceFeePct, setMarketplaceFeePct] = useState(
    initial?.marketplaceFeePct ?? 20,
  );
  const [copyState, setCopyState] = useState<"copied" | "idle">("idle");

  const card =
    GPU_COMPUTE_CARDS.find((c) => c.id === cardId) ?? defaultCard;

  function selectCard(next: GpuComputeCard) {
    setCardId(next.id);
    setPricePerCard(midUsedPrice(next));
    setRentalPerHour(next.rentalLowPerHourUsd);
  }

  function applyPreset(preset: PresetKey) {
    if (preset === "boom") {
      setResidualGrowthPct(25);
      setUtilizationPct(60);
      setRentalPerHour(midRental(card));
    } else if (preset === "base") {
      setResidualGrowthPct(0);
      setUtilizationPct(40);
      setRentalPerHour(card.rentalLowPerHourUsd);
    } else {
      setResidualGrowthPct(-35);
      setUtilizationPct(20);
      setRentalPerHour(round2(card.rentalLowPerHourUsd * 0.6));
    }
  }

  const scenario: RigScenario = useMemo(
    () => ({
      cardCount,
      pricePerCard,
      tdpWatts: card.tdpWatts,
      utilization: utilizationPct / 100,
      rentalPerCardHour: rentalPerHour,
      marketplaceFee: marketplaceFeePct / 100,
      electricityPerKwh,
      residualAnnualGrowth: residualGrowthPct / 100,
      horizonMonths,
    }),
    [
      card.tdpWatts,
      cardCount,
      electricityPerKwh,
      horizonMonths,
      marketplaceFeePct,
      pricePerCard,
      rentalPerHour,
      residualGrowthPct,
      utilizationPct,
    ],
  );

  const outcome = useMemo(() => evaluateRig(scenario), [scenario]);

  function handleCopyLink() {
    const params = new URLSearchParams({
      card: cardId,
      n: String(cardCount),
      price: String(pricePerCard),
      util: String(utilizationPct),
      rate: String(rentalPerHour),
      kwh: String(electricityPerKwh),
      growth: String(residualGrowthPct),
      mo: String(horizonMonths),
      fee: String(marketplaceFeePct),
    });
    const url = `${window.location.origin}${ROUTES.compute}?${params.toString()}`;
    void copyTextToClipboard(url).then(() => {
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    });
  }

  return (
    <div className="border-2 border-foreground">
      <div className="border-b-2 border-foreground p-4 sm:p-6">
        <p className="text-sm font-black uppercase">1. Pick the card</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {GPU_COMPUTE_CARDS.map((c) => (
            <button
              className={`border-2 border-foreground px-3 py-2 text-xs font-black uppercase sm:text-sm ${
                c.id === card.id
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
              key={c.id}
              onClick={() => selectCard(c)}
              type="button"
            >
              {c.name}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm font-bold text-muted-foreground">
          {card.vramGb} GB · {card.tdpWatts} W · used{" "}
          {fmtUsd(card.usedPriceLowUsd)}–{fmtUsd(card.usedPriceHighUsd)}{" "}
          <a
            className="underline underline-offset-4"
            href={card.usedPriceSourceUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            (as of {card.usedPriceAsOf})
          </a>{" "}
          ·{" "}
          <a
            className="underline underline-offset-4"
            href={card.ebaySearchUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            current eBay listings
          </a>
        </p>
        <p className="mt-1 text-sm font-bold text-muted-foreground">
          Runs locally: {card.runsLocally}
        </p>
      </div>

      <div className="border-b-2 border-foreground p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-black uppercase">2. Set the scenario</p>
          <div className="flex gap-2">
            {(
              [
                ["boom", "Boom"],
                ["base", "Base"],
                ["bust", "Bust"],
              ] as const
            ).map(([key, label]) => (
              <button
                className="border-2 border-foreground bg-background px-3 py-1 text-xs font-black uppercase text-foreground hover:bg-foreground hover:text-background"
                key={key}
                onClick={() => applyPreset(key)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2">
          <div className="border-b-2 border-foreground py-4">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="uppercase">Cards</span>
              <span>
                {cardCount} × {fmtUsd(pricePerCard)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {CARD_COUNTS.map((n) => (
                <button
                  className={`border-2 border-foreground px-3 py-1 text-xs font-black ${
                    n === cardCount
                      ? "bg-foreground text-background"
                      : "bg-background text-foreground hover:bg-muted"
                  }`}
                  key={n}
                  onClick={() => setCardCount(n)}
                  type="button"
                >
                  {n}
                </button>
              ))}
              <label className="ml-auto flex items-center gap-2 text-xs font-bold uppercase">
                Price paid / card
                <input
                  className="w-28 border-2 border-foreground bg-background px-2 py-1 text-sm font-bold"
                  min={0}
                  onChange={(e) => setPricePerCard(Number(e.target.value) || 0)}
                  type="number"
                  value={pricePerCard}
                />
              </label>
            </div>
          </div>

          <Slider
            format={(v) => `${v}% of hours`}
            label="Rented out"
            max={95}
            min={0}
            onChange={setUtilizationPct}
            step={5}
            value={utilizationPct}
          />
          <Slider
            format={(v) => `$${v.toFixed(2)}/card-hour`}
            label="Rental rate"
            max={round2(card.rentalHighPerHourUsd * 1.5)}
            min={0}
            onChange={setRentalPerHour}
            step={0.01}
            value={rentalPerHour}
          />
          <Slider
            format={(v) => `${(v * 100).toFixed(1)}¢/kWh`}
            label="Electricity"
            max={0.45}
            min={0.05}
            onChange={setElectricityPerKwh}
            step={0.005}
            value={electricityPerKwh}
          />
          <Slider
            format={(v) => `${v > 0 ? "+" : ""}${v}%/yr resale drift`}
            label="Resale value"
            max={40}
            min={-40}
            onChange={setResidualGrowthPct}
            step={5}
            value={residualGrowthPct}
          />
          <Slider
            format={(v) => `${v} months`}
            label="Holding period"
            max={60}
            min={12}
            onChange={setHorizonMonths}
            step={6}
            value={horizonMonths}
          />
          <Slider
            format={(v) => `${v}% marketplace fee`}
            label="Marketplace fee"
            max={30}
            min={0}
            onChange={setMarketplaceFeePct}
            step={5}
            value={marketplaceFeePct}
          />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <p className="text-sm font-black uppercase">3. The verdict</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResultCard
            title="Annualized IRR"
            value={
              outcome.annualizedIrr === null
                ? "—"
                : fmtPct(outcome.annualizedIrr)
            }
          />
          <ResultCard
            title="Payback"
            value={
              outcome.paybackMonths === null
                ? "Not within horizon"
                : `${outcome.paybackMonths} mo`
            }
          />
          <ResultCard title="Net cash / month" value={fmtUsd(outcome.monthlyNet)} />
          <ResultCard
            title={`Resale at month ${horizonMonths}`}
            value={fmtUsd(outcome.residualValue)}
          />
        </div>
        <p className="mt-4 text-base font-bold leading-relaxed">
          {cardCount} × {card.name} costs {fmtUsd(outcome.totalInvested)} today.
          Rented {utilizationPct}% of hours it nets{" "}
          {fmtUsd(outcome.monthlyNet)} a month after power and fees, and the
          hardware is worth {fmtUsd(outcome.residualValue)} at month{" "}
          {horizonMonths}. Total return:{" "}
          {fmtPct(outcome.totalReturn, 0)} on money in.
          {outcome.annualizedIrr !== null && outcome.annualizedIrr < 0
            ? " At these assumptions you are paying for the resilience, not profiting from it. That is a legitimate purchase — just call it what it is."
            : ""}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-4 py-2 text-sm font-black uppercase text-foreground hover:bg-foreground hover:text-background"
            onClick={handleCopyLink}
            type="button"
          >
            {copyState === "copied" ? (
              <Check aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Copy aria-hidden="true" className="h-4 w-4" />
            )}
            {copyState === "copied" ? "Copied" : "Copy link with my assumptions"}
          </button>
          <p className="text-xs font-bold text-muted-foreground">
            Send it to the family member with capital.
          </p>
        </div>
      </div>
    </div>
  );
}

function Slider({
  format,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  format: (v: number) => string;
  label: string;
  max: number;
  min: number;
  onChange: (v: number) => void;
  step: number;
  value: number;
}) {
  return (
    <div className="border-b-2 border-foreground py-4 last:border-b-0">
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="uppercase">{label}</span>
        <span>{format(value)}</span>
      </div>
      <input
        aria-label={label}
        className="mt-2 h-2 w-full cursor-pointer appearance-none bg-foreground accent-foreground"
        max={max}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </div>
  );
}

function ResultCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="border-2 border-foreground p-3">
      <p className="text-[11px] font-black uppercase text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 text-lg font-black sm:text-xl">{value}</p>
    </div>
  );
}
