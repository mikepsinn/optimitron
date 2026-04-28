-- Add first-class task scheduling semantics for personal next-action ranking.

CREATE TYPE "TaskDeadlinePolicy" AS ENUM ('NONE', 'SOFT', 'EXPIRES', 'REQUIRED');

ALTER TABLE "Task"
  ADD COLUMN "availableAt" TIMESTAMP(3),
  ADD COLUMN "deadlinePolicy" "TaskDeadlinePolicy" NOT NULL DEFAULT 'NONE';

UPDATE "Task"
SET "deadlinePolicy" = CASE
  WHEN lower(COALESCE("contextJson"->>'deadline_policy', "contextJson"->>'deadlinePolicy', '')) IN ('required', 'hard', 'must', 'must_do', 'must-do') THEN 'REQUIRED'::"TaskDeadlinePolicy"
  WHEN lower(COALESCE("contextJson"->>'deadline_policy', "contextJson"->>'deadlinePolicy', '')) IN ('expires', 'expire', 'expiring', 'deadline') THEN 'EXPIRES'::"TaskDeadlinePolicy"
  WHEN lower(COALESCE("contextJson"->>'deadline_policy', "contextJson"->>'deadlinePolicy', '')) = 'soft' THEN 'SOFT'::"TaskDeadlinePolicy"
  WHEN lower(COALESCE("contextJson"->>'deadline_policy', "contextJson"->>'deadlinePolicy', '')) = 'none' THEN 'NONE'::"TaskDeadlinePolicy"
  WHEN "dueAt" IS NOT NULL THEN 'SOFT'::"TaskDeadlinePolicy"
  ELSE 'NONE'::"TaskDeadlinePolicy"
END;

CREATE INDEX "Task_availableAt_idx" ON "Task"("availableAt");
CREATE INDEX "Task_deadlinePolicy_dueAt_idx" ON "Task"("deadlinePolicy", "dueAt");
CREATE INDEX "Task_ownerUserId_status_availableAt_idx" ON "Task"("ownerUserId", "status", "availableAt");
