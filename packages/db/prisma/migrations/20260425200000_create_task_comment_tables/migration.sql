-- Create the TaskComment and TaskCommentVote tables. The models were added to
-- schema.prisma in April but no migration was generated until now; the
-- subsequent task_communication_system migration assumed these tables already
-- existed and was failing on `prisma migrate deploy` against a fresh database.
-- This migration backfills the original (pre-communication-system) shape so
-- the next migration can ALTER TABLE on top of it.
--
-- IF NOT EXISTS / IF EXISTS guards keep this idempotent for environments where
-- the tables were created earlier via `prisma db push`.

-- CreateTable
CREATE TABLE IF NOT EXISTS "TaskComment" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "parentCommentId" TEXT,
  "authorUserId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "mediaUrl" TEXT,
  "mentionedUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "upvoteCount" INTEGER NOT NULL DEFAULT 0,
  "downvoteCount" INTEGER NOT NULL DEFAULT 0,
  "voteScore" INTEGER NOT NULL DEFAULT 0,
  "replyCount" INTEGER NOT NULL DEFAULT 0,
  "hotScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "path" TEXT NOT NULL DEFAULT '',
  "citationsJson" JSONB,
  "editedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "hiddenByCurator" BOOLEAN NOT NULL DEFAULT false,
  "moderationReason" TEXT,
  "moderatedByUserId" TEXT,
  "moderatedAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaskComment_taskId_createdAt_idx" ON "TaskComment"("taskId", "createdAt");
CREATE INDEX IF NOT EXISTS "TaskComment_taskId_voteScore_idx" ON "TaskComment"("taskId", "voteScore");
CREATE INDEX IF NOT EXISTS "TaskComment_taskId_hotScore_idx" ON "TaskComment"("taskId", "hotScore");
CREATE INDEX IF NOT EXISTS "TaskComment_parentCommentId_idx" ON "TaskComment"("parentCommentId");
CREATE INDEX IF NOT EXISTS "TaskComment_authorUserId_createdAt_idx" ON "TaskComment"("authorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "TaskComment_deletedAt_idx" ON "TaskComment"("deletedAt");
CREATE INDEX IF NOT EXISTS "TaskComment_path_idx" ON "TaskComment"("path");

-- AddForeignKey (idempotent via DROP IF EXISTS + ADD)
ALTER TABLE "TaskComment" DROP CONSTRAINT IF EXISTS "TaskComment_taskId_fkey";
ALTER TABLE "TaskComment"
  ADD CONSTRAINT "TaskComment_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskComment" DROP CONSTRAINT IF EXISTS "TaskComment_parentCommentId_fkey";
ALTER TABLE "TaskComment"
  ADD CONSTRAINT "TaskComment_parentCommentId_fkey"
  FOREIGN KEY ("parentCommentId") REFERENCES "TaskComment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TaskComment" DROP CONSTRAINT IF EXISTS "TaskComment_authorUserId_fkey";
ALTER TABLE "TaskComment"
  ADD CONSTRAINT "TaskComment_authorUserId_fkey"
  FOREIGN KEY ("authorUserId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskComment" DROP CONSTRAINT IF EXISTS "TaskComment_moderatedByUserId_fkey";
ALTER TABLE "TaskComment"
  ADD CONSTRAINT "TaskComment_moderatedByUserId_fkey"
  FOREIGN KEY ("moderatedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE IF NOT EXISTS "TaskCommentVote" (
  "id" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "ipHash" TEXT,
  "userAgentHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TaskCommentVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TaskCommentVote_commentId_userId_key" ON "TaskCommentVote"("commentId", "userId");
CREATE INDEX IF NOT EXISTS "TaskCommentVote_userId_idx" ON "TaskCommentVote"("userId");
CREATE INDEX IF NOT EXISTS "TaskCommentVote_commentId_createdAt_idx" ON "TaskCommentVote"("commentId", "createdAt");

-- AddForeignKey (idempotent via DROP IF EXISTS + ADD)
ALTER TABLE "TaskCommentVote" DROP CONSTRAINT IF EXISTS "TaskCommentVote_commentId_fkey";
ALTER TABLE "TaskCommentVote"
  ADD CONSTRAINT "TaskCommentVote_commentId_fkey"
  FOREIGN KEY ("commentId") REFERENCES "TaskComment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskCommentVote" DROP CONSTRAINT IF EXISTS "TaskCommentVote_userId_fkey";
ALTER TABLE "TaskCommentVote"
  ADD CONSTRAINT "TaskCommentVote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
