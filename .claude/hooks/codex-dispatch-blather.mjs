#!/usr/bin/env node
// codex-dispatch-blather.mjs
//
// PreToolUse hook on Bash. Fires before any `codex exec` (including
// `codex exec resume <uuid>`). Counts enumeration items in the prompt
// argument. If the prompt has more than 3 numbered/bullet items + headings
// outside of verbatim user quotes, blocks with a reminder.
//
// Why: per [[feedback_state_the_goal_not_the_script]] and codex-delegation.md
// "Pre-commit preflight" — when dispatching to Codex, state the goal in
// plain English. Numbered procedural lists are the prompt-engineering
// version of the smallest-fix anti-pattern. Codex decides from the diff;
// listing steps is micromanaging.
//
// Fail-open on any unexpected error.

import { readFileSync } from "node:fs";

const BUDGET = 3;

try {
  let hookData = null;
  try {
    const raw = readFileSync(0, "utf-8");
    if (raw && raw.trim()) hookData = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  if (!hookData) process.exit(0);
  if (hookData.tool_name !== "Bash") process.exit(0);

  const cmd = hookData?.tool_input?.command ?? "";
  if (!/\bcodex\s+exec\b/.test(cmd)) process.exit(0);

  // Extract the prompt argument. Codex usage:
  //   codex exec [--flag ...] '<prompt>'
  //   codex exec resume <uuid> '<prompt>'
  // The prompt is the last single-quoted argument.
  const promptMatch = cmd.match(/'([\s\S]*)'\s*$/) || cmd.match(/"([\s\S]*)"\s*$/);
  if (!promptMatch) process.exit(0);
  const prompt = promptMatch[1];
  if (prompt.length < 200) process.exit(0); // tiny prompts are fine

  // Walk lines, skip blockquotes (`>` prefix — verbatim user quote).
  let enumerationCount = 0;
  const samples = [];
  for (const line of prompt.split("\n")) {
    const trimmed = line.replace(/^\s+/, "");
    if (trimmed.startsWith(">")) continue;
    // Numbered list items: "1.", "1)", "(1)" etc.
    if (/^\(?\d+[.)]\s/.test(trimmed)) {
      enumerationCount++;
      if (samples.length < 6) samples.push(line);
      continue;
    }
    // Bullet items: -, *, • when followed by space.
    if (/^[-*•]\s/.test(trimmed)) {
      enumerationCount++;
      if (samples.length < 6) samples.push(line);
      continue;
    }
    // Procedural headings: "## Process", "## Verify", "**Process:**" etc.
    if (
      /^#{2,}\s+(process|verify|steps?|hands?\s+off|approaches?|how|protocol)\b/i.test(trimmed)
      || /^\*\*(process|verify|steps?|hands?\s+off|approaches?|how|protocol)\b/i.test(trimmed)
    ) {
      enumerationCount++;
      if (samples.length < 6) samples.push(line);
    }
  }

  if (enumerationCount <= BUDGET) process.exit(0);

  const sampleStr = samples.slice(0, 5).map((s) => `  ${s.trim()}`).join("\n");
  process.stderr.write(
    `[codex-dispatch-blather] Prompt has ${enumerationCount} enumeration items (budget: ${BUDGET}).

Codex dispatch should be goal-first, not procedural. See:
  - .claude/codex-delegation.md ("Pre-commit preflight" + "Every Codex prompt must contain")
  - C:/Users/m/.claude/projects/E--code-optimitron/memory/feedback_state_the_goal_not_the_script.md

Rewrite: one paragraph stating what's broken + what "done" looks like, the verbatim user quote, and a pointer to codex-delegation.md. Codex reads CLAUDE.md and the diff itself — do not duplicate that here.

Detected enumeration:
${sampleStr}
`,
  );
  process.exit(2);
} catch {
  process.exit(0);
}
