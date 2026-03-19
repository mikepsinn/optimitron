-- CreateEnum
CREATE TYPE "ReferralAnswer" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('VOTED_REFERENDUM', 'SUBMITTED_COMPARISON', 'DEPOSITED_PRIZE', 'RECRUITED_VOTER', 'VERIFIED_PERSONHOOD', 'TRACKED_MEASUREMENT', 'UPDATED_PROFILE', 'EARNED_BADGE', 'CREATED_SURVEY', 'COMPLETED_SURVEY', 'JOINED_ORGANIZATION');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REFERRAL_SIGNUP', 'REFERENDUM_MILESTONE', 'ALIGNMENT_SCORE_PUBLISHED', 'DEPOSIT_CONFIRMED', 'BADGE_EARNED', 'SURVEY_INVITE', 'DAILY_CHECKIN_REMINDER', 'ORGANIZATION_INVITE', 'SYSTEM_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('UNIVERSITY', 'RESEARCH_CENTER', 'NONPROFIT', 'DAO', 'GOVERNMENT_AGENCY', 'HOSPITAL', 'BIOTECH', 'ADVOCACY');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('TWITTER', 'GITHUB', 'ETHEREUM', 'BASE', 'DISCORD', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('FIRST_COMPARISON', 'HUNDRED_COMPARISONS', 'FIRST_RECRUIT', 'TEN_RECRUITS', 'VERIFIED_HUMAN', 'EARLY_ADOPTER', 'DEPOSITOR');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'FREE_TEXT', 'RATING', 'BOOLEAN', 'NUMERIC');

