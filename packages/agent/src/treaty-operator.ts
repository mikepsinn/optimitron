import { assessTaskCapability } from './task-capability.js';

export type TreatyActionKind =
  | 'contact-office'
  | 'publish-explainer'
  | 'secure-endorsement'
  | 'track-evidence'
  | 'signer'
  | 'unknown';

export type TreatyExecutionChannel =
  | 'contact-form'
  | 'email'
  | 'content'
  | 'research'
  | 'social'
  | 'manual-review';

export type TreatyExecutionMode = 'dry-run' | 'human-review' | 'auto';

export type TreatyTaskStatus = string;

export interface TreatyOperatorImpact {
  delayDalysLostPerDay?: number | null;
  delayEconomicValueUsdLostPerDay?: number | null;
  expectedValuePerHourDalys?: number | null;
  expectedValuePerHourUsd?: number | null;
}

export interface TreatyOperatorMilestone {
  completedAt?: Date | string | null;
  key: string;
  status: string;
  title: string;
  verifiedAt?: Date | string | null;
}

export interface TreatyOperatorTask {
  activeClaimCount?: number | null;
  blockedByTaskIds?: string[];
  claimPolicy?: string | null;
  contactLabel?: string | null;
  contactTemplate?: string | null;
  contactUrl?: string | null;
  contextJson?: Record<string, unknown> | null;
  countryCode?: string | null;
  countryName?: string | null;
  description?: string | null;
  dueAt?: Date | string | null;
  estimatedEffortHours?: number | null;
  executionMode?: string | null;
  id: string;
  impact?: TreatyOperatorImpact | null;
  interestTags?: string[];
  maxClaims?: number | null;
  milestones?: TreatyOperatorMilestone[];
  roleTitle?: string | null;
  requiredAccessTags?: string[];
  requiredCredentialTags?: string[];
  requiredLanguageTags?: string[];
  requiredToolTags?: string[];
  skillTags?: string[];
  status: TreatyTaskStatus;
  taskKey?: string | null;
  title: string;
}

export interface TreatyOperatorExecutionRecord {
  channel: TreatyExecutionChannel;
  countryCode?: string | null;
  kind: TreatyActionKind;
  live: boolean;
  occurredAt: Date | string;
  taskId?: string | null;
  taskKey?: string | null;
}

export interface TreatyOperatorCapabilities {
  accessTags?: string[] | null;
  allowedCountryCodes?: string[];
  channels: TreatyExecutionChannel[];
  credentialTags?: string[] | null;
  languageTags?: string[] | null;
  maxDailyLiveActions?: number | null;
  mode: TreatyExecutionMode;
  requiresHumanReview?: boolean;
  skillTags: string[];
  toolTags?: string[] | null;
}

export interface TreatyOperatorPolicy {
  endorsementCooldownHours: number;
  evidenceCooldownHours: number;
  explainerCooldownHours: number;
  maxDailyLiveActions: number;
  officeContactCooldownHours: number;
  taskPageBaseUrl: string;
}

export interface TreatyTaskBlocker {
  code:
    | 'blocked-by-task'
    | 'capability-mismatch'
    | 'capability-unknown'
    | 'country-not-allowed'
    | 'cooldown-active'
    | 'daily-limit-reached'
    | 'missing-contact-url'
    | 'missing-required-channel'
    | 'status-not-active'
    | 'task-fully-claimed';
  message: string;
}

export interface TreatyExecutionDraft {
  body: string;
  channel: TreatyExecutionChannel;
  references: string[];
  subject: string;
}

export interface TreatyExecutionPlan {
  channel: TreatyExecutionChannel;
  draft: TreatyExecutionDraft;
  estimatedEffortHours: number | null;
  guardrails: string[];
  kind: TreatyActionKind;
  mode: TreatyExecutionMode;
  score: number;
  taskId: string;
  taskKey: string | null;
  title: string;
  whyNow: string[];
}

