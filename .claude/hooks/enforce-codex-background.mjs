#!/usr/bin/env node
// enforce-codex-background.mjs
//
// PreToolUse hook on Bash: when the command invokes `codex exec` or
// `codex review`, REQUIRE the Bash tool call to carry
// `run_in_background: true`. Foreground Codex dispatches block the
// orchestrator for minutes while Codex churns — and the rule has lived
// in `.claude/codex-delegation.md:7` as plain text since the protocol
// was written. Plain-text rules lose to active enforcement.
//
// 2026-05-16 trigger: Mike, verbatim — *"do you remember what our
// workflow is? Where you fucking do something and then give me the
// links that I have to review, ask me questions about it and stuff?
// And then you always delegate everything to Kodak's agents in the
// background. Do we have that documented in hook or something,
// something, somewhere that will force you to do it?"* — after I
// dispatched a Codex preflight in foreground (10 min Bash timeout)
// for a copy-only commit. He had to background it himself by
// interrupting.
//
// Bypass: none. If the dispatch is truly short-lived (<30s) and the
// orchestrator needs the result inline, dispatch with a Monitor watcher
// or refactor the work — never bypass.
//
// Related: feedback_promote_violated_text_rules_to_hooks.md.

import { readFileSync } from "node:fs";

try {
  const raw = readFileSync(0, "utf-8");
  if (!raw || !raw.trim()) process.exit(0);

  const hookData = JSON.parse(raw);
  if (hookData?.tool_name !== "Bash") process.exit(0);

  const command = String(hookData?.tool_input?.command ?? "");
  if (!command) process.exit(0);

  // Skip non-codex first tokens (mirrors enforce-codex-protocol.mjs).
  const firstToken = command.trim().split(/\s+/)[0] ?? "";
  if (/^(git|gh|grep|rg|find|cat|head|tail|sed|awk|echo|printf|ls|cd|node|pnpm|npm|yarn|tsx|powershell)$/i.test(firstToken)) {
    process.exit(0);
  }

  // Only fire on codex dispatches that start a NEW conversation.
  // `codex exec resume <uuid>` and CLI subcommands (login, mcp, etc.)
  // are allowed in foreground because they're short-lived control
  // operations, not work dispatches.
  const isFreshDispatch = /\bcodex\s+(exec|review)\b/.test(command) &&
    !/\bcodex\s+exec\s+resume\b/.test(command) &&
    !/\bcodex\s+(login|logout|mcp|plugin|app|cloud|features|completion|update|sandbox|debug|apply|fork|help)\b/.test(command);

  if (!isFreshDispatch) process.exit(0);

  // The Bash tool flags background via tool_input.run_in_background.
  // Some harness versions pass it as boolean true; some pass a string
  // "true". Accept both. Anything else = foreground = block.
  const bg = hookData?.tool_input?.run_in_background;
  if (bg === true || bg === "true") process.exit(0);

  const msg =
    `[enforce-codex-background] BLOCKED — codex dispatch must carry run_in_background: true.\n\n` +
    `Foreground Codex dispatches block the orchestrator for minutes while Codex churns.\n` +
    `The rule lives at .claude/codex-delegation.md:7 — but plain-text rules lose to active\n` +
    `enforcement, so this hook now enforces it.\n\n` +
    `Fix: re-issue the SAME Bash command with run_in_background: true. The harness will\n` +
    `notify you when Codex completes; in the meantime, do other work.\n\n` +
    `If you genuinely need the result inline (you don't — there is almost always other\n` +
    `work to do), dispatch with Monitor watching the session JSONL — never bypass this hook.\n\n` +
    `Triggered by command:\n  ${command.slice(0, 200)}${command.length > 200 ? '…' : ''}`;

  process.stderr.write(msg + "\n");
  process.exit(2);
} catch {
  process.exit(0);
}
