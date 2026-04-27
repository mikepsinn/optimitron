import { describe, expect, it } from 'vitest';
import {
  buildNotionExpectedValueImpactFrame,
  earthOptimizationPointsFromUsd,
  evaluateActionOption,
  notionExpectedValuePerHourUsd,
  notionOptimizationRateUsdPerHour,
  rankActionOptions,
  selectOptimalNextAction,
  type OptimalActionTask,
} from '../optimal-next-action.js';

const actor = {
  availableHoursPerWeek: 10,
  interestTags: ['systems', 'funding', 'research'],
  kind: 'USER' as const,
  maxTaskDifficulty: 'ADVANCED',
  skillTags: ['typescript', 'research', 'writing'],
};

function task(overrides: Partial<OptimalActionTask> = {}): OptimalActionTask {
  return {
    activeChildTaskCount: 0,
    blockerStatuses: [],
    difficulty: 'INTERMEDIATE',
    estimatedEffortHours: 2,
    id: 'task_default',
    interestTags: ['systems'],
    selectedImpactFrame: {
      estimatedEffortHoursBase: 2,
      expectedEconomicValueUsdBase: 10_000,
      expectedEconomicValueUsdHigh: 11_000,
      expectedEconomicValueUsdLow: 9_000,
      successProbabilityBase: 0.8,
    },
    skillTags: ['typescript'],
    status: 'ACTIVE',
    title: 'Default task',
    ...overrides,
  };
}

describe('buildNotionExpectedValueImpactFrame', () => {
  it('stores Notion-style P * Value as already probability-weighted expected value', () => {
    const frame = buildNotionExpectedValueImpactFrame({
      hours: 4,
      probability: 0.25,
      valueUsd: 80_000,
    });

    expect(frame.expectedEconomicValueUsdBase).toBe(20_000);
    expect(frame.estimatedEffortHoursBase).toBe(4);
    expect(
      notionExpectedValuePerHourUsd({
        hours: 4,
        probability: 0.25,
        valueUsd: 80_000,
      }),
    ).toBe(5_000);
    expect(
      evaluateActionOption({
        actionKind: 'EXECUTE_DIRECT',
        actor,
        task: task({
          selectedImpactFrame: frame,
        }),
      }).expectedMarginalUtilityUsd,
    ).toBe(20_000);
  });
});

describe('Notion EV baseline helpers', () => {
  it('computes the dependency-boosted Optimization Rate from anonymized Notion-style inputs', () => {
    expect(
      notionOptimizationRateUsdPerHour({
        downstreamValueUsd: 100_000,
        hours: 10,
        probability: 0.6,
        valueUsd: 25_000,
      }),
    ).toBe(2_700);
  });

  it('matches the engine fallback dependency value for a generalized prerequisite task', () => {
    const downstream = task({
      id: 'generalized_downstream',
      selectedImpactFrame: {
        estimatedEffortHoursBase: 20,
        expectedEconomicValueUsdBase: 100_000,
        expectedEconomicValueUsdHigh: 100_000,
        expectedEconomicValueUsdLow: 100_000,
      },
      title: 'Generalized downstream task',
    });
    const prerequisite = task({
      estimatedEffortHours: 10,
      id: 'generalized_prerequisite',
      outgoingEdges: [{ toTask: downstream }],
      selectedImpactFrame: buildNotionExpectedValueImpactFrame({
        hours: 10,
        probability: 0.6,
        valueUsd: 25_000,
      }),
      title: 'Generalized prerequisite task',
    });

    const option = evaluateActionOption({
      actionKind: 'EXECUTE_DIRECT',
      actor,
      policy: { dependencyFallbackShare: 0.2 },
      task: prerequisite,
    });

    expect(option.expectedMarginalUtilityUsd).toBe(27_000);
    expect(option.expectedMarginalUtilityUsd / option.scarceResourceHours).toBe(2_700);
    expect(option.assumptions.join(' ')).toContain('fallback downstream share 0.2');
  });

  it('does not let a high Optimization Rate bypass readiness constraints', () => {
    const blocked = task({
      blockerStatuses: ['ACTIVE'],
      id: 'blocked_high_rate',
      selectedImpactFrame: buildNotionExpectedValueImpactFrame({
        hours: 1,
        probability: 1,
        valueUsd: 1_000_000,
      }),
      title: 'Blocked high-rate task',
    });
    const ready = task({
      id: 'ready_lower_rate',
      selectedImpactFrame: buildNotionExpectedValueImpactFrame({
        hours: 1,
        probability: 1,
        valueUsd: 20_000,
      }),
      title: 'Ready lower-rate task',
    });

    expect(
      notionOptimizationRateUsdPerHour({
        hours: 1,
        probability: 1,
        valueUsd: 1_000_000,
      }),
    ).toBeGreaterThan(
      notionOptimizationRateUsdPerHour({
        hours: 1,
        probability: 1,
        valueUsd: 20_000,
      }),
    );

    const decision = selectOptimalNextAction({
      actor,
      tasks: [blocked, ready],
    });

    expect(decision.action?.task?.id).toBe('ready_lower_rate');
    expect(decision.action?.actionKind).toBe('EXECUTE_DIRECT');
  });
});

