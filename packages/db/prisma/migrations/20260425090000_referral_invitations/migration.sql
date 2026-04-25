-- AddEnum
CREATE TYPE "ReferralInvitationStatus" AS ENUM (
  'PENDING',
  'COPIED',
  'SENT',
  'CONVERTED',
  'DECLINED',
  'CANCELLED'
);

CREATE TYPE "ReferralInvitationMessageFormat" AS ENUM (
  'TASK_NOTIFICATION',
  'SINCERE'
);

CREATE TYPE "ReferralInvitationContactMethod" AS ENUM (
  'EMAIL',
  'COPY',
  'SMS',
  'OTHER'
);

-- CreateTable
CREATE TABLE "ReferralInvitation" (
  "id" TEXT NOT NULL,
  "referrerUserId" TEXT NOT NULL,
  "recipientPersonId" TEXT,
  "referendumId" TEXT,
  "taskId" TEXT,
  "shareAttemptId" TEXT,
  "convertedVoteId" TEXT,
  "inviteToken" TEXT NOT NULL,
  "recipientUnsubscribeToken" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "recipientEmail" TEXT,
  "contactMethod" "ReferralInvitationContactMethod",
  "messageFormat" "ReferralInvitationMessageFormat" NOT NULL DEFAULT 'SINCERE',
  "messageText" TEXT,
  "status" "ReferralInvitationStatus" NOT NULL DEFAULT 'PENDING',
  "copiedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "convertedAt" TIMESTAMP(3),
  "recipientUnsubscribedAt" TIMESTAMP(3),
  "recipientEmailStep" INTEGER NOT NULL DEFAULT 0,
  "nextRecipientEmailAt" TIMESTAMP(3),
  "lastRecipientEmailAt" TIMESTAMP(3),
  "recipientEmailProviderMessageId" TEXT,
  "recipientEmailErrorMessage" TEXT,
  "senderNudgeOptedInAt" TIMESTAMP(3),
  "senderNudgeStep" INTEGER NOT NULL DEFAULT 0,
  "nextSenderNudgeAt" TIMESTAMP(3),
  "lastSenderNudgeAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "ReferralInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralInvitation_convertedVoteId_key" ON "ReferralInvitation"("convertedVoteId");
CREATE UNIQUE INDEX "ReferralInvitation_inviteToken_key" ON "ReferralInvitation"("inviteToken");
CREATE UNIQUE INDEX "ReferralInvitation_recipientUnsubscribeToken_key" ON "ReferralInvitation"("recipientUnsubscribeToken");
CREATE INDEX "ReferralInvitation_referrerUserId_createdAt_idx" ON "ReferralInvitation"("referrerUserId", "createdAt");
CREATE INDEX "ReferralInvitation_recipientPersonId_idx" ON "ReferralInvitation"("recipientPersonId");
CREATE INDEX "ReferralInvitation_referendumId_idx" ON "ReferralInvitation"("referendumId");
CREATE INDEX "ReferralInvitation_taskId_idx" ON "ReferralInvitation"("taskId");
CREATE INDEX "ReferralInvitation_shareAttemptId_idx" ON "ReferralInvitation"("shareAttemptId");
CREATE INDEX "ReferralInvitation_status_idx" ON "ReferralInvitation"("status");
CREATE INDEX "ReferralInvitation_nextRecipientEmailAt_idx" ON "ReferralInvitation"("nextRecipientEmailAt");
CREATE INDEX "ReferralInvitation_recipientUnsubscribedAt_idx" ON "ReferralInvitation"("recipientUnsubscribedAt");
CREATE INDEX "ReferralInvitation_nextSenderNudgeAt_idx" ON "ReferralInvitation"("nextSenderNudgeAt");
CREATE INDEX "ReferralInvitation_deletedAt_idx" ON "ReferralInvitation"("deletedAt");

-- AddForeignKey
ALTER TABLE "ReferralInvitation"
  ADD CONSTRAINT "ReferralInvitation_referrerUserId_fkey"
  FOREIGN KEY ("referrerUserId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReferralInvitation"
  ADD CONSTRAINT "ReferralInvitation_recipientPersonId_fkey"
  FOREIGN KEY ("recipientPersonId") REFERENCES "Person"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReferralInvitation"
  ADD CONSTRAINT "ReferralInvitation_referendumId_fkey"
  FOREIGN KEY ("referendumId") REFERENCES "Referendum"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReferralInvitation"
  ADD CONSTRAINT "ReferralInvitation_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReferralInvitation"
  ADD CONSTRAINT "ReferralInvitation_shareAttemptId_fkey"
  FOREIGN KEY ("shareAttemptId") REFERENCES "ShareAttempt"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReferralInvitation"
  ADD CONSTRAINT "ReferralInvitation_convertedVoteId_fkey"
  FOREIGN KEY ("convertedVoteId") REFERENCES "ReferendumVote"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
