import {
  PersonhoodProvider,
  PersonhoodVerificationStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PersonhoodVerificationSummaryRecord = {
  deletedAt: Date | null;
  lastVerifiedAt: Date;
  provider: PersonhoodProvider;
  status: PersonhoodVerificationStatus;
  verificationLevel: string | null;
  verifiedAt: Date;
};

export interface PersonhoodSummary {
  isVerified: boolean;
  personhoodProvider: PersonhoodProvider | null;
  personhoodVerifiedAt: string | null;
  personhoodVerificationLevel: string | null;
  verifiedProviders: PersonhoodProvider[];
}

export function summarizePersonhoodVerifications(
  verifications: PersonhoodVerificationSummaryRecord[],
): PersonhoodSummary {
  const verified = verifications
    .filter(
      (verification) =>
        verification.status === PersonhoodVerificationStatus.VERIFIED && !verification.deletedAt,
    )
    .sort((left, right) => right.lastVerifiedAt.getTime() - left.lastVerifiedAt.getTime());

  if (verified.length === 0) {
    return {
      isVerified: false,
      personhoodProvider: null,
      personhoodVerifiedAt: null,
      personhoodVerificationLevel: null,
      verifiedProviders: [],
    };
  }

  const primary = verified[0];

  return {
    isVerified: true,
    personhoodProvider: primary.provider,
    personhoodVerifiedAt: primary.verifiedAt.toISOString(),
    personhoodVerificationLevel: primary.verificationLevel,
    verifiedProviders: Array.from(new Set(verified.map((verification) => verification.provider))),
  };
}

export async function getPersonhoodSummary(userId: string) {
  const verifications = await prisma.personhoodVerification.findMany({
    where: {
      userId,
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

  return summarizePersonhoodVerifications(verifications);
}

interface UpsertPersonhoodVerificationInput {
  action?: string | null;
  expiresAt?: Date | null;
  externalId: string;
  metadataJson?: string | null;
  provider: PersonhoodProvider;
  signalHash?: string | null;
  userId: string;
  verificationLevel?: string | null;
}

export async function upsertPersonhoodVerification({
  action,
  expiresAt,
  externalId,
  metadataJson,
  provider,
  signalHash,
  userId,
  verificationLevel,
}: UpsertPersonhoodVerificationInput) {
  const now = new Date();

  return prisma.personhoodVerification.upsert({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
    update: {
      action: action ?? null,
      deletedAt: null,
      expiresAt: expiresAt ?? null,
      externalId,
      lastVerifiedAt: now,
      metadataJson: metadataJson ?? null,
      signalHash: signalHash ?? null,
      status: PersonhoodVerificationStatus.VERIFIED,
      verificationLevel: verificationLevel ?? null,
    },
    create: {
      action: action ?? null,
      expiresAt: expiresAt ?? null,
      externalId,
      metadataJson: metadataJson ?? null,
      provider,
      signalHash: signalHash ?? null,
      status: PersonhoodVerificationStatus.VERIFIED,
      userId,
      verificationLevel: verificationLevel ?? null,
      verifiedAt: now,
      lastVerifiedAt: now,
    },
  });
}

export function isPersonhoodExternalIdConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as Prisma.PrismaClientKnownRequestError).code === "P2002"
  );
}
