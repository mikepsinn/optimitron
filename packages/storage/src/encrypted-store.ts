import { encryptJson, decryptJson } from './crypto.js';
import { uploadJson, buildStorachaGatewayUrl, type StorachaUploadClient } from './client.js';

export async function uploadEncryptedJson(
  client: StorachaUploadClient,
  value: unknown,
  key: CryptoKey,
): Promise<string> {
  const payload = await encryptJson(value, key);
  return uploadJson(client, payload);
}

export async function retrieveEncryptedJson<T>(
  cid: string,
  key: CryptoKey,
  schema: { parse(value: unknown): T },
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const response = await fetchImpl(buildStorachaGatewayUrl(cid));
  if (!response.ok) {
    throw new Error(`Storacha retrieve failed with ${response.status}`);
  }
  const payload = await response.json();
  return decryptJson(payload, key, schema);
}
