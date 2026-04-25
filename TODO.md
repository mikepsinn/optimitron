# Optimitron Treaty Migration TODO

This is the working checklist for finishing the treaty migration and post-vote referral flow in Optimitron.

## Working Context

- [ ] Do treaty migration implementation from `E:\code\optimitron`, not from `E:\code\dih-neobrutalist`.
- [ ] Treat `E:\code\dih-neobrutalist` as the source/reference repo for DIH features until each feature is deliberately ported.
- [ ] Keep this file as the compaction-safe control document. If a migration decision is made in chat, add it here before starting the next code slice.
- [ ] Before each implementation slice, confirm the active shell `cwd` is `E:\code\optimitron` and the target package is usually `packages/web` or `packages/db`.
- [ ] Keep the source repo and target repo names explicit in commits, notes, and final handoffs so DIH build failures are not confused with Optimitron build failures.
- [ ] If the IDE/session is currently open in `E:\code\dih-neobrutalist`, reopen `E:\code\optimitron` before editing implementation files. Use DIH only for read-only reference unless a task explicitly targets DIH.

## Architecture Guardrails

- [ ] Keep the long-term ownership split explicit:
  - `Task` = the thing assigned to a person, organization, or user.
  - `ReferralInvitation` = named invite lifecycle, invite token, recipient unsubscribe, copied/sent/converted state, reminder schedule, and converted vote linkage.
  - `ShareAttempt` = exact outbound message attribution ledger, including rendered text/hash, channel, template/variant, invite/task links, and edit state.
  - `EmailLog` = email delivery, provider status, webhook events, and dedupe.
  - `TrackingReminder` = health-variable measurement reminders only; do not use it for outreach/task assignment reminders.
- [ ] Avoid one-off treaty reminder systems. New task/outreach messaging should go through shared task-message selection, rendering, attribution, and analytics helpers.
- [ ] Keep seeded default copy deterministic and reviewable, even after adding database-backed message variants.
- [ ] Preserve exact rendered outbound messages for replication analysis. The text people actually send is the unit to measure.

## Highest Priority

- [x] Replace hardcoded treaty math in `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx`.
  - Use Optimitron's canonical parameter exports from `packages/data/src/parameters/parameters-calculations-citations.ts`.
  - Use `packages/web/src/components/shared/ParameterValue.tsx` for visible sourced numbers wherever the JSX shape allows it.
  - Use `getParameterValue()`, `fmtParamValueOnly()`, `formatParameter()`, or a small shared helper from `packages/data/src/parameters/format-parameter.ts` for values that must be interpolated into strings, previews, task templates, email bodies, or other non-JSX contexts.
  - Use `ParameterValue figures={...}` for visible JSX that needs a specific significant-figure display; do not hardcode rounded display numerals in the component body.
  - Keep copy exact, but source the displayed numbers from parameters instead of duplicating literals such as `95%`, `9,500`, `99.7%`, `100`, `12,000`, `122`, `$27.2B`, `$2.72T`, `$929`, `$41K`, `23M`, `1.9M`, `12x`, `443`, `36`, `10.7 billion`, `1.93 quadrillion`, `4 billion`, `2.7`, `55`, and `482,500`.
  - Use the "majority of humans on Earth" wording only for the 4B denominator/target; keep normal vote/per-vote terminology everywhere else.
  - Do not hand-edit generated parameter output unless the generator/source data is the intended edit path.
- [x] Add or port the canonical post-vote copy document into this repo.
  - DIH currently has the source-faithful share-flow copy; Optimitron should have its own canonical doc before more UI/email work.
  - The implementation must match the canonical doc exactly for user-facing copy. No paraphrasing.
  - Include implementation notes for which values are parameter-backed and which values are literal copy.
- [ ] Audit `TreatyPostVoteShareFlow.tsx` against the canonical doc after parameterization.
  - Verify screen order, button text, alt/dismissive branches, details folds, send loop, depth hook, close, feedback, and dashboard redirect.
  - Track details-fold expansion, dismissive-path count, format choice, copy/send events, and completed invitations.

## Referral Invitations, Persons, And Tasks

