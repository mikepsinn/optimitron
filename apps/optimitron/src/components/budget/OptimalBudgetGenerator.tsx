"use client";

import { useEffect, useState } from "react";
import { scaleOptimalBudgetScenario } from "@optimitron/obg";
import { Input } from "@/components/retroui/Input";
import { HealthcareFrontier } from "./HealthcareFrontier";
import type { OptimalBudgetReport } from "@/lib/optimal-budget-generator";

function money(value: number): string {
  return `$${(Math.round(value) || 0).toLocaleString("en-US")}`;
}

function compactMoney(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(value);
}

export function OptimalBudgetGenerator({ report }: { report: OptimalBudgetReport }) {
  const [populationText, setPopulationText] = useState("1000000");
  const [countryId, setCountryId] = useState(report.populationCountries.some(country => country.id === "USA") ? "USA" : "custom");
  const [quantile, setQuantile] = useState(report.defaultQuantile);
  const [healthGap, setHealthGap] = useState(report.healthcare.defaultMaxHealthyYearGap);
  const country = report.populationCountries.find(item => item.id === countryId);
  const population = country?.population ?? Number(populationText);
  const validPopulation = (country !== undefined || populationText.trim() !== "") && Number.isSafeInteger(population) && population > 0;
  const referenceScenario = report.scenarios.find(item => item.outcomeQuantile === quantile && item.maxHealthyYearGap === healthGap)!;
  const scenario = validPopulation ? scaleOptimalBudgetScenario(referenceScenario, population) : referenceScenario;
  const defaultScenario = report.scenarios.find(item => item.outcomeQuantile === report.defaultQuantile && item.maxHealthyYearGap === healthGap)!;
  const nationalTargets = scenario.lines.find(line => line.id === "GF02")!.targets;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("obg-country-v1");
      if (saved && report.populationCountries.some(item => item.id === saved)) setCountryId(saved);
    } catch { /* The calculator also works when browser storage is unavailable. */ }
  }, [report.populationCountries]);

  function selectCountry(value: string) {
    setCountryId(value);
    if (value === "custom") setPopulationText(String(population));
    try {
      if (value === "custom") localStorage.removeItem("obg-country-v1");
      else localStorage.setItem("obg-country-v1", value);
    } catch { /* Saving the preference is optional. */ }
  }

  function download() {
    if (!validPopulation) return;
    const scaled = {
      ...report,
      selectedQuantile: quantile,
      selectedMaxHealthyYearGap: healthGap,
      selectedCountry: country ?? null,
      scenarios: report.scenarios.map(item => scaleOptimalBudgetScenario(item, population)),
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
          <label htmlFor="budget-country" className="mb-2 block text-sm font-black">Country</label>
          <select id="budget-country" value={countryId} onChange={event => selectCountry(event.target.value)} className="w-full border-2 border-foreground bg-background p-2">
            {report.populationCountries.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            <option value="custom">Custom population</option>
          </select>
          {country && <p className="mt-2 text-xs text-muted-foreground">{population.toLocaleString("en-US")} residents · World Bank {country.year} estimate</p>}
          {countryId === "custom" && <div className="mt-3">
          <label htmlFor="budget-population" className="mb-2 block text-sm font-black">Population</label>
          <Input id="budget-population" type="number" min="1" step="1" value={populationText}
            onChange={event => setPopulationText(event.target.value)} aria-invalid={!validPopulation}
            aria-describedby={!validPopulation ? "population-error" : undefined} />
          {!validPopulation && <p id="population-error" role="alert" className="mt-2 text-sm text-destructive">Enter a whole number greater than zero.</p>}
          </div>}
        </div>
        <div aria-live="polite" className="min-w-0">
          <p className="text-sm font-bold text-muted-foreground">Annual public spending</p>
          <p className="break-words text-3xl font-black md:text-4xl" data-testid="population-budget-total" data-amount={validPopulation && scenario.totalPerCapita !== null ? scenario.annualBudget! : undefined}>
            {validPopulation && scenario.totalPerCapita !== null ? compactMoney(scenario.annualBudget!) : "—"}
          </p>
          {scenario.totalPerCapita !== null && <p className="mt-1 text-sm font-bold">{money(scenario.totalPerCapita)} per resident · national and local government</p>}
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Healthcare compares {report.healthcare.countries.length} countries worldwide; other spending uses {report.countryCount} European countries. {report.period[0]}–{report.period.at(-1)} costs, in 2021 purchasing-power-adjusted dollars.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold">
        <a className="underline" href="/data/optimal-budget.md">Full analysis and sources</a>
        <button type="button" onClick={download} disabled={!validPopulation} className="border-2 border-foreground px-3 py-1 disabled:opacity-50">Download this budget</button>
      </div>

      <details className="my-5 border-y-2 border-foreground py-4">
        <summary className="cursor-pointer font-bold">How this budget is calculated</summary>
        <div className="mt-4 space-y-4 text-sm">
          <div className="max-w-xs">
            <label htmlFor="budget-quality" className="mb-2 block font-bold">Outcome target</label>
            <select id="budget-quality" value={quantile} onChange={event => setQuantile(Number(event.target.value))} className="w-full border-2 border-foreground bg-background p-2">
              {[0.8, 0.9, 0.95].map(q => <option key={q} value={q}>Top {Math.round((1 - q) * 100)}%{q === report.defaultQuantile ? " (default)" : ""}</option>)}
            </select>
          </div>
          <p>Healthcare selects the cheapest system within {healthGap} healthy {healthGap === 1 ? "year" : "years"} of the best observed outcome worldwide. Education targets basic maths proficiency. Other categories select countries meeting both health and income targets.</p>
          <p>National targets: {nationalTargets.hale?.toFixed(2)} healthy years and {Math.round(nationalTargets.income ?? 0).toLocaleString("en-US")} PPS in median disposable income. The default uses at least three countries meeting both targets.</p>
          <p>Each annual amount equals the selected country’s public cost per resident × your population. The calculation assumes its system can be adopted and combined with the other selected systems.</p>
          <p>Health uses WHO average healthy life expectancy. Income is Eurostat’s 2019 median equivalised disposable income in PPS. These are observed outcomes in the reference countries.</p>
          <p>The healthcare budget uses government health accounts, including research and investment. The comparison below uses total recurring care costs, including private bills, to choose a system. Its care-cost figures have a different accounting boundary and are not added to the public budget.</p>
          {scenario.alternativePerCapitaRange && <p>Using the three cheapest qualifying alternatives where available gives {money(scenario.alternativePerCapitaRange[0])}–{money(scenario.alternativePerCapitaRange[1])} in public spending per resident. This is an alternative-country range.</p>}
          <p>Service breakdowns show how each reference country divides its budget. Research and investment are included in the category totals.</p>

        </div>
      </details>

      {!scenario.complete && <p role="status" className="mb-5 font-bold">A complete budget is unavailable at this setting: a category has no qualifying reference or comparable public spending amount.{defaultScenario.complete ? ` The default top ${Math.round((1 - defaultScenario.outcomeQuantile) * 100)}% result has a complete budget.` : ""}</p>}
      <div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b-2 border-foreground pb-3 text-xs font-black uppercase sm:grid" aria-hidden="true">
        <span>Public spending</span><span className="text-right">Annual budget</span><span className="text-right">Per resident</span><span>Reference country</span>
      </div>
      <div>
        {scenario.lines.map(line => (
          <div key={line.id} className="border-b border-foreground/25 py-4" data-testid={`budget-line-${line.id}`}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-[2fr_1fr_1fr_1fr] sm:items-center">
              <h3 className="font-bold">{line.name}</h3>
              <p className="text-right font-black tabular-nums" data-testid={`budget-annual-${line.id}`} title={line.peer && validPopulation ? money(line.annualBudget!) : undefined}>{line.peer && validPopulation ? compactMoney(line.annualBudget!) : "—"}</p>
              <p className="text-sm tabular-nums sm:text-right">{line.peer ? <>{money(line.peer.publicCostPerCapita)}<span className="sm:hidden"> / resident</span></> : "No qualifying country"}</p>
              <p className="text-right text-sm sm:text-left">{line.peer?.name}</p>
            </div>
            {line.id === "GF07" && <a href="#healthcare-frontier" className="mt-2 inline-block text-sm font-bold underline">Compare healthcare systems ↓</a>}
            <details className="mt-2 text-sm">
              <summary className="w-fit cursor-pointer text-muted-foreground">{line.breakdown.length ? "Services, outcomes and alternatives" : "Outcomes and alternatives"}</summary>
              <div className="mt-3 space-y-2">
                {line.breakdown.some(child => child.perCapita !== null) ? <div className="mb-4">
                  <p className="mb-2 font-bold">{line.peer?.name} spending breakdown · per resident</p>
                  <dl className="space-y-2">{line.breakdown.map(child => <div key={child.id} className="flex justify-between gap-4"><dt>{child.name}</dt><dd className="shrink-0 tabular-nums">{child.perCapita === null ? "Unavailable" : money(child.perCapita)}</dd></div>)}
                    {line.breakdownRemainder !== null && Math.abs(line.breakdownRemainder) >= 0.5 && <div className="flex justify-between gap-4"><dt>{line.breakdown.some(child => child.perCapita === null) ? "Unallocated to reported services" : "Source rounding adjustment"}</dt><dd className="shrink-0 tabular-nums">{money(line.breakdownRemainder)}</dd></div>}
                  </dl>
                </div> : <p>Comparable public spending amounts by service are not reported for {line.peer?.name ?? "this reference"}.</p>}
                {line.outcomeMetrics.map(metric => <p key={metric}>{report.outcomeDefinitions[metric]!.label}: <strong>{line.peer?.outcomes[metric]?.toLocaleString("en-US", { maximumFractionDigits: 2 }) ?? "Unavailable"}</strong> (target {line.targets[metric]?.toLocaleString("en-US", { maximumFractionDigits: 2 })}). {report.outcomeDefinitions[metric]!.unit}.</p>)}
                {line.alternatives.map(peer => <p key={peer.id}>{peer.name}: {money(peer.publicCostPerCapita)} public spending per resident{line.selectionCost === "totalHealthPerCapita" ? `; ${money(peer.selectionCostPerCapita)} total healthcare cost` : ""}.</p>)}
              </div>
            </details>
          </div>
        ))}
      </div>
      <HealthcareFrontier data={report.healthcare} gap={healthGap} onGapChange={setHealthGap} countryId={countryId} />
    </section>
  );
}
