#!/usr/bin/env node
import path from "node:path";

const mode = process.argv[2];
const value = process.argv.slice(3).join(" ");

function fail(message) {
  console.error(message);
  process.exit(2);
}

function ok(message = "ok") {
  console.log(message);
  process.exit(0);
}

function checkCommand(command) {
  const text = command.trim();

  // CodeRabbit/Claude review on PR #79 flagged that `safeDelete` previously
  // ran before the blocked list, so a compound command like
  // `rm -rf node_modules && rm -rf /` would `ok()` out on the first clause
  // and the second clause's recursive-rm / DROP TABLE / force-push never got
  // inspected. We now check blocked patterns FIRST. The build-artifact
  // shortcut still exists but is gated on the WHOLE command containing no
  // shell-separator-style continuations, so it cannot be used as a prefix to
  // smuggle a second clause through.
  const blocked = [
    [/\brm\s+(-[^\s]*r[^\s]*|-.*recursive)/i, "recursive delete"],
    [/\bRemove-Item\b[\s\S]*\b-Recurse\b/i, "recursive delete"],
    [/\bDROP\s+(TABLE|DATABASE)\b/i, "database drop"],
    [/\bTRUNCATE\b/i, "database truncate"],
    [/\bgit\s+reset\s+--hard\b/i, "hard reset"],
    [/\bgit\s+(checkout|restore)\s+\.\b/i, "discarding worktree changes"],
    [/\bgit\s+push\b[\s\S]*(--force|-f)\b/i, "force push"],
    [/\bkubectl\s+delete\b/i, "kubernetes delete"],
    [/\bdocker\s+(rm\s+-f|system\s+prune)\b/i, "destructive docker cleanup"],
  ];

  // Single `&` (background), newline, `&&`, `||`, `;`, and `|` all chain a
  // following command. The carve-out for `rm -rf node_modules` only applies
  // to single-clause commands — never compound.
  const hasShellSeparator =
    /(?:&&|\|\||;|\n|\|(?!\|)|&(?!&))/.test(text);
  const safeDelete = /\b(remove-item|rm)\b[\s\S]*(node_modules|\.next|dist|build|\.turbo|coverage|__pycache__|\.cache)\b/i;
  const isSafeCleanupSingleClause =
    safeDelete.test(text) && !hasShellSeparator;

  for (const [pattern, label] of blocked) {
    if (pattern.test(text)) {
      // Carve-out: standalone "rm -rf node_modules" stays allowed. Compound
      // commands containing && / || / ; / | are never carved out, even when
      // their first clause looks safe.
      if (label === "recursive delete" && isSafeCleanupSingleClause) continue;
      fail(`Safety gate: ${label}. Get explicit human approval before running:\n${text}`);
    }
  }

  if (isSafeCleanupSingleClause) ok("safe cleanup command");
  ok("command allowed");
}

function checkPath(targetPath) {
  const root = process.env.CLAUDE_FREEZE_DIR;
  if (!root) ok("no freeze boundary set");

  const base = path.resolve(root) + path.sep;
  const target = path.resolve(targetPath);
  if (target === path.resolve(root) || target.startsWith(base)) ok("path inside freeze boundary");

  fail(`Freeze gate: ${target} is outside ${base}`);
}

// Hook mode: invoked by Claude Code's PreToolUse:Bash hook. Reads stdin JSON
// of the form { tool_name, tool_input: { command, ... } } and checks the
// extracted command via the same checkCommand path.
if (mode === "hook") {
  let raw = "";
  try {
    raw = await new Promise((resolve, reject) => {
      let buf = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => (buf += chunk));
      process.stdin.on("end", () => resolve(buf));
      process.stdin.on("error", reject);
    });
  } catch {
    process.exit(0);
  }
  if (!raw || !raw.trim()) process.exit(0);
  try {
    const hookData = JSON.parse(raw);
    const cmd = hookData?.tool_input?.command;
    if (typeof cmd === "string" && cmd.length > 0) checkCommand(cmd);
  } catch {
    // Malformed JSON or non-Bash invocation — fail open.
  }
  process.exit(0);
}

if (mode === "command") checkCommand(value);
if (mode === "path") checkPath(value);

console.error("Usage: node .claude/safety-gate.mjs command \"<shell>\" | path \"<file>\" | hook <stdin-json>");
process.exit(64);