- [x] Keep `ReferralInvitation` as the lifecycle model for named invite tokens, message format, copy/send state, reminders, unsubscribe, and conversion linkage.
- [x] Create a private outreach `Task` for each post-vote referral invitation.
- [x] Create/link a `Person` only when the invite has an email address; keep name-only copy invites as task snapshots to avoid ambiguous global people rows.
- [x] Mark the linked invitation task verified when the invite converts.
- [x] Mark linked invitation tasks stale/deleted when an invite is declined or cancelled.
- [x] Confirm invitation-created tasks appear in the right task views for the sender without leaking private friend/family invites into public task lists.
  - Referral invitation tasks are created with `isPublic: false` and `ownerUserId`.
  - `getTasksPageData()` public task lists use `isPublic: true`; owned private tasks are fetched separately for the signed-in owner.
- [x] Add a task detail affordance that makes referral-invitation tasks feel intentional, not like generic task rows.
  - Referral-generated private task detail pages now show an Earth optimization task panel with recipient, format, reminder count, status, and a direct `/send` CTA.
- [x] Decide whether recipient conversion should also attach the recipient user to the existing `Person` when email matches.
  - Yes: invite conversion now opportunistically attaches the converted voter to the invitation's existing `recipientPersonId` when the voter does not already have a `personId`.
- [ ] Add a merge/cleanup path for duplicate `Person` records created from referrals, imports, and manually assigned tasks.
- [x] Add dashboard filters for pending, sent, copied, converted, declined, cancelled, and stale referral tasks.
  - The Earth optimization tasks card now filters all/pending/copied/sent/confirmed/closed rows.

## Treaty Vote And Referral Flow

- [x] Require verified login before the post-vote share flow.
- [x] Keep generic referral attribution separate from named invite conversion.
- [x] Use `/vote/<username-or-referralCode>` as the clean generic referral URL.
- [x] Use `/vote/<username-or-referralCode>?invite=<inviteToken>` for named invitations.
- [ ] Verify invite-token attribution through the full recipient path in a browser:
  vote link -> landing -> vote -> verification -> vote sync -> invitation converted -> task verified -> dashboard updated.
- [x] Cover forwarded/already-converted invite-token links:
  they should still let a later recipient vote and credit generic referral attribution without re-converting the named invitation task.
- [x] Add no-self-credit tests for named invite tokens in addition to generic referral no-self-credit tests.
- [x] Add explicit regression tests for username-vs-referral-code resolution on `/vote/<identifier>`.
- [x] Add an "assign one task" deep link that drops verified users directly into the referral loop.
  - `/send` requires sign-in and renders the referral invitation composer/status view.
  - Sender B3/B4 reminder emails now link directly to `/send`.
- [x] Confirm partner/demo survey variants use the lighter mode and do not accidentally enter the full post-vote send loop.
  - Guard test covers `/demo` and `/reasoning/embed` so they do not import the full `TreatyVoteFlow` / `TreatyPostVoteShareFlow`.

## Email Sequences

- [x] Port the email sequence v2 copy into Optimitron templates, with the project-wide 4B denominator wording normalized to "a majority of humans on Earth."
  - Recipient Sequence A: Task Notification and Sincere variants.
  - Sender Sequence B: vote confirmed, recipient voted, task reminders, monthly scorecard.
  - Re-engagement Sequence C: verified but never shared.
- [x] Replace user-facing "nudge" copy with task-management framing.
  - Prefer plain language like "assign one task", "task reminder", "Earth optimization task", or "treaty vote task."
  - Use "overdue" only where the project-management joke is intentional, not as the default noun phrase for every user-facing task.
  - Keep the joke structurally clear: humanity has been assigned the overdue root task "Optimize Earth"; that contains "End War and Disease"; that contains "Ratify the 1% Treaty"; that contains per-person subtasks to vote, get friends to vote, and make sure those friends keep the task tree moving.
  - The task-management language should feel like a project-management system calmly describing civilization-scale overdue work, not generic SaaS notification copy.
  - Updated post-vote flow copy, email template copy, related tests, and canonical docs together so they do not drift.
- [x] Rename internal sender "nudge" fields/actions/functions to "reminder" before launch.
  - No users exist yet, so preserve behavior but do not preserve misleading names.
  - Rename schema/API/code/test names such as `nudgeOptIn`, `wantsNudge`, `senderNudgeOptedInAt`, `senderNudgeStep`, `nextSenderNudgeAt`, `lastSenderNudgeAt`, and B3/B4 builder names.
  - Add a migration that renames the existing `ReferralInvitation` columns/indexes instead of dropping data.
  - Implemented as a data-preserving Prisma migration plus generated-client, API, cron, email-builder, analytics, and test updates.
