"use client";

import { useEffect, useState, useMemo } from "react";
import { PieChart } from "@/components/retroui/charts/PieChart";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { GameCTA } from "@/components/ui/game-cta";
import { WishocraticPairSlider } from "@/components/wishocracy/wishocratic-pair-slider";
import { US_WISHOCRATIC_ITEMS, getUSWishocraticAllocations } from "@optimitron/data/datasets/us-wishocratic-items";
import type { WishocraticItemId } from "@/lib/wishocracy-data";

interface PreferenceData {
  citizenAllocations: Record<string, number>;
  actualGovernmentAllocations: Record<string, number>;
  totalParticipants: number;
  totalAllocations: number;
}

const BRUTAL_COLORS = [
  "var(--foreground)",
  "var(--background)",
  "var(--background)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--brutal-red)",
  "var(--brutal-green)",
];

function formatItemName(slug: string): string {
  return slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ChartLegend({
  data,
  colors,
}: {
  data: { name: string; value: number }[];
  colors: string[];
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 justify-center">
      {data.map((item, i) => (
        <div key={item.name} className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 border-2 border-primary shrink-0"
            style={{ backgroundColor: colors[i % colors.length] }}
          />
          <span className="text-xs font-black uppercase">
            {item.name} {item.value}%
          </span>
        </div>
      ))}
    </div>
  );
}

function toChartData(allocations: Record<string, number>) {
  return Object.entries(allocations)
    .filter(([, pct]) => pct > 0.5)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id, pct]) => ({ name: formatItemName(id), value: Math.round(pct * 10) / 10 }));
}

/** Build estimated citizen allocations from the data layer */
function getEstimatedCitizenAllocations(): Record<string, number> {
  const allocs: Record<string, number> = {};
  for (const [id, item] of Object.entries(US_WISHOCRATIC_ITEMS)) {
    if (item.estimatedCitizenAllocationPct > 0) {
      allocs[id] = item.estimatedCitizenAllocationPct;
    }
  }
  return allocs;
}

/** Pick a compelling pair for the landing page slider.
 * No casting — TypeScript catches invalid IDs at build time. */
const LANDING_PAIRS: [WishocraticItemId, WishocraticItemId][] = [
  ["PRAGMATIC_CLINICAL_TRIALS", "BOMBING_IRAN"],
  ["UNIVERSAL_BASIC_INCOME", "DRUG_WAR"],
  ["EARLY_CHILDHOOD_EDUCATION", "NUCLEAR_WEAPONS_MODERNIZATION"],
];

function isStableReviewMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const flags = window as Window & {
    __OPTIMITRON_COPY_PREVIEW__?: boolean;
    __OPTIMITRON_VISUAL_REVIEW__?: boolean;
  };
  return Boolean(
    flags.__OPTIMITRON_COPY_PREVIEW__ || flags.__OPTIMITRON_VISUAL_REVIEW__,
  );
}

export function WishocracyPreview() {
  const [liveData, setLiveData] = useState<PreferenceData | null>(null);
  const [pairIndex, setPairIndex] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  // Pick a random pair on mount
  useEffect(() => {
    if (isStableReviewMode()) return;
    setPairIndex(Math.floor(Math.random() * LANDING_PAIRS.length));
  }, []);

  // Try to fetch live data, fall back to estimated
  useEffect(() => {
    if (isStableReviewMode()) return;
    fetch("/api/wishocracy/preferences")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.citizenAllocations) setLiveData(d);
      })
      .catch(() => {});
  }, []);

  // Always use the curated estimated data for the citizen chart —
  // the DB results are too sparse / skewed from low sample sizes
  const citizenAllocations = getEstimatedCitizenAllocations();
  const govAllocations = liveData?.actualGovernmentAllocations ?? getUSWishocraticAllocations();

  const citizenData = useMemo(() => toChartData(citizenAllocations), [citizenAllocations]);
  const govData = useMemo(() => toChartData(govAllocations), [govAllocations]);

  const pair = LANDING_PAIRS[pairIndex] ?? LANDING_PAIRS[0];

  return (
    <section className="overflow-x-clip bg-background border-t-4 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            When You Ask People What They Want
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto font-bold text-muted-foreground">
            Cures beat bombs. Nobody has ever asked. Until now.
            {liveData && liveData.totalParticipants > 0 && (
              <span className="block mt-1">
                {liveData.totalParticipants.toLocaleString()} players.{" "}
                {liveData.totalAllocations.toLocaleString()} comparisons.
              </span>
            )}
          </p>
        </ScrollReveal>

        {/* Pairwise slider — the core interaction */}
        {!hasVoted && (
          <ScrollReveal className="mb-12">
            <WishocraticPairSlider
              itemA={pair[0]}
              itemB={pair[1]}
              onSubmit={() => setHasVoted(true)}
            />
          </ScrollReveal>
        )}

        {hasVoted && (
          <ScrollReveal className="mb-12 text-center">
            <p className="text-lg font-black text-foreground mb-4">
              See? Four seconds. Your government couldn&apos;t do that in four years.
            </p>
            <GameCTA href="/agencies/dcongress/wishocracy" variant="primary">
              Do All 10 Comparisons &rarr;
            </GameCTA>
          </ScrollReveal>
        )}

        {/* Pie charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <ScrollReveal direction="left">
            <div className="p-6 border-4 border-primary bg-background text-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-black uppercase text-center mb-4">
                What People Actually Want
              </h3>
              <PieChart
                className="h-64"
                data={citizenData}
                dataKey="value"
                nameKey="name"
                colors={BRUTAL_COLORS}
                innerRadius={40}
                outerRadius={90}
                valueFormatter={(v) => `${v}%`}
              />
              <ChartLegend data={citizenData} colors={BRUTAL_COLORS} />
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.15}>
            <div className="p-6 border-4 border-primary bg-background text-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-black uppercase text-center mb-4">
                What Governments Spend
              </h3>
              <PieChart
                className="h-64"
                data={govData}
                dataKey="value"
                nameKey="name"
                colors={BRUTAL_COLORS}
                innerRadius={40}
                outerRadius={90}
                valueFormatter={(v) => `${v}%`}
              />
              <ChartLegend data={govData} colors={BRUTAL_COLORS} />
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div className="text-center">
            <p className="text-lg font-black mb-6 text-foreground">
              See the gap? That gap costs 150,000 lives a day.
            </p>
            {!hasVoted && (
              <GameCTA href="/agencies/dcongress/wishocracy" variant="primary">
                Make Your Allocation &rarr;
              </GameCTA>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
