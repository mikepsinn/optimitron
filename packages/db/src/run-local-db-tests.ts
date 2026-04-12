import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import {
  assertSafeLocalTestDatabaseUrl,
  DEFAULT_LOCAL_DATABASE_URL,
} from "./db-cli.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(currentDir, "..");
const repoRoot = resolve(currentDir, "../../..");

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): void {
  const result = spawnSync(command, args, {
    cwd,
    env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function getAdminDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.pathname = "/postgres";
  return url.toString();
}

function getDatabaseName(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  return decodeURIComponent(url.pathname.replace(/^\//u, "")) || "postgres";
}

function escapeIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function ensureDatabaseExists(databaseUrl: string): Promise<void> {
  const databaseName = getDatabaseName(databaseUrl);
  const adminPrisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: getAdminDatabaseUrl(databaseUrl) }),
    log: ["error"],
  });

  try {
    const rows = await adminPrisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(
        SELECT 1
        FROM pg_database
        WHERE datname = ${databaseName}
      ) AS "exists"
    `;

    if (!rows[0]?.exists) {
      await adminPrisma.$executeRawUnsafe(
        `CREATE DATABASE ${escapeIdentifier(databaseName)}`,
      );
    }
  } finally {
    await adminPrisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const databaseUrl = assertSafeLocalTestDatabaseUrl(
    process.env["OPTIMITRON_TEST_DATABASE_URL"] ?? DEFAULT_LOCAL_DATABASE_URL,
  );
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
  };

  process.stdout.write("Using local test database at postgresql://postgres:postgres@localhost:5432/optimitron\n");

  try {
    await ensureDatabaseExists(databaseUrl);
  } catch {
    runCommand("docker", ["compose", "up", "-d", "--wait", "postgres"], repoRoot, env);
    await ensureDatabaseExists(databaseUrl);
  }

  runCommand("pnpm", ["run", "prisma:migrate:deploy"], packageRoot, env);
  runCommand("pnpm", ["exec", "vitest", "run", "src/__tests__/seed.integration.test.ts"], packageRoot, env);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown DB test error";
  console.error(message);
  process.exit(1);
});
