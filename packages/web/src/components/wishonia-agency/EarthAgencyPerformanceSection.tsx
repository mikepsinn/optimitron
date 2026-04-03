"use client";

import type { EarthAgency, AgencyPerformance } from "@optimitron/data";
import { AgencyGradeChart } from "@/components/shared/AgencyGradeChart";
import {
  Tabs,
  TabsTriggerList,
  TabsTrigger,
  TabsPanels,
  TabsContent,
} from "@/components/retroui/Tab";

interface EarthAgencyPerformanceSectionProps {
  earthAgencies: EarthAgency[];
}

/** Reconstruct the AgencyPerformance shape that AgencyGradeChart expects. */
function toChartData(ea: EarthAgency): AgencyPerformance {
  return {
    agencyId: ea.id,
    agencyName: ea.name,
    emoji: ea.emoji,
    countryCode: ea.countryCode,
    ...ea.performance!,
  };
}

function SingleChart({ agency }: { agency: EarthAgency }) {
  return (
    <div className="border-4 border-primary bg-background p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <AgencyGradeChart agency={toChartData(agency)} showAllOutcomes />
    </div>
  );
}

function TabbedCharts({ agencies }: { agencies: EarthAgency[] }) {
  return (
    <Tabs>
      <TabsTriggerList className="flex-wrap">
        {agencies.map((ea) => (
          <TabsTrigger
            key={ea.id}
            className="border-4 text-sm font-black uppercase"
          >
            {ea.emoji} {ea.name} — {ea.performance!.grade}
          </TabsTrigger>
        ))}
      </TabsTriggerList>
      <TabsPanels>
        {agencies.map((ea) => (
          <TabsContent
            key={ea.id}
            className="border-4 border-primary bg-background p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <AgencyGradeChart
              agency={toChartData(ea)}
              showAllOutcomes
            />
          </TabsContent>
        ))}
      </TabsPanels>
    </Tabs>
  );
}

export function EarthAgencyPerformanceSection({
  earthAgencies,
}: EarthAgencyPerformanceSectionProps) {
  if (earthAgencies.length === 0) return null;

  return (
    <section className="mb-16">
      <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
        Spending vs Outcomes
      </h2>
      {earthAgencies.length === 1 ? (
        <SingleChart agency={earthAgencies[0]!} />
      ) : (
        <TabbedCharts agencies={earthAgencies} />
      )}
    </section>
  );
}
