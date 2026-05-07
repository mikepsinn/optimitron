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
  registration was already wired in the represented-people route. Backfill script for
  pre-existing voters still needed (one-time `packages/web/scripts/backfill-court-plaintiffs.ts`).
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

- **"Two Questions on the Same Ballot" (court-of-humanity manual section): does the treaty
  vote stay as a single question that is rhetorically read as both a treaty-yes and a
  verdict-yes, or do we surface them as two coupled questions on the ballot UI?** The single-
  question version preserves all existing voter records and copy; the two-question version
  is more legible but requires referendum-schema work and breaks attribution math. Default to
  single-question with dual framing in copy until funnel data argues otherwise.

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
