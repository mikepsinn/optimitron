import type { webcrypto } from 'node:crypto';
import { encryptJson, decryptJson } from './crypto.js';
import { uploadJson, buildStorachaGatewayUrl, type StorachaUploadClient } from './client.js';
import { EncryptedPayloadSchema } from './types.js';

export async function uploadEncryptedJson(
  client: StorachaUploadClient,
  value: unknown,
  key: webcrypto.CryptoKey,
): Promise<string> {
  const payload = await encryptJson(value, key);
  return uploadJson(client, payload);
}

export async function retrieveEncryptedJson<T>(
  cid: string,
  key: webcrypto.CryptoKey,
  schema: { parse(value: unknown): T },
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const response = await fetchImpl(buildStorachaGatewayUrl(cid));
  if (!response.ok) {
    throw new Error(`Storacha retrieve failed with ${response.status}`);
  }
  const payload: unknown = await response.json();
  const encrypted = EncryptedPayloadSchema.parse(payload);
  return decryptJson(encrypted, key, schema);
}
