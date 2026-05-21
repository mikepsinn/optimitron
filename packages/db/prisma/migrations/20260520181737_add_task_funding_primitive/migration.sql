-- CreateEnum
CREATE TYPE "TaskFundingTargetStatus" AS ENUM ('OPEN', 'THRESHOLD_MET', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskFundingPledgerKind" AS ENUM ('PERSON', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "TaskFundingPledgeStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'CALLED', 'FULFILLED');

-- CreateEnum
CREATE TYPE "TaskFundingEventType" AS ENUM ('PLEDGE_CREATED', 'PLEDGE_UPDATED', 'PLEDGE_CANCELLED', 'TARGET_UPDATED', 'THRESHOLD_MET', 'NOTIFICATION_SENT');

-- CreateTable
CREATE TABLE "TaskFundingTarget" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "targetAmountCents" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "primaryUnitKey" TEXT,
    "primaryUnitTargetQuantity" DECIMAL(20,3),
    "status" "TaskFundingTargetStatus" NOT NULL DEFAULT 'OPEN',
    "termsVersion" TEXT,
    "expiresAt" TIMESTAMP(3),
    "thresholdMetAt" TIMESTAMP(3),
    "thresholdMetByPledgeId" TEXT,
    "notificationSentAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskFundingTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskFundingPledge" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "pledgerKind" "TaskFundingPledgerKind" NOT NULL,
    "pledgeActorKey" TEXT NOT NULL,
    "pledgedByUserId" TEXT,
    "pledgerPersonId" TEXT,
    "pledgerOrganizationId" TEXT,
    "publicDisplay" BOOLEAN NOT NULL DEFAULT false,
    "publicNameSnapshot" TEXT,
    "unitKey" TEXT NOT NULL,
    "unitQuantity" DECIMAL(20,3) NOT NULL,
    "unitAmountCentsSnapshot" BIGINT,
    "committedAmountCents" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "conversionVersion" TEXT NOT NULL,
    "conversionSource" TEXT,
    "commerceOfferId" TEXT,
    "commerceOfferVariantId" TEXT,
    "termsVersion" TEXT,
    "termsNote" TEXT,
    "status" "TaskFundingPledgeStatus" NOT NULL DEFAULT 'ACTIVE',
    "idempotencyKey" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledByUserId" TEXT,
    "cancellationReason" TEXT,
    "calledAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskFundingPledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskFundingEvent" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "pledgeId" TEXT,
    "eventType" "TaskFundingEventType" NOT NULL,
    "dedupeKey" TEXT,
    "actorUserId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskFundingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskFundingTarget_taskId_key" ON "TaskFundingTarget"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskFundingPledge_idempotencyKey_key" ON "TaskFundingPledge"("idempotencyKey");

-- CreateIndex
CREATE INDEX "TaskFundingPledge_targetId_status_createdAt_idx" ON "TaskFundingPledge"("targetId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TaskFundingPledge_targetId_pledgerKind_status_idx" ON "TaskFundingPledge"("targetId", "pledgerKind", "status");

-- CreateIndex
CREATE INDEX "TaskFundingPledge_publicDisplay_status_createdAt_idx" ON "TaskFundingPledge"("publicDisplay", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TaskFundingPledge_active_aggregate_idx"
  ON "TaskFundingPledge"("targetId","pledgerKind","createdAt")
  WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "TaskFundingPledge_targetId_pledgeActorKey_unitKey_key" ON "TaskFundingPledge"("targetId", "pledgeActorKey", "unitKey");

-- CreateIndex
CREATE UNIQUE INDEX "TaskFundingEvent_dedupeKey_key" ON "TaskFundingEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "TaskFundingEvent_targetId_eventType_createdAt_idx" ON "TaskFundingEvent"("targetId", "eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "TaskFundingTarget" ADD CONSTRAINT "TaskFundingTarget_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingTarget" ADD CONSTRAINT "TaskFundingTarget_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingPledge" ADD CONSTRAINT "TaskFundingPledge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "TaskFundingTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingPledge" ADD CONSTRAINT "TaskFundingPledge_pledgedByUserId_fkey" FOREIGN KEY ("pledgedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingPledge" ADD CONSTRAINT "TaskFundingPledge_pledgerPersonId_fkey" FOREIGN KEY ("pledgerPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingPledge" ADD CONSTRAINT "TaskFundingPledge_pledgerOrganizationId_fkey" FOREIGN KEY ("pledgerOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingPledge" ADD CONSTRAINT "TaskFundingPledge_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingPledge" ADD CONSTRAINT "TaskFundingPledge_commerceOfferId_fkey" FOREIGN KEY ("commerceOfferId") REFERENCES "CommerceOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingPledge" ADD CONSTRAINT "TaskFundingPledge_commerceOfferVariantId_fkey" FOREIGN KEY ("commerceOfferVariantId") REFERENCES "CommerceOfferVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingEvent" ADD CONSTRAINT "TaskFundingEvent_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "TaskFundingTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingEvent" ADD CONSTRAINT "TaskFundingEvent_pledgeId_fkey" FOREIGN KEY ("pledgeId") REFERENCES "TaskFundingPledge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingEvent" ADD CONSTRAINT "TaskFundingEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
