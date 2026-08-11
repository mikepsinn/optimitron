import {
  HUMANITY_MANAGEMENT,
  NUCLEAR_OVERKILL_ALZHEIMERS_TAGLINE,
  NUCLEAR_OVERKILL_ALZHEIMERS_TREATY_FOLLOWUP,
} from "@optimitron/data/campaign";
import {
  Prisma,
  TaskCategory,
  TaskClaimPolicy,
  type PrismaClient,
} from "../generated/prisma/client.js";
import {
  REFERRAL_INVITATION_TASK_KEY_PREFIX,
  SIGNER_REMINDER_TASK_KEY_PREFIX,
  TASK_GRAPH_STEWARD_TASK_KEY,
  TREATY_PARENT_TASK_KEY,
  TREATY_SIGNER_TASK_KEY_PREFIX,
  USER_TREATY_TASK_KEY_PREFIX,
} from "../task-keys.js";
import { EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME } from "../system-identities.js";

export interface ManagedTaskSpawnSpecInput {
  kind: string;
  isParent?: boolean;
  sortOrder?: number;
  titleTemplate: string;
  descriptionTemplate: string;
  impactStatementTemplate?: string;
  roleTitleTemplate?: string;
  category?: keyof typeof TaskCategory;
  estimatedEffortHours?: number;
  dueDays?: number;
  availableInDays?: number;
  deadlinePolicy?: "NONE" | "SOFT" | "EXPIRES" | "REQUIRED";
  claimPolicy?: keyof typeof TaskClaimPolicy;
  isPublic?: boolean;
  skillTagTemplates?: string[];
  interestTagTemplates?: string[];
  actionLinkUrlTemplate?: string;
  actionLinkLabelTemplate?: string;
  actionLinkInstructionsTemplate?: string;
  creatorResolver?: string;
  assigneePersonResolver?: string;
  assigneeOrganizationResolver?: string;
  parentResolver?: string;
  contributesToGate?: boolean;
  metadata?: unknown;
}

export interface ManagedTaskCommunicationSpawnSpecInput {
  kind: string;
  sortOrder?: number;
  subjectTemplate: string;
  bodyTextTemplate: string;
  bodyHtmlTemplate?: string;
  commentTemplate?: string;
  channel?: string;
  audienceResolver?: string;
  purpose?: string;
  emailScope?: string;
  dedupeKeyTemplate: string;
  minHoursBetweenSends?: number;
  maxSendsPerTask?: number;
  minSendCount?: number;
  maxSendCount?: number | null;
  metadata?: unknown;
}

export interface ManagedTaskTriggerInput {
  triggerKey: string;
  eventName: string;
  triggerKind?: "spawnTasks" | "verifyTask" | "spawnCommunication";
  idempotencyKeyTemplate: string;
  eventFilter?: unknown;
  completionGate?: unknown;
  jurisdictionId?: string;
  notes?: string;
  enabled?: boolean;
  disabledReason?: string | null;
  schedule?: string;
  iterationSource?: string;
  spawnSpecs?: ManagedTaskSpawnSpecInput[];
  communicationSpawnSpecs?: ManagedTaskCommunicationSpawnSpecInput[];
  metadata?: unknown;
  retired?: boolean;
}

const TREATY_ACTION_PATH = "/treaty";

// ---------------------------------------------------------------------------
// Pattern 1+2 — Per-user onboarding tree (1% Treaty)
// ---------------------------------------------------------------------------
const USER_TREATY_TASK_TITLE =
  "Get {{params.majorityHumanity}} people to vote on the 1% Treaty";
const USER_TREATY_TASK_ROLE_TITLE = `Humanity Manager, ${EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME}`;
const PROMOTION_TO_HUMANITY_MANAGER_TASK_TITLE = "Promote to Humanity Manager";

// Per-user HMT root description = the Promotion content from
// docs/questions.md (lines 392-403, the Promotion screen). The live
// "Performance to date" counter from the screen is omitted because it doesn't
// translate to a static task body. Compensation numbers come from
// {{params.healthYearsGainLinked}} (TREATY_HALE_GAIN_YEAR_15 -> 21.7) and
// {{params.lifetimeIncomeGainLinked}} (TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA -> $3.48M).
// Markdown task descriptions render the *Linked variants — clickable
// citations to the manual chapter for skeptics who want to verify.
const USER_TREATY_DESCRIPTION = [
  "🎉 **CONGRATULATIONS**",
  "",
  `You have been promoted to **Humanity Manager** at ${EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME}.`,
  "",
  "**Direct reports:** ~{{params.globalHumanity}} humans",
  "**Primary KPI:** Hours of human suffering prevented per week",
  "**Compensation:**",
  "- ~**{{params.healthYearsGainLinked}}** extra years of healthy life",
  "- ~**{{params.lifetimeIncomeGainLinked}}** additional lifetime income",
  "- Vesting: contingent on treaty passage. Forfeited on dismissal.",
].join("\n");

// Phone script — uses {{params.*}} tokens for canonical numbers so the
// rendered copy stays in sync when the parameter source updates.
//   {{params.militaryVsResearchRatio}} -> 604 (military vs gov clinical trials)
//   {{params.statusQuoYears}}          -> 443 (queue clearance, status quo)
//   {{params.dfdaYears}}               -> 36  (queue clearance, dFDA)
//   {{params.apocalypseCount}}         -> 122 (nuclear-winter overkill factor)
// These are deliberately the RAW variants, not `*Linked`. The script is
// meant to be read aloud or copy-pasted into a text message — markdown
// link syntax leaks as `[604](https://...)` in those contexts. For
// markdown-rendered task descriptions and HTML email bodies, use the
// `*Linked` variants instead (see USER_TREATY_DESCRIPTION above).
const PHONE_SCRIPT_NUCLEAR_OVERKILL_PARAGRAPH = [
  NUCLEAR_OVERKILL_ALZHEIMERS_TAGLINE.replace(
    "{NUCLEAR_WINTER_OVERKILL_FACTOR}",
    "{{params.apocalypseCount}}",
  ),
  NUCLEAR_OVERKILL_ALZHEIMERS_TREATY_FOLLOWUP,
].join(" ");

