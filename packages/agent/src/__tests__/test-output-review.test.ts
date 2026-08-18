import { describe, expect, it, vi } from 'vitest';
import {
  buildTestOutputReviewPrompt,
  extractLikelyFiles,
  extractReviewSnippet,
  formatTestOutputReview,
  hasFailureSignals,
  reviewTestOutput,
} from '../test-output-review.js';

describe('test output review', () => {
  it('detects common failure markers', () => {
    expect(hasFailureSignals('src/foo.ts(1,1): error TS2322: bad')).toBe(true);
    expect(hasFailureSignals('✓ 42 tests passed')).toBe(false);
  });

  it('extracts likely file paths from compiler output', () => {
    expect(
      extractLikelyFiles('src/foo.ts(1,1): error TS2322\napps/optimitron/src/app/page.tsx:12'),
    ).toEqual(['src/foo.ts', 'apps/optimitron/src/app/page.tsx']);
  });

  it('focuses the review snippet around failure lines', () => {
    const snippet = extractReviewSnippet([
      'noise',
      'src/foo.ts(1,1): error TS2322: bad type',
      'context',
      'tail',
    ].join('\n'));

    expect(snippet).toContain('error TS2322');
    expect(snippet).toContain('context');
    expect(snippet).not.toContain('tail');
  });

  it('returns a deterministic pass review when the output is clean', async () => {
    await expect(reviewTestOutput({
      output: '✓ 118 tests passed',
      sourceLabel: 'vitest',
    })).resolves.toMatchObject({
      reviewer: 'deterministic',
      status: 'pass',
      shouldBlock: false,
    });
  });

  it('falls back deterministically when failure markers exist without a reasoner', async () => {
    await expect(reviewTestOutput({
      output: 'src/foo.ts(1,1): error TS2322: bad type',
      sourceLabel: 'tsc',
    })).resolves.toMatchObject({
      reviewer: 'deterministic',
      status: 'inconclusive',
      shouldBlock: true,
      likelyFiles: ['src/foo.ts'],
      nextCommands: ['pnpm typecheck'],
    });
  });

  it('uses the provided reasoner for structured triage', async () => {
    const generateObject = vi.fn(async ({ parse }: { parse: (value: unknown) => unknown }) =>
      parse({
        status: 'fail',
        summary: 'The first TypeScript error is the likely root cause.',
        likelyRootCause: 'src/foo.ts assigns null to a non-nullable type.',
        shouldBlock: true,
        confidence: 0.88,
        likelyFiles: ['src/foo.ts'],
        nextCommands: ['pnpm typecheck'],
        findings: [{ severity: 'high', title: 'Type mismatch', evidence: ['error TS2322'] }],
      }),
    );

    const review = await reviewTestOutput({
      output: 'src/foo.ts(1,1): error TS2322: bad type',
      reasoner: { generateObject },
      sourceLabel: 'tsc',
    });

    expect(generateObject).toHaveBeenCalledTimes(1);
    expect(review).toMatchObject({
      reviewer: 'gemini',
      status: 'fail',
      likelyFiles: ['src/foo.ts'],
    });
  });

  it('formats review output for the terminal', () => {
    const formatted = formatTestOutputReview({
      reviewer: 'gemini',
      status: 'warn',
      summary: 'One likely issue found.',
      likelyRootCause: 'Missing module.',
      shouldBlock: true,
      confidence: 0.7,
      likelyFiles: ['src/foo.ts'],
      nextCommands: ['pnpm build'],
      findings: [{ severity: 'high', title: 'Missing module', evidence: ['Module not found'] }],
    });

    expect(formatted).toContain('AI test-output review');
    expect(formatted).toContain('Missing module.');
    expect(formatted).toContain('pnpm build');
  });

  it('builds a prompt anchored to the provided source label', () => {
    const prompt = buildTestOutputReviewPrompt('vitest', 'FAIL src/foo.test.ts');

    expect(prompt).toContain('reviewing vitest');
    expect(prompt).toContain('FAIL src/foo.test.ts');
  });
});
