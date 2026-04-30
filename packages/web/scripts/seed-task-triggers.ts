/**
 * Idempotent seeder for the TaskTrigger blueprints that subsume hardcoded
 * task-spawn / task-verify / task-communication patterns.
 *
 * Run locally:
 *   pnpm --filter @optimitron/web exec tsx scripts/seed-task-triggers.ts
 *
 * On deploy, run after `prisma migrate deploy`:
 *   pnpm --filter @optimitron/web exec tsx scripts/seed-task-triggers.ts
 *
 * Re-running is safe — every trigger is upserted by triggerKey.
 *
 * The seed builds a bare PrismaClient against DATABASE_URL only — it
 * deliberately does NOT import @/lib/prisma so it doesn't drag in the
 * web app's full env validation (NEXTAUTH_SECRET, RESEND_*, etc.). This
 * lets the CI deploy step run with just DATABASE_URL set.
 */

import { PrismaClient } from "@optimitron/db";
import { PrismaPg } from "@prisma/adapter-pg";
import { createTaskTrigger, updateTaskTrigger } from "../src/lib/triggers/admin";
import type { CreateTaskTriggerInput } from "../src/lib/triggers/admin";

function makeBarePrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed task triggers.");
  }
  let connectionString = databaseUrl;
  // Mirror the sslmode swap in @/lib/prisma so we don't hit the pg v8
  // deprecation warning on prod-style connection strings.
  const url = new URL(connectionString);
  if (url.searchParams.get("sslmode") === "require") {
    url.searchParams.set("sslmode", "verify-full");
    connectionString = url.toString();
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

const prisma = makeBarePrismaClient();

// ---------------------------------------------------------------------------
// Pattern 1+2 — Per-user onboarding tree (1% Treaty)
// ---------------------------------------------------------------------------

const TREATY_PARENT_TASK_KEY = "program:one-percent-treaty:ratify";
const USER_TREATY_TASK_TITLE = "Get 4 billion people to vote on the 1% Treaty";
const USER_TREATY_TASK_ROLE_TITLE = "Humanity Manager, Earth Optimization Services, LLC";
const HUMANITY_MANAGEMENT_TRAINING_TASK_TITLE = "Complete Humanity Management Training";

// Per-user HMT root description = the Promotion content from
// docs/questions.md (lines 392-403, the Promotion screen). The live
// "Performance to date" counter from the screen is omitted — it doesn't
// translate to a static task body. Compensation numbers come from
// {{params.healthYearsGain}} (TREATY_HALE_GAIN_YEAR_15 → 21.7) and
// {{params.lifetimeIncomeGain}} (TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA → $3.48M).
const USER_TREATY_DESCRIPTION = [
  "🎉 **CONGRATULATIONS**",
  "",
  "You have been promoted to **Humanity Manager** at Earth Optimization Services, LLC.",
  "",
  "**Direct reports:** ~8 billion humans",
  "**Primary KPI:** Hours of human suffering prevented per week",
  "**Compensation:**",
  "- ~**{{params.healthYearsGain}}** extra years of healthy life",
  "- ~**{{params.lifetimeIncomeGain}}** additional lifetime income",
  "- Vesting: contingent on treaty passage. Forfeited on dismissal.",
].join("\n");

// Phone script — uses {{params.*}} tokens for canonical numbers so the
// rendered copy stays in sync when the parameter source updates.
//   {{params.militaryVsResearchRatio}} → 604 (military vs gov clinical trials)
//   {{params.statusQuoYears}}          → 443 (queue clearance, status quo)
//   {{params.dfdaYears}}               → 36  (queue clearance, dFDA)
const PHONE_SCRIPT_DESCRIPTION = [
  "Your job is to manage 8 billion humans. You're busy. Outsource it.",
  "",
  "The trick: call two friends you actually like. Read them the script below. They each call two friends. After 32 rounds of this, four billion humans are reached. Tom Sawyer painting the fence — you don't have to convince anyone of anything they don't already believe, you just have to ask them to make two calls.",
  "",
  "Could be 30 minutes of nice phone calls with people who love you. If they actually do it.",
  "",
  "---",
  "",
  "Script (read out loud, edit to taste):",
  "",
  "\"Hey [friend]. Quick favor.",
  "",
  "Humans spend {{params.militaryVsResearchRatio}} times more on weapons than on testing which medicines work. There's a treaty — the 1% Treaty — that redirects 1% of military spending into pragmatic clinical trials. Sixty million humans die every year, mostly from things we already know how to fix. The treaty would shorten the time to disease eradication from about {{params.statusQuoYears}} years to about {{params.dfdaYears}}.",
  "",
  "We have enough money on this planet for roughly twelve apocalypses. The 1% Treaty asks you to sacrifice one of those apocalypses for disease eradication in your lifetime.",
  "",
  "Voting takes thirty seconds. Open the link I'm about to send you, vote yes, then call two friends and read them this same paragraph. That's the whole ask. I do this with you, you do this with two more, after 32 rounds we've reached four billion humans.\"",
  "",
  "---",
  "",
  "Mark this task done after you've made two calls AND actually sent your referral URL to both of them. The receiving end finishes when those friends vote — that's tracked separately by the two assign-a-human subtasks below.",
].join("\n");

const userOnboardingTreaty: CreateTaskTriggerInput = {
  triggerKey: "user-onboarding:treaty",
  eventName: "user.signup",
  triggerKind: "spawnTasks",
  enabled: true,
  idempotencyKeyTemplate: "program:one-percent-treaty:user:{{user.id}}",
  notes:
    "Per-user onboarding tree spawned at signup. Layered alongside the legacy USER_TREATY_SUBTASKS path; both upsert by taskKey so they converge on the same rows. The parent root has no completionGate of its own — the HMT auto-verify lives in the separate user-onboarding:treaty:hmt-gate trigger which targets the completeTraining sibling.",
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
      dueDays: 7,
      claimPolicy: "ASSIGNED_ONLY",
      isPublic: false,
      ownerResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: `fixed:${TREATY_PARENT_TASK_KEY}`,
    },
    {
      kind: "shareReferralUrl",
      sortOrder: 0,
      titleTemplate: "Share your 1% Treaty referral URL",
      descriptionTemplate:
        "Copy or post your referral URL so anyone who votes through it is attributed to your treaty-vote lineage.",
      category: "OTHER",
      difficulty: "TRIVIAL",
      estimatedEffortHours: 0.02,
      ownerResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "trigger.parentSpec",
      contributesToGate: true,
    },
    {
      kind: "phoneScript",
      sortOrder: 5,
      titleTemplate: "Make two phone calls. Outsource humanity management.",
      descriptionTemplate: PHONE_SCRIPT_DESCRIPTION,
      category: "OTHER",
      difficulty: "TRIVIAL",
      estimatedEffortHours: 0.5,
      ownerResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "trigger.parentSpec",
      contributesToGate: true,
    },
    {
      kind: "assignFirstHuman",
      sortOrder: 10,
      titleTemplate: "Give your first human the 1% Treaty voting task",
      descriptionTemplate:
        "Create one named invitation and actually contact that person with their voting task. If they vote, they get promoted too.",
      category: "OTHER",
      difficulty: "TRIVIAL",
      estimatedEffortHours: 0.1,
      ownerResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "trigger.parentSpec",
      contributesToGate: true,
    },
    {
      kind: "assignSecondHuman",
      sortOrder: 20,
      titleTemplate: "Give your second human the 1% Treaty voting task",
      descriptionTemplate:
        "Create a second named invitation and actually contact that person with their voting task. If they vote, they get promoted too.",
      category: "OTHER",
      difficulty: "TRIVIAL",
      estimatedEffortHours: 0.1,
      ownerResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "trigger.parentSpec",
      contributesToGate: true,
    },
    {
      kind: "completeTraining",
      sortOrder: 30,
      titleTemplate: HUMANITY_MANAGEMENT_TRAINING_TASK_TITLE,
      descriptionTemplate:
        "Finish the launch sequence: share your referral URL, give two named humans their voting tasks, and let the referral graph trace what happens next.",
      category: "OTHER",
      difficulty: "TRIVIAL",
      estimatedEffortHours: 0.25,
      ownerResolver: "actor",
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
  idempotencyKeyTemplate: "program:one-percent-treaty:referral-invitation:{{inviteToken}}",
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
      ownerResolver: "actor",
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
  idempotencyKeyTemplate:
    "program:one-percent-treaty:reminder:{{signer.countryCode}}:{{user.id}}",
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
      ownerResolver: "actor",
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
      ownerResolver: "system",
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
  idempotencyKeyTemplate: "program:one-percent-treaty:user:{{user.id}}:completeTraining",
  eventFilter: {
    field: "task.taskKey",
    matches: "^program:one-percent-treaty:user:.+:(shareReferralUrl|phoneScript|assignFirstHuman|assignSecondHuman)$",
  },
  completionGate: {
    kind: "allOf",
    inputScope: "siblings",
    subtaskKinds: ["shareReferralUrl", "phoneScript", "assignFirstHuman", "assignSecondHuman"],
    evidenceTemplate:
      "User shared their referral URL, made the phone call, and gave two named humans their 1% Treaty voting tasks.",
  },
  notes:
    "Auto-VERIFIES the user's completeTraining subtask when its siblings (share + phoneScript + invite1 + invite2) are VERIFIED.",
};

// ---------------------------------------------------------------------------
// Pattern 7+8 — Treaty signer per-slot (data-driven import)
// ---------------------------------------------------------------------------

const treatySignerPerSlot: CreateTaskTriggerInput = {
  triggerKey: "treaty:signer",
  eventName: "dataset.recordChanged.signer",
  triggerKind: "spawnTasks",
  idempotencyKeyTemplate: "program:one-percent-treaty:signer:{{slot.countryCode}}",
  notes:
    "Spawns one signer task per slot during the treaty-signer dataset import. Caller (sync-treaty-signers) iterates the dataset and fires this trigger per slot.",
  enabled: false,
  spawnSpecs: [
    {
      kind: "root",
      isParent: true,
      sortOrder: 0,
      titleTemplate: "{{slot.leaderName}} signs the 1% Treaty for {{slot.countryName}}",
      descriptionTemplate:
        "Convince {{slot.leaderName}} ({{slot.role}} of {{slot.countryName}}) to sign the 1% Treaty. Recipients of the assignee's signature: their citizens.",
      roleTitleTemplate: "{{slot.role}} of {{slot.countryName}}",
      category: "OTHER",
      difficulty: "INTERMEDIATE",
      claimPolicy: "OPEN_MANY",
      isPublic: true,
      ownerResolver: "system",
      parentResolver: `fixed:${TREATY_PARENT_TASK_KEY}`,
      actionLinkUrlTemplate: "https://1percenttreaty.org/treaty",
      actionLinkLabelTemplate: "Sign the treaty",
    },
  ],
};

// ---------------------------------------------------------------------------
// Pattern 9 — Generic overdue reminder, kept as a TEMPLATE BUT DISABLED.
// ---------------------------------------------------------------------------
// A generic "every overdue task gets a reminder" trigger is dangerous: the
// copy can't fit every task family, and the audience may not even be the
// user you want to nag. Concretely, this trigger as a global rule would:
//   - email heads of state (signer tasks) treaty-flavored guilt copy
//   - duplicate the named-recipient Sequence A1-A4 for referral invitations
//   - duplicate user-onboarding:treaty:wishonia-nudge on the HMT root
//   - apply an Earth-flavored reminder to future PERS / admin tasks where
//     it doesn't fit
//
// The right pattern is one overdue trigger PER task family, each with its
// own eventFilter scoping to that family's taskKey pattern and its own
// appropriate copy + audience. This entry stays as a documented template;
// enable it only if you genuinely want a catch-all reminder, and add an
// eventFilter first.

const overdueReminderCron: CreateTaskTriggerInput = {
  triggerKey: "task:overdue-reminder",
  eventName: "cron.run-due-triggers",
  triggerKind: "spawnCommunication",
  enabled: false, // see header — opt-in only with a scoping eventFilter
  schedule: "30 * * * *",
  iterationSource: "overdue-tasks",
  idempotencyKeyTemplate: "task-overdue-reminder:{{task.id}}",
  notes:
    "DISABLED. Catch-all overdue reminder template. Don't enable globally — copy + audience won't fit every task family. Clone with an eventFilter scoping to a specific taskKey pattern instead (see user-onboarding:treaty:wishonia-nudge).",
  communicationSpawnSpecs: [
    {
      kind: "overdue-reminder",
      sortOrder: 0,
      subjectTemplate: "Reminder: {{task.title}}",
      bodyTextTemplate:
        "Your task '{{task.title}}' is past its due date. Earth's median life expectancy is not going to optimize itself.\n\n{{params.wishoniaSignature}}",
      commentTemplate:
        "Automated overdue reminder.\n\n{{params.wishoniaSignature}}",
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

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------
//
// Note on Wishonia nudges: the framework now supports per-trigger schedules,
// iterationSource queries, and per-spec sendCount-range escalation — see
// run-due-triggers route + minSendCount/maxSendCount on
// TaskCommunicationSpawnSpec. We deliberately did NOT seed an escalating
// "Wishonia gets disappointed weekly" trigger because the email-deliverability
// cost (warondisease.org reputation, unsub burn-down) probably exceeds the
// completion uplift on passive signups. The HMT root task description IS the
// welcome and the nag; if a user comes back, they see the task. Email is
// reserved for transactional + asked-for signals (vote confirmation, friend
// voted, signer-signed-via-your-referral). Adding a nudge later is one
// trigger row + (optionally) a `suppressEmail` flag for comment-only mode.

const ALL_TRIGGERS: CreateTaskTriggerInput[] = [
  userOnboardingTreaty,
  referralVoteInvitation,
  treatySignerReminder,
  treatyRatify,
  hmtVerifyGate,
  treatySignerPerSlot,
  overdueReminderCron,
];

async function main() {
  for (const t of ALL_TRIGGERS) {
    const existing = await prisma.taskTrigger.findUnique({ where: { triggerKey: t.triggerKey } });
    if (existing) {
      await updateTaskTrigger(t, { actorUserId: null }, prisma);
      console.log(`[task-triggers] updated ${t.triggerKey}`);
    } else {
      await createTaskTrigger(t, { actorUserId: null }, prisma);
      console.log(`[task-triggers] created ${t.triggerKey}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