const PHONE_SCRIPT_DESCRIPTION = [
  "Your job is to manage {{params.globalHumanity}} humans. You're busy. Outsource it.",
  "",
  "The trick: call one human you love and don't want to watch suffer or die from horrible diseases. Read them the script below. They vote, then call {{params.propagationAsksPerHuman}} humans they love. After {{params.doublingRoundsToTarget}} rounds of this, {{params.majorityHumanity}} humans are reached. Tom Sawyer painting the fence — you don't have to convince anyone of anything they don't already believe, you just have to get one human to start delegating too.",
  "",
  "Could be one nice phone call with someone who loves you. If they actually do it.",
  "",
  "---",
  "",
  "Script (read out loud, edit to taste):",
  "",
  '"Hey [friend]. Quick favor.',
  "",
  "Humans spend {{params.militaryVsResearchRatio}} times more on weapons than on testing which medicines work. There's a treaty — the 1% Treaty — that redirects 1% of military spending into pragmatic clinical trials. Sixty million humans die every year, mostly from things we already know how to fix. The treaty would shorten the time to disease eradication from about {{params.statusQuoYears}} years to about {{params.dfdaYears}}.",
  "",
  PHONE_SCRIPT_NUCLEAR_OVERKILL_PARAGRAPH,
  "",
  "Voting takes thirty seconds. Open the link I'm about to send you, vote yes, then call {{params.propagationAsksPerHuman}} humans you love and read them this same paragraph. That's the whole ask. I do this with you, you do this with {{params.propagationAsksPerHuman}} more, after {{params.doublingRoundsToTarget}} rounds we've reached {{params.majorityHumanity}} humans.\"",
  "",
  "---",
  "",
  "Mark this task done after you've made the call AND actually sent your referral URL. The receiving end finishes when assigned humans vote — that's tracked separately by the {{params.directHumanAssignments}} assign-a-human subtasks below.",
].join("\n");

const userOnboardingTreaty: ManagedTaskTriggerInput = {
  triggerKey: "user-onboarding:treaty",
  eventName: "user.signup",
  triggerKind: "spawnTasks",
  enabled: true,
  idempotencyKeyTemplate: `${USER_TREATY_TASK_KEY_PREFIX}:{{user.id}}`,
  notes:
    "Per-user onboarding tree spawned at signup. The hardcoded ensureUserTreatyTask path still owns the return contract for existing callers; these specs converge on the same taskKey rows and are the source blueprint for the next migration step. The parent root has no completionGate of its own — the HMT auto-verify lives in user-onboarding:treaty:hmt-gate and targets the completeTraining sibling.",
  spawnSpecs: [
    {
      kind: "root",
      isParent: true,
      sortOrder: 0,
      titleTemplate: USER_TREATY_TASK_TITLE,
      descriptionTemplate: USER_TREATY_DESCRIPTION,
      roleTitleTemplate: USER_TREATY_TASK_ROLE_TITLE,
      category: "OTHER",
      dueDays: 0,
      claimPolicy: "ASSIGNED_ONLY",
      isPublic: false,
      creatorResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: `fixed:${TREATY_PARENT_TASK_KEY}`,
    },
    // sortOrder: chain-creating actions first (assign 2 humans), then the
    // public-signal layer (broadcast URL + sign personally), then the
    // hardest-friction action (phone call) last. The user is at peak
    // motivation right after signin; spend that on the action that
    // actually creates the doubling chain. Lower-leverage public-signal
    // and the highest-friction phone call wait for after they're invested.
    {
      kind: "assignFirstHuman",
      sortOrder: 0,
      titleTemplate: "Give your first human the 1% Treaty voting task",
      descriptionTemplate:
        "Pick someone you trust. Send them a named invitation. If they vote, they get promoted too.",
      category: "OTHER",
      estimatedEffortHours: 0.1,
      dueDays: 0,
      creatorResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "trigger.parentSpec",
      contributesToGate: true,
    },
    {
      kind: "assignSecondHuman",
      sortOrder: 10,
      titleTemplate: "Give your second human the 1% Treaty voting task",
      descriptionTemplate:
        "Pick a second person. Same deal. {{params.directHumanAssignments}} reports is the minimum viable team.",
      category: "OTHER",
      estimatedEffortHours: 0.1,
      dueDays: 0,
      creatorResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "trigger.parentSpec",
      contributesToGate: true,
    },
    {
      kind: "shareReferralUrl",
      sortOrder: 20,
      titleTemplate: "Share your 1% Treaty referral URL",
      descriptionTemplate:
        "Post your referral URL anywhere — text, social, email. Votes that arrive through it count toward your direct reports.",
      category: "OTHER",
      estimatedEffortHours: 0.02,
      dueDays: 0,
      creatorResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "trigger.parentSpec",
      contributesToGate: true,
    },
    {
      kind: "signTreatyPersonally",
      sortOrder: 30,
      titleTemplate: "Sign the 1% Treaty publicly",
      descriptionTemplate:
        "Voting on this site is private. Signing on warondisease.org is public. You can't credibly ask a friend to do something you haven't publicly committed to yourself.",
      category: "OTHER",
      estimatedEffortHours: 0.01,
      dueDays: 0,
      creatorResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "trigger.parentSpec",
      // Relative path. The middleware (getSiteRouteDisposition) redirects
      // users on a variant without /treaty to the canonical War on Disease
      // origin automatically. See getSiteRouteRedirect in lib/site.ts.
      actionLinkUrlTemplate: TREATY_ACTION_PATH,
      actionLinkLabelTemplate: "Sign the treaty",
      contributesToGate: true,
    },
    {
      kind: "hangFlyers",
      sortOrder: 35,
      titleTemplate: "Print and hang referral flyers near you",
      descriptionTemplate:
        "Print your referral poster. Open nearby hang spots. Claim a board, ask before you tape, photograph the hung flyer, and mark the hang done. Rehang when a spot goes stale.",
      category: "OUTREACH",
      estimatedEffortHours: 0.5,
      dueDays: 0,
      creatorResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "trigger.parentSpec",
      actionLinkUrlTemplate: "/poster",
      actionLinkLabelTemplate: "Open poster and hang list",
      // Optional outreach — does not block Humanity Manager promotion.
      contributesToGate: false,
    },
    {
      kind: "phoneScript",
      sortOrder: 40,
      titleTemplate: HUMANITY_MANAGEMENT.callOneHumanTaskTitle,
      descriptionTemplate: PHONE_SCRIPT_DESCRIPTION,
      category: "OTHER",
      estimatedEffortHours: 0.5,
      dueDays: 0,
      creatorResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "trigger.parentSpec",
      contributesToGate: true,
    },
    {
      kind: "completeTraining",
      sortOrder: 50,
      titleTemplate: PROMOTION_TO_HUMANITY_MANAGER_TASK_TITLE,
      descriptionTemplate:
        "Auto-completes when the five tasks above are done. You don't action this one directly.",
      category: "OTHER",
      estimatedEffortHours: 0.25,
      creatorResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "trigger.parentSpec",
    },
  ],
};

