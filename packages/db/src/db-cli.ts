import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

export type DbCliMode = "query" | "execute";

export interface DbCliArgs {
  mode: DbCliMode;
  sqlArg: string | null;
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoEnvPath = resolve(currentDir, "../../../.env");
const packageEnvPath = resolve(currentDir, "../.env");
export const DEFAULT_LOCAL_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/optimitron";
const LOCAL_DATABASE_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export function parseEnvFile(content: string): Record<string, string> {
  const entries: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

export function applyEnvEntries(
  target: Record<string, string | undefined>,
  entries: Record<string, string>,
  override: boolean,
): void {
  for (const [key, value] of Object.entries(entries)) {
    if (!override && target[key] !== undefined) continue;
    target[key] = value;
  }
}

export function resolveDatabaseUrl(
  baseEnv: Record<string, string | undefined>,
  repoEnvEntries: Record<string, string>,
  packageEnvEntries: Record<string, string>,
): string {
  const mergedEnv = { ...baseEnv };
  applyEnvEntries(mergedEnv, repoEnvEntries, false);
  applyEnvEntries(mergedEnv, packageEnvEntries, true);

  const databaseUrl = mergedEnv["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Checked process.env, ../../.env, and ../.env.",
    );
  }

  return databaseUrl;
}

export function assertSafeLocalTestDatabaseUrl(databaseUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("Test DATABASE_URL is not a valid URL.");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error(
      `Refusing to run DB tests against unsupported protocol ${parsed.protocol}.`,
    );
  }

  if (!LOCAL_DATABASE_HOSTNAMES.has(parsed.hostname)) {
    throw new Error(
      `Refusing to run DB tests against non-local database host "${parsed.hostname}".`,
    );
  }

  return databaseUrl;
}

export function loadDatabaseUrl(): string {
  const repoEnvEntries = existsSync(repoEnvPath)
    ? parseEnvFile(readFileSync(repoEnvPath, "utf8"))
    : {};
  const packageEnvEntries = existsSync(packageEnvPath)
    ? parseEnvFile(readFileSync(packageEnvPath, "utf8"))
    : {};

  return resolveDatabaseUrl(
    process.env as Record<string, string | undefined>,
    repoEnvEntries,
    packageEnvEntries,
  );
}

export function parseDbCliArgs(argv: string[]): DbCliArgs {
  const normalizedArgv = argv[0] === "--" ? argv.slice(1) : argv;
  const [mode, ...sqlParts] = normalizedArgv;

  if (mode !== "query" && mode !== "execute") {
    throw new Error(
      'Usage: pnpm db:cli -- <query|execute> "<sql>"\nPass SQL via stdin by omitting the "<sql>" argument.',
    );
  }

  return {
    mode,
    sqlArg: sqlParts.length > 0 ? sqlParts.join(" ").trim() : null,
  };
}

export async function readSqlText(sqlArg: string | null): Promise<string> {
  if (sqlArg?.trim()) return sqlArg.trim();

  const stdinChunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    if (Buffer.isBuffer(chunk)) {
      stdinChunks.push(chunk);
      continue;
    }
    if (typeof chunk === "string" || chunk instanceof Uint8Array) {
      stdinChunks.push(Buffer.from(chunk));
      continue;
    }
    stdinChunks.push(Buffer.from(String(chunk)));
  }

  const stdinSql = Buffer.concat(stdinChunks).toString("utf8").trim();
  if (stdinSql) return stdinSql;

  throw new Error("SQL is required. Provide it as an argument or pipe it via stdin.");
}

export function formatDbCliOutput(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, item: unknown) => (typeof item === "bigint" ? item.toString() : item),
    2,
  );
}

export async function runDbCli(argv: string[]): Promise<void> {
  const { mode, sqlArg } = parseDbCliArgs(argv);
  const sql = await readSqlText(sqlArg);
  const databaseUrl = loadDatabaseUrl();

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
    log: ["error"],
  });

  try {
    if (mode === "query") {
      const rows = await prisma.$queryRawUnsafe(sql);
      process.stdout.write(`${formatDbCliOutput(rows)}\n`);
      return;
    }

    const count = await prisma.$executeRawUnsafe(sql);
    process.stdout.write(`${formatDbCliOutput({ count })}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runDbCli(process.argv.slice(2)).catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unknown db-cli error";
    console.error(message);
    process.exit(1);
  });
}
