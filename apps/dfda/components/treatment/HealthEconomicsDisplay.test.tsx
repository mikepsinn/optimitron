import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HealthEconomicsDisplay } from './HealthEconomicsDisplay';
import type { HealthEconomics } from '@/types/treatment';

describe('HealthEconomicsDisplay', () => {
  it('skips nullable prescription access costs instead of formatting null', () => {
    const healthEconomics = {
      annualCostOfCare: {
        drugCost: 100,
        monitoringCost: 100,
        sideEffectManagement: 400,
        totalAnnual: 600,
      },
      costEffectivenessRating: 'excellent',
      costPerResponder: 667,
      prescriptionAccess: {
        annualInsuranceAdminCost: 20,
        annualOtcCost: null,
        annualPhysicianVisitCost: null,
        annualPrescriptionCost: 100,
        annualTimeCost: null,
        earlyTreatmentBenefit: 0.05,
        missedDiagnosisRisk: 'high',
        misuseRisk: 'moderate',
        netSocietalLossFromRxOnly: null,
        otcAvailable: false,
        prescriptionRequired: true,
        preventedComplicationCost: 500,
        requiresMonitoring: false,
      },
      qalysGained: 0.2,
      vsComparator: null,
    } as unknown as HealthEconomics;

    expect(() => render(<HealthEconomicsDisplay healthEconomics={healthEconomics} />)).not.toThrow();

    expect(screen.getByText('Prescription Access Economics')).toBeInTheDocument();
    expect(screen.queryByText('Annual Societal Loss per Patient')).not.toBeInTheDocument();
    expect(screen.queryByText('Physician Visit Cost')).not.toBeInTheDocument();
    expect(screen.getByText('$20/year')).toBeInTheDocument();
    expect(screen.getByText('$100/year')).toBeInTheDocument();
  });

  it('skips nullable comparator metrics instead of formatting null', () => {
    const healthEconomics = {
      costEffectivenessRating: 'good',
      vsComparator: {
        comparatorName: 'standard care',
        costDifference: null,
        qalysGainedDifference: null,
        dominates: false,
      },
    } as unknown as HealthEconomics;

    expect(() => render(<HealthEconomicsDisplay healthEconomics={healthEconomics} />)).not.toThrow();

    expect(screen.getByText('Comparison vs standard care')).toBeInTheDocument();
    expect(screen.queryByText('Cost Difference')).not.toBeInTheDocument();
    expect(screen.queryByText('QALY Difference')).not.toBeInTheDocument();
    expect(screen.getByText('No dominance')).toBeInTheDocument();
  });
});
