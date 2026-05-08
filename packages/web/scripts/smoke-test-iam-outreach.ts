import "./load-env";
import { OrgStatus, OrgType, TaskCategory, TaskDifficulty } from "@optimitron/db";
import { DFDA_TRIAL_CAPACITY_MULTIPLIER } from "@optimitron/data/parameters";
import { createOrganizationWithOwner } from "../src/lib/organization.server";
import { prisma } from "../src/lib/prisma";
import { WAR_ON_DISEASE_APOCALYPSE_DESCRIPTION } from "../src/lib/site";
import { createTask } from "../src/lib/tasks.server";

/**
 * One-shot smoke test for the foundation-outreach loop.
 *
 * Creates the *Institute for Accelerated Medicine* organization with logos
 * and a contact email, then creates an outreach task assigned to it
 * inviting them to join the International Campaign to End War and Disease.
 *
 * The web `createTask` helper auto-fires `notifyTaskAssigneeOfAssignment`
 * which sends the assignment email to the org's contactEmail. The From
 * line shows the creator's Person.displayName "via International Campaign
 * to End War and Disease" (per the from-line work shipped earlier this
 * session).
 *
 * Idempotent: looks up an existing IAM org by name first; reuses it
 * instead of creating duplicates. The task is keyed off a stable
 * taskKey so re-running the script doesn't fan out duplicate emails
 * (the email also has its own dedupeKey at the EmailLog layer).
 *
 * Usage:
 *   pnpm --filter @optimitron/web exec tsx scripts/smoke-test-iam-outreach.ts \
 *     --creator=m@thinkbynumbers.org --contact=m@thinkbynumbers.org
 *
 * Defaults to the user-memory canonical email when args are omitted so
 * the inbox where the email lands is the one running the test.
 */

interface Args {
  creatorEmail: string;
  orgContactEmail: string;
}

function parseArgs(argv: string[]): Args {
  const get = (name: string, fallback: string) => {
    const arg = argv.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split("=").slice(1).join("=") : fallback;
  };
  return {
    creatorEmail: get("creator", "m@thinkbynumbers.org"),
    orgContactEmail: get("contact", "m@thinkbynumbers.org"),
  };
}

