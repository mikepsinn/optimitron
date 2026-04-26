-- Backfill the OAuth tables that supported the MCP remote server. They were
-- added to schema.prisma but only ever materialized via `prisma db push`, so a
-- fresh database (CI, new dev) had no way to create them. Tests didn't notice
-- because nothing in the suite touches OAuth, but the next migration ALTERs
-- these columns and would fail on a clean DB without this backfill.
--
-- Idempotent: prod already has these tables from the original db push.

CREATE TABLE IF NOT EXISTS "OAuthClient" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "clientName" TEXT,
  "redirectUris" TEXT[],
  "grantTypes" TEXT[] DEFAULT ARRAY['authorization_code','refresh_token']::TEXT[],
  "scope" TEXT,
  "clientUri" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OAuthClient_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OAuthClient_clientId_key" ON "OAuthClient"("clientId");

CREATE TABLE IF NOT EXISTS "OAuthAuthCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "redirectUri" TEXT NOT NULL,
  "codeChallenge" TEXT NOT NULL,
  "scopes" TEXT[],
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "used" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OAuthAuthCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OAuthAuthCode_code_key" ON "OAuthAuthCode"("code");
CREATE INDEX IF NOT EXISTS "OAuthAuthCode_clientId_idx" ON "OAuthAuthCode"("clientId");
CREATE INDEX IF NOT EXISTS "OAuthAuthCode_userId_idx" ON "OAuthAuthCode"("userId");
CREATE INDEX IF NOT EXISTS "OAuthAuthCode_expiresAt_idx" ON "OAuthAuthCode"("expiresAt");

ALTER TABLE "OAuthAuthCode" DROP CONSTRAINT IF EXISTS "OAuthAuthCode_clientId_fkey";
ALTER TABLE "OAuthAuthCode"
  ADD CONSTRAINT "OAuthAuthCode_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "OAuthClient"("clientId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OAuthAuthCode" DROP CONSTRAINT IF EXISTS "OAuthAuthCode_userId_fkey";
ALTER TABLE "OAuthAuthCode"
  ADD CONSTRAINT "OAuthAuthCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "OAuthGrant" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scopes" TEXT[],
  "refreshTokenHash" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),

  CONSTRAINT "OAuthGrant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OAuthGrant_refreshTokenHash_key" ON "OAuthGrant"("refreshTokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "OAuthGrant_clientId_userId_key" ON "OAuthGrant"("clientId", "userId");
CREATE INDEX IF NOT EXISTS "OAuthGrant_clientId_idx" ON "OAuthGrant"("clientId");
CREATE INDEX IF NOT EXISTS "OAuthGrant_userId_idx" ON "OAuthGrant"("userId");
CREATE INDEX IF NOT EXISTS "OAuthGrant_refreshTokenHash_idx" ON "OAuthGrant"("refreshTokenHash");

ALTER TABLE "OAuthGrant" DROP CONSTRAINT IF EXISTS "OAuthGrant_clientId_fkey";
ALTER TABLE "OAuthGrant"
  ADD CONSTRAINT "OAuthGrant_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "OAuthClient"("clientId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OAuthGrant" DROP CONSTRAINT IF EXISTS "OAuthGrant_userId_fkey";
ALTER TABLE "OAuthGrant"
  ADD CONSTRAINT "OAuthGrant_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
