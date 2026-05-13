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

## Current State Snapshot

- War on Disease is the default product focus; development and PR review should
  keep that variant first.
- The treaty vote, referral attribution, post-vote share flow, and organization
  endorsement flow exist.
- `optimize-earth` exists as the root task key/id, and the canonical campaign
  task tree now syncs through managed data so source-controlled data,
  production rows, MCP, API, and pages cannot drift.
- The managed canonical task sync work from `feature/managed-task-tree-sync` is now
  on `main` via `PR #71` and drives production deploy via CI.
- `/humanity-v-government` renders the operational case. `/court` exists but
  still needs the live Court surface, plaintiff/juror counter, and final
  treaty-as-verdict framing.
- MCP task assignment email, inbound reply fan-out, and the focused round-trip
  integration test have shipped.
- Visual review exists, but still needs cache-busted review URLs, fewer missing
  before/after pairs, direct preview links, and deterministic animation settling.

## Gaps blocking 4B

Ordered by funnel-stage impact. P0 = ship next; P1 = right after; P2 = before launch.

### P0 — Confirm preview build memory after generated-data type-graph cleanup

- PR #70 removed the generated country-panel/government-leader import path from
  client task rows and the treaty reminder composer, then removed the broad
  data-fetcher/type imports that pulled the generated country panel and median
  income datasets into Next type validation. Local `next build` now keeps those
  giant generated datasets out of static client chunks and the Next type graph.
- Watch the next Vercel preview build. If it still OOMs, continue from evidence:
  lower Next worker concurrency and trim remaining server-only generated data
  bundles before considering paid larger builders.

### P0 — Managed canonical data sync (seed replacement for semi-permanent rows)

**Problem decided 2026-05-10:** normal Prisma migrations are the wrong tool for
every title/task-tree/court/trigger tweak. Production-worthy data belongs in
managed sync, not in a separate seed-only path. Missing-from-manifest also
cannot safely imply "delete this row" because user-created records live in the
same tables.

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
- Keep `packages/db/prisma/seed.ts` only as Prisma's tiny entrypoint shim.
  Managed sync is the source of truth for local, CI, preview, and production.
- Do not use "record missing from manifest" as a global delete rule. Deletion is
  safe only inside a named managed collection, and only for rows previously owned
  by that collection or explicitly marked retired.
- Managed sync must never touch user-created tasks, comments, claims, votes,
  plaintiffs, represented people, donations, or task rows outside its collection.

**First managed collection:** Optimize Earth task tree. Replace the interrupted
seed-only cleanup approach with this, then retire old direct children like
`dfda` / `bed-nets-funding-gap` through managed data rather than bespoke
migrations for every future edit.

**Branch status:** `main` now includes this work in `PR #71` (`feature/managed-task-tree-sync`
merged). Managed-task sync for the canonical `Task` tree and task trigger blueprints
ships with dry-run/apply modes, seed reuse, and production deploy wiring.

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
- Primary action links should stay in the same managed source as the tree, using
  the existing task communication/action endpoint if it is enough:
  `End War and Disease` -> `/`, `Establish the Court of Humanity` -> `/court`,
  `Prosecute Humanity v. Governments of Earth` -> `/humanity-v-government`,
  `Register plaintiffs` -> `/plaintiffs`, `Ratify the 1% Treaty` -> `/vote`,
  `Get 193 heads of government to sign` -> `/employees`, and `Summon jurors`
  -> the invite/referral route once it exists.

### Current implementation order (decided 2026-05-10)

This is the canonical near-term order. Older detailed sections below are
supporting detail or parked work; they should not override this sequence.

1. [x] **Do not ship the interrupted seed-only cleanup as the long-term pattern.**
   Either replace the local partial seed/migration/test changes with managed
   data, or explicitly throw them away before the next task-tree patch.
2. [x] **Build managed-data sync for tasks first.** Keep scope narrow:
   `Task` rows, primary task communication endpoint, parent-child links,
   explicit retire flags, dry-run/apply.
3. [x] **Move the Optimize Earth tree into managed data.** Sync production so
   `Optimize Earth` becomes the root title, `End War and Disease` becomes the
   primary mission child, Court/case/treaty tasks exist, and obsolete direct
   benchmark children are retired.
4. [x] **Wire production deploy to run managed-data sync.** This prevents future
   canonical task/title/trigger changes from requiring one-off data migrations.
