-- Assurance-contract escrow: saved-card pledges charged off-session when a
-- target fully funds. See .claude/plans/task-funding-assurance-escrow.md.

-- AlterEnum
ALTER TYPE "TaskFundingPledgeStatus" ADD VALUE 'DECLINED';

-- CreateEnum
CREATE TYPE "TaskFundingPaymentSource" AS ENUM ('CHECKOUT', 'PLEDGE_CALL');

-- AlterTable: durable Stripe customer per user
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- AlterTable: saved card on pledges
ALTER TABLE "TaskFundingPledge" ADD COLUMN "stripeSetupIntentId" TEXT,
ADD COLUMN "stripePaymentMethodId" TEXT,
ADD COLUMN "cardBrand" TEXT,
ADD COLUMN "cardLast4" TEXT,
ADD COLUMN "declinedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "TaskFundingPledge_stripeSetupIntentId_key" ON "TaskFundingPledge"("stripeSetupIntentId");

-- AlterTable: payments can originate from a pledge call
ALTER TABLE "TaskFundingPayment" ADD COLUMN "pledgeId" TEXT,
ADD COLUMN "source" "TaskFundingPaymentSource" NOT NULL DEFAULT 'CHECKOUT';

-- CreateIndex
CREATE UNIQUE INDEX "TaskFundingPayment_pledgeId_key" ON "TaskFundingPayment"("pledgeId");

-- AddForeignKey
ALTER TABLE "TaskFundingPayment" ADD CONSTRAINT "TaskFundingPayment_pledgeId_fkey" FOREIGN KEY ("pledgeId") REFERENCES "TaskFundingPledge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
