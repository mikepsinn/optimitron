BEGIN;

-- CreateEnum
CREATE TYPE "FormPurpose" AS ENUM ('SURVEY', 'APPLICATION', 'INTAKE', 'ASSESSMENT', 'QUESTIONNAIRE');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'RICH_TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'DATETIME', 'SINGLE_SELECT', 'MULTI_SELECT', 'RATING', 'URL', 'EMAIL');

-- CreateEnum
CREATE TYPE "FormSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "KnowledgeSensitivity" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');

-- The legacy survey schema had no runtime consumer and is expected to be empty.
-- Refuse to discard unexpected data instead of silently guessing at a migration.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Survey" LIMIT 1)
    OR EXISTS (SELECT 1 FROM "SurveySection" LIMIT 1)
    OR EXISTS (SELECT 1 FROM "SurveyQuestion" LIMIT 1)
    OR EXISTS (SELECT 1 FROM "SurveyResponse" LIMIT 1)
    OR EXISTS (SELECT 1 FROM "QuestionResponse" LIMIT 1)
  THEN
    RAISE EXCEPTION 'Legacy survey tables are not empty; migrate their data before normalizing forms';
  END IF;
END $$;

-- DropForeignKey
ALTER TABLE "QuestionResponse" DROP CONSTRAINT "QuestionResponse_questionId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionResponse" DROP CONSTRAINT "QuestionResponse_surveyResponseId_fkey";

-- DropForeignKey
ALTER TABLE "Survey" DROP CONSTRAINT "Survey_jurisdictionId_fkey";

-- DropForeignKey
ALTER TABLE "Survey" DROP CONSTRAINT "Survey_referendumId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyQuestion" DROP CONSTRAINT "SurveyQuestion_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyResponse" DROP CONSTRAINT "SurveyResponse_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyResponse" DROP CONSTRAINT "SurveyResponse_surveyId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyResponse" DROP CONSTRAINT "SurveyResponse_userId_fkey";

-- DropForeignKey
ALTER TABLE "SurveySection" DROP CONSTRAINT "SurveySection_surveyId_fkey";

-- DropTable
DROP TABLE "QuestionResponse";

-- DropTable
DROP TABLE "Survey";

-- DropTable
DROP TABLE "SurveyQuestion";

-- DropTable
DROP TABLE "SurveyResponse";

-- DropTable
DROP TABLE "SurveySection";

