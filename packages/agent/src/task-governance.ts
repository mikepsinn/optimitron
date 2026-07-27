import { z } from 'zod';

export type TaskProposalSeverity = 'error' | 'warning';

export const TaskProposalImpactSchema = z.object({
  delayDalysLostPerDay: z.number().nullable().optional(),
  delayEconomicValueUsdLostPerDay: z.number().nullable().optional(),
  expectedValuePerHourDalys: z.number().nullable().optional(),
  expectedValuePerHourUsd: z.number().nullable().optional(),
});

export interface TaskProposalImpact {
  delayDalysLostPerDay?: number | null;
  delayEconomicValueUsdLostPerDay?: number | null;
  expectedValuePerHourDalys?: number | null;
  expectedValuePerHourUsd?: number | null;
}

export const TaskProposalCandidateSchema = z.object({
  assigneeOrganizationId: z.string().nullable().optional(),
  assigneePersonId: z.string().nullable().optional(),
  blockerRefs: z.array(z.string().min(1)).optional(),
  contactUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  estimatedEffortHours: z.number().nullable().optional(),
  id: z.string().nullable().optional(),
  impact: TaskProposalImpactSchema.nullable().optional(),
  isPublic: z.boolean().nullable().optional(),
  parentTaskRef: z.string().nullable().optional(),
  roleTitle: z.string().nullable().optional(),
  sourceUrls: z.array(z.string().min(1)).optional(),
  status: z.string().nullable().optional(),
  taskKey: z.string().nullable().optional(),
  title: z.string().min(1),
});

export interface TaskProposalCandidate {
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  blockerRefs?: string[];
  contactUrl?: string | null;
  description?: string | null;
  estimatedEffortHours?: number | null;
  id?: string | null;
  impact?: TaskProposalImpact | null;
  isPublic?: boolean | null;
  parentTaskRef?: string | null;
  roleTitle?: string | null;
  sourceUrls?: string[];
  status?: string | null;
  taskKey?: string | null;
  title: string;
}

export const ExistingTaskSummarySchema = z.object({
  assigneeOrganizationId: z.string().nullable().optional(),
  assigneePersonId: z.string().nullable().optional(),
  id: z.string().min(1),
  roleTitle: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  taskKey: z.string().nullable().optional(),
  title: z.string().min(1),
});

export interface ExistingTaskSummary {
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  id: string;
  roleTitle?: string | null;
  status?: string | null;
  taskKey?: string | null;
  title: string;
}

export const TaskProposalSeveritySchema = z.enum(['error', 'warning']);

export interface TaskProposalIssue {
  code:
    | 'agent-proposals-should-start-draft'
    | 'bundle-too-large'
    | 'cyclic-blockers'
    | 'duplicate-fingerprint'
    | 'duplicate-task-key'
    | 'invalid-contact-url'
    | 'missing-grounding-refs'
    | 'quality-below-threshold'
    | 'missing-assignee-context'
    | 'missing-description'
    | 'missing-effort-estimate'
    | 'missing-impact'
    | 'missing-source-urls'
    | 'missing-title'
    | 'self-blocker'
    | 'unknown-blocker';
  message: string;
  severity: TaskProposalSeverity;
}

export const TaskProposalIssueSchema = z.object({
  code: z.enum([
    'agent-proposals-should-start-draft',
    'bundle-too-large',
    'cyclic-blockers',
    'duplicate-fingerprint',
    'duplicate-task-key',
    'invalid-contact-url',
    'missing-grounding-refs',
    'quality-below-threshold',
    'missing-assignee-context',
    'missing-description',
    'missing-effort-estimate',
    'missing-impact',
    'missing-source-urls',
    'missing-title',
    'self-blocker',
    'unknown-blocker',
  ]),
  message: z.string().min(1),
  severity: TaskProposalSeveritySchema,
});

export interface TaskProposalEvaluation {
  qualityScore: number;
  rationale: string[];
}

export const TaskProposalEvaluationSchema = z.object({
  qualityScore: z.number(),
  rationale: z.array(z.string().min(1)),
});

