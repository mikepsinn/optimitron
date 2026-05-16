#!/usr/bin/env node
// block-codex-rescue-agent.mjs
//
// PreToolUse hook on the Agent tool: blocks dispatches with
// `subagent_type: "codex:codex-rescue"`. The wrapper is strictly
// worse than direct `codex exec` via Bash and the protocol already
// says so — see .claude/codex-delegation.md line 7 + line 105 ("Why
// CLI not Agent tool"). I keep using it anyway despite the doc rule.
//
// 2026-05-14: written after I used the wrapper twice in one session
// (anonymized-preview, ICEWAD rename). Both showed exactly the
// failure mode line 113 names verbatim — wrapper returns "will
// report when done" while underlying work has already finished or
// fizzled. Per feedback_promote_violated_text_rules_to_hooks.md:
// passive text loses to active enforcement.

import { readFileSync } from "node:fs";

try {
  let hookData = null;
  try {
    const raw = readFileSync(0, "utf-8");
    if (raw && raw.trim()) hookData = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  if (!hookData) process.exit(0);

  if (hookData.tool_name !== "Agent") process.exit(0);

  const subagent = hookData?.tool_input?.subagent_type ?? "";
  if (subagent !== "codex:codex-rescue") process.exit(0);

  const msg = `[block-codex-rescue-agent] BLOCKED — Agent(subagent_type: "codex:codex-rescue").

The Agent wrapper is strictly worse than direct \`codex exec\` via Bash
for Codex dispatches. See \`.claude/codex-delegation.md\` line 105+
("Why CLI not Agent tool"). Common failure mode (line 113):

  Wrapper returns "Codex is running in the background, will report
  when done" narration AFTER the work has already finished — looks
  like it's still running when it's already done (or fizzled).

Use this shape instead:

  Bash(
    command: "codex exec --skip-git-repo-check '<prompt>'",
    run_in_background: true
  )

For substantial / multi-turn tasks where you want steer/interrupt,
the upgrade path is \`codex app-server\` (JSON-RPC) — see the
"App-server upgrade path" section in codex-delegation.md.

If you HAVE a specific reason to use the wrapper (need Claude-side
review between dispatch and result), say so in chat first. There is
no 5-minute bypass on this hook — every dispatch decision should be
deliberate.`;

  process.stderr.write(msg + "\n");
  process.exit(2);
} catch {
  process.exit(0);
}
