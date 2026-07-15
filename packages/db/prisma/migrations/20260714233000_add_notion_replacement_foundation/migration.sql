-- Stable documents, bounded collections, shared content permissions, and
-- private content attachments. Existing version-row documents are preserved.

ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CONTENT_ACCESS_CHANGED';
ALTER TYPE "SourceSystem" ADD VALUE IF NOT EXISTS 'NOTION';
ALTER TYPE "SourceArtifactType" ADD VALUE IF NOT EXISTS 'NOTION_PAGE';
ALTER TYPE "SourceArtifactType" ADD VALUE IF NOT EXISTS 'NOTION_DATABASE';
ALTER TYPE "SourceArtifactType" ADD VALUE IF NOT EXISTS 'NOTION_EXPORT';
ALTER TYPE "SourceArtifactType" ADD VALUE IF NOT EXISTS 'FILE_IMPORT';

ALTER TYPE "DocumentVisibility" RENAME TO "ContentVisibility";

CREATE TYPE "ContentAccessLevel" AS ENUM (
  'VIEW',
  'COMMENT',
  'EDIT_CONTENT',
  'EDIT',
  'FULL_ACCESS'
);

CREATE TYPE "CollectionFieldType" AS ENUM (
  'TEXT',
  'RICH_TEXT',
  'NUMBER',
  'BOOLEAN',
  'DATE',
  'SELECT',
  'MULTI_SELECT',
  'URL',
  'EMAIL',
  'FILE',
  'RELATION',
  'TASK',
  'PERSON',
  'ORGANIZATION',
  'DOCUMENT',
  'FORMULA',
  'ROLLUP'
);

-- Replace the old one-row-per-version table without losing existing URLs or
-- history. The current legacy row id becomes the stable Document id, while
-- every legacy row id is retained as its DocumentRevision id.
ALTER TABLE "Document" RENAME TO "DocumentLegacy";
ALTER TABLE "DocumentLegacy"
  RENAME CONSTRAINT "Document_pkey" TO "DocumentLegacy_pkey";

CREATE TABLE "DocumentNext" (
  "id" TEXT NOT NULL,
  "jurisdictionId" TEXT,
  "taskId" TEXT,
  "organizationId" TEXT,
  "parentDocumentId" TEXT,
  "currentRevisionId" TEXT,
  "title" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "visibility" "ContentVisibility" NOT NULL DEFAULT 'PRIVATE',
  "createdByUserId" TEXT NOT NULL,
  "sourceKey" TEXT,
  "sourceUrl" TEXT,
  "searchText" TEXT NOT NULL DEFAULT '',
  "idempotencyKey" TEXT,
  "requestHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "DocumentNext_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DocumentNext_version_check" CHECK ("version" >= 0)
);

CREATE TABLE "DocumentRevision" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "sourceArtifactId" TEXT,
  "contentHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "DocumentRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DocumentRevision_version_check" CHECK ("version" > 0)
);

WITH current_documents AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY "documentKey"
    ORDER BY "isCurrent" DESC, "version" DESC, "createdAt" DESC, "id" DESC
  ) AS rank
  FROM "DocumentLegacy"
)
INSERT INTO "DocumentNext" (
  "id",
  "jurisdictionId",
  "taskId",
  "currentRevisionId",
  "title",
  "version",
  "visibility",
  "createdByUserId",
  "searchText",
  "createdAt",
  "updatedAt",
  "deletedAt"
)
SELECT
  "id",
  "jurisdictionId",
  "taskId",
  "id",
  "title",
  "version",
  "visibility",
  "createdByUserId",
  CONCAT("title", E'\n', "body"),
  "createdAt",
  "updatedAt",
  "deletedAt"
FROM current_documents
WHERE rank = 1;

WITH stable_documents AS (
  SELECT "documentKey", "id" AS "stableId"
  FROM (
    SELECT
      "documentKey",
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "documentKey"
        ORDER BY "isCurrent" DESC, "version" DESC, "createdAt" DESC, "id" DESC
      ) AS rank
    FROM "DocumentLegacy"
  ) ranked
  WHERE rank = 1
)
INSERT INTO "DocumentRevision" (
  "id",
  "documentId",
  "version",
  "title",
  "body",
  "createdByUserId",
  "createdAt",
  "updatedAt",
  "deletedAt"
)
SELECT
  legacy."id",
  stable."stableId",
  legacy."version",
  legacy."title",
  legacy."body",
  legacy."createdByUserId",
  legacy."createdAt",
  legacy."updatedAt",
  legacy."deletedAt"
