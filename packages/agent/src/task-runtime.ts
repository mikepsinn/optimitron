/**
 * Generic task-operator runtime.
 *
 * Domain-specific selection and drafting logic belongs in injected planners
 * such as the treaty operator, not in this runtime.
 */
export interface RuntimePlan {
  channel?: string | null;
  summary: string;
}

export interface TaskLeaseAcquireResult {
  acquired: boolean;
  leaseExpiresAt?: string | null;
  leaseId?: string | null;
  reason?: string | null;
}

export interface TaskActionCooldownResult {
  allowed: boolean;
  cooldownSecondsRemaining?: number | null;
  reason?: string | null;
}

export interface RuntimeTask {
  id: string;
  title: string;
}

export interface TaskOperatorRuntimeAdapters<TTask extends RuntimeTask> {
  acquireLease(input: {
    agentId: string;
    taskId: string;
    ttlSeconds: number;
  }): Promise<TaskLeaseAcquireResult>;
  checkTaskCommunicationCooldown?(input: {
    channel: string;
    taskId: string;
  }): Promise<TaskActionCooldownResult>;
  getNextTask(input: {
    agentId: string;
    availableHoursPerWeek?: number | null;
    interestTags: string[];
    maxTaskDifficulty?: string | null;
    skillTags: string[];
  }): Promise<TTask | null>;
  heartbeatLease?(input: {
    leaseId: string;
    ttlSeconds: number;
  }): Promise<{ leaseExpiresAt?: string | null }>;
  logAgentRun?(input: {
    apiCalls: number;
    costUsd: number;
    outputSummary: string;
    provider: string;
    status: 'planned' | 'skipped';
    taskId?: string | null;
  }): Promise<void>;
  releaseLease(input: {
    leaseId: string;
    note?: string | null;
    outcome?: 'released' | 'skipped' | 'planned';
  }): Promise<void>;
}

export interface TaskRuntimeAgentProfile {
  agentId: string;
  availableHoursPerWeek?: number | null;
  interestTags: string[];
  leaseTtlSeconds?: number | null;
  maxTaskDifficulty?: string | null;
  mode?: string | null;
  providerLabel?: string | null;
  skillTags: string[];
}

export interface TaskPlannerInput<TTask extends RuntimeTask> {
  agent: TaskRuntimeAgentProfile;
  now: Date;
  task: TTask;
}

export interface TaskPlannerResult<TPlan extends RuntimePlan> {
  plan: TPlan | null;
  summary: string;
}

export interface TaskRuntimePlanResult<TTask extends RuntimeTask, TPlan extends RuntimePlan> {
  leaseId: string;
  leaseExpiresAt?: string | null;
  plan: TPlan;
  status: 'planned';
  summary: string;
  task: TTask;
}

export interface TaskRuntimeIdleResult {
  status: 'idle';
  summary: string;
}

export interface TaskRuntimeSkippedResult<TTask extends RuntimeTask> {
  leaseId?: string | null;
  reason: string;
  status: 'skipped';
  summary: string;
  task?: TTask;
}

export type TaskRuntimeResult<TTask extends RuntimeTask, TPlan extends RuntimePlan> =
  | TaskRuntimePlanResult<TTask, TPlan>
  | TaskRuntimeIdleResult
  | TaskRuntimeSkippedResult<TTask>;

export async function planNextTaskOperatorStep<TTask extends RuntimeTask, TPlan extends RuntimePlan>(input: {
  adapters: TaskOperatorRuntimeAdapters<TTask>;
  agent: TaskRuntimeAgentProfile;
  now?: Date;
  planner: (input: TaskPlannerInput<TTask>) => TaskPlannerResult<TPlan>;
}): Promise<TaskRuntimeResult<TTask, TPlan>> {
  const now = input.now ?? new Date();
  const nextTask = await input.adapters.getNextTask({
    agentId: input.agent.agentId,
    availableHoursPerWeek: input.agent.availableHoursPerWeek ?? null,
    interestTags: input.agent.interestTags,
    maxTaskDifficulty: input.agent.maxTaskDifficulty ?? null,
    skillTags: input.agent.skillTags,
  });

  if (nextTask === null) {
    return {
      status: 'idle',
      summary: 'No executable task is currently available.',
    };
  }

  const leaseResult = await input.adapters.acquireLease({
    agentId: input.agent.agentId,
    taskId: nextTask.id,
    ttlSeconds: input.agent.leaseTtlSeconds ?? 15 * 60,
  });

  if (!leaseResult.acquired || !leaseResult.leaseId) {
    const reason = leaseResult.reason?.trim() ?? 'Task could not be leased.';
    return {
      reason,
      status: 'skipped',
      summary: `Skipped ${nextTask.title}: ${reason}`,
      task: nextTask,
    };
  }

  const decision = input.planner({
    agent: input.agent,
    now,
    task: nextTask,
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
      taskId: nextTask.id,
    });

    return {
      leaseId: leaseResult.leaseId,
      reason: decision.summary,
      status: 'skipped',
      summary: decision.summary,
      task: nextTask,
    };
  }

  if (
    (decision.plan.channel === 'contact-form' || decision.plan.channel === 'email') &&
    input.adapters.checkTaskCommunicationCooldown
  ) {
    const cooldown = await input.adapters.checkTaskCommunicationCooldown({
      channel: decision.plan.channel,
      taskId: nextTask.id,
    });

    if (!cooldown.allowed) {
      const reason =
        cooldown.reason?.trim() ??
        `Task communication cooldown is active for ${decision.plan.channel}.`;

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
        taskId: nextTask.id,
      });

      return {
        leaseId: leaseResult.leaseId,
        reason,
        status: 'skipped',
        summary: `Skipped ${nextTask.title}: ${reason}`,
        task: nextTask,
      };
    }
  }

  await input.adapters.logAgentRun?.({
    apiCalls: 0,
    costUsd: 0,
    outputSummary: decision.summary,
    provider: input.agent.providerLabel ?? 'task-operator',
    status: 'planned',
    taskId: nextTask.id,
  });

  return {
    leaseExpiresAt: leaseResult.leaseExpiresAt ?? null,
    leaseId: leaseResult.leaseId,
    plan: decision.plan,
    status: 'planned',
    summary: decision.summary,
    task: nextTask,
  };
}