- [x] Wire Sender Sequence B1/B2 triggered emails into verified vote and invite-conversion paths with `EmailLog` dedupe.
- [x] Wire Sender Sequence B3/B4 sender reminders into cron from the sender reminder schedule.
- [x] Wire Sender Sequence B5 monthly scorecards.
  - Cron sends one scorecard per user per UTC month when they have at least one copied/sent/converted referral invitation.
  - Current scorecard uses direct invitation totals plus a conservative direct-recipient-shared-further count.
- [x] Wire Re-engagement Sequence C1 for verified YES voters who never shared.
  - Cron sends the one-shot C1 email after 24 hours when the user has no referral invitations and no prior C1 EmailLog.
  - C1 links directly to `/send`.
- [x] Preserve format consistency per invite; do not mix Task Notification and Sincere variants within a recipient sequence.
  - `ReferralInvitation.messageFormat` is read for every recipient email step and covered by regression tests.
- [x] Enforce the recipient hard cap of four emails.
  - Recipient processing filters `recipientEmailStep < 4`; direct sends return `maxed` after step 4.
- [x] Enforce sender reminder caps and monthly scorecard preferences.
  - Sender reminders stop after two steps; monthly scorecards use one `EmailLog` template per user per UTC month and the shared `referral_sequence` suppression scope.
- [x] Suppress reminders after conversion, unsubscribe, cancellation, decline, or hard cap.
  - Recipient reminders filter converted/deleted/unsubscribed/maxed rows, declined rows are inactive, and cancel/decline clear pending recipient/sender schedules.
- [x] Use existing email preference/unsubscribe semantics instead of adding a parallel suppression system.
  - Sender sequence emails use `sendResendEmail()` with `scope: "referral_sequence"`; recipient invitations use their one-click per-invite unsubscribe token.
- [x] Add email preview fixtures or snapshot tests for every recipient/sender template.
  - Sender template tests cover B1-B5/C1; recipient template tests now cover all A1-A4 Task and Sincere variants plus delay schedule.
- [x] Add cron tests for reminder timing, conversion suppression, unsubscribe suppression, and stale invitation cleanup.
  - Recipient and sender reminder tests cover due timing, conversion, unsubscribe, cancellation/decline, hard caps, sender suppression, and terminal-state schedule clearing.

## Task Reminder Replication System

- [ ] Treat task reminder text as measurable replication content, not just static copy.
  - Persist the exact text the sender copied or sent, including user edits, selected format, channel, recipient/task/invite, and created/sent timestamps.
  - Attribute downstream results to that text: opens, clicks, vote completion, recipient shares, second-generation shares, spam reports, unsubscribes, and conversion delay.
  - Report a replication coefficient by message/template/variant: average verified voters generated per completed sender action.
- [ ] Add first-class task-message template models before the second non-treaty task family launches.
  - Candidate shape: `TaskMessageTemplate` and `TaskMessageVariant`, linked to outbound attempts through `ShareAttempt`.
  - Templates should support seeded defaults, admin edits, task-context tokens, sender edits, and per-task/per-campaign enablement.
  - Do not force this into `TrackingReminder`; that model is for health-variable measurement reminders, not outreach/task assignment.
- [ ] Extend `ShareAttempt` as the canonical outbound-message ledger.
  - Add nullable `referralInvitationId`, `taskMessageVariantId`, and `purpose`.
  - Every copied message, native share, server-sent invitation email, and recipient reminder email should create or link a `ShareAttempt`.
  - [x] First referral-invitation slice: `/send` and post-vote copied invite messages now pre-generate `sa=`, persist exact copied text/hash/edit state to `ShareAttempt`, and link the invitation to that attempt.
  - [x] First recipient-email slice: server-sent referral invitation emails and recipient reminders now embed `sa=`, persist exact outbound email text/hash/template metadata to `ShareAttempt`, and link the invitation to the latest sent attempt.
  - Invite URLs should include `sa=` when a specific message attempt exists, in addition to `invite=` for named invitation conversion.
- [ ] Use task data to populate reminder emails where it improves clarity.
  - Pull title, assignee, due date, contact URL, parent task, and task tree context from `Task`/`TaskEdge` instead of duplicating hardcoded treaty strings.
  - Keep `ReferralInvitation` for invite-token lifecycle, recipient unsubscribe, message format, sent/copied state, and conversion linkage.
