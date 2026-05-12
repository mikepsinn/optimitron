#!/usr/bin/env node
// pre-commit-checklist.mjs
//
// PreToolUse hook on Bash. Fires before any Bash command. If the command is a
// `git commit`, delegates to verify-ui-changes.mjs (same gates as Stop). Other
// bash commands pass through.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let hookData = null;
try {
  const raw = readFileSync(0, "utf-8");
  if (raw && raw.trim()) hookData = JSON.parse(raw);
} catch {
  // Fail-open on no/bad stdin.
}

if (!hookData) process.exit(0);

const command = hookData?.tool_input?.command;
if (!command) process.exit(0);

// Only intercept `git commit`. Match the command being passed to Bash —
// covers `git commit`, `git commit -m "..."`, `cd X && git commit ...`,
// and `git -C path commit`. Skips `git commit-tree` and other false positives.
if (
  !/(^|[\s;]|&&|\|\|)git(\s+-[A-Za-z]\S*)*\s+commit(\s|$)/.test(command)
) {
  process.exit(0);
}

// Delegate. verify-ui-changes.mjs tolerates missing stdin.
const verifyScript = join(__dirname, "verify-ui-changes.mjs");
const result = spawnSync(process.execPath, [verifyScript], {
  stdio: ["ignore", "inherit", "inherit"],
});

process.exit(result.status ?? 0);
