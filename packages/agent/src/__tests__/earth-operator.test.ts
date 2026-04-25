import { describe, expect, it, vi } from 'vitest';
import {
  createGenericTaskPlanner,
  createTreatyTaskPlanner,
  planNextEarthOperatorStep,
  selectEarthTaskPlanner,
  type EarthOperatorRuntimeAdapters,
  type EarthOperatorAgentProfile,
  type EarthOperatorTask,
} from '../earth-operator.js';

const baseAgent: EarthOperatorAgentProfile = {
  agentId: 'earth_agent',
  channels: ['email', 'research', 'manual-review'],
  interestTags: ['health', 'governance'],
  mode: 'dry-run',
  skillTags: ['research', 'policy'],
};

function createAdapters(
  task: EarthOperatorTask,
  overrides: Partial<EarthOperatorRuntimeAdapters> = {},
): EarthOperatorRuntimeAdapters {
  return {
    acquireLease: vi.fn(async () => ({
      acquired: true,
      leaseExpiresAt: '2026-04-10T12:15:00.000Z',
      leaseId: 'lease_earth',
    })),
    getNextTask: vi.fn(async () => task),
    logAgentRun: vi.fn(async () => undefined),
    releaseLease: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('selectEarthTaskPlanner', () => {
  it('selects the treaty planner for treaty tasks', () => {
    const task: EarthOperatorTask = {
      id: 'task_treaty',
      status: 'ACTIVE',
      taskKey: 'program:one-percent-treaty:signer:us:support:contact-office',
      title: 'Contact the US office',
    };

    const planner = selectEarthTaskPlanner({
      planners: [createTreatyTaskPlanner(), createGenericTaskPlanner()],
      task,
    });

    expect(planner?.id).toBe('treaty');
  });

  it('respects the planner allowlist', () => {
    const task: EarthOperatorTask = {
      id: 'task_treaty',
      status: 'ACTIVE',
      taskKey: 'program:one-percent-treaty:signer:us:support:contact-office',
      title: 'Contact the US office',
    };

    const planner = selectEarthTaskPlanner({
      allowedPlannerIds: ['generic-manual-review'],
      planners: [createTreatyTaskPlanner(), createGenericTaskPlanner()],
      task,
    });

    expect(planner?.id).toBe('generic-manual-review');
  });
});

describe('planNextEarthOperatorStep', () => {
  it('routes treaty tasks through the treaty planner', async () => {
    const task: EarthOperatorTask = {
      contactUrl: 'https://www.whitehouse.gov/contact/',
      countryCode: 'US',
      countryName: 'United States',
      estimatedEffortHours: 0.25,
      id: 'task_treaty',
      impact: {
        delayDalysLostPerDay: 10000,
        delayEconomicValueUsdLostPerDay: 500000000,
        expectedValuePerHourDalys: 2500,
        expectedValuePerHourUsd: 120000000,
      },
      skillTags: ['policy'],
      status: 'ACTIVE',
      taskKey: 'program:one-percent-treaty:signer:us:support:contact-office',
      title: 'Contact the President of the United States about the 1% Treaty',
    };
    const adapters = createAdapters(task, {
      checkTaskCommunicationCooldown: vi.fn(async () => ({ allowed: true })),
    });

    const result = await planNextEarthOperatorStep({
      adapters,
      agent: baseAgent,
    });

    expect(result.status).toBe('planned');
    if (result.status !== 'planned') {
      throw new Error('expected a planned result');
    }
    expect(result.plan.plannerId).toBe('treaty');
    expect(result.plan.channel).toBe('email');
    expect(result.plan.taskKind).toBe('contact-office');
  });

  it('falls back to a generic manual-review plan for non-treaty tasks', async () => {
    const task: EarthOperatorTask = {
      description: 'Write the implementation brief and identify the first blocker to remove.',
      estimatedEffortHours: 2,
      id: 'task_generic',
      impact: {
        delayEconomicValueUsdLostPerDay: 2500000,
        expectedValuePerHourUsd: 450000,
      },
      sourceUrls: ['https://optimitron.com/docs/system'],
      status: 'ACTIVE',
      title: 'Draft the deployment plan for the compute scheduler',
    };
    const adapters = createAdapters(task);

    const result = await planNextEarthOperatorStep({
      adapters,
      agent: {
        ...baseAgent,
        allowedPlannerIds: ['generic-manual-review'],
      },
    });

    expect(result.status).toBe('planned');
    if (result.status !== 'planned') {
      throw new Error('expected a planned result');
    }
    expect(result.plan.plannerId).toBe('generic-manual-review');
    expect(result.plan.channel).toBe('manual-review');
    expect(result.plan.draft?.references).toContain('https://optimitron.com/docs/system');
  });

  it('skips when no registered planner is allowed for the task', async () => {
    const task: EarthOperatorTask = {
      id: 'task_generic',
      status: 'ACTIVE',
      title: 'Unroutable task',
    };
    const adapters = createAdapters(task);

    const result = await planNextEarthOperatorStep({
      adapters,
      agent: {
        ...baseAgent,
        allowedPlannerIds: ['nonexistent-planner'],
      },
      planners: [createTreatyTaskPlanner()],
    });

    expect(result.status).toBe('skipped');
    if (result.status !== 'skipped') {
      throw new Error('expected a skipped result');
    }
    expect(result.reason).toContain('No registered planner supports');
  });

  it('uses the action-aware path for procurement planning', async () => {
    const task: EarthOperatorTask = {
      estimatedEffortHours: 2,
      id: 'task_paid_growth',
      impact: {
        delayEconomicValueUsdLostPerDay: 150000000,
        expectedValuePerHourUsd: 8000000,
      },
      status: 'ACTIVE',
      taskKey: 'system:optimize-earth:weaponize-overdue-task-list',
      title: 'Turn the overdue leader task list into a memetic share-and-pressure machine',
    };
    const adapters = createAdapters(task, {
      getNextAction: vi.fn(async () => ({
        actionKind: 'PREPARE_PROCUREMENT',
        audit: {
          aggregateDelayEconomicValueUsdPerDay: 1,
          aggregateExpectedValuePerHourUsd: 1,
          dominantFamily: 'growth-conversion',
          dominantFamilyShare: 0.34,
          familyCounts: {
            'contact-discovery': 1,
            'growth-conversion': 1,
            other: 0,
            'system-improvement': 1,
            'treaty-signer': 0,
            'treaty-support-contact': 0,
            'treaty-support-endorsement': 0,
            'treaty-support-evidence': 0,
            'treaty-support-explainer': 0,
          },
          impactCoverageRatio: 1,
          issues: [],
          systemImprovementPriority: 'normal',
          taskCount: 3,
          treatySignerCount: 0,
        },
        autoExecutable: false,
        economics: {
          autoExecutable: false,
          availableBudgetUsd: 0,
          capabilityFit: 0.6,
          delayEconomicValueUsdLostPerDay: 150000000,
          estimatedExternalCostUsd: 2000,
          estimatedNetValueUsd: 7998000,
          executionV1: {
            allowedExecutionModes: ['PREPARE_PROCUREMENT', 'FUNDING_UNBLOCKER'],
            canAgentDoDirectly: false,
            counterpartyHints: ['growth-operator'],
            estimatedExternalCostUsd: 2000,
            fundingGapUsd: 0,
            groundingRefs: ['https://optimitron.earth/tasks'],
            lawfulSpendTypes: ['ADS'],
            maxRationalSpendUsd: 5000000,
            procurementPriority: 'HIGH',
          },
          expectedEconomicValueUsd: 16000000,
          expectedValuePerHourUsd: 8000000,
          fundingGapUsd: 0,
          lawfulSpendTypes: ['ADS'],
          maxRationalSpendUsd: 5000000,
          options: [],
          requiredApproval: true,
          suggestedActionKind: 'PREPARE_PROCUREMENT',
        },
        groundingRefs: ['https://optimitron.earth/tasks'],
        queueRepairPlan: null,
        rationale: ['Highest-value paid leaf task in the current queue.'],
        requiredApproval: true,
        task,
      })),
      getQueueAudit: vi.fn(async () => ({ ok: true })),
    });

    const result = await planNextEarthOperatorStep({
      adapters,
      agent: baseAgent,
    });

    expect(result.status).toBe('planned');
    if (result.status !== 'planned') {
      throw new Error('expected a planned result');
    }
    expect(result.plan.plannerId).toBe('earth-action');
    expect(result.plan.channel).toBe('procurement');
    expect(result.plan.summary).toContain('Prepare procurement');
    expect(adapters.getQueueAudit).toHaveBeenCalled();
    expect(adapters.getNextAction).toHaveBeenCalled();
  });

  it('returns idle when the action-aware path says the queue needs repair but no concrete task exists yet', async () => {
    const task: EarthOperatorTask = {
      id: 'unused_task',
      status: 'ACTIVE',
      title: 'Unused',
    };
    const adapters = createAdapters(task, {
      getNextAction: vi.fn(async () => ({
        actionKind: 'QUEUE_REPAIR',
        audit: {
          aggregateDelayEconomicValueUsdPerDay: 1,
          aggregateExpectedValuePerHourUsd: 1,
          dominantFamily: 'treaty-support-explainer',
          dominantFamilyShare: 1,
          familyCounts: {
            'contact-discovery': 0,
            'growth-conversion': 0,
            other: 0,
            'system-improvement': 0,
            'treaty-signer': 0,
            'treaty-support-contact': 0,
            'treaty-support-endorsement': 0,
            'treaty-support-evidence': 0,
            'treaty-support-explainer': 2,
          },
          impactCoverageRatio: 0,
          issues: [],
          systemImprovementPriority: 'critical',
          taskCount: 2,
          treatySignerCount: 0,
        },
        autoExecutable: false,
        economics: null,
        groundingRefs: [],
        queueRepairPlan: {
          candidateTaskKeys: ['system:optimize-earth:improve-queue'],
          summary: 'Queue needs repair before trusting the frontier.',
        },
        rationale: ['Queue is broken.'],
        requiredApproval: false,
        task: null,
      })),
    });

    const result = await planNextEarthOperatorStep({
      adapters,
      agent: baseAgent,
    });

    expect(result.status).toBe('idle');
    expect(result.summary).toContain('Queue needs repair');
  });
});
