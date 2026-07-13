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

## Agent handoff — 2026-07-12 evening (session ending)

- **This PR (`feature/docs-model-comment-privacy`):** comment-privacy gate
  (0607410f — fixes anonymous reads of private-task comments, verified leak on
  prod) + single GA ID (6b35688d — `NEXT_PUBLIC_GA_MEASUREMENT_ID` for all
  sites; Mike still owes the GA4 Admin "Configure your domains" click for
  cross-domain sessions) + Document model v1 (Prisma `Document` + versions,
  MCP createDocument/updateDocument/getDocument/listDocuments,
  `/documents/[id]`, task-page doc list). Re-mirror grant drafts as task
  comments only once the comment-privacy fix is confirmed LIVE IN PRODUCTION
  (not just merged — a merge can lag deploy) and a smoke test confirms
  anonymous GET on a private task returns no comments; they're
  PUBLIC-readable until this actually deploys.
- **Next dev tasks (specs in Optimitron, EV-ranked):**
  `optimitron:dev:llms-txt-comprehensive` (cmridzl5n — llms.txt is
  campaign-only; must expose MCP/API/directories, generate from `routes.ts`);
  `optimitron:dev:person-capability-profile` (cmridvdbt —
  GitHub-profile-style redesign of `/people/[handle]`; full spec + Mike's
  critique in task comments; bio/headline currently DON'T render on the page —
  worst defect); `optimitron:dev:createtask-deadline-policy` (cmri8tcvz —
  EXPIRES silently downgraded to SOFT);
  `optimitron:dev:task-tree-visualization` (cmri3k975); extension OAuth
  end-to-end live verification (PR #113 merged, untested against prod).
- **Funding/prizes:** task tree under `funding:prizes-2026-q3` (cmri80ldt) —
  Coefficient Giving due Aug 21 (top priority), Schmidt go/no-go Jul 25,
  XPRIZE Future Vision due Aug 15, Build with Gemini decide Jul 20; every
  Apply task has a Review-&-SUBMIT child for Mike with an embedded
  browser-agent prompt; drafts in Notion under "Grant Applications Q3 2026" +
  mirrored as task comments.
- **Binding content rules (Mike, 2026-07-12):** never name QuantiModo/CureDAO
  in application narratives (claim the work: 10+ yrs open-source health
  infra, studies.dfda.earth); never claim cures are known-but-withheld (95%
  of diseases have no treatment — the machine FINDS cures); "but the economy"
  always paired with the math-error counter
  (`war_counterfactual_income_multiple`); Optimitron = OPG/OBG optimal
  policies+budgets, not just "move 1%"; canonical bio =
  optimitron.com/people/mike; film/script/public-argument content lives in
  the manual repo (canonical educational film:
  `manual/knowledge/educational-film.qmd`), Notion only for private drafts.
- **Mike's open decisions:** icon pick (64 candidates, sheets in
  chat/scratchpad), Coefficient applicant entity (AMF 501c3 vs EOS PBC —
  rec: AMF), bio scale figure (10M+ data points vs 50k+ studies), merge this
  PR.

## In Flight

- [ ] Execution-planner audit follow-through (`feature/mcp-execution-plan-audit`):
      TaskDifficulty removal, executionMode capability wiring, MCP output fixes.
      (Other agent; do not duplicate.)
- [x] Documentation consolidation: `docs/PRD.md`, `docs/FEATURES.md`, ROADMAP
      rewrite, doc dedup, `docs/archive/` (committed b9834f37).
- [x] dFDA tracking MCP tools (companion-loop stage 1 capture): recordMeasurement,
      upsertTrackingReminder, listTrackingReminders, listDueTrackingReminders,
      respondToTrackingReminder — applied from stash, response-shape bug fixed,
      7 behavioral tests added (OPT-HEALTH-02/06 groundwork). Deploy unlocks
      measurement writes + re-parenting (updateTask parentTaskId ships too).
- [ ] Post-deploy: execute the 77-task re-parenting plan (clusters approved in
      session 2026-07-11), re-parent personal:health:* tasks from `dfda` to the
      health container, create Optimize Optimitron dev branch + edges.

## Next Up

- [ ] EOS retro landing Phase B (`feature/eos-landing-retro` shipped Phase A;
      round 2 restructured it exhibits-first, money-last):
      homepage variant flip pending Mike approval (one-liner in `app/page.tsx`);
      extend sanctioned dark theme to `/fund`; add parameters for numbers now
      copy-only (Engine No. 1 facts, dFDA 12M datapoints / 10K contributors,
      use-of-proceeds $500K/$1M/$2M ladder, model parameter count "670");
      spec §9 "thirteen channels" upside passage not in manual — used canonical
      flywheel passage instead, restore if Mike supplies the source.