- [ ] Add a testable "best current reminder" selection path.
  - Start with deterministic seeded defaults.
  - Later promote variants based on replication coefficient, with guardrails for spam reports and unsubscribe rates.

## Dashboard And Analytics

- [x] Add a dashboard status card for tracked referral invitations.
- [x] Split pending and confirmed Inverse Kills Score in the treaty dashboard.
  - `ReferralInvitationStatusCard` now displays confirmed and pending lives separately using the flow per-vote value.
- [ ] Show referral tree depth and named invite state from the current user outward.
- [x] Show per-invite task status, email status, copied/sent state, and conversion state together.
  - The Earth optimization tasks card shows status, task link, copied/sent/converted dates, recipient email, and recipient reminder count.
- [ ] Track and report where users abandon the post-vote flow.
- [ ] Track whether details-fold expansion predicts sharing.
- [ ] Track Task Notification vs Sincere performance by open, click, vote completion, spam report, and recipient share rate.
- [ ] Add admin/reporting views for referral funnel health and abuse signals.

## Parameters And Treaty Math

- [x] Confirm Optimitron's flow-visible treaty math uses the majority-of-humanity denominator.
  - Canonical generated data still exposes `GLOBAL_REGISTERED_VOTERS` as the register-based proxy (~4.13B).
  - Flow copy uses `FLOW_MAJORITY_OF_HUMANS_ON_EARTH`, rounds that to "4 billion", and frames it as "a majority of humans on Earth."
- [x] Add parameter tests for:
  - treaty target denominator;
  - lives saved per vote;
  - suffering hours per vote;
  - lifetime-of-suffering conversion;
  - 1 percent military spending;
  - funded trial patients per year;
  - trial capacity multiplier;
  - queue clearance years.
  - Covered by `packages/web/src/lib/__tests__/treaty-share-flow-parameters.test.ts`.
- [x] Add a lightweight treaty parameter export/contract test so UI docs and task/email templates cannot drift from parameter names.
  - `treaty-share-flow-parameters.test.ts` now asserts every flow-visible wrapper export is named in `docs/questions.md`.
- [x] Add helper wrappers only where display wording differs from raw parameter labels, for example "a majority of humans on Earth."
  - The current wrapper set lives in `packages/web/src/lib/treaty-share-flow-parameters.ts`; dashboard share templates and email-signature copy now use those wrappers instead of local constants.
- [ ] Decide whether flow-visible wrapper exports should become a general display-parameter helper.
  - `formatParameter()` should stay a value/formatting function; it should not silently change semantics, labels, or denominators.
  - Consider a small `createDisplayParameter()` or parameter "presentation profile" helper for rounded/aliased values used across UI, emails, dashboards, and task templates.
  - Keep explicit wrapper exports for semantically important wording changes such as `FLOW_MAJORITY_OF_HUMANS_ON_EARTH`.
- [ ] Avoid hardcoded treaty numerals in user-facing UI except where the exact numeral is part of fixed copy and backed by a parameter nearby.

## Copy And Framing Audit

- [ ] Audit user-facing task/referral copy for plain-language clarity.
  - Replace implementation terms like "post-vote send loop", "tracked invite link", "referral invitation task", "invite-token conversion", and "private referral-generated task" with simple language.
  - Default to "task", "Earth optimization task", "vote task", "your invite link", "confirmed", and "pending" unless the technical term is necessary.
  - The copy should be clear to a normal person before it is clever to a developer.
- [ ] Decide where to frame the user as a project manager for Earth Optimization Services.
  - Candidate surfaces: `/send`, post-vote share flow, dashboard task card, email task-notification format, monthly scorecard, and task detail pages.
  - Keep the frame funny and legible: the user is helping assign and verify tasks in the Earth optimization project tree.
  - Do not over-apply the frame to input labels, error messages, or ordinary action buttons where it makes the UI harder to understand.

## Earth Optimization Points And Rewards

- [ ] Make the launch reward/accounting decision before adding users or making payout promises.
  - Default recommendation: one public contribution unit, **Earth Optimization Points** (`EOP`), plus internal reason/status fields.
  - Treat current "VOTE Points" as the narrow treaty/referral version of EOP, not a separate long-term unit.
  - Treat current in-app `WishPoint` grants as temporary engagement rewards; either migrate them into EOP with honest expected-impact amounts or hide/deprecate them before launch.
  - Keep on-chain `$WISH` / `packages/treasury-wish` conceptually separate unless the whole monetary-system story is intentionally productized; do not use "wishes" for impact payout claims.