export interface TreatyOperatorDecision {
  blockedTasks: Array<{
    blockers: TreatyTaskBlocker[];
    kind: TreatyActionKind;
    taskId: string;
    taskKey: string | null;
    title: string;
  }>;
  evaluatedAt: string;
  selectedPlan: TreatyExecutionPlan | null;
  shortlistedTasks: Array<{
    channel: TreatyExecutionChannel;
    guardrails: string[];
    kind: TreatyActionKind;
    score: number;
    taskId: string;
    taskKey: string | null;
    title: string;
    whyNow: string[];
  }>;
  summary: string;
}

const DEFAULT_POLICY: TreatyOperatorPolicy = {
  endorsementCooldownHours: 24 * 7,
  evidenceCooldownHours: 24 * 2,
  explainerCooldownHours: 24 * 3,
  maxDailyLiveActions: 4,
  officeContactCooldownHours: 24 * 14,
  taskPageBaseUrl: 'https://optimitron.com/tasks',
};

function normalizeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeCountryCode(input: string | null | undefined) {
  const normalized = input?.trim().toUpperCase();
  return normalized === undefined || normalized === '' ? null : normalized;
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function scoreLogUsd(value: number | null | undefined, divisor: number) {
  if (value === null || value === undefined || value <= 0) {
    return 0;
  }

  return Math.min(1, Math.log10(value + 1) / divisor);
}

function deriveCountryCode(task: TreatyOperatorTask) {
  const direct = normalizeCountryCode(task.countryCode);
  if (direct) {
    return direct;
  }

  const fromContext = normalizeCountryCode(
    (task.contextJson?.['treatySignerSlot'] as { countryCode?: string } | undefined)?.countryCode,
  );
  if (fromContext) {
    return fromContext;
  }

  const match = task.taskKey?.match(/:([a-z]{2}):support:/i) ?? task.taskKey?.match(/:([a-z]{2})$/i);
  return normalizeCountryCode(match?.[1] ?? null);
}

export function classifyTreatyActionKind(task: Pick<TreatyOperatorTask, 'taskKey'>): TreatyActionKind {
  const taskKey = task.taskKey ?? '';
  if (taskKey.includes(':support:contact-office')) {
    return 'contact-office';
  }
  if (taskKey.includes(':support:publish-explainer')) {
    return 'publish-explainer';
  }
  if (taskKey.includes(':support:secure-endorsement')) {
    return 'secure-endorsement';
  }
  if (taskKey.includes(':support:track-evidence')) {
    return 'track-evidence';
  }
  if (taskKey.includes(':signer') || taskKey.includes(':signer:')) {
    return 'signer';
  }

  return 'unknown';
}

function canTaskAcceptMoreClaims(task: TreatyOperatorTask) {
  const policy = (task.claimPolicy ?? '').toUpperCase();
  const activeClaimCount = task.activeClaimCount ?? 0;

  if (policy === 'ASSIGNED_ONLY') {
    return false;
  }
  if (policy === 'OPEN_SINGLE') {
    return activeClaimCount === 0;
  }
  if (policy === 'OPEN_MANY' && task.maxClaims !== null && task.maxClaims !== undefined) {
    return activeClaimCount < task.maxClaims;
  }

  return true;
}

function preferredChannel(
  kind: TreatyActionKind,
  capabilities: TreatyOperatorCapabilities,
  task: TreatyOperatorTask,
): TreatyExecutionChannel | null {
  const available = new Set(capabilities.channels);

  if (kind === 'contact-office') {
    if (task.contactUrl && available.has('contact-form')) {
      return 'contact-form' satisfies TreatyExecutionChannel;
    }
    if (available.has('email')) {
      return 'email' satisfies TreatyExecutionChannel;
    }
    return null;
  }

  if (kind === 'publish-explainer') {
    if (available.has('content')) {
      return 'content' satisfies TreatyExecutionChannel;
    }
    if (available.has('social')) {
      return 'social' satisfies TreatyExecutionChannel;
    }
    return null;
  }

  if (kind === 'secure-endorsement') {
    if (available.has('email')) {
      return 'email' satisfies TreatyExecutionChannel;
    }
    if (available.has('research')) {
      return 'research' satisfies TreatyExecutionChannel;
    }
    return null;
  }

  if (kind === 'track-evidence') {
    return available.has('research') ? 'research' : null;
  }

  return available.has('manual-review') ? 'manual-review' : null;
}

function cooldownHoursForKind(kind: TreatyActionKind, policy: TreatyOperatorPolicy) {
  switch (kind) {
    case 'contact-office':
      return policy.officeContactCooldownHours;
    case 'publish-explainer':
      return policy.explainerCooldownHours;
    case 'secure-endorsement':
      return policy.endorsementCooldownHours;
    case 'track-evidence':
      return policy.evidenceCooldownHours;
    default:
      return 0;
  }
}

function hasMatchingRecentExecution(input: {
  countryCode: string | null;
  executions: TreatyOperatorExecutionRecord[];
  kind: TreatyActionKind;
  now: Date;
  policy: TreatyOperatorPolicy;
  task: TreatyOperatorTask;
}) {
  const cooldownMs = cooldownHoursForKind(input.kind, input.policy) * 60 * 60 * 1000;
  if (cooldownMs <= 0) {
    return false;
  }

  return input.executions.some((execution) => {
    if (execution.kind !== input.kind) {
      return false;
    }

    const occurredAt = normalizeDate(execution.occurredAt);
    if (!occurredAt) {
      return false;
    }

    const withinWindow = input.now.getTime() - occurredAt.getTime() < cooldownMs;
    if (!withinWindow) {
      return false;
    }

    if (execution.taskId && execution.taskId === input.task.id) {
      return true;
    }

    if (execution.taskKey && input.task.taskKey && execution.taskKey === input.task.taskKey) {
      return true;
    }

    if (
      input.kind === 'contact-office' &&
      normalizeCountryCode(execution.countryCode) &&
      normalizeCountryCode(execution.countryCode) === input.countryCode
    ) {
      return true;
    }

    return false;
  });
}

function countRecentLiveExecutions(executions: TreatyOperatorExecutionRecord[], now: Date) {
  const windowStart = now.getTime() - 24 * 60 * 60 * 1000;
  return executions.filter((execution) => {
    if (!execution.live) {
      return false;
    }

    const occurredAt = normalizeDate(execution.occurredAt);
    return occurredAt !== null && occurredAt.getTime() >= windowStart;
  }).length;
}

export function getTreatyTaskBlockers(input: {
  capabilities: TreatyOperatorCapabilities;
  executions?: TreatyOperatorExecutionRecord[];
  now?: Date;
  policy?: Partial<TreatyOperatorPolicy>;
  task: TreatyOperatorTask;
}) {
  const now = input.now ?? new Date();
  const policy = {
    ...DEFAULT_POLICY,
    ...input.policy,
  };
  const executions = input.executions ?? [];
  const blockers: TreatyTaskBlocker[] = [];
  const kind = classifyTreatyActionKind(input.task);
  const countryCode = deriveCountryCode(input.task);
  const channel = preferredChannel(kind, input.capabilities, input.task);

  if (input.task.status !== 'ACTIVE') {
    blockers.push({
      code: 'status-not-active',
      message: `Task status is ${input.task.status}, so the operator should skip it.`,
    });
  }

  if ((input.task.blockedByTaskIds ?? []).length > 0) {
    blockers.push({
      code: 'blocked-by-task',
      message: `Task has ${input.task.blockedByTaskIds?.length ?? 0} unresolved blocker dependencies.`,
    });
  }

  if (!canTaskAcceptMoreClaims(input.task)) {
    blockers.push({
      code: 'task-fully-claimed',
      message: 'Task cannot currently accept another claim.',
    });
  }

  if (
    input.capabilities.allowedCountryCodes?.length &&
    countryCode &&
    !input.capabilities.allowedCountryCodes.map(normalizeCountryCode).includes(countryCode)
  ) {
    blockers.push({
      code: 'country-not-allowed',
      message: `Agent is not configured for ${countryCode}.`,
    });
  }

  if (kind === 'contact-office' && !input.task.contactUrl) {
    blockers.push({
      code: 'missing-contact-url',
      message: 'Contact-office task has no contact URL.',
    });
  }

  if (channel === null) {
    blockers.push({
      code: 'missing-required-channel',
      message: `Agent lacks the channel needed for ${kind}.`,
    });
  }

  const capability = assessTaskCapability({
    executor: {
      accessTags: input.capabilities.accessTags,
      credentialTags: input.capabilities.credentialTags,
      executorKind: 'agent',
      languageTags: input.capabilities.languageTags,
      skillTags: input.capabilities.skillTags,
      toolTags: input.capabilities.toolTags,
    },
    task: input.task,
  });
  if (capability.status !== 'eligible') {
    blockers.push({
      code: capability.status === 'unknown' ? 'capability-unknown' : 'capability-mismatch',
      message: capability.reasons.join(' '),
    });
  }

  if (
    hasMatchingRecentExecution({
      countryCode,
      executions,
      kind,
      now,
      policy,
      task: input.task,
    })
  ) {
    blockers.push({
      code: 'cooldown-active',
      message: `A recent ${kind} action already happened inside the cooldown window.`,
    });
  }

  if (
    input.capabilities.mode === 'auto' &&
    countRecentLiveExecutions(executions, now) >=
      (input.capabilities.maxDailyLiveActions ?? policy.maxDailyLiveActions)
  ) {
    blockers.push({
      code: 'daily-limit-reached',
      message: 'The live-action daily limit is already exhausted.',
    });
  }

  return {
    blockers,
    channel,
    countryCode,
    kind,
    policy,
  };
}

function getActionTypeBoost(kind: TreatyActionKind) {
  switch (kind) {
    case 'contact-office':
      return 1.25;
    case 'publish-explainer':
      return 1.05;
    case 'secure-endorsement':
      return 1;
    case 'track-evidence':
      return 0.9;
    default:
      return 0.2;
  }
}

function getEffortBoost(estimatedEffortHours: number | null | undefined) {
  if (estimatedEffortHours === null || estimatedEffortHours === undefined || estimatedEffortHours <= 0) {
    return 0.6;
  }

  return Math.max(0.2, 1 - Math.min(estimatedEffortHours, 8) / 10);
}

function getUrgencyBoost(dueAt: Date | string | null | undefined, now: Date) {
  const normalized = normalizeDate(dueAt);
  if (!normalized) {
    return 0.4;
  }

  const msLate = now.getTime() - normalized.getTime();
  if (msLate <= 0) {
    return 0.3;
  }

  const daysLate = msLate / (24 * 60 * 60 * 1000);
  return Math.min(1, 0.3 + Math.log10(daysLate + 1) / 3);
}

export function scoreTreatyTaskForExecution(input: {
  capabilities: TreatyOperatorCapabilities;
  now?: Date;
  task: TreatyOperatorTask;
}) {
  const now = input.now ?? new Date();
  const kind = classifyTreatyActionKind(input.task);
  const impact = input.task.impact ?? {};
  const delayScore =
    0.65 * scoreLogUsd(impact.delayEconomicValueUsdLostPerDay, 10) +
    0.35 * scoreLogUsd(impact.delayDalysLostPerDay, 8);
  const valuePerHourScore =
    0.65 * scoreLogUsd(impact.expectedValuePerHourUsd, 10) +
    0.35 * scoreLogUsd(impact.expectedValuePerHourDalys, 8);
  const skillOverlap =
    (input.task.skillTags ?? []).filter((tag) =>
      input.capabilities.skillTags.map(normalizeTag).includes(normalizeTag(tag)),
    ).length > 0
      ? 1
      : 0.55;

  return (
    (delayScore * 0.45 + valuePerHourScore * 0.35 + getUrgencyBoost(input.task.dueAt, now) * 0.2) *
    getActionTypeBoost(kind) *
    getEffortBoost(input.task.estimatedEffortHours) *
    skillOverlap
  );
}

function formatUsd(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return 'unknown';
  }

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: Math.abs(value) >= 1000 ? 'compact' : 'standard',
    style: 'currency',
  }).format(value);
}

