# Codex delegation protocol

Claude Code's working pattern with the Codex CLI. Loaded by reference from CLAUDE.md.

## Default delegation

Programming work goes to Codex via `Bash` running `codex exec` directly, with `run_in_background: true`. The MCP-mediated Agent-tool path (`subagent_type: codex:codex-rescue`) is strictly worse — see "Why CLI not Agent tool" below — and is not used.

**Dispatch shape that works:**
```
Bash(command: "codex exec --skip-git-repo-check '<prompt>'", run_in_background: true)
```

**Don't add a shell `&` inside the command.** The Bash tool already backgrounds via `run_in_background: true`; a second `&` makes the codex child detach from the bash subprocess, which exits immediately with status 0 — Claude then gets a "completed" notification while Codex is still running for minutes. Pair the dispatch with a `Monitor` watching the session JSONL for real progress.

Claude edits meta-config (CLAUDE.md, this file, `.codex/config.toml`, hook scripts) directly — those are quick and don't need a dispatch.

## Every Codex prompt must contain

1. **Mikepsinn's verbatim message**, quoted. The user often uses speech-to-text — typos expected; interpret intent, don't surface-correct. Verbatim quoting eliminates Claude-as-telephone-game mutation.
2. **Investigate-before-coding** instruction: grep, read, understand. Don't trust the framing blindly.
3. **Push back if the request hurts the 4B-voters-on-the-treaty goal.** State the concern, propose to skip, wait for confirmation. Don't silently comply with work that doesn't move that needle.
4. **Argue back if Claude misread the user.** The verbatim quote makes this checkable.
5. **Regenerate affected `.md` snapshots and screenshots** after any content/component change. Use `node packages/web/scripts/affected-routes.mjs` to pipe changed-file paths into `render-pages-to-markdown.ts --routes=` for targeted regen; fall back to full regen when the change touches shared primitives.
6. **Nothing committed without user approval.** Codex stages the changeset and reports; Claude relays the summary + diff scope; user OKs; then Claude commits on Codex's behalf (Codex can't touch `.git`).

## Multi-agent coordination

**Don't artificially scope agents to non-overlapping files.** Parallel `codex exec` dispatches on the same codebase are fine; gaps in coverage cost more than rare same-file collisions.

**When a new task would overlap files an active agent owns**, queue it as a follow-up to that agent's session instead of racing a parallel one. Use `codex exec resume`:

- `codex exec resume <uuid> "follow-up prompt"` — explicit, robust. Capture the UUID right after dispatch by globbing `~/.codex/sessions/$(date +%Y)/$(date +%m)/$(date +%d)/rollout-*.jsonl` (newest = the one you just spawned). UUID is the trailing hex segment of the filename.
- `codex exec resume --last "follow-up prompt"` — convenient but risky if other Codex sessions ran in between in the same cwd.

The session UUID is the only handle you get; capture it at dispatch time and store it for the life of the follow-up chain.

## Why CLI not Agent tool

The `subagent_type: codex:codex-rescue` Agent path is MCP-mediated and strictly worse than direct `codex exec`:

- No Codex CLI flag access (`-c`, `--enable`, `--config`, profiles all hidden).
- Session UUID hidden → can't queue follow-ups; have to start a new agent every time.
- Auto-mode permission classifier blocks valid work mid-flight (caught one valid dispatch in a single session).
- Wrapper sometimes returns "Codex is running in the background, will report when done" narration *after the work has already finished* — fooled me 3× in one session into thinking agents had fizzled.
- The classifier's "safety net" is the only theoretical upside, and Claude already applies per-task safety judgment manually.

If a future Claude session is tempted to use the Agent path because it looks more integrated: it isn't. The direct CLI path has the same `run_in_background: true` notification UX from Bash, plus everything above.

## Config

`.codex/config.toml` pins `model = "gpt-5.5"` + `model_reasoning_effort = "xhigh"` — strongest tier for the hardest async tasks.

## Verify before relaying

Codex hallucinates. Inspect each non-trivial diff before reporting success.

**Read the agent_message events, not just `task_complete`.** Codex's session file at `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` contains the full conversation log. The final `task_complete` event sometimes has an empty `last_agent_message` even when Codex did real work — you'll miss its actual narration if you only tail the file. Mid-stream `agent_message` events are where Codex reports what it's actually doing, including stupid moves you'd want to redirect mid-flight. Extract them like:

```python
python -c "
import json, sys
with open(sys.argv[1]) as f:
    for line in f:
        d = json.loads(line)
        p = d.get('payload', {})
        if p.get('type') == 'agent_message':
            print(p['message']); print('---')
" <session-file>
```

Always run this against the right session file (`ls -t ~/.codex/sessions/$(date +%Y)/$(date +%m)/$(date +%d)/rollout-*.jsonl | head -1`) before declaring an agent failed or succeeded — wrapper narration and filesystem state alone are insufficient.

**Always verify the working tree matches what Codex claims.** Run `git diff --stat` after every Codex dispatch and compare line counts to what Codex says it did. If Codex says "now 266 lines" and `wc -l` says 1490, something reverted the edits — investigate before committing or re-dispatching.

**Watch the agent_message stream while Codex runs, not just after.** Mid-flight, Codex sometimes does something stupid (reads the wrong file, applies the wrong rule, derails into unrelated work). Tailing the session JSONL or periodically polling `agent_message` events gives you the chance to redirect before Codex burns 3M tokens on a wrong path. Don't just wait for the completion notification and read the diff — that's strictly reactive.

**When Codex's claim conflicts with your understanding or the filesystem, ASK CODEX.** Don't guess. Use `codex exec resume <uuid> "<short factual question>"` to query the same session — Codex has full context on what it did and can explain. Example: "You said the file is 266 lines, but on disk it's 1490 with empty git diff. Did your edits write to a sandbox? What path did you actually write to?" Treat the agent as an interlocutor on its own work, not a black box.

**Never `git stash` while Codex agents are working.** A `git stash --keep-index` (or any stash) reaches into the working tree, including files a parallel Codex agent has just written or is about to write. The subsequent `git stash pop` doesn't reliably restore those concurrent writes — they vanish silently. Verified this session: one Codex audit's 266-line TODO.md got dropped by exactly this dance. The pre-commit hook now reads only `git diff --cached` (staged content), so there's no reason to stash unstaged parallel work — `git add <specific files>` and commit; the hook will only inspect what you staged. If you find yourself reaching for `git stash`, stop and ask why.
