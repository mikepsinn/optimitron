#!/usr/bin/env node
// enforce-no-codex-in-commit-message.mjs
//
// PreToolUse hook on Bash and Husky commit-msg hook: BLOCK if the
// commit message contains the word "Codex", "[codex]", or "codex/"
// in an attribution position. Per AGENTS.md:
//
//   "Do not put `Codex`, `[codex]`, or `codex/` in branch names,
//   pull request titles, or commit messages unless the human
//   explicitly asks."
//
// Exception: literal hook/file names that contain "codex" are OK
// because they're descriptive references to actual files (e.g.
// `enforce-codex-background.mjs`). Attribution phrases like
// "Codex preflight clean" or "qa-passed: Codex <id>" are NOT.
//
// Heuristic: distinguish attribution from literal reference.
//   - "codex-<word>" (kebab-case identifier) → likely a hook/file name → OK
//   - ".mjs" / ".ts" / ".js" suffix nearby → file reference → OK
//   - "Codex " followed by an agent id like "bxxxxxxxx" → ATTRIBUTION → BLOCK
//   - "Codex preflight" / "Codex review" / "Codex audit" → ATTRIBUTION → BLOCK
//   - "qa-passed: Codex" → ATTRIBUTION → BLOCK
//
// Bypass: include the literal string `human-authorized-codex-mention`
// in the message body only when Mike explicitly asked.
//
// 2026-05-16 trigger: codex stop-time review flagged commit c37160d1
// for "qa-passed: Codex bjb7ndrvy"; multiple session commits had
// similar attribution phrases.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const HUMAN_AUTHORIZED_BYPASS = /\bhuman-authorized-codex-mention\b/i;

function commandFlagFile(command, flag, cwd) {
  const match = command.match(new RegExp(`${flag}\\s+("[^"]+"|'[^']+'|\\S+)`));
  if (!match?.[1]) return "";
  const rawPath = match[1].replace(/^["']|["']$/g, "");
  const path = /^[A-Za-z]:[\\/]/.test(rawPath) || rawPath.startsWith("/")
    ? rawPath
    : resolve(cwd, rawPath);
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return "";
  }
}

function extractCommandMessage(command, cwd) {
  const heredocMatch = command.match(
    /<<\s*['"]?([A-Za-z_]+)['"]?\s*[\s\S]*?\n([\s\S]*?)\n\1/,
  );
  const dashMMessage = [...command.matchAll(/-m\s+["']([\s\S]*?)["']/g)]
    .map((match) => match[1])
    .filter(Boolean)
    .join("\n\n");
  const fileMessage = commandFlagFile(command, "-F", cwd);
  return [heredocMatch?.[2], dashMMessage, fileMessage]
    .filter(Boolean)
    .join("\n\n");
}

function detectedAttributionHits(message) {
  if (!message || HUMAN_AUTHORIZED_BYPASS.test(message)) return [];

  // Patterns that flag ATTRIBUTION (not literal file-name reference):
  //   "Codex" as a standalone brand/reference in commit prose
  //   "[codex]" / "codex/" from the AGENTS.md enumerated forms
  //   "Codex preflight" / "qa-passed: Codex" / "via Codex"
  // Literal lower-case kebab file names like enforce-codex-background.mjs are OK.
  const attributionPatterns = [
    /\[codex\]/i,
    /\bcodex\//i,
    /(?:^|[^-\w])Codex\b(?![-/.])/,
    /\bCodex\s+[a-z][0-9a-z]{6,}\b/,
    /\bCodex\s+(preflight|review|audit|investigated|investigation|implementation|implemented|critique|agent|subagent|dispatch|fixed|wrote|drafted|verdict|verified|cleared|found)\b/i,
    /(?:qa-passed|reviewed by|fixed by|implemented by|drafted by|audited by|approved by|cleared by|verified by|written by)[^a-z\n]*Codex\b/i,
    /\bvia\s+Codex\b/i,
    /\bby\s+Codex\b/i,
    /\bfrom\s+Codex\b/i,
    /\bwith\s+Codex\b/i,
    /\bCodex\s+(says|did|ran|produced|returned|reported|found|caught|flagged)\b/i,
  ];

  return attributionPatterns
    .map((re) => message.match(re))
    .filter(Boolean);
}

function blockIfNeeded(message) {
  const hits = detectedAttributionHits(message);
  if (hits.length === 0) return;

  const msg =
    `[enforce-no-codex-in-commit-message] BLOCKED — commit message contains "Codex" attribution.\n\n` +
    `AGENTS.md forbids "Codex" / "[codex]" / "codex/" in branch names, PR titles,\n` +
    `and commit messages unless the human explicitly asks.\n\n` +
    `Attribution phrases detected:\n${hits.map((h) => `  - ${h?.[0]}`).join("\n")}\n\n` +
    `Fix: rewrite the attribution without naming Codex. Examples:\n` +
    `  - "qa-passed: Codex bjb7ndrvy" -> "qa-passed: preflight bjb7ndrvy — typecheck + ..."\n` +
    `  - "Codex preflight clean" -> "preflight clean: typecheck + e2e + visual smoke"\n` +
    `  - "audited by Codex" -> "audited via agent-id-here"\n\n` +
    `Bypass (only if Mike explicitly asked): include the literal string\n` +
    `\`human-authorized-codex-mention\` in the commit message body.\n\n` +
    `Rule lives at: AGENTS.md\n` +
    `Memory: feedback_no_codex_in_commit_messages.md`;

  process.stderr.write(msg + "\n");
  process.exit(2);
}

try {
  const commitMsgPath = process.argv[2];
  if (commitMsgPath && existsSync(commitMsgPath)) {
    blockIfNeeded(readFileSync(commitMsgPath, "utf-8"));
    process.exit(0);
  }

  const raw = readFileSync(0, "utf-8");
  if (!raw || !raw.trim()) process.exit(0);

  const hookData = JSON.parse(raw);
  if (hookData?.tool_name !== "Bash") process.exit(0);

  const command = String(hookData?.tool_input?.command ?? "");
  if (!command) process.exit(0);

  // Match `git commit` (allow flags like -m, -F, -S, -C) but skip
  // non-commit subcommands like `git commit-tree`.
  if (!/\bgit\s+(?:-[A-Za-z]\s+\S+\s+)*commit\b(?!-tree)/.test(command)) {
    process.exit(0);
  }

  // Explicit human bypass.
  if (HUMAN_AUTHORIZED_BYPASS.test(command)) process.exit(0);

  const message = extractCommandMessage(command, hookData?.cwd ?? process.cwd());

  if (!message) process.exit(0); // can't inspect, fail-open

  blockIfNeeded(message);
} catch {
  process.exit(0);
}
