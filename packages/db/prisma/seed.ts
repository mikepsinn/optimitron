import { PrismaPg } from "@prisma/adapter-pg";
import { pathToFileURL } from "node:url";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { loadDatabaseUrl } from "../src/db-cli.js";
import {
  formatManagedDataResult,
  syncManagedData,
} from "../src/managed-data/index.js";

function isLocalDatabaseHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "postgres"
  );
}

function assertRemoteSeedIsIntentional(connectionString: string) {
  const url = new URL(connectionString);
  if (isLocalDatabaseHost(url.hostname)) return;
  if (process.env.CI === "true") return;
  if (process.env.MANAGED_DATA_ALLOW_REMOTE_APPLY === "1") return;

  throw new Error(
    [
      `Refusing local managed seed against remote database host ${url.host}.`,
      "Run `pnpm db:sync:managed-data -- --dry-run` first, then set MANAGED_DATA_ALLOW_REMOTE_APPLY=1 only if this is intentional.",
    ].join(" "),
  );
}

export async function runManagedSeed() {
  const connectionString = loadDatabaseUrl();
  assertRemoteSeedIsIntentional(connectionString);

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const result = await syncManagedData(prisma, { apply: true });
    console.log(formatManagedDataResult(result));
  } finally {
    await prisma.$disconnect();
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  runManagedSeed().catch((error) => {
    console.error("Managed seed failed:");
    console.error(error);
    process.exit(1);
  });
}
