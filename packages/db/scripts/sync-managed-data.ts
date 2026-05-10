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

const { apply, mode } = parseArgs(process.argv.slice(2));
const adapter = new PrismaPg({ connectionString: loadDatabaseUrl() });
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