describe('treaty onboarding ranking scenarios', () => {
  const newUserActor = {
    availableHoursPerWeek: 3,
    interestTags: ['treaty', 'health', 'sharing', 'website'],
    kind: 'USER' as const,
    maxTaskDifficulty: 'INTERMEDIATE',
    skillTags: ['outreach', 'social', 'website', 'writing', 'design'],
  };

  it('ranks generalized treaty growth actions above a low-value Notion-style merch task', () => {
    const inviteContacts = task({
      estimatedEffortHours: 1,
      id: 'invite_contacts',
      interestTags: ['treaty', 'sharing'],
      selectedImpactFrame: buildNotionExpectedValueImpactFrame({
        hours: 1,
        probability: 0.35,
        valueUsd: 400_000,
      }),
      skillTags: ['outreach', 'writing'],
      title: 'Invite high-trust contacts to vote on the treaty',
    });
    const shareSocial = task({
      estimatedEffortHours: 0.25,
      id: 'share_social',
      interestTags: ['treaty', 'sharing'],
      selectedImpactFrame: buildNotionExpectedValueImpactFrame({
        hours: 0.25,
        probability: 0.25,
        valueUsd: 80_000,
      }),
      skillTags: ['social', 'writing'],
      title: 'Share the treaty on social media',
    });
    const embedWebsite = task({
      estimatedEffortHours: 1.5,
      id: 'embed_website',
      interestTags: ['treaty', 'website'],
      selectedImpactFrame: buildNotionExpectedValueImpactFrame({
        hours: 1.5,
        probability: 0.4,
        valueUsd: 350_000,
      }),
      skillTags: ['website', 'outreach'],
      title: 'Embed the treaty survey on a website',
    });
    const lowValueMerch = task({
      estimatedEffortHours: 8,
      id: 'low_value_merch',
      interestTags: ['merch'],
      selectedImpactFrame: buildNotionExpectedValueImpactFrame({
        hours: 8,
        probability: 0.5,
        valueUsd: 300,
      }),
      skillTags: ['design'],
      title: 'Run a low-value merchandise experiment',
    });

    const directOptions = rankActionOptions({
      actor: newUserActor,
      policy: { directExecutionFitThreshold: 0 },
      tasks: [lowValueMerch, inviteContacts, shareSocial, embedWebsite],
    }).filter((option) => option.actionKind === 'EXECUTE_DIRECT');

    expect(new Set(directOptions.slice(0, 3).map((option) => option.task?.id))).toEqual(
      new Set(['share_social', 'invite_contacts', 'embed_website']),
    );
    expect(directOptions.at(-1)?.task?.id).toBe('low_value_merch');
    expect(notionExpectedValuePerHourUsd({ hours: 8, probability: 0.5, valueUsd: 300 })).toBe(18.75);
  });

  it('can still recommend estimate repair over treaty growth when estimates are missing', () => {
    const underSpecifiedTreatyTask = task({
      estimatedEffortHours: 1,
      id: 'under_specified_treaty_task',
      interestTags: ['treaty', 'sharing'],
      selectedImpactFrame: null,
      skillTags: ['outreach'],
      title: 'Ask followers to vote on the treaty',
    });
    const lowValueReadyTask = task({
      estimatedEffortHours: 1,
      id: 'low_value_ready_task',
      selectedImpactFrame: buildNotionExpectedValueImpactFrame({
        hours: 1,
        probability: 0.5,
        valueUsd: 100,
      }),
      title: 'Tidy a low-value admin note',
    });

    const decision = selectOptimalNextAction({
      actor: newUserActor,
      policy: { missingEstimatePenaltyUsd: 1_000 },
      tasks: [underSpecifiedTreatyTask, lowValueReadyTask],
    });

    expect(['DECOMPOSE', 'QUEUE_REPAIR']).toContain(decision.action?.actionKind);
    expect(decision.action?.assumptions.join(' ')).toContain('lacks a usable expected value');
  });
});

