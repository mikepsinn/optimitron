CREATE TABLE "EmailSuppression" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailSuppression_email_scope_key" ON "EmailSuppression"("email", "scope");

CREATE INDEX "EmailSuppression_email_idx" ON "EmailSuppression"("email");

-- Backfill from opt-outs recorded before this table existed.
--
-- Until now the only opt-out signal for a recipient without an account was a
-- CANCELLED TaskCommunication carrying `metadataJson.optOut`, which
-- `findExternalOptOut` re-derived on every send. Those people have already
-- asked not to be contacted, so they must survive the move to the new store.
--
-- Everything backfills to scope 'all' on purpose. The old signal was scoped by
-- audience + purpose and there is no faithful mapping onto the scope registry;
-- over-suppressing is the safe direction for an opt-out, and a person who wants
-- less suppression can re-subscribe. Under-suppressing would mail someone who
-- said no.
--
-- The errorMessage clause mirrors `isExplicitOptOut`, which treats an
-- errorMessage containing "unsubscribed" as an opt-out even when the metadata
-- flag is absent.
INSERT INTO "EmailSuppression" ("id", "email", "scope", "source", "reason", "createdAt")
SELECT
    gen_random_uuid()::text,
    lower(btrim("recipientEmail")),
    'all',
    'reply',
    'Backfilled from cancelled TaskCommunication opt-out',
    COALESCE(MIN("cancelledAt"), CURRENT_TIMESTAMP)
FROM "TaskCommunication"
WHERE "recipientEmail" IS NOT NULL
  AND btrim("recipientEmail") <> ''
  AND "deletedAt" IS NULL
  AND "status" = 'CANCELLED'
  AND (
        "metadataJson" ->> 'optOut' = 'true'
        OR lower(COALESCE("errorMessage", '')) LIKE '%unsubscribed%'
      )
GROUP BY lower(btrim("recipientEmail"))
ON CONFLICT ("email", "scope") DO NOTHING;
