'use client';

import { useEffect, useState } from 'react';
import { getTreatmentsByConditionSlug } from '@/lib/actions/treatments';
import { AlertCircle } from 'lucide-react';
import { InterventionCard } from '@/components/shared/InterventionCard';
import { NeobrutalistLoader, NeobrutalistCardLoader } from '@/components/ui/neobrutalist-loader';
import type { TreatmentComparisonResult } from '@/types/treatment';

interface TreatmentRankingsProps {
  conditionName: string;
}

// Convert condition name to URL-safe slug
function conditionToSlug(conditionName: string): string {
  return conditionName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function TreatmentRankings({ conditionName }: TreatmentRankingsProps) {
  const [comparisonData, setComparisonData] = useState<TreatmentComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    async function fetchTreatments() {
      setIsLoading(true);
      try {
        const slug = conditionToSlug(conditionName);
        const data = await getTreatmentsByConditionSlug(slug);

        if (data) {
          setComparisonData(data);
          setHasData(true);
        } else {
          setComparisonData(null);
          setHasData(false);
        }
      } catch (err) {
        console.error('Error loading treatment data:', err);
        setComparisonData(null);
        setHasData(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTreatments();
  }, [conditionName]);

  if (isLoading) {
    return (
      <div>
        <NeobrutalistLoader message="Loading Treatment Rankings..." size="lg" />
        <div className="mt-8">
          <NeobrutalistCardLoader count={3} />
        </div>
      </div>
    );
  }

  if (!hasData || !comparisonData) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
          <AlertCircle className="h-8 w-8 text-yellow-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Treatment Data Coming Soon</h3>
        <p className="text-muted-foreground mb-4">
          We're currently generating evidence-based treatment rankings for {conditionName}.
        </p>
        <p className="text-sm text-muted-foreground">
          Our AI is analyzing clinical trials and meta-analyses. Check back soon!
        </p>
      </div>
    );
  }

  if (comparisonData.treatments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No treatment data found for {conditionName}
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
