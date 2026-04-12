import {
  planNextTaskOperatorStep,
  type RuntimePlan,
  type RuntimeTask,
  type TaskOperatorRuntimeAdapters,
  type TaskPlannerInput,
  type TaskPlannerResult,
  type TaskRuntimeAgentProfile,
  type TaskRuntimeResult,
} from './task-runtime.js';
import type {
  EarthNextActionDecision,
} from './earth-action.js';
import {
  selectNextTreatyAction,
  type TreatyExecutionMode,
  type TreatyOperatorExecutionRecord,
  type TreatyOperatorPolicy,
  type TreatyOperatorTask,
} from './treaty-operator.js';

export interface EarthOperatorImpact {
  delayDalysLostPerDay?: number | null;
  delayEconomicValueUsdLostPerDay?: number | null;
  expectedValuePerHourDalys?: number | null;
  expectedValuePerHourUsd?: number | null;
}

export interface EarthOperatorTask extends RuntimeTask {
  activeClaimCount?: number | null;
  blockedByTaskIds?: string[];
  category?: string | null;
  claimPolicy?: string | null;
  contactTemplate?: string | null;
  contactUrl?: string | null;
  contextJson?: Record<string, unknown> | null;
  countryCode?: string | null;
  countryName?: string | null;
  description?: string | null;
  difficulty?: string | null;
  dueAt?: Date | string | null;
  estimatedEffortHours?: number | null;
  impact?: EarthOperatorImpact | null;
  interestTags?: string[];
  maxClaims?: number | null;
  programKey?: string | null;
  roleTitle?: string | null;
  skillTags?: string[];
  sourceUrls?: string[];
  status?: string | null;
  taskKey?: string | null;
}

export interface EarthExecutionDraft {
  body: string;
  references: string[];
  subject: string;
}

export interface EarthExecutionPlan extends RuntimePlan {
  draft?: EarthExecutionDraft | null;
  estimatedEffortHours?: number | null;
  guardrails: string[];
  mode: TreatyExecutionMode | 'manual-review';
  plannerId: string;
  taskKind: string;
  whyNow: string[];
}

export interface EarthOperatorAgentProfile extends TaskRuntimeAgentProfile {
  allowedCountryCodes?: string[];
  allowedPlannerIds?: string[];
  channels: string[];
  executions?: TreatyOperatorExecutionRecord[];
  maxDailyLiveActions?: number | null;
  mode?: TreatyExecutionMode | 'manual-review' | null;
  requiresHumanReview?: boolean;
}

export interface EarthTaskPlanner {
  id: string;
  matches(task: EarthOperatorTask): boolean;
  plan(input: {
    agent: EarthOperatorAgentProfile;
    now: Date;
    task: EarthOperatorTask;
  }): TaskPlannerResult<EarthExecutionPlan>;
}

export interface PlanNextEarthOperatorStepInput {
  adapters: EarthOperatorRuntimeAdapters;
  agent: EarthOperatorAgentProfile;
  now?: Date;
  planners?: EarthTaskPlanner[];
  treatyPolicy?: Partial<TreatyOperatorPolicy>;
}

