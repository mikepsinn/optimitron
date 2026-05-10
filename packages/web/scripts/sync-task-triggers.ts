/**
 * Idempotent managed-data sync for known TaskTrigger blueprints.
 *
 * Run locally:
 *   pnpm --filter @optimitron/web run sync:task-triggers -- --dry-run
 *
 * On deploy, run after `prisma migrate deploy`:
 *   pnpm --filter @optimitron/web run sync:task-triggers -- --apply
 *
 * Re-running is safe — every trigger is upserted by triggerKey.
 *
 * This script builds a bare PrismaClient against DATABASE_URL and passes it
 * into the trigger admin helpers, so deploy-time sync does not write through
 * the web app singleton client.
 */

import "./load-env";

import { PrismaClient } from "@optimitron/db";
import { PrismaPg } from "@prisma/adapter-pg";
import { ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS } from "../src/lib/triggers/blueprints/one-percent-treaty";
import { createTaskTrigger, updateTaskTrigger } from "../src/lib/triggers/admin";

function parseArgs(argv: string[]) {
  const args = argv.filter((arg) => arg !== "--");
  const allowed = new Set(["--apply", "--dry-run"]);
  const unknown = args.filter((arg) => !allowed.has(arg));
  if (unknown.length > 0) {
    throw new Error(`Unknown argument(s): ${unknown.join(", ")}`);
  }
  const apply = args.includes("--apply");
  const dryRun = args.includes("--dry-run");
  if (apply && dryRun) {
    throw new Error("Use either --apply or --dry-run, not both.");
  }
  return { apply, dryRun };
}

function makeBarePrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to sync task triggers.");
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
const { apply } = parseArgs(process.argv.slice(2));

async function main() {
  console.log(`[task-triggers] ${apply ? "apply" : "dry-run"}`);
  for (const trigger of ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS) {
    const existing = await prisma.taskTrigger.findUnique({
      where: { triggerKey: trigger.triggerKey },
    });
    if (!apply) {
      console.log(
        `[task-triggers] would ${existing ? "update" : "create"} ${trigger.triggerKey}`,
      );
      continue;
    }
    if (existing) {
      await updateTaskTrigger(trigger, { actorUserId: null }, prisma);
      console.log(`[task-triggers] updated ${trigger.triggerKey}`);
    } else {
      await createTaskTrigger(trigger, { actorUserId: null }, prisma);
      console.log(`[task-triggers] created ${trigger.triggerKey}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
