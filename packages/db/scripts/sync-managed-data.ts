import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { loadDatabaseUrl } from "../src/db-cli.js";
import {
  formatManagedDataResult,
  syncManagedData,
} from "../src/managed-data/index.js";

function parseArgs(argv: string[]) {
  const apply = argv.includes("--apply");
  const dryRun = argv.includes("--dry-run");

  if (apply && dryRun) {
    throw new Error("Use either --apply or --dry-run, not both.");
  }

  return {
    apply,
    mode: apply ? "apply" : "dry-run",
  };
}

function isLocalDatabaseHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "postgres"
  );
}

function assertRemoteApplyIsIntentional(connectionString: string, apply: boolean) {
  if (!apply) return;

  const url = new URL(connectionString);
  if (isLocalDatabaseHost(url.hostname)) return;
  if (process.env.MANAGED_DATA_ALLOW_REMOTE_APPLY === "1") return;

  throw new Error(
    [
      `Refusing local managed-data --apply against remote database host ${url.host}.`,
      "Run --dry-run first, then set MANAGED_DATA_ALLOW_REMOTE_APPLY=1 only if this is intentional.",
    ].join(" "),
  );
}

const { apply, mode } = parseArgs(process.argv.slice(2));
const connectionString = loadDatabaseUrl();
assertRemoteApplyIsIntentional(connectionString, apply);
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

try {
  const result = await syncManagedData(prisma, { apply });
  console.log(formatManagedDataResult(result));
  if (!apply) {
    console.log(`\n${mode} only. Re-run with --apply to write these changes.`);
  }
} catch (error) {
  console.error("Managed data sync failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
