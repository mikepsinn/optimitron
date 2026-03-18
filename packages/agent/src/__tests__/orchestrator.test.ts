import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { createAgentManifest } from '../manifest.js';
import { runAgent } from '../orchestrator.js';
import { AgentRunLogSchema } from '../types.js';

function createReasonerQueue(responses: unknown[]) {
  const generateObject = vi.fn(async ({
    parse,
  }: {
    parse: (value: unknown) => unknown;
  }) => parse(responses.shift()));

  return {
    reasoner: {
      generateObject,
    },
    generateObject,
  };
}

const baseTarget = {
  itemId: 'preventive-care',
  itemName: 'Preventive Care',
  preferredPct: 0.28,
  actualPct: 0.11,
  gapPct: 0.17,
  gapUsd: 45000000000,
  availableDataSources: ['oecd', 'world-bank'],
  tractabilityScore: 0.92,
  rationale: 'Large gap with strong public datasets.',
};

const baseArtifact = {
  target: baseTarget,
  policyId: 'us-federal-preventive-care-2026',
  policyName: 'Preventive Care Reallocation',
  recommendation: 'enact' as const,
  policyDescription: 'Increase preventive care funding.',
  evidenceGrade: 'A' as const,
  welfareScore: 91.2,
  policyImpactScore: 0.88,
  causalConfidenceScore: 0.84,
  citizenPreferenceWeight: 0.28,
  governmentAllocationPct: 0.11,
  preferenceGapPct: 0.17,
  participantCount: 412,
  sourceUrls: ['https://example.com/report'],
  rawMetrics: {
    pis: 0.88,
    ccs: 0.84,
  },
  qualityChecks: {
    sufficientData: true,
    predictorDataPoints: 84,
    outcomeDataPoints: 84,
    alignedPairs: 73,
    evidenceSources: 4,
    notes: [],
  },
};

