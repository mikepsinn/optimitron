import { describe, expect, it, vi } from 'vitest';
import { createAggregationSnapshot, storeAggregation } from '../wishocracy-store.js';

describe('wishocracy-store', () => {
  it('creates linked aggregation snapshots', () => {
    const snapshot = createAggregationSnapshot({
      jurisdictionId: 'us-federal',
      participantCount: 265,
      preferenceWeights: [
        {
          itemId: 'clinical-trials',
          weight: 0.292,
          label: 'Pragmatic Clinical Trials',
        },
      ],
      consistencyRatio: 0.04,
      convergenceAnalysis: {
        stable: true,
        minComparisonsNeeded: 18,
      },
      previousCid: 'bafyprevious',
    });

    expect(snapshot.type).toBe('wishocracy-aggregation');
    expect(snapshot.previousCid).toBe('bafyprevious');
    expect(snapshot.timestamp).toMatch(/^2026|^20/);
  });

  it('stores aggregation snapshots via the upload client', async () => {
    const client = {
      uploadFile: vi.fn().mockResolvedValue('bafyaggregation'),
    };

    const result = await storeAggregation(client, {
      jurisdictionId: 'us-federal',
      participantCount: 3,
      preferenceWeights: [{ itemId: 'rd', weight: 0.5 }],
    });

    expect(result.cid).toBe('bafyaggregation');
    expect(result.snapshot.type).toBe('wishocracy-aggregation');
    expect(client.uploadFile).toHaveBeenCalledTimes(1);
  });
});
