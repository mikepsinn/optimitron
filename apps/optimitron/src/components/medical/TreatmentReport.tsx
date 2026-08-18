'use client';

import type { TreatmentForCondition } from '@/types/treatment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OutcomeLabel, type OutcomeCategory } from '@/components/landing/OutcomeLabel';
import { Badge } from '@/components/ui/badge';
import { Clock, Award } from 'lucide-react';
import { TreatmentMetricsGrid } from '@/components/treatment/TreatmentMetricsGrid';
import { HealthEconomicsDisplay } from '@/components/treatment/HealthEconomicsDisplay';

interface TreatmentReportProps {
  treatment: TreatmentForCondition;
  conditionName: string;
}

export function TreatmentReport({ treatment, conditionName }: TreatmentReportProps) {
  // Convert treatment data to OutcomeLabel format
  const outcomeData: OutcomeCategory[] = [];

  // Efficacy Outcomes
  const efficacyItems = [];
  if (treatment.effectiveness) {
    efficacyItems.push({
      name: 'Overall Effectiveness',
      value: { percentage: treatment.effectiveness },
      isPositive: true,
    });
  }
  if (treatment.responseRate) {
    efficacyItems.push({
      name: 'Response Rate',
      value: { percentage: treatment.responseRate },
      isPositive: true,
    });
  }
  if (treatment.remissionRate) {
    efficacyItems.push({
      name: 'Remission Rate',
      value: { percentage: treatment.remissionRate },
      isPositive: true,
    });
  }
  if (efficacyItems.length > 0) {
    outcomeData.push({
      title: 'Efficacy Outcomes',
      items: efficacyItems,
    });
  }

  // Side Effects
  if (treatment.sideEffects && treatment.sideEffects.length > 0) {
    outcomeData.push({
      title: 'Common Side Effects',
      items: treatment.sideEffects.map(se => ({
        name: se.name,
        value: {
          percentage: se.percentage,
        },
        isPositive: false,
      })),
      isSideEffectCategory: true,
    });
  }

  // Prepare footer data
  const footerData = treatment.citations && treatment.citations.length > 0 ? {
    sourceCitation: {
      citations: treatment.citations.slice(0, 3), // Show first 3 citations
    },
  } : undefined;

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <TreatmentMetricsGrid
        effectiveness={treatment.effectiveness}
        safetyScore={treatment.safetyScore}
        trials={treatment.trials}
        participants={treatment.participants}
        showSafetyScale={true}
      />

      {/* Treatment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {treatment.dosageRange && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Dosage Range</div>
                <div className="text-sm">{treatment.dosageRange}</div>
              </div>
            )}
            {treatment.timeToEffect && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Time to Effect
                </div>
                <div className="text-sm">{treatment.timeToEffect}</div>
              </div>
            )}
            {treatment.treatmentDuration && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Treatment Duration</div>
                <div className="text-sm">{treatment.treatmentDuration}</div>
              </div>
            )}
            {treatment.evidenceQuality && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  Evidence Quality
                </div>
                <Badge variant={treatment.evidenceQuality === 'high' ? 'default' : 'secondary'}>
                  {treatment.evidenceQuality.toUpperCase()}
                </Badge>
              </div>
            )}
          </div>

          {treatment.nnt && (
            <div className="pt-2 border-t">
              <div className="text-sm font-medium text-muted-foreground mb-1">Number Needed to Treat (NNT)</div>
              <div className="text-sm">
                <span className="font-semibold text-emerald-600">{treatment.nnt}</span>
                <span className="text-muted-foreground ml-2">
                  (Treat {treatment.nnt} patients to see 1 additional successful outcome)
                </span>
              </div>
            </div>
          )}

          {treatment.nnh && (
            <div className="pt-2 border-t">
              <div className="text-sm font-medium text-muted-foreground mb-1">Number Needed to Harm (NNH)</div>
              <div className="text-sm">
                <span className="font-semibold text-orange-600">{treatment.nnh}</span>
                <span className="text-muted-foreground ml-2">
                  (Treat {treatment.nnh} patients to see 1 additional serious adverse event)
                </span>
              </div>
            </div>
          )}

          {treatment.confidenceScore && (
            <div className="pt-2 border-t">
              <div className="text-sm font-medium text-muted-foreground mb-1">Confidence Score</div>
              <div className="text-sm">
                <span className="font-semibold">{treatment.confidenceScore}%</span>
                <span className="text-muted-foreground ml-2">confidence in effectiveness data</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Economics */}
      {treatment.healthEconomics && (
        <HealthEconomicsDisplay 
          healthEconomics={treatment.healthEconomics} 
          variant="detailed"
        />
      )}

      {/* OutcomeLabel - Effectiveness and Side Effects */}
      {outcomeData.length > 0 && (
        <OutcomeLabel
          title={`${treatment.name} Outcomes`}
          subtitle={`for ${conditionName}`}
          data={outcomeData}
          footer={footerData}
        />
      )}
    </div>
  );
}
