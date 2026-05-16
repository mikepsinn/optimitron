# Copy review gate — Mike-as-LLM inline review automation

Slug: `copy-review-gate`
Created: 2026-05-15

## Brief

Wire the existing visual-review infrastructure to a **Stop-hook gate** so that every time Claude (or any other agent) makes a user-facing prose change in a turn, the turn cannot end until Mike has seen the rendered output and approved/rejected/complained-on each affected page. This puts Mike in the loop at the moment of change — not weeks later when he notices drift on a deployed page and has to argue Claude back to canon.

**Existing infrastructure to wire (no rebuild needed):**
- Visual-review HTML pipeline with mobile swipe carousel, "only changed" filter, complain-on-PR buttons, preview-page links, copy-context buttons — already built across `packages/web/scripts/build-visual-review.mjs` and ~15 recent commits (`1e1239f4`, `300d8e83`, `02e76ced`, `44b859b8`, `28cc2690`, `6c37e30f`, `067bbb98`, `ca04cc5a`, etc.)
- `packages/web/src/app/**/page.logged-out.md` snapshot regeneration via `pnpm --filter @optimitron/web copy:preview` (smart-mode, auto-detects affected routes)
- `.claude/hooks/verify-ui-changes.mjs` Stop-hook gate file (exists but unregistered)
- `.claude/hooks/post-push-watch-pr.mjs` PostToolUse hook (proves end-of-action orchestration works)
- AskUserQuestion tool (in-chat decision brief with options + "Other" freeform input)

**Net new code:** ~1 new hook file + state file + 1 settings.json edit + small affected-routes detector. Total: ~2 days, vs ~5 days for the i18n migration plan reviewers killed.

Mike's framing (verbatim, 2026-05-15): *"Treat me like an LLM and I am helping you... show me every single change through the markdown files or give me the link to the review thing and then allow me to either ask me a question with some buttons that say like looks good to me or nope and then other button so where I can just like freeform the audio of the complaints in it too so that you make sure that everything that should go into my eyeballs goes into my eyeballs before we merge and then I just complain and then you just fix stuff until everything looks good to me and then we merge."*

## Current state (ASCII)

```
   ┌─────────────────────────────────────────────────────────────────┐
   │  Claude / Codex / parallel agent makes a user-facing change     │
   │     packages/web/src/app/**/page.tsx                            │
   │     packages/web/src/components/**/*.tsx                        │
   │     packages/web/src/lib/routes.ts                              │
   │     packages/web/src/lib/messaging.ts                           │
   │     packages/web/src/lib/email/**, emails/**                    │
   └─────────────────────────────────────────┬───────────────────────┘
                                             │
                                             ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  PreToolUse hooks: block-snapshot-handedit, architecture-check  │
   │  (no review hook — change passes through)                       │
   └─────────────────────────────────────────┬───────────────────────┘
                                             │
                                             ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  Edit/Write succeeds → turn continues → eventually commits      │
   │  → push → CI generates visual-review HTML → posts as artifact   │
   │  → Mike sees it days later → argues drift back to canon         │
   └─────────────────────────────────────────────────────────────────┘
```

## Proposed state (ASCII)

