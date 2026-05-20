-- CreateEnum
CREATE TYPE "DatingProfileStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'HIDDEN', 'MODERATION_HOLD', 'BANNED');

-- CreateEnum
CREATE TYPE "DatingRelationshipIntent" AS ENUM ('FRIENDS', 'DATES', 'LONG_TERM', 'LIFE_PARTNER', 'CASUAL', 'NON_MONOGAMY', 'UNSURE');

-- CreateEnum
CREATE TYPE "DatingProfilePhotoStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "DatingQuestionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "DatingQuestionAnswerVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "DatingQuestionImportance" AS ENUM ('IRRELEVANT', 'A_LITTLE', 'SOMEWHAT', 'VERY', 'MANDATORY');

-- CreateEnum
CREATE TYPE "DatingPreferenceImportance" AS ENUM ('PREFERENCE', 'DEALBREAKER');

-- CreateEnum
CREATE TYPE "DatingInteractionKind" AS ENUM ('LIKE', 'PASS', 'SUPERLIKE', 'INTRO');

-- CreateEnum
CREATE TYPE "DatingInteractionStatus" AS ENUM ('ACTIVE', 'RETRACTED', 'MODERATION_HOLD');

-- CreateEnum
CREATE TYPE "DatingMatchStatus" AS ENUM ('ACTIVE', 'UNMATCHED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "DatingConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'MODERATION_HOLD');

-- CreateEnum
CREATE TYPE "DatingMessageStatus" AS ENUM ('SENT', 'HIDDEN', 'DELETED', 'MODERATION_HOLD');

-- CreateEnum
CREATE TYPE "DatingDatePlanStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'DECLINED', 'CANCELED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "DatingBlockScope" AS ENUM ('DISCOVERY', 'MESSAGES', 'ALL');

-- CreateEnum
CREATE TYPE "DatingSafetyReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "DatingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DatingProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "headline" TEXT,
    "bio" TEXT,
    "lookingForText" TEXT,
    "relationshipIntents" "DatingRelationshipIntent"[] DEFAULT ARRAY[]::"DatingRelationshipIntent"[],
    "genderIdentities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "orientationIdentities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relationshipStatus" TEXT,
    "preferredMinAge" INTEGER,
    "preferredMaxAge" INTEGER,
    "maxDistanceKm" INTEGER,
    "displayCity" TEXT,
    "displayRegionCode" TEXT,
    "displayCountryCode" TEXT,
    "wantsCampaignDates" BOOLEAN NOT NULL DEFAULT true,
    "campaignDateIdeas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "profileCompletedAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingProfilePhoto" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "altText" TEXT,
    "blurhash" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "DatingProfilePhotoStatus" NOT NULL DEFAULT 'PENDING',
    "moderationReason" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingProfilePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingPrompt" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "managed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingPromptAnswer" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingPromptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingQuestion" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT,
    "answerOptions" JSONB NOT NULL,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "status" "DatingQuestionStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "managed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingQuestionAnswer" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerValues" JSONB NOT NULL,
    "acceptableValues" JSONB,
    "importance" "DatingQuestionImportance" NOT NULL DEFAULT 'SOMEWHAT',
    "visibility" "DatingQuestionAnswerVisibility" NOT NULL DEFAULT 'PUBLIC',
    "explanation" TEXT,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingQuestionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingPreference" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "importance" "DatingPreferenceImportance" NOT NULL DEFAULT 'PREFERENCE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingMatchScore" (
    "id" TEXT NOT NULL,
    "profileAId" TEXT NOT NULL,
    "profileBId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "questionScore" INTEGER,
    "preferenceScore" INTEGER,
    "sharedAnsweredCount" INTEGER NOT NULL DEFAULT 0,
    "dealbreakerFailed" BOOLEAN NOT NULL DEFAULT false,
    "failedDealbreakerCount" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingMatchScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingInteraction" (
    "id" TEXT NOT NULL,
    "fromProfileId" TEXT NOT NULL,
    "toProfileId" TEXT NOT NULL,
    "kind" "DatingInteractionKind" NOT NULL,
    "status" "DatingInteractionStatus" NOT NULL DEFAULT 'ACTIVE',
    "introMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingMatch" (
    "id" TEXT NOT NULL,
    "profileAId" TEXT NOT NULL,
    "profileBId" TEXT NOT NULL,
    "status" "DatingMatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unmatchedAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingConversation" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "status" "DatingConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderProfileId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "DatingMessageStatus" NOT NULL DEFAULT 'SENT',
    "readAt" TIMESTAMP(3),
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingDatePlan" (
    "id" TEXT NOT NULL,
    "matchId" TEXT,
    "conversationId" TEXT,
    "proposedByProfileId" TEXT NOT NULL,
    "acceptedByProfileId" TEXT,
    "status" "DatingDatePlanStatus" NOT NULL DEFAULT 'PROPOSED',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "timeZone" TEXT,
    "locationName" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isCampaignDate" BOOLEAN NOT NULL DEFAULT false,
    "campaignTaskId" TEXT,
    "campaignNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingDatePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingBlock" (
    "id" TEXT NOT NULL,
    "blockerProfileId" TEXT NOT NULL,
    "blockedProfileId" TEXT NOT NULL,
    "scope" "DatingBlockScope" NOT NULL DEFAULT 'ALL',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatingSafetyReport" (
    "id" TEXT NOT NULL,
    "reporterProfileId" TEXT NOT NULL,
    "reportedProfileId" TEXT,
    "messageId" TEXT,
    "datePlanId" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "DatingSafetyReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewerUserId" TEXT,
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DatingSafetyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatingProfile_userId_key" ON "DatingProfile"("userId");

-- CreateIndex
CREATE INDEX "DatingProfile_status_lastActiveAt_idx" ON "DatingProfile"("status", "lastActiveAt");

-- CreateIndex
CREATE INDEX "DatingProfile_displayCountryCode_displayRegionCode_displayC_idx" ON "DatingProfile"("displayCountryCode", "displayRegionCode", "displayCity");

-- CreateIndex
CREATE INDEX "DatingProfile_wantsCampaignDates_idx" ON "DatingProfile"("wantsCampaignDates");

-- CreateIndex
CREATE INDEX "DatingProfile_deletedAt_idx" ON "DatingProfile"("deletedAt");

-- CreateIndex
CREATE INDEX "DatingProfilePhoto_profileId_sortOrder_idx" ON "DatingProfilePhoto"("profileId", "sortOrder");

-- CreateIndex
CREATE INDEX "DatingProfilePhoto_status_idx" ON "DatingProfilePhoto"("status");

-- CreateIndex
CREATE INDEX "DatingProfilePhoto_reviewedByUserId_idx" ON "DatingProfilePhoto"("reviewedByUserId");

-- CreateIndex
CREATE INDEX "DatingProfilePhoto_deletedAt_idx" ON "DatingProfilePhoto"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DatingPrompt_key_key" ON "DatingPrompt"("key");

-- CreateIndex
CREATE INDEX "DatingPrompt_active_sortOrder_idx" ON "DatingPrompt"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "DatingPrompt_deletedAt_idx" ON "DatingPrompt"("deletedAt");

-- CreateIndex
CREATE INDEX "DatingPromptAnswer_profileId_sortOrder_idx" ON "DatingPromptAnswer"("profileId", "sortOrder");

-- CreateIndex
CREATE INDEX "DatingPromptAnswer_promptId_idx" ON "DatingPromptAnswer"("promptId");

-- CreateIndex
CREATE INDEX "DatingPromptAnswer_deletedAt_idx" ON "DatingPromptAnswer"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DatingPromptAnswer_profileId_promptId_key" ON "DatingPromptAnswer"("profileId", "promptId");

-- CreateIndex
CREATE UNIQUE INDEX "DatingQuestion_key_key" ON "DatingQuestion"("key");

-- CreateIndex
CREATE INDEX "DatingQuestion_status_category_sortOrder_idx" ON "DatingQuestion"("status", "category", "sortOrder");

-- CreateIndex
CREATE INDEX "DatingQuestion_deletedAt_idx" ON "DatingQuestion"("deletedAt");

-- CreateIndex
CREATE INDEX "DatingQuestionAnswer_profileId_visibility_idx" ON "DatingQuestionAnswer"("profileId", "visibility");

-- CreateIndex
CREATE INDEX "DatingQuestionAnswer_questionId_idx" ON "DatingQuestionAnswer"("questionId");

-- CreateIndex
CREATE INDEX "DatingQuestionAnswer_importance_idx" ON "DatingQuestionAnswer"("importance");

-- CreateIndex
CREATE INDEX "DatingQuestionAnswer_deletedAt_idx" ON "DatingQuestionAnswer"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DatingQuestionAnswer_profileId_questionId_key" ON "DatingQuestionAnswer"("profileId", "questionId");

-- CreateIndex
CREATE INDEX "DatingPreference_profileId_importance_idx" ON "DatingPreference"("profileId", "importance");

-- CreateIndex
CREATE INDEX "DatingPreference_key_idx" ON "DatingPreference"("key");

-- CreateIndex
CREATE INDEX "DatingPreference_deletedAt_idx" ON "DatingPreference"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DatingPreference_profileId_key_key" ON "DatingPreference"("profileId", "key");

-- CreateIndex
CREATE INDEX "DatingMatchScore_profileAId_score_idx" ON "DatingMatchScore"("profileAId", "score");

-- CreateIndex
CREATE INDEX "DatingMatchScore_profileBId_score_idx" ON "DatingMatchScore"("profileBId", "score");

-- CreateIndex
CREATE INDEX "DatingMatchScore_dealbreakerFailed_idx" ON "DatingMatchScore"("dealbreakerFailed");

-- CreateIndex
CREATE INDEX "DatingMatchScore_computedAt_idx" ON "DatingMatchScore"("computedAt");

-- CreateIndex
CREATE INDEX "DatingMatchScore_deletedAt_idx" ON "DatingMatchScore"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DatingMatchScore_profileAId_profileBId_key" ON "DatingMatchScore"("profileAId", "profileBId");

-- CreateIndex
CREATE INDEX "DatingInteraction_fromProfileId_toProfileId_createdAt_idx" ON "DatingInteraction"("fromProfileId", "toProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "DatingInteraction_toProfileId_kind_status_createdAt_idx" ON "DatingInteraction"("toProfileId", "kind", "status", "createdAt");

-- CreateIndex
CREATE INDEX "DatingInteraction_fromProfileId_kind_status_createdAt_idx" ON "DatingInteraction"("fromProfileId", "kind", "status", "createdAt");

-- CreateIndex
CREATE INDEX "DatingInteraction_deletedAt_idx" ON "DatingInteraction"("deletedAt");

-- CreateIndex
CREATE INDEX "DatingMatch_profileAId_status_lastMessageAt_idx" ON "DatingMatch"("profileAId", "status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "DatingMatch_profileBId_status_lastMessageAt_idx" ON "DatingMatch"("profileBId", "status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "DatingMatch_matchedAt_idx" ON "DatingMatch"("matchedAt");

-- CreateIndex
CREATE INDEX "DatingMatch_deletedAt_idx" ON "DatingMatch"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DatingMatch_profileAId_profileBId_key" ON "DatingMatch"("profileAId", "profileBId");

-- CreateIndex
CREATE UNIQUE INDEX "DatingConversation_matchId_key" ON "DatingConversation"("matchId");

-- CreateIndex
CREATE INDEX "DatingConversation_status_updatedAt_idx" ON "DatingConversation"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "DatingConversation_deletedAt_idx" ON "DatingConversation"("deletedAt");

-- CreateIndex
CREATE INDEX "DatingMessage_conversationId_createdAt_idx" ON "DatingMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "DatingMessage_senderProfileId_createdAt_idx" ON "DatingMessage"("senderProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "DatingMessage_status_idx" ON "DatingMessage"("status");

-- CreateIndex
CREATE INDEX "DatingMessage_deletedAt_idx" ON "DatingMessage"("deletedAt");

-- CreateIndex
CREATE INDEX "DatingDatePlan_matchId_status_startsAt_idx" ON "DatingDatePlan"("matchId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "DatingDatePlan_conversationId_idx" ON "DatingDatePlan"("conversationId");

-- CreateIndex
CREATE INDEX "DatingDatePlan_proposedByProfileId_status_startsAt_idx" ON "DatingDatePlan"("proposedByProfileId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "DatingDatePlan_acceptedByProfileId_idx" ON "DatingDatePlan"("acceptedByProfileId");

-- CreateIndex
CREATE INDEX "DatingDatePlan_campaignTaskId_idx" ON "DatingDatePlan"("campaignTaskId");

-- CreateIndex
CREATE INDEX "DatingDatePlan_isCampaignDate_status_idx" ON "DatingDatePlan"("isCampaignDate", "status");

-- CreateIndex
CREATE INDEX "DatingDatePlan_deletedAt_idx" ON "DatingDatePlan"("deletedAt");

-- CreateIndex
CREATE INDEX "DatingBlock_blockedProfileId_idx" ON "DatingBlock"("blockedProfileId");

-- CreateIndex
CREATE INDEX "DatingBlock_deletedAt_idx" ON "DatingBlock"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DatingBlock_blockerProfileId_blockedProfileId_key" ON "DatingBlock"("blockerProfileId", "blockedProfileId");

-- CreateIndex
CREATE INDEX "DatingSafetyReport_reporterProfileId_idx" ON "DatingSafetyReport"("reporterProfileId");

-- CreateIndex
CREATE INDEX "DatingSafetyReport_reportedProfileId_idx" ON "DatingSafetyReport"("reportedProfileId");

-- CreateIndex
CREATE INDEX "DatingSafetyReport_messageId_idx" ON "DatingSafetyReport"("messageId");

-- CreateIndex
CREATE INDEX "DatingSafetyReport_datePlanId_idx" ON "DatingSafetyReport"("datePlanId");

-- CreateIndex
CREATE INDEX "DatingSafetyReport_reviewerUserId_idx" ON "DatingSafetyReport"("reviewerUserId");

-- CreateIndex
CREATE INDEX "DatingSafetyReport_status_createdAt_idx" ON "DatingSafetyReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DatingSafetyReport_deletedAt_idx" ON "DatingSafetyReport"("deletedAt");

-- AddForeignKey
ALTER TABLE "DatingProfile" ADD CONSTRAINT "DatingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingProfilePhoto" ADD CONSTRAINT "DatingProfilePhoto_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingProfilePhoto" ADD CONSTRAINT "DatingProfilePhoto_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingPromptAnswer" ADD CONSTRAINT "DatingPromptAnswer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingPromptAnswer" ADD CONSTRAINT "DatingPromptAnswer_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "DatingPrompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingQuestionAnswer" ADD CONSTRAINT "DatingQuestionAnswer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingQuestionAnswer" ADD CONSTRAINT "DatingQuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "DatingQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingPreference" ADD CONSTRAINT "DatingPreference_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingMatchScore" ADD CONSTRAINT "DatingMatchScore_profileAId_fkey" FOREIGN KEY ("profileAId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingMatchScore" ADD CONSTRAINT "DatingMatchScore_profileBId_fkey" FOREIGN KEY ("profileBId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingInteraction" ADD CONSTRAINT "DatingInteraction_fromProfileId_fkey" FOREIGN KEY ("fromProfileId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingInteraction" ADD CONSTRAINT "DatingInteraction_toProfileId_fkey" FOREIGN KEY ("toProfileId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingMatch" ADD CONSTRAINT "DatingMatch_profileAId_fkey" FOREIGN KEY ("profileAId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingMatch" ADD CONSTRAINT "DatingMatch_profileBId_fkey" FOREIGN KEY ("profileBId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingConversation" ADD CONSTRAINT "DatingConversation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "DatingMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingMessage" ADD CONSTRAINT "DatingMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "DatingConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingMessage" ADD CONSTRAINT "DatingMessage_senderProfileId_fkey" FOREIGN KEY ("senderProfileId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingDatePlan" ADD CONSTRAINT "DatingDatePlan_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "DatingMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingDatePlan" ADD CONSTRAINT "DatingDatePlan_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "DatingConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingDatePlan" ADD CONSTRAINT "DatingDatePlan_proposedByProfileId_fkey" FOREIGN KEY ("proposedByProfileId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingDatePlan" ADD CONSTRAINT "DatingDatePlan_acceptedByProfileId_fkey" FOREIGN KEY ("acceptedByProfileId") REFERENCES "DatingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingDatePlan" ADD CONSTRAINT "DatingDatePlan_campaignTaskId_fkey" FOREIGN KEY ("campaignTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingBlock" ADD CONSTRAINT "DatingBlock_blockerProfileId_fkey" FOREIGN KEY ("blockerProfileId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingBlock" ADD CONSTRAINT "DatingBlock_blockedProfileId_fkey" FOREIGN KEY ("blockedProfileId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingSafetyReport" ADD CONSTRAINT "DatingSafetyReport_reporterProfileId_fkey" FOREIGN KEY ("reporterProfileId") REFERENCES "DatingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingSafetyReport" ADD CONSTRAINT "DatingSafetyReport_reportedProfileId_fkey" FOREIGN KEY ("reportedProfileId") REFERENCES "DatingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingSafetyReport" ADD CONSTRAINT "DatingSafetyReport_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DatingMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingSafetyReport" ADD CONSTRAINT "DatingSafetyReport_datePlanId_fkey" FOREIGN KEY ("datePlanId") REFERENCES "DatingDatePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatingSafetyReport" ADD CONSTRAINT "DatingSafetyReport_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
