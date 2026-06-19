-- CreateEnum
CREATE TYPE "TaskKind" AS ENUM ('TASK', 'ROLE_OPENING', 'PROJECT', 'BOUNTY', 'VOLUNTEER_ROLE');

-- CreateEnum
CREATE TYPE "TaskEngagementKind" AS ENUM ('ONE_OFF', 'ONGOING', 'PART_TIME', 'FULL_TIME', 'CONTRACT');

-- CreateEnum
CREATE TYPE "TaskCompensationKind" AS ENUM ('UNSPECIFIED', 'VOLUNTEER', 'PAID', 'BOUNTY', 'EQUITY', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskCompensationCadence" AS ENUM ('FIXED', 'HOURLY', 'WEEKLY', 'MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "TaskRemotePolicy" AS ENUM ('UNSPECIFIED', 'REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "TaskExecutionMode" AS ENUM ('HUMAN_OR_AGENT', 'HUMAN_ONLY', 'AGENT_ONLY');

-- CreateEnum
CREATE TYPE "TaskCandidateKind" AS ENUM ('USER', 'PERSON', 'ORGANIZATION', 'AGENT', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "TaskCandidateMatchStatus" AS ENUM ('SUGGESTED', 'CONTACTED', 'DECLINED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TaskExecutionAttemptStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AgentExecutorStatus" AS ENUM ('ACTIVE', 'PAUSED', 'RETIRED');

-- CreateEnum
CREATE TYPE "TaskMarketplaceListingKind" AS ENUM ('TASK_POSTING', 'FEATURED_PLACEMENT');

-- CreateEnum
CREATE TYPE "TaskMarketplaceFeePolicy" AS ENUM ('FREE', 'PAID_POSTING', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "TaskMarketplaceListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskApplicationPolicy" AS ENUM ('CLOSED', 'OPEN', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "TaskApplicationStatus" AS ENUM ('APPLIED', 'INVITED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskApplicationEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'REVIEWED', 'COMMENTED', 'INVITED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "accessTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "availabilityUpdatedAt" TIMESTAMP(3),
ADD COLUMN "availableFrom" TIMESTAMP(3),
ADD COLUMN "credentialTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "languageTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "preferredPaymentRails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "preferredTaskTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "toolTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "unavailableTaskTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "workPreferenceTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Task"
ADD COLUMN "kind" "TaskKind" NOT NULL DEFAULT 'TASK',
ADD COLUMN "engagementKind" "TaskEngagementKind" NOT NULL DEFAULT 'ONE_OFF',
ADD COLUMN "applicationPolicy" "TaskApplicationPolicy" NOT NULL DEFAULT 'CLOSED',
ADD COLUMN "compensationKind" "TaskCompensationKind" NOT NULL DEFAULT 'UNSPECIFIED',
ADD COLUMN "compensationCadence" "TaskCompensationCadence",
ADD COLUMN "compensationCurrency" TEXT,
ADD COLUMN "compensationMinAmountMinorUnits" BIGINT,
ADD COLUMN "compensationMaxAmountMinorUnits" BIGINT,
ADD COLUMN "compensationPaymentRails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "estimatedHoursPerWeekMin" INTEGER,
ADD COLUMN "estimatedHoursPerWeekMax" INTEGER,
ADD COLUMN "remotePolicy" "TaskRemotePolicy" NOT NULL DEFAULT 'UNSPECIFIED',
ADD COLUMN "locationText" TEXT,
ADD COLUMN "workLocationCountryCode" TEXT,
ADD COLUMN "workLocationRegionCode" TEXT,
ADD COLUMN "workLocationCity" TEXT,
ADD COLUMN "workLocationPostalCode" TEXT,
ADD COLUMN "workLocationLatitude" DOUBLE PRECISION,
ADD COLUMN "workLocationLongitude" DOUBLE PRECISION,
ADD COLUMN "workLocationRadiusKm" DOUBLE PRECISION,
ADD COLUMN "workTimeZone" TEXT,
ADD COLUMN "applicationQuestionsJson" JSONB,
ADD COLUMN "preferredSkillTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "requiredCredentialTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "preferredCredentialTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "requiredLanguageTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "preferredLanguageTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "requiredToolTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "preferredToolTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "requiredAccessTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "preferredAccessTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "executionMode" "TaskExecutionMode" NOT NULL DEFAULT 'HUMAN_OR_AGENT',
ADD COLUMN "ownerOrganizationId" TEXT;

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
    "referralInvitationId" TEXT,
    "shareAttemptId" TEXT,
    "status" "TaskApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "applicationMessage" TEXT,
    "answersJson" JSONB,
    "applicantNameSnapshot" TEXT,
    "applicantEmailSnapshot" TEXT,
    "reviewScore" INTEGER,
    "reviewNote" TEXT,
    "metadata" JSONB,
    "originUrl" TEXT,
    "utmJson" JSONB,
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

-- CreateTable
CREATE TABLE "TaskManager" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'manager',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTaskLease" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "AgentTaskLease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentExecutor" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT,
    "agentKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "provider" TEXT,
    "modelName" TEXT,
    "capabilityTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "toolTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accessTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "averageCostUsd" DOUBLE PRECISION,
    "averageLatencySeconds" DOUBLE PRECISION,
    "successRate" DOUBLE PRECISION,
    "status" "AgentExecutorStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AgentExecutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCandidateMatch" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT,
    "taskId" TEXT NOT NULL,
    "candidateKind" "TaskCandidateKind" NOT NULL,
    "candidateKey" TEXT NOT NULL,
    "candidateUserId" TEXT,
    "candidatePersonId" TEXT,
    "candidateOrganizationId" TEXT,
    "agentExecutorId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "scoreVersion" TEXT NOT NULL,
    "reasonJson" JSONB,
    "blockersJson" JSONB,
    "estimatedCostMinorUnits" BIGINT,
    "estimatedCostCurrency" TEXT,
    "estimatedDurationSeconds" INTEGER,
    "status" "TaskCandidateMatchStatus" NOT NULL DEFAULT 'SUGGESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskCandidateMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskExecutionAttempt" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT,
    "taskId" TEXT NOT NULL,
    "candidateMatchId" TEXT,
    "executorKind" "TaskCandidateKind" NOT NULL,
    "executorKey" TEXT NOT NULL,
    "executorUserId" TEXT,
    "executorPersonId" TEXT,
    "executorOrganizationId" TEXT,
    "agentExecutorId" TEXT,
    "taskApplicationId" TEXT,
    "taskClaimId" TEXT,
    "agentTaskLeaseId" TEXT,
    "status" "TaskExecutionAttemptStatus" NOT NULL DEFAULT 'QUEUED',
    "estimatedCostMinorUnits" BIGINT,
    "estimatedCostCurrency" TEXT,
    "estimatedDurationSeconds" INTEGER,
    "actualCostMinorUnits" BIGINT,
    "actualCostCurrency" TEXT,
    "actualDurationSeconds" INTEGER,
    "confidence" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "outputSummary" TEXT,
    "errorSummary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskExecutionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskMarketplaceListing" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT,
    "taskId" TEXT NOT NULL,
    "posterUserId" TEXT,
    "posterOrganizationId" TEXT,
    "commerceEntitlementId" TEXT,
    "listingKind" "TaskMarketplaceListingKind" NOT NULL DEFAULT 'TASK_POSTING',
    "feePolicy" "TaskMarketplaceFeePolicy" NOT NULL DEFAULT 'FREE',
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "postingFeeMinorUnits" BIGINT,
    "status" "TaskMarketplaceListingStatus" NOT NULL DEFAULT 'DRAFT',
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskMarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_applicationPolicy_status_idx" ON "Task"("applicationPolicy", "status");

-- CreateIndex
CREATE INDEX "Task_compensationKind_status_idx" ON "Task"("compensationKind", "status");

-- CreateIndex
CREATE INDEX "Task_remotePolicy_status_idx" ON "Task"("remotePolicy", "status");

-- CreateIndex
CREATE INDEX "Task_executionMode_status_idx" ON "Task"("executionMode", "status");

-- CreateIndex
CREATE INDEX "Task_workLocationCountryCode_workLocationRegionCode_idx" ON "Task"("workLocationCountryCode", "workLocationRegionCode");

-- CreateIndex
CREATE INDEX "Task_kind_status_idx" ON "Task"("kind", "status");

-- CreateIndex
CREATE INDEX "Task_engagementKind_idx" ON "Task"("engagementKind");

-- CreateIndex
CREATE INDEX "Task_ownerOrganizationId_status_idx" ON "Task"("ownerOrganizationId", "status");

-- CreateIndex
CREATE INDEX "Task_skillTags_idx" ON "Task" USING GIN ("skillTags");

-- CreateIndex
CREATE INDEX "Task_preferredSkillTags_idx" ON "Task" USING GIN ("preferredSkillTags");

-- CreateIndex
CREATE INDEX "Task_interestTags_idx" ON "Task" USING GIN ("interestTags");

-- CreateIndex
CREATE INDEX "Task_requiredCredentialTags_idx" ON "Task" USING GIN ("requiredCredentialTags");

-- CreateIndex
CREATE INDEX "Task_preferredCredentialTags_idx" ON "Task" USING GIN ("preferredCredentialTags");

-- CreateIndex
CREATE INDEX "Task_requiredLanguageTags_idx" ON "Task" USING GIN ("requiredLanguageTags");

-- CreateIndex
CREATE INDEX "Task_preferredLanguageTags_idx" ON "Task" USING GIN ("preferredLanguageTags");

-- CreateIndex
CREATE INDEX "Task_requiredToolTags_idx" ON "Task" USING GIN ("requiredToolTags");

-- CreateIndex
CREATE INDEX "Task_preferredToolTags_idx" ON "Task" USING GIN ("preferredToolTags");

-- CreateIndex
CREATE INDEX "Task_requiredAccessTags_idx" ON "Task" USING GIN ("requiredAccessTags");

-- CreateIndex
CREATE INDEX "Task_preferredAccessTags_idx" ON "Task" USING GIN ("preferredAccessTags");

-- CreateIndex
CREATE INDEX "Task_compensationPaymentRails_idx" ON "Task" USING GIN ("compensationPaymentRails");

-- CreateIndex
CREATE INDEX "User_availableFrom_idx" ON "User"("availableFrom");

-- CreateIndex
CREATE INDEX "User_skillTags_idx" ON "User" USING GIN ("skillTags");

-- CreateIndex
CREATE INDEX "User_credentialTags_idx" ON "User" USING GIN ("credentialTags");

-- CreateIndex
CREATE INDEX "User_interestTags_idx" ON "User" USING GIN ("interestTags");

-- CreateIndex
CREATE INDEX "User_languageTags_idx" ON "User" USING GIN ("languageTags");

-- CreateIndex
CREATE INDEX "User_toolTags_idx" ON "User" USING GIN ("toolTags");

-- CreateIndex
CREATE INDEX "User_accessTags_idx" ON "User" USING GIN ("accessTags");

-- CreateIndex
CREATE INDEX "User_preferredPaymentRails_idx" ON "User" USING GIN ("preferredPaymentRails");

-- CreateIndex
CREATE INDEX "User_workPreferenceTags_idx" ON "User" USING GIN ("workPreferenceTags");

-- CreateIndex
CREATE INDEX "User_preferredTaskTags_idx" ON "User" USING GIN ("preferredTaskTags");

-- CreateIndex
CREATE INDEX "User_unavailableTaskTags_idx" ON "User" USING GIN ("unavailableTaskTags");

-- CreateIndex
CREATE UNIQUE INDEX "TaskApplication_id_taskId_key" ON "TaskApplication"("id", "taskId");

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

-- CreateIndex
CREATE UNIQUE INDEX "TaskManager_taskId_userId_key" ON "TaskManager"("taskId", "userId");

-- CreateIndex
CREATE INDEX "TaskManager_taskId_role_idx" ON "TaskManager"("taskId", "role");

-- CreateIndex
CREATE INDEX "TaskManager_userId_role_idx" ON "TaskManager"("userId", "role");

-- CreateIndex
CREATE INDEX "TaskManager_createdByUserId_idx" ON "TaskManager"("createdByUserId");

-- CreateIndex
CREATE INDEX "TaskManager_deletedAt_idx" ON "TaskManager"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentTaskLease_taskId_agentId_key" ON "AgentTaskLease"("taskId", "agentId");

-- CreateIndex
CREATE INDEX "AgentTaskLease_taskId_released_expiresAt_idx" ON "AgentTaskLease"("taskId", "released", "expiresAt");

-- CreateIndex
CREATE INDEX "AgentTaskLease_agentId_idx" ON "AgentTaskLease"("agentId");

-- CreateIndex
CREATE INDEX "AgentTaskLease_expiresAt_idx" ON "AgentTaskLease"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentExecutor_agentKey_key" ON "AgentExecutor"("agentKey");

-- CreateIndex
CREATE INDEX "AgentExecutor_jurisdictionId_status_idx" ON "AgentExecutor"("jurisdictionId", "status");

-- CreateIndex
CREATE INDEX "AgentExecutor_provider_modelName_idx" ON "AgentExecutor"("provider", "modelName");

-- CreateIndex
CREATE INDEX "AgentExecutor_status_idx" ON "AgentExecutor"("status");

-- CreateIndex
CREATE INDEX "AgentExecutor_deletedAt_idx" ON "AgentExecutor"("deletedAt");

-- CreateIndex
CREATE INDEX "AgentExecutor_capabilityTags_idx" ON "AgentExecutor" USING GIN ("capabilityTags");

-- CreateIndex
CREATE INDEX "AgentExecutor_toolTags_idx" ON "AgentExecutor" USING GIN ("toolTags");

-- CreateIndex
CREATE INDEX "AgentExecutor_accessTags_idx" ON "AgentExecutor" USING GIN ("accessTags");

-- CreateIndex
CREATE INDEX "TaskCandidateMatch_jurisdictionId_status_idx" ON "TaskCandidateMatch"("jurisdictionId", "status");

-- CreateIndex
CREATE INDEX "TaskCandidateMatch_taskId_status_score_idx" ON "TaskCandidateMatch"("taskId", "status", "score");

-- CreateIndex
CREATE INDEX "TaskCandidateMatch_candidateKind_status_idx" ON "TaskCandidateMatch"("candidateKind", "status");

-- CreateIndex
CREATE INDEX "TaskCandidateMatch_candidateUserId_status_idx" ON "TaskCandidateMatch"("candidateUserId", "status");

-- CreateIndex
CREATE INDEX "TaskCandidateMatch_candidatePersonId_status_idx" ON "TaskCandidateMatch"("candidatePersonId", "status");

-- CreateIndex
CREATE INDEX "TaskCandidateMatch_candidateOrganizationId_status_idx" ON "TaskCandidateMatch"("candidateOrganizationId", "status");

-- CreateIndex
CREATE INDEX "TaskCandidateMatch_agentExecutorId_status_idx" ON "TaskCandidateMatch"("agentExecutorId", "status");

-- CreateIndex
CREATE INDEX "TaskCandidateMatch_deletedAt_idx" ON "TaskCandidateMatch"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCandidateMatch_taskId_candidateKey_scoreVersion_key" ON "TaskCandidateMatch"("taskId", "candidateKey", "scoreVersion");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_jurisdictionId_status_idx" ON "TaskExecutionAttempt"("jurisdictionId", "status");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_taskId_status_idx" ON "TaskExecutionAttempt"("taskId", "status");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_candidateMatchId_idx" ON "TaskExecutionAttempt"("candidateMatchId");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_executorKind_status_idx" ON "TaskExecutionAttempt"("executorKind", "status");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_executorKey_status_idx" ON "TaskExecutionAttempt"("executorKey", "status");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_executorUserId_status_idx" ON "TaskExecutionAttempt"("executorUserId", "status");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_executorPersonId_status_idx" ON "TaskExecutionAttempt"("executorPersonId", "status");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_executorOrganizationId_status_idx" ON "TaskExecutionAttempt"("executorOrganizationId", "status");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_agentExecutorId_status_idx" ON "TaskExecutionAttempt"("agentExecutorId", "status");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_taskApplicationId_idx" ON "TaskExecutionAttempt"("taskApplicationId");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_taskClaimId_idx" ON "TaskExecutionAttempt"("taskClaimId");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_agentTaskLeaseId_idx" ON "TaskExecutionAttempt"("agentTaskLeaseId");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_startedAt_idx" ON "TaskExecutionAttempt"("startedAt");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_completedAt_idx" ON "TaskExecutionAttempt"("completedAt");

-- CreateIndex
CREATE INDEX "TaskExecutionAttempt_deletedAt_idx" ON "TaskExecutionAttempt"("deletedAt");

-- CreateIndex
CREATE INDEX "TaskMarketplaceListing_jurisdictionId_status_idx" ON "TaskMarketplaceListing"("jurisdictionId", "status");

-- CreateIndex
CREATE INDEX "TaskMarketplaceListing_taskId_status_idx" ON "TaskMarketplaceListing"("taskId", "status");

-- CreateIndex
CREATE INDEX "TaskMarketplaceListing_posterUserId_status_idx" ON "TaskMarketplaceListing"("posterUserId", "status");

-- CreateIndex
CREATE INDEX "TaskMarketplaceListing_posterOrganizationId_status_idx" ON "TaskMarketplaceListing"("posterOrganizationId", "status");

-- CreateIndex
CREATE INDEX "TaskMarketplaceListing_commerceEntitlementId_idx" ON "TaskMarketplaceListing"("commerceEntitlementId");

-- CreateIndex
CREATE INDEX "TaskMarketplaceListing_listingKind_status_idx" ON "TaskMarketplaceListing"("listingKind", "status");

-- CreateIndex
CREATE INDEX "TaskMarketplaceListing_feePolicy_status_idx" ON "TaskMarketplaceListing"("feePolicy", "status");

-- CreateIndex
CREATE INDEX "TaskMarketplaceListing_expiresAt_idx" ON "TaskMarketplaceListing"("expiresAt");

-- CreateIndex
CREATE INDEX "TaskMarketplaceListing_deletedAt_idx" ON "TaskMarketplaceListing"("deletedAt");

-- CreateIndex
CREATE INDEX "TaskApplication_referralInvitationId_idx" ON "TaskApplication"("referralInvitationId");

-- CreateIndex
CREATE INDEX "TaskApplication_shareAttemptId_idx" ON "TaskApplication"("shareAttemptId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_ownerOrganizationId_fkey" FOREIGN KEY ("ownerOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "TaskApplication" ADD CONSTRAINT "TaskApplication_referralInvitationId_fkey" FOREIGN KEY ("referralInvitationId") REFERENCES "ReferralInvitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplication" ADD CONSTRAINT "TaskApplication_shareAttemptId_fkey" FOREIGN KEY ("shareAttemptId") REFERENCES "ShareAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskManager" ADD CONSTRAINT "TaskManager_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskManager" ADD CONSTRAINT "TaskManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskManager" ADD CONSTRAINT "TaskManager_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTaskLease" ADD CONSTRAINT "AgentTaskLease_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentExecutor" ADD CONSTRAINT "AgentExecutor_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCandidateMatch" ADD CONSTRAINT "TaskCandidateMatch_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCandidateMatch" ADD CONSTRAINT "TaskCandidateMatch_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCandidateMatch" ADD CONSTRAINT "TaskCandidateMatch_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCandidateMatch" ADD CONSTRAINT "TaskCandidateMatch_candidatePersonId_fkey" FOREIGN KEY ("candidatePersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCandidateMatch" ADD CONSTRAINT "TaskCandidateMatch_candidateOrganizationId_fkey" FOREIGN KEY ("candidateOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCandidateMatch" ADD CONSTRAINT "TaskCandidateMatch_agentExecutorId_fkey" FOREIGN KEY ("agentExecutorId") REFERENCES "AgentExecutor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskExecutionAttempt" ADD CONSTRAINT "TaskExecutionAttempt_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskExecutionAttempt" ADD CONSTRAINT "TaskExecutionAttempt_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskExecutionAttempt" ADD CONSTRAINT "TaskExecutionAttempt_candidateMatchId_fkey" FOREIGN KEY ("candidateMatchId") REFERENCES "TaskCandidateMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskExecutionAttempt" ADD CONSTRAINT "TaskExecutionAttempt_executorUserId_fkey" FOREIGN KEY ("executorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskExecutionAttempt" ADD CONSTRAINT "TaskExecutionAttempt_executorPersonId_fkey" FOREIGN KEY ("executorPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskExecutionAttempt" ADD CONSTRAINT "TaskExecutionAttempt_executorOrganizationId_fkey" FOREIGN KEY ("executorOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskExecutionAttempt" ADD CONSTRAINT "TaskExecutionAttempt_agentExecutorId_fkey" FOREIGN KEY ("agentExecutorId") REFERENCES "AgentExecutor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskExecutionAttempt" ADD CONSTRAINT "TaskExecutionAttempt_taskApplicationId_fkey" FOREIGN KEY ("taskApplicationId") REFERENCES "TaskApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskExecutionAttempt" ADD CONSTRAINT "TaskExecutionAttempt_taskClaimId_fkey" FOREIGN KEY ("taskClaimId") REFERENCES "TaskClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskExecutionAttempt" ADD CONSTRAINT "TaskExecutionAttempt_agentTaskLeaseId_fkey" FOREIGN KEY ("agentTaskLeaseId") REFERENCES "AgentTaskLease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskMarketplaceListing" ADD CONSTRAINT "TaskMarketplaceListing_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskMarketplaceListing" ADD CONSTRAINT "TaskMarketplaceListing_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskMarketplaceListing" ADD CONSTRAINT "TaskMarketplaceListing_posterUserId_fkey" FOREIGN KEY ("posterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskMarketplaceListing" ADD CONSTRAINT "TaskMarketplaceListing_posterOrganizationId_fkey" FOREIGN KEY ("posterOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskMarketplaceListing" ADD CONSTRAINT "TaskMarketplaceListing_commerceEntitlementId_fkey" FOREIGN KEY ("commerceEntitlementId") REFERENCES "CommerceEntitlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplicationEvent" ADD CONSTRAINT "TaskApplicationEvent_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplicationEvent" ADD CONSTRAINT "TaskApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TaskApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplicationEvent" ADD CONSTRAINT "TaskApplicationEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskApplicationId_taskId_fkey" FOREIGN KEY ("taskApplicationId", "taskId") REFERENCES "TaskApplication"("id", "taskId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "TaskDistributionChannel" AS ENUM ('JOB_BOARD', 'SOCIAL', 'COMMUNITY', 'FREELANCE_MARKETPLACE', 'GRANTS', 'SEARCH_INDEX', 'WEBHOOK', 'TASK_PLATFORM', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskDistributionOperation" AS ENUM ('CREATE', 'UPDATE', 'REMOVE', 'INDEX');

-- CreateEnum
CREATE TYPE "TaskDistributionTargetStatus" AS ENUM ('ACTIVE', 'PAUSED', 'RETIRED');

-- CreateEnum
CREATE TYPE "TaskDistributionAttemptStatus" AS ENUM ('DRAFT', 'QUEUED', 'APPROVAL_REQUIRED', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "TaskDistributionTarget" (
    "id" TEXT NOT NULL,
    "integrationProviderId" TEXT,
    "channel" "TaskDistributionChannel" NOT NULL,
    "targetKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskDistributionTargetStatus" NOT NULL DEFAULT 'ACTIVE',
    "requiresManualApproval" BOOLEAN NOT NULL DEFAULT true,
    "defaultCostMinorUnits" BIGINT,
    "defaultCostCurrency" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskDistributionTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDistributionAttempt" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT,
    "taskId" TEXT NOT NULL,
    "distributionTargetId" TEXT,
    "integrationProviderId" TEXT,
    "integrationConnectionId" TEXT,
    "requestedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "channel" "TaskDistributionChannel" NOT NULL,
    "operation" "TaskDistributionOperation" NOT NULL DEFAULT 'CREATE',
    "status" "TaskDistributionAttemptStatus" NOT NULL DEFAULT 'DRAFT',
    "externalObjectId" TEXT,
    "externalUrl" TEXT,
    "externalStatus" TEXT,
    "payloadJson" JSONB,
    "payloadHash" TEXT,
    "responseJson" JSONB,
    "errorMessage" TEXT,
    "costMinorUnits" BIGINT,
    "costCurrency" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskDistributionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskDistributionTarget_targetKey_key" ON "TaskDistributionTarget"("targetKey");

-- CreateIndex
CREATE INDEX "TaskDistributionTarget_integrationProviderId_idx" ON "TaskDistributionTarget"("integrationProviderId");

-- CreateIndex
CREATE INDEX "TaskDistributionTarget_channel_status_idx" ON "TaskDistributionTarget"("channel", "status");

-- CreateIndex
CREATE INDEX "TaskDistributionTarget_status_idx" ON "TaskDistributionTarget"("status");

-- CreateIndex
CREATE INDEX "TaskDistributionTarget_deletedAt_idx" ON "TaskDistributionTarget"("deletedAt");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_jurisdictionId_status_idx" ON "TaskDistributionAttempt"("jurisdictionId", "status");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_taskId_status_idx" ON "TaskDistributionAttempt"("taskId", "status");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_distributionTargetId_status_idx" ON "TaskDistributionAttempt"("distributionTargetId", "status");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_integrationProviderId_status_idx" ON "TaskDistributionAttempt"("integrationProviderId", "status");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_integrationConnectionId_status_idx" ON "TaskDistributionAttempt"("integrationConnectionId", "status");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_requestedByUserId_status_idx" ON "TaskDistributionAttempt"("requestedByUserId", "status");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_approvedByUserId_status_idx" ON "TaskDistributionAttempt"("approvedByUserId", "status");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_channel_status_idx" ON "TaskDistributionAttempt"("channel", "status");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_operation_status_idx" ON "TaskDistributionAttempt"("operation", "status");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_externalObjectId_idx" ON "TaskDistributionAttempt"("externalObjectId");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_externalUrl_idx" ON "TaskDistributionAttempt"("externalUrl");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_payloadHash_idx" ON "TaskDistributionAttempt"("payloadHash");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_scheduledAt_idx" ON "TaskDistributionAttempt"("scheduledAt");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_completedAt_idx" ON "TaskDistributionAttempt"("completedAt");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_expiresAt_idx" ON "TaskDistributionAttempt"("expiresAt");

-- CreateIndex
CREATE INDEX "TaskDistributionAttempt_deletedAt_idx" ON "TaskDistributionAttempt"("deletedAt");

-- AddForeignKey
ALTER TABLE "TaskDistributionTarget" ADD CONSTRAINT "TaskDistributionTarget_integrationProviderId_fkey" FOREIGN KEY ("integrationProviderId") REFERENCES "IntegrationProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDistributionAttempt" ADD CONSTRAINT "TaskDistributionAttempt_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDistributionAttempt" ADD CONSTRAINT "TaskDistributionAttempt_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDistributionAttempt" ADD CONSTRAINT "TaskDistributionAttempt_distributionTargetId_fkey" FOREIGN KEY ("distributionTargetId") REFERENCES "TaskDistributionTarget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDistributionAttempt" ADD CONSTRAINT "TaskDistributionAttempt_integrationProviderId_fkey" FOREIGN KEY ("integrationProviderId") REFERENCES "IntegrationProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDistributionAttempt" ADD CONSTRAINT "TaskDistributionAttempt_integrationConnectionId_fkey" FOREIGN KEY ("integrationConnectionId") REFERENCES "IntegrationConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDistributionAttempt" ADD CONSTRAINT "TaskDistributionAttempt_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDistributionAttempt" ADD CONSTRAINT "TaskDistributionAttempt_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
