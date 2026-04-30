-- Add cron-style scheduling to TaskTrigger
ALTER TABLE "TaskTrigger" ADD COLUMN "schedule" TEXT;
ALTER TABLE "TaskTrigger" ADD COLUMN "iterationSource" TEXT;

-- Add per-spec sendCount-range gating to TaskCommunicationSpawnSpec
ALTER TABLE "TaskCommunicationSpawnSpec" ADD COLUMN "minSendCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TaskCommunicationSpawnSpec" ADD COLUMN "maxSendCount" INTEGER;

-- Partial index supporting "find triggers due to fire" queries.
CREATE INDEX "TaskTrigger_enabled_schedule_idx"
  ON "TaskTrigger"("enabled", "schedule")
  WHERE "schedule" IS NOT NULL;
