"use client";

import { useState } from "react";
import { Input } from "@/components/retroui/Input";
import type { BestPracticeBudgetReport } from "@/lib/best-practice-budget";

function money(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function BestPracticeBudget({ report }: { report: BestPracticeBudgetReport }) {
  const [populationText, setPopulationText] = useState("1000000");
  const [quantile, setQuantile] = useState(report.defaultQuantile);
  const population = Number(populationText);
  const validPopulation = populationText.trim() !== "" && Number.isSafeInteger(population) && population > 0;
  const scenario = report.scenarios.find(item => item.outcomeQuantile === quantile)!;
  const healthcare = scenario.lines.find(line => line.id === "GF07");
  const defaultScenario = report.scenarios.find(item => item.outcomeQuantile === report.defaultQuantile)!;
  const nationalTargets = scenario.lines.find(line => line.id === "GF02")!.targets;

  function download() {
    if (!validPopulation) return;
    const scaled = {
      ...report,
      selectedQuantile: quantile,
      scenarios: report.scenarios.map(item => ({
        ...item, population,
        annualBudget: item.totalPerCapita === null ? null : item.totalPerCapita * population,
        lines: item.lines.map(line => ({ ...line, annualBudget: line.peer ? line.peer.publicCostPerCapita * population : null })),
      })),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(scaled, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `budget-${population}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-label="Population budget" className="my-8">
      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-end">
        <div>
          <label htmlFor="budget-population" className="mb-2 block text-sm font-black">Population</label>
          <Input id="budget-population" type="number" min="1" step="1" value={populationText}
            onChange={event => setPopulationText(event.target.value)} aria-invalid={!validPopulation}
            aria-describedby={!validPopulation ? "population-error" : undefined} />
          {!validPopulation && <p id="population-error" role="alert" className="mt-2 text-sm text-destructive">Enter a whole number greater than zero.</p>}
        </div>
        <div aria-live="polite" className="min-w-0">
          <p className="text-sm font-bold text-muted-foreground">Annual public budget</p>
          <p className="break-words text-3xl font-black md:text-4xl" data-testid="population-budget-total">
            {validPopulation && scenario.totalPerCapita !== null ? money(scenario.totalPerCapita * population) : "—"}
          </p>
          {scenario.totalPerCapita !== null && <p className="mt-1 text-sm font-bold">{money(scenario.totalPerCapita)} per resident · national and local government</p>}
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Lowest-cost systems meeting top-{Math.round((1 - quantile) * 100)}% outcome targets across {report.countryCount} European countries. {report.period[0]}–{report.period.at(-1)} spending, in 2021 purchasing-power-adjusted dollars.
      </p>

      <details className="my-5 border-y-2 border-foreground py-4">
        <summary className="cursor-pointer font-bold">Outcome targets and calculation</summary>
        <div className="mt-4 space-y-4 text-sm">
          <div className="max-w-xs">
            <label htmlFor="budget-quality" className="mb-2 block font-bold">Outcome target</label>
            <select id="budget-quality" value={quantile} onChange={event => setQuantile(Number(event.target.value))} className="w-full border-2 border-foreground bg-background p-2">
              {[0.8, 0.9, 0.95].map(q => <option key={q} value={q}>Top {Math.round((1 - q) * 100)}%{q === report.defaultQuantile ? " (default)" : ""}</option>)}
            </select>
          </div>
          <p>Healthcare targets healthy life expectancy; education targets basic maths proficiency. Other categories select countries meeting both health and income targets.</p>
          <p>National targets: {nationalTargets.hale?.toFixed(2)} healthy years and {Math.round(nationalTargets.income ?? 0).toLocaleString("en-US")} PPS in median disposable income. The default keeps at least three countries meeting both targets.</p>
          <p>Each annual amount equals the selected country’s public cost per resident × your population. The calculation assumes its system can be adopted and combined with the other selected systems.</p>
          <p>Health uses WHO average healthy life expectancy. Income is Eurostat’s 2019 median equivalised disposable income in PPS. These are reference outcomes; this calculation does not estimate a combined gain in health or income.</p>
          {healthcare?.peer && <p>Total healthcare cost in {healthcare.peer.name}: <strong>{money(healthcare.peer.selectionCostPerCapita)} per resident</strong>, including private spending. The public health allocation below uses government expenditure. Selection compares total costs so private bills count too.</p>}
          {scenario.alternativePerCapitaRange && <p>Using the three cheapest qualifying alternatives where available gives {money(scenario.alternativePerCapitaRange[0])}–{money(scenario.alternativePerCapitaRange[1])} in public spending per resident. This is an alternative-country range.</p>}
          <p>Research spending is included within these categories. The program scenarios below estimate additional investments in future improvements.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-bold">
            <a className="underline" href="/data/best-practice-budget.md">Full analysis and sources</a>
            <button type="button" onClick={download} disabled={!validPopulation} className="border-2 border-foreground px-3 py-1 disabled:opacity-50">Download this budget</button>
          </div>
        </div>
      </details>

      {!scenario.complete && <p role="status" className="mb-5 font-bold">No country meets both national targets at this setting. A complete budget is unavailable. The default top {Math.round((1 - defaultScenario.outcomeQuantile) * 100)}% result has qualifying countries.</p>}
      <div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b-2 border-foreground pb-3 text-xs font-black uppercase sm:grid" aria-hidden="true">
        <span>Public spending</span><span className="text-right">Annual budget</span><span className="text-right">Per resident</span><span>Reference country</span>
      </div>
      <div>
        {scenario.lines.map(line => (
          <div key={line.id} className="border-b border-foreground/25 py-4" data-testid={`budget-line-${line.id}`}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-[2fr_1fr_1fr_1fr] sm:items-center">
              <h3 className="font-bold">{line.name}</h3>
              <p className="text-right font-black tabular-nums" data-testid={`budget-annual-${line.id}`}>{line.peer && validPopulation ? money(line.peer.publicCostPerCapita * population) : "—"}</p>
              <p className="text-sm tabular-nums sm:text-right">{line.peer ? <>{money(line.peer.publicCostPerCapita)}<span className="sm:hidden"> / resident</span></> : "No qualifying country"}</p>
              <p className="text-right text-sm sm:text-left">{line.peer?.name}</p>
            </div>
            <details className="mt-2 text-sm">
              <summary className="w-fit cursor-pointer text-muted-foreground">{line.eligibleCountryCount} qualifying {line.eligibleCountryCount === 1 ? "country" : "countries"} · outcomes and alternatives</summary>
              <div className="mt-3 space-y-2">
                {line.outcomeMetrics.map(metric => <p key={metric}>{report.outcomeDefinitions[metric]!.label}: <strong>{line.peer?.outcomes[metric]?.toLocaleString("en-US", { maximumFractionDigits: 2 }) ?? "Unavailable"}</strong> (target {line.targets[metric]?.toLocaleString("en-US", { maximumFractionDigits: 2 })}). {report.outcomeDefinitions[metric]!.unit}.</p>)}
                {line.alternatives.map(peer => <p key={peer.id}>{peer.name}: {money(peer.publicCostPerCapita)} public spending per resident{line.selectionCost === "totalHealthPerCapita" ? `; ${money(peer.selectionCostPerCapita)} total healthcare cost` : ""}.</p>)}
              </div>
            </details>
          </div>
        ))}
      </div>
    </section>
  );
}
