"use client";

import { useState } from "react";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { PrizeCTA } from "@/components/prize/PrizeCTA";

// ─── Inline data (from international-comparisons.ts) ─────────────

const healthData = [
  { country: "Singapore", spending: 3013, pctGDP: 4.1, lifeExp: 84.1, infantMort: 1.7, system: "mixed", universal: true },
  { country: "Japan", spending: 4691, pctGDP: 10.9, lifeExp: 84.8, infantMort: 1.8, system: "bismarck", universal: true },
  { country: "South Korea", spending: 3914, pctGDP: 8.4, lifeExp: 83.7, infantMort: 2.7, system: "bismarck", universal: true },
  { country: "Switzerland", spending: 9044, pctGDP: 11.3, lifeExp: 83.4, infantMort: 3.3, system: "bismarck", universal: true },
  { country: "Norway", spending: 8093, pctGDP: 11.4, lifeExp: 83.3, infantMort: 1.8, system: "beveridge", universal: true },
  { country: "Sweden", spending: 6262, pctGDP: 11.4, lifeExp: 83.2, infantMort: 2.1, system: "beveridge", universal: true },
  { country: "UK", spending: 5138, pctGDP: 11.3, lifeExp: 80.7, infantMort: 3.4, system: "beveridge", universal: true },
  { country: "France", spending: 5564, pctGDP: 12.1, lifeExp: 82.5, infantMort: 3.2, system: "bismarck", universal: true },
  { country: "Germany", spending: 7383, pctGDP: 12.7, lifeExp: 80.6, infantMort: 3.1, system: "bismarck", universal: true },
  { country: "Canada", spending: 5905, pctGDP: 10.8, lifeExp: 81.7, infantMort: 4.3, system: "single-payer", universal: true },
  { country: "Australia", spending: 5627, pctGDP: 9.6, lifeExp: 83.0, infantMort: 3.1, system: "mixed", universal: true },
  { country: "Netherlands", spending: 6190, pctGDP: 10.2, lifeExp: 81.5, infantMort: 3.1, system: "bismarck", universal: true },
  { country: "Israel", spending: 3266, pctGDP: 7.5, lifeExp: 82.6, infantMort: 2.8, system: "mixed", universal: true },
  { country: "Taiwan", spending: 3295, pctGDP: 6.6, lifeExp: 80.9, infantMort: 4.0, system: "single-payer", universal: true },
  { country: "Costa Rica", spending: 1285, pctGDP: 7.3, lifeExp: 80.3, infantMort: 7.0, system: "mixed", universal: true },
  { country: "Thailand", spending: 812, pctGDP: 4.4, lifeExp: 78.7, infantMort: 7.1, system: "mixed", universal: true },
  { country: "United States", spending: 12555, pctGDP: 17.3, lifeExp: 77.5, infantMort: 5.4, system: "private", universal: false },
  { country: "Cuba", spending: 966, pctGDP: 12.2, lifeExp: 78.0, infantMort: 4.0, system: "beveridge", universal: true },
  { country: "Brazil", spending: 1321, pctGDP: 9.9, lifeExp: 75.3, infantMort: 12.4, system: "mixed", universal: false },
  { country: "India", spending: 231, pctGDP: 3.3, lifeExp: 70.8, infantMort: 25.5, system: "mixed", universal: false },
];

