-- Retire the generic catch-all overdue reminder trigger.
-- Specific, user-directed reminder tasks (for example treaty signer reminders)
-- remain intact. Soft-delete the blueprint so TaskTriggerFire audit rows keep
-- their foreign key history.
UPDATE "TaskTrigger"
SET
  "enabled" = FALSE,
  "schedule" = NULL,
  "deletedAt" = NOW(),
  "disabledReason" = COALESCE(
    "disabledReason",
    'Retired generic overdue reminder; intentionally unscheduled.'
  ),
  "updatedAt" = NOW()
WHERE "triggerKey" = 'task:overdue-reminder';
