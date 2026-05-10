# Optimitron TODO — 4 Billion Votes on the 1% Treaty

This file is the working priority list. The North Star is the only thing on the site:
get majority of humans on the 1% Treaty referendum at warondisease.org. Everything
else either feeds that funnel or is parked.

Old multi-page TODO contents (sprint plans S1-S10, multi-agent architecture, dead-people-voting PRD,
DIH migration notes, code-review-fix lists from 2026-04-29) are in git history. Recover with
`git show <previous-commit>:TODO.md`. Do not paste them back here unless they actively block 4B.

## North Star

- **Goal:** ~4B votes on the 1% Treaty referendum (majority of humans on Earth).
- **Math:** 32 doubling rounds × 2 referrals each ≈ 4.3B reached.
- **Primary site:** `warondisease.org` - the public website for the
  International Campaign to End War and Disease. Treaty text host:
  `1percenttreaty.org`. App/proof engine: `optimitron.com`.
- **Tree:** every task on the site is a child of `optimize-earth`
  (`OPTIMIZE_EARTH_ROOT_TASK_ID` exported from `@optimitron/db` and re-exported
  by `packages/web/src/lib/tasks/task-keys.ts`).
- **Canonical mission tree target:** `Optimize Earth` → `End War and Disease`
  → the Court of Humanity / treaty workstreams below. The public site can
  still surface "Sign the 1% Treaty" first; the tree exists so tasks, agents,
  APIs, and dashboards share one mental model.

## Strategic Frame (2026-05-08)

Until the 1% Treaty passes, this repo is in campaign mode.

- `warondisease.org` is the front door. It should get a human to vote,
  recruit two more humans, get an organization to join, register a plaintiff,
  or pressure a leader.
- `optimitron.com` is the operating system and evidence layer behind the
  campaign: tasks, communications, referrals, OPG/OBG/Wishocracy, politician
  grading, impact math, and AI-agent coordination.
- Development defaults and PR visual reviews should put the War on Disease
  variant first. Secondary variant galleries for Optimitron, dFDA, and DIH are
  useful regression checks, but they should not be the main review burden while
  the campaign is the bottleneck.
- Park broad platform work unless it directly improves vote conversion,
  referral propagation, organization endorsement, leader pressure, plaintiff
  registration, search/indexing discoverability, or trust in the quantified
  model.
- Do not move Optimitron's governance/proof systems onto the campaign homepage.
  Link to them when they make the campaign more credible; otherwise keep the
  campaign surface focused on action.

## What's shipped (2026-05-07)

**Live vote counter on landing:**

- `VoteCounterSplit` now renders above the `TreatyVoteFlow` on the landing
  page, hidden when total voices is 0 so a brand-new site doesn't show
  empty rails. Uses the same `individualCount` / `memorialVoteCount` /
  `representedHumanCount` already loaded by `ReferendumSiteHomeData`, so
  no new server query.
  `packages/web/src/components/site/OnePercentTreatyLandingPage.tsx`.

