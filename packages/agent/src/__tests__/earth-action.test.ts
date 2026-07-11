import { describe, expect, it } from 'vitest';
import {
  evaluateEarthTaskEconomics,
  selectNextEarthAction,
  type EarthActionTask,
} from '../earth-action.js';

const agent = {
  availableHoursPerWeek: 10,
  interestTags: ['growth', 'governance', 'systems'],
  skillTags: ['typescript', 'growth', 'research', 'policy'],
} as const;

function makeTask(overrides: Partial<EarthActionTask> = {}): EarthActionTask {
  return {
    activeChildTaskCount: 0,
    category: 'TECHNICAL',
    estimatedEffortHours: 2,
    id: 'task_default',
    impact: {
      delayEconomicValueUsdLostPerDay: 1_000_000,
      expectedValuePerHourUsd: 250_000,
    },
    interestTags: ['systems'],
    skillTags: ['typescript'],
    status: 'ACTIVE',
    title: 'Default task',
    ...overrides,
  };
}

describe('selectNextEarthAction', () => {
  it('returns QUEUE_REPAIR when the active queue is a narrow treaty-only frontier', () => {
    const tasks: EarthActionTask[] = Array.from({ length: 20 }, (_, index) =>
      makeTask({
        category: 'COMMUNICATION',
        estimatedEffortHours: 1,
        id: `task_${index}`,
        impact: {
          delayEconomicValueUsdLostPerDay: 0,
          expectedValuePerHourUsd: 0,
        },
        taskKey: `program:one-percent-treaty:signer:test-${index}:support:publish-explainer`,
        title: `Publish country explainer ${index}`,
      }),
    );

    const decision = selectNextEarthAction({
      agent,
      tasks,
    });

    expect(decision.actionKind).toBe('QUEUE_REPAIR');
    expect(decision.task).toBeNull();
    expect(decision.queueRepairPlan?.candidateTaskKeys).toEqual(
      expect.arrayContaining([
        'system:optimize-earth:improve-queue',
        'system:optimize-earth:generate-growth-conversion-tasks',
      ]),
    );
  });

  it('prefers the highest-value executable leaf over a parent orchestration task', () => {
    const tasks: EarthActionTask[] = [
      makeTask({
        activeChildTaskCount: 2,
        category: 'TECHNICAL',
        id: 'parent_growth',
        impact: {
          delayEconomicValueUsdLostPerDay: 80_000_000,
          expectedValuePerHourUsd: 6_000_000,
        },
        taskKey: 'system:optimize-earth:generate-growth-conversion-tasks',
        title: 'Generate growth and conversion tasks for the website and distribution funnel',
      }),
      makeTask({
        category: 'COMMUNICATION',
        id: 'leaf_growth',
        impact: {
          delayEconomicValueUsdLostPerDay: 120_000_000,
          expectedValuePerHourUsd: 8_000_000,
        },
        interestTags: ['growth', 'distribution'],
        skillTags: ['growth', 'typescript'],
        taskKey: 'system:optimize-earth:weaponize-overdue-task-list',
        title: 'Turn the overdue leader task list into a memetic share-and-pressure machine',
      }),
      makeTask({
        category: 'RESEARCH',
        id: 'contact_discovery',
        impact: {
          delayEconomicValueUsdLostPerDay: 15_000_000,
          expectedValuePerHourUsd: 1_500_000,
        },
        interestTags: ['outreach'],
        skillTags: ['research'],
        taskKey: 'system:optimize-earth:discover-country-journalist-and-coalition-targets',
        title: 'Discover country-specific journalists and coalition targets from the actual treaty queue',
      }),
      makeTask({
        category: 'TECHNICAL',
        id: 'system_grounding',
        impact: {
          delayEconomicValueUsdLostPerDay: 20_000_000,
          expectedValuePerHourUsd: 2_000_000,
        },
        taskKey: 'system:optimize-earth:ground-task-generation-in-existing-pages-and-manual',
        title: 'Ground task generation in existing pages and the Wishonia/manual context',
      }),
    ];

    const decision = selectNextEarthAction({
      agent,
      tasks,
    });

    expect(decision.actionKind).toBe('EXECUTE_DIRECT');
    expect(decision.task?.id).toBe('leaf_growth');
  });

  it('turns a high-value paid task into a funding unblocker when budget is missing', () => {
    const tasks: EarthActionTask[] = [
      makeTask({
        category: 'COMMUNICATION',
        contextJson: {
          executionV1: {
            canAgentDoDirectly: false,
            estimatedExternalCostUsd: 2_500,
            lawfulSpendTypes: ['ADS'],
          },
        },
        id: 'paid_growth',
        impact: {
          delayEconomicValueUsdLostPerDay: 250_000_000,
          expectedValuePerHourUsd: 12_000_000,
        },
        interestTags: ['growth'],
        skillTags: ['growth'],
        taskKey: 'system:optimize-earth:weaponize-overdue-task-list',
        title: 'Turn the overdue leader task list into a memetic share-and-pressure machine',
      }),
      makeTask({
        category: 'RESEARCH',
        id: 'contact_discovery',
        impact: {
          delayEconomicValueUsdLostPerDay: 5_000_000,
          expectedValuePerHourUsd: 500_000,
        },
        taskKey: 'system:optimize-earth:discover-missing-signer-office-channels',
        title: 'Discover missing office contact channels for the full signer roster',
      }),
      makeTask({
        category: 'TECHNICAL',
        id: 'system_grounding',
        impact: {
          delayEconomicValueUsdLostPerDay: 7_000_000,
          expectedValuePerHourUsd: 700_000,
        },
        taskKey: 'system:optimize-earth:ground-task-generation-in-existing-pages-and-manual',
        title: 'Ground task generation in existing pages and the Wishonia/manual context',
      }),
    ];

    const decision = selectNextEarthAction({
      agent,
      policy: {
        availableExternalBudgetUsd: 0,
      },
      tasks,
    });

    expect(decision.actionKind).toBe('FUNDING_UNBLOCKER');
    expect(decision.task?.id).toBe('paid_growth');
    expect(decision.economics?.fundingGapUsd).toBe(2_500);
  });

  it('prefers a concrete funding follow-through task over the blocked parent when both exist', () => {
    const tasks: EarthActionTask[] = [
      makeTask({
        category: 'COMMUNICATION',
        contextJson: {
          executionV1: {
            canAgentDoDirectly: false,
            estimatedExternalCostUsd: 250,
            lawfulSpendTypes: ['ADS'],
          },
        },
        estimatedEffortHours: 3,
        id: 'paid_growth_parent',
        impact: {
          delayEconomicValueUsdLostPerDay: 95_000_000_000,
          expectedValuePerHourUsd: 46_000_000_000_000_000,
        },
        interestTags: ['growth'],
        skillTags: ['growth'],
        taskKey: 'system:optimize-earth:weaponize-overdue-task-list',
        title: 'Turn the overdue leader task list into a memetic share-and-pressure machine',
      }),
      makeTask({
        category: 'COMMUNICATION',
        estimatedEffortHours: 2,
        id: 'budget_brief_child',
        impact: {
          delayEconomicValueUsdLostPerDay: 42_000_000_000,
          expectedValuePerHourUsd: 21_000_000_000_000_000,
        },
        interestTags: ['growth', 'funding'],
        skillTags: ['growth', 'research'],
        taskKey:
          'system:optimize-earth:publish-budget-brief:system-optimize-earth-weaponize-overdue-task-list',
        title:
          'Publish the quantified budget brief for Turn the overdue leader task list into a memetic share-and-pressure machine',
      }),
    ];

    const decision = selectNextEarthAction({
      agent,
      policy: {
        availableExternalBudgetUsd: 0,
      },
      tasks,
    });

    expect(decision.task?.id).toBe('budget_brief_child');
    expect(decision.task?.taskKey).toContain('publish-budget-brief');
  });
});