const drugData = [
  { country: "Portugal", approach: "Decriminalization", deaths: 0.3, incarceration: 111, hiv: 1.0, treatment: 75, year: 2001 },
  { country: "Netherlands", approach: "Harm Reduction", deaths: 1.8, incarceration: 59, hiv: 3.5, treatment: 68, year: 1976 },
  { country: "Switzerland", approach: "Harm Reduction", deaths: 1.5, incarceration: 75, hiv: 2.8, treatment: 72, year: 1994 },
  { country: "Czech Republic", approach: "Decriminalization", deaths: 0.5, incarceration: 181, hiv: 0.4, treatment: 58, year: 2010 },
  { country: "Germany", approach: "Harm Reduction", deaths: 2.2, incarceration: 67, hiv: 3.0, treatment: 62, year: 2024 },
  { country: "Canada", approach: "Mixed", deaths: 5.2, incarceration: 104, hiv: 8.5, treatment: 55, year: 2018 },
  { country: "Norway", approach: "Harm Reduction", deaths: 5.8, incarceration: 56, hiv: 2.0, treatment: 65, year: null },
  { country: "UK", approach: "Prohibitionist", deaths: 7.6, incarceration: 129, hiv: 1.2, treatment: 52, year: null },
  { country: "Australia", approach: "Mixed", deaths: 6.8, incarceration: 160, hiv: 1.5, treatment: 50, year: null },
  { country: "Sweden", approach: "Prohibitionist", deaths: 9.3, incarceration: 57, hiv: 1.5, treatment: 45, year: null },
  { country: "United States", approach: "Prohibitionist", deaths: 32.4, incarceration: 531, hiv: 7.2, treatment: 28, year: null },
  { country: "Japan", approach: "Prohibitionist", deaths: 0.2, incarceration: 38, hiv: 0.8, treatment: 35, year: null },
  { country: "Singapore", approach: "Prohibitionist", deaths: 0.1, incarceration: 181, hiv: 2.5, treatment: 30, year: null },
];

const educationData = [
  { country: "Singapore", spending: 2.9, math: 575, reading: 543, science: 561 },
  { country: "Japan", spending: 3.4, math: 536, reading: 516, science: 547 },
  { country: "South Korea", spending: 4.7, math: 527, reading: 515, science: 528 },
  { country: "Estonia", spending: 5.2, math: 510, reading: 511, science: 526 },
  { country: "Switzerland", spending: 5.0, math: 508, reading: 483, science: 503 },
  { country: "Canada", spending: 5.2, math: 497, reading: 507, science: 515 },
  { country: "Finland", spending: 5.9, math: 484, reading: 490, science: 511 },
  { country: "Netherlands", spending: 5.1, math: 493, reading: 459, science: 488 },
  { country: "Ireland", spending: 3.1, math: 492, reading: 516, science: 504 },
  { country: "UK", spending: 4.4, math: 489, reading: 494, science: 500 },
  { country: "Poland", spending: 4.6, math: 489, reading: 489, science: 499 },
  { country: "Australia", spending: 5.1, math: 487, reading: 498, science: 507 },
  { country: "Denmark", spending: 5.9, math: 489, reading: 489, science: 494 },
  { country: "Germany", spending: 4.6, math: 475, reading: 480, science: 492 },
  { country: "France", spending: 5.2, math: 474, reading: 474, science: 487 },
  { country: "New Zealand", spending: 4.7, math: 479, reading: 501, science: 504 },
  { country: "United States", spending: 4.9, math: 465, reading: 504, science: 499 },
  { country: "Norway", spending: 5.7, math: 468, reading: 477, science: 478 },
  { country: "Israel", spending: 6.2, math: 458, reading: 474, science: 465 },
  { country: "Chile", spending: 5.4, math: 412, reading: 448, science: 444 },
];

