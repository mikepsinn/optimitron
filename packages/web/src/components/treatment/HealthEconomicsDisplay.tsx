'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, HelpCircle, Scale } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { HealthEconomics } from '@/types/treatment';

interface HealthEconomicsDisplayProps {
  healthEconomics: HealthEconomics;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

type CostEffectivenessRating =
  | 'excellent'
  | 'good'
  | 'moderate'
  | 'poor'
  | 'dominated';

type RatingSwatch = {
  bg: string;
  text: string;
  border: string;
  badge: 'default' | 'secondary' | 'outline' | 'destructive';
};

const RATING_SWATCHES: Record<CostEffectivenessRating, RatingSwatch> = {
  excellent: {
    bg: 'bg-brutal-green',
    text: 'text-brutal-green-foreground',
    border: 'border-foreground',
    badge: 'default',
  },
  good: {
    bg: 'bg-brutal-cyan',
    text: 'text-brutal-cyan-foreground',
    border: 'border-foreground',
    badge: 'secondary',
  },
  moderate: {
    bg: 'bg-brutal-yellow',
    text: 'text-brutal-yellow-foreground',
    border: 'border-foreground',
    badge: 'outline',
  },
  poor: {
    bg: 'bg-brutal-red',
    text: 'text-brutal-red-foreground',
    border: 'border-foreground',
    badge: 'outline',
  },
  dominated: {
    bg: 'bg-brutal-red',
    text: 'text-brutal-red-foreground',
    border: 'border-foreground',
    badge: 'destructive',
  },
};

function getCostEffectivenessColors(rating: CostEffectivenessRating) {
  return RATING_SWATCHES[rating];
}

function getICERInterpretation(icer: number): string {
  if (icer < 50000) return 'Excellent value, highly cost-effective';
  if (icer < 100000) return 'Good value, cost-effective';
  if (icer < 150000) return 'Moderate value, may be cost-effective';
  return 'Poor value, likely not cost-effective';
}

export function HealthEconomicsDisplay({
  healthEconomics,
  variant = 'default',
  className = '',
}: HealthEconomicsDisplayProps) {
  const hasData = healthEconomics && (
    healthEconomics.annualCostOfCare ||
    healthEconomics.icer ||
    healthEconomics.qalysGained ||
    healthEconomics.costEffectivenessRating ||
    healthEconomics.costPerResponder ||
    healthEconomics.costPerRemission ||
    healthEconomics.vsComparator
  );

  if (!hasData) {
    return null;
  }

  // Compact variant for cards
  if (variant === 'compact') {
    return (
      <div
        className={`bg-brutal-green text-brutal-green-foreground border-2 border-foreground rounded-md p-4 ${className}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-4 w-4" />
          <p className="text-sm font-bold uppercase">Annual Cost of Care</p>
        </div>
        {healthEconomics.annualCostOfCare && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs font-bold mb-1">Drug Cost</p>
              <p className="text-sm font-black">
                ${healthEconomics.annualCostOfCare.drugCost.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold mb-1">Monitoring</p>
              <p className="text-sm font-black">
                ${healthEconomics.annualCostOfCare.monitoringCost.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold mb-1">Side Effects</p>
              <p className="text-sm font-black">
                ${healthEconomics.annualCostOfCare.sideEffectManagement.toLocaleString()}
              </p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs font-bold mb-1 uppercase">Total Annual</p>
              <p className="text-base font-black">
                ${healthEconomics.annualCostOfCare.totalAnnual.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Additional metrics */}
        {(healthEconomics.costPerRemission ||
          healthEconomics.costPerResponder ||
          healthEconomics.qalysGained ||
          healthEconomics.icer ||
          healthEconomics.costEffectivenessRating) && (
          <div className="mt-3 pt-3 border-t-2 border-foreground grid grid-cols-2 gap-3">
            {healthEconomics.costEffectivenessRating && (
              <div>
                <p className="text-xs font-bold mb-1">Cost-Effectiveness</p>
                <Badge
                  variant={
                    getCostEffectivenessColors(healthEconomics.costEffectivenessRating).badge
                  }
                >
                  {healthEconomics.costEffectivenessRating.toUpperCase()}
                </Badge>
              </div>
            )}
            {healthEconomics.qalysGained && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <p className="text-xs font-bold mb-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        QALYs Gained
                        <HelpCircle className="h-3 w-3" />
                      </p>
                      <p className="text-sm font-black">
                        {healthEconomics.qalysGained}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quality-Adjusted Life Years gained vs no treatment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {healthEconomics.icer && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <p className="text-xs font-bold mb-1">ICER</p>
                      <p className="text-sm font-black">
                        ${healthEconomics.icer.toLocaleString()}/QALY
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getICERInterpretation(healthEconomics.icer)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {healthEconomics.costPerRemission && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <p className="text-xs font-bold mb-1 flex items-center gap-1">
                        Cost per Remission
                        <HelpCircle className="h-3 w-3" />
                      </p>
                      <p className="text-sm font-black">
                        ${healthEconomics.costPerRemission.toLocaleString()}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total cost to achieve one complete remission</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {healthEconomics.costPerResponder && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <p className="text-xs font-bold mb-1 flex items-center gap-1">
                        Cost per Responder
                        <HelpCircle className="h-3 w-3" />
                      </p>
                      <p className="text-sm font-black">
                        ${healthEconomics.costPerResponder.toLocaleString()}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total cost to achieve one treatment response</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default/Detailed variant for full pages
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Health Economics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Annual Cost of Care */}
        {healthEconomics.annualCostOfCare && (
          <div>
            <div className="text-sm font-bold uppercase mb-3">Annual Cost of Care</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex justify-between border-b-2 border-foreground pb-2">
                <span className="text-muted-foreground font-bold">Drug Cost:</span>
                <span className="font-black">${healthEconomics.annualCostOfCare.drugCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b-2 border-foreground pb-2">
                <span className="text-muted-foreground font-bold">Monitoring:</span>
                <span className="font-black">${healthEconomics.annualCostOfCare.monitoringCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b-2 border-foreground pb-2">
                <span className="text-muted-foreground font-bold">Side Effect Mgmt:</span>
                <span className="font-black">${healthEconomics.annualCostOfCare.sideEffectManagement.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black border-b-2 border-foreground pb-2">
                <span>Total Annual:</span>
                <span>${healthEconomics.annualCostOfCare.totalAnnual.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Cost-Effectiveness Metrics */}
        {(healthEconomics.icer ||
          healthEconomics.costEffectivenessRating ||
          healthEconomics.qalysGained ||
          healthEconomics.qalysVsComparator) && (
          <div className="border-t-2 border-foreground pt-4">
            <div className="text-sm font-bold uppercase mb-3">Cost-Effectiveness Analysis</div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {healthEconomics.costEffectivenessRating && (
                <div>
                  <div className="text-xs text-muted-foreground font-bold mb-2">Cost-Effectiveness Rating</div>
                  <Badge
                    variant={
                      getCostEffectivenessColors(healthEconomics.costEffectivenessRating).badge
                    }
                    className="text-sm"
                  >
                    {healthEconomics.costEffectivenessRating.toUpperCase()}
                  </Badge>
                </div>
              )}
              {healthEconomics.icer && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-xs text-muted-foreground font-bold mb-1">ICER</div>
                        <div className="text-lg font-black">${healthEconomics.icer.toLocaleString()}/QALY</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-black">Incremental Cost-Effectiveness Ratio</p>
                      <p className="text-xs font-bold">{getICERInterpretation(healthEconomics.icer)}</p>
                      <p className="text-xs font-bold mt-1">Threshold: &lt;$50k excellent, $50-100k good, $100-150k moderate, &gt;$150k poor</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {healthEconomics.qalysGained !== undefined && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-xs text-muted-foreground font-bold mb-1 flex items-center gap-1">
                          QALYs Gained
                          <HelpCircle className="h-3 w-3" />
                        </div>
                        <div className="text-lg font-black">{healthEconomics.qalysGained}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Quality-Adjusted Life Years gained vs no treatment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {healthEconomics.qalysVsComparator !== undefined && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-xs text-muted-foreground font-bold mb-1">QALYs vs Comparator</div>
                        <div className="text-lg font-black">+{healthEconomics.qalysVsComparator}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Additional QALYs gained vs standard treatment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        )}

        {/* Outcome-Based Costs */}
        {(healthEconomics.costPerResponder ||
          healthEconomics.costPerRemission ||
          healthEconomics.costPerQALY) && (
          <div className="border-t-2 border-foreground pt-4">
            <div className="text-sm font-bold uppercase mb-3">Outcome-Based Costs</div>
            <div className="grid md:grid-cols-3 gap-4">
              {healthEconomics.costPerResponder && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help border-2 border-foreground rounded-md p-3">
                        <div className="text-xs text-muted-foreground font-bold mb-1 flex items-center gap-1">
                          Cost per Responder
                          <HelpCircle className="h-3 w-3" />
                        </div>
                        <div className="text-lg font-black">
                          ${healthEconomics.costPerResponder.toLocaleString()}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total cost to achieve one treatment response</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {healthEconomics.costPerRemission && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help border-2 border-foreground rounded-md p-3">
                        <div className="text-xs text-muted-foreground font-bold mb-1 flex items-center gap-1">
                          Cost per Remission
                          <HelpCircle className="h-3 w-3" />
                        </div>
                        <div className="text-lg font-black">
                          ${healthEconomics.costPerRemission.toLocaleString()}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total cost to achieve one complete remission</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {healthEconomics.costPerQALY && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help border-2 border-foreground rounded-md p-3">
                        <div className="text-xs text-muted-foreground font-bold mb-1 flex items-center gap-1">
                          Cost per QALY
                          <HelpCircle className="h-3 w-3" />
                        </div>
                        <div className="text-lg font-black">
                          ${healthEconomics.costPerQALY.toLocaleString()}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cost per Quality-Adjusted Life Year gained</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        )}

        {/* Comparator Analysis */}
        {healthEconomics.vsComparator && (
          <div className="border-t-2 border-foreground pt-4">
            <div className="text-sm font-bold uppercase mb-3 flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Comparison vs {healthEconomics.vsComparator.comparatorName}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border-2 border-foreground rounded-md p-3">
                <div className="text-xs text-muted-foreground font-bold mb-1">Cost Difference</div>
                <div className="text-lg font-black">
                  {healthEconomics.vsComparator.costDifference > 0 ? '+' : ''}
                  ${healthEconomics.vsComparator.costDifference.toLocaleString()}/year
                </div>
                <div className="text-xs text-muted-foreground font-bold mt-1">
                  {healthEconomics.vsComparator.costDifference < 0
                    ? 'Less expensive'
                    : healthEconomics.vsComparator.costDifference > 0
                    ? 'More expensive'
                    : 'Same cost'}
                </div>
              </div>
              <div className="border-2 border-foreground rounded-md p-3">
                <div className="text-xs text-muted-foreground font-bold mb-1">QALY Difference</div>
                <div className="text-lg font-black">
                  {healthEconomics.vsComparator.qalysGainedDifference > 0 ? '+' : ''}
                  {healthEconomics.vsComparator.qalysGainedDifference.toFixed(2)} QALYs
                </div>
                <div className="text-xs text-muted-foreground font-bold mt-1">
                  {healthEconomics.vsComparator.qalysGainedDifference > 0
                    ? 'Better outcomes'
                    : healthEconomics.vsComparator.qalysGainedDifference < 0
                    ? 'Worse outcomes'
                    : 'Same outcomes'}
                </div>
              </div>
              <div className="border-2 border-foreground rounded-md p-3">
                <div className="text-xs text-muted-foreground font-bold mb-1">Dominance</div>
                {healthEconomics.vsComparator.dominates ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="default">DOMINATES</Badge>
                    <span className="text-xs text-muted-foreground font-bold">Better + cheaper</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground font-bold">No dominance</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prescription Access Economics */}
        {healthEconomics.prescriptionAccess && healthEconomics.prescriptionAccess.prescriptionRequired && (
          <div className="border-t-2 border-foreground pt-4">
            <div className="text-sm font-bold uppercase mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Prescription Access Economics
              {healthEconomics.prescriptionAccess.otcAvailable && (
                <Badge variant="outline" className="ml-2">OTC Available</Badge>
              )}
            </div>

            {healthEconomics.prescriptionAccess.netSocietalLossFromRxOnly !== undefined && (
              <div className="bg-brutal-red text-brutal-red-foreground border-2 border-foreground rounded-md p-4 mb-4">
                <div className="text-xs font-bold uppercase mb-1">Annual Societal Loss per Patient</div>
                <div className="text-2xl font-black">
                  ${healthEconomics.prescriptionAccess.netSocietalLossFromRxOnly.toLocaleString()}
                </div>
                <div className="text-xs font-bold mt-1">
                  Cost of prescription-only barriers (visits, time, admin, price premium)
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {healthEconomics.prescriptionAccess.annualPhysicianVisitCost !== undefined && (
                <div className="border-2 border-foreground rounded-md p-3">
                  <div className="text-xs text-muted-foreground font-bold mb-1">Physician Visit Cost</div>
                  <div className="text-lg font-black">
                    ${healthEconomics.prescriptionAccess.annualPhysicianVisitCost.toLocaleString()}/year
                  </div>
                </div>
              )}
              {healthEconomics.prescriptionAccess.annualTimeCost !== undefined && (
                <div className="border-2 border-foreground rounded-md p-3">
                  <div className="text-xs text-muted-foreground font-bold mb-1">Time Cost</div>
                  <div className="text-lg font-black">
                    ${healthEconomics.prescriptionAccess.annualTimeCost.toLocaleString()}/year
                  </div>
                  <div className="text-xs text-muted-foreground font-bold mt-1">Travel + wait time</div>
                </div>
              )}
              {healthEconomics.prescriptionAccess.annualInsuranceAdminCost !== undefined && (
                <div className="border-2 border-foreground rounded-md p-3">
                  <div className="text-xs text-muted-foreground font-bold mb-1">Insurance Admin Cost</div>
                  <div className="text-lg font-black">
                    ${healthEconomics.prescriptionAccess.annualInsuranceAdminCost.toLocaleString()}/year
                  </div>
                  <div className="text-xs text-muted-foreground font-bold mt-1">Prior auth, claims</div>
                </div>
              )}
              {healthEconomics.prescriptionAccess.annualPrescriptionCost !== undefined && (
                <div className="border-2 border-foreground rounded-md p-3">
                  <div className="text-xs text-muted-foreground font-bold mb-1">Rx Price</div>
                  <div className="text-lg font-black">
                    ${healthEconomics.prescriptionAccess.annualPrescriptionCost.toLocaleString()}/year
                  </div>
                </div>
              )}
              {healthEconomics.prescriptionAccess.annualOtcCost !== undefined && (
                <div className="border-2 border-foreground rounded-md p-3 bg-brutal-green text-brutal-green-foreground">
                  <div className="text-xs font-bold uppercase mb-1">Potential OTC Price</div>
                  <div className="text-lg font-black">
                    ${healthEconomics.prescriptionAccess.annualOtcCost.toLocaleString()}/year
                  </div>
                  <div className="text-xs font-bold mt-1">Estimated if OTC available</div>
                </div>
              )}
              {healthEconomics.prescriptionAccess.earlyTreatmentBenefit !== undefined && (
                <div className="border-2 border-foreground rounded-md p-3">
                  <div className="text-xs text-muted-foreground font-bold mb-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Early Treatment Benefit
                    <HelpCircle className="h-3 w-3" />
                  </div>
                  <div className="text-lg font-black">
                    +{healthEconomics.prescriptionAccess.earlyTreatmentBenefit.toFixed(2)} QALYs
                  </div>
                  <div className="text-xs text-muted-foreground font-bold mt-1">From faster OTC access</div>
                </div>
              )}
            </div>

            {/* Risk Assessment */}
            {(healthEconomics.prescriptionAccess.misuseRisk ||
              healthEconomics.prescriptionAccess.missedDiagnosisRisk ||
              healthEconomics.prescriptionAccess.requiresMonitoring) && (
              <div className="mt-4 pt-4 border-t-2 border-foreground">
                <div className="text-sm font-bold uppercase mb-3">Risk Assessment</div>
                <div className="grid md:grid-cols-3 gap-4">
                  {healthEconomics.prescriptionAccess.misuseRisk && (
                    <div className="border-2 border-foreground rounded-md p-3">
                      <div className="text-xs text-muted-foreground font-bold mb-1">Misuse Risk</div>
                      <Badge variant={
                        healthEconomics.prescriptionAccess.misuseRisk === 'low' ? 'default' :
                        healthEconomics.prescriptionAccess.misuseRisk === 'moderate' ? 'secondary' : 'destructive'
                      }>
                        {healthEconomics.prescriptionAccess.misuseRisk.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  {healthEconomics.prescriptionAccess.missedDiagnosisRisk && (
                    <div className="border-2 border-foreground rounded-md p-3">
                      <div className="text-xs text-muted-foreground font-bold mb-1">Missed Diagnosis Risk</div>
                      <Badge variant={
                        healthEconomics.prescriptionAccess.missedDiagnosisRisk === 'low' ? 'default' :
                        healthEconomics.prescriptionAccess.missedDiagnosisRisk === 'moderate' ? 'secondary' : 'destructive'
                      }>
                        {healthEconomics.prescriptionAccess.missedDiagnosisRisk.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  {healthEconomics.prescriptionAccess.requiresMonitoring && (
                    <div className="border-2 border-foreground rounded-md p-3">
                      <div className="text-xs text-muted-foreground font-bold mb-1">Requires Monitoring</div>
                      <Badge variant="outline">Yes</Badge>
                      <div className="text-xs text-muted-foreground font-bold mt-1">Needs lab work/checkups</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
