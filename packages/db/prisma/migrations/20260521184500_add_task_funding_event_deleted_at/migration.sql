ALTER TABLE "TaskFundingEvent" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "TaskFundingEvent_deletedAt_idx" ON "TaskFundingEvent"("deletedAt");
