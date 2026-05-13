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

**When a new task would overlap files an active agent owns**, queue it as a follow-up to that agent (`SendMessage` with the agent ID) instead of racing a parallel one. The active agent already has codebase context loaded — cheaper and conflict-free.

## Config

`.codex/config.toml` pins `model = "gpt-5.5"` + `model_reasoning_effort = "xhigh"` — strongest tier for the hardest async tasks.

## Verify before relaying

Codex hallucinates. Inspect each non-trivial diff before reporting success.
