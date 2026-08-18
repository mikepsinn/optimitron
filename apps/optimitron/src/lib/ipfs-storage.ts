/**
 * IPFS storage client singleton for server-side use.
 *
 * Supports Storacha and Pinata, selected by env vars.
 */
import { createLogger } from "@/lib/logger";
import { serverEnv } from "@/lib/env";
import type {
  GatewayUrlBuilder,
  StorachaUploadClient,
  StorachaListClient,
} from "@optimitron/storage";

const logger = createLogger("ipfs-storage");

export type IpfsStorageProvider = "storacha" | "pinata";
export type IpfsStorageClient = StorachaUploadClient &
  StorachaListClient & {
    gatewayUrlBuilder?: GatewayUrlBuilder;
    provider?: IpfsStorageProvider;
  };

let _clientPromise: Promise<IpfsStorageClient | null> | null = null;

function hasStorachaConfig(): boolean {
  return Boolean(serverEnv.STORACHA_KEY && serverEnv.STORACHA_PROOF);
}

function hasPinataConfig(): boolean {
  return Boolean(serverEnv.PINATA_JWT);
}

export function getIpfsStorageProvider(): IpfsStorageProvider | null {
  if (serverEnv.IPFS_STORAGE_PROVIDER === "storacha") {
    return hasStorachaConfig() ? "storacha" : null;
  }

  if (serverEnv.IPFS_STORAGE_PROVIDER === "pinata") {
    return hasPinataConfig() ? "pinata" : null;
  }

  if (hasStorachaConfig()) {
    return "storacha";
  }

  if (hasPinataConfig()) {
    return "pinata";
  }

  return null;
}

/** Check whether an IPFS storage provider is available (synchronous). */
export function isIpfsStorageConfigured(): boolean {
  return getIpfsStorageProvider() !== null;
}

export async function getIpfsStorageGatewayUrlBuilder(): Promise<GatewayUrlBuilder> {
  const provider = getIpfsStorageProvider();
  const { buildPinataGatewayUrl, buildStorachaGatewayUrl } = await import("@optimitron/storage");

  if (provider === "pinata") {
    return (cid) => buildPinataGatewayUrl(cid, serverEnv.PINATA_GATEWAY);
  }

  return buildStorachaGatewayUrl;
}

export async function buildIpfsStorageGatewayUrl(cid: string): Promise<string> {
  const builder = await getIpfsStorageGatewayUrlBuilder();
  return builder(cid);
}

async function initClient(): Promise<IpfsStorageClient | null> {
  const provider = getIpfsStorageProvider();

  if (!provider) {
    logger.info("No IPFS storage provider configured — storage disabled");
    return null;
  }

  try {
    if (provider === "storacha") {
      const key = serverEnv.STORACHA_KEY;
      const proof = serverEnv.STORACHA_PROOF;
      if (!key || !proof) {
        logger.warn("IPFS provider set to Storacha, but STORACHA_KEY / STORACHA_PROOF are missing");
        return null;
      }

      const { createServerlessClient, buildStorachaGatewayUrl } = await import("@optimitron/storage");
      const client = await createServerlessClient(key, proof);

      logger.info("Storacha client ready");
      return {
        ...(client as unknown as IpfsStorageClient),
        provider,
        gatewayUrlBuilder: buildStorachaGatewayUrl,
      };
    }

    const jwt = serverEnv.PINATA_JWT;
    if (!jwt) {
      logger.warn("IPFS provider set to Pinata, but PINATA_JWT is missing");
      return null;
    }

    const { createPinataClient } = await import("@optimitron/storage");
    const client = await createPinataClient({
      pinataJwt: jwt,
      pinataGateway: serverEnv.PINATA_GATEWAY,
    });

    logger.info("Pinata client ready");
    return client as IpfsStorageClient;
  } catch (error) {
    logger.error("Failed to initialise IPFS storage client", error);
    _clientPromise = null; // allow retry on next call
    return null;
  }
}

/**
 * Lazy singleton — cached across warm function invocations.
 * Returns null if env vars are missing or initialisation fails.
 */
export async function getIpfsStorageClient(): Promise<IpfsStorageClient | null> {
  if (!_clientPromise) {
    _clientPromise = initClient();
  }
  return _clientPromise;
}