- [ ] Define the EOP unit from the Optimitron objective function.
  - Public wording: EOP measure expected contribution to maximizing median healthy life years and median after-tax inflation-adjusted income.
  - Accounting unit: `1 EOP = 1 expected healthy-life-year equivalent`, where health gains count directly as QALYs gained / DALYs averted.
  - Income conversion: convert real after-tax income gains to healthy-life-year equivalents with `STANDARD_ECONOMIC_QALY_VALUE_USD`; document the exact formula before showing dollar-like value.
  - For income improvements, use gains to ordinary humans near the median or modeled distributional gains, not billionaire wealth or raw GDP.
  - Keep health EOP and income-equivalent EOP as separately stored components even if the UI shows a single total.
- [ ] Define EOP lifecycle and attribution before schema changes.
  - Statuses: `PENDING`, `CONFIRMED`, `REJECTED`, `REVERSED`, and optionally `PAID`.
  - Store `grossImpactEop`, `rewardEop`, `healthEop`, `incomeEop`, `confidence`, `attributionRule`, `sourceModelVersion`, and links to task/vote/referral/deposit evidence.
  - Do not double-count for payout: if voter, inviter, task assigner, and task completer all contributed, split a single modeled reward amount by an explicit attribution rule.
  - For treaty launch, start with deterministic rules for verified vote tasks: voter/completer share, inviter/project-manager share, and optional upstream share only if explicitly justified.
  - Keep "pending impact" separate from payout-eligible confirmed EOP.
- [ ] Rename and simplify public product language after the accounting decision.
  - Replace `POINT_NAME = "VOTE"` with EOP-focused copy only after the model is defined.
  - Rename public "VOTE Points" surfaces to "Earth Optimization Points"; keep "EOP" as the short label in compact UI.
  - Use "You have been hired by Earth Optimization Services as a project manager" as campaign copy, not legal/employment semantics.
  - Do not rename `ReferralInvitation` to `EmploymentNotification`; keep `ReferralInvitation` as the internal invite-token lifecycle model and use "task assignment" / "employment notification" only where it improves user-facing copy.
- [ ] Plan the schema migration as a separate architecture slice.
  - Candidate replacement for `WishPoint`: `OptimizationPointLedger` or `ContributionCredit`.
  - Candidate replacement for `VoteTokenMint`: `OptimizationPointMint` if on-chain payout claims generalize beyond votes.
  - Preserve old rows with a reviewable migration; no destructive reset.
  - Add reporting tests that prove the same action cannot mint duplicate payout-eligible EOP.

## Donations And Crowdfunding

- [ ] Default sequencing decision: keep donations/crowdfunding out of the first treaty cutover until vote/share/referral/tasks are stable.
- [ ] Revisit that sequencing only if the campaign needs a funding CTA before the referral loop is launch-ready.
- [ ] Inventory DIH donation/crowdfunding features and map them to Optimitron routes, auth, email, analytics, and treasury/prize primitives.
  - Source routes/pages in DIH:
    - `app/donate/page.tsx`
    - `app/donate/success/page.tsx`
    - `app/api/stripe/create-checkout/route.ts`
    - `app/api/stripe/session/route.ts`
    - `app/api/stripe/webhook/route.ts`
    - `app/campaigns/page.tsx`
    - `app/campaigns/create/page.tsx`
    - `app/campaigns/[slug]/page.tsx`
    - `app/campaigns/[slug]/pledge/page.tsx`
    - `app/campaigns/[slug]/edit/page.tsx`
    - `app/campaigns/[slug]/manage/page.tsx`
    - `app/api/campaigns/**`
  - Source components/helpers in DIH:
    - `components/campaigns/campaign-card.tsx`
    - `components/campaigns/funding-widget.tsx`
    - `components/dashboard/CampaignsCard.tsx`
    - `lib/stripe.ts`
    - `lib/stripe-config.ts`
    - `lib/stripe-payment-links.ts`
  - Source schema/migrations in DIH:
    - `Donation`
    - `Campaign`
    - `CampaignReward`
    - `CampaignPledge`
    - `CampaignMilestone`
    - `CampaignTeamMember`
    - `CampaignUpdate`
    - `20251126035432_add_crowdfunding_campaigns`
    - `20260423140000_add_source_url_to_donation_and_pledge`
  - Source tests in DIH:
    - `app/api/stripe/webhook/route.test.ts`
    - `tests/e2e/donate.spec.ts`
    - `tests/fixtures/stripe.ts`
