-- Per-row origin tracking. All columns nullable; backfill left null for
-- pre-existing rows (we don't know where they came from).
--
-- Single column shape across all three tables: a full URL captured at
-- insert time. The site variant key is derivable from the URL's host on
-- demand via getSiteFromHost — no separate normalized column anywhere.
-- Add a Postgres generated column or partial index later if per-variant
-- queries become hot enough to need indexed lookup.
--
--   User.signupLandingUrl       → first URL a user landed on (first signin wins)
--   ReferralInvitation.originUrl → URL the inviter was on when composing
--   ReferendumVote.originUrl     → URL the voter was on when casting

ALTER TABLE "User" ADD COLUMN "signupLandingUrl" TEXT;

ALTER TABLE "ReferralInvitation" ADD COLUMN "originUrl" TEXT;

ALTER TABLE "ReferendumVote" ADD COLUMN "originUrl" TEXT;