describe('rankActionOptions', () => {
  it('does not allow a blocked task to win direct execution', () => {
    const blocked = task({
      blockerStatuses: ['ACTIVE'],
      id: 'blocked',
      selectedImpactFrame: {
        estimatedEffortHoursBase: 1,
        expectedEconomicValueUsdBase: 5_000_000,
        expectedEconomicValueUsdHigh: 5_000_000,
        expectedEconomicValueUsdLow: 5_000_000,
      },
      title: 'Huge blocked task',
    });
    const ready = task({
      id: 'ready',
      selectedImpactFrame: {
        estimatedEffortHoursBase: 1,
        expectedEconomicValueUsdBase: 20_000,
        expectedEconomicValueUsdHigh: 20_000,
        expectedEconomicValueUsdLow: 20_000,
      },
      title: 'Ready modest task',
    });

    const decision = selectOptimalNextAction({
      actor,
      tasks: [blocked, ready],
    });

    expect(decision.action?.task?.id).toBe('ready');
    expect(decision.action?.actionKind).toBe('EXECUTE_DIRECT');
  });

  it('splits fallback downstream credit across shared blockers', () => {
    const downstream = task({
      id: 'downstream',
      selectedImpactFrame: {
        estimatedEffortHoursBase: 10,
        expectedEconomicValueUsdBase: 100_000,
        expectedEconomicValueUsdHigh: 100_000,
        expectedEconomicValueUsdLow: 100_000,
      },
      title: 'Shared downstream task',
    });
    const blockerA = task({
      id: 'blocker_a',
      outgoingEdges: [{ toTask: downstream }],
      selectedImpactFrame: {
        estimatedEffortHoursBase: 1,
        expectedEconomicValueUsdBase: 0,
        expectedEconomicValueUsdHigh: 0,
        expectedEconomicValueUsdLow: 0,
        successProbabilityBase: 1,
      },
      title: 'Prerequisite A',
    });
    const blockerB = task({
      id: 'blocker_b',
      outgoingEdges: [{ toTask: downstream }],
      selectedImpactFrame: {
        estimatedEffortHoursBase: 1,
        expectedEconomicValueUsdBase: 0,
        expectedEconomicValueUsdHigh: 0,
        expectedEconomicValueUsdLow: 0,
        successProbabilityBase: 1,
      },
      title: 'Prerequisite B',
    });

    const ranked = rankActionOptions({
      actor,
      policy: { dependencyFallbackShare: 0.2 },
      tasks: [blockerA, blockerB],
    }).filter((option) => option.actionKind === 'EXECUTE_DIRECT');

    expect(ranked[0]?.expectedMarginalUtilityUsd).toBe(10_000);
    expect(ranked[1]?.expectedMarginalUtilityUsd).toBe(10_000);
    expect(ranked[0]?.assumptions.join(' ')).toContain('split across 2 blocker');
  });

  it('prefers lower-risk value over a fragile high-mean estimate when penalty dominates', () => {
    const fragile = task({
      id: 'fragile',
      selectedImpactFrame: {
        estimatedEffortHoursBase: 1,
        expectedEconomicValueUsdBase: 100_000,
        expectedEconomicValueUsdHigh: 500_000,
        expectedEconomicValueUsdLow: 0,
      },
      title: 'Fragile moonshot',
    });
    const robust = task({
      id: 'robust',
      selectedImpactFrame: {
        estimatedEffortHoursBase: 1,
        expectedEconomicValueUsdBase: 45_000,
        expectedEconomicValueUsdHigh: 48_000,
        expectedEconomicValueUsdLow: 42_000,
      },
      title: 'Robust work',
    });

    const decision = selectOptimalNextAction({
      actor,
      policy: { uncertaintyPenaltyWeight: 0.9, valueOfInformationWeight: 0 },
      tasks: [fragile, robust],
    });

    expect(decision.action?.task?.id).toBe('robust');
  });

  it('can select de-risking when value of information is larger than execution under uncertainty', () => {
    const uncertain = task({
      id: 'uncertain',
      selectedImpactFrame: {
        estimatedEffortHoursBase: 40,
        expectedEconomicValueUsdBase: 1_000_000,
        expectedEconomicValueUsdHigh: 8_000_000,
        expectedEconomicValueUsdLow: 0,
      },
      title: 'Large uncertain program',
    });

    const decision = selectOptimalNextAction({
      actor,
      policy: {
        directExecutionFitThreshold: 0.95,
        valueOfInformationWeight: 0.25,
      },
      tasks: [uncertain],
    });

    expect(decision.action?.actionKind).toBe('DE_RISK');
    expect(decision.action?.valueOfInformationBonusUsd).toBeGreaterThan(0);
  });

  it('boosts revenue work only when platform runway is low', () => {
    const revenue = task({
      id: 'revenue',
      interestTags: ['funding'],
      selectedImpactFrame: {
        estimatedEffortHoursBase: 1,
        expectedEconomicValueUsdBase: 50_000,
        expectedEconomicValueUsdHigh: 55_000,
        expectedEconomicValueUsdLow: 45_000,
      },
      title: 'Submit urgent grant application',
    });
    const humanity = task({
      id: 'humanity',
      selectedImpactFrame: {
        estimatedEffortHoursBase: 1,
        expectedEconomicValueUsdBase: 55_000,
        expectedEconomicValueUsdHigh: 56_000,
        expectedEconomicValueUsdLow: 54_000,
      },
      title: 'Improve public task queue',
    });

    const lowRunway = selectOptimalNextAction({
      actor,
      policy: { platformRunwayDays: 5, platformRunwayTargetDays: 90 },
      tasks: [revenue, humanity],
    });
    const healthyRunway = selectOptimalNextAction({
      actor,
      policy: { platformRunwayDays: 180, platformRunwayTargetDays: 90 },
      tasks: [revenue, humanity],
    });

    expect(lowRunway.action?.task?.id).toBe('revenue');
    expect(healthyRunway.action?.task?.id).toBe('humanity');
  });

  it('can prefer outsourcing when the user is a poor direct fit but budget exists', () => {
    const specialized = task({
      contextJson: {
        executionV1: {
          estimatedExternalCostUsd: 500,
        },
      },
      id: 'specialized',
      difficulty: 'EXPERT',
      selectedImpactFrame: {
        estimatedEffortHoursBase: 12,
        expectedEconomicValueUsdBase: 250_000,
        expectedEconomicValueUsdHigh: 260_000,
        expectedEconomicValueUsdLow: 240_000,
      },
      skillTags: ['legal'],
      title: 'Draft specialized legal agreement',
    });

    const decision = selectOptimalNextAction({
      actor: {
        ...actor,
        maxTaskDifficulty: 'BEGINNER',
        skillTags: ['typescript'],
      },
      policy: { externalBudgetUsd: 1_000 },
      tasks: [specialized],
    });

    expect(decision.action?.actionKind).toBe('OUTSOURCE');
  });

  it('treats organizations as actors and token signals as capped incentives', () => {
    const orgActor = {
      availableHoursPerWeek: 40,
      interestTags: ['clinical-trials'],
      kind: 'ORGANIZATION' as const,
      maxTaskDifficulty: 'EXPERT',
      organizationId: 'org_1',
      organizationTags: ['clinical-trials', 'funding'],
      skillTags: ['operations'],
    };
    const orgTask = task({
      assigneeOrganization: {
        id: 'org_1',
        name: 'Clinical Trial Alliance',
        type: 'RESEARCH',
      },
      id: 'org_task',
      incentiveSignals: [
        {
          amount: 1_000,
          estimatedUsdValue: 25_000,
          kind: 'WISH_POINT',
        },
      ],
      interestTags: ['clinical-trials'],
      selectedImpactFrame: {
        estimatedEffortHoursBase: 2,
        expectedEconomicValueUsdBase: 100_000,
        expectedEconomicValueUsdHigh: 100_000,
        expectedEconomicValueUsdLow: 100_000,
      },
      skillTags: ['operations'],
      title: 'Coordinate organization trial launch',
    });

    const decision = selectOptimalNextAction({
      actor: orgActor,
      tasks: [orgTask],
    });

    expect(decision.action?.capabilityFit).toBeGreaterThan(0.75);
    expect(decision.action?.assumptions.join(' ')).toContain('Wish Points/tokens');
  });

  it('scales queue repair value with missing estimate count', () => {
    const missingA = task({
      id: 'missing_a',
      selectedImpactFrame: null,
      title: 'Missing estimate A',
    });
    const missingB = task({
      id: 'missing_b',
      selectedImpactFrame: null,
      title: 'Missing estimate B',
    });

    const repair = rankActionOptions({
      actor,
      policy: { missingEstimatePenaltyUsd: 750 },
      tasks: [missingA, missingB],
    }).find((option) => option.actionKind === 'QUEUE_REPAIR');

    expect(repair?.expectedMarginalUtilityUsd).toBe(1_500);
  });

  it('scores de-risking against a short action block instead of full execution effort', () => {
    const uncertain = task({
      estimatedEffortHours: 40,
      id: 'long_uncertain',
      selectedImpactFrame: {
        estimatedEffortHoursBase: 40,
        expectedEconomicValueUsdBase: 100_000,
        expectedEconomicValueUsdHigh: 1_000_000,
        expectedEconomicValueUsdLow: 0,
      },
      title: 'Long uncertain task',
    });

    const deRisk = evaluateActionOption({
      actionKind: 'DE_RISK',
      actor,
      task: uncertain,
    });

    expect(deRisk.scarceResourceHours).toBe(2);
    expect(deRisk.actionBlockMinutes).toBe(120);
  });

  it('does not generate kill options for healthy positive-value tasks', () => {
    const ranked = rankActionOptions({
      actor,
      tasks: [task({ id: 'healthy' })],
    });

    expect(ranked.some((option) => option.actionKind === 'KILL')).toBe(false);
  });
});

describe('earthOptimizationPointsFromUsd', () => {
  it('derives impact display points from USD-equivalent welfare', () => {
    expect(earthOptimizationPointsFromUsd(300_000)).toBe(2);
  });
});
