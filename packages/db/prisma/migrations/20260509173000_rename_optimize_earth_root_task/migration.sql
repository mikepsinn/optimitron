-- Rename the campaign-root task from the old prize-era id to the canonical
-- Optimize Earth id. This is a data migration, not a schema change.
--
-- Old: id="win-earth-optimization-prize", taskKey="program:earth-optimization-prize:win"
-- New: id="optimize-earth", taskKey="program:optimize-earth"
--
-- The self-referential Task.parentTaskId foreign key does not cascade id
-- updates, so children are detached, the root row is renamed, and children are
-- reattached inside one transaction.

DO $$
DECLARE
  old_id CONSTANT text := 'win-earth-optimization-prize';
  new_id CONSTANT text := 'optimize-earth';
  new_key CONSTANT text := 'program:optimize-earth';
  child_ids text[];
  old_exists boolean;
  new_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM "Task" WHERE id = old_id) INTO old_exists;
  SELECT EXISTS (SELECT 1 FROM "Task" WHERE id = new_id) INTO new_exists;
  SELECT COALESCE(array_agg(id), ARRAY[]::text[])
    FROM "Task"
    WHERE "parentTaskId" = old_id
    INTO child_ids;

  IF old_exists AND NOT new_exists THEN
    UPDATE "Task"
      SET "parentTaskId" = NULL
      WHERE id = ANY(child_ids);

    UPDATE "Task"
      SET id = new_id,
          "taskKey" = new_key,
          "updatedAt" = NOW()
      WHERE id = old_id;

    UPDATE "Task"
      SET "parentTaskId" = new_id
      WHERE id = ANY(child_ids);
  ELSIF old_exists AND new_exists THEN
    -- If a seed already created the new root, keep the new root and move any
    -- legacy children under it. Soft-delete the old root so public task queries
    -- stop seeing two campaign roots.
    UPDATE "Task"
      SET "parentTaskId" = new_id
      WHERE "parentTaskId" = old_id;

    UPDATE "Task"
      SET "deletedAt" = COALESCE("deletedAt", NOW()),
          "updatedAt" = NOW()
      WHERE id = old_id;

    UPDATE "Task"
      SET "taskKey" = new_key,
          "updatedAt" = NOW()
      WHERE id = new_id
        AND "taskKey" IS DISTINCT FROM new_key;
  ELSIF NOT old_exists AND new_exists THEN
    UPDATE "Task"
      SET "taskKey" = new_key,
          "updatedAt" = NOW()
      WHERE id = new_id
        AND "taskKey" IS DISTINCT FROM new_key;
  END IF;
END $$;
