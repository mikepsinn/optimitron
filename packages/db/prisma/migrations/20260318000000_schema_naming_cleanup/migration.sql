-- Schema Naming Cleanup
-- 1. Rename Item table to WishocraticItem (keep "Item" as @@map for backward compat is NOT needed
--    since the model has @@map("Item") which keeps the DB table name as "Item")
-- 2. Rename "Vote" table to "Referral" (remove @@map("Vote"))
-- 3. Rename numberOfUnits column to numberOfSubjects on AggregateVariableRelationship
-- 4. Drop dead tables: PairwiseComparison, Participant

-- Rename Vote table to Referral
ALTER TABLE "Vote" RENAME TO "Referral";

-- Rename numberOfUnits to numberOfSubjects on AggregateVariableRelationship
ALTER TABLE "AggregateVariableRelationship" RENAME COLUMN "numberOfUnits" TO "numberOfSubjects";

-- Drop the index on the renamed column and recreate it
DROP INDEX IF EXISTS "AggregateVariableRelationship_numberOfUnits_idx";
CREATE INDEX "AggregateVariableRelationship_numberOfSubjects_idx" ON "AggregateVariableRelationship"("numberOfSubjects");

-- Drop dead tables (no app code references these)
DROP TABLE IF EXISTS "PairwiseComparison";
DROP TABLE IF EXISTS "Participant";