function formatDelayLabel(dueAt: Date | string | null | undefined, now: Date) {
  const normalized = normalizeDate(dueAt);
  if (!normalized) {
    return 'still incomplete';
  }

  const msLate = now.getTime() - normalized.getTime();
  if (msLate <= 0) {
    return 'not yet overdue';
  }

  const daysLate = Math.floor(msLate / (24 * 60 * 60 * 1000));
  return `${daysLate} day${daysLate === 1 ? '' : 's'} overdue`;
}

function getTaskUrl(task: TreatyOperatorTask, policy: TreatyOperatorPolicy) {
  return `${policy.taskPageBaseUrl.replace(/\/$/, '')}/${task.id}`;
}

function buildDraft(input: {
  channel: TreatyExecutionChannel;
  kind: TreatyActionKind;
  now: Date;
  policy: TreatyOperatorPolicy;
  task: TreatyOperatorTask;
}) {
  const countryName =
    input.task.countryName ??
    ((input.task.contextJson?.['treatySignerSlot'] as { countryName?: string } | undefined)?.countryName ??
      'this country');
  const delayLabel = formatDelayLabel(input.task.dueAt, input.now);
  const dailyLoss = formatUsd(input.task.impact?.delayEconomicValueUsdLostPerDay);
  const taskUrl = getTaskUrl(input.task, input.policy);

  if (input.kind === 'contact-office') {
    return {
      body: [
        `Please complete the task "${input.task.title}".`,
        `It is already ${delayLabel}. The current model estimates ongoing losses of about ${dailyLoss} per day while it remains undone.`,
        `Public accountability page: ${taskUrl}`,
      ].join(' '),
      references: [taskUrl, input.task.contactUrl ?? ''],
      subject: `${countryName}: complete the 1% Treaty task`,
    } satisfies Omit<TreatyExecutionDraft, 'channel'>;
  }

  if (input.kind === 'publish-explainer') {
    return {
      body: [
        `Angle: ${input.task.title}.`,
        `Explain why the task is ${delayLabel}, quantify the daily delay cost (${dailyLoss}), and link directly to ${taskUrl}.`,
        `End with a concrete ask: contact the office and share the task page.`,
      ].join(' '),
      references: [taskUrl],
      subject: `Explainer brief for ${countryName}'s 1% Treaty pressure campaign`,
    } satisfies Omit<TreatyExecutionDraft, 'channel'>;
  }

  if (input.kind === 'secure-endorsement') {
    return {
      body: [
        `Research one credible ${countryName}-relevant organization or expert who can publicly back this signer task.`,
        `Open with the accountability page (${taskUrl}), summarize the delay cost (${dailyLoss} per day), and ask for a public endorsement or quote.`,
      ].join(' '),
      references: [taskUrl],
      subject: `Endorsement outreach for ${countryName}'s 1% Treaty signature`,
    } satisfies Omit<TreatyExecutionDraft, 'channel'>;
  }

  return {
    body: [
      `Research and attach new public evidence for "${input.task.title}".`,
      `Prioritize office acknowledgments, public statements, legislation, or implementation steps.`,
      `Canonical task page: ${taskUrl}`,
    ].join(' '),
    references: [taskUrl],
    subject: `Evidence tracking brief for ${input.task.title}`,
  } satisfies Omit<TreatyExecutionDraft, 'channel'>;
}

