import { describe, expect, it, vi } from 'vitest';
import {
  createDepositHypercertDraft,
  publishDepositHypercertDraft,
} from '../deposit-bundle.js';

const baseInput = {
  depositorAddress: '0x1234567890abcdef1234567890abcdef12345678',
  depositorName: 'Alice Funder',
  amount: '500000000', // 500 USDC (6 decimals)
  sharesReceived: '500000000000000000000', // 500 PRIZE shares
  txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  chainId: 84532,
  contributorDid: 'did:plc:optimitron',
};

describe('deposit-bundle', () => {
  it('creates a draft from deposit input', () => {
    const draft = createDepositHypercertDraft(baseInput);

    expect(draft.activity.title).toContain('$500');
    expect(draft.activity.title).toContain('USDC');
    expect(draft.activity.shortDescription).toContain('Alice Funder');
    expect(draft.measurement.metric).toBe('Deposit Amount');
    expect(draft.measurement.unit).toBe('USDC');
  });

  it('formats depositor address when no name given', () => {
    const draft = createDepositHypercertDraft({
      ...baseInput,
      depositorName: undefined,
    });

    expect(draft.activity.shortDescription).toContain('0x1234...5678');
  });

  it('handles fractional USDC amounts', () => {
    const draft = createDepositHypercertDraft({
      ...baseInput,
      amount: '1500000', // 1.5 USDC
    });

    expect(draft.activity.title).toContain('$1.5');
  });

  it('publishes activity then measurement with real ref', async () => {
    const publisher = {
      createRecord: vi.fn()
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.claim.activity/1',
          cid: 'cid-activity',
        })
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.measurement/1',
          cid: 'cid-measurement',
        }),
    };

    const draft = createDepositHypercertDraft(baseInput);
    const result = await publishDepositHypercertDraft(publisher, 'did:plc:abc', draft);

    expect(publisher.createRecord).toHaveBeenCalledTimes(2);
    expect(result.refs.activity.cid).toBe('cid-activity');
    expect(result.refs.measurement.cid).toBe('cid-measurement');

    // Verify measurement references the real activity
    const measurementCall = publisher.createRecord.mock.calls[1]?.[0];
    expect(measurementCall.record.subjects).toEqual([
      { uri: 'at://did:plc:abc/org.hypercerts.claim.activity/1', cid: 'cid-activity' },
    ]);
  });

  it('passes deterministic rkeys through when provided', async () => {
    const publisher = {
      createRecord: vi.fn()
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.claim.activity/deposit-1',
          cid: 'cid-activity',
        })
        .mockResolvedValueOnce({
          uri: 'at://did:plc:abc/org.hypercerts.context.measurement/deposit-1',
          cid: 'cid-measurement',
        }),
    };

    const draft = createDepositHypercertDraft(baseInput);
    await publishDepositHypercertDraft(publisher, 'did:plc:abc', draft, {
      activityRkey: 'prize-deposit-abc',
      measurementRkey: 'prize-deposit-m-abc',
    });

    expect(publisher.createRecord.mock.calls[0]?.[0]).toMatchObject({
      rkey: 'prize-deposit-abc',
    });
    expect(publisher.createRecord.mock.calls[1]?.[0]).toMatchObject({
      rkey: 'prize-deposit-m-abc',
    });
  });
});
