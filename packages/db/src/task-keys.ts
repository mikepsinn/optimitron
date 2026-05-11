/**
 * Task-key central registry.
 *
 * Single source of truth for every `taskKey` prefix and builder used across
 * the optimitron monorepo. New programs, system tasks, accountability tasks,
 * and trigger idempotency keys all add their constants here — never inline a
 * raw string like "program:one-percent-treaty:..." anywhere else, and never
 * define a second copy of a prefix in a per-feature file.
 *
 * Lives in `@optimitron/db` (rather than `@optimitron/web`) so the prisma
 * seed and any other backend script can use the same literals without
 * reaching into the web package. The one web-only helper that needs URL
 * routing (`getTreatyParentTaskHref`) stays in `packages/web/src/lib/tasks/
 * task-keys.ts` alongside a re-export of everything below.
 *
 * Naming convention:
 *   - `<NAMESPACE>_TASK_KEY` for a fully-qualified single key.
 *   - `<NAMESPACE>_TASK_KEY_PREFIX` for a parameterized namespace.
 *   - `build<Thing>TaskKey(...)` for parameterized builders.
 *   - `is<Thing>TaskKey(...)` for type guards / matchers.
 */

// Optimize Earth root (the campaign mission task — single root of the task tree).

export const OPTIMIZE_EARTH_ROOT_TASK_ID = "optimize-earth";
export const OPTIMIZE_EARTH_ROOT_TASK_KEY = "program:optimize-earth";

export const END_WAR_AND_DISEASE_TASK_ID = "end-war-and-disease";
export const END_WAR_AND_DISEASE_TASK_KEY = "program:end-war-and-disease";

export const COURT_OF_HUMANITY_TASK_ID = "court-of-humanity";
export const COURT_OF_HUMANITY_TASK_KEY = "program:court-of-humanity:establish";
export const COURT_OF_HUMANITY_CHARTER_TASK_ID =
  "court-of-humanity-charter";
export const COURT_OF_HUMANITY_CHARTER_TASK_KEY =
  "program:court-of-humanity:charter";

export const HUMANITY_V_GOVERNMENTS_TASK_ID =
  "humanity-v-governments-of-earth";
export const HUMANITY_V_GOVERNMENTS_TASK_KEY =
  "program:humanity-v-governments-of-earth:prosecute";
export const REGISTER_PLAINTIFFS_TASK_ID = "register-plaintiffs";
export const REGISTER_PLAINTIFFS_TASK_KEY =
  "program:humanity-v-governments-of-earth:register-plaintiffs";
export const SUMMON_JURORS_TASK_ID = "summon-jurors";
export const SUMMON_JURORS_TASK_KEY =
  "program:humanity-v-governments-of-earth:summon-jurors";
export const PUBLISH_EVIDENCE_AND_DAMAGES_TASK_ID =
  "publish-evidence-and-damages";
export const PUBLISH_EVIDENCE_AND_DAMAGES_TASK_KEY =
  "program:humanity-v-governments-of-earth:publish-evidence-and-damages";
export const RENDER_VERDICT_TASK_ID = "render-verdict";
export const RENDER_VERDICT_TASK_KEY =
  "program:humanity-v-governments-of-earth:render-verdict";
export const ENFORCE_ONE_PERCENT_TREATY_SETTLEMENT_TASK_ID =
  "enforce-one-percent-treaty-settlement";
export const ENFORCE_ONE_PERCENT_TREATY_SETTLEMENT_TASK_KEY =
  "program:humanity-v-governments-of-earth:enforce-one-percent-treaty-settlement";

export const ONE_PERCENT_TREATY_MAJORITY_VOTE_TASK_ID =
  "one-percent-treaty-majority-vote";
export const ONE_PERCENT_TREATY_MAJORITY_VOTE_TASK_KEY =
  "program:one-percent-treaty:majority-vote";
