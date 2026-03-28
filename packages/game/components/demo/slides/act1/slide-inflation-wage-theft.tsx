"use client";

import { SlideBase } from "../slide-base";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import {
  TREATY_PERSONAL_UPSIDE_BLEND,
  US_GOV_WASTE_HEALTHCARE_INEFFICIENCY,
  US_GOV_WASTE_HOUSING_ZONING,
  US_GOV_WASTE_MILITARY_OVERSPEND,
  US_GOV_WASTE_TAX_COMPLIANCE,
  US_GOV_WASTE_REGULATORY_RED_TAPE,
  US_GOV_WASTE_CORPORATE_WELFARE,
  US_GOV_WASTE_DRUG_WAR,
  US_GOV_WASTE_TARIFFS,
  US_GOV_WASTE_FOSSIL_FUEL_SUBSIDIES,
  US_GOV_WASTE_AGRICULTURAL_SUBSIDIES,
  US_GOV_WASTE_TOTAL,
  US_POPULATION_2024,
} from "@optimitron/data/parameters";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/demo/formatters";

/* ── Build theft items sorted by per-person impact ───────────────── */

const pop = US_POPULATION_2024.value;

const THEFT_ITEMS = [
  { emoji: "🏠", label: "ZONING LAWS", total: US_GOV_WASTE_HOUSING_ZONING.value },
  { emoji: "🏥", label: "HEALTHCARE MARKUP", total: US_GOV_WASTE_HEALTHCARE_INEFFICIENCY.value },
  { emoji: "⚔️", label: "HEGEMONY TAX", total: US_GOV_WASTE_MILITARY_OVERSPEND.value },
  { emoji: "📎", label: "RED TAPE", total: US_GOV_WASTE_REGULATORY_RED_TAPE.value },
  { emoji: "📋", label: "TAX PAPERWORK", total: US_GOV_WASTE_TAX_COMPLIANCE.value },
  { emoji: "🏢", label: "CORPORATE WELFARE", total: US_GOV_WASTE_CORPORATE_WELFARE.value },
  { emoji: "🚢", label: "TARIFFS", total: US_GOV_WASTE_TARIFFS.value },
  { emoji: "⛓️", label: "DRUG WAR", total: US_GOV_WASTE_DRUG_WAR.value },
  { emoji: "🌾", label: "FARM SUBSIDIES", total: US_GOV_WASTE_AGRICULTURAL_SUBSIDIES.value },
  { emoji: "⛽", label: "FOSSIL SUBSIDIES", total: US_GOV_WASTE_FOSSIL_FUEL_SUBSIDIES.value },
]
  .sort((a, b) => b.total - a.total)
  .map((item) => ({
    ...item,
    perPerson: Math.round(item.total / pop),
    totalFormatted: formatCurrency(item.total),
  }));

const totalWastePerPerson = Math.round(US_GOV_WASTE_TOTAL.value / pop);
const paycheck = GAME_PARAMS.currentMedianIncome;
const paycheckAfterTheft = paycheck - totalWastePerPerson;

const ITEM_DELAY_MS = 450;
const FIRST_ITEM_MS = 1200;

