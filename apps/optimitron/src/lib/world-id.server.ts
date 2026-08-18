import { serverEnv } from "@/lib/env";
import type { IDKitResult } from "@worldcoin/idkit";
import { hashSignal } from "@worldcoin/idkit/hashing";
import { signRequest } from "@worldcoin/idkit/signing";
import { PersonhoodProvider } from "@optimitron/db";
import { upsertPersonhoodVerification } from "@/lib/personhood.server";
import type { WorldIdRequestPayload } from "@/lib/world-id";

type WorldIdResponseItem =
  | {
      identifier: string;
      nullifier: string;
      proof: string;
      signal_hash?: string;
    }
  | {
      identifier: string;
      nullifier: string;
      proof: string[];
      signal_hash?: string;
    };

function getWorldIdEnvironment(): "production" | "staging" {
  return serverEnv.WORLD_ID_ENVIRONMENT === "production" ? "production" : "staging";
}

function getWorldIdAction() {
  return serverEnv.WORLD_ID_ACTION ?? "verify-personhood";
}

function getWorldIdAllowLegacyProofs() {
  return serverEnv.WORLD_ID_ALLOW_LEGACY_PROOFS !== "false";
}

function getWorldIdRequestTtlSeconds() {
  const rawValue = Number(serverEnv.WORLD_ID_REQUEST_TTL_SECONDS);
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 300;
}

function getWorldIdConfig() {
  const appId = serverEnv.WORLD_ID_APP_ID;
  const rpId = serverEnv.WORLD_ID_RP_ID;
  const signingKey = serverEnv.WORLD_ID_SIGNING_KEY;

  if (!appId || !rpId || !signingKey) {
    throw new Error("World ID is not configured.");
  }

  return {
    action: getWorldIdAction(),
    allowLegacyProofs: getWorldIdAllowLegacyProofs(),
    appId: appId as `app_${string}`,
    environment: getWorldIdEnvironment(),
    rpId,
    signingKey,
    ttlSeconds: getWorldIdRequestTtlSeconds(),
  };
}

export function isWorldIdConfigured() {
  return Boolean(
    serverEnv.WORLD_ID_APP_ID && serverEnv.WORLD_ID_RP_ID && serverEnv.WORLD_ID_SIGNING_KEY,
  );
}

export function getWorldIdSignal(userId: string) {
  return `personhood:${userId}`;
}

export function createWorldIdRequestPayload(userId: string): WorldIdRequestPayload {
  const config = getWorldIdConfig();
  const signature = signRequest(config.action, config.signingKey, config.ttlSeconds);

  return {
    app_id: config.appId,
    action: config.action,
    allow_legacy_proofs: config.allowLegacyProofs,
    environment: config.environment,
    rp_context: {
      rp_id: config.rpId,
      nonce: signature.nonce,
      created_at: signature.createdAt,
      expires_at: signature.expiresAt,
      signature: signature.sig,
    },
    signal: getWorldIdSignal(userId),
  };
}

type WorldIdProofResult = IDKitResult & {
  action: string;
  environment: "production" | "staging";
  protocol_version?: string;
  responses: WorldIdResponseItem[];
};

function isWorldIdProofResult(result: IDKitResult): result is WorldIdProofResult {
  return (
    typeof (result as { action?: unknown }).action === "string" &&
    Array.isArray((result as { responses?: unknown }).responses)
  );
}

function getPrimaryResponseItem(result: IDKitResult): WorldIdResponseItem {
  if (!isWorldIdProofResult(result)) {
    throw new Error("World ID session proofs are not supported for personhood verification.");
  }

  if (!result.responses.length) {
    throw new Error("World ID verification returned no responses.");
  }

  const response = result.responses[0];
  if (!("nullifier" in response)) {
    throw new Error("World ID verification response is missing a nullifier.");
  }

  return response;
}

function ensureWorldIdResultMatchesUser(result: IDKitResult, userId: string) {
  if (!isWorldIdProofResult(result)) {
    throw new Error("World ID session proofs are not supported for personhood verification.");
  }

  const config = getWorldIdConfig();
  if (result.action !== config.action) {
    throw new Error("World ID action mismatch.");
  }

  if (result.environment !== config.environment) {
    throw new Error("World ID environment mismatch.");
  }

  const primaryResponse = getPrimaryResponseItem(result);
  const expectedSignalHash = hashSignal(getWorldIdSignal(userId));

  if (primaryResponse.signal_hash !== expectedSignalHash) {
    throw new Error("World ID signal hash mismatch.");
  }

  return {
    expectedSignalHash,
    primaryResponse,
    result,
  };
}

async function verifyWorldIdWithProvider(result: IDKitResult) {
  const config = getWorldIdConfig();
  const response = await fetch(`https://developer.world.org/api/v4/verify/${config.rpId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result),
  });

  const payload = (await response.json().catch(() => null)) as
    | { detail?: string; success?: boolean }
    | null;

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.detail ?? "World ID verification failed.");
  }
}

export async function verifyAndSaveWorldIdResult(userId: string, result: IDKitResult) {
  const {
    expectedSignalHash,
    primaryResponse,
    result: verifiedResult,
  } = ensureWorldIdResultMatchesUser(result, userId);
  await verifyWorldIdWithProvider(result);

  const providerMetadata = JSON.stringify({
    environment: verifiedResult.environment,
    protocolVersion: verifiedResult.protocol_version,
    responses: verifiedResult.responses.map((response) => response.identifier),
  });

  await upsertPersonhoodVerification({
    action: verifiedResult.action,
    externalId: primaryResponse.nullifier,
    providerMetadata,
    provider: PersonhoodProvider.WORLD_ID,
    signalHash: expectedSignalHash,
    userId,
    verificationLevel: primaryResponse.identifier,
  });

  return {
    provider: PersonhoodProvider.WORLD_ID,
    verificationLevel: primaryResponse.identifier,
  };
}
