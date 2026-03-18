import { describe, expect, it, vi } from 'vitest';
import { getHistory, getLatest, verifyHistoryChain } from '../chain.js';

describe('storage chain helpers', () => {
  it('follows previousCid links up to the requested depth', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'wishocracy-aggregation',
          timestamp: '2026-03-11T00:00:00.000Z',
          jurisdictionId: 'us-federal',
          participantCount: 3,
          preferenceWeights: [],
          previousCid: 'bafy2',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'wishocracy-aggregation',
          timestamp: '2026-03-10T00:00:00.000Z',
          jurisdictionId: 'us-federal',
          participantCount: 2,
          preferenceWeights: [],
          previousCid: 'bafy1',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'wishocracy-aggregation',
          timestamp: '2026-03-09T00:00:00.000Z',
          jurisdictionId: 'us-federal',
          participantCount: 1,
          preferenceWeights: [],
        }),
      });

    const history = await getHistory('bafy3', 5, fetchImpl as typeof fetch);

    expect(history).toEqual(['bafy3', 'bafy2', 'bafy1']);
  });

  it('finds the latest CID for a specific snapshot chain', async () => {
    const client = {
      capability: {
        upload: {
          list: vi.fn().mockResolvedValue({
            results: [
              { root: { toString: () => 'bafy-analysis' } },
              { root: { toString: () => 'bafy-aggregation' } },
            ],
          }),
        },
      },
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
          type: 'wishocracy-aggregation',
          timestamp: '2026-03-11T00:00:00.000Z',
          jurisdictionId: 'us-federal',
          participantCount: 4,
          preferenceWeights: [],
        }),
      });

    await expect(
      getLatest(
        client,
        fetchImpl as typeof fetch,
        {
          jurisdictionId: 'us-federal',
          type: 'wishocracy-aggregation',
        },
      ),
    ).resolves.toBe('bafy-aggregation');
  });

  it('verifies a chain and reports timestamp regressions', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'wishocracy-aggregation',
          timestamp: '2026-03-11T00:00:00.000Z',
          jurisdictionId: 'us-federal',
          participantCount: 3,
          preferenceWeights: [],
          previousCid: 'bafy2',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'wishocracy-aggregation',
          timestamp: '2026-03-12T00:00:00.000Z',
          jurisdictionId: 'us-federal',
          participantCount: 2,
          preferenceWeights: [],
        }),
      });

    const verification = await verifyHistoryChain(
      'bafy3',
      5,
      fetchImpl as typeof fetch,
      {
        jurisdictionId: 'us-federal',
        type: 'wishocracy-aggregation',
      },
    );

    expect(verification.valid).toBe(false);
    expect(verification.errors).toContain(
      'Snapshot bafy2 is newer than its successor bafy3',
    );
  });
});
