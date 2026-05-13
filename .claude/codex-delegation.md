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

## NEVER kill the dev server

The orchestrator (Claude / human dev) owns the dev server on 3001. Every Codex dispatch inherits this — agents are pure consumers, never managers.

**Banned operations:**
- `Stop-Process` / `kill` / `taskkill` against any node process bound to 3001
- Cleanup steps that "stop the dev server I started" — you didn't start it; don't stop it
- Wrapping `pnpm dev:fast` in a try/finally that kills on exit
- Killing port-3001 processes "just to be safe" when starting your own (you should never start your own)

**If the dev server is unresponsive:** report that fact and stop. Do NOT kill it and restart. The orchestrator will notice and restart if needed. Killing an unresponsive server can race with a slow compile that was about to finish.

**Only acceptable termination case:** the orchestrator explicitly told you to kill it as part of a known-bad-state recovery. That permission must be explicit in the dispatch prompt — never inferred.

Concrete failure case this rule prevents: this session, multiple Codex agents spawned their own `pnpm dev:fast`, dutifully cleaned up at end of verification, and the dev server vanished — leaving the next agent with no server to reuse. The orchestrator had to restart it manually each time. The new "agents reuse, never spawn" rule plus this "never kill" rule, together, eliminate the start-then-die cycle.

## Verification tool choice (use the cheapest that gives the answer)

Codex has Playwright MCP wired up (`mcp__playwright__browser_navigate`, `browser_console_messages`, `browser_take_screenshot`, etc.). Use it for spot-checks during the fix-iterate loop — load a page, grab console errors, verify the symptom is gone. 5-15 seconds per route.

DO NOT default to `pnpm --filter @optimitron/web run e2e -- visual --grep <route>` for iteration verification. That command boots a dev/prod server, compiles routes, runs screenshot capture + baseline comparison + Argos upload — 5-10 minutes per filter. Reserve it for the FINAL pre-merge verification pass after the fix is known to work.

Same signal (does the page hydrate without React errors? does the layout look right?) at 50x the cost. Burning 10 minutes per fix-iteration cycle when the same answer is available in 10 seconds is the anti-pattern. Concrete failure: this session, the hydration-investigation Codex spent ~8 minutes of one verification run on `pnpm e2e visual --grep treaty` when the same fix could have been spot-checked via Playwright MCP in seconds.

Include this in every Codex dispatch prompt for fix-iteration tasks: *"Use Playwright MCP (`mcp__playwright__browser_navigate` + `browser_console_messages`) for spot-checks during the iterate loop. Reserve `pnpm e2e visual` for the final verification pass."*

## One worktree, one branch, one dev server, one PR at a time

**No `git worktree`. No parallel branches. No second PR while another is in flight.** Every Codex dispatch runs in the main checkout (`E:/code/optimitron`) against whatever branch is currently checked out. The user is on ONE feature branch driving ONE PR; Codex's edits land on THAT branch. If the user wants Codex to do something that genuinely doesn't belong in the current PR's scope, the answer is "wait until this PR merges" — NOT "spin up a worktree on a new branch."

The mistake this rule prevents: I tried to run an "email-migration" Codex in a separate `../optimitron-emails` worktree on `feature/email-parameter-values` while another Codex was working in the main worktree on the live PR branch. Two dev servers fought over port 3001, the hydration-investigation agent's dev-server attempt timed out on EADDRINUSE, I burned a chat turn diagnosing the port conflict, and the resulting branch is now an orphan that has to be cherry-picked back into the live PR. None of this would have happened in a single worktree on a single branch.

**Dev server: one always running on 3001.** Claude (the orchestrator) pre-warms it at session start. Every Codex dispatch prompt must include the line: `"Dev server is already running at http://127.0.0.1:3001. Reuse it. Do NOT start your own."` If you're about to write a dispatch prompt that doesn't include that line, you forgot.

**Dev server logs.** Pages render 200 with broken HTML and runtime errors only show up in stderr — never trust an HTTP status as proof of success. Pass the log path into every Codex dispatch so the agent can verify its own work.

When Claude pre-warms the dev server, redirect output to `packages/web/.dev-server.log` (gitignored):

```
pnpm --filter @optimitron/web dev:fast > packages/web/.dev-server.log 2>&1 &
```

Then every Codex dispatch prompt for UI/rendering work includes:

> Dev server logs are streaming to `packages/web/.dev-server.log`. After loading any page in your fix-iterate loop, `tail -50 packages/web/.dev-server.log` and grep for `uncaughtException`, `Error:`, `⨯`, `Failed to compile`. A 200 response with errors in the log = broken render. Do not declare a fix verified until the log is clean for the route you touched.

If the dev server was started without that redirect (e.g., from a fresh laptop / IDE-triggered start), tell Codex: *"Dev server logs are not redirected to a file this session; load the page via Playwright MCP and use `browser_console_messages` for client-side errors. Ask the orchestrator to paste recent server stderr if you suspect a server-side issue."*

## Sequential agent coordination

**When a follow-up task would overlap files an active agent owns**, queue it as a follow-up to that agent's session via `codex exec resume`:

- `codex exec resume <uuid> "follow-up prompt"` — explicit, robust. Capture the UUID right after dispatch by globbing `~/.codex/sessions/$(date +%Y)/$(date +%m)/$(date +%d)/rollout-*.jsonl` (newest = the one you just spawned). UUID is the trailing hex segment of the filename.
- `codex exec resume --last "follow-up prompt"` — convenient but risky if other Codex sessions ran in between in the same cwd.

The session UUID is the only handle you get; capture it at dispatch time and store it for the life of the follow-up chain.

**Two Codex agents may run in parallel ONLY if the user has explicitly authorized them on disjoint file scopes within the same branch AND the second agent's work is genuinely additive to the first (not a coordinated refactor).** Default is one agent at a time on the current branch; parallel is the exception, not the norm.

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

## Pre-commit preflight (qa-passed gate)

Before any commit touching user-facing files (anything under `packages/web/src/app/`, `packages/web/src/components/`, `packages/web/src/lib/email/`, `packages/web/src/lib/tasks/`, or any `.md` snapshot), dispatch a Codex preflight agent with a goal-only prompt:

> "Validate this staged changeset. Read `git diff --cached --name-only` and `git diff --cached`. Decide what's relevant to regenerate (markdown snapshots? email previews? screenshots? none?), what tests to run, what artifacts to review. Run everything relevant. Read the output. Fix every problem you find. Iterate until clean. Don't ship until you'd put your own name on the commit. Report what you fixed and what's left."

**Don't enumerate file globs, test commands, or scope schemas.** Codex decides from the diff. Listing them is the same micromanaging anti-pattern as [[state-the-goal-not-the-script]].

When Codex returns clean, add a line to the commit message:

```
qa-passed: <one-line summary of what Codex found and fixed>
```

If Codex says nothing needs to run (e.g. the diff is pure meta-config that snuck through the gate), make the rationale explicit:

```
qa-passed: skipped — pure meta-config (.claude/, CLAUDE.md, .codex/, hooks)
```

The `verify-ui-changes.mjs` hook checks for the `qa-passed:` line on every commit touching user-facing files and blocks if missing.

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