const justiceData = [
  { country: "Japan", incarceration: 38, homicide: 0.2, recidivism: 49, approach: "Strict + Koban" },
  { country: "Finland", incarceration: 51, homicide: 1.6, recidivism: 31, approach: "Rehabilitative" },
  { country: "Norway", incarceration: 56, homicide: 0.5, recidivism: 20, approach: "Rehabilitative" },
  { country: "Netherlands", incarceration: 59, homicide: 0.6, recidivism: 47, approach: "Pragmatic" },
  { country: "Germany", incarceration: 67, homicide: 0.8, recidivism: 46, approach: "Rehabilitative" },
  { country: "South Korea", incarceration: 93, homicide: 0.5, recidivism: 23, approach: "Deterrence" },
  { country: "Canada", incarceration: 104, homicide: 2.0, recidivism: 40, approach: "Mixed" },
  { country: "France", incarceration: 105, homicide: 1.2, recidivism: 59, approach: "Mixed" },
  { country: "UK", incarceration: 129, homicide: 1.0, recidivism: 45, approach: "Mixed" },
  { country: "Australia", incarceration: 160, homicide: 0.9, recidivism: 45, approach: "Mixed" },
  { country: "New Zealand", incarceration: 165, homicide: 1.1, recidivism: 52, approach: "Rehabilitative" },
  { country: "Mexico", incarceration: 168, homicide: 25.2, recidivism: 50, approach: "Punitive" },
  { country: "Singapore", incarceration: 181, homicide: 0.2, recidivism: 24, approach: "Strict Deterrence" },
  { country: "Brazil", incarceration: 381, homicide: 22.4, recidivism: 70, approach: "Punitive" },
  { country: "United States", incarceration: 531, homicide: 6.3, recidivism: 76, approach: "Punitive" },
];

const tabs = ["Health", "Drug Policy", "Education", "Criminal Justice"] as const;
type Tab = (typeof tabs)[number];

export default function ComparePage() {
  const [activeTab, setActiveTab] = useState<Tab>("Health");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <ArcadeTag>Versus Mode</ArcadeTag>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground mb-2">
          International Comparisons
        </h1>
        <p className="text-muted-foreground font-bold">
          Here&apos;s what happens when other countries try things and you don&apos;t copy them.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-8 border-b-2 border-primary pb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-black uppercase transition-all ${
              activeTab === tab
                ? "bg-brutal-pink text-brutal-pink-foreground border-4 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                : "text-foreground hover:bg-brutal-cyan border-2 border-transparent hover:border-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Health" && <HealthTab />}
      {activeTab === "Drug Policy" && <DrugTab />}
      {activeTab === "Education" && <EducationTab />}
      {activeTab === "Criminal Justice" && <JusticeTab />}

      <div className="mt-10">
        <PrizeCTA
          headline="Other countries prove this works. Now prove the demand."
          body="The data above shows what evidence-based governance produces. The 1% Treaty referendum collapses pluralistic ignorance. Deposit USDC, recruit verified voters, earn VOTE points."
          variant="cyan"
        />
      </div>
    </div>
  );
}

// ─── Health Tab ──────────────────────────────────────────────────