// ---------------------------------------------------------------------------
// Pattern 4 — Referral invitation
// ---------------------------------------------------------------------------

const referralVoteInvitation: ManagedTaskTriggerInput = {
  triggerKey: "referral:vote-invitation",
  eventName: "referral.sent",
  triggerKind: "spawnTasks",
  enabled: true,
  idempotencyKeyTemplate: `${REFERRAL_INVITATION_TASK_KEY_PREFIX}:{{inviteToken}}`,
  notes:
    "Spawns a follow-up task on the inviter's queue when they send a named referral. Backs createReferralInvitationTask. Caller pre-computes recipient.firstName, actionLink.url, actionLink.instructions and injects them as context tokens.",
  spawnSpecs: [
    {
      kind: "root",
      isParent: true,
      sortOrder: 0,
      titleTemplate: "{{recipient.firstName}}: vote on the 1% Treaty",
      descriptionTemplate:
        "{{recipient.firstName}} was invited to vote on the 1% Treaty.\n\nThe task is complete when their verified vote converts the invitation.",
      roleTitleTemplate: "Referred treaty voter",
      category: "OUTREACH",
      estimatedEffortHours: 0.01,
      dueDays: 3,
      claimPolicy: "ASSIGNED_ONLY",
      isPublic: false,
      skillTagTemplates: ["voting"],
      interestTagTemplates: ["one-percent-treaty", "war-on-disease"],
      creatorResolver: "actor",
      assigneePersonResolver: "context.recipientPersonId",
      parentResolver: "context.parentTaskId",
      actionLinkUrlTemplate: "{{actionLink.url}}",
      actionLinkLabelTemplate: "Complete treaty vote",
      actionLinkInstructionsTemplate: "{{actionLink.instructions}}",
    },
  ],
};

// ---------------------------------------------------------------------------
// Pattern 3 — Signer reminder subtask
// ---------------------------------------------------------------------------

const treatySignerReminder: ManagedTaskTriggerInput = {
  triggerKey: "treaty:signer-reminder",
  eventName: "mcp.claimSignerReminder",
  triggerKind: "spawnTasks",
  enabled: true,
  idempotencyKeyTemplate: `${SIGNER_REMINDER_TASK_KEY_PREFIX}:{{signer.countryCode}}:{{user.id}}`,
  notes:
    "Spawns a private reminder subtask under a parent signer task when a humanity-manager claims responsibility. Backs upsertSignerReminderTask. Caller pre-computes the action-link URL (a Google search for the signer's office contact) and the message instructions (containing the user's referralCode embedded in the treaty URL) and injects them as context.actionLink.{url,instructions}.",
  spawnSpecs: [
    {
      kind: "root",
      isParent: true,
      sortOrder: 0,
      titleTemplate: "Remind {{signer.leaderName}} to sign the 1% Treaty",
      descriptionTemplate:
        "Remind {{signer.leaderName}} ({{signer.governmentName}}) to sign the 1% Treaty.\n\nFind their contact info via the action link, then send the message template.\n\nWhen {{signer.leaderName}} signs via your referral code, this task verifies automatically and the parent signer task closes.",
      roleTitleTemplate: "1% Treaty Reminder Sender",
      category: "OUTREACH",
      estimatedEffortHours: 0.05,
      claimPolicy: "ASSIGNED_ONLY",
      isPublic: false,
      skillTagTemplates: ["outreach", "diplomacy"],
      interestTagTemplates: [
        "one-percent-treaty",
        "war-on-disease",
        "country-{{signer.countryCodeLower}}",
      ],
      creatorResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "context.parentTaskId",
      actionLinkUrlTemplate: "{{actionLink.url}}",
      actionLinkLabelTemplate: "Find their contact info",
      actionLinkInstructionsTemplate: "{{actionLink.instructions}}",
    },
  ],
};

// ---------------------------------------------------------------------------
// Pattern 5 — Treaty parent (singleton)
// ---------------------------------------------------------------------------

