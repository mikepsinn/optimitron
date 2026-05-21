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

1. **Mikepsinn's verbatim message + Claude's cleaned interpretation + relevant historical context.** Three sub-parts, in this exact shape:

   a. **Verbatim quote** of Mike's current statement in a `>` blockquote. Zero mutation. Voice-to-text — typos expected.

   b. **Claude's cleaned interpretation** of intent in a second `>` blockquote, prefixed `[interpretation]:`. Fix ONLY obvious voice-recognition artifacts: URL spacing (`war on disease.org` → `warondisease.org`), doubled words, missing/extra punctuation, dictation-leakage ("Hey Google, set a timer..."). DO NOT fix: word choices that look weird but might be intentional ("missions", "lousy t-shirt", any phrase that changes strategic meaning if "corrected"). If a phrase is genuinely ambiguous, flag it inline as `[ambiguous: could mean X or Y]` rather than picking one.

   c. **Curated historical context** — 3-5 relevant verbatim quotes from earlier Mike statements on the same strategic thread, each in its own `>` blockquote with the turn label. NOT all 50+ messages from the session — just the strategic-arc ones on the same question. Codex's context budget shrinks if dumped wholesale.

   The split lets Codex re-read the raw if the cleaned version seems off, while sparing it the attention burden of disambiguating typos. The historical thread keeps Codex from re-deriving context Mike has already settled in prior turns.
2. **Investigate-before-coding** instruction: grep, read, understand. Don't trust the framing blindly.
3. **Push back if the request hurts the 4B-voters-on-the-treaty goal.** State the concern, propose to skip, wait for confirmation. Don't silently comply with work that doesn't move that needle.
4. **Argue back if Claude misread the user.** The verbatim quote makes this checkable.
5. **Regenerate affected `.md` snapshots and screenshots** after any content/component change. Use `node packages/web/scripts/affected-routes.mjs` to pipe changed-file paths into `render-pages-to-markdown.ts --routes=` for targeted regen; fall back to full regen when the change touches shared primitives.
6. **Nothing committed without user approval.** Codex stages the changeset and reports; Claude relays the summary + diff scope; user OKs; then Claude commits on Codex's behalf (Codex can't touch `.git`).

   **NO TEMP CLONES.** When Codex's sandbox can't write to the main repo's `.git/`, the correct behavior is to STOP. Do NOT create a temp clone (e.g. `.commit-work-*` / `.codex-verify-*`) to commit in, do NOT attempt `git push` from anywhere, do NOT try alternate paths to GitHub. The files Codex wrote are already in the main working tree — Claude picks them up via `git status` and commits + pushes from the main checkout. Temp clones are pure waste: every clone is a full-repo copy on disk (hundreds of MB), Codex's commit there is invisible to the main checkout, and the `git push` from the clone fails on auth anyway. Mike has flagged this 2× as a cleanup burden. The dispatch's last verification step should be "files written to main working tree + quality gates pass" — not "commit + push."
7. **TODO.md update in the same staged changeset.** If the work resolves an unchecked item in TODO.md, Codex must edit TODO.md (mark done with `commit:short-sha` evidence, or delete the line if redundant) IN THE SAME STAGED CHANGESET. If the work doesn't touch any TODO.md item, Codex must include `todo-skipped: <reason>` (e.g. "todo-skipped: net-new feature not previously listed") so the audit trail is explicit. Mike's TODO.md was 60%+ stale on 2026-05-17 because dispatches silently shipped work without closing the corresponding TODO lines — `enforce-codex-protocol.mjs` + `verify-ui-changes.mjs` now check this gate.

## NEVER run `next build` / `pnpm build`

`next build` writes to `.next/` (route manifests, server chunks, build IDs) that the running dev server is concurrently reading. When build and dev share the same `.next/`, the dev server starts logging `ENOENT` on missing-or-mid-write manifest files and stops returning bytes on every route. The fix is an orchestrator restart of the dev server. This will burn 5-10 minutes of investigation time every single time.

**Banned, no exceptions during a Codex session unless the orchestrator explicitly says otherwise:**
- `pnpm build`
- `pnpm --filter @optimitron/web build`
- `next build` directly
- Any script that calls `next build` transitively

**For "is the bundle compile-clean" sanity-check use ONLY:**
- `pnpm --filter @optimitron/web exec tsc --noEmit` or `typecheck:fast` — type-graph only, doesn't touch `.next/`
- Focused vitest suites — Node-only, doesn't touch `.next/`
- ESLint — Node-only, doesn't touch `.next/`

If you truly need a production-build sanity check (rare), tell the orchestrator first so the dev server can be stopped, build run, dev server restarted. Don't do it concurrently with a live dev server.

Concrete failure this rule prevents: this session, Codex ran `next build` as "offline sanity check" while the orchestrator dev server was running. Build succeeded but the dev server's `.next/server/.../manifest.json` reads started returning `ENOENT`. Every subsequent route hung. Cost: ~15 min of "is this a real bug or a dev-server problem" investigation before the orchestrator restart cleared it.

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

DO NOT default to `pnpm --filter @optimitron/web run e2e -- visual --grep <route>` for iteration verification. That command boots a dev/prod server, compiles routes, and runs screenshot capture — 5-10 minutes per filter. Reserve it for the FINAL pre-merge verification pass after the fix is known to work.

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

## Plan-first protocol for substantial work

Default for any Codex dispatch that touches >1 system, >100 lines, schema/CI, or matches the "I thought we had / why is this so" phrasing in CLAUDE.md HVD#13 (Diagram-before-code). Skip only for trivial single-file renames / one-liners / copy edits.

**Six steps. No skipping. No reordering.**

