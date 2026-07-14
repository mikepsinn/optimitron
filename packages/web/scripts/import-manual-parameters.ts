import { execFile as execFileCallback } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { config as loadEnv } from "dotenv";
import { importManualParameterCatalog } from "../src/lib/parameters/parameter-catalog.server";

loadEnv({ path: path.resolve(process.cwd(), "..", "..", ".env") });

const execFile = promisify(execFileCallback);

function parseArgs(argv: string[]) {
  let apply = false;
  let manualRoot = process.env.MANUAL_REPO_PATH?.trim() || null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") apply = true;
    else if (argument === "--manual-root") manualRoot = argv[++index] ?? null;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return { apply, manualRoot };
}

function resolveManualRoot(explicitRoot: string | null) {
  const candidates = [
    explicitRoot,
    path.resolve(process.cwd(), "..", "manual"),
    path.resolve(process.cwd(), "..", "..", "..", "manual"),
  ].filter((candidate): candidate is string => Boolean(candidate));
  const root = candidates.find((candidate) =>
    existsSync(path.join(candidate, "dih_models", "parameters.py")),
  );
  if (!root) {
    throw new Error(
      "Manual repository not found. Pass --manual-root <path> or set MANUAL_REPO_PATH.",
    );
  }
  return root;
}

async function loadManualParameterExport(manualRoot: string): Promise<unknown> {
  const exporter = path.join(
    manualRoot,
    "scripts",
    "generate-everything-parameters-variables-calculations-references.py",
  );
  if (
    !existsSync(exporter) ||
    !(await readFile(exporter, "utf8")).includes('"--parameters-json-stdout"')
  ) {
    throw new Error(
      "The manual exporter must support --parameters-json-stdout. Refusing to combine a stale JSON snapshot with current Python source.",
    );
  }

  const { stdout } = await execFile(
    process.env.PYTHON?.trim() || "python",
    [exporter, "--parameters-json-stdout"],
    { cwd: manualRoot, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
  );
  return JSON.parse(stdout) as unknown;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manualRoot = resolveManualRoot(args.manualRoot);
  const [exportData, summariesText, pythonSource] = await Promise.all([
    loadManualParameterExport(manualRoot),
    readFile(path.join(manualRoot, "_analysis", "samples.json"), "utf8"),
    readFile(path.join(manualRoot, "dih_models", "parameters.py"), "utf8"),
  ]);
  const result = await importManualParameterCatalog({
    dryRun: !args.apply,
    exportData,
    pythonSource,
    summaries: JSON.parse(summariesText) as unknown,
  });
  process.stdout.write(
    `${JSON.stringify({ manualRoot, ...result }, null, 2)}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack : String(error)}\n`,
  );
  process.exitCode = 1;
});