const treatyRatify: ManagedTaskTriggerInput = {
  triggerKey: "treaty:ratify",
  eventName: "manual",
  triggerKind: "spawnTasks",
  enabled: true,
  idempotencyKeyTemplate: TREATY_PARENT_TASK_KEY,
  notes:
    "Singleton parent task for the 1% Treaty. Fires once via startup-seed; replaces ensureTreatyParentTask.",
  spawnSpecs: [
    {
      kind: "root",
      isParent: true,
      sortOrder: 0,
      titleTemplate: "Ratify the 1% Treaty",
      descriptionTemplate:
        "Get every signing-eligible head of state to ratify the 1% Treaty. Children are per-country signer tasks.",
      category: "OTHER",
      claimPolicy: "ASSIGNED_ONLY",
      isPublic: true,
      creatorResolver: "system",
      parentResolver: "none",
    },
  ],
};

// ---------------------------------------------------------------------------
// Pattern 6 — HMT auto-verify gate
// ---------------------------------------------------------------------------

const hmtVerifyGate: ManagedTaskTriggerInput = {
  triggerKey: "user-onboarding:treaty:hmt-gate",
  eventName: "task.statusChanged.VERIFIED",
  triggerKind: "verifyTask",
  enabled: true,
  // Verify TARGET: the user's `completeTraining` sibling task. Siblings
  // (share / phoneScript / assignFirstHuman / assignSecondHuman) live under
  // the same parent (the user's HMT root). When the gate is met against
  // those siblings, completeTraining auto-VERIFIES.
  idempotencyKeyTemplate: `${USER_TREATY_TASK_KEY_PREFIX}:{{user.id}}:completeTraining`,
  eventFilter: {
    field: "task.taskKey",
    matches: `^${USER_TREATY_TASK_KEY_PREFIX}:.+:(signTreatyPersonally|shareReferralUrl|phoneScript|assignFirstHuman|assignSecondHuman)$`,
  },
  completionGate: {
    kind: "allOf",
    inputScope: "siblings",
    subtaskKinds: [
      "signTreatyPersonally",
      "shareReferralUrl",
      "phoneScript",
      "assignFirstHuman",
      "assignSecondHuman",
    ],
    evidenceTemplate:
      "User publicly signed the treaty, shared their referral URL, made the phone call, and gave two named humans their 1% Treaty voting tasks.",
  },
  notes:
    "Auto-VERIFIES the user's completeTraining subtask when its siblings (sign + share + phoneScript + invite1 + invite2) are VERIFIED.",
};

// ---------------------------------------------------------------------------
// Pattern 7+8 — Treaty signer per-slot (data-driven import)
// ---------------------------------------------------------------------------

const treatySignerPerSlot: ManagedTaskTriggerInput = {
  triggerKey: "treaty:signer",
  eventName: "dataset.recordChanged.signer",
  triggerKind: "spawnTasks",
  idempotencyKeyTemplate: `${TREATY_SIGNER_TASK_KEY_PREFIX}:{{slot.countryCode}}`,
  notes:
    "Spawns one signer task per slot during the treaty-signer dataset import. Caller (sync-treaty-signers) iterates the dataset and fires this trigger per slot.",
  enabled: false,
  spawnSpecs: [
    {
      kind: "root",
      isParent: true,
      sortOrder: 0,
      titleTemplate:
        "{{slot.leaderName}} signs the 1% Treaty for {{slot.countryName}}",
      descriptionTemplate:
        "Convince {{slot.leaderName}} ({{slot.role}} of {{slot.countryName}}) to sign the 1% Treaty. Recipients of the assignee's signature: their citizens.",
      roleTitleTemplate: "{{slot.role}} of {{slot.countryName}}",
      category: "OTHER",
      claimPolicy: "OPEN_MANY",
      isPublic: true,
      creatorResolver: "system",
      parentResolver: `fixed:${TREATY_PARENT_TASK_KEY}`,
      // Relative path. The middleware (getSiteRouteDisposition) redirects
      // users on a variant without /treaty to the canonical War on Disease
      // origin automatically. See getSiteRouteRedirect in lib/site.ts.
      actionLinkUrlTemplate: TREATY_ACTION_PATH,
      actionLinkLabelTemplate: "Sign the treaty",
    },
  ],
};

// ---------------------------------------------------------------------------
// Tree-hygiene sweeps — scheduled agent tasks under the task-graph steward
// ---------------------------------------------------------------------------
// Each sweep is ONE persistent agent task with a stable taskKey: the schedule
// re-activates it (spec metadata.reactivateOnFire) instead of spawning dated
// instances, which previously piled up as zombies. contextJson.executor_type
// "AI Agent" (spec metadata.taskContextJson) makes the task getAIQueue-
// eligible. The description is the agent's standing work order; the sweeps
// spawn tasks only, no email — see the Wishonia-nudges note below.

// The operator's Person id — scheduled fires have no actor to resolve an
// assignee from, and the sweeps must land in the operator's AI queue.
const OPERATOR_PERSON_ID = "cmoi5ad7v000004jvp8vozoki";

const FULL_TREE_AUDIT_STEPS = [
  "1. Call getTaskTreeAudit and keep passing nextCursor until complete is true. Process each issueKey only once.",
  "2. Use searchTasks, listTasks, and getQueueAudit only to inspect relevant findings; their limited result sets are not a substitute for the full-tree audit.",
] as const;

const HYGIENE_SWEEP_SPEC_BASE = {
  isParent: true,
  kind: "sweep",
  category: "GOVERNANCE",
  claimPolicy: "ASSIGNED_ONLY",
  isPublic: false,
  creatorResolver: "system",
  assigneePersonResolver: `fixed-person:${OPERATOR_PERSON_ID}`,
  parentResolver: `fixed:${TASK_GRAPH_STEWARD_TASK_KEY}`,
} satisfies Partial<ManagedTaskSpawnSpecInput>;