1. **Claude drafts the plan file.** Location: gstack convention (`~/.gstack/projects/<slug>/plans/<task-slug>.md`) or a project-local `.claude/plans/<task-slug>.md` if gstack isn't initialized for the repo. Required sections:
   - **Brief** — problem restated in Claude's own words.
   - **Research log** — REQUIRED before anything else. AI knowledge cutoffs make every vendor/API/tool assumption suspect. Before drafting current/proposed state, WebSearch + WebFetch the relevant vendor docs from the last 12 months. List: search queries run, URLs of canonical docs + their last-updated date if visible, any changelog entries from the last 6 months, anything that contradicts an assumption I'd otherwise have made from training data. If touching a third-party tool/API/SDK, the research log MUST cite the vendor's current docs (not "I think this works like X"). Examples of failures this catches: "Codex app-server is experimental, probably overkill" (false — it's the documented integration point), "Neon anonymized branches would be a 1-2 day project" (false — built-in feature GA late 2025).
   - **Current state — ASCII diagram** — boxes/arrows of the systems involved.
   - **Proposed state — ASCII diagram** — boxes/arrows after the change.
   - **Step list** — checkboxes Codex will tick off during implementation.
   - **Risks** — things that could go sideways.
   - **Files to touch** — Codex's expected scope.
   - **ALERTS** — orchestrator-edited, Codex re-reads top of every Phase-3 turn.
   - **Agent log** — Codex appends after each meaningful action.

2. **Codex criticizes the plan.** Dispatch via `codex review` (preferred for plan critique — adversarial, "tries to break") or `codex exec` with an explicit instruction to investigate the code AND argue against the plan: name what's wrong, what's missing, what's overcomplicated, what's a worse fix than the alternative. Codex must read the actual files referenced in the plan, not just react to the prose. Codex MUST also verify Claude's `## Research log` — re-WebSearch anything not cited with a recent vendor doc URL, name anything Claude assumed that's contradicted by current docs. Codex writes its critique INTO the plan file under a `## Codex critique (round N)` section.

3. **Claude + Codex iterate until agreement.** Claude responds to Codex's critique in the same plan file (`## Claude response (round N)`). If still disagreeing, dispatch Codex again. Stop when either: (a) both agree, OR (b) the disagreement is a taste call that needs Mike. Two rounds max — if not converged, escalate to step 4 as "Claude + Codex disagree on X, see plan file."

4. **Tell Mike the plan.** Summary in chat: plan file path, key decisions, any unresolved disagreements between Claude and Codex. Mike reads the plan file directly (it's the single source of truth).

5. **Mike approves, fixes, or rejects.** Mike edits the plan file directly OR responds in chat with redirects. Claude applies Mike's changes to the plan file. Loop back to step 4 if Mike's redirect was substantial.

6. **Codex implements.** Dispatch via direct `codex exec` (not the Agent wrapper — blocked by `.claude/hooks/block-codex-rescue-agent.mjs` anyway). Prompt includes: plan file path, the discipline rule "before any tool call, Read `<plan-path>` and check `## ALERTS`", and "append to `## Agent log` after each meaningful action; tick `## Step list` checkboxes as you go." Mike + Claude can edit `## ALERTS` mid-flight; Codex picks up on next turn boundary (turn-boundary latency, not real interrupt — use `codex app-server` upgrade for that, see below).

**For trivial dispatches**, skip steps 1–5. Dispatch directly via `codex exec` with a tight self-contained prompt. Trivial = single-file rename, one-liner, copy edit, OR something already designed in a prior plan file.

**If unsure whether a dispatch is substantial enough**: it is. Defaulting to plan-first costs maybe 20 minutes; defaulting to direct dispatch costs the kind of failures today's session demonstrated (anonymized-preview Codex run wasted, no plan, no visibility).

## Dispatch transport: prefer `@openai/codex-sdk` (or app-server)

**Default: `@openai/codex-sdk` npm package.** Official Node 18+ TypeScript SDK that wraps the codex CLI and exchanges JSONL events over stdin/stdout — gives us streamed agent events, parallel threads with stable IDs, and the protocol primitives (`turn/steer`, `turn/interrupt`) without writing a JSON-RPC client ourselves. **Not "couple hours of work" — it's `npm install @openai/codex-sdk`.** Previous claim was a stale-training-data error; see `feedback_websearch_vendor_capabilities_first.md`.

When NOT to use the SDK:
- **Truly trivial one-shots** (single-file rename, copy edit). Direct `codex exec '...' < NUL > log 2>&1` is cheaper than spawning an SDK process. Bypass the protocol with `trivial: <reason>` (per the enforce-codex-protocol hook).
- **Custom low-level transport needs** (WebSocket with auth, embedding in non-Node service). Use `codex app-server --listen ws://...` directly with bindings generated via `codex app-server generate-ts`.

**NOT `codex mcp-server`** — that's the wrong direction (lets Codex consume external MCP tools; doesn't let Claude drive Codex).

**Status:** SDK not yet adopted in this repo. The dispatch-side code still goes through Bash → `codex exec`. The `enforce-codex-protocol` hook accepts both shapes (any `codex exec` / `codex review` invocation with a plan-file or trivial bypass). Adopt the SDK when we hit the first failure mode `codex exec` doesn't cover (mid-turn steering, parallel agents needing live coordination). Tracked in TODO.md.

Sources:
- [Codex App Server (OpenAI Developers)](https://developers.openai.com/codex/app-server)
- [`@openai/codex-sdk` on npm](https://www.npmjs.com/package/@openai/codex-sdk)
- [Codex SDK overview](https://developers.openai.com/codex/sdk)

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
