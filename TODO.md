# Optimitron Treaty Migration TODO

This is the working checklist for finishing the treaty migration and post-vote referral flow in Optimitron.

## Working Context

- [ ] Do treaty migration implementation from `E:\code\optimitron`, not from `E:\code\dih-neobrutalist`.
- [ ] Treat `E:\code\dih-neobrutalist` as the source/reference repo for DIH features until each feature is deliberately ported.
- [ ] Keep this file as the compaction-safe control document. If a migration decision is made in chat, add it here before starting the next code slice.
- [ ] Before each implementation slice, confirm the active shell `cwd` is `E:\code\optimitron` and the target package is usually `packages/web` or `packages/db`.
- [ ] Keep the source repo and target repo names explicit in commits, notes, and final handoffs so DIH build failures are not confused with Optimitron build failures.

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
- [ ] Add a task detail affordance that makes referral-invitation tasks feel intentional, not like generic task rows.
- [ ] Decide whether recipient conversion should also attach the recipient user to the existing `Person` when email matches.
- [ ] Add a merge/cleanup path for duplicate `Person` records created from referrals, imports, and manually assigned tasks.
- [ ] Add dashboard filters for pending, sent, copied, converted, declined, cancelled, and stale referral tasks.

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
- [ ] Add a "send to one more" deep link that drops verified users directly into the referral loop.
- [ ] Confirm partner/demo survey variants use the lighter mode and do not accidentally enter the full post-vote send loop.

## Email Sequences

- [x] Port the email sequence v2 copy into Optimitron templates, with the project-wide 4B denominator wording normalized to "a majority of humans on Earth."
  - Recipient Sequence A: Task Notification and Sincere variants.
  - Sender Sequence B: vote confirmed, recipient voted, overdue task reminders, monthly scorecard.
  - Re-engagement Sequence C: verified but never shared.
- [ ] Replace user-facing "nudge" copy with task-management framing.
  - Prefer language like "send overdue task reminder" or "send one more overdue task reminder."
  - Keep the joke structurally clear: humanity has been assigned the overdue root task "Optimize Earth"; that contains "End War and Disease"; that contains "Ratify the 1% Treaty"; that contains per-person subtasks to vote, get friends to vote, and make sure those friends keep the task tree moving.
  - The task-management language should feel like a project-management system calmly describing civilization-scale overdue work, not generic SaaS notification copy.
  - Keep internal field names such as `nextSenderNudgeAt` temporarily unless we do a deliberate schema/code rename.
  - Update post-vote flow copy, email template copy, dashboard labels, and canonical docs together so they do not drift.
  - Known copy surfaces: `docs/questions.md`, `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx`, email sequence headings/tests, and dashboard/referral labels.
- [x] Wire Sender Sequence B1/B2 triggered emails into verified vote and invite-conversion paths with `EmailLog` dedupe.
- [x] Wire Sender Sequence B3/B4 sender reminders into cron from `nextSenderNudgeAt`.
- [ ] Wire Sender Sequence B5 monthly scorecards.
- [ ] Wire Re-engagement Sequence C1 for verified users who never shared.
- [ ] Preserve format consistency per invite; do not mix Task Notification and Sincere variants within a recipient sequence.
- [ ] Enforce the recipient hard cap of four emails.
- [ ] Enforce sender reminder caps and monthly scorecard preferences.
- [ ] Suppress reminders after conversion, unsubscribe, cancellation, decline, or hard cap.
- [ ] Use existing email preference/unsubscribe semantics instead of adding a parallel suppression system.
- [ ] Add email preview fixtures or snapshot tests for every recipient/sender template.
- [ ] Add cron tests for reminder timing, conversion suppression, unsubscribe suppression, and stale invitation cleanup.

## Dashboard And Analytics

- [x] Add a dashboard status card for tracked referral invitations.
- [ ] Split pending and confirmed Inverse Kills Score in the treaty dashboard.
- [ ] Show referral tree depth and named invite state from the current user outward.
- [ ] Show per-invite task status, email status, copied/sent state, and conversion state together.
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
- [ ] Add a lightweight treaty parameter export/contract test so UI docs and task/email templates cannot drift from parameter names.
- [ ] Add helper wrappers only where display wording differs from raw parameter labels, for example "a majority of humans on Earth."
- [ ] Avoid hardcoded treaty numerals in user-facing UI except where the exact numeral is part of fixed copy and backed by a parameter nearby.

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
