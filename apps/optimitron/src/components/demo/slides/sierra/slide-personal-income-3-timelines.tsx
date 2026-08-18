"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import {
  CURRENT_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME,
  CURRENT_TRAJECTORY_GDP_YEAR_20,
  DESTRUCTIVE_ECONOMY_25PCT_YEAR,
  DESTRUCTIVE_ECONOMY_35PCT_YEAR,
  GLOBAL_DESTRUCTIVE_ECONOMY_PCT_GDP,
  GLOBAL_GDP_2025,
  GLOBAL_HALE_CURRENT,
  GDP_BASELINE_GROWTH_RATE,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  TREATY_ANNUAL_FUNDING,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_TRAJECTORY_CAGR_YEAR_20,
  TREATY_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME,
  TREATY_TRAJECTORY_GDP_YEAR_20,
  TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
  WISHONIA_HALE_GAIN_YEAR_15,
  WISHONIA_PROJECTED_HALE_YEAR_15,
  WISHONIA_TRAJECTORY_CAGR_YEAR_20,
  WISHONIA_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME,
  WISHONIA_TRAJECTORY_GDP_YEAR_20,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
} from "@optimitron/data/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

/* ── Derived values ──────────────────────────────────────────────── */

const statusQuoLifetimeIncome = Math.round(CURRENT_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME.value);
const treatyLifetimeIncome = Math.round(TREATY_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME.value);
const wishoniaLifetimeIncome = Math.round(WISHONIA_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME.value);

const treatyMultiplier = Math.round(TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER.value);
const wishoniaMultiplier = Math.round(WISHONIA_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER.value);

const treatyHaleGain = Math.round(TREATY_HALE_GAIN_YEAR_15.value * 10) / 10;
const wishoniaHaleGain = Math.round(WISHONIA_HALE_GAIN_YEAR_15.value * 10) / 10;

const annualDysfunctionTax = Math.round(POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL.value / 100) * 100;
const globalDysfunctionCost = Math.round(POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL.value / 1e12);
const treatyRedirect = formatCurrency(Math.round(TREATY_ANNUAL_FUNDING.value));
const destructivePctGdp = Math.round(GLOBAL_DESTRUCTIVE_ECONOMY_PCT_GDP.value * 100);
const collapseYear = Math.round(DESTRUCTIVE_ECONOMY_35PCT_YEAR.value);
const instabilityYear = Math.round(DESTRUCTIVE_ECONOMY_25PCT_YEAR.value);

const statusQuoGrowth = `${(GDP_BASELINE_GROWTH_RATE.value * 100).toFixed(1)}%`;
const treatyGrowth = `${(TREATY_TRAJECTORY_CAGR_YEAR_20.value * 100).toFixed(1)}%`;
const wishoniaGrowth = `${(WISHONIA_TRAJECTORY_CAGR_YEAR_20.value * 100).toFixed(1)}%`;

/* ── Format GDP numbers for display ──────────────────────────────── */

function formatGdp(value: number): string {
  if (value >= 1e15) return `$${(value / 1e15).toFixed(1)}Q`;
  if (value >= 1e12) return `$${(value / 1e12).toFixed(0)}T`;
  return formatCurrency(value);
}

const statusQuoGdp2045 = formatGdp(CURRENT_TRAJECTORY_GDP_YEAR_20.value);
const treatyGdp2045 = formatGdp(TREATY_TRAJECTORY_GDP_YEAR_20.value);
const wishoniaGdp2045 = formatGdp(WISHONIA_TRAJECTORY_GDP_YEAR_20.value);

/* ── Earth options ───────────────────────────────────────────────── */

interface EarthOption {
  label: string;
  subtitle: string;
  tag: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  tagColor: string;
  lifetimeIncome: number;
  incomeMultiplier: string;
  haleGain: string;
  gdp2045: string;
  growth: string;
  dysfunctionTax: string;
}

