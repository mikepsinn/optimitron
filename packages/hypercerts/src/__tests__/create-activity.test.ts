import { describe, expect, it } from 'vitest';
import { createActivityClaimRecord } from '../create-activity.js';

describe('create-activity', () => {
  it('maps policy analysis inputs to an activity claim record', () => {
    const record = createActivityClaimRecord({
      policyName: 'Clinical Trial Funding Reform',
      policyDescription: 'Increase pragmatic clinical trial funding',
      evidenceGrade: 'A',
      welfareScore: 87,
      analysisSummary: 'Strong causal evidence across multiple jurisdictions.',
      startDate: '2026-03-01T00:00:00.000Z',
      endDate: '2026-03-11T00:00:00.000Z',
      createdAt: '2026-03-11T00:00:00.000Z',
      contributorDid: 'did:plc:optimitron',
      sourceUrls: ['https://github.com/mikepsinn/optimitron'],
    });

    expect(record.$type).toBe('org.hypercerts.claim.activity');
    expect(record.title).toContain('Clinical Trial Funding Reform');
    expect(record.shortDescription).toContain('Evidence Grade A');
    expect(record.contributors?.[0]?.contributionWeight).toBe('100');
    expect(record.workScope).toEqual({ scope: 'Evidence-based policy analysis' });
  });
});
