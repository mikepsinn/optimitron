import { PersonhoodProvider, PersonhoodVerificationStatus } from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    personhoodVerification: {
      findMany: mocks.findMany,
      upsert: mocks.upsert,
    },
  },
}));

import {
  getPersonhoodSummary,
  isPersonhoodExternalIdConflict,
  summarizePersonhoodVerifications,
  upsertPersonhoodVerification,
} from "../personhood.server";

describe("personhood server helpers", () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
    mocks.upsert.mockReset();
    vi.useRealTimers();
  });

  it("summarizes the most recent verified provider", () => {
    const earlier = new Date("2026-03-01T00:00:00.000Z");
    const later = new Date("2026-03-02T00:00:00.000Z");

    expect(
      summarizePersonhoodVerifications([
        {
          deletedAt: null,
          lastVerifiedAt: earlier,
          provider: PersonhoodProvider.HUMAN_PASSPORT,
          status: PersonhoodVerificationStatus.VERIFIED,
          verificationLevel: "score_20",
          verifiedAt: earlier,
        },
        {
          deletedAt: null,
          lastVerifiedAt: later,
          provider: PersonhoodProvider.WORLD_ID,
          status: PersonhoodVerificationStatus.VERIFIED,
          verificationLevel: "orb",
          verifiedAt: later,
        },
      ]),
    ).toEqual({
      isVerified: true,
      personhoodProvider: PersonhoodProvider.WORLD_ID,
      personhoodVerificationLevel: "orb",
      personhoodVerifiedAt: later.toISOString(),
      verifiedProviders: [PersonhoodProvider.WORLD_ID, PersonhoodProvider.HUMAN_PASSPORT],
    });
  });

  it("returns an unverified summary when no active verification exists", () => {
    expect(
      summarizePersonhoodVerifications([
        {
          deletedAt: new Date("2026-03-01T00:00:00.000Z"),
          lastVerifiedAt: new Date("2026-03-01T00:00:00.000Z"),
          provider: PersonhoodProvider.WORLD_ID,
          status: PersonhoodVerificationStatus.VERIFIED,
          verificationLevel: "orb",
          verifiedAt: new Date("2026-03-01T00:00:00.000Z"),
        },
      ]),
    ).toEqual({
      isVerified: false,
      personhoodProvider: null,
      personhoodVerificationLevel: null,
      personhoodVerifiedAt: null,
      verifiedProviders: [],
    });
  });

  it("loads and summarizes a user's verifications", async () => {
    const verifiedAt = new Date("2026-03-02T00:00:00.000Z");
    mocks.findMany.mockResolvedValue([
      {
        deletedAt: null,
        lastVerifiedAt: verifiedAt,
        provider: PersonhoodProvider.WORLD_ID,
        status: PersonhoodVerificationStatus.VERIFIED,
        verificationLevel: "orb",
        verifiedAt,
      },
    ]);

    await expect(getPersonhoodSummary("user_1")).resolves.toEqual({
      isVerified: true,
      personhoodProvider: PersonhoodProvider.WORLD_ID,
      personhoodVerificationLevel: "orb",
      personhoodVerifiedAt: verifiedAt.toISOString(),
      verifiedProviders: [PersonhoodProvider.WORLD_ID],
    });

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        deletedAt: null,
        status: PersonhoodVerificationStatus.VERIFIED,
      },
      select: {
        deletedAt: true,
        lastVerifiedAt: true,
        provider: true,
        status: true,
        verificationLevel: true,
        verifiedAt: true,
      },
      orderBy: [{ lastVerifiedAt: "desc" }],
    });
  });

  it("upserts an active verification for the user/provider pair", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-03T12:00:00.000Z"));
    mocks.upsert.mockResolvedValue({ id: "verification_1" });

    await upsertPersonhoodVerification({
      action: "verify-personhood",
      externalId: "nullifier_1",
      providerMetadata: '{"provider":"world"}',
      provider: PersonhoodProvider.WORLD_ID,
      signalHash: "hashed_signal",
      userId: "user_1",
      verificationLevel: "orb",
    });

    expect(mocks.upsert).toHaveBeenCalledWith({
      where: {
        userId_provider: {
          userId: "user_1",
          provider: PersonhoodProvider.WORLD_ID,
        },
      },
      update: {
        action: "verify-personhood",
        deletedAt: null,
        expiresAt: null,
        externalId: "nullifier_1",
        lastVerifiedAt: new Date("2026-03-03T12:00:00.000Z"),
        providerMetadata: '{"provider":"world"}',
        signalHash: "hashed_signal",
        status: PersonhoodVerificationStatus.VERIFIED,
        verificationLevel: "orb",
      },
      create: {
        action: "verify-personhood",
        expiresAt: null,
        externalId: "nullifier_1",
        providerMetadata: '{"provider":"world"}',
        provider: PersonhoodProvider.WORLD_ID,
        signalHash: "hashed_signal",
        status: PersonhoodVerificationStatus.VERIFIED,
        userId: "user_1",
        verificationLevel: "orb",
        verifiedAt: new Date("2026-03-03T12:00:00.000Z"),
        lastVerifiedAt: new Date("2026-03-03T12:00:00.000Z"),
      },
    });
  });

  it("identifies unique-constraint conflicts", () => {
    expect(isPersonhoodExternalIdConflict({ code: "P2002" })).toBe(true);
    expect(isPersonhoodExternalIdConflict({ code: "P2025" })).toBe(false);
    expect(isPersonhoodExternalIdConflict(null)).toBe(false);
  });
});
