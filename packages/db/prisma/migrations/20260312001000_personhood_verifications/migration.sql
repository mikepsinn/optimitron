CREATE TYPE "PersonhoodProvider" AS ENUM ('WORLD_ID', 'HUMAN_PASSPORT');

CREATE TYPE "PersonhoodVerificationStatus" AS ENUM ('VERIFIED', 'REVOKED');

CREATE TABLE "PersonhoodVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PersonhoodProvider" NOT NULL,
    "status" "PersonhoodVerificationStatus" NOT NULL DEFAULT 'VERIFIED',
    "externalId" TEXT NOT NULL,
    "action" TEXT,
    "verificationLevel" TEXT,
    "signalHash" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PersonhoodVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PersonhoodVerification_provider_externalId_key" ON "PersonhoodVerification"("provider", "externalId");
CREATE UNIQUE INDEX "PersonhoodVerification_userId_provider_key" ON "PersonhoodVerification"("userId", "provider");
CREATE INDEX "PersonhoodVerification_userId_status_idx" ON "PersonhoodVerification"("userId", "status");
CREATE INDEX "PersonhoodVerification_provider_status_idx" ON "PersonhoodVerification"("provider", "status");
CREATE INDEX "PersonhoodVerification_verifiedAt_idx" ON "PersonhoodVerification"("verifiedAt");
CREATE INDEX "PersonhoodVerification_deletedAt_idx" ON "PersonhoodVerification"("deletedAt");

ALTER TABLE "PersonhoodVerification"
ADD CONSTRAINT "PersonhoodVerification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