- [ ] Inspect DIH crowdfunding behavior before designing Optimitron schema.
  - Public discovery/listing: `E:\code\dih-neobrutalist\app\campaigns\page.tsx`, `E:\code\dih-neobrutalist\app\campaigns\campaigns-list.tsx`.
  - Create/edit/manage: `E:\code\dih-neobrutalist\app\campaigns\create\page.tsx`, `E:\code\dih-neobrutalist\app\campaigns\create\campaign-form.tsx`, `E:\code\dih-neobrutalist\app\campaigns\[slug]\edit\page.tsx`, `E:\code\dih-neobrutalist\app\campaigns\[slug]\manage\page.tsx`.
  - Public campaign detail and pledge: `E:\code\dih-neobrutalist\app\campaigns\[slug]\page.tsx`, `E:\code\dih-neobrutalist\app\campaigns\[slug]\pledge\page.tsx`.
  - Campaign APIs: `E:\code\dih-neobrutalist\app\api\campaigns\route.ts`, `E:\code\dih-neobrutalist\app\api\campaigns\[id]\route.ts`, `E:\code\dih-neobrutalist\app\api\campaigns\[id]\pledge\route.ts`, `E:\code\dih-neobrutalist\app\api\campaigns\[id]\publish\route.ts`, `E:\code\dih-neobrutalist\app\api\campaigns\[id]\updates\route.ts`.
- [ ] Decide whether treaty funding should be:
  - a simple Stripe donation flow;
  - a DIH-style crowdfunding campaign;
  - an Optimitron Earth Optimization Prize deposit path;
  - an Incentive Alignment Bond / treasury path;
  - or a temporary CTA that routes to the existing `/prize` and `/fund` surfaces.
- [ ] Do not copy DIH campaign schema wholesale if Optimitron's prize/treasury model can represent the campaign goal with less duplicated finance logic.
- [ ] If Stripe donations are ported, make the Optimitron design explicit:
  - route shape (`/donate`, `/fund`, `/campaigns`, or treaty-specific route);
  - donor auth requirements;
  - one-time versus recurring support;
  - source URL/referrer/referral/invite attribution;
  - badge/activity logging;
  - dashboard display;
  - email receipt path;
  - refund/failure handling.
- [ ] If crowdfunding campaigns are ported, make the Optimitron design explicit:
  - campaign ownership model;
  - campaign team roles;
  - reward tiers;
  - pledge lifecycle;
  - publish/edit/manage permissions;
  - updates;
  - public campaign discovery;
  - dashboard cards.
- [ ] Add donation/campaign schema only after choosing the relationship to Optimitron prize/treasury models.
- [ ] Add tests before launch for:
  - checkout/session creation;
  - webhook idempotency;
  - one-time donation completion;
  - recurring donation/subscription completion;
  - Payment Link fallback if retained;
  - pledge completion;
  - refund/failure status updates;
  - attribution to referrer/invite/source URL;
  - dashboard display;
  - email receipts and suppression rules.
- [ ] Add route compatibility notes before cutover:
  - DIH `/donate`
  - DIH `/donate/success`
  - DIH `/campaigns`
  - DIH `/campaigns/<slug>`
  - DIH `/campaigns/<slug>/pledge`
  - any Stripe return/cancel URLs.

## DIH Feature Migration

- [ ] Keep DIH as the source for dFDA conditions/treatments until there is a dedicated migration plan.
- [ ] Inventory DIH condition/treatment data, admin pages, and dashboards before moving any of it.
- [ ] Decide whether dFDA content becomes an Optimitron package, a separate app, or remains on DIH long term.
- [ ] Add compatibility redirects only when a route is intentionally moved.
- [ ] Keep `warondisease.org` and `1percenttreaty.org` on Optimitron only after the treaty vote/share/dashboard path is launch-ready.

## DIH Source Reference Paths

