import analysis from "@/data/us-government-size-analysis.json";

export interface GovernmentSizeObjectiveFloor {
  id: string;
  name: string;
  usEquivalentOptimalPctGdp: number | null;
  usEquivalentBandLowPctGdp: number | null;
  usEquivalentBandHighPctGdp: number | null;
  optimalSpendingPerCapitaPpp: number;
  qualifyingJurisdictions: number;
}

export interface GovernmentSizeOverall {
  usEquivalentOptimalPctGdp: number | null;
  optimalSpendingPerCapitaPpp: number;
}

export interface GovernmentSizeSensitivityScenario {
  startYear: number;
  endYear: number;
  observations: number;
  jurisdictions: number;
  usEquivalentOptimalPctGdp: number | null;
  usEquivalentBandLowPctGdp: number | null;
  usEquivalentBandHighPctGdp: number | null;
  usModeledSpendingPctGdp: number;
  usStatus: "above_optimal_band" | "below_optimal_band" | "within_optimal_band";
  isPrimaryScenario: boolean;
}

export interface GovernmentSizeAnalysis {
  predictor: {
    id: string;
    name: string;
    definition: string;
    coverage: {
      jurisdictions: number;
      years: number;
      observations: number;
      yearMin: number;
      yearMax: number;
    };
  };
  objectiveFloors: GovernmentSizeObjectiveFloor[];
  overall: GovernmentSizeOverall;
  usSnapshot: {
    latestYear: number;
    modeledSpendingPctGdp: number;
    modeledGdpPerCapitaPpp: number;
    modeledSpendingPerCapitaPpp: number;
    gapToOptimalPctPoints: number;
    gapToOptimalSpendingPerCapitaPpp: number;
    status: "above_optimal_band" | "below_optimal_band" | "within_optimal_band";
  };
  efficientJurisdictions: Array<{
    jurisdictionId: string;
    jurisdictionName: string;
    qualifyingObservations: number;
    medianSpendingPctGdp: number;
    medianSpendingPerCapitaPpp: number;
    medianHealthyLifeExpectancyYears: number | null;
    medianAfterTaxMedianIncomePpp: number | null;
  }>;
  federalComposition: {
    sourceBudgetLevel: string;
    fiscalYear: number;
    currentBudgetUsd: number;
    unconstrainedOptimalBudgetUsd: number;
    unconstrainedGapUsd: number;
    unconstrainedGapPct: number;
    compositionCaveat: string;
    topIncreaseCategories: Array<{
      name: string;
      reallocationPct: number;
      evidenceGrade: string;
      targetSharePct: number;
    }>;
    topDecreaseCategories: Array<{
      name: string;
      reallocationPct: number;
      evidenceGrade: string;
      targetSharePct: number;
    }>;
    largestTargetShares: Array<{
      name: string;
      currentSpendingUsd: number;
      targetSpendingUsd: number;
      targetSharePct: number;
    }>;
  };
  sensitivity: {
    startYearScenarios: GovernmentSizeSensitivityScenario[];
    covidExcludedScenario: {
      usEquivalentOptimalPctGdp: number | null;
      usEquivalentBandLowPctGdp: number | null;
      usEquivalentBandHighPctGdp: number | null;
      usModeledSpendingPctGdp: number;
      usStatus: "above_optimal_band" | "below_optimal_band" | "within_optimal_band";
    } | null;
    note: string;
  };
  generatedAt: string;
}

export const usGovernmentSizeAnalysis = analysis as unknown as GovernmentSizeAnalysis;
