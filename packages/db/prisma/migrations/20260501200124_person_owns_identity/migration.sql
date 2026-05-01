-- Person becomes the canonical record for every public-facing identity field.
-- User keeps only auth credentials, account preferences, and demographic data.
--
-- Drops from User:
--   - username (legacy mirror of Person.handle)
--   - name, image, bio (legacy mirrors of Person.displayName / image / bio)
--   - headline, coverImage, website, isPublic (now owned by Person)
--
-- Adds to Person:
--   - headline, coverImage, website (public-profile display fields)
--   - isPublic (privacy toggle for the /people/{handle} page)
--
-- A best-effort backfill copies existing User values onto Person before the
-- User columns are dropped. Person values win on conflict (Person is
-- canonical); we only fill nulls. If a User has no linked Person yet, the
-- migration links by matching Person.email first, then creates a Person row
-- for the remaining orphan account.

-- DropIndex
DROP INDEX "User_isPublic_idx";

-- DropIndex
DROP INDEX "User_username_idx";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "website" TEXT;

-- First reconcile any legacy Users that do not yet point at a Person. Prefer
-- an existing Person with the same email when it is not already linked to a
-- different User.
UPDATE "User" U
SET "personId" = P."id"
FROM "Person" P
WHERE U."personId" IS NULL
  AND U."email" IS NOT NULL
  AND P."email" = U."email"
  AND NOT EXISTS (
    SELECT 1 FROM "User" U2
    WHERE U2."personId" = P."id" AND U2."id" <> U."id"
  );

-- Create canonical Person rows for any remaining orphan Users so their legacy
-- display fields survive the column drop. The deterministic id avoids relying
-- on Prisma's client-side cuid() default inside raw SQL.
INSERT INTO "Person" (
  "id",
  "handle",
  "displayName",
  "email",
  "image",
  "bio",
  "countryCode",
  "headline",
  "coverImage",
  "website",
  "isPublic",
  "createdAt",
  "updatedAt"
)
SELECT
  'person_backfill_' || md5(U."id"),
  CASE
    WHEN U."username" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "Person" P2
        WHERE P2."handle" = U."username"
      )
    THEN U."username"
    ELSE NULL
  END,
  COALESCE(NULLIF(TRIM(U."name"), ''), NULLIF(TRIM(U."email"), ''), 'User ' || LEFT(U."id", 8)),
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM "Person" P2
      WHERE P2."email" = U."email"
    )
    THEN U."email"
    ELSE NULL
  END,
  U."image",
  U."bio",
  U."countryCode",
  U."headline",
  U."coverImage",
  U."website",
  U."isPublic",
  COALESCE(U."createdAt", CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP
FROM "User" U
WHERE U."personId" IS NULL;

UPDATE "User" U
SET "personId" = P."id"
FROM "Person" P
WHERE U."personId" IS NULL
  AND P."id" = 'person_backfill_' || md5(U."id");

-- Backfill display fields from User onto the linked Person before the User
-- columns disappear. Person values win on conflict; we only fill nulls and
-- only update where there's an actual value to copy.
UPDATE "Person" P
SET
  "headline"    = COALESCE(P."headline",    U."headline"),
  "coverImage"  = COALESCE(P."coverImage",  U."coverImage"),
  "website"     = COALESCE(P."website",     U."website"),
  "image"       = COALESCE(P."image",       U."image"),
  "bio"         = COALESCE(P."bio",         U."bio"),
  "displayName" = CASE
    WHEN P."displayName" IS NULL OR P."displayName" = ''
    THEN COALESCE(NULLIF(TRIM(U."name"), ''), P."displayName")
    ELSE P."displayName"
  END,
  -- Person.isPublic defaults to false (just added). If the User had it set
  -- explicitly, prefer that. Otherwise the new Person.isPublic default
  -- (false) stands.
  "isPublic"    = COALESCE(U."isPublic", P."isPublic")
FROM "User" U
WHERE U."personId" = P."id";

-- Backfill handle from User.username only where the linked Person has no
-- handle and the username doesn't collide with an existing Person.handle.
-- Person.handle is @unique, so any conflict would otherwise fail the
-- migration; the EXISTS guard makes the backfill safe.
UPDATE "Person" P
SET "handle" = U."username"
FROM "User" U
WHERE U."personId" = P."id"
  AND P."handle" IS NULL
  AND U."username" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "Person" P2
    WHERE P2."handle" = U."username" AND P2."id" <> P."id"
  );

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bio",
DROP COLUMN "coverImage",
DROP COLUMN "headline",
DROP COLUMN "image",
DROP COLUMN "isPublic",
DROP COLUMN "name",
DROP COLUMN "username",
DROP COLUMN "website";

-- CreateIndex
CREATE INDEX "Person_isPublic_idx" ON "Person"("isPublic");