async function main() {
  const { creatorEmail, orgContactEmail } = parseArgs(process.argv.slice(2));
  console.log("📧 Foundation-outreach smoke test");
  console.log(`   creator email:  ${creatorEmail}`);
  console.log(`   org contact:    ${orgContactEmail}`);

  const creator = await prisma.user.findUnique({
    where: { email: creatorEmail },
    select: { id: true, person: { select: { displayName: true } } },
  });
  if (!creator) {
    throw new Error(
      `No User row in destination DB for email ${creatorEmail}. Cannot attribute the task creation.`,
    );
  }
  console.log(
    `   creator userId: ${creator.id} (display: ${creator.person?.displayName ?? "(no Person)"})`,
  );

  // Find existing IAM org by name OR create. We check by name+deletedAt:null
  // before creating because createOrganizationWithOwner with rejectDuplicates:
  // false will happily create a second row with a slug suffix.
  let org = await prisma.organization.findFirst({
    where: {
      name: { equals: "Institute for Accelerated Medicine", mode: "insensitive" },
      deletedAt: null,
    },
    select: { id: true, name: true, slug: true, contactEmail: true },
  });

  if (org) {
    console.log(`   reusing existing org: ${org.id} (${org.slug})`);
    if (org.contactEmail !== orgContactEmail) {
      await prisma.organization.update({
        where: { id: org.id },
        data: { contactEmail: orgContactEmail },
      });
      console.log(`   updated contactEmail → ${orgContactEmail}`);
    }
  } else {
    const created = await createOrganizationWithOwner(
      {
        name: "Institute for Accelerated Medicine",
        type: OrgType.NONPROFIT,
        status: OrgStatus.APPROVED,
        website: "https://acceleratedmedicine.org",
        description:
          "Nonprofit accelerating clinical research to bring effective treatments to patients faster.",
        contactEmail: orgContactEmail,
        squareLogoUrl: "https://placehold.co/512x512/png?text=IAM",
        wordmarkLogoUrl:
          "https://placehold.co/1200x630/png?text=Institute+for+Accelerated+Medicine",
      },
      creator.id,
      { rejectDuplicates: false },
    );
    org = {
      id: created.id,
      name: created.name,
      slug: created.slug,
      contactEmail: created.contactEmail,
    };
    console.log(`   created org: ${org.id} (${org.slug})`);
  }

  const taskKey = `outreach:foundation-join:${org.id}`;
  const existing = await prisma.task.findUnique({
    where: { taskKey },
    select: { id: true, title: true, deletedAt: true },
  });
  if (existing && !existing.deletedAt) {
    console.log(
      `   task already exists (${existing.id}): "${existing.title}" — soft-deleting so re-run produces a fresh email.`,
    );
    await prisma.task.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        // Free the unique taskKey so the new create can claim it.
        taskKey: `${taskKey}:retired-${Date.now()}`,
      },
    });
  }

  // Single canonical thesis line + canonical trial-capacity number, both
  // sourced from the parameter manifest / site config so the email never
  // drifts from the rest of the campaign copy. One CTA — the /endorse
  // page already runs the member-count → modeled lives-saved calculator
  // and explains the trade in full, so the email is just the wedge.
  const trialMultiplier = DFDA_TRIAL_CAPACITY_MULTIPLIER.value.toFixed(1);
  const description = [
    `The International Campaign to End War and Disease asks the Institute for Accelerated Medicine to publicly support the 1% Treaty: every nation simultaneously redirects 1% of military spending to pragmatic clinical trials.`,
    "",
    WAR_ON_DISEASE_APOCALYPSE_DESCRIPTION,
    "",
    `That ${trialMultiplier}× speedup in clinical-trial throughput is the lever the Institute exists to pull.`,
    "",
    `This is non-partisan humanitarian treaty advocacy, in the precedent of the International Campaigns to Ban Landmines and to Abolish Nuclear Weapons (both Nobel Peace Prizes). No money. No candidate endorsement.`,
    "",
    `Join: https://warondisease.org/endorse`,
    "",
    "The page calculates the modeled lives saved and years of suffering prevented for the Institute's specific member count. Reply to this email with any questions or feedback.",
  ].join("\n");

  const task = await createTask(creator.id, {
    title: "Join the International Campaign to End War and Disease",
    description,
    category: TaskCategory.OUTREACH,
    difficulty: TaskDifficulty.BEGINNER,
    estimatedEffortHours: 1,
    interestTags: ["1% Treaty", "campaign join", "foundation outreach"],
    skillTags: ["nonprofit", "policy", "global health"],
    isPublic: false,
    assigneeOrganizationId: org.id,
    roleTitle: "Foundation lead",
    taskKey,
    impactStatement:
      "Each org joining brings members and signals to peer foundations, multiplying outreach.",
    contextJson: {
      cash_cost: 0,
      executor_type: "Self",
      expectedEconomicValueUsdBase: 100_000,
      successProbabilityBase: 0.05,
      timeToImpactStartDays: 30,
      sourceUrls: ["https://warondisease.org/endorse"],
    },
  });

  console.log(`\n✅ Task created: ${task.id}`);
  console.log(`   title:       ${task.title}`);
  console.log(`   taskKey:     ${taskKey}`);
  console.log(`   isPublic:    ${task.isPublic}`);
  console.log(`   assigneeOrg: ${org.id}`);
  console.log(
    `\n📧 Assignment email sent to ${orgContactEmail} via the existing notifyTaskAssigneeOfAssignment hook.`,
  );
  console.log(
    `   From line: "${creator.person?.displayName ?? "(no display name)"} via International Campaign to End War and Disease"`,
  );
  console.log(
    `   Reply-To:  reply+${task.id}@reply.warondisease.org (replies become comments on the task)`,
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
