/**
 * Idempotent seeder for known TaskTrigger blueprints.
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
import { ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS } from "../src/lib/triggers/blueprints/one-percent-treaty";
import { createTaskTrigger, updateTaskTrigger } from "../src/lib/triggers/admin";

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

async function main() {
  for (const trigger of ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS) {
    const existing = await prisma.taskTrigger.findUnique({
      where: { triggerKey: trigger.triggerKey },
    });
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