export interface TaskProposalDecision {
  evaluation: TaskProposalEvaluation;
  issues: TaskProposalIssue[];
  promotable: boolean;
  proposalRef: string;
  title: string;
}

export const TaskProposalDecisionSchema = z.object({
  evaluation: TaskProposalEvaluationSchema,
  issues: z.array(TaskProposalIssueSchema),
  promotable: z.boolean(),
  proposalRef: z.string().min(1),
  title: z.string().min(1),
});

export interface TaskBundleReview {
  decisions: TaskProposalDecision[];
  promotableCount: number;
  summary: string;
}

export const TaskBundleReviewSchema = z.object({
  decisions: z.array(TaskProposalDecisionSchema),
  promotableCount: z.number().int().nonnegative(),
  summary: z.string().min(1),
});

export const TaskProposalBundleInputSchema = z.object({
  candidates: z.array(TaskProposalCandidateSchema).min(1),
  existingTasks: z.array(ExistingTaskSummarySchema).optional(),
});

export type TaskProposalBundleInput = z.infer<typeof TaskProposalBundleInputSchema>;

export const TaskPromotionRequestSchema = z.object({
  proposalRefs: z.array(z.string().min(1)).min(1),
});

export type TaskPromotionRequest = z.infer<typeof TaskPromotionRequestSchema>;

export interface TaskProposalReviewPolicy {
  maximumBundleSize: number;
  minimumPrivateQualityScore: number;
  minimumQualityScore: number;
}

export const DEFAULT_TASK_PROPOSAL_REVIEW_POLICY: TaskProposalReviewPolicy = {
  maximumBundleSize: 12,
  minimumPrivateQualityScore: 0.2,
  minimumQualityScore: 0.55,
};

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function uniqueStrings(values: string[] | undefined) {
  return Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)));
}

function proposalRef(task: TaskProposalCandidate) {
  const trimmedId = task.id?.trim();
  if (trimmedId) {
    return trimmedId;
  }

  const trimmedTaskKey = task.taskKey?.trim();
  if (trimmedTaskKey) {
    return trimmedTaskKey;
  }

  return taskGovernanceFingerprint(task);
}

export function taskGovernanceFingerprint(
  task: Pick<
    TaskProposalCandidate | ExistingTaskSummary,
    'assigneeOrganizationId' | 'assigneePersonId' | 'roleTitle' | 'title'
  >,
) {
  return [
    normalizeText(task.title),
    task.assigneePersonId?.trim() ?? '',
    task.assigneeOrganizationId?.trim() ?? '',
    normalizeText(task.roleTitle),
  ].join('::');
}

function isLikelyContactTask(task: TaskProposalCandidate) {
  const key = task.taskKey ?? '';
  const title = task.title.toLowerCase();
  return key.includes('contact-office') || title.includes('contact ');
}

function isValidHttpUrl(value: string | null | undefined) {
  if (!value?.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isLikelyGroundingRef(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('manual-section:') ||
    trimmed.startsWith('source-artifact:')
  ) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    return (
      host === 'optimitron.earth' ||
      host === 'www.optimitron.earth' ||
      host === 'optimitron.com' ||
      host === 'www.optimitron.com' ||
      host === 'manual.warondisease.org' ||
      host === 'warondisease.org' ||
      host.endsWith('.warondisease.org')
    );
  } catch {
    return false;
  }
}

function looksLikeStrategicTask(task: TaskProposalCandidate) {
  const haystack = [
    task.taskKey ?? '',
    task.title,
    task.description ?? '',
  ]
    .join(' ')
    .toLowerCase();

  return [
    'system:',
    'optimize-earth',
    'growth',
    'conversion',
    'funnel',
    'distribution',
    'traffic',
    'memetic',
    'queue',
    'ranking',
    'generator',
    'bootstrap',
    'ground task generation',
    'marketing',
    'procurement',
    'funding',
    'fundraise',
    'budget',
    'page',
    'scoreboard',
    'politician',
    'task list',
    'wishonia',
    'manual',
  ].some((needle) => haystack.includes(needle));
}

