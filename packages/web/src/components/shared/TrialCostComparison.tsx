"use client";

import {
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/data/parameters";
import { SectionHeader } from "@/components/ui/section-header";
import { ComparisonCard } from "@/components/ui/comparison-card";
import { StatCardGrid, type StatCardProps } from "@/components/ui/stat-card";

const oldCost = `$${Math.round(TRADITIONAL_PHASE3_COST_PER_PATIENT.value).toLocaleString()}`;
const newCost = `$${Math.round(DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT.value).toLocaleString()}`;
const capacityX = DFDA_TRIAL_CAPACITY_MULTIPLIER.value.toFixed(1);
const oldYears = Math.round(STATUS_QUO_QUEUE_CLEARANCE_YEARS.value);
const newYears = Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value);

const impactStats: StatCardProps[] = [
  {
    value: `${capacityX}×`,
    label: "Capacity increase",
    color: "yellow",
  },
  {
    value: `${oldYears} → ${newYears} yrs`,
    label: "Queue to cure all diseases",
    color: "pink",
  },
];

export function TrialCostComparison() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center px-4 sm:px-8">
      <SectionHeader
        title="Trial Cost Revolution"
        subtitle="Same patients. Same diseases. Real-world conditions instead of artificial ones."
      />

      <div className="max-w-3xl w-full mb-8">
        <ComparisonCard
          title="Cost per Patient"
          left={{
            value: oldCost,
            label: "Traditional Phase 3",
            subtitle: "per patient",
            color: "foreground",
          }}
          right={{
            value: newCost,
            label: "Pragmatic Trial",
            subtitle: "per patient",
            color: "cyan",
          }}
        />
      </div>

      <div className="max-w-xl w-full">
        <StatCardGrid stats={impactStats} columns={2} />
      </div>
    </div>
  );
}