FROM "DocumentLegacy" legacy
JOIN stable_documents stable
  ON stable."documentKey" = legacy."documentKey";

DROP TABLE "DocumentLegacy";
ALTER TABLE "DocumentNext" RENAME TO "Document";
ALTER TABLE "Document"
  RENAME CONSTRAINT "DocumentNext_pkey" TO "Document_pkey";
ALTER TABLE "Document"
  RENAME CONSTRAINT "DocumentNext_version_check" TO "Document_version_check";

CREATE UNIQUE INDEX "Document_currentRevisionId_key"
  ON "Document"("currentRevisionId");
CREATE UNIQUE INDEX "Document_sourceKey_key"
  ON "Document"("sourceKey");
CREATE UNIQUE INDEX "Document_createdByUserId_idempotencyKey_key"
  ON "Document"("createdByUserId", "idempotencyKey");
CREATE UNIQUE INDEX "Document_currentRevisionId_id_key"
  ON "Document"("currentRevisionId", "id");
CREATE INDEX "Document_taskId_idx" ON "Document"("taskId");
CREATE INDEX "Document_organizationId_idx" ON "Document"("organizationId");
CREATE INDEX "Document_parentDocumentId_idx" ON "Document"("parentDocumentId");
CREATE INDEX "Document_createdByUserId_idx" ON "Document"("createdByUserId");
CREATE INDEX "Document_jurisdictionId_idx" ON "Document"("jurisdictionId");
CREATE INDEX "Document_visibility_idx" ON "Document"("visibility");
CREATE INDEX "Document_sourceKey_idx" ON "Document"("sourceKey");
CREATE INDEX "Document_deletedAt_idx" ON "Document"("deletedAt");
CREATE INDEX "Document_searchText_fts_idx"
  ON "Document" USING GIN (to_tsvector('english', "searchText"));

CREATE UNIQUE INDEX "DocumentRevision_documentId_version_key"
  ON "DocumentRevision"("documentId", "version");
CREATE UNIQUE INDEX "DocumentRevision_id_documentId_key"
  ON "DocumentRevision"("id", "documentId");
CREATE INDEX "DocumentRevision_documentId_createdAt_idx"
  ON "DocumentRevision"("documentId", "createdAt");
CREATE INDEX "DocumentRevision_createdByUserId_idx"
  ON "DocumentRevision"("createdByUserId");
CREATE INDEX "DocumentRevision_sourceArtifactId_idx"
  ON "DocumentRevision"("sourceArtifactId");
CREATE INDEX "DocumentRevision_contentHash_idx"
  ON "DocumentRevision"("contentHash");
CREATE INDEX "DocumentRevision_deletedAt_idx"
  ON "DocumentRevision"("deletedAt");
CREATE INDEX "DocumentRevision_content_fts_idx"
  ON "DocumentRevision" USING GIN (
    to_tsvector('english', "title" || ' ' || "body")
  );

ALTER TABLE "Document" ADD CONSTRAINT "Document_jurisdictionId_fkey"
  FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_parentDocumentId_fkey"
  FOREIGN KEY ("parentDocumentId") REFERENCES "Document"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_currentRevisionId_id_fkey"
  FOREIGN KEY ("currentRevisionId", "id") REFERENCES "DocumentRevision"("id", "documentId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocumentRevision" ADD CONSTRAINT "DocumentRevision_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentRevision" ADD CONSTRAINT "DocumentRevision_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentRevision" ADD CONSTRAINT "DocumentRevision_sourceArtifactId_fkey"
  FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Collection" (
  "id" TEXT NOT NULL,
  "jurisdictionId" TEXT,
  "organizationId" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "sourceArtifactId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "visibility" "ContentVisibility" NOT NULL DEFAULT 'PRIVATE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "sourceKey" TEXT,
  "sourceUrl" TEXT,
  "idempotencyKey" TEXT,
  "requestHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "Collection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Collection_version_check" CHECK ("version" > 0)
);

CREATE TABLE "CollectionField" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "targetCollectionId" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "CollectionFieldType" NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "position" INTEGER NOT NULL DEFAULT 0,
  "optionsJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "CollectionField_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CollectionField_position_check" CHECK ("position" >= 0)
);

CREATE TABLE "CollectionRecord" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "sourceArtifactId" TEXT,
  "valuesJson" JSONB NOT NULL,
  "searchText" TEXT NOT NULL DEFAULT '',
  "taskId" TEXT,
  "personId" TEXT,
  "organizationId" TEXT,
  "documentId" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "sourceKey" TEXT,
  "sourceUrl" TEXT,
  "idempotencyKey" TEXT,
  "requestHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "CollectionRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CollectionRecord_version_check" CHECK ("version" > 0),
  CONSTRAINT "CollectionRecord_canonical_entity_check" CHECK (
    num_nonnulls("taskId", "personId", "organizationId", "documentId") <= 1
  )
);

