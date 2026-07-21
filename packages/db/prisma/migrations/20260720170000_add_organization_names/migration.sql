-- Preserve one canonical Organization per legal entity while making legal
-- names, DBAs, acronyms, former names, and translations durable and searchable.
CREATE TYPE "OrganizationNameKind" AS ENUM (
  'LEGAL',
  'DBA',
  'ACRONYM',
  'FORMER',
  'TRANSLATION',
  'OTHER'
);

CREATE TABLE "OrganizationName" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "kind" "OrganizationNameKind" NOT NULL,
  "jurisdictionId" TEXT,
  "languageCode" TEXT,
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "sourceUrl" TEXT,
  "sourceRef" TEXT,
  "createdByUserId" TEXT,
  "verifiedByUserId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "OrganizationName_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrganizationName_normalizedName_check"
    CHECK (length("normalizedName") > 0),
  CONSTRAINT "OrganizationName_validity_check"
    CHECK ("validUntil" IS NULL OR "validFrom" IS NULL OR "validUntil" > "validFrom")
);

CREATE UNIQUE INDEX "OrganizationName_sourceRef_key"
  ON "OrganizationName"("sourceRef");
CREATE UNIQUE INDEX "OrganizationName_organizationId_kind_normalizedName_key"
  ON "OrganizationName"("organizationId", "kind", "normalizedName");
CREATE INDEX "OrganizationName_normalizedName_deletedAt_idx"
  ON "OrganizationName"("normalizedName", "deletedAt");
CREATE INDEX "OrganizationName_organizationId_kind_deletedAt_idx"
  ON "OrganizationName"("organizationId", "kind", "deletedAt");
CREATE INDEX "OrganizationName_jurisdictionId_idx"
  ON "OrganizationName"("jurisdictionId");
CREATE INDEX "OrganizationName_createdByUserId_idx"
  ON "OrganizationName"("createdByUserId");
CREATE INDEX "OrganizationName_verifiedByUserId_idx"
  ON "OrganizationName"("verifiedByUserId");
CREATE INDEX "OrganizationName_deletedAt_idx"
  ON "OrganizationName"("deletedAt");

ALTER TABLE "OrganizationName" ADD CONSTRAINT "OrganizationName_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationName" ADD CONSTRAINT "OrganizationName_jurisdictionId_fkey"
  FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrganizationName" ADD CONSTRAINT "OrganizationName_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrganizationName" ADD CONSTRAINT "OrganizationName_verifiedByUserId_fkey"
  FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Every existing organization starts with its current display label. Known
-- managed identities receive stable source refs so future syncs update rather
-- than duplicate these rows.
INSERT INTO "OrganizationName" (
  "id",
  "organizationId",
  "name",
  "normalizedName",
  "kind",
  "jurisdictionId",
  "languageCode",
  "sourceUrl",
  "sourceRef",
  "createdByUserId",
  "verifiedByUserId",
  "verifiedAt",
  "createdAt",
  "updatedAt",
  "deletedAt"
)
SELECT
  'organization-display-name-' || organization."id",
  organization."id",
  organization."name",
  trim(
    lower(
      regexp_replace(
        regexp_replace(
          normalize(organization."name", NFKC),
          '[''’]',
          '',
          'g'
        ),
        '[^[:alnum:]]+',
        ' ',
        'g'
      )
    )
  ),
  CASE
    WHEN organization."sourceRef" = 'managed-organization:institute-for-accelerated-medicine'
      OR organization."slug" = 'institute-for-accelerated-medicine'
      THEN 'DBA'::"OrganizationNameKind"
    ELSE 'OTHER'::"OrganizationNameKind"
  END,
  organization."jurisdictionId",
  CASE
    WHEN organization."slug" IN (
      'institute-for-accelerated-medicine',
      'longevity-biotech-fellowship'
    ) THEN 'en'
    ELSE NULL
  END,
  COALESCE(organization."sourceUrl", organization."website"),
  CASE
    WHEN organization."sourceRef" = 'managed-organization:institute-for-accelerated-medicine'
      OR organization."slug" = 'institute-for-accelerated-medicine'
      THEN 'managed-organization-name:institute-for-accelerated-medicine:dba'
    WHEN organization."slug" = 'longevity-biotech-fellowship'
      THEN 'managed-organization-name:longevity-biotech-fellowship:public-name'
    ELSE 'migration:organization-display-name:' || organization."id"
  END,
  organization."creatorId",
  CASE
    WHEN organization."sourceRef" = 'managed-organization:institute-for-accelerated-medicine'
      OR organization."slug" = 'institute-for-accelerated-medicine'
      THEN organization."creatorId"
    ELSE NULL
  END,
  CASE
    WHEN organization."sourceRef" = 'managed-organization:institute-for-accelerated-medicine'
      OR organization."slug" = 'institute-for-accelerated-medicine'
      THEN TIMESTAMP '2026-07-20 16:56:30.688'
    ELSE NULL
  END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  organization."deletedAt"
