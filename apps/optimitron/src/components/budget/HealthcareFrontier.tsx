"use client";

import { useState } from "react";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import type { OptimalBudgetReport } from "@/lib/optimal-budget-generator";

type Healthcare = OptimalBudgetReport["healthcare"];
const money = (value: number | null) => value === null ? "Unavailable" : `$${Math.round(value).toLocaleString("en-US")}`;

export function HealthcareFrontier({ data, gap, onGapChange, countryId }: {
  data: Healthcare; gap: number; onGapChange: (gap: number) => void; countryId: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const choice = data.scenarios.find(item => item.maxHealthyYearGap === gap)!;
  const selected = choice.selected;
  const frontierIds = new Set(choice.frontierIds);
  const frontier = data.countries.filter(country => frontierIds.has(country.id));
  const points = showAll ? data.countries : data.countries.filter(country => country.hale >= 65);
  const maxCost = Math.ceil(Math.max(...data.countries.map(country => country.totalPerCapita)) / 2000) * 2000;
  const comparisons = data.countries.filter(country => new Set([selected?.id, countryId, "JPN", "KOR", "SGP", "ESP"]).has(country.id))
    .sort((a, b) => a.totalPerCapita - b.totalPerCapita);
  const policies = data.policies.find(item => item.countryId === selected?.id);

  return (
    <section id="healthcare-frontier" aria-label="Healthcare comparison" className="mt-10 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Healthcare: the best outcomes for the cost</h2>
          <p className="mt-2 text-sm text-muted-foreground">{data.countries.length} countries · 2017–2019 · public and private costs combined</p>
        </div>
        <div>
          <label htmlFor="healthy-year-gap" className="mb-1 block text-sm font-bold">Healthy years below the best</label>
          <select id="healthy-year-gap" value={gap} onChange={event => onGapChange(Number(event.target.value))} className="w-full border-2 border-foreground bg-background p-2">
            {[0, 0.5, 1, 1.5, 2].map(value => <option key={value} value={value}>{value === 0 ? "Match the best observed" : `Within ${value} ${value === 1 ? "year (default)" : "years"}`}</option>)}
          </select>
        </div>
      </div>

      {selected ? <div className="mt-5 border-l-4 border-primary pl-4">
        <p className="text-lg font-black" data-testid="healthcare-reference">{selected.name}</p>
        <p className="mt-1 text-sm">{selected.hale.toFixed(2)} healthy years · {money(selected.totalPerCapita)} total cost per resident</p>
        <p className="mt-1 text-sm text-muted-foreground">Lowest total cost meeting {choice.targetHale?.toFixed(2)} healthy years; best observed: {choice.bestHale?.toFixed(2)}.</p>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-muted-foreground">Domestic public care funding</dt><dd className="text-xl font-black">{money(selected.publicPerCapita)}</dd></div>
          <div><dt className="text-muted-foreground">Private spending</dt><dd className="text-xl font-black">{money(selected.privatePerCapita)}</dd><dd className="text-xs">Including {money(selected.outOfPocketPerCapita)} paid out of pocket</dd></div>
          <div><dt className="text-muted-foreground">External funding</dt><dd className="text-xl font-black">{money(selected.externalPerCapita)}</dd></div>
        </dl>
      </div> : <p role="status" className="mt-5 font-bold">No system with reported public financing meets this target.</p>}

      <figure className="mt-6">
        <p className="mb-2 text-sm font-bold">Healthy life expectancy (years)</p>
        <div className="h-80 w-full" aria-label="Healthcare cost and healthy life expectancy scatterplot">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 18, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis type="number" dataKey="totalPerCapita" name="Total cost" domain={[0, maxCost]} tickFormatter={value => `$${(Number(value) / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k`} tick={{ fontSize: 11, fill: "var(--foreground)" }} />
              <YAxis type="number" dataKey="hale" name="Healthy years" domain={[showAll ? Math.floor(Math.min(...data.countries.map(country => country.hale))) : 65, Math.ceil((choice.bestHale ?? 74) + 1)]} allowDataOverflow width={38} tickFormatter={value => Number(value).toFixed(0)} tick={{ fontSize: 11, fill: "var(--foreground)" }} />
              <Tooltip content={({ active, payload }) => {
                const point = payload?.[0]?.payload as Healthcare["countries"][number] | undefined;
                return active && point ? <div className="border-2 border-foreground bg-background p-3 text-sm"><strong>{point.name}</strong><p>{point.hale.toFixed(2)} healthy years</p><p>{money(point.totalPerCapita)} / resident</p></div> : null;
              }} />
              {choice.targetHale !== null && <ReferenceLine y={choice.targetHale} stroke="var(--foreground)" strokeDasharray="5 5" />}
              <Scatter name="Countries" data={points.filter(point => !frontierIds.has(point.id) && point.id !== selected?.id)} fill="var(--muted-foreground)" opacity={0.5} isAnimationActive={false} />
              <Scatter name="Efficient frontier" data={frontier.filter(point => showAll || point.hale >= 65).sort((a, b) => a.totalPerCapita - b.totalPerCapita)} fill="var(--foreground)" line isAnimationActive={false} />
              {selected && <Scatter name="Selected system" data={[selected]} fill="#db2777" shape="diamond" isAnimationActive={false} />}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <figcaption className="mt-2 text-sm">
          Total annual healthcare cost per resident (2021 purchasing-power-adjusted dollars).
          <span className="mt-1 block text-muted-foreground">The connected dots form the efficient frontier: no observed country improves cost or health without worsening the other. The dashed line is your outcome target; the pink diamond is the selected system.</span>
        </figcaption>
        <label className="mt-3 flex w-fit items-center gap-2 text-sm"><input type="checkbox" checked={showAll} onChange={event => setShowAll(event.target.checked)} />Show all countries, including those below 65 healthy years</label>
      </figure>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="mb-2 text-left font-bold">Selected system and international comparisons</caption>
          <thead><tr className="border-b-2 border-foreground"><th className="py-2 pr-3">Country</th><th className="px-2 text-right">Healthy years</th><th className="px-2 text-right">Total care / resident</th><th className="pl-2 text-right">Public care / resident</th></tr></thead>
          <tbody>{comparisons.map(country => <tr key={country.id} className={`border-b border-foreground/20 ${country.id === selected?.id ? "font-black" : ""}`}><th scope="row" className="py-3 pr-3 text-left">{country.name}{country.id === selected?.id ? " · selected" : ""}</th><td className="px-2 text-right tabular-nums">{country.hale.toFixed(2)}</td><td className="px-2 text-right tabular-nums">{money(country.totalPerCapita)}</td><td className="pl-2 text-right tabular-nums">{money(country.publicPerCapita)}</td></tr>)}</tbody>
        </table>
      </div>

      {policies && <div className="mt-6">
        <h3 className="text-lg font-black">How {policies.countryName} delivers care</h3>
        <ul className="mt-3 space-y-3">{policies.policies.map(policy => <li key={policy.name}><a href={policy.url} className="font-bold underline underline-offset-2">{policy.name} ↗</a><p className="mt-1 text-sm">{policy.description}</p></li>)}</ul>
      </div>}

      <details className="mt-5 text-sm">
        <summary className="w-fit cursor-pointer font-bold">Year-by-year sensitivity and measurement</summary>
        <div className="mt-3 space-y-2">
          {choice.selectionByYear.map(year => <p key={year.year}>{year.year}: {data.countries.find(country => country.id === year.selectedId)?.name ?? "No qualifying reference"}; target {year.targetHale?.toFixed(2)} healthy years.</p>)}
          <p>WHO healthy life expectancy is average expected healthy years. It measures national health, including influences outside healthcare. The frontier compares observed systems; it does not isolate the effect of their policies.</p>
          <p>This comparison uses recurring healthcare costs. The budget above uses government health expenditure, including research and investment, under the same classification as the other budget lines. It is a different accounting boundary: these care costs are not added again.</p>
          {data.governmentBudgets.countries.find(country => country.countryId === selected?.id) && <p>Budget source: {data.governmentBudgets.countries.find(country => country.countryId === selected?.id)!.accountingBasis}</p>}
          <p>Private spending includes voluntary insurance and out-of-pocket payments. External funding is shown separately. The financing split follows WHO domestic funding definitions; OECD compulsory-financing shares can use a different boundary.</p>
          {selected?.haleLow !== null && selected?.haleHigh !== null && <p>Mean annual WHO lower and upper estimates: {selected?.haleLow?.toFixed(2)}–{selected?.haleHigh?.toFixed(2)} years. These are averaged source bounds, not a confidence interval for the three-year mean or for adopting the system.</p>}
          {policies?.policies.some(policy => policy.periodNote) && <p>Policy dates: {policies.policies.map(policy => policy.periodNote).filter(Boolean).join(" ")}</p>}
        </div>
      </details>
    </section>
  );
}