CREATE TABLE "CollectionRelation" (
  "id" TEXT NOT NULL,
  "sourceRecordId" TEXT NOT NULL,
  "fieldId" TEXT NOT NULL,
  "targetRecordId" TEXT,
  "targetTaskId" TEXT,
  "targetPersonId" TEXT,
  "targetOrganizationId" TEXT,
  "targetDocumentId" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "CollectionRelation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CollectionRelation_position_check" CHECK ("position" >= 0),
  CONSTRAINT "CollectionRelation_target_check" CHECK (
    num_nonnulls(
      "targetRecordId",
      "targetTaskId",
      "targetPersonId",
      "targetOrganizationId",
      "targetDocumentId"
    ) = 1
  )
);

CREATE TABLE "CollectionView" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "visibleFieldIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "filterJson" JSONB,
  "sortJson" JSONB,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "CollectionView_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CollectionView_version_check" CHECK ("version" > 0)
);

CREATE TABLE "ContentAccessGrant" (
  "id" TEXT NOT NULL,
  "documentId" TEXT,
  "collectionId" TEXT,
  "userId" TEXT,
  "organizationId" TEXT,
  "accessLevel" "ContentAccessLevel" NOT NULL,
  "grantedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "ContentAccessGrant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContentAccessGrant_resource_check" CHECK (
    num_nonnulls("documentId", "collectionId") = 1
  ),
  CONSTRAINT "ContentAccessGrant_grantee_check" CHECK (
    num_nonnulls("userId", "organizationId") = 1
  )
);

CREATE TABLE "ContentAttachment" (
  "id" TEXT NOT NULL,
  "documentId" TEXT,
  "collectionRecordId" TEXT,
  "uploadedByUserId" TEXT,
  "sourceArtifactId" TEXT,
  "storageKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "checksumSha256" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "ContentAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContentAttachment_owner_check" CHECK (
    num_nonnulls("documentId", "collectionRecordId") = 1
  ),
  CONSTRAINT "ContentAttachment_sizeBytes_check" CHECK ("sizeBytes" > 0)
);

CREATE UNIQUE INDEX "Collection_sourceKey_key" ON "Collection"("sourceKey");
CREATE UNIQUE INDEX "Collection_createdByUserId_idempotencyKey_key"
  ON "Collection"("createdByUserId", "idempotencyKey");
CREATE INDEX "Collection_jurisdictionId_idx" ON "Collection"("jurisdictionId");
CREATE INDEX "Collection_organizationId_idx" ON "Collection"("organizationId");
CREATE INDEX "Collection_createdByUserId_idx" ON "Collection"("createdByUserId");
CREATE INDEX "Collection_sourceArtifactId_idx" ON "Collection"("sourceArtifactId");
CREATE INDEX "Collection_visibility_idx" ON "Collection"("visibility");
CREATE INDEX "Collection_deletedAt_idx" ON "Collection"("deletedAt");

CREATE UNIQUE INDEX "CollectionField_collectionId_key_key"
  ON "CollectionField"("collectionId", "key");
CREATE INDEX "CollectionField_collectionId_position_idx"
  ON "CollectionField"("collectionId", "position");
CREATE INDEX "CollectionField_targetCollectionId_idx"
  ON "CollectionField"("targetCollectionId");
CREATE INDEX "CollectionField_createdByUserId_idx"
  ON "CollectionField"("createdByUserId");
CREATE INDEX "CollectionField_deletedAt_idx" ON "CollectionField"("deletedAt");

CREATE UNIQUE INDEX "CollectionRecord_collectionId_sourceKey_key"
  ON "CollectionRecord"("collectionId", "sourceKey");
CREATE UNIQUE INDEX "CollectionRecord_collectionId_idempotencyKey_key"
  ON "CollectionRecord"("collectionId", "idempotencyKey");
CREATE INDEX "CollectionRecord_collectionId_updatedAt_idx"
  ON "CollectionRecord"("collectionId", "updatedAt");
CREATE INDEX "CollectionRecord_createdByUserId_idx"
  ON "CollectionRecord"("createdByUserId");
CREATE INDEX "CollectionRecord_sourceArtifactId_idx"
  ON "CollectionRecord"("sourceArtifactId");
CREATE INDEX "CollectionRecord_taskId_idx" ON "CollectionRecord"("taskId");
CREATE INDEX "CollectionRecord_personId_idx" ON "CollectionRecord"("personId");
CREATE INDEX "CollectionRecord_organizationId_idx"
  ON "CollectionRecord"("organizationId");