```
   ┌─────────────────────────────────────────────────────────────────┐
   │  Claude / Codex / agent makes a user-facing change              │
   └─────────────────────────────────────────┬───────────────────────┘
                                             │
                                             ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  PostToolUse hook on Write/Edit/MultiEdit: copy-review-gate.mjs │
   │   IF file_path matches user-facing prose glob set:              │
   │     append { route, file, snippet, ts } to                      │
   │       .claude/state/copy-review-queue.json                      │
   │   ELSE no-op                                                    │
   └─────────────────────────────────────────┬───────────────────────┘
                                             │ (multiple edits accumulate)
                                             ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  Stop hook: copy-review-gate.mjs (mode: stop)                   │
   │   IF .claude/state/copy-review-queue.json is non-empty:         │
   │     run `pnpm --filter @optimitron/web copy:preview` to regen   │
   │       affected snapshots (smart-mode auto-detects routes)       │
   │     run build-visual-review for the affected routes →           │
   │       packages/web/output/playwright/review/latest.html         │
   │     EXIT 2 with stderr message:                                 │
   │       "User-facing prose changed on N routes. Before turn end,  │
   │        fire AskUserQuestion with:                               │
   │          - question: 'Review {N} prose changes?'                │
   │          - options: ['Approve all', 'Reject specific page',     │
   │                       'Other' (Mike's freeform/audio)]          │
   │          - description includes: review-HTML local path,        │
   │            preview-deploy URL (per memory feedback_preview_     │
   │            urls_for_mobile_user), per-route diff summary"       │
   └─────────────────────────────────────────┬───────────────────────┘
                                             │
                          ┌──────────────────┴──────────────────┐
                          ▼                                     ▼
   ┌──────────────────────────────────┐   ┌──────────────────────────────────┐
   │  Mike clicks "Approve all"       │   │  Mike clicks "Reject" or "Other" │
   │   hook reads response, clears    │   │   hook reads response,           │
   │   queue, allows turn-end         │   │   appends Mike's complaint to    │
   │                                  │   │   queue["pending_fixes"], blocks │
   │                                  │   │   turn-end again until Claude    │
   │                                  │   │   addresses each complaint       │
   └──────────────────────────────────┘   └──────────────────────────────────┘
                          │
                          ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  Turn ends. Changes commit. Push. PR.                           │
   │  No drift reaches main because Mike's eyeballs already passed   │
   │  each rendered output.                                          │
   └─────────────────────────────────────────────────────────────────┘
```

## Step list

### Day 1 — Hook scaffold + detection + state

- 1.1. Create `.claude/hooks/copy-review-gate.mjs`. Single file, two modes (PostToolUse on Write/Edit, Stop on turn-end). Modeled on existing `verify-ui-changes.mjs:1` pattern (cross-platform Node, stdin JSON, exit-code semantics).
- 1.2. State file at `.claude/state/copy-review-queue.json`. Schema: `{ session_id: string, pending_reviews: Array<{ route: string, file: string, snippet: string, ts: string }>, mike_response: null | { verdict: "approved-all" | "rejected" | "freeform", details?: string } }`.
- 1.3. PostToolUse mode: parse `tool_input.file_path`. Match against user-facing prose globs: `packages/web/src/app/**/*.tsx`, `packages/web/src/components/**/*.tsx`, `packages/web/src/lib/routes.ts`, `packages/web/src/lib/messaging.ts`, `packages/web/src/lib/email/**`, `packages/web/emails/**`. SKIP if: file is `.test.ts` / `.spec.ts`, file is `.css`, change touches only `className` / `href` / `aria-*` attrs (best-effort regex). For Write: extract first 200 chars of prose-shaped content. For Edit: extract `new_string`. Append to queue.
- 1.4. Affected-route detection: reuse `packages/web/scripts/affected-routes.mjs` (referenced in CLAUDE.md as the smart-mode driver for `copy:preview`). Map each touched file to the route(s) it renders.
- 1.5. Self-test: edit a route, confirm queue file gets appended. Edit a CSS file, confirm queue stays empty.

### Day 2 — Stop hook integration + AskUserQuestion content

- 2.1. Stop mode: read queue file. If non-empty, run `pnpm --filter @optimitron/web copy:preview` to regen snapshots (timeout 30s — generous because hook ran AFTER the work, not blocking interactive editing). Then trigger visual-review HTML regen via existing `build-visual-review.mjs`.
- 2.2. Stop mode exit-code-2 stderr template (this is what Claude sees and must act on):
  ```
  [copy-review-gate] N user-facing prose changes pending Mike review.
  Cannot end turn until Mike approves/rejects each.

  Routes touched: <list>
  Review HTML (local):  packages/web/output/playwright/review/latest.html
  Preview URLs (mobile-friendly per feedback_preview_urls_for_mobile_user):
    https://optimitron-pr<N>-<hash>.vercel.app/<route>?_vercel_share=<token>

  Before ending turn, call AskUserQuestion with:
    question: "Approve N prose changes on routes X, Y, Z? See <review-html-link>."
    options:
      - "Approve all (recommended if rendering looks good)"
      - "Approve route <X> only"
      - "Reject - I have complaints" (Mike uses Other for freeform)

  When Mike responds:
    - "Approve all" → call .claude/hooks/copy-review-gate.mjs --clear-queue
    - "Approve route X only" → call .claude/hooks/copy-review-gate.mjs --partial-clear=X
    - "Reject" + freeform: append Mike's text to queue.pending_fixes, address each, then re-run Stop hook (gate re-fires until queue empty)
  ```
