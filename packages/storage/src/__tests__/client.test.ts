import { describe, expect, it, vi } from 'vitest';
import {
  buildJurisdictionSpaceName,
  buildStorachaGatewayUrl,
  createJurisdictionSpace,
  createJsonBlob,
  createSpace,
  findLatestStoredSnapshot,
  getLatestUploadCid,
  listUploadCids,
  loginToStoracha,
  retrieveStoredSnapshot,
  selectSpace,
  uploadJson,
} from '../client.js';

describe('storage client helpers', () => {
  it('normalizes jurisdiction ids into Storacha space names', () => {
    expect(buildJurisdictionSpaceName('US Federal / Budget')).toBe(
      'optimitron-us-federal-budget',
    );
  });

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

  it('logs into Storacha with the provided email address', async () => {
    const client = {
      login: vi.fn().mockResolvedValue(undefined),
    };

    await loginToStoracha(client, 'builder@example.com');

    expect(client.login).toHaveBeenCalledWith('builder@example.com');
  });

  it('creates a space and selects it immediately', async () => {
    const setCurrentSpace = vi.fn().mockResolvedValue(undefined);
    const client = {
      createSpace: vi.fn().mockResolvedValue({
        did: () => 'did:key:space1',
      }),
      setCurrentSpace,
    };

    await expect(createSpace(client, 'optimitron-us-federal')).resolves.toBe('did:key:space1');
    expect(client.createSpace).toHaveBeenCalledWith('optimitron-us-federal');
    expect(setCurrentSpace).toHaveBeenCalledWith('did:key:space1');
  });

  it('creates jurisdiction-scoped spaces with a normalized name', async () => {
    const setCurrentSpace = vi.fn().mockResolvedValue(undefined);
    const client = {
      createSpace: vi.fn().mockResolvedValue({
        did: () => 'did:key:jurisdiction',
      }),
      setCurrentSpace,
    };

    await expect(createJurisdictionSpace(client, 'Cook County, IL')).resolves.toBe(
      'did:key:jurisdiction',
    );
    expect(client.createSpace).toHaveBeenCalledWith('optimitron-cook-county-il');
  });

  it('switches to an existing space', async () => {
    const client = {
      setCurrentSpace: vi.fn().mockResolvedValue(undefined),
    };

    await selectSpace(client, 'did:key:space2');

    expect(client.setCurrentSpace).toHaveBeenCalledWith('did:key:space2');
  });

  it('lists upload CIDs across multiple pages', async () => {
    const client = {
      capability: {
        upload: {
          list: vi.fn().mockResolvedValue({
            cursor: 'page-2',
            results: [{ root: { toString: () => 'bafy1' } }],
          }).mockResolvedValueOnce({
            cursor: 'page-2',
            results: [{ root: { toString: () => 'bafy1' } }],
          }).mockResolvedValueOnce({
            results: [{ root: { toString: () => 'bafy2' } }],
          }),
        },
      },
    };

    await expect(listUploadCids(client, { pageSize: 1 })).resolves.toEqual(['bafy1', 'bafy2']);
  });

  it('finds the latest snapshot by chain head instead of list order', async () => {
    const client = {
      capability: {
        upload: {
          list: vi.fn().mockResolvedValue({
            results: [
              { root: { toString: () => 'bafy-older' } },
              { root: { toString: () => 'bafy-newer' } },
            ],
          }),
        },
      },
    };
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const payload = url.includes('bafy-older')
        ? {
          type: 'wishocracy-aggregation',
          timestamp: '2026-03-10T00:00:00.000Z',
          jurisdictionId: 'us-federal',
          participantCount: 7,
          preferenceWeights: [],
        }
        : {
          type: 'wishocracy-aggregation',
          timestamp: '2026-03-11T00:00:00.000Z',
          jurisdictionId: 'us-federal',
          participantCount: 8,
          preferenceWeights: [],
          previousCid: 'bafy-older',
        };

      return {
        ok: true,
        json: async () => payload,
      };
    });

    const latest = await findLatestStoredSnapshot(
      client,
      fetchImpl as typeof fetch,
      {
        jurisdictionId: 'us-federal',
        type: 'wishocracy-aggregation',
      },
    );

    expect(latest?.cid).toBe('bafy-newer');
    await expect(
      getLatestUploadCid(
        client,
        fetchImpl as typeof fetch,
        {
          jurisdictionId: 'us-federal',
          type: 'wishocracy-aggregation',
        },
      ),
    ).resolves.toBe('bafy-newer');
  });
});