const hygieneDuplicateSweep: ManagedTaskTriggerInput = {
  triggerKey: "hygiene:duplicate-sweep",
  eventName: "schedule",
  triggerKind: "spawnTasks",
  idempotencyKeyTemplate: "optimitron:dev:hygiene:duplicate-sweep",
  schedule: "0 9 * * *",
  iterationSource: "none",
  enabled: true,
  notes:
    "Daily duplicate/misparent sweep. Re-activates the standing sweep task each morning.",
  spawnSpecs: [
    {
      ...HYGIENE_SWEEP_SPEC_BASE,
      titleTemplate: "Daily sweep: duplicate and misparented tasks",
      descriptionTemplate: [
        "Scan the active task tree for duplicates and misparented tasks, then submit fixes as approval-gated proposals — never mutate directly.",
        "",
        ...FULL_TREE_AUDIT_STEPS,
        "3. For each duplicate pair, decide the canonical task (older, richer history, referenced by edges) and propose folding the other into it via the admin mergeTask tool — post the pair and rationale as a task comment on the canonical task for approval first.",
        "4. For each misparented task (wrong branch, personal task under a public program, program task under a personal branch), post a re-parent proposal comment naming the target parent.",
        "5. Record what was swept and proposed in a completion comment, then mark this task VERIFIED. The schedule reopens it tomorrow.",
      ].join("\n"),
      impactStatementTemplate:
        "Duplicates split effort and corrupt EV roll-ups; every merged pair makes the queue ranking more truthful.",
      estimatedEffortHours: 1,
      metadata: {
        reactivateOnFire: true,
        taskContextJson: {
          executor_type: "AI Agent",
          value: 20000,
          p_success: 0.9,
          cash_cost: 0,
          ev_math:
            "placeholder container estimate; hygiene value accrues to ranking integrity",
        },
      },
    },
  ],
};

const hygieneRootOrphanSweep: ManagedTaskTriggerInput = {
  triggerKey: "hygiene:root-orphan-sweep",
  eventName: "schedule",
  triggerKind: "spawnTasks",
  idempotencyKeyTemplate: "optimitron:dev:hygiene:root-orphan-sweep",
  schedule: "30 9 * * *",
  iterationSource: "none",
  enabled: true,
  notes:
    "Daily sweep for tasks parented directly under the optimize-earth root or detached from it.",
  spawnSpecs: [
    {
      ...HYGIENE_SWEEP_SPEC_BASE,
      titleTemplate: "Daily sweep: root orphans and unrooted tasks",
      descriptionTemplate: [
        "Find tasks that sit directly under the Optimize Earth root without being a managed program branch, plus tasks detached from the rooted tree entirely.",
        "",
        ...FULL_TREE_AUDIT_STEPS,
        "3. For each orphan or unkeyed root child, inspect its evidence and post a re-parent proposal naming the correct branch (personal planner root, organization branch, or program). Do not re-parent directly.",
        "4. Summarize findings in a completion comment and mark this task VERIFIED. The schedule reopens it tomorrow.",
      ].join("\n"),
      impactStatementTemplate:
        "Root orphans bypass EV attribution and clutter the public tree the campaign links to.",
      estimatedEffortHours: 0.5,
      metadata: {
        reactivateOnFire: true,
        taskContextJson: {
          executor_type: "AI Agent",
          value: 15000,
          p_success: 0.9,
          cash_cost: 0,
          ev_math:
            "placeholder container estimate; hygiene value accrues to ranking integrity",
        },
      },
    },
  ],
};

const hygieneEstimateStalenessSweep: ManagedTaskTriggerInput = {
  triggerKey: "hygiene:estimate-staleness-sweep",
  eventName: "schedule",
  triggerKind: "spawnTasks",
  idempotencyKeyTemplate: "optimitron:dev:hygiene:estimate-staleness-sweep",
  schedule: "0 10 * * 1",
  iterationSource: "none",
  enabled: true,
  notes:
    "Weekly sweep for stale parameter-derived estimates and missing impact frames.",
  spawnSpecs: [
    {
      ...HYGIENE_SWEEP_SPEC_BASE,
      titleTemplate: "Weekly sweep: stale estimates and missing impact frames",
      descriptionTemplate: [
        "Audit impact estimates across the active tree: parameterInputsStale sets, tasks missing impact frames, and hand-entered estimates that now have parameter-catalog equivalents.",
        "",
        ...FULL_TREE_AUDIT_STEPS,
        "3. Use searchParameters to check catalog coverage for each stale or missing estimate finding.",
        "4. For each stale or missing estimate, submit a refreshed estimate through proposeParameterBundle / proposeTaskImpact so it lands in the review queue — never edit estimates directly.",
        "5. Summarize what was refreshed and what needs a human decision in a completion comment, then mark this task VERIFIED. The schedule reopens it next Monday.",
      ].join("\n"),
      impactStatementTemplate:
        "Stale estimates rank the wrong work first; the queue is only as honest as its inputs.",
      estimatedEffortHours: 1,
      metadata: {
        reactivateOnFire: true,
        taskContextJson: {
          executor_type: "AI Agent",
          value: 10000,
          p_success: 0.85,
          cash_cost: 0,
          ev_math:
            "placeholder container estimate; hygiene value accrues to ranking integrity",
        },
      },
    },
  ],
};

