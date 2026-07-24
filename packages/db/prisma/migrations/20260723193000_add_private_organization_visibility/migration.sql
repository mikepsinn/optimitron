ALTER TABLE "Organization"
ADD COLUMN "visibility" "ContentVisibility" NOT NULL DEFAULT 'PUBLIC';

CREATE INDEX "Organization_visibility_status_deletedAt_idx"
ON "Organization"("visibility", "status", "deletedAt");

CREATE FUNCTION "reject_public_task_for_private_organization"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."isPublic" AND EXISTS (
    SELECT 1
    FROM "Organization"
    WHERE "visibility" = 'PRIVATE'
      AND "id" IN (NEW."assigneeOrganizationId", NEW."ownerOrganizationId")
  ) THEN
    RAISE EXCEPTION 'Public tasks cannot reference a private organization.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "Task_private_organization_visibility_check"
BEFORE INSERT OR UPDATE OF "isPublic", "assigneeOrganizationId", "ownerOrganizationId"
ON "Task"
FOR EACH ROW
EXECUTE FUNCTION "reject_public_task_for_private_organization"();

CREATE FUNCTION "reject_private_organization_with_public_tasks"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."visibility" = 'PRIVATE'
    AND OLD."visibility" IS DISTINCT FROM NEW."visibility"
    AND EXISTS (
      SELECT 1
      FROM "Task"
      WHERE "isPublic" = true
        AND "deletedAt" IS NULL
        AND (
          "assigneeOrganizationId" = NEW."id"
          OR "ownerOrganizationId" = NEW."id"
        )
    )
  THEN
    RAISE EXCEPTION 'An organization with public tasks cannot be made private.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "Organization_public_task_visibility_check"
BEFORE UPDATE OF "visibility"
ON "Organization"
FOR EACH ROW
EXECUTE FUNCTION "reject_private_organization_with_public_tasks"();
