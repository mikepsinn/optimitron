export type EvidenceGrade = "A" | "B" | "C" | "D" | "F";
export type EvidenceDirection = "positive" | "negative" | "neutral" | "mixed";
export type EvidenceCertainty = "high" | "moderate" | "low";

export interface ExplorerSource {
  id: string;
  label: string;
  generatedAt: string;
  provenance: string;
}

export interface ExplorerOutcome {
  id: string;
  label: string;
  unit: string;
  direction: "higher_better" | "lower_better" | "neutral";
}

export interface ExplorerPredictor {
  id: string;
  label: string;
  unit: string;
}

export interface ExplorerSubjectSummary {
  subjectId: string;
  subjectName: string;
  optimalPredictorValue: number | null;
  forwardPearson: number | null;
  predictivePearson: number | null;
  percentChangeFromBaseline: number | null;
  numberOfPairs: number;
  evidenceGrade?: EvidenceGrade;
}

export interface ExplorerPairSummary {
  sourceId: string;
  predictorId: string;
  predictorLabel: string;
  outcomeId: string;
  outcomeLabel: string;
  outcomeUnit: string;
  subjectCount: number;
  coverageYearMin?: number;
  coverageYearMax?: number;
  generatedAt: string;
}

export interface ExplorerFreshness {
  generatedAt: string;
  sources: ExplorerSource[];
}

export interface ExplorerSourceFingerprint {
  sourceId: string;
  generatedAt: string;
  fingerprint: string;
  recordCount: number;
}

export interface ExplorerPrecomputeIndex {
  cacheKey: string;
  generatedAt: string;
  sourceFingerprints: ExplorerSourceFingerprint[];
  outcomeCount: number;
  predictorCount: number;
  pairCount: number;
  subjectCount: number;
}

export interface ExplorerPairQualityBadge {
  key: string;
  label: string;
  tone: "neutral" | "info" | "warning" | "danger";
}

export interface ExplorerOutcomeQualityBadge extends ExplorerPairQualityBadge {}

export interface ExplorerSubjectQualityThresholds {
  minimumPairs: number;
  minAbsForwardPearson: number;
  minAbsPredictivePearson: number;
  minAbsPercentChange: number;
}

export interface ExplorerSubjectQualityReason {
  code: string;
  message: string;
  observed?: number;
  threshold?: number;
}

export interface ExplorerSubjectQualityGate {
  passed: boolean;
  thresholds: ExplorerSubjectQualityThresholds;
  reasons: ExplorerSubjectQualityReason[];
}

export type ExplorerDirectionAgreement = "aligned" | "reversed" | "mixed" | "insufficient";

export interface ExplorerSubjectAggregateComparison {
  aggregateForwardPearson: number | null;
  aggregatePredictivePearson: number | null;
  aggregatePercentChangeFromBaseline: number | null;
  forwardPearsonDelta: number | null;
  predictivePearsonDelta: number | null;
  percentChangeFromBaselineDelta: number | null;
  directionAgreement: ExplorerDirectionAgreement;
}

export interface ExplorerSubjectRankingMetrics {
  score: number;
  pairCoverageScore: number;
  signalStrengthScore: number;
  evidenceGradeWeight: number;
}

export interface ExplorerSubjectDrilldown {
  summary: ExplorerSubjectSummary;
  qualityGate: ExplorerSubjectQualityGate;
  aggregateComparison: ExplorerSubjectAggregateComparison;
  ranking: ExplorerSubjectRankingMetrics;
}
