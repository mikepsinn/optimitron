-- Enforce inbound idempotency on TaskCommunication at the DB layer.
--
-- The inbound-email reply webhook can be retried by the provider (Resend
-- retries on 5xx; concurrent deliveries are also possible). The application
-- code performs a check-then-insert pattern, but without a DB-enforced
-- unique constraint two concurrent webhook deliveries could both pass the
-- check and create duplicate TaskComment + TaskCommunication rows for the
-- same inbound email.
--
-- This migration adds a unique constraint on `providerMessageId`. Postgres
-- treats NULLs as distinct in unique indexes by default, so multiple
-- OUTBOUND rows with NULL providerMessageId still coexist — only non-null
-- values must be unique. The application code can now use a try/catch on
-- Prisma's P2002 (unique violation) as the idempotency check.

CREATE UNIQUE INDEX "TaskCommunication_providerMessageId_key"
  ON "TaskCommunication"("providerMessageId");
