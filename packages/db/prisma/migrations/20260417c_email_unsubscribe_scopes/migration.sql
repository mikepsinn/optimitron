-- Scoped one-click unsubscribe + Resend webhook ingestion.
-- Additive + live-safe; no locks beyond brief ALTER TABLE metadata locks.

-- AlterEnum: new activity type for unsubscribe / resubscribe events.
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'UNSUBSCRIBED';

-- AlterTable: User gets a text-array of opted-out scopes.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "unsubscribedScopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- GIN index for array-containment queries (e.g. `WHERE "unsubscribedScopes" @> ARRAY['referral_sequence']`).
CREATE INDEX IF NOT EXISTS "User_unsubscribedScopes_idx"
  ON "User" USING GIN ("unsubscribedScopes");

-- AlterTable: EmailLog learns the provider's message ID so webhook events can
-- be routed back to the right row.
ALTER TABLE "EmailLog"
  ADD COLUMN IF NOT EXISTS "providerMessageId" TEXT;

CREATE INDEX IF NOT EXISTS "EmailLog_providerMessageId_idx"
  ON "EmailLog" ("providerMessageId");
