import { describe, expect, it, vi } from 'vitest';
import {
  planNextTaskOperatorStep,
  type RuntimePlan,
  type RuntimeTask,
  type TaskOperatorRuntimeAdapters,
  type TaskRuntimeAgentProfile,
} from '../task-runtime.js';

interface TestTask extends RuntimeTask {}

interface TestPlan extends RuntimePlan {
  checklist?: string[];
}

const agent: TaskRuntimeAgentProfile = {
  agentId: 'agent_runtime',
  interestTags: ['policy'],
  skillTags: ['research'],
};

const task: TestTask = {
  id: 'task_1',
  title: 'Draft a concrete next action',
};

function createAdapters(
  overrides: Partial<TaskOperatorRuntimeAdapters<TestTask>> = {},
): TaskOperatorRuntimeAdapters<TestTask> {
  return {
    acquireLease: vi.fn(async () => ({
      acquired: true,
      leaseExpiresAt: '2026-04-10T12:15:00.000Z',
      leaseId: 'lease_1',
    })),
    getNextTask: vi.fn(async () => task),
    logAgentRun: vi.fn(async () => undefined),
    releaseLease: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('planNextTaskOperatorStep', () => {
  it('returns idle when no executable task is available', async () => {
    const adapters = createAdapters({
      getNextTask: vi.fn(async () => null),
    });

    const result = await planNextTaskOperatorStep<TestTask, TestPlan>({
      adapters,
      agent,
      planner: () => ({
        plan: null,
        summary: 'No plan',
      }),
    });

    expect(result.status).toBe('idle');
    expect(result.summary).toContain('No executable task');
    expect(adapters.acquireLease).not.toHaveBeenCalled();
  });

  it('skips when the task cannot be leased', async () => {
    const adapters = createAdapters({
      acquireLease: vi.fn(async () => ({
        acquired: false,
        reason: 'Already leased',
      })),
    });
    const planner = vi.fn(() => ({
      plan: null,
      summary: 'Should not run',
    }));

    const result = await planNextTaskOperatorStep<TestTask, TestPlan>({
      adapters,
      agent,
      planner,
    });

    expect(result.status).toBe('skipped');
    expect(result.reason).toBe('Already leased');
    expect(planner).not.toHaveBeenCalled();
  });

  it('releases the lease when the planner declines the task', async () => {
    const adapters = createAdapters();

    const result = await planNextTaskOperatorStep<TestTask, TestPlan>({
      adapters,
      agent,
      planner: () => ({
        plan: null,
        summary: 'Missing required context',
      }),
    });

    expect(result.status).toBe('skipped');
    expect(result.reason).toBe('Missing required context');
    expect(adapters.releaseLease).toHaveBeenCalledWith({
      leaseId: 'lease_1',
      note: 'Missing required context',
      outcome: 'skipped',
    });
    expect(adapters.logAgentRun).toHaveBeenCalledWith({
      apiCalls: 0,
      costUsd: 0,
      outputSummary: 'Missing required context',
      provider: 'task-operator',
      status: 'skipped',
      taskId: task.id,
    });
  });

  it('releases the lease when a task communication cooldown blocks the plan', async () => {
    const adapters = createAdapters({
      checkTaskCommunicationCooldown: vi.fn(async () => ({
        allowed: false,
        reason: 'Recent task communication already logged',
      })),
    });

    const result = await planNextTaskOperatorStep<TestTask, TestPlan>({
      adapters,
      agent,
      planner: () => ({
        plan: {
          channel: 'email',
          checklist: ['Draft the email'],
          summary: 'Send one personalized email',
        },
        summary: 'Prepared an outreach draft',
      }),
    });

    expect(result.status).toBe('skipped');
    expect(result.reason).toBe('Recent task communication already logged');
    expect(adapters.checkTaskCommunicationCooldown).toHaveBeenCalledWith({
      channel: 'email',
      taskId: task.id,
    });
    expect(adapters.releaseLease).toHaveBeenCalledWith({
      leaseId: 'lease_1',
      note: 'Recent task communication already logged',
      outcome: 'skipped',
    });
  });

  it('returns a planned result for a valid executable plan', async () => {
    const adapters = createAdapters({
      checkTaskCommunicationCooldown: vi.fn(async () => ({
        allowed: true,
      })),
    });

    const result = await planNextTaskOperatorStep<TestTask, TestPlan>({
      adapters,
      agent: {
        ...agent,
        providerLabel: 'dry-run-agent',
      },
      planner: () => ({
        plan: {
          channel: 'email',
          checklist: ['Draft email', 'Attach sources'],
          summary: 'Send a personalized evidence-backed email',
        },
        summary: 'Prepared the next dry-run outreach step',
      }),
    });

    expect(result.status).toBe('planned');
    expect(result.plan.channel).toBe('email');
    expect(result.task.id).toBe(task.id);
    expect(adapters.releaseLease).not.toHaveBeenCalled();
    expect(adapters.logAgentRun).toHaveBeenCalledWith({
      apiCalls: 0,
      costUsd: 0,
      outputSummary: 'Prepared the next dry-run outreach step',
      provider: 'dry-run-agent',
      status: 'planned',
      taskId: task.id,
    });
  });
});
