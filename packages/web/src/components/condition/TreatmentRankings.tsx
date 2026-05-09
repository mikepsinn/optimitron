'use client';

import { AlertCircle } from 'lucide-react';
import { InterventionCard } from '@/components/shared/InterventionCard';
import type { ConditionTreatmentsFile } from '@/types/treatment';

interface TreatmentRankingsProps {
  conditionName: string;
  comparisonData: ConditionTreatmentsFile | null;
}

export function TreatmentRankings({ conditionName, comparisonData }: TreatmentRankingsProps) {
  if (!comparisonData) {
    return (
      <div className="text-center py-8">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center border-4 border-foreground bg-background text-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-black uppercase">
          Treatment Data Not Ready
        </h3>
        <p className="mb-4 font-bold text-muted-foreground">
          No ranked treatment file for {conditionName} yet. The evidence queue
          remains undefeated, which is embarrassing for a species with
          spreadsheets.
        </p>
        <p className="text-sm font-bold text-muted-foreground">
          Add the dataset, rerun the checks, and let the brochures lose fairly.
        </p>
      </div>
    );
  }

  if (comparisonData.treatments.length === 0) {
    return (
      <div className="py-8 text-center font-bold text-muted-foreground">
        No treatment rows found for {conditionName}. The database has produced
        a very small shrug.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comparisonData.treatments.map((treatment, index) => (
        <InterventionCard
          key={treatment.name}
          treatment={treatment}
          conditionName={conditionName}
          index={index}
          showRanking={true}
        />
      ))}
    </div>
  );
}
