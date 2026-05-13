---
name: qa
description: Single-command pre-commit audit — fires voice-critic, cold-stranger-ux, and test-auditor in parallel and consolidates findings into one numbered punch list. Use this before every commit that touches user-facing surfaces so the user doesn't have to remember which individual critic to invoke.
user_invocable: true
---

# /qa — one audit command, three critics

When the user types `/qa`, run all the project's editorial + UX critics over the current branch state and report a single consolidated punch list. The point is to eliminate "I forgot to run voice-critic" gaps — one command does all of them.

## What to fire

Up to five subagents IN PARALLEL via the `Agent` tool (single message, multiple tool calls):

1. **`voice-critic`** — Copy critique against project voice rules. Catches startup-bro phrasing, banned vocabulary (engage, empower, off-ramp, primitive), tautological hints under headings, adjective stacks with no number, Stripe-keynote sentences. Required to call `mcp__optimitron-tasks__searchManual` before proposing replacement copy, and to grep `parameters-calculations-citations.ts` for every hardcoded user-facing number.
2. **`cold-stranger-ux`** — Zero-context first-time reader reaction. Drives a real browser at iPhone-14 viewport, takes screenshots, reacts in plain English. Catches confusing UX, missing case-for-action, would-bail moments.
3. **`visual-design-auditor`** — Visual slop audit. Third critic beside voice (copy) and cold-stranger (UX): is the visual design actually good against the treaty editorial style?
4. **`test-auditor`** — Test suite slop + missing coverage. Catches "tests added for symmetry / documentation / to silence a bot" and missing regression tests for fixed bugs.
5. **`security-threat-review`** — OWASP Top 10 + STRIDE pass. Conditional: fire only when the diff touches an auth/session/signature/token/consent path (look for matches in `packages/web/src/lib/auth*`, `packages/web/src/app/api/**`, `*-token*`, `*-consent*`, `*signature*` files).

Skip rules:
- No `.tsx` / `.md` content changed → skip `voice-critic`.
- No UI changed → skip `cold-stranger-ux` and `visual-design-auditor`.
- No test files changed → skip `test-auditor`.
- No auth/security paths changed → skip `security-threat-review` (it's heavy; don't fire it on every commit).

## Scope each invocation

Before dispatching, run `node packages/web/scripts/affected-routes.mjs` to enumerate the routes whose page.tsx files import the changed components. Pass that route list to `cold-stranger-ux` so it doesn't drive the whole site — only the surfaces that actually moved.

For `voice-critic`, scope to the changed `.tsx` files + their regenerated `.md` snapshots.

## Output format

After all return, produce ONE numbered punch list:

```
## /qa findings on <branch> (HEAD <short-sha>)

### Voice (N findings)
1. <file>:<line> — <what's wrong> — <fix or "intentional?">

### Cold-stranger UX (N findings)
1. <page>: <what a stranger would think / where they'd bail>

### Visual design (N findings)
1. <component/page>: <visual slop or treaty-style violation>

### Tests (N findings)
1. <test file>: <stupid test reason OR missing regression coverage>

### Security (N findings, only if security-threat-review fired)
1. <file>:<line>: <OWASP/STRIDE finding with confidence>

### Verdict
SHIP / NEEDS FIXES BEFORE COMMIT / NEEDS USER DECISION

If NEEDS FIXES: which findings are deal-breakers vs. nice-to-have?
If NEEDS USER DECISION: what specifically is the call to make?
```

## When NOT to run /qa

Don't run on commits that only touch:
- `.claude/`, `.codex/`, `.husky/` (meta-config)
- `CLAUDE.md`, `TODO.md`, `AGENTS.md` (docs)
- `packages/web/scripts/`, `packages/web/e2e/` (tooling)
- Pure dependency bumps in `package.json` / `pnpm-lock.yaml`

For everything else — yes, run it before committing.

## What this skill explicitly does NOT do

- Doesn't write code.
- Doesn't commit.
- Doesn't auto-fix findings — surfaces them and waits for the user's call.
- Doesn't replicate the pre-commit hooks. Hooks are mandatory blocking gates; `/qa` is a higher-signal advisory pass meant for editorial judgment that hooks can't make.

## Standard operating procedure

The user has codified this as the standard pre-commit ritual:

1. Make the change.
2. Run `pnpm --filter @optimitron/web copy:preview -- --routes=$(node packages/web/scripts/affected-routes.mjs)` to regenerate affected snapshots.
3. Run `/qa`.
4. Fix any deal-breakers; mark hand-waves intentional with a one-line comment in the commit.
5. Commit.

If `/qa` returns "SHIP" verdict and the pre-commit hooks pass, the change is ready. The user doesn't need to remember `voice-critic` / `cold-stranger-ux` / `test-auditor` as separate invocations.
