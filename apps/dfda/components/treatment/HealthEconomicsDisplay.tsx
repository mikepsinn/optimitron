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

type CostEffectivenessRating = NonNullable<HealthEconomics['costEffectivenessRating']>;

interface HealthEconomicsDisplayProps {
  healthEconomics: HealthEconomics;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

/**
 * Get color scheme for cost-effectiveness rating
 */
function getCostEffectivenessColors(
  rating: CostEffectivenessRating
) {
  const colors = {
    excellent: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      badge: 'default' as const,
    },
    good: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      badge: 'secondary' as const,
    },
    moderate: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
      badge: 'outline' as const,
    },
    poor: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-300',
      badge: 'outline' as const,
    },
    dominated: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      badge: 'destructive' as const,
    },
  };
  return colors[rating];
}

function normalizeCostEffectivenessRating(rating: unknown): CostEffectivenessRating | null {
  if (typeof rating !== 'string') {
    return null;
  }

  const normalized = rating.toLowerCase();
  if (
    normalized === 'excellent' ||
    normalized === 'good' ||
    normalized === 'moderate' ||
    normalized === 'poor' ||
    normalized === 'dominated'
  ) {
    return normalized;
  }

  return null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatCurrency(value: unknown): string {
  return isFiniteNumber(value) ? `$${value.toLocaleString()}` : 'Not available';
}

/**
 * Format ICER interpretation
 */
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
  const costEffectivenessRating = normalizeCostEffectivenessRating(
    healthEconomics.costEffectivenessRating
  );
  const earlyTreatmentBenefit =
    isFiniteNumber(healthEconomics.prescriptionAccess?.earlyTreatmentBenefit)
      ? healthEconomics.prescriptionAccess.earlyTreatmentBenefit
      : null;
  const comparator = healthEconomics.vsComparator;
  const hasComparatorCostDifference = isFiniteNumber(comparator?.costDifference);
  const hasComparatorQalyDifference = isFiniteNumber(comparator?.qalysGainedDifference);
  const hasComparatorData =
    Boolean(comparator) &&
    (hasComparatorCostDifference ||
      hasComparatorQalyDifference ||
      typeof comparator?.dominates === 'boolean');

  const hasData = healthEconomics && (
    healthEconomics.annualCostOfCare ||
    isFiniteNumber(healthEconomics.icer) ||
    isFiniteNumber(healthEconomics.qalysGained) ||
    costEffectivenessRating ||
    isFiniteNumber(healthEconomics.costPerResponder) ||
    isFiniteNumber(healthEconomics.costPerRemission) ||
    hasComparatorData
  );

  if (!hasData) {
    return null;
  }

  // Compact variant for cards
  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-4 w-4 text-green-700" />
          <p className="text-sm font-semibold text-green-900">Annual Cost of Care</p>
        </div>
        {healthEconomics.annualCostOfCare && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-green-600 mb-1">Drug Cost</p>
              <p className="text-sm font-bold text-green-900">
                {formatCurrency(healthEconomics.annualCostOfCare.drugCost)}
              </p>
            </div>
            <div>
              <p className="text-xs text-green-600 mb-1">Monitoring</p>
              <p className="text-sm font-bold text-green-900">
                {formatCurrency(healthEconomics.annualCostOfCare.monitoringCost)}
              </p>
            </div>
            <div>
              <p className="text-xs text-green-600 mb-1">Side Effects</p>
              <p className="text-sm font-bold text-green-900">
                {formatCurrency(healthEconomics.annualCostOfCare.sideEffectManagement)}
              </p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs text-green-600 mb-1 font-semibold">Total Annual</p>
              <p className="text-base font-bold text-green-900">
                {formatCurrency(healthEconomics.annualCostOfCare.totalAnnual)}
              </p>
            </div>
          </div>
        )}

        {/* Additional metrics */}
        {(isFiniteNumber(healthEconomics.costPerRemission) ||
          isFiniteNumber(healthEconomics.costPerResponder) ||
          isFiniteNumber(healthEconomics.qalysGained) ||
          isFiniteNumber(healthEconomics.icer) ||
          costEffectivenessRating) && (
          <div className="mt-3 pt-3 border-t border-green-200 grid grid-cols-2 gap-3">
            {costEffectivenessRating && (
              <div>
                <p className="text-xs text-green-600 mb-1">Cost-Effectiveness</p>
                <Badge variant={getCostEffectivenessColors(costEffectivenessRating).badge}>
                  {costEffectivenessRating.toUpperCase()}
                </Badge>
              </div>
            )}
            {isFiniteNumber(healthEconomics.qalysGained) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        QALYs Gained
                        <HelpCircle className="h-3 w-3" />
                      </p>
                      <p className="text-sm font-bold text-green-900">
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
            {isFiniteNumber(healthEconomics.icer) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <p className="text-xs text-green-600 mb-1">ICER</p>
                      <p className="text-sm font-bold text-green-900">
                        {formatCurrency(healthEconomics.icer)}/QALY
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getICERInterpretation(healthEconomics.icer)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {isFiniteNumber(healthEconomics.costPerRemission) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
                        Cost per Remission
                        <HelpCircle className="h-3 w-3" />
                      </p>
                      <p className="text-sm font-bold text-green-900">
                        {formatCurrency(healthEconomics.costPerRemission)}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total cost to achieve one complete remission</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {isFiniteNumber(healthEconomics.costPerResponder) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
                        Cost per Responder
                        <HelpCircle className="h-3 w-3" />
                      </p>
                      <p className="text-sm font-bold text-green-900">
                        {formatCurrency(healthEconomics.costPerResponder)}
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
            <div className="text-sm font-medium mb-3">Annual Cost of Care</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Drug Cost:</span>
                <span className="font-medium">{formatCurrency(healthEconomics.annualCostOfCare.drugCost)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Monitoring:</span>
                <span className="font-medium">{formatCurrency(healthEconomics.annualCostOfCare.monitoringCost)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Side Effect Mgmt:</span>
                <span className="font-medium">{formatCurrency(healthEconomics.annualCostOfCare.sideEffectManagement)}</span>
              </div>
              <div className="flex justify-between font-semibold border-b-2 border-primary pb-2">
                <span>Total Annual:</span>
                <span>{formatCurrency(healthEconomics.annualCostOfCare.totalAnnual)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Cost-Effectiveness Metrics */}
        {(isFiniteNumber(healthEconomics.icer) ||
          costEffectivenessRating ||
          isFiniteNumber(healthEconomics.qalysGained) ||
          isFiniteNumber(healthEconomics.qalysVsComparator)) && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-3">Cost-Effectiveness Analysis</div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {costEffectivenessRating && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Cost-Effectiveness Rating</div>
                  <Badge variant={getCostEffectivenessColors(costEffectivenessRating).badge} className="text-sm">
                    {costEffectivenessRating.toUpperCase()}
                  </Badge>
                </div>
              )}
              {isFiniteNumber(healthEconomics.icer) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-xs text-muted-foreground mb-1">ICER</div>
                        <div className="text-lg font-semibold">{formatCurrency(healthEconomics.icer)}/QALY</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Incremental Cost-Effectiveness Ratio</p>
                      <p className="text-xs">{getICERInterpretation(healthEconomics.icer)}</p>
                      <p className="text-xs mt-1">Threshold: &lt;$50k excellent, $50-100k good, $100-150k moderate, &gt;$150k poor</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {isFiniteNumber(healthEconomics.qalysGained) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          QALYs Gained
                          <HelpCircle className="h-3 w-3" />
                        </div>
                        <div className="text-lg font-semibold">{healthEconomics.qalysGained}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Quality-Adjusted Life Years gained vs no treatment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {isFiniteNumber(healthEconomics.qalysVsComparator) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-xs text-muted-foreground mb-1">QALYs vs Comparator</div>
                        <div className="text-lg font-semibold">+{healthEconomics.qalysVsComparator}</div>
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
        {(isFiniteNumber(healthEconomics.costPerResponder) ||
          isFiniteNumber(healthEconomics.costPerRemission) ||
          isFiniteNumber(healthEconomics.costPerQALY)) && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-3">Outcome-Based Costs</div>
            <div className="grid md:grid-cols-3 gap-4">
              {isFiniteNumber(healthEconomics.costPerResponder) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help border rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          Cost per Responder
                          <HelpCircle className="h-3 w-3" />
                        </div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(healthEconomics.costPerResponder)}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total cost to achieve one treatment response</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {isFiniteNumber(healthEconomics.costPerRemission) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help border rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          Cost per Remission
                          <HelpCircle className="h-3 w-3" />
                        </div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(healthEconomics.costPerRemission)}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total cost to achieve one complete remission</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {isFiniteNumber(healthEconomics.costPerQALY) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help border rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          Cost per QALY
                          <HelpCircle className="h-3 w-3" />
                        </div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(healthEconomics.costPerQALY)}
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
        {hasComparatorData && comparator && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-3 flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Comparison vs {comparator.comparatorName}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {hasComparatorCostDifference && (
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Cost Difference</div>
                  <div className={`text-lg font-semibold ${
                    comparator.costDifference < 0
                      ? 'text-green-600'
                      : comparator.costDifference > 0
                      ? 'text-red-600'
                      : ''
                  }`}>
                    {comparator.costDifference > 0 ? '+' : ''}
                    {formatCurrency(comparator.costDifference)}/year
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {comparator.costDifference < 0
                      ? 'Less expensive'
                      : comparator.costDifference > 0
                      ? 'More expensive'
                      : 'Same cost'}
                  </div>
                </div>
              )}
              {hasComparatorQalyDifference && (
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">QALY Difference</div>
                  <div className={`text-lg font-semibold ${
                    comparator.qalysGainedDifference > 0
                      ? 'text-green-600'
                      : comparator.qalysGainedDifference < 0
                      ? 'text-red-600'
                      : ''
                  }`}>
                    {comparator.qalysGainedDifference > 0 ? '+' : ''}
                    {comparator.qalysGainedDifference.toFixed(2)} QALYs
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {comparator.qalysGainedDifference > 0
                      ? 'Better outcomes'
                      : comparator.qalysGainedDifference < 0
                      ? 'Worse outcomes'
                      : 'Same outcomes'}
                  </div>
                </div>
              )}
              <div className="border rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Dominance</div>
                {comparator.dominates ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-600">
                      DOMINATES
                    </Badge>
                    <span className="text-xs text-muted-foreground">Better + cheaper</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No dominance</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prescription Access Economics */}
        {healthEconomics.prescriptionAccess && healthEconomics.prescriptionAccess.prescriptionRequired && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Prescription Access Economics
              {healthEconomics.prescriptionAccess.otcAvailable && (
                <Badge variant="outline" className="ml-2">OTC Available</Badge>
              )}
            </div>
            
            {isFiniteNumber(healthEconomics.prescriptionAccess.netSocietalLossFromRxOnly) && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 mb-4">
                <div className="text-xs text-orange-700 mb-1 font-semibold">Annual Societal Loss per Patient</div>
                <div className="text-2xl font-bold text-orange-900">
                  {formatCurrency(healthEconomics.prescriptionAccess.netSocietalLossFromRxOnly)}
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  Cost of prescription-only barriers (visits, time, admin, price premium)
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isFiniteNumber(healthEconomics.prescriptionAccess.annualPhysicianVisitCost) && (
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Physician Visit Cost</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(healthEconomics.prescriptionAccess.annualPhysicianVisitCost)}/year
                  </div>
                </div>
              )}
              {isFiniteNumber(healthEconomics.prescriptionAccess.annualTimeCost) && (
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Time Cost</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(healthEconomics.prescriptionAccess.annualTimeCost)}/year
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Travel + wait time</div>
                </div>
              )}
              {isFiniteNumber(healthEconomics.prescriptionAccess.annualInsuranceAdminCost) && (
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Insurance Admin Cost</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(healthEconomics.prescriptionAccess.annualInsuranceAdminCost)}/year
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Prior auth, claims</div>
                </div>
              )}
              {isFiniteNumber(healthEconomics.prescriptionAccess.annualPrescriptionCost) && (
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Rx Price</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(healthEconomics.prescriptionAccess.annualPrescriptionCost)}/year
                  </div>
                </div>
              )}
              {isFiniteNumber(healthEconomics.prescriptionAccess.annualOtcCost) && (
                <div className="border rounded-lg p-3 bg-green-50">
                  <div className="text-xs text-green-700 mb-1 font-semibold">Potential OTC Price</div>
                  <div className="text-lg font-semibold text-green-900">
                    {formatCurrency(healthEconomics.prescriptionAccess.annualOtcCost)}/year
                  </div>
                  <div className="text-xs text-green-600 mt-1">Estimated if OTC available</div>
                </div>
              )}
              {earlyTreatmentBenefit !== null && (
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Early Treatment Benefit
                    <HelpCircle className="h-3 w-3" />
                  </div>
                  <div className="text-lg font-semibold">
                    +{earlyTreatmentBenefit.toFixed(2)} QALYs
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">From faster OTC access</div>
                </div>
              )}
            </div>

            {/* Risk Assessment */}
            {(healthEconomics.prescriptionAccess.misuseRisk || 
              healthEconomics.prescriptionAccess.missedDiagnosisRisk || 
              healthEconomics.prescriptionAccess.requiresMonitoring) && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-3">Risk Assessment</div>
                <div className="grid md:grid-cols-3 gap-4">
                  {healthEconomics.prescriptionAccess.misuseRisk && (
                    <div className="border rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">Misuse Risk</div>
                      <Badge variant={
                        healthEconomics.prescriptionAccess.misuseRisk === 'low' ? 'default' :
                        healthEconomics.prescriptionAccess.misuseRisk === 'moderate' ? 'secondary' : 'destructive'
                      }>
                        {healthEconomics.prescriptionAccess.misuseRisk.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  {healthEconomics.prescriptionAccess.missedDiagnosisRisk && (
                    <div className="border rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">Missed Diagnosis Risk</div>
                      <Badge variant={
                        healthEconomics.prescriptionAccess.missedDiagnosisRisk === 'low' ? 'default' :
                        healthEconomics.prescriptionAccess.missedDiagnosisRisk === 'moderate' ? 'secondary' : 'destructive'
                      }>
                        {healthEconomics.prescriptionAccess.missedDiagnosisRisk.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  {healthEconomics.prescriptionAccess.requiresMonitoring && (
                    <div className="border rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">Requires Monitoring</div>
                      <Badge variant="outline">Yes</Badge>
                      <div className="text-xs text-muted-foreground mt-1">Needs lab work/checkups</div>
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
