#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import process from "node:process";

function parseMode(argv) {
  const args = argv.filter((arg) => arg !== "--");
  const allowed = new Set(["--apply", "--dry-run"]);
  const unknown = args.filter((arg) => !allowed.has(arg));
  if (unknown.length > 0) {
    throw new Error(`Unknown argument(s): ${unknown.join(", ")}`);
  }
  const apply = args.includes("--apply");
  const dryRun = args.includes("--dry-run");

  if (apply && dryRun) {
    throw new Error("Use either --apply or --dry-run, not both.");
  }

  return apply ? "--apply" : "--dry-run";
}

function runManagedSync(label, args) {
  console.log(`\n[managed-data] ${label}`);
  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(command, args, {
    env: process.env,
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

try {
  const mode = parseMode(process.argv.slice(2));
  runManagedSync("task tree", [
    "--filter",
    "@optimitron/db",
    "run",
    "sync:managed-data",
    "--",
    mode,
  ]);
  runManagedSync("task triggers", [
    "--filter",
    "@optimitron/web",
    "exec",
    "tsx",
    "scripts/sync-task-triggers.ts",
    "--",
    mode,
  ]);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
