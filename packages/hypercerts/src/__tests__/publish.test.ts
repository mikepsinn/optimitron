import { describe, expect, it, vi } from 'vitest';
import {
  beginOAuthLogin,
  completeOAuthLogin,
  createAtprotoPublisher,
  publishRecord,
  publishRecords,
} from '../publish.js';

describe('publish helpers', () => {
  it('wraps the ATProto createRecord call', async () => {
    const createRecord = vi.fn().mockResolvedValue({
      data: { uri: 'at://did:plc:abc/collection/1', cid: 'bafyreicid' },
    });
    const publisher = createAtprotoPublisher({
      com: { atproto: { repo: { createRecord } } },
    } as never);

    const ref = await publishRecord(publisher, 'did:plc:abc', {
      $type: 'org.hypercerts.claim.rights',
      rightsName: 'CC BY 4.0',
      rightsType: 'CC-BY',
      rightsDescription: 'Reusable',
      createdAt: '2026-03-11T00:00:00.000Z',
    });

    expect(ref.cid).toBe('bafyreicid');
    expect(createRecord).toHaveBeenCalledWith({
      repo: 'did:plc:abc',
      collection: 'org.hypercerts.claim.rights',
      record: expect.objectContaining({
        $type: 'org.hypercerts.claim.rights',
      }),
      rkey: undefined,
    });
  });

  it('publishes multiple records in sequence', async () => {
    const publisher = {
      createRecord: vi
        .fn()
        .mockResolvedValueOnce({ uri: 'at://one', cid: 'cid1' })
        .mockResolvedValueOnce({ uri: 'at://two', cid: 'cid2' }),
    };

    const refs = await publishRecords(publisher, 'did:plc:abc', [
      {
        $type: 'org.hypercerts.claim.rights',
        rightsName: 'CC BY 4.0',
        rightsType: 'CC-BY',
        rightsDescription: 'Reusable',
        createdAt: '2026-03-11T00:00:00.000Z',
      },
      {
        $type: 'org.hypercerts.context.attachment',
        title: 'Source',
        createdAt: '2026-03-11T00:00:00.000Z',
      },
    ]);

    expect(refs).toEqual([
      { uri: 'at://one', cid: 'cid1' },
      { uri: 'at://two', cid: 'cid2' },
    ]);
  });

  it('starts OAuth login flows', async () => {
    const authorize = vi.fn().mockResolvedValue('https://auth.example');

    await expect(
      beginOAuthLogin({ authorize } as never, 'example.bsky.social', {
        state: 'state-1',
      }),
    ).resolves.toBe('https://auth.example');
  });

  it('completes OAuth login flows', async () => {
    const callback = vi.fn().mockResolvedValue({
      session: { did: 'did:plc:abc', fetchHandler: vi.fn() },
      state: 'state-1',
    });

    const result = await completeOAuthLogin(
      { callback } as never,
      new URLSearchParams('code=123'),
    );

    expect(result.did).toBe('did:plc:abc');
    expect(result.state).toBe('state-1');
  });
});