describe('orchestrator', () => {
  it('runs the full agent loop and publishes receipts', async () => {
    const queue = createReasonerQueue([
      {
        selectedTargets: [baseTarget],
        rationale: 'Strong tractability.',
        discardedItemIds: [],
      },
      {
        plannedTargets: [baseTarget],
        rationale: 'Run the highest-confidence target first.',
        executionNotes: ['Verify data coverage before publish.'],
      },
      {
        summary: 'Preventive care is underfunded relative to citizen priorities.',
        confidenceAssessment: 'Confidence is moderate to high.',
        caveats: ['Outcome coverage is stronger in OECD data.'],
        additionalDataNeeded: ['More subnational panel coverage.'],
      },
      {
        verdict: 'proceed',
        rationale: 'Quality checks passed.',
      },
    ]);
    const execute = vi.fn().mockResolvedValue(baseArtifact);
    const publishPolicy = vi.fn().mockResolvedValue({
      refs: {
        activity: {
          uri: 'at://did:plc:optimitron/org.hypercerts.claim.activity/1',
          cid: 'cid-activity',
        },
        attachments: [],
        evaluation: {
          uri: 'at://did:plc:optimitron/org.hypercerts.context.evaluation/1',
          cid: 'cid-evaluation',
        },
        measurements: [],
      },
    });
    const storeAggregation = vi.fn().mockResolvedValue({
      cid: 'bafyaggregation',
    });
    const storePolicyAnalysis = vi.fn().mockResolvedValue({
      cid: 'bafypolicy',
    });
    const recordReputation = vi.fn().mockResolvedValue({
      txHash:
        '0x1111111111111111111111111111111111111111111111111111111111111111',
    });
    const currentTime = new Date('2026-03-11T12:00:00.000Z');

    const log = await runAgent({
      manifest: createAgentManifest(),
      reasoner: queue.reasoner,
      now: () => currentTime,
      runInput: {
        runId: 'run-1',
        jurisdictionId: 'us-federal',
        jurisdictionName: 'United States',
        startedAt: currentTime.toISOString(),
        availableDataSources: ['oecd', 'world-bank'],
        preferenceGaps: [
          {
            itemId: 'preventive-care',
            itemName: 'Preventive Care',
            preferredPct: 0.28,
            actualPct: 0.11,
            gapPct: 0.17,
          },
        ],
        wishocracySnapshot: {
          jurisdictionId: 'us-federal',
          participantCount: 412,
          consistencyRatio: 0.08,
          preferenceWeights: [
            {
              itemId: 'preventive-care',
              weight: 0.28,
              rank: 1,
            },
          ],
        },
      },
      adapters: {
        analysis: {
          execute,
        },
        hypercerts: {
          publishPolicy,
        },
        storage: {
          storeAggregation,
          storePolicyAnalysis,
        },
        registries: {
          recordReputation,
        },
      },
    });

    expect(log.status).toBe('completed');
    expect(log.outputs.activityUris).toEqual([
      'at://did:plc:optimitron/org.hypercerts.claim.activity/1',
    ]);
    expect(log.outputs.storageCids).toEqual([
      'bafyaggregation',
      'bafypolicy',
    ]);
    expect(log.outputs.reputationTxHashes).toEqual([
      '0x1111111111111111111111111111111111111111111111111111111111111111',
    ]);
    expect(publishPolicy).toHaveBeenCalledTimes(1);
    expect(storeAggregation).toHaveBeenCalledTimes(1);
    expect(storePolicyAnalysis).toHaveBeenCalledTimes(1);
    expect(recordReputation).toHaveBeenCalledWith({
      score: 0.84,
      target: baseTarget,
    });
    expect(publishPolicy.mock.calls[0]?.[0]).toMatchObject({
      policyId: 'us-federal-preventive-care-2026',
      policyName: 'Preventive Care Reallocation',
      recommendation: 'enact',
      analysisSummary:
        'Preventive care is underfunded relative to citizen priorities.',
      contributorDid:
        'did:pkh:eip155:11155111:0x0000000000000000000000000000000000000000',
      evaluatorDid: 'did:plc:wishocracy-aggregate',
    });
    expect(log.targetExecutions[0]?.publishReceipt).toMatchObject({
      activityUri:
        'at://did:plc:optimitron/org.hypercerts.claim.activity/1',
      policyStorageCid: 'bafypolicy',
      aggregationStorageCid: 'bafyaggregation',
    });
    expect(queue.generateObject).toHaveBeenCalledTimes(4);
  });

  it('aborts publication when quality checks fail even if the verifier says proceed', async () => {
    const queue = createReasonerQueue([
      {
        selectedTargets: [baseTarget],
        rationale: 'Strong tractability.',
        discardedItemIds: [],
      },
      {
        plannedTargets: [baseTarget],
        rationale: 'Run the highest-confidence target first.',
        executionNotes: [],
      },
      {
        summary: 'This target looks weak.',
        confidenceAssessment: 'Confidence is low.',
        caveats: ['Coverage is sparse.'],
        additionalDataNeeded: ['More aligned pairs.'],
      },
      {
        verdict: 'proceed',
        rationale: 'Proceed.',
      },
    ]);
    const publishPolicy = vi.fn();

    const log = await runAgent({
      manifest: createAgentManifest(),
      reasoner: queue.reasoner,
      now: () => new Date('2026-03-11T12:00:00.000Z'),
      runInput: {
        jurisdictionId: 'us-federal',
        preferenceGaps: [
          {
            itemId: 'preventive-care',
            itemName: 'Preventive Care',
            preferredPct: 0.28,
            actualPct: 0.11,
            gapPct: 0.17,
          },
        ],
        availableDataSources: ['oecd', 'world-bank'],
      },
      adapters: {
        analysis: {
          execute: vi.fn().mockResolvedValue({
            ...baseArtifact,
            qualityChecks: {
              ...baseArtifact.qualityChecks,
              sufficientData: false,
            },
          }),
        },
        hypercerts: {
          publishPolicy,
        },
      },
    });

    expect(log.status).toBe('partial');
    expect(log.targetExecutions[0]?.status).toBe('aborted');
    expect(log.targetExecutions[0]?.verification).toEqual({
      verdict: 'abort',
      rationale: 'Insufficient data for autonomous analysis',
    });
    expect(publishPolicy).not.toHaveBeenCalled();
  });

  it('retries once when the verifier requests another attempt and then succeeds', async () => {
    const queue = createReasonerQueue([
      {
        selectedTargets: [baseTarget],
        rationale: 'Strong tractability.',
        discardedItemIds: [],
      },
      {
        plannedTargets: [baseTarget],
        rationale: 'Run the highest-confidence target first.',
        executionNotes: [],
      },
      {
        summary: 'First pass is inconclusive.',
        confidenceAssessment: 'Confidence is low.',
        caveats: ['One data source lagged.'],
        additionalDataNeeded: ['Retry with refreshed inputs.'],
      },
      {
        verdict: 'retry',
        rationale: 'One retry is justified.',
        retryReason: 'Refresh inputs and rerun the analysis.',
      },
      {
        summary: 'Second pass supports publication.',
        confidenceAssessment: 'Confidence is moderate to high.',
        caveats: ['Subnational coverage remains thinner than OECD coverage.'],
        additionalDataNeeded: [],
      },
      {
        verdict: 'proceed',
        rationale: 'The rerun passed.',
      },
    ]);
    const execute = vi
      .fn()
      .mockResolvedValueOnce({
        ...baseArtifact,
        policyName: 'Preventive Care Reallocation Draft',
      })
      .mockResolvedValueOnce(baseArtifact);
    const publishPolicy = vi.fn().mockResolvedValue({
      refs: {
        activity: {
          uri: 'at://did:plc:optimitron/org.hypercerts.claim.activity/2',
          cid: 'cid-activity-2',
        },
        attachments: [],
        evaluation: {
          uri: 'at://did:plc:optimitron/org.hypercerts.context.evaluation/2',
          cid: 'cid-evaluation-2',
        },
        measurements: [],
      },
    });

    const log = await runAgent({
      manifest: createAgentManifest(),
      reasoner: queue.reasoner,
      now: () => new Date('2026-03-11T12:00:00.000Z'),
      runInput: {
        jurisdictionId: 'us-federal',
        preferenceGaps: [
          {
            itemId: 'preventive-care',
            itemName: 'Preventive Care',
            preferredPct: 0.28,
            actualPct: 0.11,
            gapPct: 0.17,
          },
        ],
        availableDataSources: ['oecd', 'world-bank'],
      },
      adapters: {
        analysis: {
          execute,
        },
        hypercerts: {
          publishPolicy,
        },
      },
    });

    expect(execute).toHaveBeenCalledTimes(2);
    expect(publishPolicy).toHaveBeenCalledTimes(1);
    expect(log.targetExecutions[0]?.attemptCount).toBe(2);
    expect(log.targetExecutions[0]?.status).toBe('completed');
    expect(log.targetExecutions[0]?.verification).toEqual({
      verdict: 'proceed',
      rationale: 'The rerun passed.',
    });
    expect(queue.generateObject).toHaveBeenCalledTimes(6);
  });

  it('fails fast when the API call cap is exceeded during planning', async () => {
    const queue = createReasonerQueue([
      {
        selectedTargets: [baseTarget],
        rationale: 'Strong tractability.',
        discardedItemIds: [],
      },
    ]);

    await expect(
      runAgent({
        manifest: createAgentManifest({
          computeConstraints: {
            maxAnalysesPerRun: 10,
            maxAPICallsPerRun: 1,
            timeoutSeconds: 300,
          },
        }),
        reasoner: queue.reasoner,
        now: () => new Date('2026-03-11T12:00:00.000Z'),
        runInput: {
          jurisdictionId: 'us-federal',
          preferenceGaps: [
            {
              itemId: 'preventive-care',
              itemName: 'Preventive Care',
              preferredPct: 0.28,
              actualPct: 0.11,
              gapPct: 0.17,
            },
          ],
          availableDataSources: ['oecd', 'world-bank'],
        },
        adapters: {
          analysis: {
            execute: vi.fn(),
          },
          hypercerts: {
            publishPolicy: vi.fn(),
          },
        },
      }),
    ).rejects.toThrow('API call limit exceeded');

    expect(queue.generateObject).toHaveBeenCalledTimes(1);
  });

  it('fails before discovery when the runtime budget is already exhausted', async () => {
    const queue = createReasonerQueue([]);

    await expect(
      runAgent({
        manifest: createAgentManifest({
          computeConstraints: {
            maxAnalysesPerRun: 10,
            maxAPICallsPerRun: 100,
            timeoutSeconds: 1,
          },
        }),
        reasoner: queue.reasoner,
        now: () => new Date('2026-03-11T12:00:02.000Z'),
        runInput: {
          jurisdictionId: 'us-federal',
          startedAt: '2026-03-11T12:00:00.000Z',
          preferenceGaps: [
            {
              itemId: 'preventive-care',
              itemName: 'Preventive Care',
              preferredPct: 0.28,
              actualPct: 0.11,
              gapPct: 0.17,
            },
          ],
          availableDataSources: ['oecd', 'world-bank'],
        },
        adapters: {
          analysis: {
            execute: vi.fn(),
          },
          hypercerts: {
            publishPolicy: vi.fn(),
          },
        },
      }),
    ).rejects.toThrow('Runtime limit exceeded');

    expect(queue.generateObject).not.toHaveBeenCalled();
  });

  it('validates the checked-in sample agent log fixture', async () => {
    const raw = await readFile(
      new URL('../../agent_log.json', import.meta.url),
      'utf8',
    );

    expect(AgentRunLogSchema.parse(JSON.parse(raw)).runId).toBe(
      'sample-run-2026-03-11',
    );
  });
});