**MCP-driven outreach pipeline (continuing PR #58):**

- MCP `createTask` now fires the assignment email on creation. Best-effort
  via the existing `notifyTaskAssigneeOfAssignment` helper, mirroring the
  web-side call site. `packages/web/src/lib/mcp-server.ts:6543`.
- Non-admin MCP scope creating an org-assigned task no longer errors —
  defaults to `isPublic: false` so Wishonia's outreach to organizations is
  not auto-broadcast on the public Earth feed. Admin scope keeps the public
  default for leader/president/treaty-activation tasks.
- Inbound email replies fan out to all watchers (creator + assignee +
  endpoints + admin monitors) via `notifyTaskCommentRecipients` instead of
  notifying only the creator. The helper now also filters out the
  authoring organization so an org reply does not echo back to the org.
  `packages/web/src/lib/email/inbound-reply.ts`,
  `packages/web/src/lib/tasks/task-comment-notifications.server.ts`.

**Campaign-organization flow follow-ups (PR #58):**

- Feedback rate-limit returns `FeedbackRejectedError(rate_limited)` instead of 500.
  `packages/web/src/lib/feedback.server.ts:117`.
- `getBaseUrl()` trailing-slash normalized in organization activation task URLs.
  `packages/web/src/lib/organization.server.ts:82`.
- Pending-org-endorsement sync: lock loss mid-batch returns `skippedBecauseLocked`
  instead of error-stating remaining drafts. `AbortController` (12s) on the post
  fetch keeps it < 15s lock TTL.
  `packages/web/src/lib/organization-endorsement-sync.ts`.
- Assignment-email From now reads `<Creator> via International Campaign to End War
  and Disease <hello@updates.warondisease.org>`. Orgs see who actually assigned
  the task; reply-routing via `reply+{taskId}@…` unchanged.
  `packages/web/src/lib/tasks/task-assignment-notifications.server.ts:125`.
- Inbound-reply tests cover the org-contactEmail → `TaskComment(authorOrganizationId)`
  path so the round-trip is documented.
  `packages/web/src/lib/email/__tests__/inbound-reply.test.ts`.

**`/endorse` rewrite:**

- Calculator moved above the join form. Header is one prompt + one data sentence
  citing `GLOBAL_DISEASE_DEATHS_DAILY`. Result split into two columns: "If you
  act" (lives saved, suffering prevented) vs "If you do not" (preventable deaths
  allowed, suffering allowed) — same magnitude, opposite framing.
- Cut the `ORGANIZATION_BENEFITS` aside, the duplicated `ImpactStat` block, and
  the multi-paragraph "Why bother?" section. Three-step "embed iframe / send
  one email / post once" replaces the bullets.
  `packages/web/src/app/endorse/page.tsx`,
  `packages/web/src/app/endorse/OrganizationImpactCalculator.tsx`.



**Acquisition funnel (warondisease.org):**

- Landing renders embedded `TreatyVoteFlow`; auth is inline; no pre-vote friction.
  `packages/web/src/components/site/OnePercentTreatyLandingPage.tsx`,
  `packages/web/src/components/landing/TreatyVoteFlow.tsx`.
- `/vote` and `/vote/<code>` routes own the focused flow; post-vote redirects to `/dashboard`.
  `packages/web/src/app/vote/page.tsx`.
- 14-screen post-vote share flow records ShareAttempts.
  `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx`.
- Per-variant magic-link copy (Lumbergh for warOnDisease + optimitron, neutral for dfda + dih).
  `packages/web/src/lib/email/magic-link-render.ts:16-29`.

**Onboarding tree (HMT):**

- `user-onboarding:treaty` trigger spawns 5 chain-creating subtasks at signup
  (`assignFirstHuman`, `assignSecondHuman`, `shareReferralUrl`, `signTreatyPersonally`, `phoneScript`)
  + a `completeTraining` gate. `packages/web/src/lib/triggers/blueprints/one-percent-treaty.ts:77`.
- HMT auto-verify gate flips `completeTraining` to VERIFIED when all 5 siblings are done.
  Same file, `hmtVerifyGate` at `:318`.
- `linkParam` helper + `*Linked` parameter variants for sourced markdown citations.
  `packages/web/src/lib/triggers/context.ts:66`.
- Phone-script body keeps raw variants (read aloud); markdown surfaces use `*Linked`.

**Treaty roster + ratification spine:**

- Singleton "Ratify the 1% Treaty" parent task seeded via `treaty:ratify` blueprint.
- `packages/data/src/datasets/government-leaders.ts` defines ~193 `GovernmentLeaderRecord`s
  with name, role, country, contact, military/government budgets.
- `packages/web/scripts/sync-treaty-signers.ts` walks the roster and builds per-leader task drafts.
- Country → leader resolution exists via `getTreatySignerSlots()` (countryCode filter).

**Referral attribution + share infra:**

- `buildReferralUrl`, `buildUserReferralUrl`, `buildInviteReferralUrl` in
  `packages/web/src/lib/url.ts`. `/vote/<handle-or-code>?invite=<token>` is the canonical pattern.
- `ShareAttempt` records every outbound message with `sa=<id>` attribution
  (`packages/web/src/lib/share-channels.ts:79` `embedShareAttemptId`).
- `ReferralInvitation` lifecycle: invite created → recipient task spawned via
  `referral:vote-invitation` trigger → recipient votes → invitation marked CONVERTED →
  sender dashboard row updates. Coverage at `packages/web/e2e/invite-token-attribution.spec.ts`.
- `recordShareAttempt(tx, ...)` in `packages/web/src/lib/share-attempts.server.ts` is the
  single write path; computes `templateHash` + `renderedHash`.

**Court of Humanity scaffolding:**

- Schema exists: `CourtCase`, `CourtCaseParty`, `CourtCaseClaim`, `CourtCaseHarm`,
  `CourtCaseEvidence`, `CourtCaseRemedy` at `packages/db/prisma/schema.prisma:4342+`. All
  status enums in place. `juryReferendumId`, `enforcementTaskId`, and `Subject`-based
  party identity already wired.
- MCP tools exist for every case operation: `addCourtCaseClaim/Evidence/Harm/Party/Remedy`,
  `upsertCourtCase`, `getCourtCase`, `openCourtCaseJuryVote`. See `packages/web/src/lib/court-data.server.ts`.
- Routes exist: `/court` (empty page), `/humanity-v-government` (currently redirects to
  the manual at `manual.warondisease.org/knowledge/appendix/humanity-v-government.html`).
- Posthumous-plaintiff registration already implemented — see
  `routes.ts:678` "Sign the 1% Treaty for someone who can no longer sign it themselves".
- **What's missing:** the seeded `Humanity v. Government` case row, the plaintiff backfill,
  the live `/court` rendering, and the dual treaty-vote / verdict-vote framing. P0 below.

**MCP-driven outreach pipeline (partial):**

- Outbound email infrastructure: Resend, with `replyTo: reply+{taskId}@{REPLY_EMAIL_DOMAIN}`
  auto-injected per task. `packages/web/src/lib/email/task-notification.ts:27`.
- Inbound webhook: Resend Inbound Parse + svix-verified signature, quote-stripping, sender
  authentication, writes `TaskComment` (`source: EMAIL_REPLY`) + `TaskCommunication`
  (`direction: INBOUND`). `packages/web/src/app/api/webhooks/resend-inbound/route.ts`.
- Web-side `createTask` already triggers assignment email via `notifyTaskAssigneeOfAssignment`.
  MCP-side `createTask` does **not** (P0 gap below).
- `Task.isPublic` exists with sensible defaults. `TaskComment.visibility` (`PUBLIC | INTERNAL`)
  modeled. Trigger framework supports `spawnCommunication` for fully-automated emission.

**Diagnostics:**

- New-user funnel screenshot harness for warondisease + optimitron + dfda variants.
  `packages/web/e2e/new-user-flow-screenshots.spec.ts`.
- `VoteCounterSplit` live count component (used on `/signatories`, not yet on landing).
  `packages/web/src/components/referendum/VoteCounterSplit.tsx`.
- MCP errors wired to Sentry (`packages/web/src/app/api/mcp/route.ts` catches).

## Gaps blocking 4B

Ordered by funnel-stage impact. P0 = ship next; P1 = right after; P2 = before launch.

### P0 — Managed canonical data sync (seed replacement for semi-permanent rows)

**Problem decided 2026-05-10:** normal Prisma migrations are the wrong tool for
every title/task-tree/court/trigger tweak, but `seed.ts` alone is also wrong:
production deploy currently runs `pnpm db:deploy` and `pnpm db:seed:triggers`,
not `seed:tasks` or full `db:seed`. A seed edit will update fresh/local/CI DBs
but will not automatically update production. Missing-from-seed also cannot
safely imply "delete this row" because user-created records live in the same
tables.

**Target pattern:** source-controlled managed data with an idempotent sync script.

- Create `packages/db/managed-data/` for canonical app data:
  `optimize-earth-task-tree.ts`, `task-triggers.ts`, `referendums.ts`,
  `court-cases.ts` as needed.
- Create `packages/db/scripts/sync-managed-data.ts` with `--dry-run` and
  `--apply`. It upserts by stable ids/keys, updates only managed fields, and
  soft-deletes/disabled rows only when a source record explicitly says
  `retired: true`.
- Add a package/root script such as `pnpm db:sync:managed-data`.
- Run it on production deploy after `pnpm db:deploy` and before Vercel deploy.
  Keep `db:seed:triggers` until triggers are folded into managed data.
- Keep normal `seed.ts` for local/reference/demo/bootstrap convenience, but have
  it call the same managed-data sync helpers where possible so fresh databases
  and production converge.
- Do not use "record missing from manifest" as a global delete rule. Deletion is
  safe only inside a named managed collection, and only for rows previously owned
  by that collection or explicitly marked retired.
- Managed sync must never touch user-created tasks, comments, claims, votes,
  plaintiffs, represented people, donations, or task rows outside its collection.

**First managed collection:** Optimize Earth task tree. Replace the interrupted
seed-only cleanup approach with this, then retire old direct children like
`dfda` / `bed-nets-funding-gap` through managed data rather than bespoke
migrations for every future edit.

**Testing:** one focused unit/integration test for sync semantics:

- upsert creates/updates managed task fields by id/taskKey;
- `retired: true` soft-deletes a managed row;
- user-created/unmanaged rows are untouched;
- `--dry-run` reports changes without writing.

### P0 — Canonical Optimize Earth task tree

Use managed data, not hard-coded page data and not seed-only drift, to publish
the durable tree:

```text
Optimize Earth
└─ End War and Disease
   ├─ Establish the Court of Humanity
   │  ├─ Adopt the Court of Humanity charter
   │  └─ Prosecute Humanity v. Governments of Earth
   │     ├─ Register plaintiffs
   │     ├─ Summon jurors
   │     ├─ Publish evidence and damages
   │     ├─ Render the verdict
   │     └─ Enforce the settlement: the 1% Treaty
   └─ Ratify the 1% Treaty
      ├─ Get a majority of humanity to vote yes
      └─ Get 193 heads of government to sign
```

Notes:

- `Optimize Earth` is the root/system task. "Promote the general welfare" stays
  in the description/legal frame, not as the primary task title.
- `End War and Disease` is the human-facing mission under the root.
- `Establish the Court of Humanity` is a real institution-building parent task,
  not just a slogan. It should have concrete outputs such as charter/rules.
- Plaintiffs and jurors are specific to the case, so they belong under
  `Prosecute Humanity v. Governments of Earth`, not directly under the Court.
- Do not add a useless "assemble plaintiffs and jurors" parent. `Register
  plaintiffs` and `Summon jurors` are separate sibling tasks.
- `Ratify the 1% Treaty` is both a sibling workstream and the settlement/remedy
  for the case. If the database needs the relationship without duplicate tree
  parents, model it with an edge/remedy reference, not a second copy.
- The concrete government-side task wording is "Get 193 heads of government to
  sign", not vague "get governments to adopt the treaty".
- `dfda` / bed-nets benchmark tasks should not be direct children of the current
  War on Disease mission tree. Keep dFDA as a supporting product/page elsewhere;
  bed nets can remain benchmark/reference material, not a primary campaign task.

### Current implementation order (decided 2026-05-10)

1. **Do not ship the interrupted seed-only cleanup as the long-term pattern.**
   Either replace the local partial seed/migration/test changes with managed
   data, or explicitly throw them away before the next task-tree patch.
2. **Build managed-data sync for tasks first.** Keep scope narrow:
   `Task` rows, primary task communication endpoint, parent-child links,
   explicit retire flags, dry-run/apply.
3. **Move the Optimize Earth tree into managed data.** Sync production so
   `Optimize Earth` becomes the root title, `End War and Disease` becomes the
   primary mission child, Court/case/treaty tasks exist, and obsolete direct
   benchmark children are retired.
4. **Wire production deploy to run managed-data sync.** This prevents future
   canonical task/title/trigger changes from requiring one-off data migrations.
5. **Then update the UI presentation.** `/tasks/optimize-earth`, dashboard, and
   visual-review routes should show the simplified tree, while `warondisease.org`
   still pushes the 1% Treaty vote first.
6. **Only add `allowsUserSubtasks` before exposing public subtask creation UI.**
   Seeded/admin-managed task trees can ship before this. Public UGC needs the
   permission column/guard so arbitrary users cannot clutter canonical parents.
7. **Fold task triggers into managed data after the task-tree sync is proven.**
   Trigger definitions are the same kind of semi-permanent app data and should
   eventually stop using a separate one-off production seed path.

### Recently discussed but not yet implemented

This is the compaction-safe backlog of chat decisions that have not obviously
landed yet. Some items also have detailed sections below; this list is the
cross-check so they do not disappear into chat history.

**Current branch hygiene**

- Decide what to do with the interrupted local changes:
  `packages/db/prisma/seed.ts`,
  `packages/db/prisma/migrations/20260510010000_cleanup_optimize_earth_task_tree/`,
  and `packages/db/src/__tests__/optimize-earth-task-tree.test.ts`. Replace with
  managed-data sync or discard them before the next commit.
- After each push, keep working on local tasks while GitHub Actions run instead
  of blocking the whole session on watching checks, unless the next step truly
  depends on a result.

**Dashboard and task UX**

- Replace the logged-in dashboard with a short action checklist:
  sign the 1% Treaty, render verdict, register plaintiff, summon jurors,
  pressure/manage presidents. Link each row to the actual page.
- Remove the generic task-detail metadata block where it duplicates header
  information. Keep title, assignee, due date, primary action, markdown body,
  comments, complete/reassign/admin controls.
- Remove or demote the public "Sign in to claim" button on campaign tasks.
  Public users should see the useful action first, then sign in only when needed
  to mark done or save state.
- Continue simplifying `/tasks/[id]` toward one universal black-and-white
  task layout with markdown content, comments at the bottom, and normal task
  management controls.
- Add E2E coverage that a signed-in demo user can open an assigned/private task
  from "Your Tasks" without hitting 404.

**Visual review and preview workflow**

- Add the Central Time generation timestamp to visual review HTML.
- Use commit-hash or otherwise cache-busted GitHub Pages paths for generated
  visual reviews so a new PR comment cannot show an old cached `latest.html`.
- Put before screenshots on the left and after screenshots on the right for
  every changed route; keep changed/missing pairs expanded and unchanged routes
  collapsed.
- Fail or clearly flag the PR check when required before/after screenshot pairs
  are missing instead of silently rendering many "not captured" boxes.
- Add direct preview deployment links above each screenshot, including logged-in
  and logged-out state links when available.
- Add a preview/dev-only demo-session route or query flow so visual-review links
  can open the exact route as the demo user or as logged-out without manual
  sign-in.
- Stop animation false positives by waiting for landing animations and animated
  counters to settle before screenshots. Prefer deterministic settling over a
  loose pixel threshold.
- Ensure animated counters such as deaths/wasted-by-delay are not blank in
  screenshots unless intentionally hidden.
- Continue speeding up visual tests with route metadata, fewer hard-coded
  exceptions, sensible workers, and no duplicate local dev servers.
- Keep generated markdown/copy previews state-aware in filenames
  (`logged-out`, `logged-in`) and decide whether stale copy previews should fail
  CI or only publish artifacts.

**Preview deployments and databases**

- Finish real preview-deployment wiring: stable preview URLs, visual-review
  links to those URLs, and War on Disease as the default variant.
- Decide whether to add Neon branch/database forks for preview deployments. This
  is useful once review links need realistic logged-in data without touching
  production, but may be overkill until previews are used heavily.
- Keep demo login available on preview deployments, but not normal production,
  unless explicitly enabled.

**Public copy, messaging, and emails**

- Move remaining dashboard/page copy into the messaging/copy-review system where
  practical, especially Treaty Dashboard text and major CTAs.
- Continue internationalization groundwork by centralizing public copy in JSON or
  a template registry rather than scattering new prose across React components.
- Add optional email to plaintiff registration only if the resulting notification
  has a clear, non-irritating purpose.
- Draft/implement the aggressive class-action plaintiff/juror notification copy
  only after the template system and suppression rules are sane.
- Delete or keep disabled all generic reminder email flows that would irritate
  people. Do not reintroduce generic overdue-reminder spam.
- Centralize communication templates under a registry and add a template lint for
  word count, banned mush phrases, required tokens, and one primary CTA.
- Add the lightweight "forward this to someone better-fit" mailto action to task
  assignment emails.

**Campaign pages and funnels**

- Add the plaintiff damages surface on `/plaintiffs` so visitors see the per-
  plaintiff recovery frame without first reading the case page.
- Add a live plaintiff/juror counter on `/court`.
- Finish `/court` as the Court of Humanity surface, with the case, verdict, and
  plaintiff/juror mental model connected to the 1% Treaty.
- Decide/create the "summon jurors" route if existing referral pages do not give
  a clean standalone target.
- Split dashboard vs president management: dashboard should link to president
  pressure; `/employees` or a clearer `/presidents` route should own the full
  president-management surface.
- Add sitemap entries for public organizations, `/humanity-v-government`, and
  `/court`.

**Navigation and information architecture**

- Finalize action-oriented nav labels: sign treaty, render verdict, register
  plaintiff, dashboard, settings/profile, pressure presidents.
- Add route-description tooltips to nav items only if it improves scanning
  without adding clutter.
- Remove duplicate nav divider lines if still present.
- Consider renaming `/employees` to a clearer public route such as `/presidents`
  while preserving redirects.

**Parameter and cleanup audits**

- Verify all old money-printer war-deaths references were replaced by the new
  `war_deaths_since_1900` / `WAR_DEATHS_SINCE_1900` parameter path.
- Confirm War on Disease and local dev route policy can serve the needed pages
  without surprising 404s.
- Continue the neobrutalist-to-black-and-white cleanup without changing approved
  copy unless the human explicitly asks.

**Deferred product work**

- Move the current Optimitron feature landing to `/features` and make the
  Optimitron root a task-tree/recruitment surface after managed-data sync exists.
- Donate-to-fund-task flow and task-designated donation metadata.
- Stripe Connect / AMF outbound disbursement after manual disbursement becomes a
  real bottleneck.
- VOTE token rewards for verified task completion.

### Next 3 (re-prioritized 2026-05-08, "get orgs and people joining" lens)

The foundation-outreach smoke test ran end-to-end (IAM org → email →
ready for replies). The mechanical loop works. The remaining bottlenecks
to volume of joins, in order of leverage:

1. **Plaintiffs page damages surface** (was queued as P1; promote — see
   `/plaintiffs/page.tsx` audit below). Visitors landing from the case
   page or from the IAM-style email's `register-deceased` deep-link
   currently don't see what they're owed (~$10.6M NPV / $25.2M cohort
   per registered plaintiff). 30-line JSX add, schema-zero, immediate
   conversion lift on a high-traffic surface. **Smallest unit, biggest
   per-line leverage right now.**

2. **Foundation outreach: tightened parameter-driven email template +
   ~10 high-leverage seed targets.** The IAM smoke-test email I sent
   was 250+ words (user flagged as too long). The replacement should:
   (a) live in a real template file (not inline in a script), (b) pull
   numbers from `@optimitron/data/parameters` (so "12.3×" stays canon
   instead of drifting to "quadruple"), (c) use the
   `WAR_ON_DISEASE_APOCALYPSE_DESCRIPTION` thesis line, (d) single CTA
   to `/endorse`. Plus: list 8–12 high-leverage foundations
   (Gates, Wellcome, Open Phil, RWJF, Wellcome Leap, Chan Zuckerberg,
   Arnold Ventures, Schmidt Futures, Skoll, Omidyar) with verified
   contact emails so the bulk-outreach loop has actual payload. This
   is the bottleneck for org joins — without targets and tight copy,
   the mechanical pipeline doesn't move the metric.

3. **Stage 2 President Manager promotion** (already queued as P0
   below) — re-scoped after 2026-05-08 review. The existing PMS
   section already shows all 193 leaders, so the scoped-out "spawn a
   new trigger + new task + dashboard reorder" was overkill.
   Lightweight version: post-HMT, the dashboard primary CTA
   highlights *the user's country's leader* within the existing PMS
   section. ~10 lines. Same conversion goal.

The other "boring infra" items (email threading, sitemap orgs,
Stripe Connect for AMF, email validation lint) are all cheap (10-50
lines each) and have non-obvious compound channels — AI email
summarizers thread by `Message-ID`, LLM search engines
(ChatGPT/Perplexity/Claude/Gemini) discover via sitemaps, Connect
unblocks grant-loop scaling beyond ~5 grants/year. They sit just
below the Next 3 because they are the infrastructure the next 3
ride on, not blockers downstream of them.

### Shipped this session (2026-05-07 → 2026-05-08)

- Court of Humanity case page rendered at `/humanity-v-government` with
  jury-summons + plaintiff #N + damages tier + sensitivity calculator
  + family-registration CTA.
- Live treaty YES voters auto-register as plaintiffs.
- Backfill script for pre-existing voters.
- dih-neobrutalist user/vote/allocation/inclusion migration (33 users,
  23 votes, 49 allocations, 30 inclusions) imported with skip-on-conflict.
- MCP `createTask` → assignment email pipeline (createTask wired to
  `notifyTaskAssigneeOfAssignment`, From shows creator's display name,
  inbound replies fan to all watchers, default-private for non-admin
  scope, IAM smoke test confirmed end-to-end).
- 5 grant-asking funding tasks soft-deleted (Schmidt Futures, Skoll,
  Omidyar, SFF, Open Phil) per "ask orgs to join, not to fund" pivot.
- Slider question reframed welfare-style ("Governments are paid $36T/yr
  to promote the general welfare. What allocation…would best fulfill
  that duty?") so the answer reads as juror testimony in the case.
- `/vote` already-voted guard mirrors the home-page redirect.
- Action menu labels: "Render Verdict" + "Register a Plaintiff" on
  the warondisease.org top nav.
- `/tasks/[id]/page.tsx`: leader-accountability blocks now gated on
  `isTreatySigner`, claim/complete action lifted above the fold,
  neobrutalist styling stripped (BrutalCard / ArcadeTag /
  text-brutal-pink / border-4 / hard shadows all removed in favor of
  treaty-style tokens), admin blocks moved into `<details>` disclosures.
- Root task ID/key renamed to `optimize-earth` / `program:optimize-earth`;
  values exported as `OPTIMIZE_EARTH_ROOT_TASK_ID` /
  `OPTIMIZE_EARTH_ROOT_TASK_KEY` from `@optimitron/db` and re-exported by
  the web `task-keys` shim. One literal, one place. Hand-written
  `packages/db/prisma/migrations/20260509173000_rename_optimize_earth_root_task/migration.sql`
  handles the prod rename.
- All other task-key constants and builders consolidated into
  `packages/db/src/task-keys.ts` and surfaced via
  `@optimitron/db/task-keys`. The web `lib/tasks/task-keys.ts` is now a
  re-export shim plus the one Next.js routing helper
  (`getTreatyParentTaskHref`).
- `parentTaskId` plumbed through `POST /api/tasks` schema with parent-
  exists + parent-must-be-public guards, and through the `createTask`
  server helper. New subtasks created via the REST API default to
  `isPublic: false` so a parent-task creator decides what gets
  surfaced — Wikipedia/StackOverflow-style UGC.
- `/tasks` restructured into two sections: **Humanity's Tasks**
  (single row → `optimize-earth` root, drill in for the tree) and
  **Your Tasks** (assigned-to-me list when present; a synthetic
  "Vote on the 1% Treaty" CTA linking direct to `/vote` otherwise).
  Dropped the flat task queue. `getTasksPageData` now returns
  `assignedToMe`.
- `TaskMilestone` model + UI editor + API route + server helper +
  tests + MCP tool + dashboard rendering all deleted; subtasks
  subsume every milestone capability. Drop-table migration written
  by hand (no data migration needed — milestone table empty in prod).

### P0 — Court of Humanity integration on `/court`

The Court is the integrating institution that gives every other piece of the system a coherent purpose. Plaintiff = treaty signer = juror, one action, three roles. The treaty referendum IS the verdict vote. The 1% Treaty IS the settlement offer. Damages numbers are the same as the prize math. **Zero schema changes — every model already exists; only wiring + page-rendering work remains.**

**Canonical recruitment framing (decided 2026-05-07, refined after user correction):** "You have been summoned as juror #N in *Humanity v. Government*. You are also plaintiff #N. Your share of the demanded recovery: $10.6M (NPV) — $25.2M (lifetime cohort). Lives at stake: ~X. Years of suffering prevented: ~Y." This is standard class-action notice language — we are a class action and we frame ourselves as one. Damage numbers can be quoted as the demanded relief; that's pleading, not a payout promise.

**One narrow rule** (not a general MLM panic — the rule applies to one specific shape of claim): a class member's individual recovery is never conditioned on that member's personal recruitment. "Recruit two more jurors to claim your share" is the tripwire. "The verdict only binds governments at four billion plaintiffs, so we need every plaintiff to recruit two" is fine — that's about case enforceability across the class, not per-member payout eligibility. Governments aren't a typical defendant; a moral class action against them gets enforced by political pressure (the 4B-vote threshold) rather than by federal court order. Explain both halves to a recruit: their individual share is $X regardless; the case only collects at 4B votes.

The VOTE-token / dominant-assurance prize stays a separate, optional track for plaintiffs who *also* deposit into the fund. The two systems are complementary (charitable AMF prize pool + LLC dominant-assurance contract per the legal-wrapper note in the P2 Prize section).

**Damages numbers to surface on the case page (canonical, all from `packages/data/src/parameters/parameters-calculations-citations.ts` and aligned with `manual.warondisease.org/knowledge/appendix/humanity-v-government.html` "Corporate Damages Schedule"):**

The manual's **PRIMARY theory** (lead with this in recruitment copy): lost-prosperity-only, lifetime cohort.
- **$25.2M / representative person** lifetime cohort exposure (`Lost-Prosperity-Only Lifetime Damages, Representative Full-Life Cohort`)
- **$10.6M / capita NPV at 3% perpetuity, no-cure baseline** (`CORPORATE_DAMAGES_FORWARD_SETTLEMENT_VALUE_PER_CAPITA`)
- **$202 quadrillion** total cohort, **$85.1 quadrillion** total NPV.

Body-count tiers (alternative pleadings the Court can fall back on if lost-prosperity is rejected):
- **Strict floor:** $538K / capita, $4.31Q total (`CORPORATE_DAMAGES_STRICT_FLOOR_*`).
- **Prosecutor base ask:** $913K / capita, $7.31Q total (floor + never-developed-drug deaths VSL).
- **FCA treble:** $2.74M / capita, $21.9Q total (`CORPORATE_DAMAGES_TREBLE_EXPOSURE_*`).
- **State Farm constitutional ceiling:** $9.13M / capita, $73.1Q total.

Components of the floor: war deaths VSL ($3.1Q), efficacy-lag deaths VSL ($1.02Q), property+env ($50T), excess military spending above 1900 freeze ($135T), Pentagon FCA penalty increment ($4.92T).

Recruitment copy should lead with **"Your share of the verdict: $10.6M (NPV) — $25.2M (lifetime cohort)"** as the primary number. Body-count tiers are pull-quotes for the case page methodology section, not the headline.

**Descendants-as-plaintiffs framing (decided 2026-05-07):** Memorial / posthumous registration is reframed as estate-of-deceased filing a wrongful-death claim, with the registrant as next-of-kin / administrator. This is how real corporate class actions handle deceased victims — the estate is the named plaintiff; descendants are beneficiaries — and it's already canonical in the manual: the "Invisible Graveyard memorial database" decomposes the 102M efficacy-lag deaths into individual named victims, and the prize protocol's "Inheritance and Estate Transfer" section already specifies that VOTE/PRIZE tokens transfer to heirs.

Three reasons to adopt the framing: (1) every registered deceased-relative grows the family's share of the demanded recovery by another $10.6M–$25.2M, turning memorial registration into a self-interest hook on top of the moral one; (2) it's structurally honest — descendants really are the parties who would receive any wrongful-death settlement under standard tort law; (3) it ties registration to a concrete number rather than just commemoration.

Implementation: copy change on the existing `represented-people` flow + `/plaintiffs/manage` page. Same DB rows (`ensureHumanityVGovernmentPlaintiffParty` already creates the party), same `NAMED_PLAINTIFF` role, same memorial schema. Replace "memorial vote" / "register represented person" labels with "file wrongful-death claim for [deceased]" / "register estate of [deceased] as plaintiff." Damages in copy = "demanded recovery on behalf of the estate, payable to descendants if the case prevails" — same standard-class-action-notice language used elsewhere on the case page. Zero schema work.

Manual reference: `manual.warondisease.org/knowledge/solution/court-of-humanity.html`. Indictment text: `manual.warondisease.org/knowledge/appendix/humanity-v-government.html`. Damages parameters: `manual.warondisease.org/knowledge/appendix/parameters-and-calculations.html`.

- **Schema is already in place.** `CourtCase`, `CourtCaseParty`, `CourtCaseClaim`, `CourtCaseHarm`, `CourtCaseEvidence`, `CourtCaseRemedy` at `packages/db/prisma/schema.prisma:4342+`. `juryReferendumId` field already links a case to a `Referendum`. `enforcementTaskId` field already links a remedy to a `Task`. MCP tools already exist for all six entities (`addCourtCaseClaim/Evidence/Harm/Party/Remedy`, `upsertCourtCase`, `getCourtCase`, `openCourtCaseJuryVote`).
- **Seed `Humanity v. Government` as a `CourtCase` row.** Status `OPEN`, `juryReferendumId` = `one-percent-treaty` referendum, primary respondent = synthetic "Governments of Earth" `Subject`, nominal plaintiff = synthetic "Humanity" `Subject`. Three counts as `CourtCaseClaim` rows (Direct Killing, Regulatory Delay, Misallocation) with manual-section URLs as evidence citations. Harms as `CourtCaseHarm` rows linked to parameter constants (310M war deaths, 102M efficacy-lag deaths, etc.). Settlement remedy = "Ratify the 1% Treaty" with `enforcementTaskId` pointing at the existing singleton ratification task.
- ~~**Live treaty voters auto-register as plaintiffs**~~ — done. Hooked into the
  `/api/referendums/[slug]/vote` route after the YES upsert. Memorial/posthumous
  registration was already wired in the represented-people route.
- **dih-neobrutalist user / vote / referral migration.** Two-script
  pipeline. (1) Source side: `dih-neobrutalist/scripts/export-users-votes.ts`
  uses Prisma to dump users + votes + referral invitations as JSON to
  `backups/users-votes-export-<timestamp>.json`. (2) Destination side:
  `packages/web/scripts/import-dih-users-votes.ts <export.json>` reads the
  JSON and idempotently maps each row into the current schema (User by
  email, ReferendumVote by (referendumId, personId), ReferralInvitation by
  inviteToken). Source `User.name`/`username`/`image`/`bio`/etc. land on
  `Person`; source `referralCode` is preserved when free in destination.
  Run order on deploy: import → backfill-court-plaintiffs (so imported YES
  voters register on Humanity v. Government). Both scripts schema-zero;
  both support `--dry-run`. Source-side script lives in the source repo
  (cross-repo cross-DB read), so it commits there separately.
- ~~**Backfill pre-existing voters as plaintiffs**~~ — script shipped at
  `packages/web/scripts/backfill-court-plaintiffs.ts`. Walks every YES vote on the
  treaty referendum and registers each as a `NAMED_PLAINTIFF` on the case via the
  existing idempotent `ensureHumanityVGovernmentPlaintiffParty` helper. Run once per
  deploy where pre-existing voters need to be backfilled:
  `pnpm --dir packages/web tsx scripts/backfill-court-plaintiffs.ts`. Dry-run with
  `--dry-run`. Without this, `getHumanityVGovernmentPlaintiffCount` only sees voters
  who voted *after* the auto-register hook shipped, so the live counter on
  `/humanity-v-government` reads artificially low — a credibility rupture on the
  case page's headline number.
- **Surface implicit class membership in the dashboard.** Every signed-in user is
  structurally already a plaintiff in *Humanity v. Government* (Rule 23(b)(3)-style
  automatic class membership for living humans harmed by government failure to
  address disease/war). The current model only formalizes the claim on YES vote.
  Add a dashboard line for users who haven't voted yet: "You are a potential
  plaintiff in *Humanity v. Government*. Render your verdict to formalize your
  claim. Your share: $10.6M–$25.2M." Schema-zero — pure UI surfacing of state we
  already track. Keeps the opt-in-via-voting default but makes the implicit class
  visible so users understand what they're in by default.
- **Family-registration as primary CTA on `/humanity-v-government`.** Lost-prosperity
  primary theory is per-representative-person ($25.2M cohort / $10.6M NPV), so each
  registered deceased relative adds another full $25.2M to the family claim. Average
  user with 4 deceased grandparents = $100M+ family claim from grandparent
  registrations alone. Move the "register estate of [deceased]" CTA up from the
  bottom; reframe top-of-page as "register yourself + every deceased family member
  you can name." This is the strongest recruitment hook in the system — bigger than
  civic morality, bigger than the prize-fund refund.
- **Plaintiff dedup, schema-light.** Real risk is duplicate `Subject` rows, not
  duplicate parties (the `CourtCaseParty(caseId, role, subjectId)` unique constraint
  already dedups at the Subject level). Add **pre-search before create** on the
  represented-people registration flow: query existing `Person` rows by canonicalized
  `lower(displayName) + birthDate + deathDate` before letting the user create a new
  record. If a match exists, offer "join as co-next-of-kin" instead. Optional schema
  follow-up: `Person.canonicalKey` indexed column for fast match. Real class actions
  use SSN + manual claim-administrator reconciliation; we don't have SSNs and we're
  global, so canonicalized fuzzy match + UX prompt is the practical ceiling. Verify
  via existing `represented-people` evidence flow (obituary URL, death certificate)
  when conflicts arise.
- **Damages sensitivity calculator on `/humanity-v-government`.** Sliders for the
  disputed inputs (VSL $5M / $10M / $13.7M; war deaths 200M-340M; efficacy-lag deaths
  CI 36.9M-214M; efficacy lag 4.85-11.5 years; NPV discount 3-7%; lost-prosperity
  counterfactual benchmark). Live recalculate per-plaintiff demanded recovery + total
  using the same useMemo + slider pattern as `OrganizationImpactCalculator`. Default
  values match the manual; users sandbox to their own. Rhetorical purpose: invert
  every "you made up the numbers" critique into "tune it however you want; case still
  pleads." A skeptic who dials VSL to $5M still gets $12.6M per plaintiff —
  bigger than any real filed class action would deliver. Defensibility survives any
  single-parameter disagreement. Schema-zero; single new client component.
- **Co-representative model.** Multiple descendants can represent the same estate.
  Schema-zero option: each descendant registered as `CourtCasePartyRole.PLAINTIFF_REPRESENTATIVE`
  (or similar role) on the same `subjectId` as the named plaintiff (the deceased).
  Damages still accrue once to the estate; the case DB does not split the dollar
  amount among heirs — that's governed by will / intestate statute outside our
  system, matching how real class actions handle this.
- ~~**`/humanity-v-government` renders the live case**~~ — done. Replaces the redirect
  with case caption, three counts (310M / 102M / 262M), demanded-recovery tier
  ($10.6M NPV / $25.2M cohort headline; floor + treble alternatives), live plaintiff
  count via new `getHumanityVGovernmentPlaintiffCount` helper, jury-summons
  framing for next juror, and "register estate of [deceased]" CTA pointing at
  `/plaintiffs/manage`. Single primary CTA: render the verdict via `/vote`.
  `packages/web/src/app/humanity-v-government/page.tsx`.
- **Add the 193 governments as `CourtCaseParty` rows of role `RESPONDENT`.** Capacity flips from `IN_DEFAULT` to `SETTLED_VIA_TREATY` as ratifications come in (drive from `government-leaders.ts` + ratification status). The page becomes narratively alive — every news event of a country ratifying is a defendant accepting the settlement.
- **Build `/court` page.** Currently empty (`packages/web/src/app/court/page.tsx`). Render: case caption, three counts with body-count numbers, live plaintiff count, three columns of defendants (settled / served / in-default), settlement progress bar, single CTA "Register as plaintiff = sign the treaty." Reuse `VoteCounterSplit` component for the plaintiff count.
- **Update `/humanity-v-government` page** to render the local case rather than redirecting to the manual. Manual stays as the doctrinal long-form; site presents the case in operational form.
- **Reframe the post-vote share flow.** `TreatyPostVoteShareFlow.tsx` adds plaintiff-number framing alongside the existing impact framing: "You are now plaintiff #N in Humanity v. Government. The verdict needs more jurors." The recruitment ask becomes "register fellow plaintiffs," not "share the petition."
- **Test:** vitest covering case-creation, plaintiff-backfill, and the auto-register-on-vote hook; e2e screenshot covering `/court` with seeded data.

### P0 — Stage 2: President Manager promotion (lightweight)

After a user finishes HMT, the funnel currently dead-ends. The
existing `PresidentManagementSystemSection` already shows all 193
leaders, so the originally-scoped trigger-blueprint + task-spawn
+ dashboard-reorder approach was overkill (re-scoped 2026-05-08).

**Lightweight version:**

Post-HMT, the dashboard primary CTA highlights *the user's
country's leader* within the existing PMS section. Same conversion
goal — the user's specific defendant is now their next action
without spawning a separate task. ~10 lines in
`TreatyTaskDashboardClient.tsx`: detect HMT-completion via the
existing user-task state, scroll/highlight the user's
country-code-matched row in the PMS list.

**Reframe in the Court frame:** copy shifts from "find your
country's leader and ask them to sign a petition" to "your
country's defendant has not accepted the settlement; demand they
do." Same surface; plaintiff-vs-defendant framing.

If conversion data later argues the user actually needs a separate
spawned task (rather than a highlighted PMS row), the heavyweight
trigger + spawn approach is still in the parking lot. Don't build
it speculatively.

### P0 — Live plaintiff counter on `/court`

`VoteCounterSplit` is now on the landing page (above) and `/signatories`. The remaining
slot is `/court` once the page renders. Wire to the same `voteCounterSplit` shape used by
`SignatoriesLeaderboard`, framed as the live plaintiff count alongside the case caption.

### P0 — MCP-driven outreach pipeline (createTask → email → reply → comment)

MCP `createTask` already creates `Task` rows but does **not** fire the assignment email. Web
`createTask` does. This blocks Wishonia (the autonomous agent) from running its own outreach
to the orgs and officials it pre-builds. Audit detail at `packages/web/src/lib/mcp-server.ts`,
`packages/web/src/lib/email/inbound-reply.ts`, `packages/web/src/lib/tasks/task-assignment-notifications.server.ts`.

- ~~**Wire `notifyTaskAssigneeOfAssignment`**~~ — done.
- ~~**Pass `from` override**~~ — done. `notifyTaskAssigneeOfAssignment` now resolves
  `senderUserId` → `Person.displayName` and passes
  `formatShareEmailFromHeader(senderName)` through `sendDraftTaskNotification`.
- ~~**Default `isPublic: false` for non-admin MCP-created assignee-organization tasks**~~ — done.
  `resolveCreateTaskIsPublic` now returns `false` when the caller lacks admin scope and no
  explicit visibility was passed. Non-admin scope can now create org-assigned tasks (was
  previously blocked by the `isPublic && !admin` check).
- ~~**Fan out inbound replies to all watchers**~~ — done. The helper now also filters
  out an authoring organization so the org's contactEmail does not get its own reply
  echoed back.
- **Integration test** at `packages/web/src/lib/__tests__/mcp-server.task-email.integration.test.ts`:
  `createOrganization` → `createTask` → assert email queued + `from` set + `replyTo` set.
  Then synthesize an `InboundEmailEvent` matching the `replyTo` and assert `processInboundReply`
  writes a `TaskComment` and notifies non-author recipients. (The org-contactEmail leg of
  the inbound side is already covered by `inbound-reply.test.ts`; the gap is the integration
  glue.)
- **No schema changes.**

**Open design decisions (resolved 2026-05-07, do not re-litigate):**

- **One recipient, not all org members.** Resolution stays `contactEmail` → first
  owner/admin (`task-assignment-notifications.server.ts:71-96`). Tasks are accountability;
  blasting all members turns them into newsletters and dilutes ownership. Other members
  arrive via the comment thread when the contact loops them in.
- **Auto-send on assignment, no confirmation step.** Confirmation adds a `DRAFT` task
  state and a second MCP tool that the agent has to remember to call. Add only when a
  real misfire shows up.
- **Privacy: keep treaty activation tasks `isPublic: true`.** This is a public-facing
  campaign; visible peer pressure is part of the asset. Default-private only kicks in
  for non-admin MCP scope (the bullet above).

### P1 — "Forward to someone better-fit" on assignment emails (lightweight)

Every assignment email today gives the recipient two options: do the
task or ignore it. Ignoring is the path of least resistance. Adding a
third path — *forward to someone better-fit* — turns an opt-out into a
recruitment event.

**Lightweight scope (the heavyweight delegate-API + new-Person
confirmation flow + rate-limit was cut after the 2026-05-08 review):**

Add a `mailto:` button to the assignment email that opens the
recipient's mail client pre-filled with the task link, the task
title, and a short Wishonia-voice intro ("This was sent to me but
you'd be better-fit. Take a look:"). Recipient picks the email
manually. ~5 lines in
`task-assignment-notification-email.server.ts`. Schema-zero.
Zero new endpoints. Zero spam-attack surface.

If forward-conversions become a measurable channel, then upgrade to
in-app delegation with admin-mediated invite flow.

### P1 — Task detail right-sidebar metadata pattern

After the conditional-gating ship, the next-biggest gap is metadata
position. Status / assignee / due date / claim policy / claim count /
sources stack vertically inline with content; the desktop right rail
is wasted. Standard pattern (`lg:grid-cols-[1fr_320px]`) puts
metadata in a right rail, body in the main column. Mobile collapses
to single column. Multi-day refactor — defer until a specific user
complaint about metadata position triggers it; right now this is
"industry standard says…" not a measured problem.

### P1 — Programmatic email validation (vitest lint + CI gate)

A vitest that imports every email + share template, renders with stub
tokens, and asserts mechanical guardrails: word count ≤ N (per template
family — outreach ≤ 200, reminders ≤ 100), subject ≤ 78 chars,
no banned phrases (curated list of corporate-blather strings:
"we are excited", "let's take a moment", "we hope this finds you
well", "I just wanted to", "circling back", etc.), required tokens
interpolated (recipient name, CTA URL), single primary CTA per
template body. Runs in `core-validate` so drift fails CI. ~50 lines.
The IAM smoke-test email I wrote first would have failed this lint
on the word-count rule alone — exactly the regression class the
human flagged. Schema-zero. Cheap.

LLM-as-judge variant (separate, optional): a vitest that calls Claude
with each template + the Wishonia voice rules and asserts no
violations. Catches tone drift the regex lint can't. Higher cost; do
only if the curated template set grows past ~30 and tone consistency
is a real issue.

### P1 — Plaintiff damages surface on `/plaintiffs/page.tsx` (Next 3 #1)

`/plaintiffs/page.tsx` imports `WAR_DEATHS_SINCE_1900` and
military-spending parameters but not
`CORPORATE_DAMAGES_FORWARD_SETTLEMENT_VALUE_PER_CAPITA` or the
cohort constant. So a visitor sees the gallery without learning
what each registered plaintiff is owed (~$10.6M NPV / $25.2M
lifetime cohort). The case page surfaces this; the registration
page should too. ~30 lines of JSX added under the existing
parameter imports — schema-zero. Highest per-line conversion lift
on the to-do list right now; a visitor who lands on `/plaintiffs`
from the case-page CTA without first reading the case currently
has no damages number to anchor on.

(Menu-label rebrand to verdict/juror/plaintiff phrasing already
shipped this session — see Shipped block.)

### P1 — Centralize communication templates (audit findings 2026-05-08)

Audit of every outbound-comm copy locus in the repo, in service of the
human's question "should we have a TS library or MCP tool for generating
templates rather than scattering them across files":

**Email body builders (3 files):**
- `lib/email/magic-link-email.ts` — `sendMagicLinkEmail()` + `buildMagicLinkHtml()/Text()`
- `lib/tasks/task-assignment-notification-email.server.ts` — `buildTaskAssignmentNotificationEmail()`
- `lib/tasks/task-comment-notification-email.server.ts` — `buildTaskCommentNotificationEmail()`

**Plain-text / share / SMS copy (1 megafile, already centralized):**
- `lib/tasks/share-templates.ts` lines 74-778 — 40+ named `ShareTemplate`
  objects (polite-reminder, performance-review, it-ticket, class-action,
  personal-roi, pentagon-hr, slack-dm, task-notification, sincere, …).
  Each has `id`, `label`, `body`, `requiredTokens`. Selector helpers:
  `getShareTemplate()`, `pickDefaultShareTemplateId()`,
  `getUsableShareTemplates()`. **This is already the model.**

**Trigger-blueprint spawn-communication specs (1 file, mostly empty):**
- `lib/triggers/blueprints/one-percent-treaty.ts` line 405 — only ONE
  `spawnCommunication` blueprint defined (`task:overdue-reminder`,
  cron-driven), and it's `enabled: false`. The framework supports
  `subjectTemplate` + `bodyTextTemplate` + `commentTemplate` per spec
  with `{{var.placeholder}}` interpolation, but it's barely used.

**Misc constants:**
- `lib/messaging.ts` — `VOTE_SECTION` (slider prompt, vote question,
  email-success footer), `ORGANIZATION_ACTIVATION_TASK_TITLE`,
  vocabulary-frame helpers.
- `lib/organization.server.ts` lines 24-61 — `buildOrganizationActivationTaskDescription()`
  embeds the post-join activation task copy directly in the helper that
  creates the task. Inline in code, not a template.
- The smoke-test foundation-outreach copy I just wrote in
  `scripts/smoke-test-iam-outreach.ts` — lives in a script, not the
  template system. Wrong place for production use.

**Honest assessment.** Plain-text + share copy is already centralized
(share-templates.ts is good). Email builders are scattered (3 files,
each hand-rolled). Trigger blueprints have the right shape for
campaign-driven copy but only one DISABLED spec. Outreach-task
descriptions (the foundation-join one I just wrote) are inline in
helpers / scripts.

**Lightweight scope (the MCP tool layer was cut after the
2026-05-08 review — yak-shave for current scale):**

1. **`lib/communications/templates/` directory** with one file per
   template family: `assignment-notification.ts`,
   `comment-notification.ts`, `magic-link.ts`,
   `outreach-foundation-join.ts`, `outreach-leader-sign.ts`,
   `treaty-share.ts`. Each exports `{ subject, html, text, tokens }`
   builders. Same pattern as `share-templates.ts`. Move the
   foundation-outreach copy currently inline in
   `scripts/smoke-test-iam-outreach.ts` into a real template file.
2. **`lib/communications/registry.ts`** — central index mapping
   template IDs → builders. Lets the email validation lint (separate
   P1 entry) enumerate templates.
3. **Trigger blueprints reference the registry** — rather than inline
   `bodyTextTemplate` strings, blueprints reference `templateId:
   "outreach-foundation-join"`. Lets one template power both human-
   driven outreach and automated cron-driven outreach.

Skipped: the MCP tools (`listCommunicationTemplates`,
`generateCommunicationTemplate`). Add only when an agent workflow
specifically needs them.

**Cost:** ~50–80 lines, mostly file moves. Schema-zero.

**Sequencing:** AFTER the immediate "make foundation outreach work
end-to-end" loop is proven (Next 3 #2). The smoke test validated the
mechanical email loop; the directory move locks in a place for the
next 3–5 templates without over-designing for variants we haven't
written yet.

### ~~P1 — Slim "Your Tasks" card render~~ (shipped 2026-05-08)

`hideAssignee` prop now set on the `/tasks` "Your Tasks"
`SortableTaskList`. `TaskRow` already supported the prop (table-row
variant); also threaded through `TaskCard.tsx` for consistency.
Avatar header, "Assigned to X" inline text, and "Full Record" link
suppressed on assigned-to-me rows where they were pure duplication.

### P1 — E2E regression test: signed-in user can open their own task

Pair to the visibility-helper unit test shipped 2026-05-08 (commit
`35aaa9b3`). Different bug class than the unit test catches: a future
regression in `unstable_cache` keying, `notFound()` invocation, route
config, or middleware could 404 a task that the visibility helper
correctly matches. Playwright covers that.

Test shape:

```ts
test("signed-in user opens their own assigned task without 404", async ({ page }) => {
  await signIn(page, "demo@optimitron.com");
  await page.goto("/tasks");
  const firstTaskRow = page.locator("[data-testid='your-tasks-row']").first();
  const href = await firstTaskRow.getAttribute("href");
  await firstTaskRow.click();
  await expect(page).toHaveURL(href);
  await expect(page.locator("h1")).toBeVisible(); // not the 404 page
});
```

Land this AFTER ChatGPT's playwright + visual-regression infrastructure
commits — adding now would conflict with their `playwright.config.ts`
and `e2e/` setup work. Schema-zero. ~30 lines once the e2e harness
exists.

### P1 — Per-task subtask-creation permission (`allowsUserSubtasks`)

The `parentTaskId` plumbing shipped this session lets any authenticated
caller POST a subtask to any public parent. That's wrong for the campaign
shape: canonical parents under `optimize-earth` (End War and Disease, Court of
Humanity, Humanity v. Governments of Earth, Ratify the 1% Treaty) should be
admin/managed-data curated unless explicitly opened. Leaf or community
workstreams can accept user-suggested subtasks to make the "decentralized
to-do list for humanity" frame actually decentralized.

**Schema (one column, separate schema PR per AGENTS.md):**

```prisma
model Task {
  // Whether non-admin users can POST subtasks under this task. Defaults
  // to false — admin opts a task in when it should accept user-suggested
  // subtasks (e.g., a community workstream under End War and Disease).
  allowsUserSubtasks Boolean @default(false)
}
```

**API guards in `POST /api/tasks` (follow-up after schema lands):**

- If `parentTaskId == null` → require `caller.isAdmin`. Closes the
  pre-existing gap where non-admins can create top-level public tasks
  via the REST API.
- If `parentTaskId != null` → require `caller.isAdmin` OR
  `parent.allowsUserSubtasks === true`. Otherwise 403.
- Subtasks continue to default to `isPublic: false`; admin promotes via
  the existing `/tasks/[id]` disclosure.

**Seed defaults:**

- `optimize-earth` root: `allowsUserSubtasks = false` (top-level
  mission stays curated).
- `end-war-and-disease`, `court-of-humanity`,
  `humanity-v-governments-of-earth`, and `1-pct-treaty`: default false until
  the first public subtask UI ships. Open specific community workstreams later,
  not every high-level mission parent by default.
- Per-leader treaty signer tasks: `allowsUserSubtasks = false` (each
  leader's page shouldn't be subtask-spammed).

**Why a boolean and not an enum / per-user allowlist** (decided 2026-05-08):

- Wikipedia, GitHub Issues, StackOverflow, Reddit — every successful
  large UGC system uses *group-level* trust with *content-level*
  protection levels. None use per-user-per-page allowlists. The
  reason is rot: contributor leaves, allowlist becomes stale and
  undocumented; across thousands of tasks this is unmaintainable.
- A reputation tier (`User.completedTaskCount` → auto-promotion past N)
  is the right *next* lever if/when admin promotion becomes a
  bottleneck. Premature now (we have hundreds of users, not millions).
- Closest analog to copy: GitHub Issues + maintainer triage. Anyone
  POSTs a subtask (= file an issue); admin promotes / soft-deletes
  (= label / close). Maintainer status is repo-wide (= isAdmin), not
  per-issue. Same shape we already have.

**Sequence:**

1. Schema PR: add `Task.allowsUserSubtasks Boolean @default(false)` +
   migration. ~10 lines.
2. API + managed-data PR: add guards in `POST /api/tasks`, set
   `allowsUserSubtasks` only on explicitly opened community parents.
   ~25 lines.
3. UI form PR: "Add subtask" disclosure on `/tasks/[id]/page.tsx`
   gated to `task.allowsUserSubtasks === true || viewer.isAdmin`,
   plus an admin "Promote to public" one-click action (same shape
   as the existing curator-verification disclosure). ~30 lines.

After step 3, the user-agency loop pairs with the donate-to-fund-task
entry: orgs propose subtasks → admin promotes → foundations fund.

### P0 — Publish the canonical campaign task tree

This supersedes the old "top-level programs under optimize-earth" note. Do not
make dFDA, decentralized agencies, or bed-net funding direct children of the
current War on Disease mission tree. Those can remain feature pages, future
platform tasks, or benchmark/reference material. The primary tree for the
foreseeable campaign is the one in "Canonical Optimize Earth task tree" above.

Implementation belongs in managed data. The website may present a curated
subset, but the task ids, taskKeys, parent-child links, retired rows, and
primary action endpoints must come from one source-controlled managed
collection so MCP/agents/API/pages agree.

**Primary action-link concept:**

- `End War and Disease` → `/`
- `Establish the Court of Humanity` → `/court`
- `Prosecute Humanity v. Governments of Earth` → `/humanity-v-government`
- `Register plaintiffs` → `/plaintiffs`
- `Summon jurors` → invite/referral route once it exists
- `Render the verdict` → `/court` or the verdict section of `/humanity-v-government`
- `Ratify the 1% Treaty` → `/vote`
- `Get 193 heads of government to sign` → `/employees`

No new schema is required for action links if the existing primary task
communication endpoint is enough.

### P1 — Replace optimitron landing page with tasks tree; move current to `/features`

Captured screenshots of `OptimitronLandingPage.tsx` at desktop +
mobile (2026-05-08): page is roughly 8× viewport tall at
1280×900, cycling through 19 colored sections. No primary action
visible above the fold. Confirms the structural smell that motivated
this entry.

**Design (decided 2026-05-08):**

- **`/`** (optimitron landing) becomes the tasks-page tree view:
  hero stat (live plaintiff count or HALE/income progress) +
  optimize-earth root with its canonical campaign children rendered as the
  primary content (the "Humanity's Tasks" pattern from `/tasks`).
  Visitor lands → sees humanity's to-do list → clicks a program
  ("End War and Disease" or "Establish the Court of Humanity") → sees
  subtasks + an action link to the relevant campaign surface.
- **`/features`** (new route) = the current 19-section landing,
  moved verbatim. Serves the "scroll-and-see-everything-this-system-
  does" use case for the curious / the technically-aligned. Linked
  from the footer + a "How it all works" link in the nav.
- Keep deep-link footer to `/scoreboard`, `/vote`, `/governments`,
  `/politicians`, `/agencies`, `/opg`, `/wishonia`, `/tools`,
  `/why`, `/treatments`, `/employees`, `/prize`, `/court`,
  `/humanity-v-government`.

**Why this and not "literally the tasks page":**

- The tasks page (`/tasks/page.tsx`) is a *worker* view ("Your Tasks"
  + a single Humanity's Tasks row). The landing needs a *recruitment*
  view: visitors who haven't signed in shouldn't be shown a "Your
  Tasks" section at all. Render the optimize-earth tree at the top
  level; render `/tasks` as the personal queue.
- 12 of 19 current landing sections already have dedicated pages.
  The work is mostly footer-deep-link curation, not new component
  building. The 3 truly orphaned sections (`InvisibleGraveyardSection`,
  `PleaseSelectAnEarthSection`, `DecisionMatrixSection`) live on the
  `/features` page; can fold into other dedicated pages later
  (`/why`, `/select-earth` curio, `/prize`).

**Sequencing:**

1. Managed-data sync for the canonical Optimize Earth tree.
2. Publish the canonical campaign task tree under `optimize-earth`.
3. New `/features` route: literally re-export `OptimitronLandingPage`
   with whatever metadata change is needed.
4. Replace `/` for `optimitron` site variant to render the tasks-tree
   layout. Hero + tree + footer-deep-link strip. ~80 lines of layout
   work; no new components.

Cost: ~120 lines + the schema PR. Schema-light; mostly composition.

### P1 — Finish neobrutalist → treaty migration cleanup

**Already shipped on this branch (state as of 2026-05-09):**
- CSS-var redirect in `globals.css` first attempted, then partially
  reverted by Codex (`b23da4ce`) after contrast-compatibility issues —
  brutal-pink/cyan/yellow vars now back to actual colors.
- **Codemod committed (`3fab7d3b`): 1,653 replacements across 239
  files** swapping literal `bg-brutal-pink` / `text-brutal-cyan-foreground`
  / etc. in consumer code for semantic tokens (`bg-foreground`,
  `text-background`, etc.). Status tokens (`brutal-red`, `brutal-green`)
  preserved.
- `BrutalCard` shape simplified: hard offset shadows removed,
  `border-4` → `border-2`, hover translate removed.
- `ArcadeTag` simplified: dropped `font-pixel` + `text-brutal-pink`,
  now muted-foreground small caps.
- `SectionContainer` thick borders → thin treaty rules.

**Remaining cleanup (so we don't have to re-audit later):**

1. **Drop `pink|cyan|yellow` from `BrutalCard.bgColor` + `bgClasses`
   map.** Currently those variants render in actual neobrutalist
   colors (after Codex's revert). Requires updating dynamic
   color-returning functions that emit `"yellow"` / `"cyan"` for
   non-status meanings:
   - `task-card.tsx:getCardColor` returns `"yellow"` for
     ASSIGNED_ONLY, `"cyan"` for viewerHasClaim. Decision needed:
     fold those into `"default"` / `"background"` (lose the visual
     distinction, gain treaty consistency) or keep as muted-bg
     variants with explicit semantic labels.
   - `HowToPlaySection.tsx`: `step.color` data values pass `"pink"` /
     `"cyan"` / `"yellow"` — drop the field, let all cards render
     identically.
   - `MetricsComparison.tsx`, `employee-review-banner.tsx`,
     `SavingsImpact.tsx`: `accentColor` / `metric.tone` props.
2. **Drop `pink|cyan|yellow` from `SectionContainer.bgColor` +
   `bgClasses`.** All consumers passing those values need
   `bgColor="background"` or `bgColor="default"`. Codemod-friendly.
3. **Delete `--brutal-pink` / `--brutal-cyan` / `--brutal-yellow` CSS
   vars** from `globals.css` (`:root` and `.dark` blocks) once steps 1
   and 2 are done. Keep `--brutal-red` and `--brutal-green` for
   status semantics.
4. **Collapse the `@theme inline` Tailwind redirect block** in
   `globals.css` (~200 lines mapping every default color scale to
   brutal-* vars). After step 3, only the red-family redirect needs
   to survive (mapping `bg-red-*` to `var(--brutal-red)`); pink/rose/
   fuchsia/purple/violet/indigo/blue/cyan/teal/sky/amber/orange
   redirects can go. Result: demo/sierra screens fall back to default
   Tailwind colors, which is what they want anyway (CLAUDE.md exception
   already grants game/demo screens specialized colors).
5. **Optional polish: rename `BrutalCard` → `TreatySection`,
   `ArcadeTag` → `Eyebrow`.** ~60 import paths to update via codemod.
   Cosmetic — names match purpose. Defer if low-priority.
6. **Delete dead `ARCADE_LABELS` dictionary** from
   `packages/web/src/lib/messaging.ts`. Audit confirmed zero
   callsites use it.

Sequencing: 1 → 2 → 3 → 4 in one PR, since 3 and 4 depend on 1 and 2.
Visual-review pipeline catches any rendering regressions in demo
screens (which is the only place colors might surprise).

Cost: 1-2 focused hours. Schema-zero. Pure cleanup, no new behavior.

### P1 — Copy audit: kill startup-bro / pompous-systems-engineer writing

CLAUDE.md voice rules updated (2026-05-09) to explicitly forbid the
"hollow infrastructure metaphor" anti-pattern. Now do the audit pass
on the existing copy.

**Canonical violation shipped (this is the example to never repeat):**

> *"Next: the enforcement stack. The treaty is the off-ramp. The
> Court is the road that produces the off-ramp."*
>
> Source: `packages/web/src/components/treaty/TreatyContent.tsx:84,
> 97-98`

Says nothing. Replace with what the user does, who it stops, which
number changes.

**Confirmed offenders found in initial grep (2026-05-09):**

- `packages/web/src/components/treasury/TreasuryAllocationViz.tsx:160`
  — "incentive layer" framing. Replace with what the tax actually
  funds and what the user sees on their dashboard.
- `packages/web/src/components/treasury/WishocracyLinkCard.tsx:17` —
  "incentive layer" again. Same fix.
- `packages/web/src/emails/components/ResourcePromoSection.tsx:12` —
  "It covers the economics, the incentive structures, and why
  nobody has to evolve morally." Stacked-abstract-noun list. Pick
  one concrete claim.

**Audit task:** sweep `packages/web/src/` for the patterns listed in
CLAUDE.md "Anti-patterns — do not write like this". Specifically:

- Grep for `off-ramp|the road that|enforcement stack|the actual
  game|the real game|incentive layer|coordination mechanism|the
  protocol that|primitive|substrate|kernel of|fundamentally|
  essentially|literally the`.
- Read the surrounding paragraph; if it sounds like a Y Combinator
  pitch, rewrite to concrete-Cunk-deadpan. Use the patterns in CLAUDE.md
  Examples block as the model.
- Validate fixes against CLAUDE.md "test before shipping a sentence":
  read aloud, would it appear unchanged in a Stripe keynote? Rewrite.

Schema-zero, copy-only. ~30 surfaces to scan. Each rewrite is 1-3
sentences. The visual-review pipeline catches layout regressions.

### P1 — Dashboard / presidents page mental-model split (lightweight)

`/tasks` already restructured to the two-section "Humanity's Tasks"
+ "Your Tasks" pattern (shipped 2026-05-08). Remaining mental-model
issue: `PresidentManagementSystemSection` renders in two places —
inside `/dashboard` (TreatyTaskDashboardClient) AND on `/employees`
(its dedicated route).

Cleaner separation:
- **`/dashboard`** = personal: your handle, share link, your
  assigned tasks, your verdict + plaintiff status. Replace the
  inline PMS section with a "Pressure overdue presidents" button
  linking to `/employees`.
- **`/employees`** (consider renaming to `/presidents`) =
  president-accountability surface. Only thing on this page.

~20 lines.

### P1 — Donate-to-fund-task (lightweight, schema-zero)

**Premise:** nonprofits engage when they see a paid pathway for
impact. Foundations that fund cost-effective work (Open Phil,
GiveWell-aligned, EA Funds) explicitly browse on cost-per-DALY —
matching the metric the existing `TaskImpactFrame` already
computes. Right now there is no way for a foundation to land on a
specific task and direct money to that work.

**Lightweight scope (the heavyweight `TaskFundingPledge` /
`/grants/apply` / admin-review marketplace was cut after the
2026-05-08 review — premature for our scale):**

1. **Org proposes a task** via the existing `POST /api/tasks` with
   the `parentTaskId` parameter shipped this session. Defaults to
   `isPublic: false` (spam protection); creator-org sees it on
   their dashboard.
2. **Admin promotes to public** via a one-click action on the
   existing `/tasks/[id]/page.tsx` admin disclosure. Same shape as
   the curator-verification block.
3. **Public task gets a "Donate to fund this work" button** on the
   detail page when `assigneeOrganizationId` is set, linking to
   `/donate?taskId=...&org=...`.
4. **`/donate` reads the query params**, pre-fills the donation
   note with the task title + org slug, and stores the designation
   in donation metadata so AMF disburses through its existing
   processes (check / ACH / wire — no Stripe Connect outbound code
   path).
5. **Public task detail page shows a small "$X designated" stat**
   read from a sum of designated donations in metadata.

Total scope: ~80–120 lines, zero new schema, zero new ops surface.
Foundation-browsing recruitment story works on day one without
blocking on Stripe Connect, W-9 forms, or 1099-MISC reporting.

**Stripe Connect comes later** — see the separate P1 entry below.
Manual disbursement is fine for the first ~5–10 grants; Connect
unblocks scaling past that.

### P1 — Sitemap completeness (orgs, /humanity-v-government, /court)

`packages/web/src/app/sitemap.ts` already pulls public People + public
Tasks (capped at 500 each, hourly-cached, per-variant gated). Three
gaps worth filling:

- **Organizations not in dynamic sitemap.** Each public Organization
  with a public profile page is missing. Foundation supporters and
  treaty-supporter orgs aren't being indexed. Add a third
  `prisma.organization.findMany({ where: { deletedAt: null,
  status: "APPROVED" }, take: 500 })` to `getCachedPublicDetailSitemapRows`
  and emit entries pointing at the org's public href.
- **Verify `/humanity-v-government` and `/court` are in the static-
  route list.** Both are central to the post-merge funnel. If
  `getSitemapForSite` omits them, the case page isn't being indexed.
  Quick grep on the static-routes list to confirm.
- **500-row cap per entity type** is a future-scale concern. At
  hundreds of foundations / thousands of plaintiffs / all 193 leaders,
  silently drops the lower-`updatedAt` entries past row 500. Standard
  pattern: split into multiple sitemap files
  (`sitemap-tasks.xml`, `sitemap-people.xml`, `sitemap-orgs.xml`)
  via Next.js sitemap-index conventions. Park until ~300 entries
  visible per type.

### P1 — Email threading (Message-ID, In-Reply-To, References)

Outbound mail currently sets only `List-Unsubscribe` (`packages/web/src/lib/email/resend.ts:209,266,309`). Inbound captures `inReplyTo` into `TaskCommunication.metadataJson.inReplyTo` but it is never consumed. Mail clients won't visually thread the conversation; in-app `parentCommentId` never gets set on inbound replies. Replies feel orphaned in both surfaces.

- **Generate stable `Message-ID`** per outbound `TaskCommunication`:
  `<task-{taskId}-comm-{communicationId}@{REPLY_EMAIL_DOMAIN}>`. Pass via Resend's `headers`.
  Persist on `TaskCommunication.metadataJson.messageId`.
- **Set `In-Reply-To` and `References`** on subsequent sends in the thread by reading the
  most recent outbound `TaskCommunication` for the task.
- **Resolve inbound `inReplyTo` → originating `TaskCommunication`** to set `parentCommentId`
  on the new `TaskComment`, so the in-app feed nests correctly.
- **No schema changes.** All metadata fits in the existing `metadataJson` field.

### P1 — Stripe Connect for AMF outbound disbursement

AMF is already a US 501(c)(3) with Stripe wired for inbound
donations. Manual disbursement (checks, spreadsheets, year-end
1099-MISC done by hand) caps the funding loop at ~5 grants/year
before ops becomes the bottleneck. Connect = automated outbound +
recipient-self-served tax forms + built-in 1099 generation.

- Enable Stripe Connect on the existing AMF Stripe account
  (Standard or Express; Express recommended for our shape).
- New onboarding endpoint: `/api/grants/[taskId]/connect-onboard`
  that creates a Connect account for the recipient org and returns
  the Stripe-hosted onboarding link.
- Disbursement helper: a small server action that calls Stripe's
  Transfer API to move designated donations from AMF's platform
  balance to the recipient's connected account on grant
  verification (`Task.status === VERIFIED`).
- Admin UI: a "Disburse $X to [org]" button on the existing
  `/tasks/[id]/page.tsx` admin disclosure for verified
  donate-to-fund-task tasks.

Roughly ~150 lines + Stripe dashboard config. Real but bounded.
Defer until donate-to-fund-task has produced ~3–5 actual designated
gifts (so we know the loop converts before automating it).

### P1 — Extend VOTE token earning to verified task completion

Right now VOTE is earned exclusively through referrals (referrer
earns 1:1 with verified-vote referrals — see `VoteToken` /
`VoterPrizeTreasury` on Base Sepolia). High-leverage builders who
do work for the campaign (translate the treaty into 50 languages,
build the /grants page, run a foundation-outreach sprint) get
nothing from the prize pool. That misaligns the assurance contract
from the actual production-of-results work.

**Lightweight extension (do not introduce a new token):**

- Add a verifier-gated mint path on `VoteToken`: when
  `Task.status` flips to `VERIFIED` and the task carries a
  `voteEarningRatio` (or a constant ratio per category), the
  contract mints VOTE to the verified completer's address.
- Define ratios per task category (OUTREACH, ENGINEERING,
  TRANSLATION, etc.) — values configurable via the existing
  parameter manifest, not hard-coded.
- Mint trigger: a server-side hook on `verifyTask` that calls the
  contract's mint function. Same shape as the existing referral
  mint trigger.

**Why not a new token (EOP / Earth Optimization Points):** brand
confusion (VOTE + WISH + Hypercerts already three systems);
sybil cost is on the verification surface, not the token; every
new token doubles the SEC/securities posture surface.

Schema: add `voteEarningRatio: Float?` to `Task`. Mint path:
~50 lines on the contract + ~30 lines on the server hook. Park
until the existing VOTE-earning-via-referral path has measurable
volume — premature otherwise.

### P1 — Donate-to-the-prize-pool surface on `/donate`

`/donate` today lands money in AMF (501c3, unrestricted,
charitable, tax-deductible). The actual Earth Optimization Prize
pool is USDC deposited into `VoterPrizeTreasury` on Base Sepolia
and currently has zero UI surface — visitors who *want* to grow
the prize pool have no way to.

Add a second path on `/donate`:

- **Option A: Donate to the campaign (AMF).** Existing flow,
  unchanged. Tax-deductible. Funds outreach.
- **Option B: Deposit to the Earth Optimization Prize pool.**
  Direct-USDC-to-`VoterPrizeTreasury` deposit via WalletConnect
  /  Privy / whatever wallet adapter the prize pages already use.
  *Refundable + ~4.2× yield if the treaty fails by 2040* (the
  dominant-assurance economics CLAUDE.md already describes).
  Donor gets VOTE 1:1 for the deposit on success.

Both options labeled clearly so donors pick the vehicle that
matches their tax + risk profile (per the CLAUDE.md rule
"separation is enforced at every layer" between AMF charitable
and EOS LLC dominant-assurance).

Also: spawn a public Task "Grow the Earth Optimization Prize
pool" pointing at Option B so it slots into the donate-to-fund-
task pattern — every page that funnels toward action can deep-
link to the deposit UI.

Cost: ~80 lines on `/donate` (the second option + form +
provider resolution) + 1 new public task seed row. No schema
changes. Does **not** require Phase-2 mainnet readiness — Sepolia
is fine for the deposit UI; mainnet migration happens on its own
schedule.

### P2 — Post-treaty alignment between VOTE holders and WISH UBI

Design note (parked, do not build until treaty passes): pre-
treaty VOTE holders get a one-time WISH airdrop at treaty-
passage time, weighted by their VOTE balance. Aligns campaign
contributors with the post-treaty world they helped create
without merging the two tokens (which would compound the SEC
posture surface across both phases).

The user proposed merging VOTE + WISH into a single "Earth
Optimization Points" token (2026-05-08); rejected because the two
tokens have sequential, non-overlapping economic regimes —
VOTE = assurance-contract / prize-pool share (pre-treaty);
WISH = tx-tax-funded UBI primitive (post-treaty). One token can't
be both without legal complications. Cross-phase airdrop captures
the alignment intent at zero design cost.

### P2 — Prize wire-up into the post-vote funnel (BLOCKED on legal + mainnet)

CLAUDE.md states `/prize` is "the most important feature on the site; every other page should
funnel toward it." Currently disconnected — zero mentions of VOTE / earn / prize / USDC in
`TreatyPostVoteShareFlow.tsx` or `TreatyTaskDashboardClient.tsx`. The backend mint logic
(`syncReferralVoteTokenMintsForVerifiedVoter`) and the `VoteTokenBalanceCard` component both
exist; they are not wired into the funnel.

**Blocked on out-of-band work** (do not start engineering until these are resolved):

1. **Two-entity legal structure** (working assumption, 2026-05-07). The site presents two
   separate funding tracks:
   - **Accelerated Medicine Foundation** (existing US 501(c)(3)) hosts a charitable prize
     pool. Donations tax-deductible. Accepts stock cleanly through a brokerage. Grants out
     to outreach campaigns with verified-vote outcome metrics. This unlocks foundation /
     ESG-mandated / large-individual donor capital that the assurance contract structurally
     cannot reach (no clawback on completed gifts).
   - **Earth Optimization Services LLC** (new) operates the dominant-assurance contract:
     deposits, Aave yield, refund-or-payout. LLC structure avoids the 501(c)(3) "completed
     gift" rule and avoids the lobbying-substantial-activity test (which lives at the LLC
     side anyway because the IAB lobbying mechanism does too).
   - **Constraints to enforce:** AMF cannot grant in ways that benefit EOS owners
     (self-dealing); the two pools must be operationally separable; lobbying activity stays
     LLC-side. UI on `/prize` should label the two tracks clearly so donors pick the
     vehicle that matches their tax + risk profile.
2. Securities posture for the LLC pool (Reg D 506(c) accredited path, or a defensible
   non-security framing).
3. Contract audit + Base mainnet deployment. Contracts currently target Sepolia.
4. Multisig + emergency-pause governance. 3-of-5 default. Same multisig holds both pools or
   separate? Default to separate so AMF's 501(c)(3) audit trail is clean.
5. Aave mainnet integration verified end-to-end with small real capital (LLC side only —
   AMF charitable pool is cash + stock, not yield-bearing).
6. Seed deposits ($100K–$500K from creator + aligned co-funders) — non-empty contract is a
   precondition for credibility.

**Once unblocked** (~2 days of engineering):

- Surface VOTE earning ratio in `TreatyPostVoteShareFlow.tsx` alongside impact framing.
- Add `VoteTokenBalanceCard` to `TreatyTaskDashboardClient.tsx` with a link to `/prize`.
- Day-7 + day-30 reminder emails referencing the user's VOTE balance and prize milestones.
- Referrer leaderboard on `/prize` (social proof).
- **Accept share/equity donations** through the AMF 501(c)(3) sleeve. Stand up a
  DTC-eligible brokerage account, publish a valuation methodology, and decide
  hold-vs-liquidate per donation. Volume likely small in cycle one (private founder-led
  companies, small B-corps, crypto treasuries already used to non-cash assets) but high
  signal: a company pledging its own equity is unusually committed.
- "Track-now, mint-retroactively" framing if engineering ships before contracts go live, so
  the referral-attribution data is collected from day one.
- No schema changes.

## Architecture Guardrails (durable — do not violate)

- **Decision 2026-04-27:** Do not add special outreach models for nonprofit/company/partner
  tasks. Use the existing `Task` assignment model plus `Organization`, `Person`,
  `TaskCommunicationEndpoint`, `TaskCommunication`, `TaskComment`, `EmailLog`.
- **Decision 2026-04-27:** Do not keep a parallel local enum mirror in web. Regenerate
  `@optimitron/db` when schema enums or delegates are stale, then import from
  `@optimitron/db/enums`.
- **Decision 2026-04-27:** Rank concrete action options, not abstract tasks. The production
  engine chooses between execute, agent execution, delegate, outsource, fund, de-risk,
  decompose, queue repair, kill.
- Do not add Stripe Connect, marketplace payments, Wish tokens, or new credit-ledger schema
  until generic private tasks + ranking + notifications are boring and stable.
- Do not introduce a second task model. Personal/private, org-assigned, treaty invite, and
  agent-proposed work all remain `Task` rows with scoped ownership/visibility.
- Ownership split:
  - `Task` = the assigned thing.
  - `ReferralInvitation` = named invite lifecycle, token, copy/sent/converted state, reminders.
  - `ShareAttempt` = exact outbound message attribution ledger.
  - `TaskComment` = readable thread (comments, outgoing messages, inbound replies, status).
  - `TaskCommunication` = delivery/contact envelope (channel, recipient, endpoint, provider ids).
  - `TaskCommunicationEndpoint` = assignee contact methods (email, mailto, official forms, profile).
  - `EmailLog` = email delivery, provider status, webhook events, dedupe.
  - `TrackingReminder` = health-variable measurement reminders only; not for outreach.
- Avoid one-off treaty reminder systems. Outreach goes through shared task-message helpers.
- Keep `TaskCommunication.status` channel-agnostic and small:
  `DRAFT`, `SENT`, `RECEIVED`, `FAILED`, `CANCELLED`. URL/form details (`openedAt`,
  `submittedAt`) belong in `metadataJson`. Only record `submittedAt` on confirmed submission.

## Decisions captured (do not re-litigate)

- **Q1 — `copyMode="neutral"`**: neutral partner-survey copy is intentional for
  embeds/nonprofit adoption. Concise + direct + useful; not full Wishonia voice if it would
  make partner orgs nervous.
- **Q2 — Org attribution**: `ReferendumVote` is first-org-wins, matching `referredByUserId`.
  Later votes from another org link must not steal attribution. Per-org `SurveyResponse` rows
  can record their own org context.
- **Q3 — `/conditions` vs `/agencies/dfda/conditions`**: canonical depends on host.
  `dfda.earth` → short paths canonical. `optimitron.com` → agency-scoped paths canonical.
- **Q4 — dfda.earth**: keep as standalone medical surface AND expose DFDA under Optimitron's
  agency tree.
- **Q5 — `components/ui/*` shadcn files**: rewrite compatibility wrappers to
  brutalist/semantic tokens; preserve API surface; do not introduce a second visual system.
- **Q6 — `google-grounded-search.ts`**: do not delete while `OutcomeLabel` imports it.
- **Q7 — Treatment slug consistency**: 216 conditions, 0 missing `treatments/*.json`. Stable.
- **Don't collapse `1percenttreaty.org` → `warondisease.org/treaty`**: the separate domain is
  a memorable shareable URL ("vote at 1percenttreaty.org") that beats the long form for
  podcasts and coalition-partner pitching.

## Quality Gates

- `pnpm check` (typecheck + lint + test) before handing back any non-trivial change. Fix every
  failure yourself.
- `pnpm --filter @optimitron/<pkg> test` for the affected package(s). No `skip` to make tests
  pass.
- `pnpm --filter @optimitron/web exec playwright test e2e/contrast-audit.spec.ts --project=default`
  before publishing UI changes.
- Never run `pnpm build` / `next build` — the dev server handles compilation.
- Library packages (`optimizer`, `wishocracy`, `opg`, `obg`, `data`, `agent`, `hypercerts`,
  `storage`) stay runtime-safe: no Prisma, no runtime DB.

## Open brand decisions

- **optimitron.com vs wishonia.love canonical site.** Two parallel
  surfaces today; running both forever doubles maintenance and lets
  Google penalize duplicate content. Decision needed: pick whichever
  has more inbound traffic / brand recognition, point the other's DNS
  at the canonical, 301 every URL. "Optimitron" sounds like an
  autobot — straightforward / engineering-aligned / fits the "Earth
  Optimization System" sober tagline. "Wishonia" sounds like a
  country — more on-brand for the sardonic Wishonia voice copy. Both
  are defensible. Pure brand call; no code change blocking it. This is
  not the same decision as the War on Disease campaign default; do not
  reopen it while the treaty campaign is the active bottleneck.

## Long-tail (parked, not 4B-blocking)

Items that exist in earlier TODO revisions but do not move the 4B-votes needle today.
Bring back here only if the work directly removes a P0/P1 gap above.

- Multi-agent / service-account architecture (Phase 0-3 build plan).
- AP2 / ACP / x402 agentic-payment wiring.
- Donations & crowdfunding tracks 2-4 (IAB lobbying, DAO-governed fund).
- Dead-people-voting PRD (memorial form, dead-person registration, prosecution dashboard).
- DIH feature migration (porting from `dih-neobrutalist`).
- MCP queue sync items not on the 4B critical path (commission page, EV calculator,
  generic referendum system).
