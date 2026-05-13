"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { defaultButtonClassName } from "@/components/ui/default-button";

/**
 * Personal Dividend Calculator
 *
 * Shows citizens how much they'd receive monthly from the Universal Dividend
 * funded by efficiency savings identified in the OECD cross-country analysis.
 */

const US_ADULT_POPULATION = 258_000_000;

export interface DividendCalculatorCategory {
  name: string;
  modelCountry: string;
  annualSavingsPerAdult: number;
  overspendRatio: number;
  includedByDefault?: boolean;
}

function formatUSD(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n).toLocaleString("en-US")}`;
  return `$${n.toFixed(2)}`;
}

export function DividendCalculator({
  categories,
  initialAdults = 2,
}: {
  categories: DividendCalculatorCategory[];
  initialAdults?: number;
}) {
  const [adults, setAdults] = useState(initialAdults);
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(categories.map((category) => [category.name, category.includedByDefault ?? true])),
  );

  const totalSavingsPerAdult = categories
    .filter((category) => selected[category.name])
    .reduce((sum, category) => sum + category.annualSavingsPerAdult, 0);

  const annualTotalSavings = totalSavingsPerAdult * US_ADULT_POPULATION;
  const annualPerAdult = totalSavingsPerAdult;
  const monthlyPerAdult = annualPerAdult / 12;
  const monthlyHousehold = monthlyPerAdult * adults;
  const annualHousehold = annualPerAdult * adults;

  const toggleCategory = (name: string) => {
    setSelected((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="mb-4 text-xl font-black uppercase text-foreground">
        Your Monthly Dividend
      </h3>
      <p className="mb-4 text-sm font-bold text-muted-foreground">
        If the US matched the spending efficiency of top OECD countries, the
        savings could fund a Universal Dividend for every adult citizen.
      </p>

      <div className="mb-4 space-y-2">
        <p className="text-xs font-bold uppercase text-muted-foreground">
          Include savings from:
        </p>
        {categories.map((category) => (
          <label
            key={category.name}
            className="flex cursor-pointer items-center gap-2"
          >
            <input
              type="checkbox"
              checked={selected[category.name] ?? false}
              onChange={() => toggleCategory(category.name)}
              className="h-5 w-5 accent-foreground"
            />
            <span className="text-sm font-bold text-foreground">
              {category.name}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              ({category.overspendRatio.toFixed(1)}x vs {category.modelCountry} →{" "}
              {formatUSD(category.annualSavingsPerAdult)}/yr per adult)
            </span>
          </label>
        ))}
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
          Adults in household
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setAdults(n)}
              className={cn(
                defaultButtonClassName,
                "min-h-10 px-4 py-2",
                adults === n && "bg-foreground text-background",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t-4 border-primary pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-muted-foreground">
            Your monthly dividend
          </span>
          <span className="text-3xl font-black text-foreground">
            {formatUSD(monthlyHousehold)}
            <span className="text-lg text-muted-foreground">/mo</span>
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-muted-foreground">
            Annual household total
          </span>
          <span className="text-xl font-black text-foreground">
            {formatUSD(annualHousehold)}
            <span className="text-sm text-muted-foreground">/yr</span>
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-muted-foreground">
            Total national savings
          </span>
          <span className="text-lg font-bold text-foreground">
            {formatUSD(annualTotalSavings)}
            <span className="text-sm text-muted-foreground">/yr</span>
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs font-bold text-muted-foreground">
        Don&apos;t like a reform? Redirect your dividend back to any program you
        choose. Your money, your call.
      </p>
    </div>
  );
}
