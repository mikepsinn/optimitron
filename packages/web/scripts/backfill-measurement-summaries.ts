import "./load-env";
import { pathToFileURL } from "url";
import { backfillMeasurementSummaries } from "../src/lib/measurement-summaries-backfill.server";
import { prisma } from "../src/lib/prisma";

/**
 * CLI wrapper around `backfillMeasurementSummaries`.
 *
 * Recomputes the cached measurement statistics on every GlobalVariable and
 * NOf1Variable so rows written through the MCP `recordMeasurement` path before
 * it refreshed summaries stop reporting stale numbers. Idempotent — see
 * `src/lib/measurement-summaries-backfill.server.ts` for the details.
 *
 * Run with:
 *   pnpm --dir packages/web tsx scripts/backfill-measurement-summaries.ts [--dry-run] [--batch=500]
 */

function parseArgs(argv: string[]) {
  const batchArg = argv.find((arg) => arg.startsWith("--batch="));
  const parsedBatch = batchArg ? Number(batchArg.split("=")[1]) : NaN;
  const batchSize =
    Number.isFinite(parsedBatch) && parsedBatch > 0
      ? Math.floor(parsedBatch)
      : 500;
  return {
    batchSize,
    dryRun: argv.includes("--dry-run"),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const label = options.dryRun ? "would update" : "updated";

  console.log(
    `Reconciling measurement summaries (batch=${options.batchSize}${
      options.dryRun ? ", dry run" : ""
    })…`,
  );
  const result = await backfillMeasurementSummaries(options);

  console.log(
    `GlobalVariable: examined ${result.globalVariables.examined}, ${label} ${result.globalVariables.changed}`,
  );
  console.log(
    `NOf1Variable:   examined ${result.nOf1Variables.examined}, ${label} ${result.nOf1Variables.changed}`,
  );
  if (options.dryRun) {
    console.log("Dry run — nothing was written.");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
