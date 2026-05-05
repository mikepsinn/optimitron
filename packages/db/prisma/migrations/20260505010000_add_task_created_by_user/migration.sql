ALTER TABLE "Task" ADD COLUMN "createdByUserId" TEXT;

WITH fallback_user AS (
  SELECT "id"
  FROM "User"
  WHERE "deletedAt" IS NULL
  ORDER BY "isSystem" ASC, "isAdmin" DESC, "createdAt" ASC
  LIMIT 1
)
UPDATE "Task"
SET "createdByUserId" = COALESCE(
  "ownerUserId",
  "verifiedByUserId",
  (SELECT "id" FROM fallback_user)
)
WHERE "createdByUserId" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Task" WHERE "createdByUserId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot backfill Task.createdByUserId because Task rows exist but no User fallback exists.';
  END IF;
END $$;

ALTER TABLE "Task" ALTER COLUMN "createdByUserId" SET NOT NULL;

CREATE INDEX "Task_createdByUserId_idx" ON "Task"("createdByUserId");
CREATE INDEX "Task_createdByUserId_status_availableAt_idx" ON "Task"("createdByUserId", "status", "availableAt");

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Task" DROP COLUMN "ownerUserId";

ALTER TABLE "TaskSpawnSpec" RENAME COLUMN "ownerResolver" TO "creatorResolver";

UPDATE "TaskCommunicationSpawnSpec"
SET "audienceResolver" = 'CREATOR'
WHERE "audienceResolver" = 'OWNER';
