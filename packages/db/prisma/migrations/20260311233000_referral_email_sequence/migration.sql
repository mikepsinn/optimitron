ALTER TABLE "User"
ADD COLUMN "referralEmailSequenceStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "referralEmailSequenceLastSentAt" TIMESTAMP(3);

CREATE INDEX "User_referralEmailSequenceStep_referralEmailSequenceLastSentAt_idx"
ON "User"("referralEmailSequenceStep", "referralEmailSequenceLastSentAt");