function hasMeaningfulImpact(impact: TaskProposalImpact | null | undefined) {
  return Boolean(
    (impact?.delayDalysLostPerDay ?? 0) > 0 ||
      (impact?.delayEconomicValueUsdLostPerDay ?? 0) > 0 ||
      (impact?.expectedValuePerHourDalys ?? 0) > 0 ||
      (impact?.expectedValuePerHourUsd ?? 0) > 0,
  );
}

function logScore(value: number | null | undefined, divisor: number) {
  if (value === null || value === undefined || value <= 0) {
    return 0;
  }

  return Math.min(1, Math.log10(value + 1) / divisor);
}

function actionabilityScore(task: TaskProposalCandidate) {
  let score = 0.25;

  if (task.assigneePersonId || task.assigneeOrganizationId || task.roleTitle) {
    score += 0.25;
  }
  if ((task.description?.trim().length ?? 0) >= 24) {
    score += 0.2;
  }
  if ((task.estimatedEffortHours ?? 0) > 0) {
    score += 0.15;
  }
  if (uniqueStrings(task.sourceUrls).length > 0) {
    score += 0.15;
  }

  return Math.min(1, score);
}

function evaluateTaskProposal(task: TaskProposalCandidate): TaskProposalEvaluation {
  const impact = task.impact ?? {};
  const delayScore =
    0.6 * logScore(impact.delayEconomicValueUsdLostPerDay, 10) +
    0.4 * logScore(impact.delayDalysLostPerDay, 8);
  const valuePerHourScore =
    0.6 * logScore(impact.expectedValuePerHourUsd, 10) +
    0.4 * logScore(impact.expectedValuePerHourDalys, 8);
  const effortScore =
    task.estimatedEffortHours === null || task.estimatedEffortHours === undefined || task.estimatedEffortHours <= 0
      ? 0
      : Math.max(0.2, 1 - Math.min(task.estimatedEffortHours, 12) / 15);
  const qualityScore =
    delayScore * 0.4 + valuePerHourScore * 0.35 + effortScore * 0.1 + actionabilityScore(task) * 0.15;

  const rationale = [
    `Delay-cost score: ${delayScore.toFixed(2)}.`,
    `Value-per-hour score: ${valuePerHourScore.toFixed(2)}.`,
    `Actionability score: ${actionabilityScore(task).toFixed(2)}.`,
  ];

  return {
    qualityScore,
    rationale,
  };
}

