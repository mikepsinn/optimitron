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
   below). After HMT graduation users currently dead-end. The 193-
   leader roster is sitting with `enabled: false` on the spawn
   trigger. Once turned on with a destination task, every HMT-completer
   becomes a recruiter for their country's leader. Largest single
   funnel multiplier still unshipped.

Everything else (right-sidebar metadata, milestone-to-subtask
deprecation, email threading, prize wire-up, etc.) is real work but
downstream of these three.

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

### P1 — "Delegate or decline" path on assigned task emails

Every assignment email today gives the recipient two options: do the task or
ignore it. Ignoring is the path of least resistance, so most low-priority
assignments quietly orphan. Adding a third path — *delegate to someone better-
fit* — turns an opt-out into a recruitment event: every "not for me" becomes
either an existing Person picking it up or a new Person joining the network.

**Framing (consistent with HMT corporate-promotion voice):** "Don't want to or
can't do this? Good news. You have been promoted to Humanity Manager at Earth
Optimization Services LLC. Delegate this task to someone better-fit. Add their
email or pick from people you already know on the platform." The promotion
is real — the EOS LLC half of the prize structure is the operational arm of
the campaign, and "Humanity Manager" is the canonical role for any user
routing other humans toward verdict-rendering work.

**Implementation, schema-zero:**

- Email template change (`task-assignment-notification-email.server.ts`): add
  a "Delegate this task" section under the primary CTA with a deep link to
  the task page (or a dedicated `/tasks/[id]/delegate` route).
- New POST `/api/tasks/[id]/delegate` taking either `{ personId }` (existing
  Person) or `{ name, email }` (new Person). Caller must be the current
  assignee.
