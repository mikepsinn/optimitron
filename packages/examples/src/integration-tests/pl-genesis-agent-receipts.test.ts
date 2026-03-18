import { describe, expect, it } from 'vitest';
import { createAgentManifest, runAgent } from '@optimitron/agent';
import {
  ACTIVITY_COLLECTION,
  ATTACHMENT_COLLECTION,
  EVALUATION_COLLECTION,
  MEASUREMENT_COLLECTION,
  createPolicyHypercertDraft,
  publishPolicyHypercertDraft,
  type HypercertRecord,
} from '@optimitron/hypercerts';
import {
  getLatest,
  storeLinkedAggregation,
  storeLinkedPolicyAnalysis,
  verifyHistoryChain,
  type CreateOptimitronPolicyAnalysisInput,
  type CreateWishocracyAggregationInput,
} from '@optimitron/storage';

function createReasonerQueue(responses: unknown[]) {
  return {
    async generateObject<T>({
      parse,
    }: {
      parse: (value: unknown) => T;
    }): Promise<T> {
      const next = responses.shift();
      if (next === undefined) {
        throw new Error('No queued reasoning response');
      }
      return parse(next);
    },
  };
}

function createInMemoryStoracha() {
  const uploads: string[] = [];
  const payloads = new Map<string, unknown>();

  const client = {
    async uploadFile(file: Blob): Promise<string> {
      const cid = `bafytest${String(uploads.length + 1).padStart(4, '0')}`;
      payloads.set(cid, JSON.parse(await file.text()) as unknown);
      uploads.push(cid);
      return cid;
    },
    capability: {
      upload: {
        async list(
          options: { cursor?: string; size?: number } = {},
        ): Promise<{ cursor?: string; results: Array<{ root: { toString(): string } }> }> {
          const start = options.cursor ? Number(options.cursor) : 0;
          const size = options.size ?? uploads.length;
          const slice = uploads.slice(start, start + size);
          const nextCursor =
            start + size < uploads.length ? String(start + size) : undefined;

          return {
            cursor: nextCursor,
            results: slice.map((cid) => ({
              root: {
                toString: () => cid,
              },
            })),
          };
        },
      },
    },
  };

  const fetchImpl: typeof fetch = async (input) => {
    const match = String(input).match(/^https:\/\/([^.]+)\.ipfs\.storacha\.link\/?$/);
    const cid = match?.[1];
    const payload = cid ? payloads.get(cid) : undefined;

    return {
      ok: payload !== undefined,
      status: payload !== undefined ? 200 : 404,
      async json() {
        return JSON.parse(JSON.stringify(payload));
      },
    } as Response;
  };

  return {
    client,
    fetchImpl,
  };
}