export function selectNextTreatyAction(input: {
  capabilities: TreatyOperatorCapabilities;
  executions?: TreatyOperatorExecutionRecord[];
  now?: Date;
  policy?: Partial<TreatyOperatorPolicy>;
  tasks: TreatyOperatorTask[];
}) {
  const now = input.now ?? new Date();
  const blockedTasks: TreatyOperatorDecision['blockedTasks'] = [];
  const shortlistedTasks: TreatyOperatorDecision['shortlistedTasks'] = [];
  const policy = {
    ...DEFAULT_POLICY,
    ...input.policy,
  };

  for (const task of input.tasks) {
    const evaluation = getTreatyTaskBlockers({
      capabilities: input.capabilities,
      executions: input.executions,
      now,
      policy,
      task,
    });

    if (evaluation.blockers.length > 0) {
      blockedTasks.push({
        blockers: evaluation.blockers,
        kind: evaluation.kind,
        taskId: task.id,
        taskKey: task.taskKey ?? null,
        title: task.title,
      });
      continue;
    }

    const score = scoreTreatyTaskForExecution({
      capabilities: input.capabilities,
      now,
      task,
    });
    const whyNow = [
      `Action kind: ${evaluation.kind}.`,
      `Delay cost/day: ${formatUsd(task.impact?.delayEconomicValueUsdLostPerDay)}.`,
      `Estimated effort: ${task.estimatedEffortHours === null || task.estimatedEffortHours === undefined ? 'unknown' : `${task.estimatedEffortHours}h`}.`,
    ];
    const guardrails = [
      input.capabilities.mode === 'auto'
        ? 'Live execution allowed, but daily and cooldown limits still apply.'
        : 'Draft-only execution until a human approves the outbound step.',
      evaluation.kind === 'contact-office'
        ? `Respect the office-outreach cooldown of ${policy.officeContactCooldownHours} hours.`
        : 'Do not mass-message targets; keep the action personalized and source-backed.',
    ];
    const selectedChannel: TreatyExecutionChannel = evaluation.channel ?? 'manual-review';

    shortlistedTasks.push({
      channel: selectedChannel,
      guardrails,
      kind: evaluation.kind,
      score,
      taskId: task.id,
      taskKey: task.taskKey ?? null,
      title: task.title,
      whyNow,
    });
  }

  shortlistedTasks.sort((left, right) => right.score - left.score);
  const top = shortlistedTasks[0] ?? null;
  const selectedTask = top === null ? null : input.tasks.find((task) => task.id === top.taskId) ?? null;
  const selectedPlan =
    top === null || selectedTask === null
      ? null
      : {
          channel: top.channel,
          draft: {
            ...buildDraft({
              channel: top.channel,
              kind: top.kind,
              now,
              policy,
              task: selectedTask,
            }),
            channel: top.channel,
          },
          estimatedEffortHours: selectedTask.estimatedEffortHours ?? null,
          guardrails: top.guardrails,
          kind: top.kind,
          mode: input.capabilities.requiresHumanReview ? 'human-review' : input.capabilities.mode,
          score: top.score,
          taskId: top.taskId,
          taskKey: top.taskKey,
          title: top.title,
          whyNow: top.whyNow,
        };

  return {
    blockedTasks,
    evaluatedAt: now.toISOString(),
    selectedPlan,
    shortlistedTasks,
    summary:
      selectedPlan === null
        ? `No treaty tasks are currently safe to execute. ${blockedTasks.length} task${blockedTasks.length === 1 ? '' : 's'} were blocked.`
        : `Next treaty action: ${selectedPlan.title} via ${selectedPlan.channel}.`,
  } satisfies TreatyOperatorDecision;
}

export const DEFAULT_TREATY_OPERATOR_POLICY = DEFAULT_POLICY;