- 2.3. Hook supports two CLI flags Claude invokes via Bash: `--clear-queue` (approve-all path), `--partial-clear=<route>` (per-route approve). Both rewrite queue file accordingly.
- 2.4. Register hook in `.claude/settings.json`:
  ```json
  "PostToolUse": [
    { "matcher": "Write", "hooks": [{ "type": "command", "command": "node $CLAUDE_PROJECT_DIR/.claude/hooks/copy-review-gate.mjs --post", "timeout": 3000 }] },
    { "matcher": "Edit",  "hooks": [{ "type": "command", "command": "node $CLAUDE_PROJECT_DIR/.claude/hooks/copy-review-gate.mjs --post", "timeout": 3000 }] },
    { "matcher": "MultiEdit", "hooks": [{ "type": "command", "command": "node $CLAUDE_PROJECT_DIR/.claude/hooks/copy-review-gate.mjs --post", "timeout": 3000 }] }
  ],
  "Stop": [
    { "hooks": [{ "type": "command", "command": "node $CLAUDE_PROJECT_DIR/.claude/hooks/copy-review-gate.mjs --stop", "timeout": 60000 }] }
  ]
  ```
  Note: Stop hook gets 60s because it runs `copy:preview` which takes ~10-20s in smart mode.

### Day 3 — Tune, batch, dogfood, docs

