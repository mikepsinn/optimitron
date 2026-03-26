"use client";

import {
  CONTRIBUTION_LIVES_SAVED_PER_PCT_POINT,
  CONTRIBUTION_DALYS_PER_PCT_POINT,
  CONTRIBUTION_SUFFERING_HOURS_PER_PCT_POINT,
} from "@optimitron/data/parameters";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCardGrid, type StatCardProps } from "@/components/ui/stat-card";

function fmtBig(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${Math.round(n / 1e6)}M`;
  return n.toLocaleString();
}

const stats: StatCardProps[] = [
  {
    value: fmtBig(CONTRIBUTION_LIVES_SAVED_PER_PCT_POINT.value),
    label: "Lives Saved",
    color: "pink",
    size: "lg",
  },
  {
    value: fmtBig(CONTRIBUTION_DALYS_PER_PCT_POINT.value),
    label: "DALYs Averted",
    color: "cyan",
    size: "lg",
  },
  {
    value: fmtBig(CONTRIBUTION_SUFFERING_HOURS_PER_PCT_POINT.value),
    label: "Suffering Hours Prevented",
    color: "yellow",
    size: "lg",
  },
];

export function PercentagePointValue() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-4 sm:px-8">
      <SectionHeader
        title="Each Percentage Point"
        subtitle="Every share, every vote, every conversation shifts the probability. This is what one percentage point is worth."
        size="lg"
      />
      <div className="max-w-4xl w-full">
        <StatCardGrid stats={stats} columns={3} />
      </div>
    </div>
  );
}