-- CreateEnum
CREATE TYPE "EmailLogStatus" AS ENUM ('SENT', 'DELIVERED', 'OPENED', 'BOUNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "VotePosition" AS ENUM ('YES', 'NO', 'ABSTAIN');

-- CreateEnum
CREATE TYPE "ReferendumStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "VoteTokenMintStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED');

-- DropIndex
DROP INDEX "Politician_externalId_key";

-- DropIndex
DROP INDEX "PoliticianVote_itemCategory_idx";

-- DropIndex
DROP INDEX "WishocraticAllocation_categoryA_idx";

-- DropIndex
DROP INDEX "WishocraticAllocation_categoryB_idx";

-- DropIndex
DROP INDEX "WishocraticAllocation_userId_categoryA_categoryB_key";

-- DropIndex
DROP INDEX "WishocraticCategorySelection_categoryId_idx";

-- DropIndex
DROP INDEX "WishocraticCategorySelection_userId_categoryId_key";

-- AlterTable
ALTER TABLE "AlignmentScore" ADD COLUMN     "onChainRef" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PersonhoodVerification" DROP COLUMN "metadataJson",
ADD COLUMN     "providerMetadata" TEXT;

-- AlterTable
ALTER TABLE "PoliticianVote" DROP COLUMN "itemCategory",
DROP COLUMN "voteDate",
ADD COLUMN     "itemId" TEXT NOT NULL,
ADD COLUMN     "votedAt" TIMESTAMP(3);

-- RenamePrimaryKey
ALTER TABLE "Referral" RENAME CONSTRAINT "Vote_pkey" TO "Referral_pkey";

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "answer",
ADD COLUMN     "answer" "ReferralAnswer" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "WishocraticAllocation" DROP COLUMN "categoryA",
DROP COLUMN "categoryB",
ADD COLUMN     "itemAId" TEXT NOT NULL,
ADD COLUMN     "itemBId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WishocraticCategorySelection" DROP COLUMN "categoryId",
ADD COLUMN     "itemId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "VoteAnswer";

-- CreateTable
CREATE TABLE "CategoryAlignmentScore" (
    "id" TEXT NOT NULL,
    "alignmentScoreId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CategoryAlignmentScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitizenBillVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "billTitle" TEXT NOT NULL,
    "position" "VotePosition" NOT NULL,
    "reasoning" TEXT,
    "jurisdictionId" TEXT,
    "shareIdentifier" TEXT NOT NULL,
    "cbaSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CitizenBillVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebPushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSentAt" TIMESTAMP(3),
    "expired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WebPushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderFrequencyMinutes" INTEGER NOT NULL DEFAULT 1440,
    "reminderStartTime" TEXT NOT NULL DEFAULT '09:00',
    "quietHoursStart" TEXT NOT NULL DEFAULT '21:00',
    "lastPushSentAt" TIMESTAMP(3),
    "lastCheckInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishocraticEncryptedAllocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'AES-GCM-256',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WishocraticEncryptedAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referendum" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdByUserId" TEXT,
    "jurisdictionId" TEXT,
    "status" "ReferendumStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Referendum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferendumVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referendumId" TEXT NOT NULL,
    "answer" "VotePosition" NOT NULL,
    "referredByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ReferendumVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteTokenMint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referendumId" TEXT NOT NULL,
    "nullifierHash" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "txHash" TEXT,
    "chainId" INTEGER NOT NULL,
    "status" "VoteTokenMintStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VoteTokenMint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizeTreasuryDeposit" (
    "id" TEXT NOT NULL,
    "depositorAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "sharesReceived" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PrizeTreasuryDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicGoodsRecipient" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PublicGoodsRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishocraticDistribution" (
    "id" TEXT NOT NULL,
    "totalAmount" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "weightsHash" TEXT NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WishocraticDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "OrgType" NOT NULL,
    "status" "OrgStatus" NOT NULL DEFAULT 'PENDING',
    "jurisdictionId" TEXT,
    "creatorId" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "jurisdictionId" TEXT,
    "referendumId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveySection" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "conditionalLogic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SurveySection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyQuestion" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "conditionalLogic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SurveyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalScore" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionResponse" (
    "id" TEXT NOT NULL,
    "surveyResponseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "QuestionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BadgeType" NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "accountId" TEXT,
    "username" TEXT,
    "walletAddress" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "templateId" TEXT,
    "status" "EmailLogStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryAlignmentScore_alignmentScoreId_idx" ON "CategoryAlignmentScore"("alignmentScoreId");

-- CreateIndex
CREATE INDEX "CategoryAlignmentScore_itemId_idx" ON "CategoryAlignmentScore"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryAlignmentScore_alignmentScoreId_itemId_key" ON "CategoryAlignmentScore"("alignmentScoreId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenBillVote_shareIdentifier_key" ON "CitizenBillVote"("shareIdentifier");

-- CreateIndex
CREATE INDEX "CitizenBillVote_userId_idx" ON "CitizenBillVote"("userId");

-- CreateIndex
CREATE INDEX "CitizenBillVote_billId_idx" ON "CitizenBillVote"("billId");

-- CreateIndex
CREATE INDEX "CitizenBillVote_jurisdictionId_idx" ON "CitizenBillVote"("jurisdictionId");

-- CreateIndex
CREATE INDEX "CitizenBillVote_shareIdentifier_idx" ON "CitizenBillVote"("shareIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenBillVote_userId_billId_key" ON "CitizenBillVote"("userId", "billId");

-- CreateIndex
CREATE UNIQUE INDEX "WebPushSubscription_endpoint_key" ON "WebPushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "WebPushSubscription_userId_idx" ON "WebPushSubscription"("userId");

-- CreateIndex
CREATE INDEX "WebPushSubscription_expired_idx" ON "WebPushSubscription"("expired");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WishocraticEncryptedAllocation_userId_key" ON "WishocraticEncryptedAllocation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Referendum_slug_key" ON "Referendum"("slug");

-- CreateIndex
CREATE INDEX "Referendum_slug_idx" ON "Referendum"("slug");

-- CreateIndex
CREATE INDEX "Referendum_status_idx" ON "Referendum"("status");

-- CreateIndex
CREATE INDEX "Referendum_jurisdictionId_idx" ON "Referendum"("jurisdictionId");

-- CreateIndex
CREATE INDEX "Referendum_createdByUserId_idx" ON "Referendum"("createdByUserId");

-- CreateIndex
CREATE INDEX "ReferendumVote_userId_idx" ON "ReferendumVote"("userId");

-- CreateIndex
CREATE INDEX "ReferendumVote_referendumId_idx" ON "ReferendumVote"("referendumId");

-- CreateIndex
CREATE INDEX "ReferendumVote_referredByUserId_idx" ON "ReferendumVote"("referredByUserId");

-- CreateIndex
CREATE INDEX "ReferendumVote_createdAt_idx" ON "ReferendumVote"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReferendumVote_userId_referendumId_key" ON "ReferendumVote"("userId", "referendumId");

-- CreateIndex
CREATE INDEX "VoteTokenMint_userId_idx" ON "VoteTokenMint"("userId");

-- CreateIndex
CREATE INDEX "VoteTokenMint_referendumId_idx" ON "VoteTokenMint"("referendumId");

-- CreateIndex
CREATE INDEX "VoteTokenMint_status_idx" ON "VoteTokenMint"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VoteTokenMint_userId_referendumId_key" ON "VoteTokenMint"("userId", "referendumId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteTokenMint_nullifierHash_referendumId_key" ON "VoteTokenMint"("nullifierHash", "referendumId");

-- CreateIndex
CREATE INDEX "PrizeTreasuryDeposit_depositorAddress_idx" ON "PrizeTreasuryDeposit"("depositorAddress");

-- CreateIndex
CREATE INDEX "PrizeTreasuryDeposit_txHash_idx" ON "PrizeTreasuryDeposit"("txHash");

-- CreateIndex
CREATE INDEX "PrizeTreasuryDeposit_createdAt_idx" ON "PrizeTreasuryDeposit"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicGoodsRecipient_itemId_key" ON "PublicGoodsRecipient"("itemId");

-- CreateIndex
CREATE INDEX "WishocraticDistribution_weightsHash_idx" ON "WishocraticDistribution"("weightsHash");

-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_entityType_entityId_idx" ON "Activity"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_type_channel_key" ON "NotificationPreference"("userId", "type", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "Organization_jurisdictionId_idx" ON "Organization"("jurisdictionId");

-- CreateIndex
CREATE INDEX "Organization_creatorId_idx" ON "Organization"("creatorId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Survey_slug_key" ON "Survey"("slug");

-- CreateIndex
CREATE INDEX "Survey_slug_idx" ON "Survey"("slug");

-- CreateIndex
CREATE INDEX "Survey_jurisdictionId_idx" ON "Survey"("jurisdictionId");

-- CreateIndex
CREATE INDEX "Survey_referendumId_idx" ON "Survey"("referendumId");

-- CreateIndex
CREATE INDEX "Survey_active_idx" ON "Survey"("active");

-- CreateIndex
CREATE INDEX "SurveySection_surveyId_idx" ON "SurveySection"("surveyId");

-- CreateIndex
CREATE INDEX "SurveySection_deletedAt_idx" ON "SurveySection"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SurveySection_surveyId_sortOrder_key" ON "SurveySection"("surveyId", "sortOrder");

-- CreateIndex
CREATE INDEX "SurveyQuestion_sectionId_idx" ON "SurveyQuestion"("sectionId");

-- CreateIndex
CREATE INDEX "SurveyQuestion_deletedAt_idx" ON "SurveyQuestion"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyQuestion_sectionId_sortOrder_key" ON "SurveyQuestion"("sectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "SurveyResponse_surveyId_idx" ON "SurveyResponse"("surveyId");

-- CreateIndex
CREATE INDEX "SurveyResponse_userId_idx" ON "SurveyResponse"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_surveyId_userId_key" ON "SurveyResponse"("surveyId", "userId");

-- CreateIndex
CREATE INDEX "QuestionResponse_surveyResponseId_idx" ON "QuestionResponse"("surveyResponseId");

-- CreateIndex
CREATE INDEX "QuestionResponse_questionId_idx" ON "QuestionResponse"("questionId");

-- CreateIndex
CREATE INDEX "QuestionResponse_deletedAt_idx" ON "QuestionResponse"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionResponse_surveyResponseId_questionId_key" ON "QuestionResponse"("surveyResponseId", "questionId");

-- CreateIndex
CREATE INDEX "Badge_userId_idx" ON "Badge"("userId");

-- CreateIndex
CREATE INDEX "Badge_type_idx" ON "Badge"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_userId_type_key" ON "Badge"("userId", "type");

-- CreateIndex
CREATE INDEX "SocialAccount_userId_idx" ON "SocialAccount"("userId");

-- CreateIndex
CREATE INDEX "SocialAccount_platform_idx" ON "SocialAccount"("platform");

-- CreateIndex
CREATE INDEX "SocialAccount_walletAddress_idx" ON "SocialAccount"("walletAddress");

-- CreateIndex
CREATE INDEX "SocialAccount_deletedAt_idx" ON "SocialAccount"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_userId_platform_key" ON "SocialAccount"("userId", "platform");

-- CreateIndex
CREATE INDEX "EmailLog_userId_idx" ON "EmailLog"("userId");

-- CreateIndex
CREATE INDEX "EmailLog_templateId_idx" ON "EmailLog"("templateId");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_sentAt_idx" ON "EmailLog"("sentAt");

-- CreateIndex
CREATE INDEX "AlignmentScore_politicianId_idx" ON "AlignmentScore"("politicianId");

-- CreateIndex
CREATE INDEX "AlignmentScore_aggregationRunId_idx" ON "AlignmentScore"("aggregationRunId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_jurisdictionId_name_key" ON "Item"("jurisdictionId", "name");

-- CreateIndex
CREATE INDEX "Measurement_userId_startTime_idx" ON "Measurement"("userId", "startTime");

-- CreateIndex
CREATE INDEX "Measurement_globalVariableId_startTime_idx" ON "Measurement"("globalVariableId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "Politician_jurisdictionId_externalId_key" ON "Politician"("jurisdictionId", "externalId");

-- CreateIndex
CREATE INDEX "PoliticianVote_itemId_idx" ON "PoliticianVote"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "PoliticianVote_politicianId_itemId_key" ON "PoliticianVote"("politicianId", "itemId");

-- CreateIndex
CREATE INDEX "TrackingReminder_nOf1VariableId_idx" ON "TrackingReminder"("nOf1VariableId");

-- CreateIndex
CREATE INDEX "User_isPublic_idx" ON "User"("isPublic");

-- CreateIndex
CREATE INDEX "WishocraticAllocation_itemAId_idx" ON "WishocraticAllocation"("itemAId");

-- CreateIndex
CREATE INDEX "WishocraticAllocation_itemBId_idx" ON "WishocraticAllocation"("itemBId");

-- CreateIndex
CREATE UNIQUE INDEX "WishocraticAllocation_userId_itemAId_itemBId_key" ON "WishocraticAllocation"("userId", "itemAId", "itemBId");

-- CreateIndex
CREATE INDEX "WishocraticCategorySelection_itemId_idx" ON "WishocraticCategorySelection"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "WishocraticCategorySelection_userId_itemId_key" ON "WishocraticCategorySelection"("userId", "itemId");

-- RenameForeignKey
ALTER TABLE "Referral" RENAME CONSTRAINT "Vote_referredByUserId_fkey" TO "Referral_referredByUserId_fkey";

-- RenameForeignKey
ALTER TABLE "Referral" RENAME CONSTRAINT "Vote_userId_fkey" TO "Referral_userId_fkey";

-- AddForeignKey
ALTER TABLE "WishocraticAllocation" ADD CONSTRAINT "WishocraticAllocation_itemAId_fkey" FOREIGN KEY ("itemAId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishocraticAllocation" ADD CONSTRAINT "WishocraticAllocation_itemBId_fkey" FOREIGN KEY ("itemBId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishocraticCategorySelection" ADD CONSTRAINT "WishocraticCategorySelection_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliticianVote" ADD CONSTRAINT "PoliticianVote_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAlignmentScore" ADD CONSTRAINT "CategoryAlignmentScore_alignmentScoreId_fkey" FOREIGN KEY ("alignmentScoreId") REFERENCES "AlignmentScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAlignmentScore" ADD CONSTRAINT "CategoryAlignmentScore_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitizenBillVote" ADD CONSTRAINT "CitizenBillVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebPushSubscription" ADD CONSTRAINT "WebPushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishocraticEncryptedAllocation" ADD CONSTRAINT "WishocraticEncryptedAllocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referendum" ADD CONSTRAINT "Referendum_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referendum" ADD CONSTRAINT "Referendum_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferendumVote" ADD CONSTRAINT "ReferendumVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferendumVote" ADD CONSTRAINT "ReferendumVote_referendumId_fkey" FOREIGN KEY ("referendumId") REFERENCES "Referendum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferendumVote" ADD CONSTRAINT "ReferendumVote_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteTokenMint" ADD CONSTRAINT "VoteTokenMint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteTokenMint" ADD CONSTRAINT "VoteTokenMint_referendumId_fkey" FOREIGN KEY ("referendumId") REFERENCES "Referendum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicGoodsRecipient" ADD CONSTRAINT "PublicGoodsRecipient_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_referendumId_fkey" FOREIGN KEY ("referendumId") REFERENCES "Referendum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveySection" ADD CONSTRAINT "SurveySection_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "SurveySection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_surveyResponseId_fkey" FOREIGN KEY ("surveyResponseId") REFERENCES "SurveyResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Vote_createdAt_idx" RENAME TO "Referral_createdAt_idx";

-- RenameIndex
ALTER INDEX "Vote_deletedAt_idx" RENAME TO "Referral_deletedAt_idx";

-- RenameIndex
ALTER INDEX "Vote_referredByUserId_idx" RENAME TO "Referral_referredByUserId_idx";

-- RenameIndex
ALTER INDEX "Vote_userId_idx" RENAME TO "Referral_userId_idx";

-- RenameIndex
ALTER INDEX "Vote_userId_key" RENAME TO "Referral_userId_key";