FROM "Organization" organization;

-- Accelerated Medicine Foundation is the legal entity. IAM and IC2EWD are
-- public/DBA identities of that same Organization, not separate organizations.
WITH iam_organization AS (
  SELECT organization.*
  FROM "Organization" organization
  WHERE (
    organization."sourceRef" = 'managed-organization:institute-for-accelerated-medicine'
    OR organization."slug" = 'institute-for-accelerated-medicine'
  )
    AND organization."deletedAt" IS NULL
  ORDER BY CASE
    WHEN organization."sourceRef" = 'managed-organization:institute-for-accelerated-medicine'
      THEN 0
    ELSE 1
  END
  LIMIT 1
), iam_names (
  "id", "name", "normalizedName", "kind", "sourceRef", "sourceUrl"
) AS (
  VALUES
    (
      'managed-orgname-amf-legal',
      'Accelerated Medicine Foundation Inc',
      'accelerated medicine foundation inc',
      'LEGAL'::"OrganizationNameKind",
      'managed-organization-name:accelerated-medicine-foundation:legal',
      'https://warondisease.org/terms'
    ),
    (
      'managed-orgname-ic2ewd-dba',
      'International Campaign to End War and Disease',
      'international campaign to end war and disease',
      'DBA'::"OrganizationNameKind",
      'managed-organization-name:international-campaign-end-war-disease:dba',
      'https://warondisease.org/terms'
    ),
    (
      'managed-orgname-amf-acronym',
      'AMF',
      'amf',
      'ACRONYM'::"OrganizationNameKind",
      'managed-organization-name:accelerated-medicine-foundation:amf',
      'https://acceleratedmedicine.org'
    ),
    (
      'managed-orgname-iam-acronym',
      'IAM',
      'iam',
      'ACRONYM'::"OrganizationNameKind",
      'managed-organization-name:accelerated-medicine-foundation:iam',
      'https://acceleratedmedicine.org'
    ),
    (
      'managed-orgname-ic2ewd-acronym',
      'IC2EWD',
      'ic2ewd',
      'ACRONYM'::"OrganizationNameKind",
      'managed-organization-name:accelerated-medicine-foundation:ic2ewd',
      'https://warondisease.org'
    )
)
INSERT INTO "OrganizationName" (
  "id",
  "organizationId",
  "name",
  "normalizedName",
  "kind",
  "languageCode",
  "sourceUrl",
  "sourceRef",
  "createdByUserId",
  "verifiedByUserId",
  "verifiedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  iam_names."id",
  iam_organization."id",
  iam_names."name",
  iam_names."normalizedName",
  iam_names."kind",
  'en',
  iam_names."sourceUrl",
  iam_names."sourceRef",
  iam_organization."creatorId",
  iam_organization."creatorId",
  TIMESTAMP '2026-07-20 16:56:30.688',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM iam_organization
CROSS JOIN iam_names;

-- Longevity Biotech Fellowship remains the preferred public label for its
-- existing Organization row; Less Death Inc is recorded as the legal entity.
WITH lbf_organization AS (
  SELECT organization.*
  FROM "Organization" organization
  WHERE organization."slug" = 'longevity-biotech-fellowship'
    AND organization."deletedAt" IS NULL
  LIMIT 1
), lbf_names (
  "id", "name", "normalizedName", "kind", "sourceRef", "sourceUrl"
) AS (
  VALUES
    (
      'managed-orgname-less-death-legal',
      'Less Death Inc.',
      'less death inc',
      'LEGAL'::"OrganizationNameKind",
      'managed-organization-name:less-death:legal',
      'https://www.longbiofellowship.org/less-death-inc-info'
    ),
    (
      'managed-orgname-lbf-acronym',
      'LBF',
      'lbf',
      'ACRONYM'::"OrganizationNameKind",
      'managed-organization-name:longevity-biotech-fellowship:lbf',
      'https://www.longbiofellowship.org/'
    )
)
INSERT INTO "OrganizationName" (
  "id",
  "organizationId",
  "name",
  "normalizedName",
  "kind",
  "languageCode",
  "sourceUrl",
  "sourceRef",
  "createdByUserId",
  "createdAt",
  "updatedAt"
)
SELECT
  lbf_names."id",
  lbf_organization."id",
  lbf_names."name",
  lbf_names."normalizedName",
  lbf_names."kind",
  'en',
  lbf_names."sourceUrl",
  lbf_names."sourceRef",
  lbf_organization."creatorId",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM lbf_organization
CROSS JOIN lbf_names;
