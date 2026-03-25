"use client";

import { fmtParam } from "@/lib/format-parameter";
import {
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
} from "@/lib/parameters-calculations-citations";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCardGrid, type StatCardProps } from "@/components/ui/stat-card";
import { CountUp } from "@/components/animations/CountUp";

const treatyGain = fmtParam(TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA);
const treatyGainRaw = Math.round(TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA.value / 1e6 * 10) / 10;
const wishoniaGain = fmtParam(WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA);
const dysfunctionTax = fmtParam(POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL);

const trajectories: StatCardProps[] = [
  {
    value: "$1.34M",
    label: "Status Quo",
    description: "Current trajectory lifetime income",
    color: "default",
  },
  {
    value: `+$${treatyGain}`,
    label: "1% Treaty",
    description: "Lifetime income gain per person",
    color: "cyan",
  },
  {
    value: `+$${wishoniaGain}`,
    label: "Full Reform",
    description: "Optimal governance trajectory",
    color: "pink",
  },
];

export function PersonalUpsideCard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center px-4 sm:px-8">
      <SectionHeader
        title="Your Personal Upside"
        subtitle={`You currently lose $${dysfunctionTax}/year to political dysfunction. Here is what you gain when it stops.`}
      />

      {/* Giant animated number */}
      <div className="text-6xl sm:text-7xl md:text-8xl font-black text-brutal-pink mb-2">
        +$<CountUp value={treatyGainRaw} duration={2} suffix="M" />
      </div>
      <p className="text-xl font-black text-foreground uppercase mb-8">
        Lifetime income gain per person
      </p>

      <div className="max-w-3xl w-full">
        <StatCardGrid stats={trajectories} columns={3} />
      </div>
    </div>
  );
}
