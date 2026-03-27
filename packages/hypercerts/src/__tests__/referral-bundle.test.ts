import { describe, expect, it, vi } from 'vitest';
import {
  createReferralHypercertDraft,
  materializeReferralBundle,
  publishReferralHypercertDraft,
} from '../referral-bundle.js';

const baseInput = {
  referrerId: 'user-jane',
  referrerName: 'Jane Recruiter',
  referendumId: 'ref-global-1',
  referendumTitle: 'Global Health Reallocation Treaty',
  verifiedVotesRecruited: 7,
  totalReferrals: 12,
  contributorDid: 'did:plc:optimitron',
  sourceUrls: ['https://optimitron.org/referrals/jane'],
};

describe('referral-bundle', () => {
  it('creates a draft from referral input', () => {
    const draft = createReferralHypercertDraft(baseInput);

    expect(draft.activity.title).toContain('Jane Recruiter');
    expect(draft.activity.title).toContain('Voter Recruitment');
    expect(draft.measurements).toHaveLength(3); // verified + total + rate
    expect(draft.evaluationInput.participantCount).toBe(7);
    expect(draft.evaluationInput.summary).toContain('7 verified voters');
    expect(draft.evaluationInput.summary).toContain('Jane Recruiter');
    expect(draft.attachmentDrafts).toHaveLength(1);
  });

  it('includes correct measurements', () => {
    const draft = createReferralHypercertDraft(baseInput);

    const verified = draft.measurements.find((m) => m.metric === 'Verified Votes Recruited');
    expect(verified?.value).toBe(7);
    expect(verified?.unit).toBe('count');

    const total = draft.measurements.find((m) => m.metric === 'Total Referrals');
    expect(total?.value).toBe(12);

    const rate = draft.measurements.find((m) => m.metric === 'Recruitment Verification Rate');
    expect(rate?.value).toBeCloseTo(58.3, 0);
    expect(rate?.unit).toBe('percent');
  });

  it('works with minimal input', () => {
    const draft = createReferralHypercertDraft({
      referrerId: 'user-bob',
      referrerName: 'Bob',
      referendumId: 'ref-1',
      referendumTitle: 'Test Referendum',
      verifiedVotesRecruited: 2,
      totalReferrals: 3,
      contributorDid: 'did:plc:optimitron',
    });

    expect(draft.activity.title).toContain('Bob');
    expect(draft.measurements).toHaveLength(3);
    expect(draft.attachmentDrafts).toHaveLength(0);
  });

  it('omits verification rate when totalReferrals is zero', () => {
    const draft = createReferralHypercertDraft({
      referrerId: 'user-zero',
      referrerName: 'Zero',
      referendumId: 'ref-1',
      referendumTitle: 'Test',
      verifiedVotesRecruited: 0,
      totalReferrals: 0,
      contributorDid: 'did:plc:optimitron',
    });

    expect(draft.measurements).toHaveLength(2); // no rate when total is 0
    const rate = draft.measurements.find((m) => m.metric === 'Recruitment Verification Rate');
    expect(rate).toBeUndefined();
  });

  it('materializes linked records once the activity reference is known', () => {
    const draft = createReferralHypercertDraft(baseInput);
    const activityRef = {
      uri: 'at://did:plc:abc/org.hypercerts.claim.activity/1',
      cid: 'bafyactivity',
    };

    const bundle = materializeReferralBundle(draft, activityRef);

    expect(bundle.attachments[0]?.subjects).toEqual([activityRef]);
    expect(bundle.measurements[0]?.subjects).toEqual([activityRef]);
    expect(bundle.evaluation.subject).toEqual(activityRef);
    expect(bundle.measurements).toHaveLength(3);
    expect(bundle.evaluation.score).toEqual({
      min: 0,
      max: 100,
      value: 70, // 7 verified * 10, capped at 100
    });
  });

  it('caps evaluation score at 100', () => {
    const draft = createReferralHypercertDraft({
      ...baseInput,
      verifiedVotesRecruited: 15,
      totalReferrals: 20,
    });
    const activityRef = { uri: 'at://test/activity/1', cid: 'bafytest' };
    const bundle = materializeReferralBundle(draft, activityRef);

    expect(bundle.evaluation.score).toEqual({
      min: 0,
      max: 100,
      value: 100,
    });
  });

  it('publishes in correct linked order and rewires measurement refs', async () => {
    const publisher = {
      createRecord: vi.fn()
        // activity
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.claim.activity/1',
          cid: 'cid-activity',
        })
        // attachment
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.attachment/1',
          cid: 'cid-attachment',
        })
        // 3 measurements
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.measurement/1',
          cid: 'cid-m-1',
        })
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.measurement/2',
          cid: 'cid-m-2',
        })
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.measurement/3',
          cid: 'cid-m-3',
        })
        // evaluation
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.evaluation/1',
          cid: 'cid-evaluation',
        }),
    };

    const result = await publishReferralHypercertDraft(
      publisher,
      'did:plc:abc',
      createReferralHypercertDraft(baseInput),
    );

    // activity + attachment + 3 measurements + evaluation = 6
    expect(publisher.createRecord).toHaveBeenCalledTimes(6);
    expect(result.refs.activity.cid).toBe('cid-activity');
    expect(result.refs.evaluation.cid).toBe('cid-evaluation');
    expect(result.refs.measurements).toHaveLength(3);

    // Verify evaluation has real measurement refs (not pending)
    const evalCall = publisher.createRecord.mock.calls[5]?.[0];
    expect(evalCall.record.measurements).toEqual([
      { uri: 'at://did:plc:abc/org.hypercerts.context.measurement/1', cid: 'cid-m-1' },
      { uri: 'at://did:plc:abc/org.hypercerts.context.measurement/2', cid: 'cid-m-2' },
      { uri: 'at://did:plc:abc/org.hypercerts.context.measurement/3', cid: 'cid-m-3' },
    ]);
  });

  it('uses voter-referral-tracking as method type', () => {
    const draft = createReferralHypercertDraft(baseInput);
    expect(draft.measurementOptions.methodType).toBe('voter-referral-tracking');
  });

  it('produces a meaningful evaluation summary', () => {
    const draft = createReferralHypercertDraft({
      ...baseInput,
      verifiedVotesRecruited: 25,
      totalReferrals: 30,
    });

    expect(draft.evaluationInput.summary).toContain('25 verified voters');
    expect(draft.evaluationInput.summary).toContain('30 total referrals');
    expect(draft.evaluationInput.summary).toContain('83.3%');
  });
});