export interface EarthOperatorRuntimeAdapters
  extends TaskOperatorRuntimeAdapters<EarthOperatorTask> {
  getNextAction?(input: {
    agentId: string;
    availableHoursPerWeek?: number | null;
    interestTags: string[];
    maxTaskDifficulty?: string | null;
    skillTags: string[];
  }): Promise<EarthNextActionDecision>;
  getQueueAudit?(): Promise<unknown>;
  recordTaskActuals?(input: {
    actualCashCostUsd?: number | null;
    actualEffortSeconds?: number | null;
    note?: string | null;
    taskId: string;
  }): Promise<void>;
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

function normalizeMode(mode: EarthOperatorAgentProfile['mode']): TreatyExecutionMode {
  if (mode === 'auto' || mode === 'human-review') {
    return mode;
  }

  return 'dry-run';
}

function isTreatyTask(task: EarthOperatorTask) {
  const taskKey = task.taskKey ?? '';
  const programKey = task.programKey ?? '';

  return (
    taskKey.includes('one-percent-treaty') ||
    programKey.includes('one-percent-treaty') ||
    typeof task.contextJson?.['treatySignerSlot'] === 'object'
  );
}

function buildGenericDraft(task: EarthOperatorTask) {
  const references = [...(task.sourceUrls ?? []), task.contactUrl ?? ''].filter(Boolean);

  return {
    body: [
      `Task: ${task.title}.`,
      task.description?.trim() ?? 'Summarize the objective, blockers, and concrete next action.',
      `Expected value per hour: ${formatUsd(task.impact?.expectedValuePerHourUsd)}.`,
      `Delay cost per day: ${formatUsd(task.impact?.delayEconomicValueUsdLostPerDay)}.`,
    ].join(' '),
    references,
    subject: `Execution brief: ${task.title}`,
  } satisfies EarthExecutionDraft;
}

function buildActionMode(input: {
  action: EarthNextActionDecision;
  agent: EarthOperatorAgentProfile;
}): TreatyExecutionMode | 'manual-review' {
  if (input.agent.requiresHumanReview) {
    return 'human-review';
  }

  if (input.action.autoExecutable && input.agent.mode === 'auto') {
    return 'auto';
  }

  if (input.agent.mode === 'human-review') {
    return 'human-review';
  }

  return 'manual-review';
}

function buildActionPlan(input: {
  action: EarthNextActionDecision;
  agent: EarthOperatorAgentProfile;
  task: EarthOperatorTask;
}): EarthExecutionPlan {
  const economics = input.action.economics;
  const references = Array.from(
    new Set([...(input.action.groundingRefs), ...(input.task.sourceUrls ?? [])].filter(Boolean)),
  );

  if (input.action.actionKind === 'PREPARE_PROCUREMENT') {
    return {
      channel: 'procurement',
      draft: {
        body: [
          `Prepare procurement for ${input.task.title}.`,
          `Estimated external cost: ${formatUsd(economics?.estimatedExternalCostUsd)}.`,
          `Max rational spend: ${formatUsd(economics?.maxRationalSpendUsd)}.`,
          `Allowed spend types: ${(economics?.lawfulSpendTypes ?? []).join(', ') || 'none specified'}.`,
        ].join(' '),
        references,
        subject: `Procurement brief: ${input.task.title}`,
      },
      estimatedEffortHours: input.task.estimatedEffortHours ?? null,
      guardrails: [
        'Do not authorize spend above configured caps or outside allowlisted spend types.',
        'Verify the counterparty and deliverable before any real purchase.',
      ],
      mode: buildActionMode(input),
      plannerId: 'earth-action',
      summary: `Prepare procurement for ${input.task.title}`,
      taskKind: 'procurement',
      whyNow: input.action.rationale,
    };
  }

  if (input.action.actionKind === 'FUNDING_UNBLOCKER') {
    return {
      channel: 'funding',
      draft: {
        body: [
          `This task is worth doing but is currently budget-blocked: ${input.task.title}.`,
          `Estimated external cost: ${formatUsd(economics?.estimatedExternalCostUsd)}.`,
          `Funding gap: ${formatUsd(economics?.fundingGapUsd)}.`,
          `Max rational spend: ${formatUsd(economics?.maxRationalSpendUsd)}.`,
        ].join(' '),
        references,
        subject: `Funding brief: ${input.task.title}`,
      },
      estimatedEffortHours: input.task.estimatedEffortHours ?? null,
      guardrails: [
        'Do not pretend the task is executable until the funding gap is closed.',
        'Keep the ask tied to quantified downstream value and concrete execution.',
      ],
      mode: 'human-review',
      plannerId: 'earth-action',
      summary: `Raise or allocate funding for ${input.task.title}`,
      taskKind: 'funding-unblocker',
      whyNow: input.action.rationale,
    };
  }

  if (input.action.actionKind === 'QUEUE_REPAIR') {
    return {
      channel: 'queue-repair',
      draft: {
        body: [
          `Repair the queue via ${input.task.title}.`,
          ...input.action.rationale,
        ].join(' '),
        references,
        subject: `Queue repair: ${input.task.title}`,
      },
      estimatedEffortHours: input.task.estimatedEffortHours ?? null,
      guardrails: [
        'Fix the queue using grounded sources and concrete pages, not generic strategy prose.',
        'Keep new tasks in DRAFT until they pass review and promotion.',
      ],
      mode: 'manual-review',
      plannerId: 'earth-action',
      summary: input.task.title,
      taskKind: 'queue-repair',
      whyNow: input.action.rationale,
    };
  }

  return {
    channel: 'manual-review',
    draft: buildGenericDraft(input.task),
    estimatedEffortHours: input.task.estimatedEffortHours ?? null,
    guardrails: [
      'Review the task manually because no program-specific action plan was produced.',
    ],
    mode: buildActionMode(input),
    plannerId: 'earth-action',
    summary: input.task.title,
    taskKind: 'manual-review',
    whyNow: input.action.rationale,
  };
}

export function createTreatyTaskPlanner(input?: {
  policy?: Partial<TreatyOperatorPolicy>;
}): EarthTaskPlanner {
  return {
    id: 'treaty',
    matches(task) {
      return isTreatyTask(task);
    },
    plan({ agent, now, task }) {
      const decision = selectNextTreatyAction({
        capabilities: {
          allowedCountryCodes: agent.allowedCountryCodes,
          channels: agent.channels as never[],
          maxDailyLiveActions: agent.maxDailyLiveActions ?? null,
          maxTaskDifficulty: agent.maxTaskDifficulty ?? null,
          mode: normalizeMode(agent.mode),
          requiresHumanReview: agent.requiresHumanReview,
          skillTags: agent.skillTags,
        },
        executions: agent.executions ?? [],
        now,
        policy: input?.policy,
        tasks: [task as TreatyOperatorTask],
      });

      if (decision.selectedPlan === null) {
        return {
          plan: null,
          summary: decision.summary,
        };
      }

      return {
        plan: {
          channel: decision.selectedPlan.channel,
          draft: decision.selectedPlan.draft,
          estimatedEffortHours: decision.selectedPlan.estimatedEffortHours,
          guardrails: decision.selectedPlan.guardrails,
          mode: decision.selectedPlan.mode,
          plannerId: 'treaty',
          summary: decision.selectedPlan.title,
          taskKind: decision.selectedPlan.kind,
          whyNow: decision.selectedPlan.whyNow,
        },
        summary: decision.summary,
      };
    },
  };
}

export function createGenericTaskPlanner(): EarthTaskPlanner {
  return {
    id: 'generic-manual-review',
    matches() {
      return true;
    },
    plan({ agent, task }) {
      const guardrails = [
        'Do not execute irreversible actions without human review or a program-specific planner.',
        'Cite sources before sending outreach or publishing claims.',
      ];
      const whyNow = [
        `Expected value per hour: ${formatUsd(task.impact?.expectedValuePerHourUsd)}.`,
        `Delay cost per day: ${formatUsd(task.impact?.delayEconomicValueUsdLostPerDay)}.`,
      ];

      return {
        plan: {
          channel: 'manual-review',
          draft: buildGenericDraft(task),
          estimatedEffortHours: task.estimatedEffortHours ?? null,
          guardrails,
          mode: agent.requiresHumanReview ? 'human-review' : 'manual-review',
          plannerId: 'generic-manual-review',
          summary: task.title,
          taskKind: task.category ?? 'generic',
          whyNow,
        },
        summary: `Prepared a generic execution brief for ${task.title}.`,
      };
    },
  };
}

export function getDefaultEarthTaskPlanners(input?: {
  treatyPolicy?: Partial<TreatyOperatorPolicy>;
}) {
  return [createTreatyTaskPlanner({ policy: input?.treatyPolicy }), createGenericTaskPlanner()];
}

export function selectEarthTaskPlanner(input: {
  allowedPlannerIds?: string[];
  planners: EarthTaskPlanner[];
  task: EarthOperatorTask;
}) {
  const allowlist = input.allowedPlannerIds?.length
    ? new Set(input.allowedPlannerIds.map((plannerId) => plannerId.trim()).filter(Boolean))
    : null;

  return (
    input.planners.find((planner) => {
      if (allowlist !== null && !allowlist.has(planner.id)) {
        return false;
      }

      return planner.matches(input.task);
    }) ?? null
  );
}

export async function planNextEarthOperatorStep(
  input: PlanNextEarthOperatorStepInput,
): Promise<TaskRuntimeResult<EarthOperatorTask, EarthExecutionPlan>> {
  const planners = input.planners ?? getDefaultEarthTaskPlanners({ treatyPolicy: input.treatyPolicy });

  if (input.adapters.getNextAction) {
    const now = input.now ?? new Date();
    await input.adapters.getQueueAudit?.();

    const action = await input.adapters.getNextAction({
      agentId: input.agent.agentId,
      availableHoursPerWeek: input.agent.availableHoursPerWeek ?? null,
      interestTags: input.agent.interestTags,
      maxTaskDifficulty: input.agent.maxTaskDifficulty ?? null,
      skillTags: input.agent.skillTags,
    });

    if (action.task === null) {
      return {
        status: 'idle',
        summary:
          action.queueRepairPlan?.summary ??
          action.rationale[0] ??
          'No executable action is currently available.',
      };
    }

    const leaseResult = await input.adapters.acquireLease({
      agentId: input.agent.agentId,
      taskId: action.task.id,
      ttlSeconds: input.agent.leaseTtlSeconds ?? 15 * 60,
    });

    if (!leaseResult.acquired || !leaseResult.leaseId) {
      const reason = leaseResult.reason?.trim() ?? 'Task could not be leased.';
      return {
        reason,
        status: 'skipped',
        summary: `Skipped ${action.task.title}: ${reason}`,
        task: action.task,
      };
    }

    if (
      action.actionKind === 'PREPARE_PROCUREMENT' ||
      action.actionKind === 'FUNDING_UNBLOCKER' ||
      action.actionKind === 'QUEUE_REPAIR'
    ) {
      const plan = buildActionPlan({
        action,
        agent: input.agent,
        task: action.task,
      });

      await input.adapters.logAgentRun?.({
        apiCalls: 0,
        costUsd: 0,
        outputSummary: plan.summary,
        provider: input.agent.providerLabel ?? 'task-operator',
        status: 'planned',
        taskId: action.task.id,
      });

      return {
        leaseExpiresAt: leaseResult.leaseExpiresAt ?? null,
        leaseId: leaseResult.leaseId,
        plan,
        status: 'planned',
        summary: plan.summary,
        task: action.task,
      };
    }

    const planner = selectEarthTaskPlanner({
      allowedPlannerIds: input.agent.allowedPlannerIds,
      planners,
      task: action.task,
    });

    if (planner === null) {
      await input.adapters.releaseLease({
        leaseId: leaseResult.leaseId,
        note: `No registered planner supports ${action.task.title}.`,
        outcome: 'skipped',
      });

      return {
        leaseId: leaseResult.leaseId,
        reason: `No registered planner supports ${action.task.title}.`,
        status: 'skipped',
        summary: `No registered planner supports ${action.task.title}.`,
        task: action.task,
      };
    }

    const decision = planner.plan({
      agent: input.agent,
      now,
      task: action.task,
    });

    if (decision.plan === null) {
      await input.adapters.releaseLease({
        leaseId: leaseResult.leaseId,
        note: decision.summary,
        outcome: 'skipped',
      });

      await input.adapters.logAgentRun?.({
        apiCalls: 0,
        costUsd: 0,
        outputSummary: decision.summary,
        provider: input.agent.providerLabel ?? 'task-operator',
        status: 'skipped',
        taskId: action.task.id,
      });

      return {
        leaseId: leaseResult.leaseId,
        reason: decision.summary,
        status: 'skipped',
        summary: decision.summary,
        task: action.task,
      };
    }

    if (
      (decision.plan.channel === 'contact-form' || decision.plan.channel === 'email') &&
      input.adapters.checkContactCooldown
    ) {
      const cooldown = await input.adapters.checkContactCooldown({
        channel: decision.plan.channel,
        taskId: action.task.id,
      });

      if (!cooldown.allowed) {
        const reason =
          cooldown.reason?.trim() ?? `Contact cooldown is active for ${decision.plan.channel}.`;

        await input.adapters.releaseLease({
          leaseId: leaseResult.leaseId,
          note: reason,
          outcome: 'skipped',
        });

        await input.adapters.logAgentRun?.({
          apiCalls: 0,
          costUsd: 0,
          outputSummary: reason,
          provider: input.agent.providerLabel ?? 'task-operator',
          status: 'skipped',
          taskId: action.task.id,
        });

        return {
          leaseId: leaseResult.leaseId,
          reason,
          status: 'skipped',
          summary: `Skipped ${action.task.title}: ${reason}`,
          task: action.task,
        };
      }
    }

    await input.adapters.logAgentRun?.({
      apiCalls: 0,
      costUsd: 0,
      outputSummary: decision.summary,
      provider: input.agent.providerLabel ?? 'task-operator',
      status: 'planned',
      taskId: action.task.id,
    });

    return {
      leaseExpiresAt: leaseResult.leaseExpiresAt ?? null,
      leaseId: leaseResult.leaseId,
      plan: decision.plan,
      status: 'planned',
      summary: decision.summary,
      task: action.task,
    };
  }

  return planNextTaskOperatorStep<EarthOperatorTask, EarthExecutionPlan>({
    adapters: input.adapters,
    agent: input.agent,
    now: input.now,
    planner: ({ now, task }: TaskPlannerInput<EarthOperatorTask>) => {
      const planner = selectEarthTaskPlanner({
        allowedPlannerIds: input.agent.allowedPlannerIds,
        planners,
        task,
      });

      if (planner === null) {
        return {
          plan: null,
          summary: `No registered planner supports ${task.title}.`,
        };
      }

      return planner.plan({
        agent: input.agent,
        now,
        task,
      });
    },
  });
}
