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

export interface HistoricalGovernmentSizeAnalysis {
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

export interface GovernmentWelfareInterval {
  mean: number;
  low: number;
  high: number;
}

export interface GovernmentWelfareOutcome {
  id: string;
  name: string;
  unit: string;
  definition: string;
  countryCount: number;
  excludedCountryCount: number;
  sourceObservationCount: number;
  yearRange: [number, number] | null;
  meanCorrelation: GovernmentWelfareInterval | null;
  meanOutcomeDifference: GovernmentWelfareInterval | null;
  countries: Array<{
    id: string;
    name: string;
    source: string;
    sourceUrl: string;
    sourceObservations: number;
    pairedYears: number;
    correlation: number;
    outcomeDifference: number;
    lowerSpendingPctGdp: number;
    higherSpendingPctGdp: number;
    dataQualityPassed: boolean;
    includedInSummary: boolean;
    warnings: string[];
  }>;
}

export interface GovernmentSizeAnalysis {
  schemaVersion: 2;
  generatedAt: string;
  sourceMode: string;
  sourceSnapshots: Array<{ name: string; generatedAt: string; url: string }>;
  predictor: { id: string; name: string; definition: string };
  outcomes: GovernmentWelfareOutcome[];
  methodology: {
    onsetDelayDays: number;
    durationOfActionDays: number;
    minimumDataPoints: number;
    bootstrapDraws: number;
    seed: number;
    intervalDescription: string;
    notes: string[];
  };
  historicalBenchmark: HistoricalGovernmentSizeAnalysis | null;
}

export const usGovernmentSizeAnalysis = analysis as unknown as GovernmentSizeAnalysis;
