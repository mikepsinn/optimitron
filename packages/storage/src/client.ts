import * as Storacha from '@storacha/client';
import type { Client } from '@storacha/client';
import { StoredSnapshotSchema, type StoredSnapshot } from './types.js';

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
  results: UploadListItemLike[];
}

export interface StorachaListClient {
  capability: {
    upload: {
      list(options?: { cursor?: string; size?: number; signal?: AbortSignal }): Promise<UploadListResponseLike>;
    };
  };
}

function cidToString(value: unknown): string {
  const text = typeof value === 'string' ? value : String(value);
  if (!text || text === '[object Object]') {
    throw new Error('Unable to convert CID to string');
  }
  return text;
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

export async function getLatestUploadCid(
  client: StorachaListClient,
): Promise<string | null> {
  const response = await client.capability.upload.list({ size: 1 });
  const latest = response.results[0];
  return latest ? cidToString(latest.root) : null;
}
