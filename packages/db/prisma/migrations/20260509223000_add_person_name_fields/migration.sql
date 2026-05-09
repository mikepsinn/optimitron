-- Add structured name fields for plaintiff filing records.
ALTER TABLE "Person"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "middleName" TEXT,
  ADD COLUMN "lastName" TEXT;

CREATE INDEX "Person_lastName_firstName_idx"
  ON "Person"("lastName", "firstName");