- For the existing-Person case: swap `assigneePersonId` immediately, write a
  `TaskComment(kind: SYSTEM, source: AGENT)` audit row ("Alice delegated to
  Bob"), fire `notifyTaskAssigneeOfAssignment` for the new assignee.
- For the new-Person case: do NOT swap immediately. Send the new person a
  confirmation email ("Alice thinks you should handle X — click to accept or
  decline"). On accept, create the User if needed, swap assignment, audit.
  This avoids the spam/harassment attack where someone weaponizes
  delegation against a target.
- Rate-limit per delegator (same shape as the feedback `FeedbackRejectedError(rate_limited)`
  we shipped) — N delegations per 10 minutes.
- Front-end form on the task page: search-existing-people dropdown
  (reusing the dedup pre-search helper from the plaintiff-dedup work) +
  "or add a new person" input with name + email.

### P0 — Task detail page: conditional leader-accountability blocks

`/tasks/[id]/page.tsx` is 761 lines, 17 imported block components, ~13
vertically stacked content zones. Industry standard (Linear, Asana,
GitHub Issues) is 3 zones (title+body / right sidebar / comments).

**The single biggest UX problem:** leader-accountability blocks
(`TaskRemindEmployee`, `TaskBlockerCard`, `TaskUnlocks`,
`TaskCurrentActivities`) render unconditionally. They were designed
for the treaty-signer political-pressure mechanic ("president X is
overdue, here's how to pressure them") and on those pages they're
load-bearing. But they ALSO render on outreach tasks (e.g., the IAM
foundation-join task I just sent), where they're confusing — the
foundation lead sees a "Remind Employee" block targeted at them.

**Fix:** the page already computes `isTreatySigner` at line 540.
Extend that gate to wrap `TaskRemindEmployee`, `TaskBlockerCard`,
`TaskUnlocks`, `TaskCurrentActivities`. For non-treaty-signer tasks
(outreach, internal work, generic), they don't render. ~30 lines
diff. Schema-zero. Shrinks the IAM-style task page from ~13 zones
to ~5 — closer to industry standard, primary action ("Claim",
"Mark complete") becomes findable above the fold.

**Don't break:** the treaty-signer accountability density is
intentional — the political-pressure mechanic relies on those blocks
being visible on every leader page. Conditional gating preserves
that path.

### P1 — Task detail right-sidebar metadata pattern

After the P0 conditional gating, the next-biggest gap is metadata
position. Status / assignee / due date / claim policy / claim count /
milestones / sources stack vertically inline with content; the
desktop right rail is wasted. Standard pattern (`lg:grid-cols-[1fr_320px]`)
puts metadata in a right rail, body in the main column. Mobile
collapses to single column. Multi-day refactor; do after P0 to know
which blocks survive.

### P1 — Move claim / complete action row above the fold

Today rendered after ~6 informational blocks. Industry standard puts
primary actions either at the top right (sidebar pattern) or directly
under the title. ~10 lines to move it to render right after
`<TaskHeroStats>`. Becomes trivial after the P0 conditional-gating
ship: with leader blocks gone for outreach tasks, the action row
naturally falls higher.

### P2 — Deprecate `TaskMilestone`, replace with subtasks

Subtasks subsume every milestone capability and add: assignability, due
dates, claim flow, comments, sub-children, full TaskStatus granularity.
Milestone is a weaker, redundant model. Only thing it does that
subtasks don't is render as a compact `X/Y reached` progress strip at
the top of the parent task — a UI choice, not a data-model
justification (subtasks could render the same strip by counting
children where status === VERIFIED).

Surface area for migration:
- One-time script: each `TaskMilestone` → child `Task` with
  `parentTaskId = milestone.taskId`, status mapped from
  `TaskMilestoneStatus`, `completionEvidence = milestone.evidenceNote`,
  `sourceUrl = milestone.evidenceUrl`. Soft-delete the milestone row.
- Update `/tasks/[id]/page.tsx` milestone strip to count subtasks
  where `status === VERIFIED` over total child count.
- Remove milestone references from: page, server helper at
  `lib/tasks/milestones.server.ts`, API route at
  `app/api/tasks/[id]/milestones/[milestoneId]/route.ts` + test, and
  the `TaskMilestoneEditor` component.
- Drop `TaskMilestone` model in a separate schema PR (per the
  AGENTS.md rule that schema changes get their own PR).

Schema change required (drops a model). Run the data migration first;
verify all milestones converted to subtasks and visible on their
parent task pages; THEN ship the schema-removal PR. Don't combine the
two.

### P2 — Admin task blocks behind a disclosure

`Curator Verification` and `Pending Claim Reviews` render inline in
main content flow for admins. Industry standard puts admin tools in
a separate panel or behind a disclosure. Low urgency since admin =
small audience.

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

### P1 — Per-send template content hash for conversion analysis

Resolves the false dichotomy in the human's earlier question (templates
in DB vs code). Templates stay in code (git history = version history,
typechecked, code-reviewed). Each `TaskCommunication` records
`templateContentHash: sha256(rendered)` in the existing `metadataJson`
field — schema-zero. Conversion analysis groups rows by hash, counts
replies / completions per group, gives per-version conversion data
without DB-storing the templates themselves.

At our current scale (~50 sends total), per-version conversion data
is statistically meaningless — we'd need hundreds of sends per variant
for signal. So this isn't urgent for measurement; it's urgent because
it locks in the data shape now so when scale arrives the data is
already there. Adding the field is ~10 lines in `task-notifications.server.ts`
where the draft + send happens.

### P1 — Action-oriented menu labels + plaintiff damages surface

Two related copy / placement tweaks discovered during the foundation-outreach
smoke test, both schema-zero:

**Menu labels (warondisease.org top nav).** Current labels are passive
(*Vote, Plaintiffs, Read the Treaty, The Case*). Action-oriented variants
match the Court frame already canonical elsewhere: *Render the Verdict*
(→ `/vote` or `/humanity-v-government`), *Become a Juror* (→ `/court`),
*Register a Plaintiff* (→ `/plaintiffs`). The verdict-render + juror
phrasing only currently appears on `/humanity-v-government/page.tsx`
(the case page I built this session); the nav is plain. One-line label
edits in `routes.ts` (`whyLink`, `plaintiffsLink`, `treatyVoteLink`) plus
the `warOnDiseaseShareLink` and `warOnDiseaseFundLink` aliases in
`site.ts`. Hold pending the broader nav-reorg conversation, but the
relabel itself is small and reversible.

**`/plaintiffs/page.tsx` does NOT show damages.** It imports
`WAR_DEATHS_SINCE_1900` and military-spending parameters but not
`CORPORATE_DAMAGES_FORWARD_SETTLEMENT_VALUE_PER_CAPITA` or the cohort
constant. So a visitor sees the gallery without learning what each
registered plaintiff is owed (~$10.6M NPV / $25.2M lifetime cohort).
The case page surfaces this; the registration page should too. ~30
lines of JSX added under the existing parameter imports — schema-zero.
Strong candidate for next ship because it converts visitors who land
on `/plaintiffs` from the case page CTA without first reading the case.

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

**Target organization (proposed):**

1. **One `lib/communications/templates/` directory** with one file per
   template family: `assignment-notification.ts`,
   `comment-notification.ts`, `magic-link.ts`, `outreach-foundation-join.ts`,
   `outreach-leader-sign.ts`, `treaty-share.ts`, etc. Each exports
   `{ subject, html, text, tokens }` builders or a `ShareTemplate`-shape
   record. Same pattern as `share-templates.ts`.
2. **`lib/communications/registry.ts`** — central index mapping
   template IDs → builders, the way `share-templates.ts` already does
   for share copy. Lets MCP tools / agents enumerate templates.
3. **MCP tools** (added to `mcp-server.ts`):
   - `listCommunicationTemplates({ category? })` — admin-scope only;
     returns id + label + tokens + sample-rendered preview.
   - `generateCommunicationTemplate({ templateId, tokens, recipient })`
     — renders a template with provided tokens for inspection /
     attachment to a task. Doesn't send; just returns the rendered body.
   - Together these let Wishonia (or a human via Claude Code) pull
     "give me the foundation-join template tuned for X" without
     hardcoding the copy in chat.
4. **Trigger blueprints reference the registry** — rather than inline
   `bodyTextTemplate` strings, blueprints reference `templateId:
   "outreach-foundation-join"` and the trigger framework looks up the
   builder. Lets one template power both human-driven outreach (via
   the MCP tool) and automated cron-driven outreach.

**Cost:** the move itself is medium-sized (~200-400 lines, mostly file-
moves and one new registry). The MCP tools are 30-50 lines each on top
of the existing tool dispatch pattern. Schema-zero.

**Sequencing:** do this AFTER the immediate "make foundation outreach
work end-to-end" loop is proven. Don't refactor the template layout
before we know what shape templates we actually need at scale. The
smoke test just validated the mechanical email loop works; the next
step is sending more outreach with copy variations to learn what
converts. THEN centralize what survives.

### P1 — Subtask creation by any user (decentralized to-do tree)

The `POST /api/tasks` REST endpoint's `CreateTaskBodySchema` does NOT
include `parentTaskId` — so any logged-in user can create top-level
tasks but cannot attach them to existing parents through the public
API. The underlying `createTask` server function + the MCP `createTask`
tool both support `parentTaskId`; only the REST schema strips it.
There's also no "Add subtask" UI on `/tasks/[id]`.

For the "decentralized to-do list for humanity" framing, this is the
gap. Fix:

1. Add `parentTaskId: z.string().nullish()` to `CreateTaskBodySchema`
   in `app/api/tasks/route.ts` (1 line).
2. Add a small "Add subtask" form to `/tasks/[id]/page.tsx` —
   gated to `task.isPublic: true` parents so private outreach tasks
   aren't subtask-spammed.
3. Default new subtasks to `isPublic: false`. The parent-task creator
   sees them on their /dashboard and chooses what to publicize. This
   is the spam-protection lever — any user can suggest, parent-task
   creator decides what gets surfaced.

Schema-zero. ~40 lines of code total. Strong leverage for the
"Wikipedia-meets-todo-list for the campaign" thesis.

### P1 — Tasks-page / dashboard / presidents restructure

Currently `PresidentManagementSystemSection` renders in two places:
inside `/dashboard` (TreatyTaskDashboardClient) AND on `/employees`
(its dedicated route). Confusing mental model.

Cleaner separation:

- **`/dashboard`** = personal: your handle, share link, your assigned
  tasks, your verdict + plaintiff status. No full PMS section.
- **`/tasks`** = the full task tree browser (top-level programs +
  child branches + leaf queue, filterable).
- **`/employees`** (consider renaming to `/presidents` for clarity) =
  president-accountability surface. Only thing on this page.

Change: remove `<PresidentManagementSystemSection>` from
`TreatyTaskDashboardClient.tsx` and add a "Pressure overdue presidents"
button linking to `/employees`. ~20 lines.

### P1 — Grant-application infrastructure (Task-attached, schema-light)

**Premise:** nonprofits engage more when they see a visible pathway to
getting paid for impact. Right now there is no way for an org to
propose work and be funded for it through this platform; the 5
"Fund the Campaign" tasks I just deleted were the wrong direction
(us asking foundations for money instead of foundations browsing
fundable work).

**AMF status (corrected 2026-05-08):** Accelerated Medicine Foundation
is already a registered US 501(c)(3) and the existing /donate page
accepts donations via Stripe. Disbursement infrastructure (W-9 +
1099-MISC + grant agreement template + outbound payment via Stripe
Connect or wire) is the remaining workstream — much smaller scope
than originally assumed, and unblocks money flow today rather than
waiting for legal-entity setup.

**Reuse Task. Don't introduce a Campaign model.** `TaskImpactFrame`
(schema lines 5905-5979) already has every grant economic field —
estimatedCashCostUsdBase (low/base/high), expectedDalysAvertedBase,
expectedEconomicValueUsdBase, successProbabilityBase, HALE +
median-income effects, delay-DALYs-per-day. Cost-per-DALY is
computable today: `estimatedCashCostUsdBase / expectedDalysAvertedBase`.
Existing `assigneeOrganizationId` captures who would do the work.
Existing claim/complete/verify flow handles delivery. The grant
application IS proposing a task; the pledge IS funding it.

**Schema additions (light, two pieces):**

```prisma
enum TaskFundingStatus {
  PROPOSED            // org submitted, awaiting review
  ACCEPTED            // admin approved as fundable
  PARTIALLY_PLEDGED   // pledges < estimatedCashCostUsdBase
  FULLY_PLEDGED       // pledges >= estimatedCashCostUsdBase
  DISBURSED           // paid to org
  VERIFIED            // delivery confirmed
}

model TaskFundingPledge {
  id                   String   @id @default(cuid())
  taskId               String
  funderUserId         String?
  funderOrganizationId String?
  amountUsd            Float
  status               String   // pending | committed | disbursed | refunded
  pledgedAt            DateTime @default(now())
  disbursedAt          DateTime?
  deletedAt            DateTime?
  task                 Task           @relation(fields: [taskId], references: [id])
  funderUser           User?          @relation(fields: [funderUserId], references: [id])
  funderOrganization   Organization?  @relation(fields: [funderOrganizationId], references: [id])
  @@index([taskId])
  @@index([funderUserId])
  @@index([funderOrganizationId])
  @@index([status])
}
```

Plus a nullable `Task.fundingStatus: TaskFundingStatus?` so the
proposal-vs-non-proposal distinction is queryable without joining
to TaskFundingPledge.

**UI surfaces:**

- `/grants` (or `/fund/proposals`) — public gallery of `ACCEPTED`
  tasks ranked by cost-per-DALY. Each row: org name, task title,
  cost, DALYs averted, success probability, "$X needed / $Y
  pledged" progress bar, "Pledge" CTA.
- `/grants/apply` — form for orgs to propose a task. Fields map
  1:1 to existing TaskImpactFrame columns. Submission creates a
  Task with `fundingStatus: PROPOSED` and `assigneeOrganizationId =
  caller.org`. Admin reviews and flips to ACCEPTED or REJECTED.
- Task detail page gets a "Funding" section if `fundingStatus` is
  set: shows pledges, progress, disbursement status. Conditional
  block (already gated infrastructure — same pattern as
  leader-accountability blocks).

**Critical separation from current /donate page.** Donate is
unrestricted individual giving to the campaign. Grants are
designated giving to a specific task with verified outcome. Two
different concepts; two different surfaces. /donate stays as-is.

**Build order (updated after AMF correction):**

1. Schema (TaskFundingStatus enum + TaskFundingPledge model + nullable
   Task.fundingStatus column). Schema PR.
2. /grants public gallery + /grants/apply form. Schema-zero after #1.
3. Admin review flow on existing /tasks/[id]/page.tsx (collapsed
   `<details>` like the curator-verification block already shipped).
4. AMF disbursement workflow: W-9 + grant agreement + Stripe Connect
   (or wire) outbound payment + 1099-MISC reporting at year end.
   This is real work but the legal entity exists, so it's a normal
   nonprofit-ops build, not a blocked-on-legal item.

All four can ship in sequence without legal-entity blockers. The
foundation-browsing recruitment story benefits land after #2 even
before #4 is wired.

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
