/**
 * Makes living/unknown represented-person health conditions private.
 *
 * Dry run:
 *   pnpm --filter @optimitron/web exec tsx scripts/backfill-private-living-represented-conditions.ts
 *
 * Apply locally:
 *   pnpm --filter @optimitron/web exec tsx scripts/backfill-private-living-represented-conditions.ts --apply
 *
 * Applying against a non-local database requires --allow-production and should
 * only happen after explicit human approval.
 */

import {
  PersonLifeStatus,
  ReferendumVoteSource,
  PrismaClient,
} from "@optimitron/db";
import { PrismaPg } from "@prisma/adapter-pg";

function makeBarePrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const url = new URL(databaseUrl);
  if (url.searchParams.get("sslmode") === "require") {
    url.searchParams.set("sslmode", "verify-full");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url.toString() }),
  });
}

function isLocalDatabase(databaseUrl: string): boolean {
  const host = new URL(databaseUrl).hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

const apply = process.argv.includes("--apply");
const allowProduction = process.argv.includes("--allow-production");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

if (apply && !allowProduction && !isLocalDatabase(databaseUrl)) {
  throw new Error(
    "Refusing to apply against a non-local database without --allow-production and explicit human approval.",
  );
}

const prisma = makeBarePrismaClient();

const where = {
  deletedAt: null,
  isPublic: true,
  person: {
    deletedAt: null,
    lifeStatus: {
      in: [PersonLifeStatus.LIVING, PersonLifeStatus.UNKNOWN],
    },
    referendumVotes: {
      some: {
        deletedAt: null,
        voteSource: ReferendumVoteSource.REPRESENTED,
      },
    },
  },
} as const;

async function main() {
  const [count, samples] = await Promise.all([
    prisma.personCondition.count({ where }),
    prisma.personCondition.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: {
        conditionName: true,
        id: true,
        person: { select: { displayName: true, id: true, lifeStatus: true } },
      },
      take: 10,
    }),
  ]);

  console.log(
    `[represented-condition-privacy] ${apply ? "apply" : "dry-run"} target count: ${count}`,
  );
  for (const sample of samples) {
    console.log(
      `[represented-condition-privacy] ${sample.id} ${sample.person.displayName} (${sample.person.lifeStatus}) - ${sample.conditionName}`,
    );
  }

  if (!apply) {
    console.log(
      "[represented-condition-privacy] dry run only. Re-run with --apply to update local rows.",
    );
    return;
  }

  const result = await prisma.personCondition.updateMany({
    where,
    data: { isPublic: false },
  });
  console.log(
    `[represented-condition-privacy] updated ${result.count} condition rows.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