export const ONE_PERCENT_TREATY_HEADS_OF_GOVERNMENT_TASK_ID =
  "one-percent-treaty-heads-of-government";
export const ONE_PERCENT_TREATY_HEADS_OF_GOVERNMENT_TASK_KEY =
  "program:one-percent-treaty:heads-of-government";

// 1% Treaty parent + signer subtree

export const TREATY_PARENT_TASK_ID = "1-pct-treaty";
export const TREATY_PARENT_TASK_KEY = "program:one-percent-treaty:ratify";
export const TREATY_PARENT_TASK_TITLE = "Ratify the 1% Treaty";
export const TREATY_SIGNER_TASK_ID_PREFIX = "1-pct-treaty-signer";
export const TREATY_SIGNER_TASK_KEY_PREFIX = "program:one-percent-treaty:signer";
export const TREATY_SIGNER_TASK_TITLE = "Sign the 1% Treaty";

export function getTreatySignerTaskKey(input: { countryCode: string }) {
  return `${TREATY_SIGNER_TASK_KEY_PREFIX}:${input.countryCode.toLowerCase()}`;
}

export function getTreatySignerTaskId(input: { countryCode: string }) {
  return `${TREATY_SIGNER_TASK_ID_PREFIX}-${input.countryCode.toLowerCase()}`;
}

export function isTreatyParentTaskKey(taskKey: string | null | undefined) {
  return taskKey === TREATY_PARENT_TASK_KEY;
}

export function isTreatySignerTaskKey(taskKey: string | null | undefined) {
  return taskKey != null && /^program:one-percent-treaty:signer:[a-z0-9-]+$/i.test(taskKey);
}

export function isTreatySignerTaskKeyPrefix(taskKey: string | null | undefined) {
  return (
    taskKey != null && taskKey.startsWith(`${TREATY_SIGNER_TASK_KEY_PREFIX}:`)
  );
}

// Per-user Humanity Management Tree

export const USER_TREATY_TASK_KEY_PREFIX = "program:one-percent-treaty:user";

export function getUserTreatyTaskKey(userId: string) {
  return `${USER_TREATY_TASK_KEY_PREFIX}:${userId}`;
}

export function getUserTreatySubtaskKey(userId: string, kind: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(kind)) {
    throw new Error(`Invalid user treaty subtask kind: ${kind}`);
  }
  return `${getUserTreatyTaskKey(userId)}:${kind}`;
}

// Signer reminder subtask

export const SIGNER_REMINDER_TASK_KEY_PREFIX = "program:one-percent-treaty:reminder";

export function buildSignerReminderTaskKey(countryCode: string, userId: string) {
  return `${SIGNER_REMINDER_TASK_KEY_PREFIX}:${countryCode.toLowerCase()}:${userId}`;
}

// Referral invitation task

export const REFERRAL_INVITATION_TASK_KEY_PREFIX = "program:one-percent-treaty:referral-invitation";

export function buildReferralInvitationTaskKey(inviteToken: string) {
  return `${REFERRAL_INVITATION_TASK_KEY_PREFIX}:${inviteToken}`;
}

// Accountability (per-leader-activity)

export const ACCOUNTABILITY_TASK_KEY_PREFIX = "accountability";

export function buildAccountabilityTaskKey(countryCode: string, activitySlug: string) {
  return `${ACCOUNTABILITY_TASK_KEY_PREFIX}:${countryCode.toLowerCase()}:${activitySlug}`;
}

// Optimize-Earth system tasks (autonomous agent's per-action subtasks)

export const OPTIMIZE_EARTH_TASK_KEY_PREFIX = "system:optimize-earth";

