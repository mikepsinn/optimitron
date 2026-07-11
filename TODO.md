# Optimitron TODO — Tactical Queue

Tactical queue only. Priorities and mission order: `AGENTS.md` §Mission Focus.
Product spec: `docs/PRD.md`. Feature status: `docs/FEATURES.md`. Sequencing and
cleanup backlog: `docs/ROADMAP.md`. Full history:
`docs/archive/TODO-history-2026-07.md` and `git show <sha>:TODO.md`.

**North star:** verified majority of humanity (~4B) voting YES on the 1% Treaty
referendum — 32 doubling rounds at 2 recruits per voter reaches ~4.3B. Sites:
`warondisease.org` (campaign), `1percenttreaty.org` (treaty text),
`optimitron.com` (app/proof engine). Every task roots under
`OPTIMIZE_EARTH_ROOT_TASK_ID` (`program:optimize-earth`).

## In Flight

- [ ] Execution-planner audit follow-through (`feature/mcp-execution-plan-audit`):
      TaskDifficulty removal, executionMode capability wiring, MCP output fixes.
      (Other agent; do not duplicate.)
- [ ] Documentation consolidation: `docs/PRD.md`, `docs/FEATURES.md`, ROADMAP
      rewrite, doc dedup, `docs/archive/`. (This pass.)

## Next Up

Bugs and concrete debt:

- [ ] MCP `getTask` double-escapes nested child descriptions (contamination
      vector; bug report a063947f, no fix commit found).
- [ ] Task-payout hardening remainder: cron reconciliation for VERIFIED claims
      with no `TaskPayout`; Stripe idempotency key on connected-account create;
      `AbortController` timeout on `stripeV2Request`; schema CHECK/FK hardening
      (needs Mike's schema approval).
- [ ] Backfill `jurisdictionId` on the 25 models added in PR #86.
- [ ] Login page: slider-to-submit spacing pushes CTA below the fold on mobile.
- [ ] Min-font-size enforcement remainder: email render-and-walk test, ESLint
      rule for `text-xs`/inline small fonts, named-token refactor of
      `email-styles.ts`.
- [ ] Email/template validation test: banned-phrase list, length cap, required
      tokens, single-primary-CTA assertion.
- [ ] `share-templates.ts` migration remainder: `post-vote-share` still builds
      from `share-message.ts`; final audit of `task-comment-notification`.
- [ ] "magic link" → "sign-in link" user-facing copy sweep.
- [ ] Apocalypse-phrasing standardization sweep (copy gate).
- [ ] Task-execution UX batch: whole-row click, `/tasks` heading/chip
      redundancy, hide empty columns, impact-inheritance "—" display policy,
      task-detail declutter, "Claim Task" → "Do this.", enum-label reframing,
      E2E regression for private-task access.
- [ ] Dashboard command-surface cleanup: dedupe embedded surfaces; Humanity
      Manager panel only if it adds a next-action.
- [ ] Referral: transitive chain counts on Humanity Manager status; copyable
      overdue-human/president messages on dashboard.
- [ ] Organization grant/application workflow persistence — first check overlap
      with the 2026-07-09 foundations share-letter calculator rewrite.
- [ ] AEOSP partner-org framing on `/join` — verify against PR #96 rewrites
      before treating as open.
- [ ] `/humanity-v-government` plaintiff-first rework: hero CTA, running
      plaintiff count, public death/plaintiff stream, counterfactual damages.
- [ ] `/court` operational surface: case caption, plaintiff/juror/defendant
      status, 193-government respondent parties.
- [ ] Represented-people pre-search + co-next-of-kin join flow.
- [ ] `/earth-optimization-day` MVP: countdown/RSVP + existing widgets.
- [ ] President/leader reminder tooling batch: rename consideration, dashboard
      link, copyable reminder language, managed-data-only.
- [ ] Startup-bro filler-word copy sweep (off-ramp, enforcement stack, …).
- [ ] Visual-review workflow batch: missing-screenshot banner, Neon
      branch-per-preview investigation, `/dev/email` index, GH Actions
      inline-JS extraction.

Trigger-gated (act when the trigger fires):

- [ ] Sitemap file splitting — trigger: any sitemap file approaches 500 rows.
- [ ] Bulk org-task import script — trigger: 200+ researched orgs in managed
      data.
- [ ] Server-side sign-in rate limiter — trigger: observed abuse.
- [ ] Poster follow-ups (style selector, OG variants, PDF export) — trigger:
      demand signal.

Needs Mike (one-line answers unblock):

- [ ] CI review artifact: the side-by-side prod/preview iframe + copy-diff spec
      never shipped despite `feature/ci-review-artifact` merging 5 PRs of other
      work — dropped, or still wanted?
- [ ] Shirt checkout: is `SHIRT_COMMERCE_ENABLED` live in prod? If yes, the
      launch-gates block in the archive is closed; if no, it's the checklist.
- [ ] Funding-sprint cost-benefit table (2026-05-19) archived as stale — its
      "write docs/funding-sprint.md" action never happened and its `/fund`
      defer verdict was overridden by shipped work. Re-derive if a
      distribution-sprint packet is still wanted.

## Recently Landed (since 2026-06-27)

- Personal Execution Planner (PR #107, 2026-07-10) + execution-planner
  hierarchy/MCP output fixes (PR #110, in flight).
- Four EV/MCP instrument bugs fixed: gross-vs-weighted EV, sibling-probability
  scaling, BigInt `ok()` crash, `listTasks(parentTaskId)` filter (PRs
  #105/#106/#108, through 2026-07-11).
- Task funding: assurance-contract escrow (PR #98); double-allocation race
  fixed via `withTaskFundingLock`; donations + Stripe Connect payouts (PR #97).
- EOS landing v2 "Government of Tomorrow" showroom (PR #99); registry sourcing
  + de-prescribed vote copy (PR #100).
- Preview/production deploy smoke tests live and hardened (`smoke-deploy.yml`).
- `/join` action list expanded + math-first rewrite (PR #96).
- Foundations share-letter calculator rewrite (2026-07-09).
- Vendored economic-data snapshot (PR #95); joke-page parameter calculations
  (PR #94).
- Codex hook cleanup (`.codex/hooks*` removed).

## Standing Policy

- Read the relevant `AGENTS.md` before package edits.
- Prisma schema or exported `@optimitron/db` type changes require explicit
  human approval.
- Library packages never import Prisma client or runtime DB code; `import type`
  only.
- `@optimitron/optimizer` stays domain-agnostic: predictor, outcome, variable,
  measurement, effect size.
- No second task model: personal, org-assigned, treaty-invite, and
  agent-proposed work are all `Task` rows with scoped ownership/visibility.
- Outreach stays on `Task` / `TaskCommunicationEndpoint` / `TaskCommunication` /
  `TaskComment` / `ReferralInvitation` / `ShareAttempt` / `EmailLog` — no
  special outreach models.
- Managed data is the source for semi-permanent records; missing from a
  manifest must not imply delete.
- Never write tests that only assert mocks were called.
- Never merge PRs; report ready for human review.
- Funding split: retail donations fund campaign operations; chain treasuries
  are a separate prize-pool track. Never divert charitable donations into the
  prize contract.
- Plan files need a Cost-Benefit Matrix before `/autoplan` final gate
  (hook-enforced); new-feature plans must acknowledge existing
  routes/branches/commits for the feature noun (hook-enforced).

## Commit Contract

Update this file in the same commit as the work it covers. Commit messages
carry `todo-touched: <item>` or `todo-skipped: <reason>` (advisory hook checks
commits touching `packages/web/src/`). Rule source: `CLAUDE.md`.
