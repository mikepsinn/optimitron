import { describe, expect, it, vi } from 'vitest';
import {
  createAlignmentHypercertDraft,
  materializeAlignmentBundle,
  publishAlignmentHypercertDraft,
} from '../alignment-bundle.js';

const baseInput = {
  politicianId: 'sen-smith',
  politicianName: 'Jane Smith',
  party: 'Independent',
  title: 'Senator',
  chamber: 'senate',
  jurisdictionId: 'us-federal',
  jurisdictionName: 'United States',
  alignmentScore: 73.2,
  votesCompared: 14,
  participantCount: 412,
  itemScores: [
    {
      itemId: 'healthcare',
      itemName: 'Healthcare',
      score: 89.1,
      citizenPreferredPct: 22.3,
      politicianVotedPct: 19.5,
    },
    {
      itemId: 'education',
      itemName: 'Education',
      score: 61.4,
      citizenPreferredPct: 18.0,
      politicianVotedPct: 8.4,
    },
  ],
  contributorDid: 'did:plc:optimitron',
  sourceUrls: ['https://github.com/mikepsinn/optimitron'],
};

describe('alignment-bundle', () => {
  it('creates a draft from alignment score input', () => {
    const draft = createAlignmentHypercertDraft(baseInput);

    expect(draft.activity.title).toContain('Jane Smith');
    expect(draft.activity.title).toContain('Citizen Alignment');
    expect(draft.measurements).toHaveLength(5); // score + votesCompared + participantCount + 2 categories
    expect(draft.evaluationInput.participantCount).toBe(412);
    expect(draft.evaluationInput.summary).toContain('73.2%');
    expect(draft.evaluationInput.summary).toContain('Jane Smith');
    expect(draft.attachmentDrafts).toHaveLength(1);
  });

  it('includes category scores as measurements', () => {
    const draft = createAlignmentHypercertDraft(baseInput);

    const categoryMeasurements = draft.measurements.filter((m) =>
      m.metric.startsWith('Category Alignment:'),
    );
    expect(categoryMeasurements).toHaveLength(2);
    expect(categoryMeasurements[0]?.metric).toBe('Category Alignment: Healthcare');
    expect(categoryMeasurements[0]?.value).toBe(89.1);
    expect(categoryMeasurements[1]?.metric).toBe('Category Alignment: Education');
  });

  it('works with minimal input', () => {
    const draft = createAlignmentHypercertDraft({
      politicianId: 'rep-jones',
      politicianName: 'Bob Jones',
      jurisdictionId: 'us-federal',
      alignmentScore: 45.0,
      votesCompared: 8,
      contributorDid: 'did:plc:optimitron',
    });

    expect(draft.activity.title).toContain('Bob Jones');
    expect(draft.measurements).toHaveLength(3); // score + votesCompared + participantCount
    expect(draft.attachmentDrafts).toHaveLength(0);
  });

  it('materializes linked records once the activity reference is known', () => {
    const draft = createAlignmentHypercertDraft(baseInput);
    const activityRef = {
      uri: 'at://did:plc:abc/org.hypercerts.claim.activity/1',
      cid: 'bafyactivity',
    };

    const bundle = materializeAlignmentBundle(draft, activityRef);

    expect(bundle.attachments[0]?.subjects).toEqual([activityRef]);
    expect(bundle.measurements[0]?.subjects).toEqual([activityRef]);
    expect(bundle.evaluation.subject).toEqual(activityRef);
    expect(bundle.measurements).toHaveLength(5);
    expect(bundle.evaluation.score).toEqual({
      min: 0,
      max: 100,
      value: 73, // rounded from 73.2
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
        // 5 measurements
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
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.measurement/4',
          cid: 'cid-m-4',
        })
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.measurement/5',
          cid: 'cid-m-5',
        })
        // evaluation
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.evaluation/1',
          cid: 'cid-evaluation',
        }),
    };

    const result = await publishAlignmentHypercertDraft(
      publisher,
      'did:plc:abc',
      createAlignmentHypercertDraft(baseInput),
    );

    // activity + attachment + 5 measurements + evaluation = 8
    expect(publisher.createRecord).toHaveBeenCalledTimes(8);
    expect(result.refs.activity.cid).toBe('cid-activity');
    expect(result.refs.evaluation.cid).toBe('cid-evaluation');
    expect(result.refs.measurements).toHaveLength(5);

    // Verify evaluation has real measurement refs (not pending)
    const evalCall = publisher.createRecord.mock.calls[7]?.[0];
    expect(evalCall.record.measurements).toEqual([
      { uri: 'at://did:plc:abc/org.hypercerts.context.measurement/1', cid: 'cid-m-1' },
      { uri: 'at://did:plc:abc/org.hypercerts.context.measurement/2', cid: 'cid-m-2' },
      { uri: 'at://did:plc:abc/org.hypercerts.context.measurement/3', cid: 'cid-m-3' },
      { uri: 'at://did:plc:abc/org.hypercerts.context.measurement/4', cid: 'cid-m-4' },
      { uri: 'at://did:plc:abc/org.hypercerts.context.measurement/5', cid: 'cid-m-5' },
    ]);
  });

  it('includes method URI pointing to wishocracy paper', () => {
    const draft = createAlignmentHypercertDraft(baseInput);

    expect(draft.measurementOptions.methodType).toBe('wishocracy-alignment-score');
    expect(draft.measurementOptions.methodURI).toBe('https://wishocracy.warondisease.org');
  });

  it('produces a meaningful evaluation summary', () => {
    const draft = createAlignmentHypercertDraft({
      ...baseInput,
      alignmentScore: 91.5,
      votesCompared: 20,
      participantCount: 1000,
    });

    expect(draft.evaluationInput.summary).toContain('91.5%');
    expect(draft.evaluationInput.summary).toContain('20 voting record');
    expect(draft.evaluationInput.summary).toContain('1000 participants');
  });
});
