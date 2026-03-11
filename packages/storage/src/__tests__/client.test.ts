import { describe, expect, it, vi } from 'vitest';
import {
  buildStorachaGatewayUrl,
  createJsonBlob,
  getLatestUploadCid,
  retrieveStoredSnapshot,
  uploadJson,
} from '../client.js';

describe('storage client helpers', () => {
  it('builds Storacha gateway URLs', () => {
    expect(buildStorachaGatewayUrl('bafytest')).toBe(
      'https://bafytest.ipfs.storacha.link',
    );
  });

  it('serializes JSON to an application/json blob', async () => {
    const blob = createJsonBlob({ ok: true });

    expect(blob.type).toBe('application/json');
    expect(await blob.text()).toContain('"ok": true');
  });

  it('uploads JSON blobs and normalizes the CID', async () => {
    const uploadFile = vi.fn().mockResolvedValue({
      toString: () => 'bafyupload',
    });

    const cid = await uploadJson({ uploadFile }, { hello: 'world' });

    expect(cid).toBe('bafyupload');
    expect(uploadFile).toHaveBeenCalledTimes(1);
    const uploadedBlob = uploadFile.mock.calls[0]?.[0] as Blob;
    expect(await uploadedBlob.text()).toContain('"hello": "world"');
  });

  it('retrieves and validates stored snapshots', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        type: 'wishocracy-aggregation',
        timestamp: '2026-03-11T00:00:00.000Z',
        jurisdictionId: 'us-federal',
        participantCount: 10,
        preferenceWeights: [{ itemId: 'clinical-trials', weight: 0.4 }],
      }),
    });

    const snapshot = await retrieveStoredSnapshot('bafydata', fetchImpl as typeof fetch);

    expect(snapshot.type).toBe('wishocracy-aggregation');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://bafydata.ipfs.storacha.link',
    );
  });

  it('reads the latest upload CID from the current space', async () => {
    const client = {
      capability: {
        upload: {
          list: vi.fn().mockResolvedValue({
            results: [{ root: { toString: () => 'bafylatest' } }],
          }),
        },
      },
    };

    await expect(getLatestUploadCid(client)).resolves.toBe('bafylatest');
  });
});