- [ ] Survey/embed reference paths:
  - Main survey route: `E:\code\dih-neobrutalist\app\survey\[slug]\page.tsx`.
  - Demo survey route: `E:\code\dih-neobrutalist\app\survey\demo\page.tsx`.
  - Landing vote section: `E:\code\dih-neobrutalist\components\landing\treaty-vote-section.tsx`.
  - Survey hero/visualization: `E:\code\dih-neobrutalist\components\landing\survey-hero-section.tsx`, `E:\code\dih-neobrutalist\components\landing\treaty-visualization.tsx`.
  - Survey parameter/math UI references: `E:\code\dih-neobrutalist\components\shared\ParameterValue.tsx`, `E:\code\dih-neobrutalist\components\shared\ImpactExplainer.tsx`, `E:\code\dih-neobrutalist\components\shared\impact-math.tsx`.
- [ ] Treaty vote/share/reference paths:
  - Canonical copy docs: `E:\code\dih-neobrutalist\docs\questions.md`, `E:\code\dih-neobrutalist\docs\stupid-questions.md`.
  - Vote sync/referral APIs: `E:\code\dih-neobrutalist\app\api\votes\sync\route.ts`, `E:\code\dih-neobrutalist\app\api\referral-invitations\route.ts`, `E:\code\dih-neobrutalist\app\api\referral-invitations\nudge-opt-in\route.ts`.
  - Send page/client: `E:\code\dih-neobrutalist\app\send\send-referral-invitation-client.tsx`.
  - Referral helpers: `E:\code\dih-neobrutalist\lib\referral.server.ts`, `E:\code\dih-neobrutalist\lib\referral.client.ts`, `E:\code\dih-neobrutalist\lib\referral-invitations.ts`, `E:\code\dih-neobrutalist\lib\share-copy.ts`.
  - Referral tests: `E:\code\dih-neobrutalist\tests\integration\referral-invitations-api.test.ts`, `E:\code\dih-neobrutalist\tests\integration\votes-sync-referral-invitation.test.ts`, `E:\code\dih-neobrutalist\tests\integration\referral-tree.test.ts`, `E:\code\dih-neobrutalist\tests\e2e\referral-flow.spec.ts`.
- [ ] Donation/Stripe reference paths:
  - Donation routes: `E:\code\dih-neobrutalist\app\donate\page.tsx`, `E:\code\dih-neobrutalist\app\donate\success\page.tsx`.
  - Stripe APIs: `E:\code\dih-neobrutalist\app\api\stripe\create-checkout\route.ts`, `E:\code\dih-neobrutalist\app\api\stripe\session\route.ts`, `E:\code\dih-neobrutalist\app\api\stripe\webhook\route.ts`.
  - Stripe helpers/tests: `E:\code\dih-neobrutalist\lib\stripe.ts`, `E:\code\dih-neobrutalist\lib\stripe-config.ts`, `E:\code\dih-neobrutalist\lib\stripe-payment-links.ts`, `E:\code\dih-neobrutalist\app\api\stripe\webhook\route.test.ts`, `E:\code\dih-neobrutalist\tests\e2e\donate.spec.ts`.
- [ ] Crowdfunding reference paths:
  - Components: `E:\code\dih-neobrutalist\components\campaigns\campaign-card.tsx`, `E:\code\dih-neobrutalist\components\campaigns\funding-widget.tsx`, `E:\code\dih-neobrutalist\components\dashboard\CampaignsCard.tsx`.
  - Prisma migrations: `E:\code\dih-neobrutalist\prisma\migrations\20251126035432_add_crowdfunding_campaigns\migration.sql`, `E:\code\dih-neobrutalist\prisma\migrations\20260423140000_add_source_url_to_donation_and_pledge\migration.sql`.

## Quality Gates

- [ ] Add targeted Playwright coverage for:
  - verified vote -> post-vote flow;
  - copy-only invite;
  - emailed invite;
  - recipient invite conversion;
  - dashboard pending/confirmed update;
  - partner/demo lite mode.
- [ ] Keep `pnpm check` green before every commit.
- [ ] Keep `pnpm --filter @optimitron/web run e2e -- smoke --reporter=list` green after UI/routing changes.
- [ ] Keep `pnpm --filter @optimitron/db exec prisma migrate status --schema prisma/schema.prisma` current before testing dashboard/API features against the configured DB.
- [ ] Clean up existing lint warnings only in a separate, focused pass.
- [ ] Do a final copy audit before launch: visible post-vote UI, generated invite copy, email templates, dashboard labels, and task rows.
