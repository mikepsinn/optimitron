CREATE TABLE "OutboundMessageGate" (
    "id" TEXT NOT NULL,
    "stopAllOutbound" BOOLEAN NOT NULL DEFAULT false,
    "allowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reason" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OutboundMessageGate_pkey" PRIMARY KEY ("id")
);

-- Seed the single row so the send boundary reads a configured gate instead of
-- an empty table. Sending stays on; this is an emergency stop, not an enable.
INSERT INTO "OutboundMessageGate" ("id", "stopAllOutbound", "allowlist", "updatedAt")
VALUES ('global', false, ARRAY[]::TEXT[], CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
