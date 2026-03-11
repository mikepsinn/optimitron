import { describe, expect, it, vi } from 'vitest';
import { getHistory } from '../chain.js';

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
});
