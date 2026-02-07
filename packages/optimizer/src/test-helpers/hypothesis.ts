export interface HypothesisTestCase<T = unknown> {
  id: string;
  hypothesis: string;
  testFn: () => { actualOutcome: T; passed: boolean };
  expectedOutcome: string;
  actualOutcome?: T;
  passed?: boolean;
}

export function runHypothesisTest<T>(
  testCase: HypothesisTestCase<T>,
): HypothesisTestCase<T> {
  const { actualOutcome, passed } = testCase.testFn();
  const result = { ...testCase, actualOutcome, passed };
  const status = passed ? 'PASS' : 'FAIL';
  console.info(`[${status}] ${testCase.id}: ${testCase.hypothesis}`);
  return result;
}
