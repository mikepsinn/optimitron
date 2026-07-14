export interface PublicTraceSourceArtifact {
  artifactType: string;
  contentHash: string | null;
  id: string;
  sourceKey: string;
  sourceRef: string | null;
  sourceSystem: string;
  sourceUrl: string | null;
  title: string | null;
  versionKey: string | null;
}

export interface PublicParameterTraceNode {
  assumptionsJson: unknown;
  calculationCode: string | null;
  calculationLanguage: string | null;
  confidence: string;
  confidenceIntervalHigh: number | null;
  confidenceIntervalLow: number | null;
  conservative: boolean;
  currentRevisionId: string | null;
  description: string;
  displayName: string | null;
  displayValue: string | null;
  formulaLatex: string | null;
  formulaText: string | null;
  id: string;
  inputs: Array<{
    position: number;
    revision: PublicParameterTraceNode;
    symbol: string;
  }>;
  key: string;
  manualRef: string | null;
  rationale: string | null;
  revision: number;
  sourceArtifacts: PublicTraceSourceArtifact[];
  sourceContentHash: string;
  sourceRef: string | null;
  sourceType: string;
  stale: boolean;
  status: string;
  unit: string;
  value: number;
}

export interface PublicTaskImpactTrace {
  estimate: {
    assumptionsJson: unknown;
    calculationCode: string | null;
    calculationLanguage: string | null;
    calculationVersion: string;
    counterfactualKey: string;
    estimateKind: string;
    formulaLatex: string | null;
    formulaText: string | null;
    id: string;
    methodologyKey: string;
    parameterSetHash: string;
    publicationStatus: string;
    sourceSystem: string;
  };
  frames: Array<{
    estimatedCashCostUsdBase: number | null;
    estimatedCashCostUsdHigh: number | null;
    estimatedCashCostUsdLow: number | null;
    estimatedEffortHoursBase: number | null;
    estimatedEffortHoursHigh: number | null;
    estimatedEffortHoursLow: number | null;
    evaluationHorizonYears: number;
    expectedDalysAvertedBase: number | null;
    expectedDalysAvertedHigh: number | null;
    expectedDalysAvertedLow: number | null;
    expectedEconomicValueUsdBase: number | null;
    expectedEconomicValueUsdHigh: number | null;
    expectedEconomicValueUsdLow: number | null;
    frameKey: string;
    frameSlug: string;
    medianHealthyLifeYearsEffectBase: number | null;
    medianHealthyLifeYearsEffectHigh: number | null;
    medianHealthyLifeYearsEffectLow: number | null;
    medianIncomeGrowthEffectPpPerYearBase: number | null;
    medianIncomeGrowthEffectPpPerYearHigh: number | null;
    medianIncomeGrowthEffectPpPerYearLow: number | null;
    metrics: Array<{
      baseValue: number | null;
      highValue: number | null;
      lowValue: number | null;
      metricKey: string;
      unit: string;
    }>;
    successProbabilityBase: number | null;
    successProbabilityHigh: number | null;
    successProbabilityLow: number | null;
    timeToImpactStartDays: number;
  }>;
  parameterTraces: Array<{
    revision: PublicParameterTraceNode;
    symbol: string;
  }>;
  sourceArtifacts: PublicTraceSourceArtifact[];
  stale: boolean;
  staleInputs: Array<{
    currentRevisionId: string | null;
    parameterKey: string;
    pinnedRevisionId: string;
    symbol: string;
  }>;
  task: {
    id: string;
    title: string;
  };
}