function HealthTab() {
  const maxSpending = Math.max(...healthData.map((d) => d.spending));
  const maxLife = Math.max(...healthData.map((d) => d.lifeExp));
  const minLife = Math.min(...healthData.map((d) => d.lifeExp));
  const sortedByEfficiency = [...healthData].sort(
    (a, b) => b.lifeExp / b.spending - a.lifeExp / a.spending
  );

  return (
    <div className="space-y-8">
      {/* Exemplar callout */}
      <div className="card bg-brutal-cyan border-primary">
        <p className="text-foreground font-black mb-1">🏆 Top Performer</p>
        <p className="text-sm text-foreground font-bold">
          <strong className="text-foreground">Singapore</strong> spends $3,013 per person on health. Life expectancy: 84.1 years.
          The <strong className="text-foreground">US</strong> spends $12,555 per person. Life expectancy: 77.5 years.
          It&apos;s like paying four times more for a sandwich and getting fewer years to eat it.
        </p>
      </div>

      {/* Scatter plot (CSS) */}
      <div>
        <h3 className="section-title">Spending vs Life Expectancy</h3>
        <div className="card">
          <div className="relative w-full h-80 md:h-96">
            {/* Y axis label */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground whitespace-nowrap font-bold">
              Life Expectancy (years)
            </div>
            {/* X axis label */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-bold">
              Spending per capita (USD PPP)
            </div>
            {/* Plot area */}
            <div className="ml-8 mb-6 relative w-[calc(100%-2rem)] h-[calc(100%-1.5rem)] border-l-2 border-b-2 border-primary">
              {healthData.map((d) => {
                const x = (d.spending / maxSpending) * 90;
                const y = ((d.lifeExp - minLife) / (maxLife - minLife)) * 85;
                const isUS = d.country === "United States";
                const isSG = d.country === "Singapore";
                return (
                  <div
                    key={d.country}
                    className="absolute group"
                    style={{ left: `${x}%`, bottom: `${y}%`, transform: "translate(-50%, 50%)" }}
                  >
                    <div
                      className={`w-4 h-4 border-4 border-primary ${
                        isUS ? "bg-brutal-red" : isSG ? "bg-brutal-cyan" : "bg-brutal-pink"
                      }`}
                    />
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-background border-4 border-primary px-3 py-2 text-xs whitespace-nowrap z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="font-black text-foreground">{d.country}</div>
                      <div className="text-muted-foreground font-bold">${d.spending.toLocaleString()}/capita</div>
                      <div className="text-muted-foreground font-bold">{d.lifeExp} years</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground mt-2 font-bold">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-brutal-red border border-primary" /> US</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-brutal-cyan border border-primary" /> Singapore</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-brutal-pink border border-primary" /> Others</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        <h3 className="section-title">All Countries</h3>
        <div className="overflow-x-auto border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-primary bg-brutal-yellow">
                <th className="text-left py-3 px-2 text-foreground font-black uppercase">Country</th>
                <th className="text-right py-3 px-2 text-foreground font-black uppercase">$/Capita</th>
                <th className="text-right py-3 px-2 text-foreground font-black uppercase">% GDP</th>
                <th className="text-right py-3 px-2 text-foreground font-black uppercase">Life Exp</th>
                <th className="text-right py-3 px-2 text-foreground font-black uppercase">Infant Mort</th>
                <th className="text-center py-3 px-2 text-foreground font-black uppercase">System</th>
                <th className="text-center py-3 px-2 text-foreground font-black uppercase">Universal</th>
              </tr>
            </thead>
            <tbody>
              {sortedByEfficiency.map((d) => (
                <tr
                  key={d.country}
                  className={`border-b border-primary hover:bg-brutal-cyan ${
                    d.country === "United States" ? "bg-brutal-red" : ""
                  }`}
                >
                  <td className="py-2 px-2 text-foreground font-bold">{d.country}</td>
                  <td className="py-2 px-2 text-right text-foreground font-bold">${d.spending.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-foreground font-bold">{d.pctGDP}%</td>
                  <td className="py-2 px-2 text-right text-foreground font-bold">{d.lifeExp}</td>
                  <td className="py-2 px-2 text-right text-foreground font-bold">{d.infantMort}</td>
                  <td className="py-2 px-2 text-center">
                    <span className="text-xs px-2 py-0.5 bg-muted border border-primary text-foreground font-bold">{d.system}</span>
                  </td>
                  <td className="py-2 px-2 text-center">{d.universal ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Drug Policy Tab ─────────────────────────────────────────────

function DrugTab() {
  const sorted = [...drugData].sort((a, b) => a.deaths - b.deaths);

  const approachColor: Record<string, string> = {
    Decriminalization: "bg-brutal-cyan text-foreground border-primary",
    "Harm Reduction": "bg-brutal-cyan text-foreground border-primary",
    Mixed: "bg-brutal-yellow text-foreground border-primary",
    Prohibitionist: "bg-brutal-red text-brutal-red-foreground border-primary",
  };

  return (
    <div className="space-y-8">
      <div className="card bg-brutal-cyan border-primary">
        <p className="text-foreground font-black mb-1">🏆 Key Finding</p>
        <p className="text-sm text-foreground font-bold">
          <strong className="text-foreground">Portugal</strong> decriminalized all drugs in 2001. Drug-induced deaths dropped
          80%, HIV among people who inject drugs fell 95%, and drug use remained below the EU average.
          The <strong className="text-foreground">US prohibitionist approach</strong> produces 32.4 drug deaths per 100K — 108× Portugal&apos;s rate.
        </p>
      </div>

      <div className="overflow-x-auto border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-primary bg-brutal-yellow">
              <th className="text-left py-3 px-2 text-foreground font-black uppercase">Country</th>
              <th className="text-center py-3 px-2 text-foreground font-black uppercase">Approach</th>
              <th className="text-right py-3 px-2 text-foreground font-black uppercase">Deaths/100K</th>
              <th className="text-right py-3 px-2 text-foreground font-black uppercase">Incarceration</th>
              <th className="text-right py-3 px-2 text-foreground font-black uppercase">HIV (PWID) %</th>
              <th className="text-right py-3 px-2 text-foreground font-black uppercase">Treatment %</th>
              <th className="text-right py-3 px-2 text-foreground font-black uppercase">Year</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => (
              <tr
                key={d.country}
                className={`border-b border-primary hover:bg-brutal-cyan ${
                  d.country === "United States" ? "bg-brutal-red" : ""
                }`}
              >
                <td className="py-2 px-2 text-foreground font-bold">{d.country}</td>
                <td className="py-2 px-2 text-center">
                  <span className={`text-xs px-2 py-0.5 border font-bold ${approachColor[d.approach] ?? "bg-muted text-foreground border-primary"}`}>
                    {d.approach}
                  </span>
                </td>
                <td className={`py-2 px-2 text-right font-black ${d.deaths > 10 ? "text-brutal-red" : d.deaths < 2 ? "text-brutal-cyan" : "text-foreground"}`}>
                  {d.deaths}
                </td>
                <td className="py-2 px-2 text-right text-foreground font-bold">{d.incarceration}</td>
                <td className="py-2 px-2 text-right text-foreground font-bold">{d.hiv}%</td>
                <td className="py-2 px-2 text-right text-foreground font-bold">{d.treatment}%</td>
                <td className="py-2 px-2 text-right text-muted-foreground font-bold">{d.year ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Education Tab ───────────────────────────────────────────────

function EducationTab() {
  const sorted = [...educationData].sort((a, b) => b.math - a.math);
  const maxMath = Math.max(...educationData.map((d) => d.math));

  return (
    <div className="space-y-8">
      <div className="card bg-brutal-cyan border-primary">
        <p className="text-foreground font-black mb-1">🏆 Key Finding</p>
        <p className="text-sm text-foreground font-bold">
          <strong className="text-foreground">Singapore</strong> spends 2.9% of GDP on education. Math score: 575 (top globally).
          The <strong className="text-foreground">US</strong> spends 4.9% of GDP. Math score: 465. That&apos;s 69% more money for 19% worse results.
          Turns out you can&apos;t fix a system by throwing cash at it. Weird.
        </p>
      </div>

      {/* Chart: PISA Math scores */}
      <div>
        <h3 className="section-title">PISA 2022 Math Scores vs Education Spending</h3>
        <div className="space-y-2">
          {sorted.map((d) => (
            <div key={d.country} className="flex items-center gap-3">
              <span className={`text-xs w-28 truncate font-bold ${d.country === "United States" ? "text-brutal-red" : "text-muted-foreground"}`}>
                {d.country}
              </span>
              <div className="flex-1 h-6 bg-muted border border-primary overflow-hidden relative">
                <div
                  className={`h-full ${d.country === "United States" ? "bg-brutal-red" : "bg-brutal-pink"}`}
                  style={{ width: `${(d.math / maxMath) * 100}%` }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-foreground font-black">
                  {d.math}
                </span>
              </div>
              <span className="text-xs text-muted-foreground w-16 text-right font-bold">{d.spending}% GDP</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full table */}
      <div className="overflow-x-auto border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-primary bg-brutal-yellow">
              <th className="text-left py-3 px-2 text-foreground font-black uppercase">Country</th>
              <th className="text-right py-3 px-2 text-foreground font-black uppercase">Spending %GDP</th>
              <th className="text-right py-3 px-2 text-foreground font-black uppercase">Math</th>
              <th className="text-right py-3 px-2 text-foreground font-black uppercase">Reading</th>
              <th className="text-right py-3 px-2 text-foreground font-black uppercase">Science</th>
              <th className="text-right py-3 px-2 text-foreground font-black uppercase">Average</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => {
              const avg = Math.round((d.math + d.reading + d.science) / 3);
              return (
                <tr
                  key={d.country}
                  className={`border-b border-primary hover:bg-brutal-cyan ${
                    d.country === "United States" ? "bg-brutal-red" : ""
                  }`}
                >
                  <td className="py-2 px-2 text-foreground font-bold">{d.country}</td>
                  <td className="py-2 px-2 text-right text-foreground font-bold">{d.spending}%</td>
                  <td className="py-2 px-2 text-right text-foreground font-bold">{d.math}</td>
                  <td className="py-2 px-2 text-right text-foreground font-bold">{d.reading}</td>
                  <td className="py-2 px-2 text-right text-foreground font-bold">{d.science}</td>
                  <td className="py-2 px-2 text-right font-black text-brutal-pink">{avg}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Criminal Justice Tab ────────────────────────────────────────

function JusticeTab() {
  const sorted = [...justiceData].sort((a, b) => a.recidivism - b.recidivism);

  return (
    <div className="space-y-8">
      <div className="card bg-brutal-cyan border-primary">
        <p className="text-foreground font-black mb-1">🏆 Key Finding</p>
        <p className="text-sm text-foreground font-bold">
          <strong className="text-foreground">Norway</strong> rehabilitates prisoners. Recidivism: 20%.
          The <strong className="text-foreground">US</strong> punishes them. Recidivism: 76%. Incarceration rate: 531 per 100K — highest in the developed world.
          You&apos;re paying more to make the problem worse. On my planet this would be called a bug. Here it&apos;s called &ldquo;tough on crime.&rdquo;
        </p>
      </div>

      {/* Incarceration vs Recidivism visual */}
      <div>
        <h3 className="section-title">Incarceration Rate vs Recidivism</h3>
        <div className="space-y-2">
          {sorted.map((d) => (
            <div key={d.country} className="card py-3">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs w-28 truncate font-bold ${d.country === "United States" ? "text-brutal-red" : "text-foreground"}`}>
                  {d.country}
                </span>
                <span className="text-xs px-2 py-0.5 bg-muted border border-primary text-foreground font-bold">{d.approach}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-[10px] text-muted-foreground mb-0.5 font-bold">Incarceration /100K</div>
                  <div className="h-3 bg-muted border border-primary overflow-hidden">
                    <div
                      className={`h-full ${d.incarceration > 200 ? "bg-brutal-red" : "bg-brutal-cyan"}`}
                      style={{ width: `${(d.incarceration / 531) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-bold">{d.incarceration}</div>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-muted-foreground mb-0.5 font-bold">Recidivism %</div>
                  <div className="h-3 bg-muted border border-primary overflow-hidden">
                    <div
                      className={`h-full ${d.recidivism > 50 ? "bg-brutal-red" : "bg-brutal-cyan"}`}
                      style={{ width: `${d.recidivism}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-bold">{d.recidivism}%</div>
                </div>
                <div className="w-20 text-right">
                  <div className="text-[10px] text-muted-foreground font-bold">Homicide</div>
                  <div className={`text-sm font-black ${d.homicide > 5 ? "text-brutal-red" : "text-foreground"}`}>
                    {d.homicide}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
