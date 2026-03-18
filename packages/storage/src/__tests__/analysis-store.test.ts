import { describe, expect, it, vi } from 'vitest';
import {
  createPolicyAnalysisSnapshot,
  storePolicyAnalysis,
  storeLinkedPolicyAnalysis,
} from '../analysis-store.js';

describe('analysis-store', () => {
  it('creates linked policy analysis snapshots', () => {
    const snapshot = createPolicyAnalysisSnapshot({
      jurisdictionId: 'us-federal',
      policies: [
        {
          name: 'Singapore-Style Healthcare',
          grade: 'B',
          welfareScore: 40,
          ccs: 0.64,
          pis: 0.54,
          recommendation: 'enact',
        },
      ],
      budgetAnalysis: {
        totalCurrent: 6710000000000,
        totalOptimal: 6590000000000,
        categoriesAnalyzed: 23,
      },
      previousCid: 'bafyold',
    });

    expect(snapshot.type).toBe('optimitron-policy-analysis');
    expect(snapshot.previousCid).toBe('bafyold');
    expect(snapshot.policies[0]?.name).toBe('Singapore-Style Healthcare');
  });

  it('stores policy analysis snapshots via the upload client', async () => {
    const client = {
      uploadFile: vi.fn().mockResolvedValue('bafyanalysis'),
    };

    const result = await storePolicyAnalysis(client, {
      jurisdictionId: 'us-federal',
      policies: [
        {
          name: 'Clinical Trial Reform',
          grade: 'A',
          welfareScore: 87,
          recommendation: 'enact',
        },
      ],
    });

    expect(result.cid).toBe('bafyanalysis');
    expect(result.snapshot.type).toBe('optimitron-policy-analysis');
    expect(client.uploadFile).toHaveBeenCalledTimes(1);
  });

  it('auto-links policy analysis snapshots to the latest matching snapshot', async () => {
    const client = {
      capability: {
        upload: {
          list: vi.fn().mockResolvedValue({
            results: [
              { root: { toString: () => 'bafy-analysis-1' } },
              { root: { toString: () => 'bafy-analysis-2' } },
            ],
          }),
        },
      },
      uploadFile: vi.fn().mockResolvedValue('bafy-analysis-3'),
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'optimitron-policy-analysis',
          timestamp: '2026-03-10T00:00:00.000Z',
          jurisdictionId: 'us-federal',
          policies: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'optimitron-policy-analysis',
          timestamp: '2026-03-11T00:00:00.000Z',
          jurisdictionId: 'us-federal',
          policies: [],
          previousCid: 'bafy-analysis-1',
        }),
      });

    const result = await storeLinkedPolicyAnalysis(
      client,
      {
        jurisdictionId: 'us-federal',
        policies: [
          {
            name: 'Clinical Trial Reform',
            grade: 'A',
            welfareScore: 91,
            recommendation: 'enact',
          },
        ],
      },
      fetchImpl as typeof fetch,
    );

    expect(result.snapshot.previousCid).toBe('bafy-analysis-2');
    expect(result.cid).toBe('bafy-analysis-3');
  });
});
