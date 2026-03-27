import * as Storacha from '@storacha/client';
import type { Client } from '@storacha/client';
import {
  StoredSnapshotSchema,
  type StoredSnapshot,
  type StoredSnapshotUpload,
} from './types.js';

export type StorachaClient = Client;
export type StorachaCreateOptions = Parameters<typeof Storacha.create>[0];
export type StorachaEmail = `${string}@${string}`;
export type StorachaDid = `did:${string}:${string}`;

export interface UploadListItemLike {
  root: unknown;
}

export interface StorachaUploadClient {
  uploadFile(file: Blob): Promise<unknown>;
}

export interface UploadListResponseLike {
  cursor?: string;
  results: UploadListItemLike[];
}

export interface StorachaListClient {
  capability: {
    upload: {
      list(options?: { cursor?: string; size?: number; signal?: AbortSignal }): Promise<UploadListResponseLike>;
    };
  };
}

export interface UploadListOptions {
  maxPages?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export interface StoredSnapshotFilter {
  jurisdictionId?: string;
  type?: StoredSnapshot['type'];
}

function cidToString(value: unknown): string {
  const text = typeof value === 'string' ? value : String(value);
  if (!text || text === '[object Object]') {
    throw new Error('Unable to convert CID to string');
  }
  return text;
}

function matchesSnapshotFilter(
  snapshot: StoredSnapshot,
  filter: StoredSnapshotFilter,
): boolean {
  if (filter.type && snapshot.type !== filter.type) {
    return false;
  }

  if (filter.jurisdictionId && snapshot.jurisdictionId !== filter.jurisdictionId) {
    return false;
  }

  return true;
}

function getSnapshotTimestamp(snapshot: StoredSnapshot): number {
  return new Date(snapshot.timestamp).getTime();
}

function compareSnapshotUploads(
  left: StoredSnapshotUpload<StoredSnapshot>,
  right: StoredSnapshotUpload<StoredSnapshot>,
): number {
  return getSnapshotTimestamp(right.snapshot) - getSnapshotTimestamp(left.snapshot);
}

function selectLatestSnapshotUpload(
  uploads: StoredSnapshotUpload<StoredSnapshot>[],
): StoredSnapshotUpload<StoredSnapshot> | null {
  if (!uploads.length) {
    return null;
  }

  const previousCids = new Set(
    uploads.flatMap((upload) => (upload.snapshot.previousCid ? [upload.snapshot.previousCid] : [])),
  );
  const heads = uploads.filter((upload) => !previousCids.has(upload.cid));
  const candidates = heads.length ? heads : uploads;

  return [...candidates].sort(compareSnapshotUploads)[0] ?? null;
}

export function buildStorachaGatewayUrl(cid: string): string {
  return `https://${cid}.ipfs.storacha.link`;
}

export function createJsonBlob(value: unknown): Blob {
  return new Blob([JSON.stringify(value, null, 2)], {
    type: 'application/json',
  });
}

export async function createStorachaClient(
  options: StorachaCreateOptions = {},
): Promise<StorachaClient> {
  return Storacha.create(options);
}

/**
 * Create a Storacha client for serverless / ephemeral environments (e.g. Vercel Functions).
 * Uses an ed25519 key + UCAN delegation proof instead of email-based login.
 *
 * @param key  - Ed25519 private key string (from `STORACHA_KEY`)
 * @param proof - UCAN delegation proof string (from `STORACHA_PROOF`)
 */
export async function createServerlessClient(
  key: string,
  proof: string,
): Promise<StorachaClient> {
  const { StoreMemory } = await import('@storacha/client/stores/memory');
  const { Signer } = await import('@storacha/client/principal/ed25519');
  const ProofModule = await import('@storacha/client/proof');

  const principal = Signer.parse(key);
  const client = await Storacha.create({ principal, store: new StoreMemory() });
  const parsedProof = await ProofModule.parse(proof);
  const space = await client.addSpace(parsedProof);
  await client.setCurrentSpace(space.did());

  return client;
}

export function buildJurisdictionSpaceName(
  jurisdictionId: string,
  prefix = 'optimitron',
): string {
  const normalizedJurisdictionId = jurisdictionId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${prefix}-${normalizedJurisdictionId}`;
}

export async function loginToStoracha(
  client: { login(email: StorachaEmail): Promise<void> },
  email: StorachaEmail,
): Promise<void> {
  await client.login(email);
}

export async function createSpace(
  client: { createSpace(name?: string): Promise<{ did(): StorachaDid }>; setCurrentSpace(did: StorachaDid): Promise<void> },
  name: string,
): Promise<string> {
  const space = await client.createSpace(name);
  const did = space.did();
  await client.setCurrentSpace(did);
  return did;
}

export async function createJurisdictionSpace(
  client: { createSpace(name?: string): Promise<{ did(): StorachaDid }>; setCurrentSpace(did: StorachaDid): Promise<void> },
  jurisdictionId: string,
  prefix?: string,
): Promise<string> {
  return createSpace(client, buildJurisdictionSpaceName(jurisdictionId, prefix));
}

export async function selectSpace(
  client: { setCurrentSpace(did: StorachaDid): Promise<void> },
  spaceDid: StorachaDid,
): Promise<void> {
  await client.setCurrentSpace(spaceDid);
}

export async function uploadJson(
  client: StorachaUploadClient,
  value: unknown,
): Promise<string> {
  const cid = await client.uploadFile(createJsonBlob(value));
  return cidToString(cid);
}

export async function retrieveJson<T>(
  cid: string,
  schema: { parse(value: unknown): T },
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const response = await fetchImpl(buildStorachaGatewayUrl(cid));
  if (!response.ok) {
    throw new Error(`Storacha retrieve failed with ${response.status}`);
  }
  return schema.parse(await response.json());
}

export async function retrieveStoredSnapshot(
  cid: string,
  fetchImpl: typeof fetch = fetch,
): Promise<StoredSnapshot> {
  return retrieveJson(cid, StoredSnapshotSchema, fetchImpl);
}

export async function tryRetrieveStoredSnapshot(
  cid: string,
  fetchImpl: typeof fetch = fetch,
): Promise<StoredSnapshot | null> {
  const response = await fetchImpl(buildStorachaGatewayUrl(cid));
  if (!response.ok) {
    throw new Error(`Storacha retrieve failed with ${response.status}`);
  }

  const payload = await response.json();
  const parsed = StoredSnapshotSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

export async function listUploadCids(
  client: StorachaListClient,
  options: UploadListOptions = {},
): Promise<string[]> {
  const uploadCids: string[] = [];
  let cursor: string | undefined;
  let pagesRead = 0;

  do {
    const response = await client.capability.upload.list({
      cursor,
      signal: options.signal,
      size: options.pageSize,
    });

    uploadCids.push(...response.results.map((result) => cidToString(result.root)));
    cursor = response.cursor;
    pagesRead += 1;
  } while (cursor && (!options.maxPages || pagesRead < options.maxPages));

  return uploadCids;
}

export async function findLatestStoredSnapshot(
  client: StorachaListClient,
  fetchImpl: typeof fetch = fetch,
  filter: StoredSnapshotFilter = {},
  options: UploadListOptions = {},
): Promise<StoredSnapshotUpload<StoredSnapshot> | null> {
  const uploadCids = await listUploadCids(client, options);
  const snapshotUploads = (
    await Promise.all(
      uploadCids.map(async (cid) => {
        const snapshot = await tryRetrieveStoredSnapshot(cid, fetchImpl);
        return snapshot ? { cid, snapshot } : null;
      }),
    )
  ).filter(
    (upload): upload is StoredSnapshotUpload<StoredSnapshot> =>
      upload !== null && matchesSnapshotFilter(upload.snapshot, filter),
  );

  return selectLatestSnapshotUpload(snapshotUploads);
}

export async function getLatestUploadCid(
  client: StorachaListClient,
  fetchImpl: typeof fetch = fetch,
  filter: StoredSnapshotFilter = {},
  options: UploadListOptions = {},
): Promise<string | null> {
  return (await findLatestStoredSnapshot(client, fetchImpl, filter, options))?.cid ?? null;
}
