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

    -- Move active references to the canonical root before hiding the legacy
    -- root. If a duplicate row already exists for the canonical root, retire
    -- the legacy duplicate with its legacy task.
    UPDATE "ReferralInvitation"
      SET "taskId" = new_id,
          "updatedAt" = NOW()
      WHERE "taskId" = old_id;

    UPDATE "ShareAttempt"
      SET "taskId" = new_id
      WHERE "taskId" = old_id;

    UPDATE "AgentRunCost"
      SET "taskId" = new_id,
          "updatedAt" = NOW()
      WHERE "taskId" = old_id;

    UPDATE "CourtCase" court_case
      SET "rootTaskId" = new_id,
          "updatedAt" = NOW()
      WHERE court_case."rootTaskId" = old_id
        AND NOT EXISTS (
          SELECT 1
          FROM "CourtCase" existing
          WHERE existing."rootTaskId" = new_id
        );

    UPDATE "CourtCase"
      SET "rootTaskId" = NULL,
          "updatedAt" = NOW()
      WHERE "rootTaskId" = old_id;

    UPDATE "CourtCaseRemedy"
      SET "enforcementTaskId" = new_id,
          "updatedAt" = NOW()
      WHERE "enforcementTaskId" = old_id;

    UPDATE "TaskClaim" task_claim
      SET "taskId" = new_id,
          "updatedAt" = NOW()
      WHERE task_claim."taskId" = old_id
        AND NOT EXISTS (
          SELECT 1
          FROM "TaskClaim" existing
          WHERE existing."taskId" = new_id
            AND existing."userId" = task_claim."userId"
        );

    UPDATE "TaskClaim"
      SET "deletedAt" = COALESCE("deletedAt", NOW()),
          "updatedAt" = NOW()
      WHERE "taskId" = old_id;

    UPDATE "TaskComment"
      SET "taskId" = new_id,
          "updatedAt" = NOW()
      WHERE "taskId" = old_id;

    UPDATE "TaskSourceArtifact" source_artifact
      SET "taskId" = new_id
      WHERE source_artifact."taskId" = old_id
        AND NOT EXISTS (
          SELECT 1
          FROM "TaskSourceArtifact" existing
          WHERE existing."taskId" = new_id
            AND existing."sourceArtifactId" = source_artifact."sourceArtifactId"
        );

    UPDATE "TaskSourceArtifact"
      SET "deletedAt" = COALESCE("deletedAt", NOW())
      WHERE "taskId" = old_id;

    UPDATE "TaskEdge" task_edge
      SET "fromTaskId" = new_id,
          "updatedAt" = NOW()
      WHERE task_edge."fromTaskId" = old_id
        AND task_edge."toTaskId" <> new_id
        AND NOT EXISTS (
          SELECT 1
          FROM "TaskEdge" existing
          WHERE existing."fromTaskId" = new_id
            AND existing."toTaskId" = task_edge."toTaskId"
            AND existing."edgeType" = task_edge."edgeType"
        );

    UPDATE "TaskEdge" task_edge
      SET "toTaskId" = new_id,
          "updatedAt" = NOW()
      WHERE task_edge."toTaskId" = old_id
        AND task_edge."fromTaskId" <> new_id
        AND NOT EXISTS (
          SELECT 1
          FROM "TaskEdge" existing
          WHERE existing."fromTaskId" = task_edge."fromTaskId"
            AND existing."toTaskId" = new_id
            AND existing."edgeType" = task_edge."edgeType"
        );

    UPDATE "TaskEdge"
      SET "deletedAt" = COALESCE("deletedAt", NOW()),
          "updatedAt" = NOW()
      WHERE "fromTaskId" = old_id
         OR "toTaskId" = old_id
         OR ("fromTaskId" = new_id AND "toTaskId" = new_id);

    UPDATE "TaskImpactEstimateSet" estimate_set
      SET "taskId" = new_id,
          "updatedAt" = NOW()
      WHERE estimate_set."taskId" = old_id
        AND NOT EXISTS (
          SELECT 1
          FROM "TaskImpactEstimateSet" existing
          WHERE existing."taskId" = new_id
            AND existing."estimateKind" = estimate_set."estimateKind"
            AND existing."sourceSystem" = estimate_set."sourceSystem"
            AND existing."calculationVersion" IS NOT DISTINCT FROM estimate_set."calculationVersion"
            AND existing."methodologyKey" IS NOT DISTINCT FROM estimate_set."methodologyKey"
            AND existing."parameterSetHash" IS NOT DISTINCT FROM estimate_set."parameterSetHash"
            AND existing."counterfactualKey" IS NOT DISTINCT FROM estimate_set."counterfactualKey"
        );

    UPDATE "TaskImpactEstimateSet"
      SET "deletedAt" = COALESCE("deletedAt", NOW()),
          "updatedAt" = NOW()
      WHERE "taskId" = old_id;

    UPDATE "TaskCommunicationEndpoint"
      SET "taskId" = new_id,
          "updatedAt" = NOW()
      WHERE "taskId" = old_id;

    UPDATE "TaskCommunicationTemplate" task_template
      SET "taskId" = new_id,
          "updatedAt" = NOW()
      WHERE task_template."taskId" = old_id
        AND NOT EXISTS (
          SELECT 1
          FROM "TaskCommunicationTemplate" existing
          WHERE existing."taskId" = new_id
            AND existing."audience" = task_template."audience"
            AND existing."purpose" = task_template."purpose"
        );

    UPDATE "TaskCommunicationTemplate"
      SET "deletedAt" = COALESCE("deletedAt", NOW()),
          "updatedAt" = NOW()
      WHERE "taskId" = old_id;

    UPDATE "TaskCommunication"
      SET "taskId" = new_id,
          "updatedAt" = NOW()
      WHERE "taskId" = old_id;

    DELETE FROM "AgentTaskLease" task_lease
      WHERE task_lease."taskId" = old_id
        AND EXISTS (
          SELECT 1
          FROM "AgentTaskLease" existing
          WHERE existing."taskId" = new_id
            AND existing."agentId" = task_lease."agentId"
        );

    UPDATE "AgentTaskLease"
      SET "taskId" = new_id
      WHERE "taskId" = old_id;

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
