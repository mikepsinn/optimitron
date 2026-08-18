import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { config as loadEnv } from "dotenv";
import { importNotionBundle } from "../src/lib/notion-import.server";

loadEnv({ path: path.resolve(process.cwd(), "..", "..", ".env") });

function parseArguments(argv: string[]) {
  let apply = false;
  let file = "";
  let userId = "";
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") {
      continue;
    } else if (argument === "--apply") {
      apply = true;
    } else if (argument === "--file") {
      file = argv[(index += 1)] ?? "";
    } else if (argument === "--user") {
      userId = argv[(index += 1)] ?? "";
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!file) throw new Error("--file is required.");
  if (!userId) throw new Error("--user is required.");
  return { apply, file, userId };
}

async function main() {
  const arguments_ = parseArguments(process.argv.slice(2));
  const bundle = JSON.parse(
    await readFile(path.resolve(arguments_.file), "utf8"),
  ) as unknown;
  const result = await importNotionBundle({
    actorUserId: arguments_.userId,
    bundle,
    dryRun: !arguments_.apply,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.hasErrors) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack : String(error)}\n`,
  );
  process.exitCode = 1;
});
