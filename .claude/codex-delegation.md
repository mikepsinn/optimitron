# Codex delegation protocol

Claude Code's working pattern with the Codex CLI. Loaded by reference from CLAUDE.md.

## Default delegation

Programming work goes to Codex via `Agent` (`subagent_type: codex:codex-rescue`, `run_in_background: true`).

Claude edits meta-config (CLAUDE.md, this file, `.codex/config.toml`, hook scripts) directly — those are quick and don't need a dispatch.

## Every Codex prompt must contain

1. **Mikepsinn's verbatim message**, quoted. The user often uses speech-to-text — typos expected; interpret intent, don't surface-correct. Verbatim quoting eliminates Claude-as-telephone-game mutation.
2. **Investigate-before-coding** instruction: grep, read, understand. Don't trust the framing blindly.
3. **Push back if the request hurts the 4B-voters-on-the-treaty goal.** State the concern, propose to skip, wait for confirmation. Don't silently comply with work that doesn't move that needle.
4. **Argue back if Claude misread the user.** The verbatim quote makes this checkable.
5. **Regenerate affected `.md` snapshots and screenshots** after any content/component change. Use `node packages/web/scripts/affected-routes.mjs` to pipe changed-file paths into `render-pages-to-markdown.ts --routes=` for targeted regen; fall back to full regen when the change touches shared primitives.
6. **Nothing committed without user approval.** Codex stages the changeset and reports; Claude relays the summary + diff scope; user OKs; then Claude commits on Codex's behalf (Codex can't touch `.git`).

## Multi-agent coordination

**Don't artificially scope agents to non-overlapping files.** Parallel agents on the same codebase is fine; gaps in coverage cost more than rare same-file collisions.

**When a new task would overlap files an active agent owns**, queue it as a follow-up to that agent instead of racing a parallel one. Two paths:

1. **`SendMessage` tool** (preferred when available): pass the new prompt to the running Agent via `to: <agentId>`. Resumes the agent with full context. **Caveat:** `SendMessage` is not loaded in every Claude Code session — `ToolSearch` for it before assuming it's available.

2. **Codex CLI `resume`** (fallback, always available): when dispatching Codex via Bash (`codex exec "prompt"` with `run_in_background: true`), the session is recorded at `~/.codex/sessions/YYYY/MM/DD/rollout-<timestamp>-<uuid>.jsonl`. To queue a follow-up:
   - `codex exec resume --last "follow-up prompt"` — uses the most recent session in the current working directory. Risky if other Codex sessions ran in between.
   - `codex exec resume <uuid> "follow-up prompt"` — explicit, robust. Capture the UUID right after dispatch with a Bash one-liner like `ls -t ~/.codex/sessions/$(date +%Y)/$(date +%m)/$(date +%d)/rollout-*.jsonl | head -1` and extract the UUID from the filename.

3. **When both paths are unavailable** (e.g., the agent was dispatched via the Agent tool, `SendMessage` isn't loaded, and the Codex session UUID isn't exposed): wait for the running agent to complete, then **hand-patch its output** before committing. Don't race a parallel agent on the same file — the merge cost exceeds the wait cost.

**Default dispatch path: Bash + `codex exec` directly.** The Codex CLI is more capable than the MCP-mediated Agent-tool path in almost every dimension that matters:

- Full CLI feature access (`-c`, `--enable`, `--config`, custom profiles).
- Session UUID visible → can queue follow-ups via `codex exec resume <uuid>`.
- No auto-mode permission classifier blocking valid work mid-flight.
- Output streams directly to a file you control — no wrapper narration mistakenly summarizing the work as "Codex is running in the background, will report when done" when the actual work has already been done.

Dispatch via `Bash` with `run_in_background: true` and you still get the completion notification — same UX, more power.

**When to reach for the Agent tool instead** (`subagent_type: codex:codex-rescue`):
- One-shot dispatch where there's no chance you'll want to queue a follow-up.
- When the auto-mode permission classifier's safety net is actually warranted (rare; mostly when the user has explicitly flagged the task as risky).

For everything else, prefer Bash + `codex exec`.

## Config

`.codex/config.toml` pins `model = "gpt-5.5"` + `model_reasoning_effort = "xhigh"` — strongest tier for the hardest async tasks.

## Verify before relaying

Codex hallucinates. Inspect each non-trivial diff before reporting success.
