export type EvidenceGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type HypothesisDirection = 'positive' | 'negative' | 'none';

export interface HypothesisExpected {
  direction: HypothesisDirection;
  threshold: number;
  evidenceGrade: EvidenceGrade;
}

export interface HypothesisActual<TDetails = unknown> {
  value: number;
  direction: HypothesisDirection;
  evidenceGrade?: EvidenceGrade;
  details?: TDetails;
}

export type HypothesisDataSource<TData> =
  | {
      kind: 'generator';
      description?: string;
      generate: () => TData;
    }
  | {
      kind: 'dataset';
      id: string;
      description?: string;
      data: TData;
    };

export interface HypothesisTestCase<TData = unknown, TDetails = unknown> {
  id: string;
  claim: string;
  data: HypothesisDataSource<TData>;
  expected: HypothesisExpected;
  run: (data: TData) => HypothesisActual<TDetails>;
}

export interface HypothesisTestResult<TData = unknown, TDetails = unknown>
  extends HypothesisTestCase<TData, TDetails> {
  actual: HypothesisActual<TDetails>;
  passed: boolean;
  failureReasons: string[];
}

const EVIDENCE_GRADE_RANK: Record<EvidenceGrade, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  F: 1,
};

export function resolveHypothesisData<TData>(source: HypothesisDataSource<TData>): TData {
  if (source.kind === 'generator') {
    return source.generate();
  }
  return source.data;
}

export function isEvidenceGradeAtLeast(
  actual: EvidenceGrade | undefined,
  expected: EvidenceGrade,
): boolean {
  if (!actual) {
    return false;
  }
  return EVIDENCE_GRADE_RANK[actual] >= EVIDENCE_GRADE_RANK[expected];
}

export function evaluateHypothesis(
  expected: HypothesisExpected,
  actual: HypothesisActual,
): { passed: boolean; failureReasons: string[] } {
  const failureReasons: string[] = [];
  const meetsEvidence = isEvidenceGradeAtLeast(actual.evidenceGrade, expected.evidenceGrade);
  if (!meetsEvidence) {
    failureReasons.push('evidence grade');
  }

  if (expected.direction === 'none') {
    if (Math.abs(actual.value) > expected.threshold) {
      failureReasons.push('threshold');
    }
    return { passed: failureReasons.length === 0, failureReasons };
  }

  if (actual.direction !== expected.direction) {
    failureReasons.push('direction');
  }

  const meetsThreshold = expected.direction === 'positive'
    ? actual.value >= expected.threshold
    : actual.value <= -expected.threshold;
  if (!meetsThreshold) {
    failureReasons.push('threshold');
  }

  return { passed: failureReasons.length === 0, failureReasons };
}

export function runHypothesisTestCase<TData, TDetails>(
  testCase: HypothesisTestCase<TData, TDetails>,
): HypothesisTestResult<TData, TDetails> {
  const data = resolveHypothesisData(testCase.data);
  const actual = testCase.run(data);
  const { passed, failureReasons } = evaluateHypothesis(testCase.expected, actual);
  return { ...testCase, actual, passed, failureReasons };
}