describe('evaluateEarthTaskEconomics', () => {
  it('keeps internal follow-through tasks direct when no explicit cash cost is present', () => {
    const economics = evaluateEarthTaskEconomics({
      agent,
      task: makeTask({
        category: 'COMMUNICATION',
        estimatedEffortHours: 2,
        id: 'task_budget_brief',
        impact: {
          delayEconomicValueUsdLostPerDay: 42_000_000_000,
          expectedValuePerHourUsd: 21_000_000_000_000_000,
        },
        roleTitle: 'Funding Operator',
        taskKey:
          'system:optimize-earth:publish-budget-brief:system-optimize-earth-weaponize-overdue-task-list',
        title:
          'Publish the quantified budget brief for Turn the overdue leader task list into a memetic share-and-pressure machine',
      }),
    });

    expect(economics.estimatedExternalCostUsd).toBeNull();
    expect(economics.fundingGapUsd).toBe(0);
    expect(economics.suggestedActionKind).toBe('EXECUTE_DIRECT');
  });

  it('marks an allowed affordable paid task as auto-executable procurement', () => {
    const economics = evaluateEarthTaskEconomics({
      agent,
      policy: {
        allowlistedAutoSpendTypes: ['ADS'],
        availableExternalBudgetUsd: 1_000,
        dailyAutoSpendCapUsd: 1_000,
        perTaskAutoSpendCapUsd: 1_000,
      },
      task: makeTask({
        category: 'COMMUNICATION',
        contextJson: {
          executionV1: {
            canAgentDoDirectly: false,
            estimatedExternalCostUsd: 400,
            lawfulSpendTypes: ['ADS'],
          },
        },
        id: 'task_procurement',
        impact: {
          delayEconomicValueUsdLostPerDay: 40_000_000,
          expectedValuePerHourUsd: 4_000_000,
        },
        taskKey: 'system:optimize-earth:weaponize-overdue-task-list',
        title: 'Turn the overdue leader task list into a memetic share-and-pressure machine',
      }),
    });

    expect(economics.suggestedActionKind).toBe('PREPARE_PROCUREMENT');
    expect(economics.autoExecutable).toBe(true);
    expect(economics.requiredApproval).toBe(false);
  });
});
