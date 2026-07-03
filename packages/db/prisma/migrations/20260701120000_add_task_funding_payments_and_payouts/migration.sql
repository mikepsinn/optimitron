-- CreateEnum
CREATE TYPE "TaskFundingPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "StripeConnectedAccountStatus" AS ENUM ('CREATED', 'ONBOARDING_STARTED', 'ONBOARDING_COMPLETE', 'RESTRICTED', 'DISABLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "StripeTransferCapabilityStatus" AS ENUM ('UNKNOWN', 'PENDING', 'ACTIVE', 'INACTIVE', 'REQUIREMENTS_PAST_DUE', 'DISABLED');

-- CreateEnum
CREATE TYPE "TaskPayoutStatus" AS ENUM ('PENDING_CONNECT', 'PENDING_FUNDS', 'READY', 'PROCESSING', 'TRANSFERRED', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "TaskFundingPayment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "commerceOrderId" TEXT NOT NULL,
    "donorUserId" TEXT,
    "donorOrganizationId" TEXT,
    "donorEmail" TEXT,
    "donorName" TEXT,
    "publicDisplay" BOOLEAN NOT NULL DEFAULT false,
    "publicNameSnapshot" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "TaskFundingPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "stripeTransferGroup" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "disputedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskFundingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeConnectedAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personId" TEXT,
    "stripeAccountId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'us',
    "contactEmail" TEXT,
    "displayName" TEXT,
    "dashboardAccess" TEXT NOT NULL DEFAULT 'express',
    "configuration" TEXT NOT NULL DEFAULT 'recipient',
    "status" "StripeConnectedAccountStatus" NOT NULL DEFAULT 'CREATED',
    "transfersCapabilityStatus" "StripeTransferCapabilityStatus" NOT NULL DEFAULT 'UNKNOWN',
    "requirementsCurrentlyDueCount" INTEGER NOT NULL DEFAULT 0,
    "requirementsEventuallyDueCount" INTEGER NOT NULL DEFAULT 0,
    "requirementsPastDueCount" INTEGER NOT NULL DEFAULT 0,
    "requirementsJson" JSONB,
    "onboardingStartedAt" TIMESTAMP(3),
    "onboardingCompletedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StripeConnectedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskPayout" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "taskClaimId" TEXT,
    "payeeUserId" TEXT NOT NULL,
    "payeePersonId" TEXT,
    "stripeConnectedAccountId" TEXT,
    "approvedByUserId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "TaskPayoutStatus" NOT NULL DEFAULT 'PENDING_CONNECT',
    "stripeTransferId" TEXT,
    "stripeTransferGroup" TEXT,
    "approvedAt" TIMESTAMP(3),
    "queuedAt" TIMESTAMP(3),
    "processingAt" TIMESTAMP(3),
    "transferredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskFundingPayment_commerceOrderId_key" ON "TaskFundingPayment"("commerceOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskFundingPayment_stripeCheckoutSessionId_key" ON "TaskFundingPayment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "TaskFundingPayment_taskId_status_createdAt_idx" ON "TaskFundingPayment"("taskId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TaskFundingPayment_targetId_status_createdAt_idx" ON "TaskFundingPayment"("targetId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TaskFundingPayment_donorUserId_status_idx" ON "TaskFundingPayment"("donorUserId", "status");

-- CreateIndex
CREATE INDEX "TaskFundingPayment_donorOrganizationId_status_idx" ON "TaskFundingPayment"("donorOrganizationId", "status");

-- CreateIndex
CREATE INDEX "TaskFundingPayment_stripePaymentIntentId_idx" ON "TaskFundingPayment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "TaskFundingPayment_stripeChargeId_idx" ON "TaskFundingPayment"("stripeChargeId");

-- CreateIndex
CREATE INDEX "TaskFundingPayment_stripeTransferGroup_idx" ON "TaskFundingPayment"("stripeTransferGroup");

-- CreateIndex
CREATE INDEX "TaskFundingPayment_deletedAt_idx" ON "TaskFundingPayment"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnectedAccount_userId_key" ON "StripeConnectedAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnectedAccount_stripeAccountId_key" ON "StripeConnectedAccount"("stripeAccountId");

-- CreateIndex
CREATE INDEX "StripeConnectedAccount_personId_idx" ON "StripeConnectedAccount"("personId");

-- CreateIndex
CREATE INDEX "StripeConnectedAccount_status_idx" ON "StripeConnectedAccount"("status");

-- CreateIndex
CREATE INDEX "StripeConnectedAccount_transfersCapabilityStatus_idx" ON "StripeConnectedAccount"("transfersCapabilityStatus");

-- CreateIndex
CREATE INDEX "StripeConnectedAccount_deletedAt_idx" ON "StripeConnectedAccount"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaskPayout_taskClaimId_key" ON "TaskPayout"("taskClaimId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskPayout_stripeTransferId_key" ON "TaskPayout"("stripeTransferId");

-- CreateIndex
CREATE INDEX "TaskPayout_taskId_status_idx" ON "TaskPayout"("taskId", "status");

-- CreateIndex
CREATE INDEX "TaskPayout_payeeUserId_status_idx" ON "TaskPayout"("payeeUserId", "status");

-- CreateIndex
CREATE INDEX "TaskPayout_payeePersonId_status_idx" ON "TaskPayout"("payeePersonId", "status");

-- CreateIndex
CREATE INDEX "TaskPayout_stripeConnectedAccountId_status_idx" ON "TaskPayout"("stripeConnectedAccountId", "status");

-- CreateIndex
CREATE INDEX "TaskPayout_approvedByUserId_idx" ON "TaskPayout"("approvedByUserId");

-- CreateIndex
CREATE INDEX "TaskPayout_nextAttemptAt_idx" ON "TaskPayout"("nextAttemptAt");

-- CreateIndex
CREATE INDEX "TaskPayout_deletedAt_idx" ON "TaskPayout"("deletedAt");

-- AddForeignKey
ALTER TABLE "TaskFundingPayment" ADD CONSTRAINT "TaskFundingPayment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingPayment" ADD CONSTRAINT "TaskFundingPayment_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "TaskFundingTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingPayment" ADD CONSTRAINT "TaskFundingPayment_commerceOrderId_fkey" FOREIGN KEY ("commerceOrderId") REFERENCES "CommerceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingPayment" ADD CONSTRAINT "TaskFundingPayment_donorUserId_fkey" FOREIGN KEY ("donorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFundingPayment" ADD CONSTRAINT "TaskFundingPayment_donorOrganizationId_fkey" FOREIGN KEY ("donorOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeConnectedAccount" ADD CONSTRAINT "StripeConnectedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeConnectedAccount" ADD CONSTRAINT "StripeConnectedAccount_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPayout" ADD CONSTRAINT "TaskPayout_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPayout" ADD CONSTRAINT "TaskPayout_taskClaimId_fkey" FOREIGN KEY ("taskClaimId") REFERENCES "TaskClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPayout" ADD CONSTRAINT "TaskPayout_payeeUserId_fkey" FOREIGN KEY ("payeeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPayout" ADD CONSTRAINT "TaskPayout_payeePersonId_fkey" FOREIGN KEY ("payeePersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPayout" ADD CONSTRAINT "TaskPayout_stripeConnectedAccountId_fkey" FOREIGN KEY ("stripeConnectedAccountId") REFERENCES "StripeConnectedAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPayout" ADD CONSTRAINT "TaskPayout_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
