import type { CreateTaskTriggerInput } from "../admin";
import { HUMANITY_MANAGEMENT } from "@/lib/messaging";
import { ROUTES } from "@/lib/routes";
import {
  REFERRAL_INVITATION_TASK_KEY_PREFIX,
  SIGNER_REMINDER_TASK_KEY_PREFIX,
  TREATY_PARENT_TASK_KEY,
  TREATY_SIGNER_TASK_KEY_PREFIX,
  USER_TREATY_TASK_KEY_PREFIX,
} from "@/lib/tasks/task-keys";

// ---------------------------------------------------------------------------
// Pattern 1+2 — Per-user onboarding tree (1% Treaty)
// ---------------------------------------------------------------------------
const USER_TREATY_TASK_TITLE =
  "Get {{params.majorityHumanity}} people to vote on the 1% Treaty";
const USER_TREATY_TASK_ROLE_TITLE =
  "Humanity Manager, Earth Optimization Services, LLC";
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
  "You have been promoted to **Humanity Manager** at Earth Optimization Services, LLC.",
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
  "Humanity has enough nuclear mass-murder capacity for about {{params.apocalypseCount}} apocalypses. The 1% Treaty asks you to sacrifice one of those apocalypses for disease eradication in your lifetime.",
  "",
  "Voting takes thirty seconds. Open the link I'm about to send you, vote yes, then call {{params.propagationAsksPerHuman}} humans you love and read them this same paragraph. That's the whole ask. I do this with you, you do this with {{params.propagationAsksPerHuman}} more, after {{params.doublingRoundsToTarget}} rounds we've reached {{params.majorityHumanity}} humans.\"",
  "",
  "---",
  "",
  "Mark this task done after you've made the call AND actually sent your referral URL. The receiving end finishes when assigned humans vote — that's tracked separately by the {{params.directHumanAssignments}} assign-a-human subtasks below.",
].join("\n");

const userOnboardingTreaty: CreateTaskTriggerInput = {
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
      difficulty: "TRIVIAL",
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
      difficulty: "TRIVIAL",
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
      difficulty: "TRIVIAL",
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
      difficulty: "TRIVIAL",
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
      difficulty: "TRIVIAL",
      estimatedEffortHours: 0.01,
      dueDays: 0,
      creatorResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "trigger.parentSpec",
      // Relative path. The middleware (getSiteRouteDisposition) redirects
      // users on a variant without /treaty to the canonical War on Disease
      // origin automatically. See getSiteRouteRedirect in lib/site.ts.
      actionLinkUrlTemplate: ROUTES.treaty,
      actionLinkLabelTemplate: "Sign the treaty",
      contributesToGate: true,
    },
    {
      kind: "phoneScript",
      sortOrder: 40,
      titleTemplate: HUMANITY_MANAGEMENT.callOneHumanTaskTitle,
      descriptionTemplate: PHONE_SCRIPT_DESCRIPTION,
      category: "OTHER",
      difficulty: "TRIVIAL",
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
      difficulty: "TRIVIAL",
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

const referralVoteInvitation: CreateTaskTriggerInput = {
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
      difficulty: "TRIVIAL",
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

const treatySignerReminder: CreateTaskTriggerInput = {
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
      difficulty: "TRIVIAL",
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

const treatyRatify: CreateTaskTriggerInput = {
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
      difficulty: "ADVANCED",
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

const hmtVerifyGate: CreateTaskTriggerInput = {
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

const treatySignerPerSlot: CreateTaskTriggerInput = {
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
      difficulty: "INTERMEDIATE",
      claimPolicy: "OPEN_MANY",
      isPublic: true,
      creatorResolver: "system",
      parentResolver: `fixed:${TREATY_PARENT_TASK_KEY}`,
      // Relative path. The middleware (getSiteRouteDisposition) redirects
      // users on a variant without /treaty to the canonical War on Disease
      // origin automatically. See getSiteRouteRedirect in lib/site.ts.
      actionLinkUrlTemplate: ROUTES.treaty,
      actionLinkLabelTemplate: "Sign the treaty",
    },
  ],
};

// ---------------------------------------------------------------------------
// Pattern 9 — Generic overdue reminder, kept as a TEMPLATE BUT DISABLED.
// ---------------------------------------------------------------------------
// A generic "every overdue task gets a reminder" trigger is dangerous: the
// copy can't fit every task family, and the audience may not even be the user
// you want to nag. Concretely, this trigger as a global rule would:
//   - email heads of state (signer tasks) treaty-flavored guilt copy
//   - duplicate the named-recipient Sequence A1-A4 for referral invitations
//   - duplicate user-onboarding:treaty:wishonia-nudge on the HMT root
//   - apply an Earth-flavored reminder to future PERS / admin tasks where it doesn't fit
//
// The right pattern is one overdue trigger PER task family, each with its own
// eventFilter scoping to that family's taskKey pattern and its own appropriate
// copy + audience. This entry stays as a documented template; enable it only
// if you genuinely want a catch-all reminder, and add an eventFilter first.
// Keeping the disabled tombstone in the seed also keeps any existing database
// row disabled on deploy.

const overdueReminderCron: CreateTaskTriggerInput = {
  triggerKey: "task:overdue-reminder",
  eventName: "cron.run-due-triggers",
  triggerKind: "spawnCommunication",
  enabled: false,
  schedule: "30 * * * *",
  iterationSource: "overdue-tasks",
  idempotencyKeyTemplate: "task-overdue-reminder:{{task.id}}",
  notes:
    "DISABLED. Catch-all overdue reminder template. Don't enable globally — copy + audience won't fit every task family. Clone with an eventFilter scoping to a specific taskKey pattern instead (see user-onboarding:treaty:wishonia-nudge).",
  communicationSpawnSpecs: [
    {
      kind: "overdue-reminder",
      sortOrder: 0,
      subjectTemplate: "Task overdue: {{task.title}}",
      // No Wishonia signature in the body — the resend.ts send helpers
      // append the canonical signature (with random title + tagline + sprite
      // avatar) to every outgoing email. Embedding a signature here would
      // double-sign.
      bodyTextTemplate:
        "This task is overdue: {{task.title}}.\n\nPlease mark it complete or post a status update.",
      commentTemplate:
        "This task is overdue.\n\nPlease mark it complete or post a status update.",
      channel: "EMAIL",
      audienceResolver: "ASSIGNEE",
      purpose: "REMINDER",
      emailScope: "task-reminders",
      dedupeKeyTemplate: "task-overdue-reminder:{{task.id}}",
      minHoursBetweenSends: 24,
      maxSendsPerTask: 5,
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
export const ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS: CreateTaskTriggerInput[] = [
  userOnboardingTreaty,
  referralVoteInvitation,
  treatySignerReminder,
  treatyRatify,
  hmtVerifyGate,
  treatySignerPerSlot,
  overdueReminderCron,
];