- [ ] EOS landing round-2 follow-ups: dFDA exhibit card is an illustrative
      statin sample (labeled) — wire to a real studies.dfda.earth feed;
      collapse-clock parasitic-base calibration (11.5% @ 2020) copied from the
      Sierra slide — promote to a parameter; pavilion grid "expand" is
      anchor-scroll, revisit if Mike wants in-place expansion.

- [ ] Door-to-door YES sheet follow-ups (`/door-to-door` shipped on
      `feature/eos-landing-retro`): optional full-treaty-text back page;
      per-referendum sheet generalization (3 referendums configured; only the
      treaty has a live vote flow today); phase-2 canvass upload flow (sheet
      photo → sourceArtifact → represented votes — needs `ReferendumVote`
      provenance field + paper-pending vote source, schema change requires
      Mike's approval); canvass mission task under the campaign branch once
      the optimitron MCP connector is re-authed.
- [ ] OPG generated-data quality: 18 of 23 US policy rows are templated
      "Category: Adopt Country X's Approach" benchmark transplants with
      copy-pasted effect pairs. Landing exhibit now filters them
      (`PolicyGradeTable.topDistinctPolicies`) — fix the generator to emit
      distinct defensible per-category estimates, then drop the filter.
- [ ] /compute "Basement Professor" follow-ups (Phase 1 shipped on
      `feature/eos-landing-retro`): scheduled price-snapshot refresh
      (eBay/vast.ai) instead of hand-curated asOf dates; per-card price
      history; sovereign-compute program task under `optimize-earth` +
      basement-node MCP client spec (getAIQueue worker loop); install-lead
      handling beyond the mailto CTA.

- [x] Document model v1 (task `optimitron:dev:document-model`): versioned
      markdown `Document` rows (new version = new row, `isCurrent` flips in a
      transaction), private by default; MCP createDocument / updateDocument /
      getDocument / listDocuments; `/documents/[id]` page with version list +
      creator-only editor; task page lists attached documents.
- [ ] Document model follow-ups: `/documents` index page; delete/archive
      endpoint (schema has `deletedAt` as of 2026-07-12 per Mike's call on PR
      #114 review — reads already filter it out — but no delete/archive API
      or UI wired to set it yet); visibility levels beyond PUBLIC/PRIVATE
      (org-shared); move a Notion working doc across as the first dogfood.

Bugs and concrete debt:

- [x] Private-task comment leak (task `optimitron:dev:comment-visibility-gate`):
      anonymous GET `/api/tasks/<id>/comments` returned comments for PRIVATE
      tasks. Feed, activity timeline, comment votes, and comment posting now
      reuse the /tasks/[id] predicate (`lib/tasks/task-visibility.server.ts`);
      private tasks 404 like missing ones. Note: org-member access is not in
      the page predicate, so it is not in the comment gate either — extend the
      shared predicate deliberately if ever wanted.
- [x] Single GA measurement ID: `site.ts` read `NEXT_PUBLIC_GA_DFDA_ID` /
      `NEXT_PUBLIC_GA_DIH_ID` / `NEXT_PUBLIC_GA_WAR_ON_DISEASE_ID`, none of
      which were set — warondisease.org served no GA tag. All sites now use
      `NEXT_PUBLIC_GA_MEASUREMENT_ID` (Mike's call, 2026-07-12).
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
- [ ] Add `DEFENSE_NET_PROFIT_MARGIN`, `PHARMA_NET_PROFIT_MARGIN`,
      `PHARMA_VS_DEFENSE_NET_MARGIN_RATIO` to the external `dih_models/parameters.py`
      generator source (not in this repo) so the next regeneration of
      `parameters-calculations-citations.ts` doesn't drop them (PR #112 review).
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
- Copy commits require Mike seeing verbatim before/after + approving via
  AskUserQuestion first (binding convention; blocking hooks retired
  2026-07-12 — all pre-commit checks are advisory now, new hooks only when
  Mike asks).

## Commit Contract

Update this file in the same commit as the work it covers. Commit messages
carry `todo-touched: <item>` or `todo-skipped: <reason>` (advisory hook checks
commits touching `packages/web/src/`). Rule source: `CLAUDE.md`.
