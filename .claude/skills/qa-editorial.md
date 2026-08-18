---
name: qa-editorial
description: Project-specific editorial audit. Fires voice-critic, cold-stranger-ux, and test-auditor in parallel and consolidates findings. Catches Wishonia-voice violations, manual-quote-overlay opportunities, and parameter-citation gaps.
user_invocable: true
---

# /qa-editorial — project-specific editorial quality gate

When the user types `/qa-editorial`, run the project's editorial + UX critics over the current branch state and report a single consolidated punch list. This is the Wishonia-voice / treaty-editorial / project-specific layer.

## What to fire (in parallel)

Three subagents IN PARALLEL via the `Agent` tool:

1. **`voice-critic`** — Copy critique against project voice rules. Catches startup-bro phrasing, banned vocabulary (engage, empower, off-ramp, primitive), tautological hints under headings, adjective stacks with no number, Stripe-keynote sentences. **Required to call the Optimitron MCP `searchManual` tool** before proposing replacement copy, and to grep `parameters-calculations-citations.ts` for every hardcoded user-facing number. If MCP isn't wired, fall back to `curl https://manual.warondisease.org/assets/json/search-index.json` — same content, no auth.
2. **`cold-stranger-ux`** — Zero-context first-time reader reaction. Drives a real browser at iPhone-14 viewport, takes screenshots, reacts in plain English. Catches confusing UX, missing case-for-action, would-bail moments.
3. **`test-auditor`** — Test suite slop + missing coverage. Catches "tests added for symmetry / documentation / to silence a bot" and missing regression tests for fixed bugs.

Skip rules:
- No `.tsx` / `.md` content changed → skip `voice-critic`.
- No UI changed → skip `cold-stranger-ux`.
- No test files changed → skip `test-auditor`.

## Scope each invocation

Before dispatching, run `node apps/optimitron/scripts/affected-routes.mjs` to enumerate the routes whose page.tsx files import the changed components. Pass that route list to `cold-stranger-ux` so it doesn't drive the whole site — only the surfaces that actually moved.

For `voice-critic`, scope to the changed `.tsx` files + their regenerated `.md` snapshots.

## Output format

After all return, produce ONE numbered punch list:

```
## /qa-editorial findings on <branch> (HEAD <short-sha>)

### Voice (N findings)
1. <file>:<line> — <what's wrong> — <fix or "intentional?">

### Cold-stranger UX (N findings)
1. <page>: <what a stranger would think / where they'd bail>

### Tests (N findings)
1. <test file>: <stupid test reason OR missing regression coverage>

### Verdict
SHIP / NEEDS FIXES BEFORE COMMIT / NEEDS USER DECISION

If NEEDS FIXES: which findings are deal-breakers vs. nice-to-have?
If NEEDS USER DECISION: what specifically is the call to make?
```

## When NOT to run /qa-editorial

Don't run on commits that only touch:
- `.claude/`, `.codex/`, `.husky/` (meta-config)
- `CLAUDE.md`, `TODO.md`, `AGENTS.md` (docs)
- `apps/optimitron/scripts/`, `apps/optimitron/e2e/` (tooling)
- Pure dependency bumps in `package.json` / `pnpm-lock.yaml`

For everything else — yes, run it before committing.

## What this skill explicitly does NOT do

- Doesn't write code.
- Doesn't commit.
- Doesn't auto-fix findings — surfaces them and waits for the user's call.

## Standard pre-commit ritual

1. Make the change.
2. Run `pnpm --filter @optimitron/web copy:preview -- --routes=$(node apps/optimitron/scripts/affected-routes.mjs)` to regenerate affected snapshots.
3. Run `/qa-editorial` — the project-specific editorial layer.
4. Fix any deal-breakers; mark hand-waves intentional with a one-line comment in the commit.
5. Commit with `qa-passed:` line.

If `/qa-editorial` returns "SHIP" verdict and the pre-commit hooks pass, the change is ready.