function createInMemoryPublisher() {
  const counters = new Map<string, number>();
  const records: Array<{
    collection: string;
    record: HypercertRecord;
    repo: string;
  }> = [];

  return {
    records,
    publisher: {
      async createRecord({
        repo,
        collection,
        record,
      }: {
        repo: string;
        collection: string;
        record: HypercertRecord;
      }) {
        const next = (counters.get(collection) ?? 0) + 1;
        counters.set(collection, next);
        records.push({ repo, collection, record });
        return {
          uri: `at://${repo}/${collection}/${next}`,
          cid: `cid-${collection}-${next}`,
        };
      },
    },
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

function createRunInput(runId: string) {
  return {
    runId,
    jurisdictionId: 'us-federal',
    jurisdictionName: 'United States',
    startedAt: '2026-03-11T12:00:00.000Z',
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
  };
}

describe('PL Genesis agent receipts integration', () => {
  it('runs the real agent, Hypercerts, and Storacha helpers together', async () => {
    const storacha = createInMemoryStoracha();
    const atproto = createInMemoryPublisher();
    const manifest = createAgentManifest();
    let analysisRunCount = 0;

    const adapters = {
      analysis: {
        async execute() {
          analysisRunCount += 1;
          return {
            ...baseArtifact,
            rawMetrics: {
              ...baseArtifact.rawMetrics,
              run: analysisRunCount,
            },
          };
        },
      },
      hypercerts: {
        async publishPolicy(input: Parameters<typeof createPolicyHypercertDraft>[0]) {
          return publishPolicyHypercertDraft(
            atproto.publisher,
            'did:plc:optimitron',
            createPolicyHypercertDraft(input),
          );
        },
      },
      storage: {
        async storeAggregation(input: CreateWishocracyAggregationInput) {
          return storeLinkedAggregation(
            storacha.client,
            input,
            storacha.fetchImpl,
          );
        },
        async storePolicyAnalysis(input: CreateOptimitronPolicyAnalysisInput) {
          return storeLinkedPolicyAnalysis(
            storacha.client,
            input,
            storacha.fetchImpl,
          );
        },
      },
    };

    const firstRun = await runAgent({
      manifest,
      reasoner: createReasonerQueue([
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
          summary: 'Preventive care is underfunded relative to citizen priorities.',
          confidenceAssessment: 'Confidence is moderate to high.',
          caveats: ['Coverage is stronger in OECD data.'],
          additionalDataNeeded: ['More subnational panels.'],
        },
        {
          verdict: 'proceed',
          rationale: 'Quality checks passed.',
        },
      ]),
      now: () => new Date('2026-03-11T12:00:00.000Z'),
      runInput: createRunInput('run-1'),
      adapters,
    });

    const secondRun = await runAgent({
      manifest,
      reasoner: createReasonerQueue([
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
          summary: 'A second receipt run confirms the same recommendation.',
          confidenceAssessment: 'Confidence remains moderate to high.',
          caveats: ['The public dataset mix is still observational.'],
          additionalDataNeeded: ['Finer-grained jurisdiction outcomes.'],
        },
        {
          verdict: 'proceed',
          rationale: 'Quality checks passed again.',
        },
      ]),
      now: () => new Date('2026-03-11T12:05:00.000Z'),
      runInput: createRunInput('run-2'),
      adapters,
    });

    const latestAggregationCid = await getLatest(
      storacha.client,
      storacha.fetchImpl,
      {
        jurisdictionId: 'us-federal',
        type: 'wishocracy-aggregation',
      },
    );
    const latestPolicyCid = await getLatest(
      storacha.client,
      storacha.fetchImpl,
      {
        jurisdictionId: 'us-federal',
        type: 'optimitron-policy-analysis',
      },
    );

    expect(firstRun.status).toBe('completed');
    expect(secondRun.status).toBe('completed');
    expect(latestAggregationCid).toBe(
      secondRun.targetExecutions[0]?.publishReceipt?.aggregationStorageCid,
    );
    expect(latestPolicyCid).toBe(
      secondRun.targetExecutions[0]?.publishReceipt?.policyStorageCid,
    );

    const aggregationChain = await verifyHistoryChain(
      latestAggregationCid as string,
      2,
      storacha.fetchImpl,
      {
        jurisdictionId: 'us-federal',
        type: 'wishocracy-aggregation',
      },
    );
    const policyChain = await verifyHistoryChain(
      latestPolicyCid as string,
      2,
      storacha.fetchImpl,
      {
        jurisdictionId: 'us-federal',
        type: 'optimitron-policy-analysis',
      },
    );

    expect(aggregationChain.valid).toBe(true);
    expect(policyChain.valid).toBe(true);
    expect(aggregationChain.records).toHaveLength(2);
    expect(policyChain.records).toHaveLength(2);
    expect(aggregationChain.records[0]?.snapshot.previousCid).toBe(
      firstRun.targetExecutions[0]?.publishReceipt?.aggregationStorageCid,
    );
    expect(policyChain.records[0]?.snapshot.previousCid).toBe(
      firstRun.targetExecutions[0]?.publishReceipt?.policyStorageCid,
    );

    const collections = new Set(atproto.records.map((entry) => entry.collection));
    expect(collections.has(ACTIVITY_COLLECTION)).toBe(true);
    expect(collections.has(ATTACHMENT_COLLECTION)).toBe(true);
    expect(collections.has(MEASUREMENT_COLLECTION)).toBe(true);
    expect(collections.has(EVALUATION_COLLECTION)).toBe(true);
    expect(secondRun.outputs.activityUris[0]).toContain(ACTIVITY_COLLECTION);
  });
});