// Note on Wishonia nudges: the framework now supports per-trigger schedules,
// iterationSource queries, and per-spec sendCount-range escalation — see the
// run-due-triggers route plus minSendCount/maxSendCount on
// TaskCommunicationSpawnSpec. We deliberately do NOT seed an escalating
// "Wishonia gets disappointed weekly" trigger because the email-deliverability
// cost probably exceeds the completion uplift on passive signups. The HMT root
// task description is the welcome and the nag; if a user comes back, they see
// the task. Email stays reserved for transactional + asked-for signals.
// The hygiene sweeps above honor this: they spawn agent tasks, never email.
export const ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS: ManagedTaskTriggerInput[] =
  [
    userOnboardingTreaty,
    referralVoteInvitation,
    treatySignerReminder,
    treatyRatify,
    hmtVerifyGate,
    treatySignerPerSlot,
    hygieneDuplicateSweep,
    hygieneRootOrphanSweep,
    hygieneEstimateStalenessSweep,
  ];

export interface SyncManagedTaskTriggersOptions {
  apply: boolean;
  now?: Date;
  records?: ManagedTaskTriggerInput[];
}

export interface SyncManagedTaskTriggersResult {
  mode: "apply" | "dry-run";
  created: string[];
  updated: string[];
  unchanged: string[];
  retired: string[];
  missingRetired: string[];
}

type ManagedTaskSpawnSpecData = ReturnType<typeof toSpawnSpecCreate>;
type ManagedTaskCommunicationSpawnSpecData = ReturnType<
  typeof toCommSpecCreate
>;

interface ManagedTaskSpawnSpecRow extends ManagedTaskSpawnSpecData {
  id?: string;
  triggerId?: string;
}

interface ManagedTaskCommunicationSpawnSpecRow extends ManagedTaskCommunicationSpawnSpecData {
  id?: string;
  triggerId?: string;
}

interface ManagedTaskTriggerRow {
  id: string;
  triggerKey: string;
  eventName: string;
  eventFilter: unknown;
  triggerKind: string;
  enabled: boolean;
  disabledReason: string | null;
  idempotencyKeyTemplate: string;
  completionGate: unknown;
  jurisdictionId: string | null;
  schedule: string | null;
  iterationSource: string | null;
  notes: string | null;
  metadata: unknown;
  deletedAt: Date | null;
  spawnSpecs: ManagedTaskSpawnSpecRow[];
  communicationSpawnSpecs: ManagedTaskCommunicationSpawnSpecRow[];
}

export async function syncManagedTaskTriggers(
  prisma: PrismaClient,
  options: SyncManagedTaskTriggersOptions,
): Promise<SyncManagedTaskTriggersResult> {
  const records = options.records ?? ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS;
  assertUniqueManagedTaskTriggers(records);

  const result: SyncManagedTaskTriggersResult = {
    mode: options.apply ? "apply" : "dry-run",
    created: [],
    updated: [],
    unchanged: [],
    retired: [],
    missingRetired: [],
  };

  const triggerKeys = records.map((record) => record.triggerKey);
  const existingRows = (await prisma.taskTrigger.findMany({
    where: { triggerKey: { in: triggerKeys } },
    include: {
      spawnSpecs: { orderBy: [{ sortOrder: "asc" }, { kind: "asc" }] },
      communicationSpawnSpecs: {
        orderBy: [{ sortOrder: "asc" }, { kind: "asc" }],
      },
    },
  })) as unknown as ManagedTaskTriggerRow[];
  const existingByKey = new Map(
    existingRows.map((row) => [row.triggerKey, row]),
  );
  const now = options.now ?? new Date();

  for (const record of records) {
    const existing = existingByKey.get(record.triggerKey) ?? null;

    if (record.retired) {
      if (!existing) {
        result.missingRetired.push(record.triggerKey);
        continue;
      }

      if (!existing.enabled && existing.deletedAt !== null) {
        result.unchanged.push(record.triggerKey);
        continue;
      }

      result.retired.push(record.triggerKey);
      if (options.apply) {
        await prisma.taskTrigger.update({
          where: { triggerKey: record.triggerKey },
          data: {
            enabled: false,
            disabledReason:
              record.disabledReason ?? "Retired by managed-data sync.",
            deletedAt: now,
            updatedByUserId: null,
          },
        });
      }
      continue;
    }

    if (!existing) {
      result.created.push(record.triggerKey);
      if (options.apply) {
        await createManagedTaskTrigger(prisma, record);
      }
      continue;
    }

    if (!managedTaskTriggerNeedsUpdate(existing, record)) {
      result.unchanged.push(record.triggerKey);
      continue;
    }

    result.updated.push(record.triggerKey);
    if (options.apply) {
      await updateManagedTaskTrigger(prisma, existing, record);
    }
  }

  return result;
}

export function formatManagedTaskTriggersResult(
  result: SyncManagedTaskTriggersResult,
) {
  const lines = [
    `Task triggers: ${result.mode}`,
    `  created: ${result.created.length}`,
    `  updated: ${result.updated.length}`,
    `  unchanged: ${result.unchanged.length}`,
    `  retired: ${result.retired.length}`,
  ];

  if (result.missingRetired.length > 0) {
    lines.push(`  already absent: ${result.missingRetired.length}`);
  }

  return lines.join("\n");
}

function assertUniqueManagedTaskTriggers(records: ManagedTaskTriggerInput[]) {
  const triggerKeys = new Set<string>();

  for (const record of records) {
    if (triggerKeys.has(record.triggerKey)) {
      throw new Error(
        `Duplicate managed task trigger key: ${record.triggerKey}`,
      );
    }
    triggerKeys.add(record.triggerKey);

    assertUniqueSpecKinds(record.triggerKey, record.spawnSpecs ?? []);
    assertUniqueSpecKinds(
      record.triggerKey,
      record.communicationSpawnSpecs ?? [],
    );

    const parentSpecs = (record.spawnSpecs ?? []).filter(
      (spec) => spec.isParent,
    );
    if (parentSpecs.length > 1) {
      throw new Error(
        `Managed task trigger ${record.triggerKey} has multiple parent spawn specs`,
      );
    }
  }
}