function collectGraphIssues(input: {
  candidates: TaskProposalCandidate[];
  existingRefs: Set<string>;
  issuesByRef: Map<string, TaskProposalIssue[]>;
}) {
  const adjacency = new Map<string, string[]>();
  const candidateRefByAlias = new Map<string, string>();

  for (const candidate of input.candidates) {
    const ref = proposalRef(candidate);
    for (const alias of [ref, candidate.id?.trim(), candidate.taskKey?.trim()]) {
      if (alias && !candidateRefByAlias.has(alias)) {
        candidateRefByAlias.set(alias, ref);
      }
    }
  }

  for (const candidate of input.candidates) {
    const ref = proposalRef(candidate);
    adjacency.set(
      ref,
      uniqueStrings(candidate.blockerRefs).map(
        (blockerRef) => candidateRefByAlias.get(blockerRef) ?? blockerRef,
      ),
    );
  }

  for (const candidate of input.candidates) {
    const ref = proposalRef(candidate);
    const issues = input.issuesByRef.get(ref) ?? [];
    const blockers = uniqueStrings(candidate.blockerRefs);

    for (const blockerRef of blockers) {
      const candidateBlockerRef = candidateRefByAlias.get(blockerRef);
      if (candidateBlockerRef === ref) {
        issues.push({
          code: 'self-blocker',
          message: 'Task cannot block itself.',
          severity: 'error',
        });
        continue;
      }

      if (!candidateBlockerRef && !input.existingRefs.has(blockerRef)) {
        issues.push({
          code: 'unknown-blocker',
          message: `Blocker reference "${blockerRef}" does not exist in the bundle or known tasks.`,
          severity: 'error',
        });
      }
    }

    input.issuesByRef.set(ref, issues);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(ref: string, stack: string[]) {
    if (visiting.has(ref)) {
      const cycleStart = stack.indexOf(ref);
      const cycle = [...stack.slice(cycleStart), ref].join(' -> ');
      for (const cycleRef of stack.slice(cycleStart)) {
        const issues = input.issuesByRef.get(cycleRef) ?? [];
        issues.push({
          code: 'cyclic-blockers',
          message: `Blocker cycle detected: ${cycle}.`,
          severity: 'error',
        });
        input.issuesByRef.set(cycleRef, issues);
      }
      return;
    }

    if (visited.has(ref)) {
      return;
    }

    visiting.add(ref);
    const next = adjacency.get(ref) ?? [];
    for (const blockerRef of next) {
      if (adjacency.has(blockerRef)) {
        dfs(blockerRef, [...stack, ref]);
      }
    }
    visiting.delete(ref);
    visited.add(ref);
  }

  for (const ref of adjacency.keys()) {
    dfs(ref, []);
  }
}

export function reviewTaskProposalBundle(input: {
  candidates: TaskProposalCandidate[];
  existingTasks?: ExistingTaskSummary[];
}): TaskBundleReview {
  const parsedInput = TaskProposalBundleInputSchema.parse(input);
  const policy = DEFAULT_TASK_PROPOSAL_REVIEW_POLICY;
  const existingTasks = parsedInput.existingTasks ?? [];
  const existingTaskKeys = new Set(existingTasks.map((task) => task.taskKey?.trim()).filter(Boolean) as string[]);
  const existingFingerprints = new Set(existingTasks.map((task) => taskGovernanceFingerprint(task)));
  const existingRefs = new Set<string>([
    ...existingTasks.map((task) => task.id),
    ...existingTasks.map((task) => task.taskKey?.trim()).filter(Boolean) as string[],
  ]);
  const bundleTaskKeys = new Map<string, string>();
  const bundleFingerprints = new Map<string, string>();
  const issuesByRef = new Map<string, TaskProposalIssue[]>();
  const bundleTooLarge = parsedInput.candidates.length > policy.maximumBundleSize;

  for (const candidate of parsedInput.candidates) {
    const ref = proposalRef(candidate);
    const issues: TaskProposalIssue[] = [];
    const taskKey = candidate.taskKey?.trim();
    const currentFingerprint = taskGovernanceFingerprint(candidate);
    const sourceUrls = uniqueStrings(candidate.sourceUrls);

    if (bundleTooLarge) {
      issues.push({
        code: 'bundle-too-large',
        message: `Bundle contains ${parsedInput.candidates.length} tasks, above the review cap of ${policy.maximumBundleSize}. Split it into smaller grounded batches.`,
        severity: 'error',
      });
    }

    if (!candidate.title.trim()) {
      issues.push({
        code: 'missing-title',
        message: 'Task title is required and cannot be blank.',
        severity: 'error',
      });
    }

    if ((candidate.description?.trim().length ?? 0) < 24) {
      issues.push({
        code: 'missing-description',
        message: 'Description should state the concrete action and acceptance criteria in plain language.',
        severity: 'error',
      });
    }

    if ((candidate.estimatedEffortHours ?? 0) <= 0) {
      issues.push({
        code: 'missing-effort-estimate',
        message: 'Estimated effort hours must be greater than zero.',
        severity: 'error',
      });
    }

    if ((candidate.isPublic ?? true) && !hasMeaningfulImpact(candidate.impact)) {
      issues.push({
        code: 'missing-impact',
        message: 'Public executable tasks need a non-zero impact or delay estimate before promotion.',
        severity: 'error',
      });
    }

    if ((candidate.isPublic ?? true) && sourceUrls.length === 0) {
      issues.push({
        code: 'missing-source-urls',
        message: 'Public executable tasks need at least one supporting source URL.',
        severity: 'error',
      });
    }

    if (
      looksLikeStrategicTask(candidate) &&
      !sourceUrls.some((sourceUrl) => isLikelyGroundingRef(sourceUrl))
    ) {
      issues.push({
        code: 'missing-grounding-refs',
        message:
          'System/growth/procurement tasks must cite a concrete Optimitron page, route, manual section, or source artifact instead of generic strategy references.',
        severity: 'error',
      });
    }

    if ((candidate.isPublic ?? true) && !(candidate.assigneePersonId || candidate.assigneeOrganizationId || candidate.roleTitle)) {
      issues.push({
        code: 'missing-assignee-context',
        message: 'Public executable tasks need a person, organization, or role anchor.',
        severity: 'error',
      });
    }

    if (candidate.contactUrl?.trim() && !isValidHttpUrl(candidate.contactUrl)) {
      issues.push({
        code: 'invalid-contact-url',
        message: 'Contact URL must be a valid http(s) URL.',
        severity: 'error',
      });
    }

    if (isLikelyContactTask(candidate) && !isValidHttpUrl(candidate.contactUrl)) {
      issues.push({
        code: 'invalid-contact-url',
        message: 'Contact/outreach tasks need a live http(s) contact URL before promotion.',
        severity: 'error',
      });
    }

    if ((candidate.status ?? '').toUpperCase() === 'ACTIVE') {
      issues.push({
        code: 'agent-proposals-should-start-draft',
        message: 'Agent-created tasks should start as DRAFT and be promoted explicitly after review.',
        severity: 'warning',
      });
    }

    if (taskKey) {
      const existingHolder = bundleTaskKeys.get(taskKey);
      if (existingHolder) {
        issues.push({
          code: 'duplicate-task-key',
          message: `Task key "${taskKey}" already appears in bundle task ${existingHolder}.`,
          severity: 'error',
        });
      } else if (existingTaskKeys.has(taskKey)) {
        issues.push({
          code: 'duplicate-task-key',
          message: `Task key "${taskKey}" already exists in the canonical task graph.`,
          severity: 'error',
        });
      } else {
        bundleTaskKeys.set(taskKey, ref);
      }
    }

    const duplicateFingerprintRef = bundleFingerprints.get(currentFingerprint);
    if (duplicateFingerprintRef) {
      issues.push({
        code: 'duplicate-fingerprint',
        message: `Task appears duplicate-equivalent to bundle task ${duplicateFingerprintRef}.`,
        severity: 'error',
      });
    } else if (existingFingerprints.has(currentFingerprint)) {
      issues.push({
        code: 'duplicate-fingerprint',
        message: 'Task appears duplicate-equivalent to an existing canonical task.',
        severity: 'error',
      });
    } else {
      bundleFingerprints.set(currentFingerprint, ref);
    }

    issuesByRef.set(ref, issues);
  }

  collectGraphIssues({
    candidates: parsedInput.candidates,
    existingRefs,
    issuesByRef,
  });

  const decisions = parsedInput.candidates.map((candidate) => {
    const ref = proposalRef(candidate);
    const issues = issuesByRef.get(ref) ?? [];
    const evaluation = evaluateTaskProposal(candidate);
    const minimumQualityScore =
      (candidate.isPublic ?? true) ? policy.minimumQualityScore : policy.minimumPrivateQualityScore;
    if (evaluation.qualityScore < minimumQualityScore) {
      issues.push({
        code: 'quality-below-threshold',
        message: `Quality score ${evaluation.qualityScore.toFixed(2)} is below the promotion threshold of ${minimumQualityScore.toFixed(2)}.`,
        severity: 'error',
      });
    }
    const promotable = !issues.some((issue) => issue.severity === 'error');

    return {
      evaluation,
      issues,
      promotable,
      proposalRef: ref,
      title: candidate.title,
    } satisfies TaskProposalDecision;
  });

  const promotableCount = decisions.filter((decision) => decision.promotable).length;

  return TaskBundleReviewSchema.parse({
    decisions,
    promotableCount,
    summary: `${promotableCount} of ${decisions.length} proposed task${decisions.length === 1 ? '' : 's'} cleared promotion review.`,
  });
}