export function SlideInflationWageTheft() {
  const [visibleItems, setVisibleItems] = useState(0);
  const [showTotal, setShowTotal] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    THEFT_ITEMS.forEach((_, i) => {
      timers.push(
        setTimeout(() => setVisibleItems(i + 1), FIRST_ITEM_MS + i * ITEM_DELAY_MS)
      );
    });

    timers.push(
      setTimeout(
        () => setShowTotal(true),
        FIRST_ITEM_MS + THEFT_ITEMS.length * ITEM_DELAY_MS + 600
      )
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  // Running total of what's been stolen so far
  const stolenSoFar = THEFT_ITEMS.slice(0, visibleItems).reduce(
    (sum, item) => sum + item.perPerson,
    0
  );
  const remaining = paycheck - stolenSoFar;

  return (
    <SlideBase act={1} className="text-amber-500">
      <style jsx>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .slide-in { animation: slideInLeft 0.3s ease-out forwards; }

        @keyframes drainPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
        .drain-pulse { animation: drainPulse 0.6s ease-out; }

        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          25%      { transform: translateX(-3px); }
          75%      { transform: translateX(3px); }
        }
        .shake { animation: shakeX 0.3s ease-out; }
      `}</style>

      <div className="flex flex-col items-center gap-3 max-w-[1700px] mx-auto w-full">
        {/* Title */}
        <h1 className="font-pixel text-2xl md:text-4xl text-amber-400 text-center">
          🧾 THE INVISIBLE THEFT
        </h1>

        {/* Paycheck draining counter */}
        <div className="flex items-center justify-center gap-6 w-full">
          <div className="text-center">
            <div className="font-pixel text-sm text-zinc-500">YOUR PAYCHECK</div>
            <div className="font-pixel text-2xl md:text-3xl text-amber-400">
              ${paycheck.toLocaleString()}/yr
            </div>
          </div>
          <div className="font-pixel text-2xl text-zinc-600">→</div>
          <div className="text-center">
            <div className="font-pixel text-sm text-zinc-500">AFTER DYSFUNCTION TAX</div>
            <div
              className={`font-pixel text-2xl md:text-3xl transition-colors duration-300 ${
                remaining < paycheck * 0.5
                  ? "text-red-500"
                  : remaining < paycheck * 0.8
                    ? "text-orange-400"
                    : "text-amber-400"
              } ${visibleItems > 0 ? "shake" : ""}`}
              key={visibleItems}
            >
              ${Math.max(0, remaining).toLocaleString()}/yr
            </div>
          </div>
        </div>

        {/* Drain bar */}
        <div className="w-full h-4 bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
            style={{ width: `${Math.min(100, (stolenSoFar / paycheck) * 100)}%` }}
          />
        </div>

        {/* Theft receipt */}
        <div className="w-full grid grid-cols-2 gap-x-4 gap-y-1">
          {THEFT_ITEMS.map((item, i) => {
            if (i >= visibleItems) return null;
            return (
              <div
                key={item.label}
                className="flex items-center justify-between slide-in px-2 py-1 rounded bg-red-500/5 border-l-2 border-red-500/30"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.emoji}</span>
                  <span className="font-pixel text-sm md:text-base text-zinc-300">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-pixel text-xs text-zinc-500">
                    {item.totalFormatted}
                  </span>
                  <span className="font-pixel text-sm md:text-base text-red-400 min-w-[80px] text-right">
                    −${item.perPerson.toLocaleString()}/yr
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total + lifetime loss */}
        {showTotal && (
          <div className="w-full space-y-3 slide-in">
            {/* Divider */}
            <div className="border-t-2 border-red-500/50 pt-3">
              <div className="flex items-center justify-between px-2">
                <span className="font-pixel text-lg md:text-xl text-zinc-200">
                  💀 TOTAL ANNUAL THEFT
                </span>
                <span className="font-pixel text-xl md:text-2xl text-red-500">
                  −${totalWastePerPerson.toLocaleString()}/yr
                </span>
              </div>
              <div className="flex items-center justify-between px-2 mt-1">
                <span className="font-pixel text-lg md:text-xl text-zinc-200">
                  ⚰️ LIFETIME LOSS
                </span>
                <span className="font-pixel text-xl md:text-2xl text-red-500 animate-pulse">
                  −{formatCurrency(Math.round(TREATY_PERSONAL_UPSIDE_BLEND.value))}
                </span>
              </div>
            </div>

            {/* What you should be earning */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-red-500/10 border border-red-500/30 rounded">
                <div className="font-pixel text-base text-red-400">WHAT YOU GET</div>
                <div className="font-pixel text-2xl md:text-3xl text-red-500">
                  ${paycheck.toLocaleString()}
                </div>
              </div>
              <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
                <div className="font-pixel text-base text-emerald-400">WHAT YOU SHOULD GET</div>
                <div className="font-pixel text-2xl md:text-3xl text-emerald-400">
                  ${GAME_PARAMS.wageKeptPaceIncome.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SlideBase>
  );
}
