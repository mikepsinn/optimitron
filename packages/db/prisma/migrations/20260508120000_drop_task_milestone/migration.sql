-- Drop TaskMilestone model in favor of subtasks (Task self-relation via parentTaskId).
-- The campaign tree now expresses progress through subtasks; milestones were a redundant
-- weaker model. No data migration: confirmed empty before dropping.

-- DropForeignKey
ALTER TABLE "TaskMilestone" DROP CONSTRAINT IF EXISTS "TaskMilestone_taskId_fkey";
ALTER TABLE "TaskMilestone" DROP CONSTRAINT IF EXISTS "TaskMilestone_verifiedByUserId_fkey";

-- DropTable
DROP TABLE IF EXISTS "TaskMilestone";

-- DropEnum
DROP TYPE IF EXISTS "TaskMilestoneStatus";