-- DropEnum
DROP TYPE "QuestionType";

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "purpose" "FormPurpose" NOT NULL DEFAULT 'SURVEY',
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "slug" TEXT,
    "visibility" "ContentVisibility" NOT NULL DEFAULT 'PRIVATE',
    "jurisdictionId" TEXT,
    "referendumId" TEXT,
    "organizationId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "currentRevisionId" TEXT,
    "sourceKey" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormRevision" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ModelRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contentHash" TEXT NOT NULL,
    "sourceArtifactId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FormRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSection" (
    "id" TEXT NOT NULL,
    "formRevisionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FormSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormField" (
    "id" TEXT NOT NULL,
    "formRevisionId" TEXT NOT NULL,
    "sectionId" TEXT,
    "key" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "description" TEXT,
    "type" "FormFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "knowledgeKey" TEXT,
    "optionsJson" JSONB,
    "validationJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeAnswer" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "identityKey" TEXT NOT NULL,
    "knowledgeKey" TEXT,
    "canonicalQuestion" TEXT NOT NULL,
    "contextTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "sensitivity" "KnowledgeSensitivity" NOT NULL DEFAULT 'INTERNAL',
    "validUntil" TIMESTAMP(3),
    "reviewTaskId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "formRevisionId" TEXT NOT NULL,
    "taskId" TEXT,
    "taskExecutionAttemptId" TEXT,
    "subjectId" TEXT,
    "createdByUserId" TEXT,
    "respondentUserId" TEXT,
    "externalActionRequestId" TEXT,
    "status" "FormSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "idempotencyKey" TEXT,
    "requestHash" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormResponse" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "formRevisionId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "valueJson" JSONB,
    "knowledgeAnswerId" TEXT,
    "answerDocumentRevisionId" TEXT,
    "approvalVerificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FormResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Form_slug_key" ON "Form"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Form_currentRevisionId_key" ON "Form"("currentRevisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Form_sourceKey_key" ON "Form"("sourceKey");

-- CreateIndex
CREATE INDEX "Form_jurisdictionId_idx" ON "Form"("jurisdictionId");

-- CreateIndex
CREATE INDEX "Form_referendumId_idx" ON "Form"("referendumId");

-- CreateIndex
CREATE INDEX "Form_organizationId_idx" ON "Form"("organizationId");

-- CreateIndex
CREATE INDEX "Form_createdByUserId_idx" ON "Form"("createdByUserId");

-- CreateIndex
CREATE INDEX "Form_purpose_status_idx" ON "Form"("purpose", "status");

-- CreateIndex
CREATE INDEX "Form_visibility_idx" ON "Form"("visibility");

-- CreateIndex
CREATE INDEX "Form_deletedAt_idx" ON "Form"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Form_currentRevisionId_id_key" ON "Form"("currentRevisionId", "id");

-- CreateIndex
CREATE INDEX "FormRevision_formId_status_idx" ON "FormRevision"("formId", "status");

-- CreateIndex
CREATE INDEX "FormRevision_sourceArtifactId_idx" ON "FormRevision"("sourceArtifactId");

-- CreateIndex
CREATE INDEX "FormRevision_createdByUserId_idx" ON "FormRevision"("createdByUserId");

-- CreateIndex
CREATE INDEX "FormRevision_deletedAt_idx" ON "FormRevision"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FormRevision_formId_version_key" ON "FormRevision"("formId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FormRevision_formId_contentHash_key" ON "FormRevision"("formId", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "FormRevision_id_formId_key" ON "FormRevision"("id", "formId");

-- CreateIndex
CREATE INDEX "FormSection_formRevisionId_position_idx" ON "FormSection"("formRevisionId", "position");

-- CreateIndex
CREATE INDEX "FormSection_deletedAt_idx" ON "FormSection"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FormSection_formRevisionId_key_key" ON "FormSection"("formRevisionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "FormSection_id_formRevisionId_key" ON "FormSection"("id", "formRevisionId");

-- CreateIndex
CREATE INDEX "FormField_formRevisionId_position_idx" ON "FormField"("formRevisionId", "position");

-- CreateIndex
CREATE INDEX "FormField_sectionId_position_idx" ON "FormField"("sectionId", "position");

-- CreateIndex
CREATE INDEX "FormField_knowledgeKey_idx" ON "FormField"("knowledgeKey");

-- CreateIndex
CREATE INDEX "FormField_deletedAt_idx" ON "FormField"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FormField_formRevisionId_key_key" ON "FormField"("formRevisionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "FormField_id_formRevisionId_key" ON "FormField"("id", "formRevisionId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeAnswer_reviewTaskId_key" ON "KnowledgeAnswer"("reviewTaskId");

-- CreateIndex
CREATE INDEX "KnowledgeAnswer_subjectId_knowledgeKey_idx" ON "KnowledgeAnswer"("subjectId", "knowledgeKey");

-- CreateIndex
CREATE INDEX "KnowledgeAnswer_subjectId_validUntil_idx" ON "KnowledgeAnswer"("subjectId", "validUntil");

-- CreateIndex
CREATE INDEX "KnowledgeAnswer_createdByUserId_idx" ON "KnowledgeAnswer"("createdByUserId");

-- CreateIndex
CREATE INDEX "KnowledgeAnswer_deletedAt_idx" ON "KnowledgeAnswer"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeAnswer_subjectId_identityKey_key" ON "KnowledgeAnswer"("subjectId", "identityKey");

-- CreateIndex
CREATE UNIQUE INDEX "FormSubmission_externalActionRequestId_key" ON "FormSubmission"("externalActionRequestId");

-- CreateIndex
CREATE INDEX "FormSubmission_formRevisionId_status_idx" ON "FormSubmission"("formRevisionId", "status");

-- CreateIndex
CREATE INDEX "FormSubmission_taskId_status_idx" ON "FormSubmission"("taskId", "status");

-- CreateIndex
CREATE INDEX "FormSubmission_taskExecutionAttemptId_idx" ON "FormSubmission"("taskExecutionAttemptId");

-- CreateIndex
CREATE INDEX "FormSubmission_subjectId_status_idx" ON "FormSubmission"("subjectId", "status");

-- CreateIndex
CREATE INDEX "FormSubmission_respondentUserId_status_idx" ON "FormSubmission"("respondentUserId", "status");

-- CreateIndex
CREATE INDEX "FormSubmission_createdByUserId_idx" ON "FormSubmission"("createdByUserId");

-- CreateIndex
CREATE INDEX "FormSubmission_submittedAt_idx" ON "FormSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "FormSubmission_deletedAt_idx" ON "FormSubmission"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FormSubmission_createdByUserId_idempotencyKey_key" ON "FormSubmission"("createdByUserId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "FormSubmission_id_formRevisionId_key" ON "FormSubmission"("id", "formRevisionId");

-- CreateIndex
CREATE INDEX "FormResponse_formRevisionId_fieldId_idx" ON "FormResponse"("formRevisionId", "fieldId");

-- CreateIndex
CREATE INDEX "FormResponse_knowledgeAnswerId_idx" ON "FormResponse"("knowledgeAnswerId");

-- CreateIndex
CREATE INDEX "FormResponse_answerDocumentRevisionId_idx" ON "FormResponse"("answerDocumentRevisionId");

-- CreateIndex
CREATE INDEX "FormResponse_approvalVerificationId_idx" ON "FormResponse"("approvalVerificationId");

-- CreateIndex
CREATE INDEX "FormResponse_deletedAt_idx" ON "FormResponse"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FormResponse_submissionId_fieldId_key" ON "FormResponse"("submissionId", "fieldId");

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_referendumId_fkey" FOREIGN KEY ("referendumId") REFERENCES "Referendum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_currentRevisionId_id_fkey" FOREIGN KEY ("currentRevisionId", "id") REFERENCES "FormRevision"("id", "formId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormRevision" ADD CONSTRAINT "FormRevision_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormRevision" ADD CONSTRAINT "FormRevision_sourceArtifactId_fkey" FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormRevision" ADD CONSTRAINT "FormRevision_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSection" ADD CONSTRAINT "FormSection_formRevisionId_fkey" FOREIGN KEY ("formRevisionId") REFERENCES "FormRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_formRevisionId_fkey" FOREIGN KEY ("formRevisionId") REFERENCES "FormRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_sectionId_formRevisionId_fkey" FOREIGN KEY ("sectionId", "formRevisionId") REFERENCES "FormSection"("id", "formRevisionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAnswer" ADD CONSTRAINT "KnowledgeAnswer_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAnswer" ADD CONSTRAINT "KnowledgeAnswer_reviewTaskId_fkey" FOREIGN KEY ("reviewTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAnswer" ADD CONSTRAINT "KnowledgeAnswer_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_formRevisionId_fkey" FOREIGN KEY ("formRevisionId") REFERENCES "FormRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_taskExecutionAttemptId_fkey" FOREIGN KEY ("taskExecutionAttemptId") REFERENCES "TaskExecutionAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_respondentUserId_fkey" FOREIGN KEY ("respondentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_externalActionRequestId_fkey" FOREIGN KEY ("externalActionRequestId") REFERENCES "ExternalActionRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_submissionId_formRevisionId_fkey" FOREIGN KEY ("submissionId", "formRevisionId") REFERENCES "FormSubmission"("id", "formRevisionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_fieldId_formRevisionId_fkey" FOREIGN KEY ("fieldId", "formRevisionId") REFERENCES "FormField"("id", "formRevisionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_knowledgeAnswerId_fkey" FOREIGN KEY ("knowledgeAnswerId") REFERENCES "KnowledgeAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_answerDocumentRevisionId_fkey" FOREIGN KEY ("answerDocumentRevisionId") REFERENCES "DocumentRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_approvalVerificationId_fkey" FOREIGN KEY ("approvalVerificationId") REFERENCES "TaskVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
