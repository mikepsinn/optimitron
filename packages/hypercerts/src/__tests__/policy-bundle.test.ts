import { describe, expect, it, vi } from 'vitest';
import {
  createPolicyHypercertDraft,
  createPolicyHypercertDrafts,
  materializePolicyHypercertBundle,
  publishPolicyHypercertDraft,
} from '../policy-bundle.js';

describe('policy-bundle', () => {
  it('maps an Optimitron policy recommendation into a hypercert draft', () => {
    const draft = createPolicyHypercertDraft({
      policyId: 'clinical-trial-reform',
      jurisdictionId: 'us-federal',
      jurisdictionName: 'United States',
      policyName: 'Clinical Trial Reform',
      policyDescription: 'Expand pragmatic clinical trials.',
      recommendation: 'enact',
      analysisSummary: 'Strong causal evidence across multiple jurisdictions.',
      rationale: 'Underfunded relative to citizen preferences and welfare impact.',
      contributorDid: 'did:plc:optimitron',
      participantCount: 265,
      welfareScore: 91,
      policyImpactScore: 0.78,
      causalConfidenceScore: 0.81,
      evidenceGrade: 'A',
      citizenPreferenceWeight: 0.23,
      governmentAllocationPct: 2,
      preferenceGapPct: 21,
      sourceUrls: [
        'https://github.com/mikepsinn/optimitron',
        'https://mikepsinn.github.io/optimitron/',
      ],
    });

    expect(draft.activity.title).toContain('Clinical Trial Reform');
    expect(draft.attachmentDrafts).toHaveLength(1);
    expect(draft.measurementInput.policyImpactScore).toBe(0.78);
    expect(draft.evaluationInput.participantCount).toBe(265);
    expect(draft.evaluationInput.summary).toContain('Recommendation: enact.');
  });

  it('materializes linked records once the activity reference is known', () => {
    const draft = createPolicyHypercertDraft({
      jurisdictionId: 'us-federal',
      policyName: 'Clinical Trial Reform',
      recommendation: 'enact',
      contributorDid: 'did:plc:optimitron',
      participantCount: 100,
      citizenPreferenceWeight: 0.2,
      sourceUrls: ['https://example.com/report'],
      welfareScore: 80,
      evidenceGrade: 'B',
    });

    const bundle = materializePolicyHypercertBundle(draft, {
      uri: 'at://did:plc:abc/org.hypercerts.claim.activity/1',
      cid: 'bafyactivity',
    });

    expect(bundle.attachments[0]?.subjects).toEqual([
      {
        uri: 'at://did:plc:abc/org.hypercerts.claim.activity/1',
        cid: 'bafyactivity',
      },
    ]);
    expect(bundle.measurements[0]?.subjects).toEqual([
      {
        uri: 'at://did:plc:abc/org.hypercerts.claim.activity/1',
        cid: 'bafyactivity',
      },
    ]);
    expect(bundle.evaluation.subject).toEqual({
      uri: 'at://did:plc:abc/org.hypercerts.claim.activity/1',
      cid: 'bafyactivity',
    });
  });

  it('publishes a draft in linked order and rewires measurement refs into the evaluation', async () => {
    const publisher = {
      createRecord: vi
        .fn()
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.claim.activity/1',
          cid: 'cid-activity',
        })
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.attachment/1',
          cid: 'cid-attachment',
        })
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.measurement/1',
          cid: 'cid-measurement-1',
        })
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.measurement/2',
          cid: 'cid-measurement-2',
        })
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.measurement/3',
          cid: 'cid-measurement-3',
        })
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.measurement/4',
          cid: 'cid-measurement-4',
        })
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.measurement/5',
          cid: 'cid-measurement-5',
        })
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.evaluation/1',
          cid: 'cid-evaluation',
        }),
    };

    const result = await publishPolicyHypercertDraft(
      publisher,
      'did:plc:abc',
      createPolicyHypercertDraft({
        jurisdictionId: 'us-federal',
        policyName: 'Clinical Trial Reform',
        recommendation: 'enact',
        contributorDid: 'did:plc:optimitron',
        participantCount: 100,
        citizenPreferenceWeight: 0.2,
        governmentAllocationPct: 2,
        preferenceGapPct: 18,
        welfareScore: 80,
        evidenceGrade: 'B',
        sourceUrls: ['https://example.com/report'],
      }),
    );

    expect(publisher.createRecord).toHaveBeenCalledTimes(8);
    const evaluationCall = publisher.createRecord.mock.calls[7]?.[0];
    expect(evaluationCall.record.measurements).toEqual([
      {
        uri: 'at://did:plc:abc/org.hypercerts.context.measurement/1',
        cid: 'cid-measurement-1',
      },
      {
        uri: 'at://did:plc:abc/org.hypercerts.context.measurement/2',
        cid: 'cid-measurement-2',
      },
      {
        uri: 'at://did:plc:abc/org.hypercerts.context.measurement/3',
        cid: 'cid-measurement-3',
      },
      {
        uri: 'at://did:plc:abc/org.hypercerts.context.measurement/4',
        cid: 'cid-measurement-4',
      },
      {
        uri: 'at://did:plc:abc/org.hypercerts.context.measurement/5',
        cid: 'cid-measurement-5',
      },
    ]);
    expect(result.refs.activity.cid).toBe('cid-activity');
    expect(result.refs.evaluation.cid).toBe('cid-evaluation');
  });

  it('creates multiple drafts in batch', () => {
    const drafts = createPolicyHypercertDrafts([
      {
        jurisdictionId: 'us-federal',
        policyName: 'Preventive Care',
        policyDescription: 'Increase preventive care investment.',
        recommendation: 'enact',
        contributorDid: 'did:plc:optimitron',
        analysisSummary: 'Increase preventive care investment.',
      },
      {
        jurisdictionId: 'us-federal',
        policyName: 'Housing Reform',
        policyDescription: 'Replace low-impact housing subsidies.',
        recommendation: 'replace',
        contributorDid: 'did:plc:optimitron',
        analysisSummary: 'Replace low-impact housing subsidies.',
      },
    ]);

    expect(drafts).toHaveLength(2);
    expect(drafts[0]?.activity.title).toContain('Preventive Care');
    expect(drafts[1]?.activity.title).toContain('Housing Reform');
  });
});
