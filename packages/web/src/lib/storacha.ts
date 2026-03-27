/**
 * Storacha (IPFS) client singleton for server-side use.
 *
 * Returns null when STORACHA_KEY / STORACHA_PROOF are not configured,
 * so callers can treat Storacha as a progressive enhancement.
 */
import { createLogger } from "@/lib/logger";
import { serverEnv } from "@/lib/env";
import type {
  StorachaUploadClient,
  StorachaListClient,
} from "@optimitron/storage";

const logger = createLogger("storacha");

export type StorachaProductionClient = StorachaUploadClient & StorachaListClient;

let _clientPromise: Promise<StorachaProductionClient | null> | null = null;

/** Check whether the required env vars are present (synchronous). */
export function isStorachaConfigured(): boolean {
  return Boolean(serverEnv.STORACHA_KEY && serverEnv.STORACHA_PROOF);
}

async function initClient(): Promise<StorachaProductionClient | null> {
  const key = serverEnv.STORACHA_KEY;
  const proof = serverEnv.STORACHA_PROOF;

  if (!key || !proof) {
    logger.info("STORACHA_KEY / STORACHA_PROOF not set — Storacha disabled");
    return null;
  }

  try {
    const { createServerlessClient } = await import("@optimitron/storage");
    const client = await createServerlessClient(key, proof);

    logger.info("Storacha client ready");
    return client as unknown as StorachaProductionClient;
  } catch (error) {
    logger.error("Failed to initialise Storacha client", error);
    _clientPromise = null; // allow retry on next call
    return null;
  }
}

/**
 * Lazy singleton — cached across warm function invocations.
 * Returns null if env vars are missing or initialisation fails.
 */
export async function getStorachaClient(): Promise<StorachaProductionClient | null> {
  if (!_clientPromise) {
    _clientPromise = initClient();
  }
  return _clientPromise;
}