- 3.1. Test against a synthetic turn that edits 5 different prose files → confirm queue accumulates, Stop hook fires once with batched AskUserQuestion, all 5 routes are listed.
- 3.2. Test the freeform path: Mike says "the welfare claim on /humanity-v-government is too aggressive, soften it." Hook appends to `pending_fixes`. Claude reads it next turn, addresses it, queue clears.
- 3.3. Test the off-path: Mike unavailable / hook fails. Hook fail-OPEN with explicit stderr warning + audit log entry (per cycle-#1 reviewer consensus: fail-closed bricks offline work).
- 3.4. False-positive triage: run the hook on a turn that only changes test fixtures, ensure no queue entry. Run on a turn that only renames a prop, ensure no queue entry. Run on a turn that adds className conditional, ensure no queue entry.
- 3.5. Document in CLAUDE.md under a new "Mike review gate" section (~5 lines): "User-facing prose changes trigger an inline review gate. Claude cannot end the turn until Mike approves each touched route via AskUserQuestion. The gate state lives at `.claude/state/copy-review-queue.json`. Disable for a single turn with `// review-gate: skip` comment in the prompt; the hook reads that and bypasses."
- 3.6. Update TODO.md row: "Mike review gate: shipping date, measure 'founder hours arguing about copy' weekly."

## Files to touch

| Path | Action | Phase |
|---|---|---|
| `.claude/hooks/copy-review-gate.mjs` | create | Day 1 |
| `.claude/state/copy-review-queue.json` | create (initial empty schema) + .gitignore entry | Day 1 |
| `.claude/settings.json` | edit (register PostToolUse + Stop hooks) | Day 2 |
| `.gitignore` | edit (add `.claude/state/`) | Day 1 |
| `CLAUDE.md` | edit (new "Mike review gate" section) | Day 3 |
| `TODO.md` | edit (add review-gate ship row + weekly metric) | Day 3 |
| `packages/web/scripts/affected-routes.mjs` | possibly edit (export the helper if currently CLI-only) | Day 1 |

## Risks

1. **Stop hook can't directly call AskUserQuestion** (tool calls are assistant-only). Mitigation: the hook's exit-2 stderr message explicitly instructs Claude to call AskUserQuestion next, and Claude reads stderr as continuation context. This is the same pattern `enforce-codex-protocol.mjs:99` uses ("blockWith" function writes stderr; Claude follows the instructions). Verified working in existing hooks.

2. **Stop hook re-fires after Claude calls AskUserQuestion** (infinite loop). Mitigation: `verify-ui-changes.mjs:34` already has the pattern: `if (hookData?.stop_hook_active === true) process.exit(0);`. Re-use this. Plus: the queue clears via `--clear-queue` flag invocation, so the next Stop firing sees empty queue and exits 0.

3. **Mike's "Other" freeform input gets lost.** AskUserQuestion's "Other" returns the user's text as the answer. Claude reads it, hook can't directly. Mitigation: Claude writes Mike's text to `queue.pending_fixes` before invoking the hook's clear/partial-clear flag.

4. **False positives kill Mike's attention.** If the hook fires on every test edit, Mike stops reading. Mitigation: tight glob set + extension filter + content-shape heuristic (skip if change is pure className/href). Day 3.4 explicitly tests these. Acceptance: <1 false positive per 10 turns of non-prose work.

5. **Snapshot regen takes too long.** `copy:preview` in smart mode is usually <20s but can take 60s+ in full mode. Mitigation: hook timeout is 60s; if regen fails, hook STILL blocks turn-end but stderr explains "snapshot regen failed; manually run `pnpm copy:preview` then re-end turn" — Claude can retry.

6. **Mike unavailable / AFK.** Hook fails closed → all work stops. Mitigation: explicit bypass `// review-gate: skip` comment in user prompt OR env var `OPTIMITRON_REVIEW_GATE=off` for batch/CI runs. Per `feedback_default_opinionated_no_escape_hatches`: the bypass leaves a trail in the audit log so Mike can spot abuse.

7. **The "complain on PR" button already exists.** Visual-review HTML already has a per-screen 💬 button (commit `1e1239f4`) that opens GitHub for inline comments. This plan adds an IN-CHAT path. Two channels for the same intent. Mitigation: the buttons coexist — in-chat for pre-merge (Mike + Claude live), GitHub for post-merge review. Both useful.

8. **Other agents (not Claude Code in this terminal) bypass the hook.** Cursor, Aider, direct human edits don't run our hooks. Mitigation: the hook is layer-3 (best-effort safety net for the most common attack vector — Claude/Codex edits). Other surfaces still have CI gates (visual-review HTML generation runs on every PR, complain-on-PR buttons available there).

9. **Hook interacts with `verify-ui-changes.mjs`.** That hook already fires on Stop. Mitigation: extend `verify-ui-changes.mjs` to ALSO check the copy-review-queue, OR run them sequentially (Stop matcher accepts an array of hooks). Day 2.4 wires them serially: verify-ui first (snapshots not hand-edited, ParameterValue rules), then copy-review-gate (Mike approval). Both must pass.

10. **PR #81 currently has 2 web-validate CI failures** unrelated to this plan. Plan does not address them; they're independent and need separate triage.

## Research log

**Existing infrastructure to wire (no rebuild needed):**
- Visual-review HTML pipeline: `packages/web/scripts/build-visual-review.mjs` (uncommitted edits show lazy-loaded pixelmatch, auth route filter, markdown-diff cache — another agent's in-flight work that this plan benefits from).
- Visual-review HTML lives at `packages/web/output/playwright/review/latest.html` per CLAUDE.md "Local before/after review artifacts" rule.
- Commits building the visual-review UI (last 24h): `1e1239f4` (💬 complain button), `300d8e83` (copy-context button), `02e76ced` (preview-page link), `44b859b8` (mobile swipe carousel), `28cc2690` (diff-ratio threshold), `6c37e30f` (DOM order fix), `067bbb98` (current-route refresh), `ca04cc5a` (sticky-header fix), `577d7f72` (backtick-escape fix). These cumulatively built the UI Mike's vision describes.
- Snapshot regen: `pnpm --filter @optimitron/web copy:preview` is smart-mode (auto-detects affected routes via `packages/web/scripts/affected-routes.mjs`). CLAUDE.md "Never hand-edit page.logged-out.md" rule.
- `.claude/hooks/verify-ui-changes.mjs:1` — existing Stop-hook gate FILE (not currently registered in settings.json). Provides the pattern this plan extends.
- `.claude/hooks/post-push-watch-pr.mjs` — registered as PostToolUse on Bash. Proves the PostToolUse → external orchestration pattern works.
- `.claude/hooks/enforce-codex-protocol.mjs:99` — `blockWith()` helper showing the exit-2-with-stderr pattern Claude reads as continuation context.

**Claude Code Hooks API:**
- Hooks receive JSON via stdin, write to stderr on block, exit 2 to block tool/turn.
- Stop hook fires when the assistant attempts to end its turn; exit 2 forces assistant to continue.
- `hookData.stop_hook_active` flag prevents infinite loops (set when Stop hook is currently active).
- AskUserQuestion is an assistant-callable tool, NOT a hook-callable mechanism. Hooks instruct via stderr; the assistant invokes the tool.

**Mike's verbatim vision (2026-05-15):**
> "Treat me like an LLM and I am helping you and War and disease and like you just like show me look at the recent changes on our review HTML file. so can you just like constantly ask me questions like if something is okay or not and and let me complain about it like show me every single change through the markdown files or give me the link to the review thing and then allow me to like either ask me a question with some buttons that say like looks good to me or nope and then other button so where I can just like freeform the audio of the complaints in it too so that you make sure that everything that should go into my eyeballs goes into my eyeballs before we merge and then I just complain and then you just fix stuff until everything looks good to me and then we merge."

**Memory entries informing this plan:**
- `feedback_preview_urls_for_mobile_user` — AskUserQuestion options MUST link Vercel preview URLs, not localhost. Mike reviews from mobile.
- `feedback_repeat_askquestion_options_in_chat` — Claude must print full option labels in chat BEFORE calling AskUserQuestion (mobile widget truncates).
- `feedback_default_opinionated_no_escape_hatches` — the `// review-gate: skip` bypass leaves an audit-log entry; no silent flag.
- `feedback_do_not_dissuade_autoplan_for_new_tools` — this plan IS the kind of new-tool work that warrants /autoplan; the meta-rule is honored by running /autoplan on this file before implementation.
- `feedback_promote_violated_text_rules_to_hooks` — entire plan IS the embodiment of this rule: active hook enforcement of the previously-passive "Mike reviews UI" expectation.

## Dependencies

- **`feature/optimize-earth-root-delay-stats` branch and PR #81 are independent.** This work should ship on a fresh `feature/copy-review-gate` branch after PR #81 lands, OR bundle into PR #81 if Mike wants the gate active immediately to gate PR #81's own remaining changes (per `feedback_bundle_into_existing_branches` for small tooling).
- **Other agent's uncommitted edits to `packages/web/scripts/build-visual-review.mjs`** must be committed (or stashed/abandoned) before this plan's Day 1 starts, to avoid merge conflicts on the same file.
- **`packages/web/scripts/affected-routes.mjs`** must exist and expose its helper as a library function (currently CLI-only per CLAUDE.md reference). Day 1.4 verifies + edits if needed.

## ALERTS

(empty)

## Agent log

(empty)

## Claude subagent critique (round 1)

*(to be filled in by /autoplan Phase 1 CEO + Phase 3 Eng dual-voice review)*

## Codex critique (round 1)

*(to be filled in by /autoplan Phase 1 CEO + Phase 3 Eng dual-voice review)*

## Dual-voice consensus

*(to be filled in after both critiques complete)*

## Mike approved

*(awaiting /autoplan Phase 4 final approval gate)*
