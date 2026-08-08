'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, ExternalLink, HelpCircle, DollarSign } from 'lucide-react';
import { generatePatientTrialSearchPath } from '@/lib/path-helpers';
import type { TreatmentForCondition } from '@/types/treatment';
import { HealthEconomicsDisplay } from '@/components/treatment/HealthEconomicsDisplay';
import { SafetyScale } from '@/components/treatment/SafetyScale';
import { OutcomeLabel, type OutcomeCategory } from '@/components/landing/OutcomeLabel';
import { formatNumberShort } from '@/lib/formatters';

interface InterventionCardProps {
  treatment: TreatmentForCondition;
  conditionName: string;
  index: number;
  showRanking?: boolean;
  className?: string;
}

/**
 * Helper function to get cost-effectiveness rating colors
 */
function getCostEffectivenessColors(rating?: 'excellent' | 'good' | 'moderate' | 'poor' | 'dominated') {
  switch (rating) {
    case 'excellent':
      return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
    case 'good':
      return { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-200' };
    case 'moderate':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
    case 'poor':
      return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' };
    case 'dominated':
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
  }
}

/**
 * Helper function to get evidence quality colors
 */
function getEvidenceQualityColors(quality?: 'high' | 'moderate' | 'low' | 'very-low') {
  switch (quality) {
    case 'high':
      return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
    case 'moderate':
      return { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' };
    case 'low':
      return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
    case 'very-low':
      return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
  }
}

/**
 * Shared component for displaying treatment/intervention information
 * Used by both ComparativeEffectivenessSection and TreatmentRankings
 */
export function InterventionCard({
  treatment,
  conditionName,
  index,
  showRanking = true,
  className = '',
}: InterventionCardProps) {
  // Convert treatment data to OutcomeLabel format
  const outcomeData: OutcomeCategory[] = [];

  // Primary Outcomes - use richer data from trial results if available
  if (treatment.primaryOutcomes && treatment.primaryOutcomes.length > 0) {
    outcomeData.push({
      title: 'Primary Outcomes',
      items: treatment.primaryOutcomes.map(outcome => ({
        name: outcome.name,
        baseline: outcome.baseline,
        value: {
          percentage: outcome.percentageChange || 0,
          absolute: outcome.absoluteChange,
        },
        isPositive: outcome.isPositive !== undefined ? outcome.isPositive : true,
      })),
    });
  } else {
    // Fallback to simple efficacy data
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
  }

  // Secondary Outcomes - use richer data if available
  if (treatment.secondaryOutcomes && treatment.secondaryOutcomes.length > 0) {
    outcomeData.push({
      title: 'Secondary Benefits',
      items: treatment.secondaryOutcomes.slice(0, 3).map(outcome => ({
        name: outcome.name,
        baseline: outcome.baseline,
        value: {
          percentage: outcome.percentageChange || 0,
          absolute: outcome.absoluteChange,
        },
        isPositive: outcome.isPositive !== undefined ? outcome.isPositive : true,
      })),
    });
  }

  // Side Effects (condensed - just top 3)
  if (treatment.sideEffects && treatment.sideEffects.length > 0) {
    outcomeData.push({
      title: 'Common Side Effects',
      items: treatment.sideEffects.slice(0, 3).map(se => ({
        name: se.name,
        value: {
          percentage: se.percentage,
          nnh: se.nnh,
        },
        isPositive: false,
      })),
      isSideEffectCategory: true,
    });
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {showRanking && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {index + 1}
                </div>
              )}
              <CardTitle className="text-xl">{treatment.name}</CardTitle>
            </div>
            <CardDescription className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-primary">
                  {treatment.effectiveness}% Effectiveness
                </span>
                <span className="font-semibold text-blue-600">
                  • {treatment.confidenceScore}% Confidence
                </span>
                <span className="font-semibold text-green-600">
                  • {treatment.safetyScore}% Safety
                </span>
                {treatment.trials && (
                  <span className="text-muted-foreground">
                    • {treatment.trials} trials
                  </span>
                )}
                {treatment.participants && (
                  <span className="text-muted-foreground">
                    • {formatNumberShort(treatment.participants)} participants
                  </span>
                )}
              </div>

              {/* Badges for quality and economics */}
              <div className="flex items-center gap-2 flex-wrap">
                {treatment.evidenceQuality && (
                  <span className={`text-xs px-2 py-1 rounded-full border ${getEvidenceQualityColors(treatment.evidenceQuality).bg} ${getEvidenceQualityColors(treatment.evidenceQuality).text} ${getEvidenceQualityColors(treatment.evidenceQuality).border}`}>
                    {treatment.evidenceQuality.toUpperCase()} Evidence
                  </span>
                )}
                {treatment.healthEconomics?.costEffectivenessRating && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 cursor-help ${getCostEffectivenessColors(treatment.healthEconomics.costEffectivenessRating).bg} ${getCostEffectivenessColors(treatment.healthEconomics.costEffectivenessRating).text} ${getCostEffectivenessColors(treatment.healthEconomics.costEffectivenessRating).border}`}>
                          <DollarSign className="h-3 w-3" />
                          {treatment.healthEconomics.costEffectivenessRating.charAt(0).toUpperCase() + treatment.healthEconomics.costEffectivenessRating.slice(1)} Value
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-semibold">Cost-Effectiveness Rating</p>
                          {treatment.healthEconomics.icer && (
                            <p className="text-xs">ICER: ${treatment.healthEconomics.icer.toLocaleString()}/QALY</p>
                          )}
                          {treatment.healthEconomics.qalysGained && (
                            <p className="text-xs">QALYs Gained: {treatment.healthEconomics.qalysGained}</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {treatment.dosageRange && (
                  <span className="text-xs text-muted-foreground border border-gray-200 px-2 py-1 rounded-full">
                    Dose: {treatment.dosageRange}
                  </span>
                )}
              </div>

            </CardDescription>
          </div>
          <Link
            href={generatePatientTrialSearchPath(treatment.name, conditionName)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            Find Trials
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Effectiveness Bar */}
          <div>
            <div className="relative h-2 w-full bg-gray-200 rounded-full">
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${treatment.effectiveness}%` }}
              />
            </div>
          </div>

          {/* Safety Scale */}
          <SafetyScale safetyScore={treatment.safetyScore} />

          {/* Clinical Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {treatment.timeToEffect && (
              <div className="bg-purple-50 border-2 border-purple-200 p-3 rounded-lg">
                <p className="text-xs font-medium text-purple-600 mb-1">Time to Effect</p>
                <p className="text-sm font-bold text-purple-900">{treatment.timeToEffect}</p>
              </div>
            )}
            {treatment.treatmentDuration && (
              <div className="bg-indigo-50 border-2 border-indigo-200 p-3 rounded-lg">
                <p className="text-xs font-medium text-indigo-600 mb-1">Duration</p>
                <p className="text-sm font-bold text-indigo-900">{treatment.treatmentDuration}</p>
              </div>
            )}
            {treatment.responseRate !== undefined && (
              <div className="bg-cyan-50 border-2 border-cyan-200 p-3 rounded-lg">
                <p className="text-xs font-medium text-cyan-600 mb-1">Response Rate</p>
                <p className="text-sm font-bold text-cyan-900">{treatment.responseRate}%</p>
              </div>
            )}
            {treatment.remissionRate !== undefined && (
              <div className="bg-teal-50 border-2 border-teal-200 p-3 rounded-lg">
                <p className="text-xs font-medium text-teal-600 mb-1">Remission Rate</p>
                <p className="text-sm font-bold text-teal-900">{treatment.remissionRate}%</p>
              </div>
            )}
            {treatment.nnt && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-emerald-50 border-2 border-emerald-200 p-3 rounded-lg cursor-help">
                      <p className="text-xs font-medium text-emerald-600 mb-1 flex items-center gap-1">
                        Number Needed to Treat (NNT)
                        <HelpCircle className="h-3 w-3" />
                      </p>
                      <p className="text-sm font-bold text-emerald-900">{treatment.nnt}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Number Needed to Treat: {treatment.nnt} patients need to be treated for 1 to benefit (lower is better)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {treatment.nnh && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-amber-50 border-2 border-amber-200 p-3 rounded-lg cursor-help">
                      <p className="text-xs font-medium text-amber-600 mb-1 flex items-center gap-1">
                        Number Needed to Harm (NNH)
                        <HelpCircle className="h-3 w-3" />
                      </p>
                      <p className="text-sm font-bold text-amber-900">{treatment.nnh}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Number Needed to Harm: {treatment.nnh} patients treated before 1 experiences harm (higher is better)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Side Effects */}
          {treatment.sideEffects && treatment.sideEffects.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Common Side Effects:</p>
              <div className="flex flex-wrap gap-2">
                {treatment.sideEffects.map((effect, effectIndex) => (
                  <TooltipProvider key={effectIndex}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 flex items-center cursor-help">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {effect.name}: {effect.percentage}%
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {effect.percentage}% of patients experienced {effect.name}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* Health Economics */}
          {treatment.healthEconomics && (
            <HealthEconomicsDisplay
              healthEconomics={treatment.healthEconomics}
              variant="compact"
            />
          )}

          {/* Outcome Label - Visual progress bars for efficacy and side effects */}
          {outcomeData.length > 0 && (
            <OutcomeLabel
              title="Treatment Outcomes"
              data={outcomeData}
            />
          )}

          {/* Clinical Trial Phases */}
          {treatment.phase && treatment.phase.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Clinical Trial Phases:</p>
              <div className="flex flex-wrap gap-2">
                {treatment.phase.map((phase, phaseIndex) => (
                  <span
                    key={phaseIndex}
                    className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                  >
                    {phase}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Trials if available */}
          {treatment.recentTrials && treatment.recentTrials.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Recent Trials:</p>
              <div className="space-y-2">
                {treatment.recentTrials.map((trial) => (
                  <div key={trial.nctId} className="flex items-start gap-2 text-sm border-l-2 border-muted pl-3">
                    <div className="flex-1">
                      <a
                        href={`https://clinicaltrials.gov/study/${trial.nctId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        {trial.nctId}
                      </a>
                      <p className="text-muted-foreground line-clamp-1">{trial.title}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {trial.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
