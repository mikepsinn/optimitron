-- Rename pre-launch sender "nudge" fields to "reminder" without dropping data.
ALTER TABLE "ReferralInvitation"
  RENAME COLUMN "senderNudgeOptedInAt" TO "senderReminderOptedInAt";

ALTER TABLE "ReferralInvitation"
  RENAME COLUMN "senderNudgeStep" TO "senderReminderStep";

ALTER TABLE "ReferralInvitation"
  RENAME COLUMN "nextSenderNudgeAt" TO "nextSenderReminderAt";

ALTER TABLE "ReferralInvitation"
  RENAME COLUMN "lastSenderNudgeAt" TO "lastSenderReminderAt";

ALTER INDEX IF EXISTS "ReferralInvitation_nextSenderNudgeAt_idx"
  RENAME TO "ReferralInvitation_nextSenderReminderAt_idx";
