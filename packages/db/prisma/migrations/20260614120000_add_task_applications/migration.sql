-- CreateEnum
CREATE TYPE "TaskKind" AS ENUM ('TASK', 'ROLE_OPENING', 'PROJECT', 'BOUNTY', 'VOLUNTEER_ROLE');

-- CreateEnum
CREATE TYPE "TaskEngagementKind" AS ENUM ('ONE_OFF', 'ONGOING', 'PART_TIME', 'FULL_TIME', 'CONTRACT');

-- CreateEnum
CREATE TYPE "TaskApplicationPolicy" AS ENUM ('CLOSED', 'OPEN', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "TaskApplicationStatus" AS ENUM ('APPLIED', 'INVITED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskApplicationEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'REVIEWED', 'COMMENTED', 'INVITED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "Task"
ADD COLUMN "kind" "TaskKind" NOT NULL DEFAULT 'TASK',
ADD COLUMN "engagementKind" "TaskEngagementKind" NOT NULL DEFAULT 'ONE_OFF',
ADD COLUMN "applicationPolicy" "TaskApplicationPolicy" NOT NULL DEFAULT 'CLOSED';

-- AlterTable
ALTER TABLE "TaskComment"
ADD COLUMN "taskApplicationId" TEXT;

-- CreateTable
CREATE TABLE "TaskApplication" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT,
    "taskId" TEXT NOT NULL,
    "applicantUserId" TEXT,
    "applicantPersonId" TEXT,
    "reviewerUserId" TEXT,
    "status" "TaskApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "applicationMessage" TEXT,
    "answersJson" JSONB,
    "applicantNameSnapshot" TEXT,
    "applicantEmailSnapshot" TEXT,
    "reviewScore" INTEGER,
    "reviewNote" TEXT,
    "metadata" JSONB,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "offeredAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskApplicationEvent" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT,
    "applicationId" TEXT NOT NULL,
    "eventType" "TaskApplicationEventType" NOT NULL,
    "fromStatus" "TaskApplicationStatus",
    "toStatus" "TaskApplicationStatus",
    "actorUserId" TEXT,
    "note" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_applicationPolicy_status_idx" ON "Task"("applicationPolicy", "status");

-- CreateIndex
CREATE INDEX "Task_kind_status_idx" ON "Task"("kind", "status");

-- CreateIndex
CREATE INDEX "Task_engagementKind_idx" ON "Task"("engagementKind");

-- CreateIndex
CREATE UNIQUE INDEX "TaskApplication_taskId_applicantUserId_key" ON "TaskApplication"("taskId", "applicantUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskApplication_taskId_applicantPersonId_key" ON "TaskApplication"("taskId", "applicantPersonId");

-- CreateIndex
CREATE INDEX "TaskApplication_jurisdictionId_status_idx" ON "TaskApplication"("jurisdictionId", "status");

-- CreateIndex
CREATE INDEX "TaskApplication_taskId_status_appliedAt_idx" ON "TaskApplication"("taskId", "status", "appliedAt");

-- CreateIndex
CREATE INDEX "TaskApplication_applicantUserId_status_idx" ON "TaskApplication"("applicantUserId", "status");

-- CreateIndex
CREATE INDEX "TaskApplication_applicantPersonId_status_idx" ON "TaskApplication"("applicantPersonId", "status");

-- CreateIndex
CREATE INDEX "TaskApplication_reviewerUserId_status_idx" ON "TaskApplication"("reviewerUserId", "status");

-- CreateIndex
CREATE INDEX "TaskApplication_deletedAt_idx" ON "TaskApplication"("deletedAt");

-- CreateIndex
CREATE INDEX "TaskApplicationEvent_jurisdictionId_eventType_createdAt_idx" ON "TaskApplicationEvent"("jurisdictionId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "TaskApplicationEvent_applicationId_createdAt_idx" ON "TaskApplicationEvent"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskApplicationEvent_actorUserId_createdAt_idx" ON "TaskApplicationEvent"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskApplicationEvent_eventType_createdAt_idx" ON "TaskApplicationEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "TaskApplicationEvent_deletedAt_idx" ON "TaskApplicationEvent"("deletedAt");

-- CreateIndex
CREATE INDEX "TaskComment_taskApplicationId_createdAt_idx" ON "TaskComment"("taskApplicationId", "createdAt");

-- AddForeignKey
ALTER TABLE "TaskApplication" ADD CONSTRAINT "TaskApplication_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplication" ADD CONSTRAINT "TaskApplication_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplication" ADD CONSTRAINT "TaskApplication_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplication" ADD CONSTRAINT "TaskApplication_applicantPersonId_fkey" FOREIGN KEY ("applicantPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplication" ADD CONSTRAINT "TaskApplication_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplicationEvent" ADD CONSTRAINT "TaskApplicationEvent_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplicationEvent" ADD CONSTRAINT "TaskApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TaskApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplicationEvent" ADD CONSTRAINT "TaskApplicationEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskApplicationId_fkey" FOREIGN KEY ("taskApplicationId") REFERENCES "TaskApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
