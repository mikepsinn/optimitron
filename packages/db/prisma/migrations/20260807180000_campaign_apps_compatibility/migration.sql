-- Campaign apps compatibility (dih-neobrutalist cutover)
-- Adds treaty Vote, Campaign suite, Donation, skills/links, desire pair tables,
-- and optional User profile columns used by campaign apps.

-- User profile columns (ignore if already present on some envs)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "headline" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coverImage" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "weeklyDigest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "location" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- Enums (create type if missing — Postgres lacks IF NOT EXISTS for enums on older versions)
DO $$ BEGIN
  CREATE TYPE "CampaignType" AS ENUM ('DONATION', 'REWARD', 'EQUITY', 'PRE_ORDER');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'FUNDED', 'CANCELLED', 'FAILED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'DELAYED');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "ShippingStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED', 'LOST');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "TeamMemberRole" AS ENUM ('CREATOR', 'CO_CREATOR', 'MANAGER', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "DonationFrequency" AS ENUM ('ONE_TIME', 'MONTHLY');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Extend existing enums (ignore if already present)
ALTER TYPE "OrgType" ADD VALUE IF NOT EXISTS 'DIVISION';
ALTER TYPE "OrgType" ADD VALUE IF NOT EXISTS 'INSTITUTE';
ALTER TYPE "BadgeType" ADD VALUE IF NOT EXISTS 'FIFTY_RECRUITS';
ALTER TYPE "BadgeType" ADD VALUE IF NOT EXISTS 'HUNDRED_RECRUITS';
ALTER TYPE "BadgeType" ADD VALUE IF NOT EXISTS 'SOCIAL_WARRIOR';
ALTER TYPE "BadgeType" ADD VALUE IF NOT EXISTS 'GENEROUS_DONOR';
ALTER TYPE "BadgeType" ADD VALUE IF NOT EXISTS 'MONTHLY_SUPPORTER';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'VOTED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'RECRUITED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'PROFILE_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'JOINED_ORG';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SHARED_LINK';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CONNECTED_SOCIAL';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CAMPAIGN_CREATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CAMPAIGN_PLEDGED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CAMPAIGN_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CAMPAIGN_COMPLETED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'COMPLETED_WISHOCRATIC_ALLOCATION';

CREATE TABLE IF NOT EXISTS "Vote" (
  "id" TEXT NOT NULL,
  "answer" "VotePosition" NOT NULL,
  "militaryAllocationPercent" INTEGER,
  "userId" TEXT,
  "referredByUserId" TEXT,
  "referralInvitationId" TEXT,
  "organizationId" TEXT,
  "sourceUrl" TEXT,
  "sourceReferrer" TEXT,
  "ipAddress" TEXT,
  "fingerprint" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Vote_userId_key" ON "Vote"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Vote_referralInvitationId_key" ON "Vote"("referralInvitationId");
CREATE INDEX IF NOT EXISTS "Vote_userId_idx" ON "Vote"("userId");
CREATE INDEX IF NOT EXISTS "Vote_referredByUserId_idx" ON "Vote"("referredByUserId");
CREATE INDEX IF NOT EXISTS "Vote_organizationId_idx" ON "Vote"("organizationId");
CREATE INDEX IF NOT EXISTS "Vote_createdAt_idx" ON "Vote"("createdAt");

DO $$ BEGIN
  ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "Vote" ADD CONSTRAINT "Vote_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "Vote" ADD CONSTRAINT "Vote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Campaign" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "story" TEXT NOT NULL,
  "type" "CampaignType" NOT NULL,
  "creatorId" TEXT NOT NULL,
  "organizationId" TEXT,
  "goalAmount" INTEGER NOT NULL,
  "currentAmount" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endDate" TIMESTAMP(3),
  "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "videoUrl" TEXT,
  "coverImageUrl" TEXT,
  "images" TEXT,
  "category" TEXT NOT NULL,
  "tags" TEXT,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "backerCount" INTEGER NOT NULL DEFAULT 0,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "trending" BOOLEAN NOT NULL DEFAULT false,
  "refundPolicy" TEXT NOT NULL,
  "riskDisclosure" TEXT NOT NULL,
  "processingFeePercentage" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  "complianceData" TEXT,
  "flexibleFunding" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Campaign_slug_key" ON "Campaign"("slug");
CREATE INDEX IF NOT EXISTS "Campaign_creatorId_idx" ON "Campaign"("creatorId");
CREATE INDEX IF NOT EXISTS "Campaign_status_idx" ON "Campaign"("status");

CREATE TABLE IF NOT EXISTS "CampaignReward" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "estimatedDelivery" TIMESTAMP(3),
  "shippingEnabled" BOOLEAN NOT NULL DEFAULT true,
  "shippingFee" INTEGER NOT NULL DEFAULT 0,
  "shippingRegions" TEXT,
  "maxBackers" INTEGER,
  "currentBackers" INTEGER NOT NULL DEFAULT 0,
  "unlimited" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "digital" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampaignReward_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CampaignPledge" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rewardId" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "stripePaymentIntentId" TEXT,
  "stripeSubscriptionId" TEXT,
  "shippingAddress" TEXT,
  "shippingStatus" "ShippingStatus" NOT NULL DEFAULT 'PENDING',
  "trackingNumber" TEXT,
  "deliveryDate" TIMESTAMP(3),
  "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING',
  "fulfillmentNotes" TEXT,
  "isRecurring" BOOLEAN NOT NULL DEFAULT false,
  "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
  "refundedAt" TIMESTAMP(3),
  "refundReason" TEXT,
  "sourceUrl" TEXT,
  "sourceReferrer" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampaignPledge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CampaignStretchGoal" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "targetAmount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "achieved" BOOLEAN NOT NULL DEFAULT false,
  "achievedAt" TIMESTAMP(3),
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampaignStretchGoal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CampaignTeamMember" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "TeamMemberRole" NOT NULL,
  "permissions" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampaignTeamMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CampaignTeamMember_campaignId_userId_key" ON "CampaignTeamMember"("campaignId", "userId");

CREATE TABLE IF NOT EXISTS "CampaignUpdate" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampaignUpdate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Donation" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "frequency" "DonationFrequency" NOT NULL DEFAULT 'ONE_TIME',
  "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
  "stripeSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "stripeSubscriptionId" TEXT,
  "message" TEXT,
  "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
  "organizationId" TEXT,
  "sourceUrl" TEXT,
  "sourceReferrer" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Donation_stripeSessionId_key" ON "Donation"("stripeSessionId");

CREATE TABLE IF NOT EXISTS "Skill" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Skill_name_key" ON "Skill"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Skill_slug_key" ON "Skill"("slug");

CREATE TABLE IF NOT EXISTS "UserSkill" (
  "userId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "endorsements" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("userId","skillId")
);

CREATE TABLE IF NOT EXISTS "UserLink" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WishocraticCategorySelection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "selected" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WishocraticCategorySelection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "WishocraticCategorySelection_userId_categoryId_key" ON "WishocraticCategorySelection"("userId", "categoryId");

CREATE TABLE IF NOT EXISTS "WishocraticPairAllocation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "categoryA" TEXT NOT NULL,
  "categoryB" TEXT NOT NULL,
  "allocationA" INTEGER NOT NULL,
  "allocationB" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WishocraticPairAllocation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "WishocraticPairAllocation_userId_categoryA_categoryB_key" ON "WishocraticPairAllocation"("userId", "categoryA", "categoryB");