// Static optimize-earth subkeys (one row each in the seed/queue).
export const OPTIMIZE_EARTH_WEAPONIZE_OVERDUE_TASK_LIST_KEY = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:weaponize-overdue-task-list`;
export const OPTIMIZE_EARTH_CROSSLINK_PAGES_KEY = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:crosslink-task-government-politician-pages`;
export const OPTIMIZE_EARTH_CONVERT_PITCH_PAGES_KEY = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:convert-pitch-pages-into-task-traffic`;
export const OPTIMIZE_EARTH_DISCOVER_OFFICE_CHANNELS_KEY = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:discover-missing-signer-office-channels`;
export const OPTIMIZE_EARTH_DISCOVER_PRESS_KEY = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:discover-country-journalist-and-coalition-targets`;
export const OPTIMIZE_EARTH_GROUND_GENERATOR_KEY = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:ground-task-generation-in-existing-pages-and-manual`;
export const OPTIMIZE_EARTH_GENERATE_GROWTH_TASKS_KEY = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:generate-growth-conversion-tasks`;
export const OPTIMIZE_EARTH_GENERATE_CONTACT_DISCOVERY_KEY = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:generate-contact-discovery-tasks`;
export const OPTIMIZE_EARTH_GENERATE_SYSTEM_IMPROVEMENT_KEY = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:generate-system-improvement-tasks`;

// Action-follow-through dynamic subkeys (one tree per action).
export const OPTIMIZE_EARTH_ACTION_FOLLOW_THROUGH_PREFIX = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:action-follow-through`;
export const OPTIMIZE_EARTH_PUBLISH_BUDGET_BRIEF_PREFIX = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:publish-budget-brief`;
export const OPTIMIZE_EARTH_ROUTE_PROOF_PAGES_PREFIX = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:route-proof-pages-into-funding`;
export const OPTIMIZE_EARTH_SOURCE_COUNTERPARTIES_PREFIX = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:source-counterparties-and-price-ceiling`;
export const OPTIMIZE_EARTH_PREPARE_APPROVAL_PACKET_PREFIX = `${OPTIMIZE_EARTH_TASK_KEY_PREFIX}:prepare-approval-packet`;

/**
 * Prefixes whose presence on a taskKey means the action-follow-through tree
 * has already been spawned for that task — used to avoid recursive spawning.
 */
export const OPTIMIZE_EARTH_ACTION_FOLLOW_THROUGH_KEY_PREFIXES = [
  `${OPTIMIZE_EARTH_ACTION_FOLLOW_THROUGH_PREFIX}:`,
  `${OPTIMIZE_EARTH_PUBLISH_BUDGET_BRIEF_PREFIX}:`,
  `${OPTIMIZE_EARTH_ROUTE_PROOF_PAGES_PREFIX}:`,
  `${OPTIMIZE_EARTH_SOURCE_COUNTERPARTIES_PREFIX}:`,
  `${OPTIMIZE_EARTH_PREPARE_APPROVAL_PACKET_PREFIX}:`,
] as const;

export function buildOptimizeEarthActionFollowThroughKey(taskSlug: string) {
  return `${OPTIMIZE_EARTH_ACTION_FOLLOW_THROUGH_PREFIX}:${taskSlug}`;
}

export function buildOptimizeEarthPublishBudgetBriefKey(taskSlug: string) {
  return `${OPTIMIZE_EARTH_PUBLISH_BUDGET_BRIEF_PREFIX}:${taskSlug}`;
}

export function buildOptimizeEarthRouteProofPagesKey(taskSlug: string) {
  return `${OPTIMIZE_EARTH_ROUTE_PROOF_PAGES_PREFIX}:${taskSlug}`;
}

export function buildOptimizeEarthSourceCounterpartiesKey(taskSlug: string) {
  return `${OPTIMIZE_EARTH_SOURCE_COUNTERPARTIES_PREFIX}:${taskSlug}`;
}

export function buildOptimizeEarthPrepareApprovalPacketKey(taskSlug: string) {
  return `${OPTIMIZE_EARTH_PREPARE_APPROVAL_PACKET_PREFIX}:${taskSlug}`;
}
