-- Add partner organization attribution to referendum votes and survey responses.
ALTER TABLE "ReferendumVote"
  ADD COLUMN "organizationId" TEXT;

ALTER TABLE "SurveyResponse"
  ADD COLUMN "organizationId" TEXT;

CREATE INDEX "ReferendumVote_organizationId_idx" ON "ReferendumVote"("organizationId");
CREATE INDEX "SurveyResponse_organizationId_idx" ON "SurveyResponse"("organizationId");

ALTER TABLE "ReferendumVote"
  ADD CONSTRAINT "ReferendumVote_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SurveyResponse"
  ADD CONSTRAINT "SurveyResponse_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
