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

export const PERSON_PLANNING_ROOT_TASK_KEY_PREFIX = "planner:person";
export const ORGANIZATION_PLANNING_ROOT_TASK_KEY_PREFIX =
  "planner:organization";

export function getPersonPlanningRootTaskKey(personId: string) {
  return `${PERSON_PLANNING_ROOT_TASK_KEY_PREFIX}:${personId}`;
}

export function getOrganizationPlanningRootTaskKey(organizationId: string) {
  return `${ORGANIZATION_PLANNING_ROOT_TASK_KEY_PREFIX}:${organizationId}`;
}

export function isReservedPlanningRootTask(input: {
  id?: string | null;
  taskKey?: string | null;
}) {
  return (
    input.id === OPTIMIZE_EARTH_ROOT_TASK_ID ||
    input.taskKey === OPTIMIZE_EARTH_ROOT_TASK_KEY ||
    input.taskKey?.startsWith(`${PERSON_PLANNING_ROOT_TASK_KEY_PREFIX}:`) ===
      true ||
    input.taskKey?.startsWith(
      `${ORGANIZATION_PLANNING_ROOT_TASK_KEY_PREFIX}:`,
    ) === true
  );
}

export const END_WAR_AND_DISEASE_TASK_ID = "end-war-and-disease";
export const END_WAR_AND_DISEASE_TASK_KEY = "program:end-war-and-disease";

// Top-level mission layer: peer nodes directly under the Optimize Earth root.
// Keep the legacy constants above for its managed retirement record.

export const END_WAR_TASK_ID = "end-war";
export const END_WAR_TASK_KEY = "mission:end-war";
export const END_DISEASE_TASK_ID = "end-disease";
export const END_DISEASE_TASK_KEY = "mission:end-disease";
export const END_POVERTY_TASK_ID = "end-poverty";
export const END_POVERTY_TASK_KEY = "mission:end-poverty";
export const PREVENT_EXTINCTION_TASK_ID = "prevent-extinction";
export const PREVENT_EXTINCTION_TASK_KEY = "mission:prevent-extinction";
export const MINIMIZE_ANIMAL_SUFFERING_TASK_ID = "minimize-animal-suffering";
export const MINIMIZE_ANIMAL_SUFFERING_TASK_KEY =
  "mission:minimize-animal-suffering";

export const COURT_OF_HUMANITY_TASK_ID = "court-of-humanity";
export const COURT_OF_HUMANITY_TASK_KEY = "program:court-of-humanity:establish";
export const COURT_OF_HUMANITY_CHARTER_TASK_ID = "court-of-humanity-charter";
export const COURT_OF_HUMANITY_CHARTER_TASK_KEY =
  "program:court-of-humanity:charter";

/**
 * Canonical display name for the class action. Use this in user-facing copy,
 * task titles, and email/share strings — never hardcode "Humanity v.
 * Government" or "Humanity v. Governments of Earth" directly. The task ID
 * below keeps the "-of-earth" suffix as a stable database identifier even
 * though the display name dropped it.
 */
export const HUMANITY_V_GOVERNMENT_CASE_NAME = "Humanity v. Government";

export const HUMANITY_V_GOVERNMENTS_TASK_ID = "humanity-v-governments-of-earth";
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

// Loving Takeover program (shareholder route to the treaty)

export const LOVING_TAKEOVER_TASK_ID = "loving-takeover";
export const LOVING_TAKEOVER_TASK_KEY = "program:loving-takeover";
export const LOVING_TAKEOVER_OWN_ONE_SHARE_TASK_ID =
  "loving-takeover-own-one-share";
export const LOVING_TAKEOVER_OWN_ONE_SHARE_TASK_KEY =
  "program:loving-takeover:own-one-share";
export const LOVING_TAKEOVER_LOVE_LETTER_TASK_ID =
  "loving-takeover-love-letter";
export const LOVING_TAKEOVER_LOVE_LETTER_TASK_KEY =
  "program:loving-takeover:love-letter";
export const LOVING_TAKEOVER_OPTIMIZE_LOBBYING_TASK_ID =
  "loving-takeover-optimize-lobbying";
export const LOVING_TAKEOVER_OPTIMIZE_LOBBYING_TASK_KEY =
  "program:loving-takeover:optimize-lobbying";
export const LOVING_TAKEOVER_ACQUIRE_STAKES_TASK_ID =
  "loving-takeover-acquire-stakes";
export const LOVING_TAKEOVER_ACQUIRE_STAKES_TASK_KEY =
  "program:loving-takeover:acquire-stakes";
