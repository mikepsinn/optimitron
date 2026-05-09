-- Retire the generic catch-all overdue reminder trigger.
-- Specific, user-directed reminder tasks (for example treaty signer reminders)
-- remain intact; this only removes the global task:overdue-reminder blueprint.
DELETE FROM "TaskTrigger"
WHERE "triggerKey" = 'task:overdue-reminder';
