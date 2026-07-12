-- Preserve the useful plain-language explanation before removing the legacy
-- context block that mislabeled assignee authority as task difficulty.
UPDATE "Task"
SET "impactStatement" = COALESCE(
  NULLIF(BTRIM("impactStatement"), ''),
  NULLIF(BTRIM("contextJson"->'difficulty'->>'whatItMeans'), '')
)
WHERE "contextJson" IS NOT NULL
  AND jsonb_typeof("contextJson") = 'object'
  AND "contextJson" ? 'difficulty';

UPDATE "Task"
SET "contextJson" = CASE
  WHEN ("contextJson" - 'difficulty') = '{}'::jsonb THEN NULL
  ELSE "contextJson" - 'difficulty'
END
WHERE "contextJson" IS NOT NULL
  AND jsonb_typeof("contextJson") = 'object'
  AND "contextJson" ? 'difficulty';

DROP INDEX IF EXISTS "User_maxTaskDifficulty_idx";
DROP INDEX IF EXISTS "Task_difficulty_idx";

ALTER TABLE "User" DROP COLUMN "maxTaskDifficulty";
ALTER TABLE "Task" DROP COLUMN "difficulty";
ALTER TABLE "TaskSpawnSpec" DROP COLUMN "difficulty";

DROP TYPE "TaskDifficulty";
