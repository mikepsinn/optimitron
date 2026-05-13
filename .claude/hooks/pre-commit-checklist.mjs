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
// `git -C path commit`, and `git -c key=value commit`. Skips
// `git commit-tree` and other false positives.
//
// Codex review (2026-05-12) caught that the previous `\s+-[A-Za-z]\S*`
// only matched `-XValue` joined forms, not the space-separated `-X Value`
// forms like `-C path` or `-c user.name=foo` that git accepts before the
// subcommand. The optional `(\s+\S+)?` group covers space-separated values.
if (
  !/(^|[\s;]|&&|\|\|)git(\s+-[A-Za-z]\S*(\s+\S+)?)*\s+commit(\s|$)/.test(command)
) {
  process.exit(0);
}

// Delegate. Pipe the original hookData JSON to the child so it can
// detect commit-attempt mode (`hookData.tool_name === "Bash"`) and emit
// full per-file detail instead of the terse Stop-mode one-liner.
const verifyScript = join(__dirname, "verify-ui-changes.mjs");
const result = spawnSync(process.execPath, [verifyScript], {
  input: JSON.stringify(hookData),
  stdio: ["pipe", "inherit", "inherit"],
});

process.exit(result.status ?? 0);