function assertUniqueSpecKinds(
  triggerKey: string,
  specs: Array<{ kind: string }>,
) {
  const kinds = new Set<string>();
  for (const spec of specs) {
    if (kinds.has(spec.kind)) {
      throw new Error(
        `Duplicate managed task trigger spec kind: ${triggerKey}/${spec.kind}`,
      );
    }
    kinds.add(spec.kind);
  }
}

async function createManagedTaskTrigger(
  prisma: PrismaClient,
  record: ManagedTaskTriggerInput,
) {
  const spawnSpecs = (record.spawnSpecs ?? []).map(toSpawnSpecCreate);
  const communicationSpawnSpecs = (record.communicationSpawnSpecs ?? []).map(
    toCommSpecCreate,
  );

  return prisma.taskTrigger.create({
    data: {
      ...toTriggerScalars(record),
      createdByUserId: null,
      updatedByUserId: null,
      spawnSpecs: spawnSpecs.length > 0 ? { create: spawnSpecs } : undefined,
      communicationSpawnSpecs:
        communicationSpawnSpecs.length > 0
          ? { create: communicationSpawnSpecs }
          : undefined,
    },
    include: { spawnSpecs: true, communicationSpawnSpecs: true },
  });
}

async function updateManagedTaskTrigger(
  prisma: PrismaClient,
  existing: ManagedTaskTriggerRow,
  record: ManagedTaskTriggerInput,
) {
  const spawnSpecs = (record.spawnSpecs ?? []).map(toSpawnSpecCreate);
  const communicationSpawnSpecs = (record.communicationSpawnSpecs ?? []).map(
    toCommSpecCreate,
  );

  return prisma.$transaction(async (tx) => {
    const updated = await tx.taskTrigger.update({
      where: { triggerKey: record.triggerKey },
      data: {
        ...toTriggerScalars(record),
        updatedByUserId: null,
      },
    });

    await tx.taskSpawnSpec.deleteMany({ where: { triggerId: existing.id } });
    if (spawnSpecs.length > 0) {
      await tx.taskSpawnSpec.createMany({
        data: spawnSpecs.map((spec) => ({
          ...spec,
          triggerId: updated.id,
        })),
      });
    }

    await tx.taskCommunicationSpawnSpec.deleteMany({
      where: { triggerId: existing.id },
    });
    if (communicationSpawnSpecs.length > 0) {
      await tx.taskCommunicationSpawnSpec.createMany({
        data: communicationSpawnSpecs.map((spec) => ({
          ...spec,
          triggerId: updated.id,
        })),
      });
    }

    return updated;
  });
}

function toTriggerScalars(record: ManagedTaskTriggerInput) {
  const enabled = record.enabled ?? false;

  return {
    triggerKey: record.triggerKey,
    eventName: record.eventName,
    eventFilter: nullableJson(record.eventFilter),
    triggerKind: record.triggerKind ?? "spawnTasks",
    enabled,
    disabledReason: enabled ? null : (record.disabledReason ?? null),
    idempotencyKeyTemplate: record.idempotencyKeyTemplate,
    completionGate: nullableJson(record.completionGate),
    jurisdictionId: record.jurisdictionId ?? null,
    schedule: record.schedule ?? null,
    iterationSource: record.iterationSource ?? null,
    notes: record.notes ?? null,
    metadata: nullableJson(record.metadata),
    deletedAt: null,
  };
}

function toSpawnSpecCreate(spec: ManagedTaskSpawnSpecInput) {
  return {
    kind: spec.kind,
    isParent: spec.isParent ?? false,
    sortOrder: spec.sortOrder ?? 0,
    titleTemplate: spec.titleTemplate,
    descriptionTemplate: spec.descriptionTemplate,
    impactStatementTemplate: spec.impactStatementTemplate ?? null,
    roleTitleTemplate: spec.roleTitleTemplate ?? null,
    category: spec.category ? TaskCategory[spec.category] : TaskCategory.OTHER,
    estimatedEffortHours: spec.estimatedEffortHours ?? null,
    dueDays: spec.dueDays ?? null,
    availableInDays: spec.availableInDays ?? null,
    deadlinePolicy: spec.deadlinePolicy ?? null,
    claimPolicy: spec.claimPolicy
      ? TaskClaimPolicy[spec.claimPolicy]
      : TaskClaimPolicy.ASSIGNED_ONLY,
    isPublic: spec.isPublic ?? false,
    skillTagTemplates: spec.skillTagTemplates ?? [],
    interestTagTemplates: spec.interestTagTemplates ?? [],
    actionLinkUrlTemplate: spec.actionLinkUrlTemplate ?? null,
    actionLinkLabelTemplate: spec.actionLinkLabelTemplate ?? null,
    actionLinkInstructionsTemplate: spec.actionLinkInstructionsTemplate ?? null,
    creatorResolver: spec.creatorResolver ?? "actor",
    assigneePersonResolver: spec.assigneePersonResolver ?? "none",
    assigneeOrganizationResolver: spec.assigneeOrganizationResolver ?? "none",
    parentResolver: spec.parentResolver ?? "trigger.parentSpec",
    contributesToGate: spec.contributesToGate ?? false,
    metadata: nullableJson(spec.metadata),
  };
}