CREATE INDEX "CollectionRecord_documentId_idx" ON "CollectionRecord"("documentId");
CREATE INDEX "CollectionRecord_deletedAt_idx" ON "CollectionRecord"("deletedAt");
CREATE INDEX "CollectionRecord_searchText_fts_idx"
  ON "CollectionRecord" USING GIN (to_tsvector('english', "searchText"));

CREATE INDEX "CollectionRelation_sourceRecordId_fieldId_position_idx"
  ON "CollectionRelation"("sourceRecordId", "fieldId", "position");
CREATE INDEX "CollectionRelation_targetRecordId_idx"
  ON "CollectionRelation"("targetRecordId");
CREATE INDEX "CollectionRelation_targetTaskId_idx"
  ON "CollectionRelation"("targetTaskId");
CREATE INDEX "CollectionRelation_targetPersonId_idx"
  ON "CollectionRelation"("targetPersonId");
CREATE INDEX "CollectionRelation_targetOrganizationId_idx"
  ON "CollectionRelation"("targetOrganizationId");
CREATE INDEX "CollectionRelation_targetDocumentId_idx"
  ON "CollectionRelation"("targetDocumentId");
CREATE INDEX "CollectionRelation_createdByUserId_idx"
  ON "CollectionRelation"("createdByUserId");
CREATE INDEX "CollectionRelation_deletedAt_idx"
  ON "CollectionRelation"("deletedAt");

CREATE UNIQUE INDEX "CollectionRelation_record_target_key"
  ON "CollectionRelation"("sourceRecordId", "fieldId", "targetRecordId")
  WHERE "targetRecordId" IS NOT NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX "CollectionRelation_task_target_key"
  ON "CollectionRelation"("sourceRecordId", "fieldId", "targetTaskId")
  WHERE "targetTaskId" IS NOT NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX "CollectionRelation_person_target_key"
  ON "CollectionRelation"("sourceRecordId", "fieldId", "targetPersonId")
  WHERE "targetPersonId" IS NOT NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX "CollectionRelation_organization_target_key"
  ON "CollectionRelation"("sourceRecordId", "fieldId", "targetOrganizationId")
  WHERE "targetOrganizationId" IS NOT NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX "CollectionRelation_document_target_key"
  ON "CollectionRelation"("sourceRecordId", "fieldId", "targetDocumentId")
  WHERE "targetDocumentId" IS NOT NULL AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX "CollectionView_collectionId_name_key"
  ON "CollectionView"("collectionId", "name");
CREATE INDEX "CollectionView_collectionId_isDefault_idx"
  ON "CollectionView"("collectionId", "isDefault");
CREATE INDEX "CollectionView_createdByUserId_idx"
  ON "CollectionView"("createdByUserId");
CREATE INDEX "CollectionView_deletedAt_idx" ON "CollectionView"("deletedAt");

CREATE INDEX "ContentAccessGrant_documentId_accessLevel_idx"
  ON "ContentAccessGrant"("documentId", "accessLevel");
CREATE INDEX "ContentAccessGrant_collectionId_accessLevel_idx"
  ON "ContentAccessGrant"("collectionId", "accessLevel");
CREATE INDEX "ContentAccessGrant_userId_idx" ON "ContentAccessGrant"("userId");
CREATE INDEX "ContentAccessGrant_organizationId_idx"
  ON "ContentAccessGrant"("organizationId");
CREATE INDEX "ContentAccessGrant_grantedByUserId_idx"
  ON "ContentAccessGrant"("grantedByUserId");
CREATE INDEX "ContentAccessGrant_deletedAt_idx"
  ON "ContentAccessGrant"("deletedAt");

CREATE UNIQUE INDEX "ContentAccessGrant_document_user_key"
  ON "ContentAccessGrant"("documentId", "userId")
  WHERE "documentId" IS NOT NULL AND "userId" IS NOT NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX "ContentAccessGrant_document_organization_key"
  ON "ContentAccessGrant"("documentId", "organizationId")
  WHERE "documentId" IS NOT NULL AND "organizationId" IS NOT NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX "ContentAccessGrant_collection_user_key"
  ON "ContentAccessGrant"("collectionId", "userId")
  WHERE "collectionId" IS NOT NULL AND "userId" IS NOT NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX "ContentAccessGrant_collection_organization_key"
  ON "ContentAccessGrant"("collectionId", "organizationId")
  WHERE "collectionId" IS NOT NULL AND "organizationId" IS NOT NULL AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX "ContentAttachment_storageKey_key"
  ON "ContentAttachment"("storageKey");