export const LOVING_TAKEOVER_LITIGATION_TASK_ID =
  "loving-takeover-shareholder-litigation";
export const LOVING_TAKEOVER_LITIGATION_TASK_KEY =
  "program:loving-takeover:shareholder-litigation";
export const LOVING_TAKEOVER_FILE_COMPLAINT_TASK_ID =
  "loving-takeover-file-derivative-complaint";
export const LOVING_TAKEOVER_FILE_COMPLAINT_TASK_KEY =
  "program:loving-takeover:file-derivative-complaint";

// Earth Optimization Prize (Phase 1 funding mechanism)

export const EARTH_OPTIMIZATION_PRIZE_TASK_ID = "earth-optimization-prize";
export const EARTH_OPTIMIZATION_PRIZE_TASK_KEY =
  "program:earth-optimization-prize";

// dFDA direct funding program

export const DFDA_CREATE_TASK_ID = "dfda";
export const DFDA_CREATE_TASK_KEY = "program:dfda:create";

// Shirt cascade seed program

export const SHIRT_SEED_TASK_ID = "shirt-seed";
export const SHIRT_SEED_TASK_KEY = "program:shirt-seed";

// Earth Optimization Services capitalization

export const EOS_CAPITALIZE_TASK_ID = "eos-capitalize";
export const EOS_CAPITALIZE_TASK_KEY = "program:eos:capitalize";
export const EOS_FUND_EVIDENCE_TASK_ID = "eos-fund-evidence-tools";
export const EOS_FUND_EVIDENCE_TASK_KEY = "program:eos:fund-evidence-tools";
export const EOS_CALCULATE_POLICY_BUDGETS_TASK_ID =
  "eos-calculate-policy-budgets";
export const EOS_CALCULATE_POLICY_BUDGETS_TASK_KEY =
  "program:eos:calculate-policy-budgets";
export const EOS_IMPLEMENT_INTERVENTIONS_TASK_ID =
  "eos-implement-interventions";
export const EOS_IMPLEMENT_INTERVENTIONS_TASK_KEY =
  "program:eos:implement-interventions";

// Optimize Optimitron engineering program (the dev branch of the task tree).
//
// The ID is the cuid of the runtime-created row this managed entry adopted:
// the sync matches by id and throws on a same-taskKey/different-id row, so
// the managed id must equal the existing row's id. Do not "fix" it to a slug
// — that crashes the preview sync against the prod-fork database.
export const OPTIMITRON_DEV_TASK_ID = "cmrh79s7h000604jtqfckws4t";
export const OPTIMITRON_DEV_TASK_KEY = "optimitron:dev";
export const TASK_GRAPH_STEWARD_TASK_ID = "cms3mwj7h000l04jrx9f6i3n5";
export const TASK_GRAPH_STEWARD_TASK_KEY = "optimitron:task-graph-steward";

// 1% Treaty parent + signer subtree

export const TREATY_PARENT_TASK_ID = "1-pct-treaty";
export const TREATY_PARENT_TASK_KEY = "program:one-percent-treaty:ratify";
export const TREATY_PARENT_TASK_TITLE = "Ratify the 1% Treaty";
export const TREATY_SIGNER_TASK_ID_PREFIX = "1-pct-treaty-signer";
export const TREATY_SIGNER_TASK_KEY_PREFIX =
  "program:one-percent-treaty:signer";
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
  return (
    taskKey != null &&
    /^program:one-percent-treaty:signer:[a-z0-9-]+$/i.test(taskKey)
  );
}

export function isTreatySignerTaskKeyPrefix(
  taskKey: string | null | undefined,
) {
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

export const SIGNER_REMINDER_TASK_KEY_PREFIX =
  "program:one-percent-treaty:reminder";

export function buildSignerReminderTaskKey(
  countryCode: string,
  userId: string,
) {
  return `${SIGNER_REMINDER_TASK_KEY_PREFIX}:${countryCode.toLowerCase()}:${userId}`;
}

// Referral invitation task

export const REFERRAL_INVITATION_TASK_KEY_PREFIX =
  "program:one-percent-treaty:referral-invitation";

export function buildReferralInvitationTaskKey(inviteToken: string) {
  return `${REFERRAL_INVITATION_TASK_KEY_PREFIX}:${inviteToken}`;
}

// Accountability (per-leader-activity)

export const ACCOUNTABILITY_TASK_KEY_PREFIX = "accountability";

export function buildAccountabilityTaskKey(
  countryCode: string,
  activitySlug: string,
) {
  return `${ACCOUNTABILITY_TASK_KEY_PREFIX}:${countryCode.toLowerCase()}:${activitySlug}`;
}
