-- Add first-class ballot/content fields for API-created referendums.

CREATE TYPE "ReferendumKind" AS ENUM (
  'GENERAL',
  'DECLARATION',
  'TREATY',
  'MEMBERSHIP',
  'COURT_CASE',
  'AMENDMENT',
  'BUDGET'
);

ALTER TABLE "Referendum"
  ADD COLUMN "question" TEXT,
  ADD COLUMN "kind" "ReferendumKind" NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "bodyMarkdown" TEXT,
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "lockedAt" TIMESTAMP(3),
  ADD COLUMN "contentHash" TEXT;

UPDATE "Referendum"
SET
  "question" = CASE
    WHEN "slug" = 'one-percent-treaty'
      THEN 'Should governments redirect 1% of military spending to pragmatic clinical trials and disease eradication by adopting the 1% Treaty?'
    WHEN "slug" = 'declaration-of-optimization'
      THEN 'Do you endorse the Declaration of Optimization?'
    WHEN "slug" = 'court-of-humanity'
      THEN 'Should every person have the legal right to seek justice against any government that kills, injures, or harms them or their family?'
    ELSE COALESCE(NULLIF("description", ''), "title")
  END,
  "kind" = CASE
    WHEN "slug" = 'one-percent-treaty' THEN 'TREATY'::"ReferendumKind"
    WHEN "slug" = 'declaration-of-optimization' THEN 'DECLARATION'::"ReferendumKind"
    WHEN "slug" = 'court-of-humanity' THEN 'MEMBERSHIP'::"ReferendumKind"
    ELSE "kind"
  END,
  "publishedAt" = COALESCE("publishedAt", "createdAt")
WHERE "question" IS NULL;

ALTER TABLE "Referendum"
  ALTER COLUMN "question" SET NOT NULL;

CREATE INDEX "Referendum_kind_status_idx" ON "Referendum"("kind", "status");
CREATE INDEX "Referendum_contentHash_idx" ON "Referendum"("contentHash");