CREATE INDEX "ContentAttachment_documentId_createdAt_idx"
  ON "ContentAttachment"("documentId", "createdAt");
CREATE INDEX "ContentAttachment_collectionRecordId_createdAt_idx"
  ON "ContentAttachment"("collectionRecordId", "createdAt");
CREATE INDEX "ContentAttachment_uploadedByUserId_expiresAt_idx"
  ON "ContentAttachment"("uploadedByUserId", "expiresAt");
CREATE INDEX "ContentAttachment_sourceArtifactId_idx"
  ON "ContentAttachment"("sourceArtifactId");
CREATE INDEX "ContentAttachment_deletedAt_idx"
  ON "ContentAttachment"("deletedAt");

ALTER TABLE "Collection" ADD CONSTRAINT "Collection_jurisdictionId_fkey"
  FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_sourceArtifactId_fkey"
  FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CollectionField" ADD CONSTRAINT "CollectionField_collectionId_fkey"
  FOREIGN KEY ("collectionId") REFERENCES "Collection"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionField" ADD CONSTRAINT "CollectionField_targetCollectionId_fkey"
  FOREIGN KEY ("targetCollectionId") REFERENCES "Collection"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CollectionField" ADD CONSTRAINT "CollectionField_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CollectionRecord" ADD CONSTRAINT "CollectionRecord_collectionId_fkey"
  FOREIGN KEY ("collectionId") REFERENCES "Collection"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionRecord" ADD CONSTRAINT "CollectionRecord_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CollectionRecord" ADD CONSTRAINT "CollectionRecord_sourceArtifactId_fkey"
  FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CollectionRecord" ADD CONSTRAINT "CollectionRecord_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CollectionRecord" ADD CONSTRAINT "CollectionRecord_personId_fkey"
  FOREIGN KEY ("personId") REFERENCES "Person"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CollectionRecord" ADD CONSTRAINT "CollectionRecord_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CollectionRecord" ADD CONSTRAINT "CollectionRecord_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CollectionRelation" ADD CONSTRAINT "CollectionRelation_sourceRecordId_fkey"
  FOREIGN KEY ("sourceRecordId") REFERENCES "CollectionRecord"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionRelation" ADD CONSTRAINT "CollectionRelation_fieldId_fkey"
  FOREIGN KEY ("fieldId") REFERENCES "CollectionField"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionRelation" ADD CONSTRAINT "CollectionRelation_targetRecordId_fkey"
  FOREIGN KEY ("targetRecordId") REFERENCES "CollectionRecord"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionRelation" ADD CONSTRAINT "CollectionRelation_targetTaskId_fkey"
  FOREIGN KEY ("targetTaskId") REFERENCES "Task"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionRelation" ADD CONSTRAINT "CollectionRelation_targetPersonId_fkey"
  FOREIGN KEY ("targetPersonId") REFERENCES "Person"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionRelation" ADD CONSTRAINT "CollectionRelation_targetOrganizationId_fkey"
  FOREIGN KEY ("targetOrganizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionRelation" ADD CONSTRAINT "CollectionRelation_targetDocumentId_fkey"
  FOREIGN KEY ("targetDocumentId") REFERENCES "Document"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionRelation" ADD CONSTRAINT "CollectionRelation_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CollectionView" ADD CONSTRAINT "CollectionView_collectionId_fkey"
  FOREIGN KEY ("collectionId") REFERENCES "Collection"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionView" ADD CONSTRAINT "CollectionView_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ContentAccessGrant" ADD CONSTRAINT "ContentAccessGrant_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentAccessGrant" ADD CONSTRAINT "ContentAccessGrant_collectionId_fkey"
  FOREIGN KEY ("collectionId") REFERENCES "Collection"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentAccessGrant" ADD CONSTRAINT "ContentAccessGrant_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentAccessGrant" ADD CONSTRAINT "ContentAccessGrant_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentAccessGrant" ADD CONSTRAINT "ContentAccessGrant_grantedByUserId_fkey"
  FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ContentAttachment" ADD CONSTRAINT "ContentAttachment_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContentAttachment" ADD CONSTRAINT "ContentAttachment_collectionRecordId_fkey"
  FOREIGN KEY ("collectionRecordId") REFERENCES "CollectionRecord"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContentAttachment" ADD CONSTRAINT "ContentAttachment_uploadedByUserId_fkey"
  FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentAttachment" ADD CONSTRAINT "ContentAttachment_sourceArtifactId_fkey"
  FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
