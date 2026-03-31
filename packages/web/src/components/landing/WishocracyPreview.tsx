"use client";

import { useEffect, useState } from "react";
import { PieChart } from "@/components/retroui/charts/PieChart";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { wishocracyLink } from "@/lib/routes";
import { GameCTA } from "@/components/ui/game-cta";

interface PreferenceData {
  citizenAllocations: Record<string, number>;
  actualGovernmentAllocations: Record<string, number>;
  totalParticipants: number;
  totalAllocations: number;
}

const BRUTAL_COLORS = [
  "hsl(var(--brutal-pink))",
  "hsl(var(--brutal-cyan))",
  "hsl(var(--brutal-yellow))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--brutal-red))",
  "hsl(var(--muted))",
];

function formatItemName(slug: string): string {
  return slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toChartData(allocations: Record<string, number>) {
  return Object.entries(allocations)
    .filter(([, pct]) => pct > 0.5)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id, pct]) => ({ name: formatItemName(id), value: Math.round(pct * 10) / 10 }));
}

/**
 * Landing page section: side-by-side pie charts showing citizen preferences
 * vs actual government spending. Fetches live data from /api/wishocracy/preferences.
 *
 * "When you ask people what they want, cures beat bombs. Nobody has ever asked."
 */
export function WishocracyPreview() {
  const [data, setData] = useState<PreferenceData | null>(null);

  useEffect(() => {
    fetch("/api/wishocracy/preferences")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.citizenAllocations) setData(d);
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  const citizenData = toChartData(data.citizenAllocations);
  const govData = toChartData(data.actualGovernmentAllocations);

  if (citizenData.length === 0) return null;

  return (
    <section className="bg-background border-t-4 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            When You Ask People What They Want
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto font-bold text-muted-foreground">
            Cures beat bombs. Nobody has ever asked. Until now.
            {data.totalParticipants > 0 && (
              <span className="block mt-1">
                {data.totalParticipants.toLocaleString()} players.{" "}
                {data.totalAllocations.toLocaleString()} comparisons.
              </span>
            )}
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <ScrollReveal direction="left">
            <div className="p-6 border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-black uppercase text-center mb-4">
                What Citizens Want
              </h3>
              <div className="h-64">
                <PieChart
                  data={citizenData}
                  dataKey="value"
                  nameKey="name"
                  colors={BRUTAL_COLORS}
                  innerRadius={40}
                  outerRadius={90}
                  valueFormatter={(v) => `${v}%`}
                />
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.15}>
            <div className="p-6 border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-black uppercase text-center mb-4">
                What Governments Spend
              </h3>
              <div className="h-64">
                <PieChart
                  data={govData}
                  dataKey="value"
                  nameKey="name"
                  colors={BRUTAL_COLORS}
                  innerRadius={40}
                  outerRadius={90}
                  valueFormatter={(v) => `${v}%`}
                />
              </div>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div className="text-center">
            <p className="text-lg font-black mb-6 text-foreground">
              See the gap? That gap costs 150,000 lives a day.
            </p>
            <GameCTA href="/agencies/dcongress/wishocracy" variant="primary">
              Make Your Allocation &rarr;
            </GameCTA>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
