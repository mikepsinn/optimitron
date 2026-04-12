import { z } from 'zod';
import { createGeminiReasoner } from './gemini.js';
import type { StructuredReasoner } from './types.js';

const FAILURE_PATTERNS = [
  /error TS\d+:/i,
  /\bFAIL\b/,
  /\bERR_[A-Z0-9_]+\b/,
  /Failed to compile/i,
  /Command failed with exit code/i,
  /Module not found/i,
  /AssertionError/i,
  /TypeError:/i,
  /ReferenceError:/i,
  /SyntaxError:/i,
  /Cannot find module/i,
  /not assignable to type/i,
] as const;

const REVIEW_JSON_SCHEMA = {
  type: 'object',
  required: ['status', 'summary', 'likelyRootCause', 'shouldBlock', 'confidence', 'findings', 'likelyFiles', 'nextCommands'],
  properties: {
    status: { type: 'string', enum: ['pass', 'warn', 'fail', 'inconclusive'] },
    summary: { type: 'string' },
    likelyRootCause: { type: 'string' },
    shouldBlock: { type: 'boolean' },
    confidence: { type: 'number' },
    likelyFiles: { type: 'array', items: { type: 'string' } },
    nextCommands: { type: 'array', items: { type: 'string' } },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'title', 'evidence'],
        properties: {
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          title: { type: 'string' },
          evidence: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
} as const;

export const TestOutputReviewFindingSchema = z.object({
  severity: z.enum(['high', 'medium', 'low']),
  title: z.string().min(1),
  evidence: z.array(z.string().min(1)).default([]),
});

export const TestOutputReviewSchema = z.object({
  reviewer: z.enum(['deterministic', 'gemini']),
  status: z.enum(['pass', 'warn', 'fail', 'inconclusive']),
  summary: z.string().min(1),
  likelyRootCause: z.string().min(1),
  shouldBlock: z.boolean(),
  confidence: z.number().min(0).max(1),
  likelyFiles: z.array(z.string().min(1)).default([]),
  nextCommands: z.array(z.string().min(1)).default([]),
  findings: z.array(TestOutputReviewFindingSchema).default([]),
});

export type TestOutputReview = z.infer<typeof TestOutputReviewSchema>;

export interface ReviewTestOutputOptions {
  apiKey?: string;
  force?: boolean;
  maxChars?: number;
  model?: string;
  output: string;
  reasoner?: StructuredReasoner;
  sourceLabel?: string;
}

function normalizeOutput(output: string): string {
  return output.replace(/\r\n/g, '\n').trim();
}

function matchingLineIndexes(lines: string[]): number[] {
  return lines.flatMap((line, index) =>
    FAILURE_PATTERNS.some((pattern) => pattern.test(line)) ? [index] : [],
  );
}

function withContext(indexes: number[], maxIndex: number): number[] {
  return [...new Set(indexes.flatMap((index) => [index - 1, index, index + 1]))]
    .filter((index) => index >= 0 && index <= maxIndex)
    .sort((left, right) => left - right);
}

function compactLines(lines: string[], maxChars: number): string {
  let total = 0;
  const selected: string[] = [];

  for (const line of lines) {
    if (total + line.length + 1 > maxChars) break;
    selected.push(line);
    total += line.length + 1;
  }

  return selected.join('\n');
}

export function hasFailureSignals(output: string): boolean {
  return FAILURE_PATTERNS.some((pattern) => pattern.test(output));
}

export function extractLikelyFiles(output: string, limit = 6): string[] {
  const matches = output.match(/(?:[A-Za-z]:)?[^\s"'`]+?\.(?:tsx|ts|jsx|js|json|prisma|md)(?::\d+)?/g) ?? [];
  return [...new Set(matches.map((match) => match.replace(/:\d+$/, '')))].slice(0, limit);
}

export function extractReviewSnippet(output: string, maxChars = 12_000): string {
  const normalized = normalizeOutput(output);
  const lines = normalized.split('\n').filter((line) => line.trim().length > 0);
  const indexes = matchingLineIndexes(lines);
  const focusedLines = indexes.length > 0
    ? withContext(indexes, lines.length - 1).map((index) => lines[index] ?? '')
    : lines.slice(-40);

  return compactLines(focusedLines, maxChars);
}

function fallbackCommands(output: string): string[] {
  if (/error TS\d+:/i.test(output)) return ['pnpm typecheck'];
  if (/\bFAIL\b|AssertionError|TypeError:|ReferenceError:/i.test(output)) return ['pnpm test'];
  if (/Failed to compile|Module not found/i.test(output)) return ['pnpm build'];
  return [];
}

function fallbackRootCause(output: string): string {
  const firstFailureLine = extractReviewSnippet(output, 400).split('\n')[0];
  return firstFailureLine ?? 'Failure markers detected, but no single root cause was extracted.';
}

function deterministicReview(output: string, sourceLabel: string, hasSignals: boolean): TestOutputReview {
  if (!hasSignals) {
    return {
      reviewer: 'deterministic',
      status: 'pass',
      summary: `No obvious failure markers found in ${sourceLabel}.`,
      likelyRootCause: 'No deterministic failure signature detected.',
      shouldBlock: false,
      confidence: 0.99,
      findings: [],
      likelyFiles: [],
      nextCommands: [],
    };
  }

  return {
    reviewer: 'deterministic',
    status: 'inconclusive',
    summary: `Failure markers were detected in ${sourceLabel}, but AI review was unavailable.`,
    likelyRootCause: fallbackRootCause(output),
    shouldBlock: true,
    confidence: 0.45,
    likelyFiles: extractLikelyFiles(output),
    nextCommands: fallbackCommands(output),
    findings: [{
      severity: 'high',
      title: 'Deterministic failure markers detected',
      evidence: extractReviewSnippet(output, 800).split('\n').slice(0, 4),
    }],
  };
}

export function buildTestOutputReviewPrompt(sourceLabel: string, output: string): string {
  return [
    `You are reviewing ${sourceLabel}.`,
    'This is advisory triage only. Never contradict deterministic compiler/test errors.',
    'Identify the most likely root cause, the files most likely involved, and the next commands worth running.',
    'If the output looks healthy, return status "pass" and shouldBlock false.',
    'If there is a real deterministic failure, prefer the earliest concrete error over downstream noise.',
    `Output excerpt:\n\n${output}`,
  ].join('\n\n');
}

function withReviewer(review: Omit<TestOutputReview, 'reviewer'>): TestOutputReview {
  return TestOutputReviewSchema.parse({
    reviewer: 'gemini',
    ...review,
  });
}

export async function reviewTestOutput(options: ReviewTestOutputOptions): Promise<TestOutputReview> {
  const sourceLabel = options.sourceLabel ?? 'test output';
  const normalized = normalizeOutput(options.output);
  const signals = hasFailureSignals(normalized);
  if (!signals && !options.force) return deterministicReview(normalized, sourceLabel, false);

  const reasoner = options.reasoner ?? (options.apiKey
    ? createGeminiReasoner({ apiKey: options.apiKey, model: options.model, temperature: 0.1, maxOutputTokens: 1600 })
    : null);
  if (!reasoner) return deterministicReview(normalized, sourceLabel, signals);

  const excerpt = extractReviewSnippet(normalized, options.maxChars ?? 12_000);
  const review = await reasoner.generateObject({
    schemaName: 'TestOutputReview',
    prompt: buildTestOutputReviewPrompt(sourceLabel, excerpt),
    responseJsonSchema: REVIEW_JSON_SCHEMA,
    parse: (value) => withReviewer(TestOutputReviewSchema.omit({ reviewer: true }).parse(value)),
  });
  return review;
}

export function formatTestOutputReview(review: TestOutputReview): string {
  const lines = [
    'AI test-output review',
    `Reviewer: ${review.reviewer}`,
    `Status: ${review.status}`,
    `Should block: ${review.shouldBlock ? 'yes' : 'no'}`,
    `Confidence: ${review.confidence.toFixed(2)}`,
    `Summary: ${review.summary}`,
    `Likely root cause: ${review.likelyRootCause}`,
  ];

  if (review.likelyFiles.length > 0) lines.push(`Likely files: ${review.likelyFiles.join(', ')}`);
  if (review.nextCommands.length > 0) lines.push(`Next commands: ${review.nextCommands.join(' ; ')}`);
  for (const finding of review.findings) {
    lines.push(`Finding [${finding.severity}]: ${finding.title}`);
    if (finding.evidence.length > 0) lines.push(`Evidence: ${finding.evidence.join(' | ')}`);
  }

  return lines.join('\n');
}
