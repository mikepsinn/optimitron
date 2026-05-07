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
- **Primary site:** `warondisease.org`. Treaty text host: `1percenttreaty.org`. App: `optimitron.com`.
- **Tree:** every task on the site is a child of `win-earth-optimization-prize`
  (`packages/web/src/lib/tasks/task-keys.ts:21`).

## What's shipped (2026-05-07)

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

**Diagnostics:**

- New-user funnel screenshot harness for warondisease + optimitron + dfda variants.
  `packages/web/e2e/new-user-flow-screenshots.spec.ts`.
- `VoteCounterSplit` live count component (used on `/signatories`, not yet on landing).
  `packages/web/src/components/referendum/VoteCounterSplit.tsx`.
- MCP errors wired to Sentry (`packages/web/src/app/api/mcp/route.ts` catches).

## Gaps blocking 4B

Ordered by funnel-stage impact. P0 = ship next; P1 = right after; P2 = before launch.

### P0 — Stage 2: President Manager promotion

After a user finishes HMT, the funnel currently dead-ends. They get promoted in language but no
new task. The roster of 193 leaders exists but the per-slot trigger is **disabled**, so the
country-leader pairing has nowhere to land.

- **Enable `treaty:signer` blueprint.** Currently `enabled: false` at
  `packages/web/src/lib/triggers/blueprints/one-percent-treaty.ts:360`. Flip to `true` once
  there's a destination for the spawned tasks.
- **Add `user-onboarding:treaty:promotion-stage-2` trigger** in the same blueprint file.
  Fires on `task.statusChanged.VERIFIED` with eventFilter for the user's `completeTraining`
  taskKey. Spawns:
  - A promotion comment on the user's HMT root (corporate-HR voice: "Acting President Manager").
  - A pre-targeted task: "[Leader name] is N days overdue on signing." Resolves
    `user.countryCode` → `treaty:signer` slot. Fallback: a generic "find your leader" task if
    the country isn't in the 193-slot list.
  - Action-link to the leader's contact page or a Google search for office contact, with the
    user's `referralCode` embedded in the share URL so a leader signature converts back.
- **Dashboard surfaces Stage-2 task as new primary CTA** when present. Past HMT subtasks
  collapse to "✓ done" rows. Touches
  `packages/web/src/components/site/TreatyTaskDashboardClient.tsx` +
  `packages/web/src/components/tasks/PresidentManagementSystemSection.tsx`.
- **Test:** end-to-end vitest exercising signup → 5-subtask completion → Stage-2 spawn →
  dashboard reorder.

### P0 — Live vote counter on landing

`VoteCounterSplit` already exists but only renders on `/signatories`. The landing page shows
no signal of momentum. Recruits respond to "X people have voted today" more than to abstract
math. Drop the component into `OnePercentTreatyLandingPage.tsx` above or beside the vote flow.
Server-side count via existing `prisma.referendumVote.count` calls in `lib/dashboard.server.ts:117`.

### P1 — Round-progress visualization

Humans see "vote → magic link → done" with no signal of where they are in the 32-round chain.
Add a small visualization on `/dashboard` and on the post-vote share screen that shows:

- Their direct referrals (assignFirstHuman + assignSecondHuman + ?ref= conversions).
- Their downstream chain depth (recursive count via `User.referredByUserId`).
- "Current round" inferred from total verified-vote count vs. `2^round` thresholds.

Even a stub component that just shows "You + 2 direct + N downstream" is more concrete than
the abstract math currently in the phone script.

### P1 — Hardcoded-stats audit

`*Linked` infrastructure is shipped but not enforced. Numbers like "60 million", "150,000",
"4 billion" still appear as literals across landing + email + component copy. Each is a
credibility leak (no source link) and a drift risk.

- Grep for canonical literals in `packages/web/src/components/landing/`,
  `packages/web/src/lib/email/`, and `packages/web/src/lib/tasks/`. Replace with `*Linked`
  via the trigger framework, or with `<ParameterValue>` in JSX.
- Add a vitest that fails if the trigger blueprint or treaty-share-flow components contain
  literal numerals matching `\b(604|443|36|122|150,000|60 million|4 billion)\b`.
- Known offender: `WISHONIA_WELCOME_COMMENT` in `lib/tasks/user-treaty-task.server.ts` (verify
  it's still used; if dead code, delete instead).

### P1 — Mortality stat in magic-link email

S1's mortality-stat line never landed in `magic-link-render.ts`. One sentence between the
button and the anti-phishing line: "About 150,000 humans will die from disease today. The
treaty you're about to vote on shortens that timeline." Variant-aware: only on
`warOnDisease` + `optimitron`. Test in `magic-link-email.test.ts`.

### P2 — Earth Optimization Day annual trigger (Aug 4)

Annual ritual: every Humanity Manager gets a one-day task to share their referral URL across
every channel they own. Already capable in principle via TaskTrigger `schedule` +
`iterationSource`.

- New blueprint file `packages/web/src/lib/triggers/blueprints/earth-optimization-day.ts`
  (separate from one-percent-treaty so it outlives the treaty campaign).
- Trigger key `program:earth-optimization-day:annual`, schedule `0 9 4 8 *`,
  iterationSource `users.activeHumanityManagers` (add if missing).
- Per-user task spawned under HMT root with year-suffixed kind for idempotency.
- Action-link to a new `/earth-optimization-day` page bundling pre-filled share buttons.

### P2 — HMT graduation quiz

Gate Stage-2 promotion behind a 7/9-correct quiz that confirms the user can articulate the
case before recruiting. Each question backed by a parameter export so the answer key links
to the manual.

- Question bank in `packages/data/src/quizzes/humanity-management-training-quiz.ts`.
- New page `/humanity-management-training/quiz` (or `/dashboard/quiz`); randomize order;
  no cooldown on retake.
- New HMT subtask `passQuiz` (sortOrder 60) gating Stage-2 trigger.
- Two missing parameters to add: `PRE_WWII_US_MIL_SPEND_GDP_PCT`,
  `POST_WWII_US_MIL_SPEND_GDP_PCT`.

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

## Open questions

- Stage 3 after the user's leader signs: another role-play promotion, or just keep the
  parent task running with referral-chain visualization? Not blocking Stage 2.
- Is the "Late employee program" task section currently rendering on the LANDING page
  (pre-signup)? If yes, pull it — assigning tasks before commitment is friction. Verify
  before touching.
- HMT graduation quiz: gate or optional? Default to gating (P2); optional with a graduation
  badge is the soft fallback if funnel data shows excessive drop-off.

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
