import { PersonhoodProvider } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WorldIdVerificationPayload } from "../world-id";

const mocks = vi.hoisted(() => ({
  hashSignal: vi.fn(),
  signRequest: vi.fn(),
  upsertPersonhoodVerification: vi.fn(),
}));

vi.mock("@worldcoin/idkit/hashing", () => ({
  hashSignal: mocks.hashSignal,
}));

vi.mock("@worldcoin/idkit/signing", () => ({
  signRequest: mocks.signRequest,
}));

vi.mock("@/lib/personhood.server", () => ({
  upsertPersonhoodVerification: mocks.upsertPersonhoodVerification,
}));

import {
  createWorldIdRequestPayload,
  getWorldIdSignal,
  isWorldIdConfigured,
  verifyAndSaveWorldIdResult,
} from "../world-id.server";

describe("world id server helpers", () => {
  beforeEach(() => {
    mocks.hashSignal.mockReset();
    mocks.signRequest.mockReset();
    mocks.upsertPersonhoodVerification.mockReset();
    mocks.hashSignal.mockImplementation((signal: string) => `hash:${signal}`);
    mocks.signRequest.mockReturnValue({
      nonce: "nonce_1",
      createdAt: 1000,
      expiresAt: 1300,
      sig: "signed_request",
    });
    mocks.upsertPersonhoodVerification.mockResolvedValue({ id: "verification_1" });
    vi.stubEnv("WORLD_ID_APP_ID", "app_test_world");
    vi.stubEnv("WORLD_ID_RP_ID", "app_test_rp");
    vi.stubEnv("WORLD_ID_SIGNING_KEY", "signing_key");
    vi.stubEnv("WORLD_ID_ACTION", "verify-personhood");
    vi.stubEnv("WORLD_ID_ENVIRONMENT", "staging");
    vi.stubEnv("WORLD_ID_REQUEST_TTL_SECONDS", "300");
    vi.stubEnv("WORLD_ID_ALLOW_LEGACY_PROOFS", "true");
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reports whether the World ID server config is present", () => {
    expect(isWorldIdConfigured()).toBe(true);

    vi.stubEnv("WORLD_ID_SIGNING_KEY", "");
    expect(isWorldIdConfigured()).toBe(false);
  });

  it("builds a signed request payload for the current user", () => {
    expect(createWorldIdRequestPayload("user_1")).toEqual({
      app_id: "app_test_world",
      action: "verify-personhood",
      allow_legacy_proofs: true,
      environment: "staging",
      rp_context: {
        rp_id: "app_test_rp",
        nonce: "nonce_1",
        created_at: 1000,
        expires_at: 1300,
        signature: "signed_request",
      },
      signal: "personhood:user_1",
    });

    expect(mocks.signRequest).toHaveBeenCalledWith(
      "verify-personhood",
      "signing_key",
      300,
    );
  });

  it("returns the user-bound World ID signal", () => {
    expect(getWorldIdSignal("user_1")).toBe("personhood:user_1");
  });

  it("verifies the proof with World and stores the verification", async () => {
    const result = {
      action: "verify-personhood",
      environment: "staging",
      protocol_version: "1",
      nonce: "nonce_1",
      responses: [
        {
          identifier: "orb",
          nullifier: "nullifier_1",
          proof: "proof_1",
          signal_hash: "hash:personhood:user_1",
        },
      ],
    } as unknown as WorldIdVerificationPayload;

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    await expect(verifyAndSaveWorldIdResult("user_1", result)).resolves.toEqual({
      provider: PersonhoodProvider.WORLD_ID,
      verificationLevel: "orb",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://developer.world.org/api/v4/verify/app_test_rp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      },
    );
    expect(mocks.upsertPersonhoodVerification).toHaveBeenCalledWith({
      action: "verify-personhood",
      externalId: "nullifier_1",
      metadataJson: JSON.stringify({
        environment: "staging",
        protocolVersion: "1",
        responses: ["orb"],
      }),
      provider: PersonhoodProvider.WORLD_ID,
      signalHash: "hash:personhood:user_1",
      userId: "user_1",
      verificationLevel: "orb",
    });
  });

  it("rejects proofs that are not bound to the current user", async () => {
    const result = {
      action: "verify-personhood",
      environment: "staging",
      nonce: "nonce_1",
      responses: [
        {
          identifier: "orb",
          nullifier: "nullifier_1",
          proof: "proof_1",
          signal_hash: "hash:personhood:someone_else",
        },
      ],
    } as unknown as WorldIdVerificationPayload;

    await expect(verifyAndSaveWorldIdResult("user_1", result)).rejects.toThrow(
      "World ID signal hash mismatch.",
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mocks.upsertPersonhoodVerification).not.toHaveBeenCalled();
  });
});
