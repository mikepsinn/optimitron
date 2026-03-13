/**
 * Encryption primitives using Web Crypto API only — zero external dependencies.
 * Used for encrypting wish allocations and individual submissions at rest.
 */
import type { webcrypto } from 'node:crypto';
import { z } from 'zod';
import { EncryptedPayloadSchema } from './types.js';

type EncryptedPayload = z.infer<typeof EncryptedPayloadSchema>;

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 600_000;

export async function generateEncryptionKey(): Promise<webcrypto.CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function exportKey(key: webcrypto.CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(raw);
}

export async function importKey(base64Key: string): Promise<webcrypto.CryptoKey> {
  const raw = base64ToBuffer(base64Key);
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function deriveKeyFromPassword(
  password: string,
  salt: string,
): Promise<webcrypto.CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptJson(
  value: unknown,
  key: webcrypto.CryptoKey,
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const plaintext = encoder.encode(JSON.stringify(value));
  const cipherBuf = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plaintext,
  );
  return {
    ciphertext: bufferToBase64(cipherBuf),
    iv: bufferToBase64(iv.buffer),
    algorithm: 'AES-GCM-256',
  };
}

export async function decryptJson<T>(
  payload: EncryptedPayload,
  key: webcrypto.CryptoKey,
  schema: { parse(value: unknown): T },
): Promise<T> {
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);
  const plainBuf = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  );
  const decoder = new TextDecoder();
  const parsed: unknown = JSON.parse(decoder.decode(plainBuf));
  return schema.parse(parsed);
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
