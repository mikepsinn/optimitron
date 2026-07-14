-- Repair databases where the original Document migration was recorded before
-- its soft-delete column and index were present.
ALTER TABLE "Document"
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Document_deletedAt_idx"
ON "Document"("deletedAt");