5. [~] **Then update the UI presentation.** Dashboard is now a focused share
   card + collapsed disclosures (PR #71); /tasks/optimize-earth and the
   visual-review routes still want a simplified tree view. War on Disease
   still pushes the 1% Treaty vote first.
6. [—] **`allowsUserSubtasks` schema column — parked.** Existing schema is
   sufficient to add subtasks when needed. Revisit only when public subtask
   creation UI is on the immediate roadmap.
7. [x] **Fold task triggers into managed data after the task-tree sync is proven.**
   Trigger definitions are the same kind of semi-permanent app data and no
   longer use a separate one-off production seed path.

### Recently discussed but not yet implemented

This is the compaction-safe backlog of chat decisions that have not obviously
landed yet. Some items also have detailed sections below; this list is the
cross-check so they do not disappear into chat history.

**2026-05-11 session — completed (on feature/treaty-dashboard-message-first / PR #75 unless noted)**

- [x] Visual-review per-PR persistence (PR #76 merged). `peaceiris/actions-gh-pages` with `keep_files: true` to a long-lived `gh-pages` branch; each commit lands at `pr-N/<short_sha>/` so older review URLs survive newer pushes.
- [x] LiveCounter visual-review mask (PR #76 merged). Component honors `__OPTIMITRON_VISUAL_REVIEW__` runtime flag, emits both `data-visual-mask="dynamic"` and `data-volatile` for screenshot + markdown-preview tooling.
- [x] Lightbox on visual-review HTML — click a screenshot to open full-viewport, click again for 1:1 zoom, Esc/close button to dismiss.
- [x] Email-template screenshots in visual review. `e2e/email-screenshots.spec.ts` renders magic-link / task-assignment / task-comment-notification / post-vote-share / referral-first-conversion / monthly-chain-digest at 720×1000 and feeds them into the same `screenshots/<project>/` tree the review HTML walks. Required adding the spec to `MODE_SPECS.visual` in `run-playwright.mjs`.
- [x] Visual review toolbar: live route-name filter, Expand all / Collapse all, "Only show changed" (actually hides unchanged), `/` keyboard focuses the filter input.
- [x] Per-route "📋 Copy context" button on visual review. Payload includes PR + branch + commit SHA, route + auth state, before/after screenshot URLs, and explicit "please `curl -O` these before responding" instructions for the coding agent. Embedded `data-context` JSON; JS click handler formats markdown and writes to clipboard.
- [x] Inline PR-timeline deployment annotation per commit (Vercel-bot style), replacing the sticky comment. Uses `createDeployment` + `createDeploymentStatus` with `environment: visual-review/pr-N`.
- [x] CSRF flake mitigation: `retries: isCI ? 2 : 0` in `playwright.config.ts`. `tasks-index-auth` had hit `ECONNRESET` on `/api/auth/csrf` three times in one session.
- [x] Cancel-safe gh-pages publish — visual-review publish steps now gated on `!cancelled()` so a concurrency-cancelled run doesn't post a partial review with "62 missing pairs".
- [x] Commit-status + deployment annotation only when publish succeeded — `steps.visual_review_pages.outcome == 'success'` gate so reviewers don't click dead links.
- [x] CI baseline loop `--limit 20 → 5` for main `web-visual-review` artifact lookup. The previous successful main run virtually always has the artifact.
- [x] Dashboard share card rewrite (`DashboardShareCard.tsx`). Replaced "Each voter who recruits two more is the campaign." marketing line with: Humanity Manager assignment frame + apocalypse math (122 apocalypses → 12.3× more clinical trials, 443yr → 36yr eradication timeline). Every number sourced from `@optimitron/data/parameters` via `<ParameterValue>` for citation popovers.
- [x] `/treaty` restored to the original commit-`1c58293e` skim-and-sign layout. Single centered serif headline ("Please quickly skim and sign to end war and disease."), continuous treaty body, single signature box. No stepper, no slide split, no decorative dividers, no competing Court CTA. Added a `/treaty` Playwright regression test (`e2e/treaty-page-structure.spec.ts`) asserting headline + treaty body phrases + Yes/No buttons.
- [x] `/treaty` body fallback. `getReferendumPageContent()` now falls back to bundled `shareableSnippets.onePercentTreatyText.markdown` when the DB row's `bodyMarkdown` is null/empty — previously preview deployments with unseeded DBs rendered only the headline + signature box.
- [x] `/signatories` cleanup — removed top "Public record / Signatories / Humans and organizations…" block and the "Living votes / Represented humans / Memorial votes / Total voices" stats box. Just the leaderboard.
- [x] `/tasks/[id]` cleanup — removed the verbose `<dl>` metadata sidebar (Owner / Progress / Time needed / Area / Completed / Updates) that duplicated header info. Kept Deaths-from-delay + Wasted-by-delay as inline tags above the markdown body. Effort hours moved into the inline header metadata strip.
- [x] `HUMANITY_V_GOVERNMENT_CASE_NAME` canonical constant in `@optimitron/db/task-keys`, sourced by `humanityVGovernmentLink.label`, `/court` page copy, and managed-task-tree titles. Replaces the drift between "Humanity v. Government" and "Humanity v. Governments of Earth".
- [x] CLAUDE.md voice rule reinforced — "Write like Kurt Vonnegut. Plain words. Short declaratives." Button labels and microcopy default to verb-first imperatives; banned list includes "Take ownership", "Engage", "Empower", "Unlock", "Streamline".
- [x] Nav label rename: `tasksLink.label` "Tasks" → "To-Do List for Humanity", CTA "Open Tasks" → "Open the list".
- [x] CodeRabbit cleanup (commit `5872a64b`): visual-review/* deployments excluded from preview-URL discovery; `<details>` route anchors carry `id="route-<slug>"` so copied URLs scroll; `getRecipientReferralUrl` failures no longer abort task-assignment / task-comment notification batches.

**2026-05-11 session — discussed but not yet implemented**

- Task-list rows fully clickable. Currently inner `<Link href={assigneeHref}>` on the avatar / name traps clicks and navigates to the assignee's person page instead of the task. Task lists (not the detail page) should treat the entire row as a single link to `/tasks/<id>`; assignee navigation lives on the detail page itself. Affects `task-row.tsx` across the `signer` / compact variants — replace inner `<Link>` wrappers with non-interactive spans.
- Avatar next to assignee on `/tasks/[id]` header. Currently shows just "Assigned to <name>" as text; should render the assignee's avatar inline so the page matches the visual density of task lists.
- Decide what to do with the task claim button (no consensus yet). Current behavior: logged-out users see nothing, logged-in users see "Claim Task". User flagged the verb "claim" as bad. Two open questions: (1) keep / drop the logged-out sign-in nudge entirely; (2) rename "Claim Task" to a Vonnegut-style verb ("Do this." is the working candidate — NOT "Take this on", that was rejected as corporate-onboarding).
- Reframe `formatEnumLabel(viewerClaim.status)` output in the task-detail viewer state strip — current "Claimed" / "In Progress" / "Completed" / "Verified" labels leak the enum into user copy.
- Remove drop-shadow on the Updates-section "Sign In" button + audit all other buttons that still carry hard-offset / soft shadows. CLAUDE.md already says "no shadows by default" — the Updates Sign-In on a logged-out task page is a known offender.
- Investigate Neon DB branch-per-preview-deployment. Currently Vercel previews point at whatever `DATABASE_URL` is set on the preview environment — there's no managed-data sync against a per-PR DB, so previews show stale/missing seed data (which is why the `/treaty` row had a null `bodyMarkdown` and surfaced the page bug above). The Vercel Neon integration creates a branch per PR and runs migrations automatically; main alternative is a `sync-on-preview` workflow step that hits a preview-scoped DB.
- [x] Drop the duplicate dry-run managed-data step from `core-validate`. Web-validate's `--apply` against the freshly-migrated CI Postgres catches the same drift and the dry-run step's diff was always identical (empty CI DB → "would create N rows" every time). Shipped in `0810ecaa`-era; web-validate now logs the plan before applying so the diff is still visible in CI logs.
- [x] `voice-critic` Claude Code subagent at `.claude/agents/voice-critic.md`. Reads diffs against the Vonnegut voice rule, reuse-before-rewrite inventory, ParameterValue rule, peak-commitment rule, and significant-figures floor. Spawn after any user-facing copy / UI change.
- [x] `pr-comment-triager` Claude Code subagent at `.claude/agents/pr-comment-triager.md`. Walks open PR comments, classifies valid vs. AI-slop, fixes valid ones in focused commits, resolves slop with on-thread reasons. Refuses to blindly comply with bots.
- [x] `test-auditor` Claude Code subagent at `.claude/agents/test-auditor.md`. Walks the test suite for the slop patterns the Testing Rules section bans, finds flaky tests in CI history, identifies critical untested paths. Returns delete + add + flaky lists.
- [x] Local review pipeline: `pnpm --filter @optimitron/web review:local` runs `copy:preview` (markdown extract) + Playwright visual regression + builds the review HTML + opens it. Requires `next dev` on :3001 separately. (Originally scoped a `review:watch` variant too; dropped pre-ship — full Playwright run is 2-4 min, so debouncing source changes into a watcher would burn cycles on results that arrive after the developer has moved on.)
- Speedup attempt redo: path-filter `web-validate` so non-web PRs short-circuit. Previous attempt (`b50469063`) produced an unparseable workflow file; needs smaller incremental commits this time to isolate which construct GitHub objected to.
- Build a `/dev/email/<template>` Next.js preview route that renders each email template's HTML server-side (no client JS, no DB round-trip required for templates that don't need one). Replace the `e2e/email-screenshots.spec.ts` direct imports of `…-email.server.ts` modules with `page.goto('/dev/email/post-vote-share')` and screenshot — that path avoids the Playwright-transformer/`@optimitron/db/dist` `export *` parsing problem that knocked email screenshots out of visual mode. Once that's in, re-add `email-screenshots.spec.ts` to `MODE_SPECS.visual`.
- Add a banner on `latest.html` when missing-screenshot pairs exist, explaining cause (optional route absent on baseline, route skipped because returned 401/403/404, etc.) instead of just rendering N "not captured" boxes. The new publish gate (`steps.visual_regression.outcome == 'success'`) blocks the "all 62 missing" case, but legitimate per-route omissions still need explanation.
- Vercel preview-ready watcher + auto-screenshot of changed routes. When a Vercel deployment for the current branch transitions to READY: identify routes changed by the PR (`git diff origin/main...HEAD --name-only` filtered to `packages/web/src/app/**/page.tsx`), use chrome-devtools MCP (via `mcp__claude_ai_Vercel__get_access_to_vercel_url` for auth-gated previews) to screenshot each route, write `packages/web/output/playwright/pr-watch/<deploy-id>/review.html`, surface the preview URL + local review HTML link inline in chat. Currently the `/loop` cron `0feea8a0` (every 15 min, auto-background pattern: foreground spawns bg agent + exits) hits gh+Vercel state but the actual screenshot pipeline isn't wired yet. Deferred 2026-05-11 to keep the foreground turn short.
- Stop-hook check: detect "we should..." / "let's do that later" / "for now..." style deferrals in my own outputs and gate Stop until I capture them in TODO.md. Hard to detect reliably with regex; the memory rule `feedback_capture_decisions_in_todo` is the manual version for now.
- **Unify seed.ts + managed-data sync** (decided 2026-05-11, implemented on `feature/treaty-dashboard-message-first`). End state: single `pnpm db:sync:managed-data -- --apply` runs in prod / preview / CI / local; `seed.ts` is only a Prisma entrypoint shim.
  - [x] grandma-kay (commit `03c83520`)
  - [x] demo-user (commit `47b900d7`)
  - [x] reference data, catalog data, reasoning data, and treaty accountability tasks now live under `packages/db/src/managed-data`.
  - [x] **task-triggers** — managed trigger blueprints and idempotent upsert sync live in `packages/db/src/managed-data`; runtime firing, resolvers, MCP admin tools, and interactive create/update helpers stay in `packages/web`.
- [x] Add `Referendum` to the managed-data sync (commit `121e71df`). New `packages/db/src/managed-data/managed-referendums.ts` is the single source of truth for treaty + declaration + court-of-humanity. `syncManagedReferendums()` upserts on every deploy with content-hash change detection. `seed.ts` delegates to the same sync. CI ordering also fixed (`9891c60c`) — seed now runs before smoke, so the bundled-markdown fallback in `referendum-content.server.ts` now only fires for the legit preview-DB-with-null-body case and won't be exercised by the test path.
- Extract the large `actions/github-script@v8` inline-JS blocks in `ci.yml` (Resolve PR preview URL, Create Visual review deployment) into versioned `.github/scripts/*.js` files. Inline-in-YAML is fine for <20 lines; the two listed are 24-28 lines with non-trivial logic worth diffing + linting.
- Persisted organization grant request/application workflow. Current batch keeps grant impact as calculator/request framing only; add storage, review status, and automated foundation outreach in a later focused pass.
- Repo-wide "122 apocalypses" copy audit. List every version, rank clarity/funniness, and normalize the strongest explanation after this merge.

**Current branch hygiene**

- After each push, keep working on local tasks while GitHub Actions run instead
  of blocking the whole session on watching checks, unless the next step truly
  depends on a result.

**Dashboard and task UX**

- [x] Replace the logged-in dashboard with a focused share surface: plaintiff
  status, share message + copy button, collapsed disclosures for register-a-plaintiff /
  remind-overdue-presidents / endorse / assigned-tasks. Shipped PR #71 — the
  composer, leaderboard, plaintiff form, and full treaty text are no longer
  embedded; each lives only on its dedicated page.
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

**Post-vote email (decided 2026-05-11)**

- Build a single triggered email (not a drip) fired the moment `ReferendumVote.status == COUNTED`.
- Body is the "I love you and don't want you to suffer and die of horrible
  diseases" share message verbatim, with the user's referral URL inline.
- CTA above the body: "Hit forward, paste two email addresses, send. That's
  the whole job." The email *is* the forward-friendly recruitment vehicle, not
  a screen the user has to copy from.
- Reuses existing Resend pipeline + reply-handling + unsubscribe-on-reply rails.
- No subsequent drips. Reminder spam is explicitly banned (see PR #66
  "Disable generic overdue email reminders").

**Visual review and preview workflow**

- [x] Visual review surfaces a `Visual review` commit status pointing to the
  SHA-pinned gallery in the merge box (PR #71), replacing the 6-link bot
  comment that buried the actual gallery under filler.
- Add email-template screenshots to the visual review HTML. Render each email
  template (`buildMagicLinkHtml`, task-assignment, task-comment-notification,
  inbound-monitor-forward, the future post-vote forward email) with a
  representative token set, screenshot, and emit alongside the page
  screenshots in `latest.html`. Reviewers currently can't see email copy
  without setting up Resend locally + emailing themselves a test.
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

- Post-vote forward email + first-conversion email shipped (PR3). Voter receives
  a forward-friendly share kit on YES treaty vote. Referrer receives a single
  "Your link worked. Round 1 of 32" email on their first conversion only —
  never on subsequent conversions. Both deduped via `EmailLog.dedupeKey`.
- Monthly chain digest shipped (PR #74). Cron at `0 14 1 * *` calls
  `/api/cron/monthly-chain-digest`, which iterates every YES treaty voter
  with an email and sends one of two variants picked by past-30-day direct
  conversion count `N`:
    - `N > 0`: positive reinforcement. Subject names the count + month;
      body shows monthly + all-time totals + doubling-rounds math +
      dashboard link + canonical share footer.
    - `N == 0`: resend the forward kit. Subject `Still 30 seconds. Still
      two humans you love.` Body is the canonical share message verbatim.
      The zero-conversion user is exactly who needs the nudge; silence
      would have treated unconverted as user-failure when it's actually
      a we-failed-to-activate signal.
  Deduped per user per calendar month via
  `EmailLog.dedupeKey` = `monthly-chain-digest:{userId}:{yyyy-mm}`.
  Future enhancement: replace direct count with a transitive recursive CTE
  so the digest can show full chain size + which doubling round the user
  is actually on, not just direct conversions.
- `<ShareFooter>` retrofit shipped (PR #74) on `task-assignment-notification`
  and `task-comment-notification`. Both fetch the recipient's referral URL
  when `recipientUserId` is set and append the canonical share kit; external
  recipients (leaders' offices) get the email without the footer.
- [x] Email-template screenshots in the visual review. Implemented in
  `packages/web/e2e/email-screenshots.spec.ts`: renders magic-link,
  task-assignment, task-comment-notification, post-vote-share,
  referral-first-conversion, and monthly-chain-digest with representative
  tokens, screenshots them at email-client widths, and feeds them into the
  same `screenshots/<project>/` tree that `build-visual-review.mjs` walks.
  Email-* rows now appear alongside page screenshots in `latest.html`.
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

- [x] Add the plaintiff damages surface on `/plaintiffs` so visitors see the per-
  plaintiff recovery frame without first reading the case page.
- [ ] Add a live plaintiff/juror counter on `/court`.
- [ ] Finish `/court` as the Court of Humanity surface, with the case, verdict, and
  plaintiff/juror mental model connected to the 1% Treaty.
- Decide/create the "summon jurors" route if existing referral pages do not give
  a clean standalone target.
- Split dashboard vs president management: dashboard should link to president
  pressure; `/employees` or a clearer `/presidents` route should own the full
  president-management surface.
- [x] Add static/explicit sitemap coverage for `/humanity-v-government` and
  `/court`.
- [x] Add sitemap entries for public organizations.
- [ ] Split sitemap outputs when `500+` detail rows exist per type (tasks, people,
  orgs) instead of silent truncation.

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

### Near-term after managed-data sync

After the managed task tree is syncing and deployed, do the smallest high-leverage
user-facing work in this order:

1. Simplify the logged-in dashboard into the core action checklist: sign treaty,
   render verdict, register plaintiff, summon jurors, pressure presidents.
2. Simplify `/tasks/[id]` into the universal black-and-white task layout:
   header, assignee/due date, primary action, markdown body, comments, complete
   or reassign controls, admin disclosures.
3. Finish `/court` and the plaintiff/juror counter so the Court of Humanity
   frame connects cleanly to the 1% Treaty verdict.
4. Fix visual-review friction that wastes PR-review time: cache-busted pages,
   before-left/after-right layout, missing-pair failures, preview links, and
   deterministic animation settling.
5. Then handle messaging/email cleanup: central template registry, no generic
   reminder spam, optional plaintiff email only if the notice is useful, and the
   lightweight "forward to someone better-fit" task-assignment mailto.

### P0 — Court of Humanity integration on `/court`

The Court is the integrating institution that gives every other piece of the system a coherent purpose. Plaintiff = treaty signer = juror, one action, three roles. The treaty referendum IS the verdict vote. The 1% Treaty IS the settlement offer. Damages numbers are the same as the prize math. **Zero schema changes — every model already exists; only wiring + page-rendering work remains.**

**Canonical recruitment framing (decided 2026-05-07, refined after user correction):** "You have been summoned as juror #N in *Humanity v. Government*. You are also plaintiff #N. Your share of the demanded recovery: $10.6M (NPV) — $25.2M (lifetime cohort). Lives at stake: ~X. Years of suffering prevented: ~Y." This is standard class-action notice language — we are a class action and we frame ourselves as one. Damage numbers can be quoted as the demanded relief; that's pleading, not a payout promise.

**One narrow rule** (not a general MLM panic — the rule applies to one specific shape of claim): a class member's individual recovery is never conditioned on that member's personal recruitment. "Recruit two more jurors to claim your share" is the tripwire. "The verdict only binds governments at four billion plaintiffs, so we need every plaintiff to recruit two" is fine — that's about case enforceability across the class, not per-member payout eligibility. Governments aren't a typical defendant; a moral class action against them gets enforced by political pressure (the 4B-vote threshold) rather than by federal court order. Explain both halves to a recruit: their individual share is $X regardless; the case only collects at 4B votes.

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
- **Surface implicit class membership in the dashboard.** Every signed-in user is
  structurally already a plaintiff in *Humanity v. Government* (Rule 23(b)(3)-style
  automatic class membership for living humans harmed by government failure to
  address disease/war). The current model only formalizes the claim on YES vote.
  Add a dashboard line for users who haven't voted yet: "You are a potential
  plaintiff in *Humanity v. Government*. Render your verdict to formalize your
  claim. Your share: $10.6M–$25.2M." Schema-zero — pure UI surfacing of state we
  already track. Keeps the opt-in-via-voting default but makes the implicit class
  visible so users understand what they're in by default.
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
- **Add the 193 governments as `CourtCaseParty` rows of role `RESPONDENT`.** Capacity flips from `IN_DEFAULT` to `SETTLED_VIA_TREATY` as ratifications come in (drive from `government-leaders.ts` + ratification status). The page becomes narratively alive — every news event of a country ratifying is a defendant accepting the settlement.
- **Build `/court` page as the operational Court surface.** It currently renders
  the generic referendum stepper. Decide whether `/court` should remain the Court
  membership/signing flow or become the case dashboard; either way, the page
  needs the case caption, plaintiff/juror count, defendant status, settlement
  progress, and a single treaty/verdict CTA without adding another maze.
- **Reframe the post-vote share flow.** `TreatyPostVoteShareFlow.tsx` adds plaintiff-number framing alongside the existing impact framing: "You are now plaintiff #N in Humanity v. Government. The verdict needs more jurors." The recruitment ask becomes "register fellow plaintiffs," not "share the petition."
- **Test:** vitest covering case-creation, plaintiff-backfill, and the auto-register-on-vote hook; e2e screenshot covering `/court` with seeded data.

### P1 — MCP outreach email round-trip integration test

Done on `feature/managed-task-tree-sync`:
`packages/web/src/lib/__tests__/mcp-server.task-email.integration.test.ts`
covers task assignment email send + `Reply-To` routing + inbound reply becoming
a task comment and notifying non-author recipients. Do not rebuild the shipped
pipeline unless a real failure appears.

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

### P1 — Simplify task-detail page into a universal task surface

Do not build a right-sidebar metadata refactor. The newer direction is simpler:
title, assignee, due date, primary action, markdown body, comments, complete /
reassign controls, and admin disclosures. Remove duplicated status/governance/
owner/progress metadata when the same information is already in the header or
does not help the user complete the task.

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

### P1 — Plaintiff damages surface on `/plaintiffs/page.tsx` ✅ done

Shipped: the page renders a "Demanded recovery per registered plaintiff"
section above the conversion form with the $10.6M NPV (per
`CORPORATE_DAMAGES_FORWARD_SETTLEMENT_VALUE_PER_CAPITA`) and the
$25.2M lifetime cohort (per `LOST_PROSPERITY_LIFETIME_DAMAGES_PER_CAPITA`)
side-by-side, then an explanation of the family-share frame and the
4B-vote enforcement gate.

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

**Sequencing:** after the managed task-tree sync and dashboard/task-detail
simplification, unless email copy becomes the immediate production blocker.
The directory move locks in a place for the next 3-5 templates without
over-designing for variants we have not written yet.

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
5. **Delete dead `ARCADE_LABELS` dictionary** from
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

**Status:** shipped on `feature/managed-task-tree-sync` for task notification
email: outbound `TaskCommunication` emails set stable `Message-ID`,
`In-Reply-To`, and `References` headers, persist the message id in
`metadataJson`, and inbound replies use that header to nest under the outbound
task comment.

Original problem: outbound mail only set `List-Unsubscribe`. Inbound captured
`inReplyTo` into `TaskCommunication.metadataJson.inReplyTo`, but it was never
consumed. Mail clients would not visually thread the conversation; in-app
`parentCommentId` never got set on inbound replies.

- [x] **Generate stable `Message-ID`** per outbound `TaskCommunication`:
  `<task-{taskId}-comm-{communicationId}@{REPLY_EMAIL_DOMAIN}>`. Pass via Resend's `headers`.
  Persist on `TaskCommunication.metadataJson.messageId`.
- [x] **Set `In-Reply-To` and `References`** on subsequent sends in the thread by reading the
  most recent outbound `TaskCommunication` for the task.
- [x] **Resolve inbound `inReplyTo` → originating `TaskCommunication`** to set `parentCommentId`
  on the new `TaskComment`, so the in-app feed nests correctly.
- [x] **No schema changes.** All metadata fits in the existing `metadataJson` field.

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
- **Q5 — `components/ui/*` shadcn files**: preserve API surface, but use the
  current semantic black-and-white/treaty tokens. Do not reintroduce
  neobrutalist styling as a compatibility crutch.
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

## Humanity v. Government — plaintiff-first reframe + Earth Optimization Day

Strategic decision (2026-05-12): `/humanity-v-government`'s primary action becomes plaintiff registration, not the verdict vote. Plaintiffs are a stock that compounds (named, persistent, family-network-effected). Votes are a flow that decays (anonymous, easy to dismiss). A list of named dead is harder to ignore than a YES tally. The verdict vote moves to a seasonal mode tied to Earth Optimization Day.

### `/humanity-v-government` rework

- Hero: indictment + "if this were a corporation" framing (KEEP — it's the translation hook for non-legal readers) + single CTA "Name your dead" (plaintiff registration).
- Render running plaintiff count near hero. Concrete artifact > tally tick.
- Drop hero CTAs #2 ("Support the settlement" → `/vote`) and #3 ("Read the evidence" → external manual). Demote to footer.
- Cut decorative redundancy: collapse "The case caption" `<dl>` block, merge "If this were a corporation" + "Why this is a case" into one section.
- Move `DamagesSensitivityCalculator` up to be adjacent to / above the damages cards (it informs the vote; currently buried at page bottom).
- "The usual defenses" → collapsed `<details>` disclosure.
- Verdict vote widget stays but becomes a secondary action outside the EOD window.

### Make damages counterfactual explicit

Current copy says "since 1900, they spent $170T on war." Never makes the comparison explicit. Add one sentence stating: damages = what humanity would have had if governments had signed the 1% Treaty in 1900, freezing military spending and redirecting it to productive purposes (clinical trials, public goods). The numbers ($538K floor, $913K demand, $2.74M treble) ANSWER that counterfactual; right now they float without a baseline.

### Earth Optimization Day (new — August 6, Hiroshima anniversary)

- Annual global voting event. Aug 6 = the day humanity proved it could kill itself wholesale and decided not to stop.
- Frame: "distributed denial of death attack on humanity" — concentrated global vote on both the Court of Humanity verdict in Humanity v. Government AND the 1% Treaty.
- New page `/earth-optimization-day`. No existing implementation (only `earth-optimization-prize.ts` parameter + audio narration file).
- Single config function `isEarthOptimizationDayWindow()` flips the site into EOD mode during a configurable window (e.g. Aug 1–13). During the window: `/humanity-v-government` hero CTA swaps from "Name a plaintiff" to "Vote the verdict"; landing page hero swaps to countdown + live tally.
- Year-one MVP: countdown page + RSVP form + the two existing vote widgets. Mature version: live tally, post-event results page (verdict count, plaintiff count delta, treaty-vote delta).

### Open questions before implementation

1. **Plaintiff registration friction.** What's the current friction on `/plaintiffs`? Just name + cause-of-death, verified, or public/private toggle? Determines whether inline form on `/humanity-v-government` works or whether it has to link out.
2. **Non-bereaved users.** Should users without a personal loss be able to register as "plaintiffs of conscience" (public figure / general category), or are they only verdict-voters?
3. **Verdict vs treaty relationship.** Currently `/humanity-v-government`'s verdict and `/vote`'s treaty are separate referendums. Should a YES on the verdict imply a YES on the treaty (the settlement), or stay separate?
4. **EOD frequency + scope.** Annual Aug 6 only, or include solstices / other dates? Country-specific variants?

### Phase 2: extract treaty indictment to shared component

The treaty's WHEREAS opening clauses (defined inside the treaty `markdown` parameter at `packages/data/src/parameters/parameters-calculations-citations.ts`) are the canonical indictment language. They're now hand-mirrored into `/humanity-v-government/page.tsx` JSX. Risk: drift between the treaty doc and the JSX rendering.

Fix: extract the indictment clauses to structured TS constants under `@optimitron/data/messaging` (or similar). Build a `<TreatyIndictment>` React component that renders each clause with `<ParameterValue>` references baked in. Refactor BOTH the treaty markdown renderer AND `/humanity-v-government` to render from the shared source. Single source of truth, no drift risk.

Touches: the treaty markdown rendering layer (`packages/web/src/components/referendum/reader-markdown-components.tsx`), the parameter `markdown` field (may need to be derived from the structured constants rather than hardcoded prose), and `/humanity-v-government`'s indictment section.

### Sequence

1. Counterfactual sentence into damages copy (small, immediate).
2. Drop hero CTAs #2 + #3 on `/humanity-v-government`; swap primary CTA to plaintiff registration.
3. Add running plaintiff count near hero (social proof).
4. Cut decorative sections (case-caption `<dl>`, collapse defenses to `<details>`).
5. Move `DamagesSensitivityCalculator` up near the vote / damages cards.
6. *(Separate work)* Scaffold `/earth-optimization-day` page + `isEarthOptimizationDayWindow()` config.
7. *(Separate work)* Hook EOD config into `/humanity-v-government` + landing CTA swap.

## Treaty citation re-snapshot (after PR #75 merge)

After this PR merges and CI runs `db:sync:managed-data --apply` against prod, the
referendum row's `bodyMarkdown` will reflect the 3 upstream `manual_ref` fixes
(`604` → `1-percent-treaty`, `96.7%` → `peace-dividend`, `$2.46T` → `humanity-v-government`,
plus the `{{< var pentagon_unaccounted_funds >}}` substitution in 1-percent-treaty.qmd).
The treaty/h-v-g/endorse `.md` snapshots in this PR still show the OLD URLs because
the dev server reads the DB row, which is pre-sync at commit time.

Follow-up: on the next PR after this one ships and CI redeploys prod, run
`pnpm --filter @optimitron/web copy:preview` and commit the regenerated `.md`
files. One-cycle drift, expected.

The upstream changes (parameters.py + 1-percent-treaty.qmd) need a separate PR
in `disease-eradication-plan` so the generated TS file stays in sync with its
canonical source. Already authored locally in E:/code/disease-eradication-plan.

## Email file renames for human-readable clarity

User flagged that the current file names aren't natural-language ("the
current file names are not incredibly clear what the fuck they're
referring to"). Already updated each `*_PREVIEW`'s `displayName` to be
clearer (shows in `.email.md`). The actual filenames + template-id slugs
still use technical jargon and would need a cross-codebase rename.

Proposed renames (touch many imports across the codebase — separate PR):

| Current file / slug | Proposed |
|---|---|
| `magic-link-render.ts` / `magic-link` | `signin-link-email.ts` / `signin-link` |
| `post-vote-share-email.ts` / `post-vote-share` | `share-kit-after-vote-email.ts` / `share-kit-after-vote` |
| `referral-first-conversion-email.ts` / `referral-first-conversion` | `your-link-just-converted-email.ts` / `your-link-just-converted` |
| `monthly-chain-digest-email.ts` / `monthly-chain-digest` | `humanity-manager-monthly-report-email.ts` / `humanity-manager-monthly-report` |
| `task-assignment-notification-email.server.ts` / `task-assignment` | `task-assigned-to-you-email.server.ts` / `task-assigned-to-you` |
| `task-comment-notification-email.server.ts` / `task-comment-notification` | `someone-replied-on-task-email.server.ts` / `someone-replied-on-task` |

Each rename touches 5-10 import sites + the `.email.md` filename + the
e2e spec's slug. Better as its own focused PR than bundled with the
preview-envelope refactor.

## Previewable email index page

Currently `/dev/email/<template>` requires knowing the template slug.
Add `/dev/email` (no template) that lists all `EMAIL_PREVIEWS` with
their displayName + trigger + a link to each preview. Two queries:
- Default: Gmail-mobile wrapper preview for each
- `?raw=1`: index of raw body links for screenshot/markdown pipelines

~30 lines in a new `page.tsx` under `/dev/email/`. Reuses the existing
registry — no new abstractions needed.

## Humanity Manager workforce panel — dashboard ⇄ digest reuse

User asked: should the dashboard have a panel that mirrors the monthly
digest's "Humanity Management Status Report" view? Both surfaces would
share a component showing:

1. **Direct reports who completed their task**: name + estimated downstream
   vote count from each person's referral chain.
2. **Overdue humans**: count + names of assigned humans who haven't voted
   yet via this user's link.
3. **Overdue presidents**: count + named heads of government still
   missing the 30-second treaty task.
4. **Total downstream impact**: multiplier chain math derived from this
   user's actual converts × their own downstream depth (vs. the generic
   "32 doubling rounds" abstraction).

Reuse target: extract the new `MonthlyChainDigestReactEmail`'s data
sections (`CompletedEmployees`, `StatusTable`, `ReminderSection`) into
shared React components in `packages/web/src/lib/humanity-manager-*`
or `components/shared/HumanityManager*`. Dashboard renders them with
client-friendly primitives (`<table>` with treaty CSS vars,
`<ParameterValue>` tooltips where useful). Email renders them with
`@react-email/components` primitives.

Data dependencies (not yet implemented in the server):
- `completedEmployees: { displayName, completedAt, downstreamConversionCount }[]`
- `overdueEmployees: { displayName }[]` + `overdueEmployeeCount`
- `overduePresidents: { displayName, countryLabel }[]` + `overduePresidentCount`
- `downstreamConversionDepth(userId): number` — recursive count of
  conversions of conversions

The digest already has the React-component sections + the input
interface; the dashboard panel reuses them and the cron caller needs
to populate the new arrays (currently passes empty arrays).

Sequencing:
1. Extract digest sections to shared module.
2. Add dashboard panel consuming the shared sections.
3. Wire server-side data: chain-depth query, overdue-employee query
   (assigned-task-not-completed), overdue-president query (uses
   existing `signatories` data for "treaty signers per country").
4. Cron caller in `monthly-chain-digest.server.ts` populates from the
   same queries the dashboard panel uses.

## Post-vote-share email reframe — dashboard parity (DONE this commit)

Both `DashboardShareCard.tsx` and `post-vote-share-react-email.tsx` now
consume `packages/web/src/lib/humanity-manager-promotion.ts` as the
single source of truth for the "Humanity Manager · Assignment 1"
eyebrow + headline + 3-paragraph promotion prose. Dashboard renders the
parameter values inline via `<ParameterValue>` (tooltips preserved);
email renders them via `<strong>{fmtParamValueOnly(...)}</strong>`
(no tooltips — emails can't host hover popovers). Adding a new
parameter or copy edit goes in one place.

**Known small regression**: the dashboard's paragraph 1 used to link
"1% Treaty" to `/treaty` via inline `<Link>`. The structured-content
shape doesn't support inline links yet (would require a richer chunk
type). Dropped for now — the dashboard has plenty of other paths to
`/treaty`. Add back later if a chunk-with-link variant feels worth it.

## Monthly digest reframe — "Humanity Management Status Report"

Current `monthly-chain-digest-email.ts` reads like startup-bro nudge spam.
User pulled it up after the new `.email.md` snapshots and called it out:
"Would Kurt Vonnegut write this shit? Send them a nudge. I hate that word."
The `send them a nudge` phrase is banned. The whole frame is wrong.

Reframe goal: the recipient is a **Humanity Manager** receiving a monthly
status report on their direct reports (the 8 billion humans + the
presidents who report to those humans). Tone is corporate-deadpan
performance review — not pep talk.

Proposed sections (in monthly-chain-digest-email.ts builders):

1. **Header**: "Humanity Management Status Report — May 2026" /
   "Your jurisdiction: 8 billion humans, 195 governments." Or whatever
   the recipient's actual span of control is once we model that.

2. **Direct reports update — humans who voted through your link**:
   List the N humans who converted this month + their downstream chain
   depth (each person they recruited, and so on). Conveys multiplier
   chain-letter effect concretely instead of as the "32 doubling rounds"
   abstraction.

3. **Pending: humans on your span who have not voted**:
   Count + a copy-pasteable share message ("I love you and don't want
   you to die of disease..." or a Wishonia-voiced variant) the manager
   can drop into iMessage / SMS / WhatsApp to remind specific humans.

4. **Pending: presidents who have not signed**:
   For the recipient's country (and others if they want), list named
   leaders who haven't signed the treaty + a separate copy-pasteable
   "remind your overdue president/employee" message they can drop into
   social media (banned: "pressure," "political pressure" per CLAUDE.md
   — frame as overdue 30-second task).

5. **Total downstream impact**: multiplier chain math, but using THIS
   manager's actual numbers — not the generic 4.3B ceiling. E.g.
   "Your 7 direct converts brought 12 humans, who brought 4 humans.
   Total downstream so far: 23 humans signed. At the chain's current
   doubling rate, your line of influence reaches X humans by Y date."

6. **One CTA**: Open dashboard for full detail. Drop the share-footer
   chrome at the bottom — the copy-paste messages in sections 3 + 4 are
   the share affordance.

Banned phrasings to grep for during the rewrite:
- "send them a nudge"
- "your job this month is to..."
- "keep going"
- "humans you brought in"
- Anything that reads as a coach pep-talking the recipient.

Acceptable register: deadpan systems administration. "Quarterly objectives
unmet for the following direct reports. Recommended action: attached
templates."

Tests: rewrite `monthly-chain-digest-email.test.ts` to assert the new
sections render with the right fixture inputs. Update the .email.md
snapshots via `pnpm --filter @optimitron/web email:preview-md`.

## Email minimalism audit (partially addressed in this commit)

The `.email.md` snapshots shipped in this commit revealed pre-existing
violations of [[feedback_email_minimalism]]. Landed in this commit:

- `task-assignment.email.md` — dropped "Mark complete" secondary CTA and
  the "We are building a decentralized to-do list..." feedback chrome
  paragraph. Now title eyebrow + H1 + description + Open Task + reply
  instruction + share footer. Test updated.

Still open (call sites are more nuanced — share-footer is value-dense
and intentional per the [[feedback_email_minimalism]] "share-email flows
override with action-oriented labels" guidance):

- `monthly-digest-positive` / `monthly-digest-resend` / `referral-first-
  conversion` — each has a primary CTA (Open Dashboard) plus the share
  footer. Whether the share footer counts as a second CTA or as the
  intentional value-dense secondary action is a judgment call. Defer
  until the user looks at the rendered emails on mobile.

Magic-link is compliant (button + "Didn't request this? Ignore it.").
Task-comment-notification is compliant (single CTA + share footer).

## Email markdown previews (deferred — bigger than estimated)

Goal: voice-critic-able .md snapshots of outbound email copy. Currently the
copy-preview pipeline only covers public pages reachable from the dev server.

Initially estimated as a ~30-line bolt-on. Actual scope is larger because there
is no email-template registry: outbound emails are composed inline at call
sites with raw HTML strings or React Email components mid-function. There are
no `/dev/email-preview/*` routes either.

To do this properly:
1. Add `src/emails/templates/<name>.tsx` files (one per discrete outbound
   email — sign-in link, share-prompt, signer-reminder, etc.).
2. Refactor the call sites in `src/lib/email/*.ts` to use those templates
   via `react: <TemplateName .../>` so prod and previews render identical HTML.
3. Add `pnpm --filter @optimitron/web email:preview-md` that imports each
   template, calls `@react-email/components` `render()` with realistic fixtures,
   pipes the HTML through a jsdom-driven version of the same DOM walker as
   `render-pages-to-markdown.ts`, and writes `*.email.md` next to each template.
4. Share the walker (extract to `packages/web/src/lib/dom-to-markdown.ts`)
   so page-preview and email-preview both benefit from text-transform,
   anchor-preservation, and table support.

Touches: ~6 new template files, ~6 call-site refactors, 1 new script,
1 extracted helper. Not 4B-blocking.

## Claude Code automation candidates (from this session's recommender skill)

Candidates flagged by `/claude-code-setup:claude-automation-recommender` and
worth picking up when they hit a real friction point. Don't preemptively
build all of them — wait for the second time the friction recurs.

1. **Neon MCP server** — read-only Postgres access for inspecting the
   prod-shared dev DB without spinning up tsx scripts. Critical caveat:
   read-only only, dev DB is prod-shared.
2. **context7 MCP server** — live docs lookup for Next.js 15 / Tailwind 4 /
   Prisma 7 / React Email. This session's missed-CSS-import + missed
   `"use client"` boundary issues would have been caught upfront.
3. **`optimitron:regen-snapshots` skill** — package `pnpm copy:preview` +
   `pnpm email:preview-md` as one slash command. User-only (writes files).
4. **`optimitron:wishonia-voice-check` skill** — pass arbitrary copy to
   the existing voice-critic agent without going through `.md` diff flow.
5. **`PostToolUse(Edit|Write)` hook on `src/lib/email/*-react-email.tsx`** —
   auto-regen `.email.md` snapshots at write time. Debounced to avoid
   running on every keystroke.
6. **`parameter-citation-verifier` subagent** — walk every `<ParameterValue>`
   in `app/**/page.tsx`, verify `manualPageUrl` is topically aligned with
   the qmd it points at. Would have caught the `604`→central-banks bug
   before voice-critic exposed it.
7. **`email-content-auditor` subagent** — content-based check on
   `.email.md` (count CTAs, detect banned phrases like "send them a
   nudge"), replacing the current filename-pattern EMAIL_MINIMALISM gate.

## Codex review followups (caught by `codex exec` 2026-05-12)

- Drop the orphaned [[share-footer.ts]] module (no callers after the
  React Email migration). Move its `FOOTER_EYEBROW` / `FORWARD_LINE`
  constants into `CampaignShareFooter` if anything still needs them.
- `appendWishoniaSignature()` in [[wishonia-signature.ts]] now only used
  by its own unit tests. Either delete + delete the tests, or wire it
  back into a real send path. Decision needed.
- Add a focused test in `resend.test.ts` forcing `getBaseUrl()` /
  `buildUnsubscribeUrl()` to return localhost and asserting all three
  send paths refuse before `resend.emails.send` — including a case
  where localhost only appears in the `List-Unsubscribe` header.
- Add an unsubscribe-route test where `verifyUnsubToken` returns false
  for an RFC 8058 POST and asserts no DB mutation occurs.

## Codex integration setup (DONE this commit, durable references)

- `.codex/config.toml` ships `model_reasoning_effort = "high"`.
- `openai/codex-plugin-cc` installed at user level; provides:
  - `/codex:adversarial-review` — challenge a design decision
  - `/codex:rescue` — delegate task as background subagent
  - `/codex:review` — straight code review
  - `/codex:status` / `/codex:result` / `/codex:cancel` — job management
- Stop-time review gate enabled (`/codex:setup --enable-review-gate`).
  Marks `needsReview: true` on Stop events but does not auto-spawn
  Codex; Claude must invoke `/codex:review` to actually run.
- Speech-to-text note: user dictates "Codex" as "Kodak" — treat as alias.

## Long-tail (parked, not 4B-blocking)

Items that exist in earlier TODO revisions but do not move the 4B-votes needle today.
Bring back here only if the work directly removes a P0/P1 gap above.

- Multi-agent / service-account architecture (Phase 0-3 build plan).
- AP2 / ACP / x402 agentic-payment wiring.
- Optimitron root rewrite / `/features` archive. War on Disease is the active
  front door; do not spend campaign time rebuilding the Optimitron landing page.
- Donate-to-fund-task marketplace, Stripe Connect outbound disbursement, prize-
  pool deposit UI, VOTE-for-task-completion, WISH airdrop, IAB lobbying, and
  DAO-governed funding. Bring these back only after the vote/referral/court
  funnel is boring and measurable.
- Dead-people-voting PRD (memorial form, dead-person registration, prosecution dashboard).
- DIH feature migration (porting from `dih-neobrutalist`).
- MCP queue sync items not on the 4B critical path (commission page, EV calculator,
  generic referendum system).
