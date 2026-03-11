import { describe, expect, it, vi } from 'vitest';
import {
  createPolicyAnalysisSnapshot,
  storePolicyAnalysis,
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

    expect(snapshot.type).toBe('optomitron-policy-analysis');
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
    expect(result.snapshot.type).toBe('optomitron-policy-analysis');
    expect(client.uploadFile).toHaveBeenCalledTimes(1);
  });
});