function toCommSpecCreate(spec: ManagedTaskCommunicationSpawnSpecInput) {
  return {
    kind: spec.kind,
    sortOrder: spec.sortOrder ?? 0,
    subjectTemplate: spec.subjectTemplate,
    bodyTextTemplate: spec.bodyTextTemplate,
    bodyHtmlTemplate: spec.bodyHtmlTemplate ?? null,
    commentTemplate: spec.commentTemplate ?? null,
    channel: spec.channel ?? "EMAIL",
    audienceResolver: spec.audienceResolver ?? "ASSIGNEE",
    purpose: spec.purpose ?? "REMINDER",
    emailScope: spec.emailScope ?? null,
    dedupeKeyTemplate: spec.dedupeKeyTemplate,
    minHoursBetweenSends: spec.minHoursBetweenSends ?? 0,
    maxSendsPerTask: spec.maxSendsPerTask ?? 0,
    minSendCount: spec.minSendCount ?? 0,
    maxSendCount: spec.maxSendCount ?? null,
    metadata: nullableJson(spec.metadata),
  };
}

function nullableJson(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}

function managedTaskTriggerNeedsUpdate(
  existing: ManagedTaskTriggerRow,
  record: ManagedTaskTriggerInput,
) {
  const scalars = toTriggerScalars(record);

  return (
    existing.triggerKey !== scalars.triggerKey ||
    existing.eventName !== scalars.eventName ||
    !sameJson(existing.eventFilter, scalars.eventFilter) ||
    existing.triggerKind !== scalars.triggerKind ||
    existing.enabled !== scalars.enabled ||
    existing.disabledReason !== scalars.disabledReason ||
    existing.idempotencyKeyTemplate !== scalars.idempotencyKeyTemplate ||
    !sameJson(existing.completionGate, scalars.completionGate) ||
    existing.jurisdictionId !== scalars.jurisdictionId ||
    existing.schedule !== scalars.schedule ||
    existing.iterationSource !== scalars.iterationSource ||
    existing.notes !== scalars.notes ||
    !sameJson(existing.metadata, scalars.metadata) ||
    existing.deletedAt !== null ||
    !sameJson(
      normalizeSpawnSpecRows(existing.spawnSpecs),
      normalizeSpawnSpecInputs(record.spawnSpecs ?? []),
    ) ||
    !sameJson(
      normalizeCommunicationSpawnSpecRows(existing.communicationSpawnSpecs),
      normalizeCommunicationSpawnSpecInputs(
        record.communicationSpawnSpecs ?? [],
      ),
    )
  );
}

function normalizeSpawnSpecInputs(
  specs: ManagedTaskSpawnSpecInput[],
): ManagedTaskSpawnSpecData[] {
  return specs.map(toSpawnSpecCreate).sort(compareSpecData);
}

function normalizeCommunicationSpawnSpecInputs(
  specs: ManagedTaskCommunicationSpawnSpecInput[],
): ManagedTaskCommunicationSpawnSpecData[] {
  return specs.map(toCommSpecCreate).sort(compareSpecData);
}

function normalizeSpawnSpecRows(
  rows: ManagedTaskSpawnSpecRow[],
): ManagedTaskSpawnSpecData[] {
  return rows
    .map((row) => ({
      kind: row.kind,
      isParent: row.isParent,
      sortOrder: row.sortOrder,
      titleTemplate: row.titleTemplate,
      descriptionTemplate: row.descriptionTemplate,
      impactStatementTemplate: row.impactStatementTemplate ?? null,
      roleTitleTemplate: row.roleTitleTemplate ?? null,
      category: row.category,
      estimatedEffortHours: row.estimatedEffortHours ?? null,
      dueDays: row.dueDays ?? null,
      availableInDays: row.availableInDays ?? null,
      deadlinePolicy: row.deadlinePolicy ?? null,
      claimPolicy: row.claimPolicy,
      isPublic: row.isPublic,
      skillTagTemplates: row.skillTagTemplates ?? [],
      interestTagTemplates: row.interestTagTemplates ?? [],
      actionLinkUrlTemplate: row.actionLinkUrlTemplate ?? null,
      actionLinkLabelTemplate: row.actionLinkLabelTemplate ?? null,
      actionLinkInstructionsTemplate:
        row.actionLinkInstructionsTemplate ?? null,
      creatorResolver: row.creatorResolver,
      assigneePersonResolver: row.assigneePersonResolver,
      assigneeOrganizationResolver: row.assigneeOrganizationResolver,
      parentResolver: row.parentResolver,
      contributesToGate: row.contributesToGate,
      metadata: row.metadata ?? null,
    }))
    .sort(compareSpecData);
}

function normalizeCommunicationSpawnSpecRows(
  rows: ManagedTaskCommunicationSpawnSpecRow[],
): ManagedTaskCommunicationSpawnSpecData[] {
  return rows
    .map((row) => ({
      kind: row.kind,
      sortOrder: row.sortOrder,
      subjectTemplate: row.subjectTemplate,
      bodyTextTemplate: row.bodyTextTemplate,
      bodyHtmlTemplate: row.bodyHtmlTemplate ?? null,
      commentTemplate: row.commentTemplate ?? null,
      channel: row.channel,
      audienceResolver: row.audienceResolver,
      purpose: row.purpose,
      emailScope: row.emailScope ?? null,
      dedupeKeyTemplate: row.dedupeKeyTemplate,
      minHoursBetweenSends: row.minHoursBetweenSends,
      maxSendsPerTask: row.maxSendsPerTask,
      minSendCount: row.minSendCount,
      maxSendCount: row.maxSendCount ?? null,
      metadata: row.metadata ?? null,
    }))
    .sort(compareSpecData);
}

function compareSpecData(a: { kind: string }, b: { kind: string }) {
  return a.kind.localeCompare(b.kind);
}

function stableJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableJson);
  }

  if (value === Prisma.JsonNull) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return Object.fromEntries(
      entries.map(([key, nested]) => [key, stableJson(nested)]),
    );
  }

  return value ?? null;
}

function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(stableJson(a)) === JSON.stringify(stableJson(b));
}
