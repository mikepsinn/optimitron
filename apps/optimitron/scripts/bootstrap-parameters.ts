import { citations, parameters } from "@optimitron/data/parameters";
import path from "node:path";
import process from "node:process";
import { config as loadEnv } from "dotenv";
import { bootstrapGeneratedParameterCatalog } from "../src/lib/parameters/parameter-catalog.server";

loadEnv({ path: path.resolve(process.cwd(), "..", "..", ".env") });

function shouldApply(argv: string[]) {
  for (const argument of argv) {
    if (argument !== "--apply")
      throw new Error(`Unknown argument: ${argument}`);
  }
  return argv.includes("--apply");
}

async function main() {
  const result = await bootstrapGeneratedParameterCatalog({
    citations,
    dryRun: !shouldApply(process.argv.slice(2)),
    parameters,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack : String(error)}\n`,
  );
  process.exitCode = 1;
});
