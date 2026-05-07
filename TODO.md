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

**MCP-driven outreach pipeline (continuing PR #58):**

- MCP `createTask` now fires the assignment email on creation. Best-effort
  via the existing `notifyTaskAssigneeOfAssignment` helper, mirroring the
  web-side call site. `packages/web/src/lib/mcp-server.ts:6543`.
- Non-admin MCP scope creating an org-assigned task no longer errors —
  defaults to `isPublic: false` so Wishonia's outreach to organizations is
  not auto-broadcast on the public Earth feed. Admin scope keeps the public
  default for leader/president/treaty-activation tasks.

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

### P0 — Court of Humanity integration on `/court`

The Court is the integrating institution that gives every other piece of the system a coherent purpose. Plaintiff = treaty signer = juror, one action, three roles. The treaty referendum IS the verdict vote. The 1% Treaty IS the settlement offer. Damages numbers are the same as the prize math. **Zero schema changes — every model already exists; only wiring + page-rendering work remains.**

Manual reference: `manual.warondisease.org/knowledge/solution/court-of-humanity.html`. Indictment text: `manual.warondisease.org/knowledge/appendix/humanity-v-government.html`. Damages parameters: `manual.warondisease.org/knowledge/appendix/parameters-and-calculations.html`.

- **Schema is already in place.** `CourtCase`, `CourtCaseParty`, `CourtCaseClaim`, `CourtCaseHarm`, `CourtCaseEvidence`, `CourtCaseRemedy` at `packages/db/prisma/schema.prisma:4342+`. `juryReferendumId` field already links a case to a `Referendum`. `enforcementTaskId` field already links a remedy to a `Task`. MCP tools already exist for all six entities (`addCourtCaseClaim/Evidence/Harm/Party/Remedy`, `upsertCourtCase`, `getCourtCase`, `openCourtCaseJuryVote`).
- **Seed `Humanity v. Government` as a `CourtCase` row.** Status `OPEN`, `juryReferendumId` = `one-percent-treaty` referendum, primary respondent = synthetic "Governments of Earth" `Subject`, nominal plaintiff = synthetic "Humanity" `Subject`. Three counts as `CourtCaseClaim` rows (Direct Killing, Regulatory Delay, Misallocation) with manual-section URLs as evidence citations. Harms as `CourtCaseHarm` rows linked to parameter constants (310M war deaths, 102M efficacy-lag deaths, etc.). Settlement remedy = "Ratify the 1% Treaty" with `enforcementTaskId` pointing at the existing singleton ratification task.
- **Backfill: every existing treaty voter becomes a `CourtCaseParty`** of role `PLAINTIFF`, capacity `INDIVIDUAL`, `subjectId` = the voter's `Person.subjectId`. One-time migration script in `packages/web/scripts/backfill-court-plaintiffs.ts`. Idempotent. Run once, then add a hook to `recordReferendumVote` so future voters auto-register.
- **Add the 193 governments as `CourtCaseParty` rows of role `RESPONDENT`.** Capacity flips from `IN_DEFAULT` to `SETTLED_VIA_TREATY` as ratifications come in (drive from `government-leaders.ts` + ratification status). The page becomes narratively alive — every news event of a country ratifying is a defendant accepting the settlement.
- **Build `/court` page.** Currently empty (`packages/web/src/app/court/page.tsx`). Render: case caption, three counts with body-count numbers, live plaintiff count, three columns of defendants (settled / served / in-default), settlement progress bar, single CTA "Register as plaintiff = sign the treaty." Reuse `VoteCounterSplit` component for the plaintiff count.
- **Update `/humanity-v-government` page** to render the local case rather than redirecting to the manual. Manual stays as the doctrinal long-form; site presents the case in operational form.
- **Reframe the post-vote share flow.** `TreatyPostVoteShareFlow.tsx` adds plaintiff-number framing alongside the existing impact framing: "You are now plaintiff #N in Humanity v. Government. The verdict needs more jurors." The recruitment ask becomes "register fellow plaintiffs," not "share the petition."
- **Test:** vitest covering case-creation, plaintiff-backfill, and the auto-register-on-vote hook; e2e screenshot covering `/court` with seeded data.

### P0 — Stage 2: President Manager promotion

After a user finishes HMT, the funnel currently dead-ends. They get promoted in language but no
new task. The roster of 193 leaders exists but the per-slot trigger is **disabled**, so the
country-leader pairing has nowhere to land.

**Reframe in the Court frame:** the Stage-2 task is no longer "find your country's leader and ask them to sign a petition." It is "your country's defendant has not accepted the settlement; demand they do." Same engineering work; copy and incentive structure shift to plaintiff-vs-defendant framing. Coordinate with the Court integration above so language is consistent.

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

### P0 — Live vote/plaintiff counter on landing and `/court`

`VoteCounterSplit` already exists but only renders on `/signatories`. The landing page shows
no signal of momentum. Recruits respond to "X people have voted today" more than to abstract
math. Drop the component into `OnePercentTreatyLandingPage.tsx` above or beside the vote flow,
and onto `/court` as the live plaintiff count.
Server-side count via existing `prisma.referendumVote.count` calls in `lib/dashboard.server.ts:117`.

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
- **Fan out inbound replies to all watchers**, not just the creator. Replace the
  bespoke `resolveCreatorEmail` block at `email/inbound-reply.ts:274` with
  `notifyTaskCommentRecipients({ commentId, ... })` — the helper already filters the author
  out and notifies creator + assignee + endpoints + admin monitors.
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

### P2 — Agent profile pre-creation (image + draft-approve)

Wishonia should be able to pre-build org and public-official profiles from public data, then email the subject with an approve / edit / decline action — instead of asking the subject to fill out a blank form. Lowers friction at first contact. Two new MCP capabilities. **Minimal schema change: 2 new enums.**

- **Image upload via URL.** New MCP tool
  `setOrganizationLogo({ organizationId, sourceUrl, kind: "wide" | "square" })`. Backend
  fetches the URL itself, blocks SSRF (private IPs, link-local), caps Content-Length (10 MB),
  validates MIME post-download, resizes to canonical dimensions (1200×630 wide, 512×512
  square), and stores on whatever blob provider is wired up. Verify provider before
  implementation. Agent never handles bytes.
- **Draft-approve flow.** Add `Organization.draftStatus` and `Person.draftStatus` enum
  (`AWAITING_SUBJECT_APPROVAL | APPROVED | DECLINED | DELETED_BY_REQUEST`). Default to
  `APPROVED` for human-created records to avoid migration disruption.
- Add `Person.subjectKind` enum (`ORGANIZATION_AGENT | PUBLIC_OFFICIAL | PRIVATE_INDIVIDUAL`).
  MCP `createPerson` refuses `PRIVATE_INDIVIDUAL` from non-admin scope. For public officials,
  every agent-created field requires a `sourceUrl` — no inferred political stances without a
  citation, mitigates GDPR Art. 9 + defamation exposure.
- Approve / edit / decline / delete email template in Wishonia voice. Token-signed URLs, no
  auth required for the first action (one-click delete-my-profile is the GDPR Art. 17 escape
  hatch baked into every email).
- Auto-approve after 30 days only for `PUBLIC_OFFICIAL` subjects (sitting senators, named
  regulators). Never for orgs or private individuals — those must opt in.

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

## Open questions

- Stage 3 after the user's leader signs: another role-play promotion, or just keep the
  parent task running with referral-chain visualization? Not blocking Stage 2.
- Is the "Late employee program" task section currently rendering on the LANDING page
  (pre-signup)? If yes, pull it — assigning tasks before commitment is friction. Verify
  before touching.
- HMT graduation quiz: gate or optional? Default to gating (P2); optional with a graduation
  badge is the soft fallback if funnel data shows excessive drop-off.
- **"Two Questions on the Same Ballot" (court-of-humanity manual section): does the treaty
  vote stay as a single question that is rhetorically read as both a treaty-yes and a
  verdict-yes, or do we surface them as two coupled questions on the ballot UI?** The single-
  question version preserves all existing voter records and copy; the two-question version
  is more legible but requires referendum-schema work and breaks attribution math. Default to
  single-question with dual framing in copy until funnel data argues otherwise.
- Sortition mechanism for case-level adjudication (selecting 100–1000 verified humans per
  case via VRF) — needed only when the Court adjudicates cases beyond `Humanity v. Government`.
  Not on the 4B critical path. Park.
- Public-official `Person` records: where does the `subjectKind: PUBLIC_OFFICIAL` sourcing
  come from? `government-leaders.ts` already has 193 leaders with verified contact data —
  extend to include `sourceUrl` per field, then the agent's role is just keeping it current,
  not inventing it.

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
