/**
 * Survey and (optionally) delete test data left over from Playwright e2e
 * runs and demo seeds.
 *
 * Test signal: rows whose canonical email ends in "@example.test".
 * That single pattern catches Playwright fixtures (`pw-*@example.test`),
 * the demo seed (`one-human@example.test`), and everything in between.
 *
 *   pnpm --filter @optimitron/db db:test-data            # dry-run summary
 *   pnpm --filter @optimitron/db db:test-data --execute  # actually delete
 *   pnpm --filter @optimitron/db db:test-data --json     # JSON output
 *   pnpm --filter @optimitron/db db:test-data --pattern '%@example.test' \
 *                                              --pattern '%@playwright.test'
 *
 * Deletion order respects foreign keys:
 *   1. Tasks assigned to test Persons (Task children CASCADE).
 *   2. Users with a test email (CASCADEs Account/Session/TaskClaim/etc.).
 *   3. Persons with a test email (CASCADEs ReferendumVote/Subject/etc.).
 *
 * Wrapped in a transaction; aborts cleanly if any step fails.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { loadDatabaseUrl } from "./db-cli.js";

const DEFAULT_PATTERNS = ["%@example.test"];

interface CliOptions {
  execute: boolean;
  json: boolean;
  patterns: string[];
}

export function parseArgs(argv: string[]): CliOptions {
  const normalized = argv[0] === "--" ? argv.slice(1) : argv;
  const options: CliOptions = { execute: false, json: false, patterns: [] };

  for (let i = 0; i < normalized.length; i += 1) {
    const arg = normalized[i];
    if (arg === "--execute") {
      options.execute = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--pattern") {
      const next = normalized[i + 1];
      if (!next || next.startsWith("-")) {
        throw new Error("--pattern requires a value");
      }
      options.patterns.push(next);
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(usage());
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.patterns.length === 0) {
    options.patterns = [...DEFAULT_PATTERNS];
  }
  return options;
}

function usage(): string {
  return [
    "Usage: pnpm --filter @optimitron/db db:test-data [--execute] [--json] [--pattern <like>]",
    "",
    "  --execute         Delete the matched rows (default is dry-run).",
    "  --json            Emit machine-readable JSON instead of a report.",
    "  --pattern <like>  SQL LIKE pattern matched against User.email and",
    "                    Person.email. Repeatable. Defaults to %@example.test.",
    "",
  ].join("\n");
}

interface SurveyCounts {
  testPersons: number;
  testUsers: number;
  tasksAssignedToTestPersons: number;
  taskClaimsByTestUsers: number;
  taskCommentsByTestPersons: number;
  taskCommentsByTestUsers: number;
  referendumVotesByTestPersons: number;
  referendumVotesByTestUsers: number;
  organizationMembershipsByTestUsers: number;
  notificationsForTestUsers: number;
  emailLogsForTestUsers: number;
  referralInvitationsByTestUsers: number;
  shareAttemptsByTestUsers: number;
}

interface SurveySamples {
  persons: Array<{ id: string; displayName: string; email: string | null }>;
  users: Array<{ id: string; email: string | null }>;
  tasks: Array<{ id: string; title: string; taskKey: string | null }>;
}

interface Survey {
  patterns: string[];
  counts: SurveyCounts;
  samples: SurveySamples;
}

async function survey(prisma: PrismaClient, patterns: string[]): Promise<Survey> {
  const personEmailMatch = (alias: string) =>
    patterns.map((_, i) => `${alias}.email ILIKE $${i + 1}`).join(" OR ");

  const matchPerson = personEmailMatch("p");
  const matchUser = personEmailMatch("u");
  const params = patterns;

  const [personIds, userIds] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "Person" p WHERE ${matchPerson}`,
      ...params,
    ),
    prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "User" u WHERE ${matchUser}`,
      ...params,
    ),
  ]);

  const personIdList = personIds.map((row) => row.id);
  const userIdList = userIds.map((row) => row.id);

  const [
    tasksAssigned,
    taskClaims,
    taskCommentsByPerson,
    taskCommentsByUser,
    referendumVotesByPerson,
    referendumVotesByUser,
    orgMembers,
    notifications,
    emailLogs,
    referralInvites,
    shareAttempts,
    samplePersons,
    sampleUsers,
    sampleTasks,
  ] = await Promise.all([
    countWhereIn(prisma, "Task", "assigneePersonId", personIdList),
    countWhereIn(prisma, "TaskClaim", "userId", userIdList),
    countWhereIn(prisma, "TaskComment", "authorPersonId", personIdList),
    countWhereIn(prisma, "TaskComment", "authorUserId", userIdList),
    countWhereIn(prisma, "ReferendumVote", "personId", personIdList),
    countWhereIn(prisma, "ReferendumVote", "userId", userIdList),
    countWhereIn(prisma, "OrganizationMember", "userId", userIdList),
    countWhereIn(prisma, "Notification", "userId", userIdList),
    countWhereIn(prisma, "EmailLog", "userId", userIdList),
    countWhereIn(prisma, "ReferralInvitation", "referrerUserId", userIdList),
    countWhereIn(prisma, "ShareAttempt", "userId", userIdList),
    prisma.$queryRawUnsafe<
      Array<{ id: string; displayName: string; email: string | null }>
    >(
      `SELECT id, "displayName", email FROM "Person" p WHERE ${matchPerson}
       ORDER BY "displayName" LIMIT 10`,
      ...params,
    ),
    prisma.$queryRawUnsafe<Array<{ id: string; email: string | null }>>(
      `SELECT id, email FROM "User" u WHERE ${matchUser}
       ORDER BY email LIMIT 10`,
      ...params,
    ),
    sampleTasksAssigned(prisma, personIdList),
  ]);

  return {
    patterns,
    counts: {
      testPersons: personIdList.length,
      testUsers: userIdList.length,
      tasksAssignedToTestPersons: tasksAssigned,
      taskClaimsByTestUsers: taskClaims,
      taskCommentsByTestPersons: taskCommentsByPerson,
      taskCommentsByTestUsers: taskCommentsByUser,
      referendumVotesByTestPersons: referendumVotesByPerson,
      referendumVotesByTestUsers: referendumVotesByUser,
      organizationMembershipsByTestUsers: orgMembers,
      notificationsForTestUsers: notifications,
      emailLogsForTestUsers: emailLogs,
      referralInvitationsByTestUsers: referralInvites,
      shareAttemptsByTestUsers: shareAttempts,
    },
    samples: {
      persons: samplePersons,
      users: sampleUsers,
      tasks: sampleTasks,
    },
  };
}

async function countWhereIn(
  prisma: PrismaClient,
  table: string,
  column: string,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
  const sql = `SELECT COUNT(*)::int AS n FROM "${table}" WHERE "${column}" IN (${placeholders})`;
  const rows = await prisma.$queryRawUnsafe<Array<{ n: number }>>(sql, ...ids);
  return rows[0]?.n ?? 0;
}

async function sampleTasksAssigned(
  prisma: PrismaClient,
  personIds: string[],
): Promise<Array<{ id: string; title: string; taskKey: string | null }>> {
  if (personIds.length === 0) return [];
  const placeholders = personIds.map((_, i) => `$${i + 1}`).join(",");
  return prisma.$queryRawUnsafe<
    Array<{ id: string; title: string; taskKey: string | null }>
  >(
    `SELECT id, title, "taskKey" FROM "Task"
     WHERE "assigneePersonId" IN (${placeholders})
     ORDER BY "createdAt" DESC LIMIT 10`,
    ...personIds,
  );
}

async function deleteTestData(
  prisma: PrismaClient,
  patterns: string[],
): Promise<{
  tasksDeleted: number;
  usersDeleted: number;
  personsDeleted: number;
}> {
  const matchPerson = patterns.map((_, i) => `email ILIKE $${i + 1}`).join(" OR ");
  const matchUser = matchPerson;

  return prisma.$transaction(async (tx) => {
    const tasksDeleted = await tx.$executeRawUnsafe(
      `DELETE FROM "Task" WHERE "assigneePersonId" IN (
         SELECT id FROM "Person" WHERE ${matchPerson}
       )`,
      ...patterns,
    );
    const usersDeleted = await tx.$executeRawUnsafe(
      `DELETE FROM "User" WHERE ${matchUser}`,
      ...patterns,
    );
    const personsDeleted = await tx.$executeRawUnsafe(
      `DELETE FROM "Person" WHERE ${matchPerson}`,
      ...patterns,
    );
    return { tasksDeleted, usersDeleted, personsDeleted };
  });
}

function renderReport(s: Survey, executed: boolean): string {
  const lines: string[] = [];
  lines.push(executed ? "Test data cleanup — EXECUTED" : "Test data cleanup — DRY RUN");
  lines.push(`Patterns: ${s.patterns.join(", ")}`);
  lines.push("");
  lines.push("Targets");
  lines.push(`  Test persons:                       ${s.counts.testPersons}`);
  lines.push(`  Test users:                         ${s.counts.testUsers}`);
  lines.push(`  Tasks assigned to test persons:     ${s.counts.tasksAssignedToTestPersons}`);
  lines.push("");
  lines.push("Cascade casualties (sample — every FK with ON DELETE CASCADE applies)");
  lines.push(`  TaskClaim rows by test users:       ${s.counts.taskClaimsByTestUsers}`);
  lines.push(`  TaskComments by test persons:       ${s.counts.taskCommentsByTestPersons}`);
  lines.push(`  TaskComments by test users:         ${s.counts.taskCommentsByTestUsers}`);
  lines.push(`  ReferendumVotes by test persons:    ${s.counts.referendumVotesByTestPersons}`);
  lines.push(`  ReferendumVotes by test users:      ${s.counts.referendumVotesByTestUsers}`);
  lines.push(`  OrganizationMembers (test users):   ${s.counts.organizationMembershipsByTestUsers}`);
  lines.push(`  Notifications (test users):         ${s.counts.notificationsForTestUsers}`);
  lines.push(`  EmailLogs (test users):             ${s.counts.emailLogsForTestUsers}`);
  lines.push(`  ReferralInvitations (test users):   ${s.counts.referralInvitationsByTestUsers}`);
  lines.push(`  ShareAttempts (test users):         ${s.counts.shareAttemptsByTestUsers}`);
  lines.push("");
  if (s.samples.persons.length > 0) {
    lines.push("Sample persons:");
    for (const p of s.samples.persons) {
      lines.push(`  ${p.id}  ${truncate(p.displayName, 40)}  ${p.email ?? ""}`);
    }
    lines.push("");
  }
  if (s.samples.users.length > 0) {
    lines.push("Sample users:");
    for (const u of s.samples.users) {
      lines.push(`  ${u.id}  ${u.email ?? ""}`);
    }
    lines.push("");
  }
  if (s.samples.tasks.length > 0) {
    lines.push("Sample tasks:");
    for (const t of s.samples.tasks) {
      lines.push(`  ${t.id}  ${truncate(t.title, 50)}  ${t.taskKey ?? ""}`);
    }
    lines.push("");
  }
  if (!executed) {
    lines.push("Dry run only. Pass --execute to delete.");
  }
  return `${lines.join("\n")}\n`;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text.padEnd(max, " ");
}

export async function runCleanup(argv: string[]): Promise<void> {
  const options = parseArgs(argv);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: loadDatabaseUrl() }),
    log: ["error"],
  });

  try {
    const before = await survey(prisma, options.patterns);

    if (!options.execute) {
      process.stdout.write(
        options.json
          ? `${JSON.stringify({ executed: false, ...before }, null, 2)}\n`
          : renderReport(before, false),
      );
      return;
    }

    const result = await deleteTestData(prisma, options.patterns);
    const after = await survey(prisma, options.patterns);

    if (options.json) {
      process.stdout.write(
        `${JSON.stringify(
          { executed: true, deleted: result, before: before.counts, after: after.counts },
          null,
          2,
        )}\n`,
      );
    } else {
      const out: string[] = [];
      out.push(renderReport(before, true));
      out.push("Deleted");
      out.push(`  Tasks:    ${result.tasksDeleted}`);
      out.push(`  Users:    ${result.usersDeleted}`);
      out.push(`  Persons:  ${result.personsDeleted}`);
      out.push("");
      out.push("Remaining matches");
      out.push(`  Test persons:  ${after.counts.testPersons}`);
      out.push(`  Test users:    ${after.counts.testUsers}`);
      out.push(`  Test tasks:    ${after.counts.tasksAssignedToTestPersons}`);
      out.push("");
      process.stdout.write(out.join("\n"));
    }
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectInvocation =
  typeof process.argv[1] === "string" &&
  process.argv[1].replace(/\\/g, "/").endsWith("/cleanup-test-data.ts");

if (isDirectInvocation) {
  runCleanup(process.argv.slice(2)).catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unknown cleanup-test-data error";
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