const EARTHS: EarthOption[] = [
  {
    label: "STATUS QUO",
    subtitle: "PARASITIC ECONOMY DEVOURS PRODUCTIVE ECONOMY",
    tag: "[LOADED]",
    borderColor: "border-red-600/60",
    bgColor: "bg-red-950/40",
    textColor: "text-white",
    tagColor: "text-white",
    lifetimeIncome: statusQuoLifetimeIncome,
    incomeMultiplier: "",
    haleGain: `${GLOBAL_HALE_CURRENT.value.toFixed(1)} yrs`,
    gdp2045: statusQuoGdp2045,
    growth: statusQuoGrowth,
    dysfunctionTax: `-${formatCurrency(annualDysfunctionTax)}/yr`,
  },
  {
    label: "1% TREATY",
    subtitle: "MINIMUM ACCEPTABLE GOVERNANCE",
    tag: "◄◄◄",
    borderColor: "border-emerald-500/60",
    bgColor: "bg-emerald-500/10",
    textColor: "text-white",
    tagColor: "text-white",
    lifetimeIncome: treatyLifetimeIncome,
    incomeMultiplier: `(${treatyMultiplier}×)`,
    haleGain: `+${treatyHaleGain} yrs`,
    gdp2045: treatyGdp2045,
    growth: treatyGrowth,
    dysfunctionTax: `${treatyRedirect}/yr redirected`,
  },
  {
    label: "OPTIMAL GOVERNANCE",
    subtitle: `END THE $${globalDysfunctionCost}T/YR POLITICAL DYSFUNCTION TAX`,
    tag: "",
    borderColor: "border-amber-500/60",
    bgColor: "bg-amber-500/10",
    textColor: "text-white",
    tagColor: "text-white",
    lifetimeIncome: wishoniaLifetimeIncome,
    incomeMultiplier: `(${wishoniaMultiplier}×)`,
    haleGain: `+${wishoniaHaleGain} yrs`,
    gdp2045: wishoniaGdp2045,
    growth: wishoniaGrowth,
    dysfunctionTax: `eliminated`,
  },
];

export function SlidePersonalIncome3Timelines() {
  return (
    <SierraSlideWrapper act={3} className="text-sierra-green">
      <div className="flex flex-col items-center justify-center gap-4 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-3xl md:text-5xl text-white text-center">
          PLEASE SELECT AN EARTH
        </h1>

        {/* Earth Options */}
        <div className="w-full space-y-3">
          {EARTHS.map((earth, i) => (
            <div
              key={i}
              className={`${earth.bgColor} border-2 ${earth.borderColor} rounded-lg p-4 space-y-2`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`font-pixel text-xl md:text-3xl ${earth.textColor}`}>
                    {earth.label}
                  </span>
                  <span className={`font-pixel text-sm md:text-lg text-white/70`}>
                    {earth.subtitle}
                  </span>
                </div>
                {earth.tag && (
                  <span
                    className={`font-pixel text-xl md:text-2xl ${earth.tagColor} ${
                      i === 1 ? "animate-pulse" : ""
                    }`}
                  >
                    {earth.tag}
                  </span>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
                <div>
                  <div className="font-pixel text-xs md:text-base text-white/70 mb-1">
                    LIFETIME INCOME
                  </div>
                  <div className={`font-pixel text-lg md:text-2xl ${earth.textColor}`}>
                    {formatCurrency(earth.lifetimeIncome)}{" "}
                    {earth.incomeMultiplier && (
                      <span className="text-white/70 text-sm md:text-lg">
                        {earth.incomeMultiplier}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-pixel text-xs md:text-base text-white/70 mb-1">
                    GDP 2045
                  </div>
                  <div className={`font-pixel text-lg md:text-2xl ${earth.textColor}`}>
                    {earth.gdp2045}
                  </div>
                </div>
                <div>
                  <div className="font-pixel text-xs md:text-base text-white/70 mb-1">
                    GROWTH
                  </div>
                  <div className={`font-pixel text-lg md:text-2xl ${earth.textColor}`}>
                    {earth.growth}
                  </div>
                </div>
                <div>
                  <div className="font-pixel text-xs md:text-base text-white/70 mb-1">
                    HEALTHY YEARS
                  </div>
                  <div className={`font-pixel text-lg md:text-2xl ${earth.textColor}`}>
                    {earth.haleGain}
                  </div>
                </div>
                <div>
                  <div className="font-pixel text-xs md:text-base text-white/70 mb-1">
                    DYSFUNCTION TAX
                  </div>
                  <div className={`font-pixel text-lg md:text-2xl ${earth.textColor}`}>
                    {earth.dysfunctionTax}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Collapse warning for Earth B */}
        <div className="font-pixel text-xs md:text-sm text-sierra-red text-center">
          EARTH B: DESTRUCTIVE ECONOMY AT {destructivePctGdp}% GDP — INSTABILITY BY {instabilityYear} — COLLAPSE THRESHOLD BY {collapseYear}
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlidePersonalIncome3Timelines;
