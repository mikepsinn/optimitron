#!/usr/bin/env node
// enforce-no-codex-in-commit-message.mjs
//
// PreToolUse hook on Bash: when the command is `git commit -m ...`,
// BLOCK if the commit message contains the word "Codex", "[codex]",
// or "codex/" in an attribution position. Per AGENTS.md:34:
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
// Bypass: prefix the commit message with `chore(codex):` or include
// the literal string `human-authorized-codex-mention` in the message
// (for cases where Mike explicitly asked).
//
// 2026-05-16 trigger: codex stop-time review flagged commit c37160d1
// for "qa-passed: Codex bjb7ndrvy"; multiple session commits had
// similar attribution phrases.

import { readFileSync } from "node:fs";

try {
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

  // Explicit human bypass
  if (/\bhuman-authorized-codex-mention\b/i.test(command)) process.exit(0);
  if (/\bchore\(codex\):/i.test(command)) process.exit(0);

  // Extract the commit message body. Common patterns:
  //   git commit -m "msg"           (single -m)
  //   git commit -m "$(cat <<'EOF' ... EOF)"  (heredoc)
  //   git commit -F path/to/file
  //   git commit (opens editor; we can't see the message)
  // For -F or editor case, we skip — can't inspect the message.
  if (/-F\s+\S+/.test(command) && !/-m\s+/.test(command)) process.exit(0);

  // Pull out everything between -m " and the matching close, OR within
  // a $(cat <<EOF...EOF) heredoc.
  const heredocMatch = command.match(/<<\s*['"]?([A-Za-z_]+)['"]?\s*[\s\S]*?\n([\s\S]*?)\n\1/);
  const dashMMatch = command.match(/-m\s+["']([\s\S]*?)["']\s*(?:\)|$)/);
  const message = heredocMatch?.[2] || dashMMatch?.[1] || "";

  if (!message) process.exit(0); // can't inspect, fail-open

  // Patterns that flag ATTRIBUTION (not literal file-name reference):
  //   "Codex " followed by agent-id (8+ chars alphanumeric)
  //   "Codex preflight" / "Codex review" / "Codex audit" / etc
  //   "qa-passed: Codex" / "fixed by Codex" / etc
  //   Standalone "Codex" not followed by - or /
  // AGENTS.md:34 explicitly lists THREE banned forms: `Codex`, `[codex]`,
  // `codex/`. Cover ALL three forms, not just the attribution phrases I
  // personally violated. Per feedback_absence_claims_require_synonym_coverage:
  // when a doc enumerates the family, hook must cover the whole family.
  const attributionPatterns = [
    // Form 1: `[codex]` literal — bracketed reference (PR titles, tags)
    /\[codex\]/i,
    // Form 2: `codex/` literal — slash form (branch names, paths)
    /\bcodex\//i,
    // Form 3: `Codex` attribution phrases
    /\bCodex\s+[a-z][0-9a-z]{6,}\b/,        // Codex bjb7ndrvy
    /\bCodex\s+(preflight|review|audit|investigated|investigation|implementation|implemented|critique|agent|subagent|dispatch|fixed|wrote|drafted|verdict|verified|cleared|found)\b/i,
    /(?:qa-passed|reviewed by|fixed by|implemented by|drafted by|audited by|approved by|cleared by|verified by|written by)[^a-z\n]*Codex\b/i,
    /\bvia\s+Codex\b/i,
    /\bby\s+Codex\b/i,
    /\bfrom\s+Codex\b/i,
    /\bwith\s+Codex\b/i,
    /\bCodex\s+(says|did|ran|produced|returned|reported|found|caught|flagged)\b/i,
    // Form 4: standalone `Codex` at line start (e.g. "Codex: clean")
    /^Codex\b/im,
  ];

  const hits = attributionPatterns
    .map((re) => message.match(re))
    .filter(Boolean);

  if (hits.length === 0) process.exit(0);

  const msg =
    `[enforce-no-codex-in-commit-message] BLOCKED — commit message contains "Codex" attribution.\n\n` +
    `AGENTS.md:34 forbids "Codex" / "[codex]" / "codex/" in branch names, PR titles,\n` +
    `and commit messages unless the human explicitly asks.\n\n` +
    `Attribution phrases detected:\n${hits.map((h) => `  - ${h?.[0]}`).join("\n")}\n\n` +
    `Fix: rewrite the attribution without naming Codex. Examples:\n` +
    `  - "qa-passed: Codex bjb7ndrvy" -> "qa-passed: preflight bjb7ndrvy — typecheck + ..."\n` +
    `  - "Codex preflight clean" -> "preflight clean: typecheck + e2e + visual smoke"\n` +
    `  - "audited by Codex" -> "audited via agent-id-here"\n\n` +
    `Bypass (only if Mike explicitly asked): include the literal string\n` +
    `\`human-authorized-codex-mention\` in the commit message body.\n\n` +
    `Rule lives at: AGENTS.md:34\n` +
    `Memory: feedback_no_codex_in_commit_messages.md`;

  process.stderr.write(msg + "\n");
  process.exit(2);
} catch {
  process.exit(0);
}
