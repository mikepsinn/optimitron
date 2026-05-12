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
 * This compatibility wrapper builds a bare PrismaClient against DATABASE_URL
 * and delegates to the canonical managed-data sync in @optimitron/db.
 */

import "./load-env";

import {
  formatManagedTaskTriggersResult,
  syncManagedTaskTriggers,
} from "@optimitron/db/managed-task-triggers";
import { PrismaClient } from "@optimitron/db";
import { PrismaPg } from "@prisma/adapter-pg";

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
  const result = await syncManagedTaskTriggers(prisma, { apply });
  console.log(formatManagedTaskTriggersResult(result));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
