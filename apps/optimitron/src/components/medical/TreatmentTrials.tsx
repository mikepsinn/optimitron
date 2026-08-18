'use client';

import type { TreatmentForCondition } from '@/types/treatment';
import type { ClinicalTrialsIntApiResponse, ClinicalTrialStudy } from '@/lib/schemas/clinical-trial.schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FlaskConical, AlertCircle } from 'lucide-react';
import { TreatyWarningBox } from '@/components/shared/TreatyWarningBox';
import { TrialCard } from '@/components/shared/TrialCard';

interface TreatmentTrialsProps {
  treatment: TreatmentForCondition;
  conditionName: string;
  trialsData: ClinicalTrialsIntApiResponse | null;
  trialsError: string | null;
}

export function TreatmentTrials({
  treatment,
  conditionName,
  trialsData,
  trialsError,
}: TreatmentTrialsProps) {
  if (trialsError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Clinical Trials
            </CardTitle>
            <CardDescription>
              Studies investigating {treatment.name} for {conditionName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {trialsError}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const studies = trialsData?.hits.map(hit => hit.study) || [];
  const totalStudies = trialsData?.total || 0;

  // Separate active and completed trials
  const activeStatuses = ['RECRUITING', 'NOT_YET_RECRUITING', 'ACTIVE_NOT_RECRUITING', 'ENROLLING_BY_INVITATION'];
  const activeTrials = studies.filter((study: ClinicalTrialStudy) =>
    activeStatuses.includes(study.protocolSection?.statusModule?.overallStatus || '')
  );
  const completedTrials = studies.filter((study: ClinicalTrialStudy) =>
    study.protocolSection?.statusModule?.overallStatus === 'COMPLETED'
  );

  return (
    <div className="space-y-6">
      {/* Treaty Warning Box */}
      <TreatyWarningBox />

      {/* Active Clinical Trials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Active Clinical Trials
          </CardTitle>
          <CardDescription>
            {activeTrials.length > 0
              ? `${activeTrials.length} active trial${activeTrials.length !== 1 ? 's' : ''} recruiting for ${treatment.name} in ${conditionName}`
              : `No active trials currently recruiting for this treatment`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTrials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FlaskConical className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No active trials found in ClinicalTrials.gov</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTrials.map((study: ClinicalTrialStudy) => (
                <TrialCard key={study.protocolSection?.identificationModule?.nctId || study.NCTId?.[0]} study={study} variant="compact" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Trials */}
      {completedTrials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Completed Clinical Trials
            </CardTitle>
            <CardDescription>
              {completedTrials.length} completed trial{completedTrials.length !== 1 ? 's' : ''} for {treatment.name} in {conditionName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedTrials.map((study: ClinicalTrialStudy) => (
                <TrialCard key={study.protocolSection?.identificationModule?.nctId || study.NCTId?.[0]} study={study} variant="compact" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {totalStudies > studies.length && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {studies.length} of {totalStudies} total trials
        </div>
      )}
    </div>
  );
}
