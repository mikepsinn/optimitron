-- Drop dead email-sequence fields from User
DROP INDEX IF EXISTS "User_referralEmailSequenceStep_referralEmailSequenceLastSen_idx";

ALTER TABLE "User"
  DROP COLUMN IF EXISTS "referralEmailSequenceStep",
  DROP COLUMN IF EXISTS "referralEmailSequenceLastSentAt";

-- Drop dead reminder-state fields from ReferralInvitation
DROP INDEX IF EXISTS "ReferralInvitation_nextRecipientEmailAt_idx";
DROP INDEX IF EXISTS "ReferralInvitation_recipientUnsubscribedAt_idx";
DROP INDEX IF EXISTS "ReferralInvitation_nextSenderReminderAt_idx";
DROP INDEX IF EXISTS "ReferralInvitation_recipientUnsubscribeToken_key";

ALTER TABLE "ReferralInvitation"
  DROP COLUMN IF EXISTS "recipientUnsubscribedAt",
  DROP COLUMN IF EXISTS "recipientEmailStep",
  DROP COLUMN IF EXISTS "nextRecipientEmailAt",
  DROP COLUMN IF EXISTS "lastRecipientEmailAt",
  DROP COLUMN IF EXISTS "recipientEmailProviderMessageId",
  DROP COLUMN IF EXISTS "recipientEmailErrorMessage",
  DROP COLUMN IF EXISTS "senderReminderOptedInAt",
  DROP COLUMN IF EXISTS "senderReminderStep",
  DROP COLUMN IF EXISTS "nextSenderReminderAt",
  DROP COLUMN IF EXISTS "lastSenderReminderAt",
  DROP COLUMN IF EXISTS "recipientUnsubscribeToken";
