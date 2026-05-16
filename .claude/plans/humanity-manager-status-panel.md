# Humanity Manager Status Panel Plan

## Research log

- TODO scope: P0 asks to extract reusable monthly-digest status sections into a shared module that renders email and dashboard forms, with completed direct reports, overdue humans, overdue presidents, recursive downstream count/depth, and dashboard copyable reminders (`TODO.md:399-411`). The same TODO still says "direct reports" (`TODO.md:404`), but current user-facing direction is to use "employees" instead: `TODO.md:108-110` says "direct reports" is HR jargon and "employees" is the satire term.
- Current monthly email render path is single-purpose. `MonthlyChainDigestReactEmail` branches between positive and resend variants on `monthlyConversionCount` (`packages/web/src/lib/email/monthly-chain-digest-react-email.tsx:25-34`), then renders completed employees, metrics, reminder copy blocks, chain math, dashboard CTA, and share footer inside the email file (`packages/web/src/lib/email/monthly-chain-digest-react-email.tsx:37-117`). Its helper sections are local to that file (`packages/web/src/lib/email/monthly-chain-digest-react-email.tsx:119-257`), so the dashboard cannot reuse them.
- Current monthly data fetch is direct-only. The publisher gets eligible YES voters (`packages/web/src/lib/email/monthly-chain-digest.server.ts:117-148`), then per recipient counts direct YES votes via `referredByUserId` for the last 30 days and all time (`packages/web/src/lib/email/monthly-chain-digest.server.ts:175-198`), samples direct completed employees (`packages/web/src/lib/email/monthly-chain-digest.server.ts:199-232`), samples pending referral invitations as overdue employees (`packages/web/src/lib/email/monthly-chain-digest.server.ts:233-257`), and loads overdue presidents from Task rows (`packages/web/src/lib/email/monthly-chain-digest.server.ts:335-374`).
- The monthly email entry point owns the public input type, subject, trigger text, and preview fixture (`packages/web/src/lib/email/monthly-chain-digest-email.ts:19-108`). Existing regression coverage already asserts subject copy, completed employees, overdue employees, presidents, referral URL reminder copy, and plaintext fallback (`packages/web/src/lib/email/__tests__/monthly-chain-digest-email.test.ts:45-86`, `packages/web/src/lib/email/__tests__/monthly-chain-digest-email.test.ts:96-117`).
- Existing adaptive-content reference pattern: the live filenames are `humanity-manager-promotion-content.tsx`, `humanity-manager-promotion.email.tsx`, and `humanity-manager-promotion.web.tsx`, not the prompt's `humanity-manager-promotion-content.email.tsx` / `.web.tsx` names. The content file defines injected primitive types and a `createHumanityManagerPromotion(...)` factory (`packages/web/src/lib/humanity-manager-promotion-content.tsx:18-45`); the email adapter injects email-safe primitives and absolute links (`packages/web/src/lib/humanity-manager-promotion.email.tsx:1-68`); the web adapter is client-safe and injects `ParameterValue`, `Link`, and web classes (`packages/web/src/lib/humanity-manager-promotion.web.tsx:1-75`). The status module should mirror the live pattern, not the stale basename.
- Dashboard placement context: `EarthOptimizationDashboardClient` currently renders the invite/reminder composer first (`packages/web/src/components/dashboard/EarthOptimizationDashboardClient.tsx:59-66`), then referral link/goal cards (`packages/web/src/components/dashboard/EarthOptimizationDashboardClient.tsx:68-77`), then top tasks (`packages/web/src/components/dashboard/EarthOptimizationDashboardClient.tsx:79-86`), and buries lower-priority widgets in `More dashboard` (`packages/web/src/components/dashboard/EarthOptimizationDashboardClient.tsx:88-133`). The status panel belongs after the invite section and before the referral grid so the primary share action stays first.
- Dashboard data flow: `/dashboard` loads `getDashboardData`, `getTopReferrers`, and `getTasksPageData`, then passes `initialData` into `EarthOptimizationDashboardClient` (`packages/web/src/app/dashboard/page.tsx:86-101`). `DashboardData` has no status-report field today (`packages/web/src/types/dashboard.ts:109-120`), and `getDashboardData` currently returns user, stats, organizations, global progress, quests, and impact receipts only (`packages/web/src/lib/dashboard.server.ts:236-294`).
- Share-template wiring: `share-templates.ts` defines shared `ShareTokenKey`, including `target_name` and `treaty_url` (`packages/web/src/lib/tasks/share-templates.ts:26-49`), supported `recipientModes` (`packages/web/src/lib/tasks/share-templates.ts:51-70`), defaults for leader/humanity/one_human/peer (`packages/web/src/lib/tasks/share-templates.ts:780-798`), and helper functions to filter and pick usable templates (`packages/web/src/lib/tasks/share-templates.ts:813-849`). `renderTemplate` throws on unresolved tokens by default, which is useful for tests (`packages/web/src/lib/tasks/render-template.ts:1-29`). `buildTaskShareTokens` already produces the flat token bag consumed by those templates (`packages/web/src/lib/tasks/accountability.ts:316-421`).
- The existing live composer shows the intended template pipeline. `TreatyReminderComposer` builds leader, humanity, and one-human token bags, filters templates by recipient mode, selects defaults, renders selected template bodies, and copies messages (`packages/web/src/components/landing/TreatyReminderComposer.tsx:199-260`, `packages/web/src/components/landing/TreatyReminderComposer.tsx:315-397`, `packages/web/src/components/landing/TreatyReminderComposer.tsx:623-645`). The dashboard status panel should reuse this library layer, not the full composer UI.
- Schema/data provenance for the recursive chain: `User.referralCode` identifies shareable referrers (`packages/db/prisma/schema.prisma:1358-1369`); `ReferendumVote.referredByUserId` is the referral edge from a vote to the user who brought that voter in (`packages/db/prisma/schema.prisma:4275-4339`); `ReferralInvitation` stores named pending invitees, tokens, status, and conversion link (`packages/db/prisma/schema.prisma:3565-3649`); Task rows store overdue president task identity, assignee, due date, status, and task key (`packages/db/prisma/schema.prisma:5247-5395`).
- Vendor check for the one non-repo API decision: Prisma current docs say `$queryRaw` returns records, uses tagged templates/prepared statements, accepts typed results, and warns not to build SQL strings with untrusted input (https://www.prisma.io/docs/v6/orm/prisma-client/using-raw-sql/raw-queries, lines 130-145 and 171-194). PostgreSQL current docs show `WITH RECURSIVE` depth tracking and cycle/path guarding with arrays (https://www.postgresql.org/docs/current/queries-with.html, lines 126-140 and 162-218). Visible last-updated dates were not shown in-page; search results were current/crawled today for Prisma and published/crawled recently for PostgreSQL.

## Brief

Build a shared Humanity Manager status-report module that keeps the monthly digest email working while adding a dashboard panel with the same real status sections. The shared data should report employees, overdue assigned humans, overdue presidents, and recursive downstream chain count/depth; the dashboard version should expose direct click-to-copy reminder messages sourced from `share-templates.ts`.

Key decisions:

- Module shape: create `packages/web/src/lib/humanity-manager-status-content.tsx`, `packages/web/src/lib/humanity-manager-status.email.tsx`, and `packages/web/src/lib/humanity-manager-status.web.tsx`, mirroring the live promotion pattern.
- Recursive query: create a new `packages/web/src/lib/humanity-manager-status.server.ts` helper using typed `prisma.$queryRaw` with a PostgreSQL recursive CTE. Do not put this in `tasks.server.ts`, and do not add a precomputed batch table yet.
- Dashboard placement: add the panel to `EarthOptimizationDashboardClient` immediately after the invite/reminder composer section and before the referral link/goal grid.
- Reminder copy UX: dashboard renders inline click-to-copy buttons for default rendered messages, not a modal. Employee reminders use `recipientMode: "one_human"`; president reminders use `recipientMode: "leader"`.
- Email regression: migrate in two stages. First extract the renderer with no behavior change and keep existing email tests passing. Then switch counts to recursive chain fields with explicit tests for the new transitive semantics.

## Current state ASCII diagram

```text
Cron route
  |
  v
monthly-chain-digest.server.ts
  |-- Prisma direct ReferendumVote counts by referredByUserId
  |-- Prisma ReferralInvitation pending count/sample
  |-- Prisma Task overdue-president count/sample
  v
MonthlyChainDigestInput
  |
  v
monthly-chain-digest-react-email.tsx
  |-- PositiveMonthlyDigest
  |-- ResendMonthlyDigest
  |-- local CompletedEmployees / StatusTable / ReminderSection helpers
  v
React Email only

/dashboard
  |
  v
getDashboardData()
  |
  v
EarthOptimizationDashboardClient
  |-- TreatyReminderComposer
  |-- ReferralInvitationStatusCard
  |-- ReferralLinkCard / ReferralGoalCard
  |-- More dashboard details
  v
No Humanity Manager status report panel

share-templates.ts
  |
  v
Used by TreatyReminderComposer, not by monthly-chain-digest
```

## Proposed state ASCII diagram

```text
                         +-----------------------------+
                         | share-templates.ts          |
                         | buildTaskShareTokens        |
                         | renderTemplate              |
                         +-------------+---------------+
                                       |
                                       v
Cron route                      humanity-manager-status.server.ts
  |                              |-- direct completed employees
  |                              |-- pending assigned employees
  |                              |-- overdue president tasks
  |                              |-- WITH RECURSIVE chain count/depth
  v                              |-- rendered default reminder messages
monthly-chain-digest.server.ts --+
  |
  v
HumanityManagerStatusInput
  |
  v
monthly-chain-digest-react-email.tsx
  |
  v
humanity-manager-status.email.tsx
  |
  v
humanity-manager-status-content.tsx
  |
  v
Email status report, same trigger/subject/dedupe path

/dashboard
  |
  v
getDashboardData()
  |
  v
DashboardData.humanityManagerStatus
  |
  v
EarthOptimizationDashboardClient
  |
  v
humanity-manager-status.web.tsx
  |
  v
Dashboard status panel with inline copy buttons
```

## Step list

- [ ] Read `packages/web/AGENTS.md` and `docs/h2ewd.md` before implementation because this touches public/dashboard/email copy. Do not edit Prisma schema or generated DB types; the recursive query must use existing fields.
- [ ] Add shared status types and content factory in `packages/web/src/lib/humanity-manager-status-content.tsx`. Export `HumanityManagerStatusInput`, `HumanityManagerStatusPerson`, `HumanityManagerStatusLeader`, and `HumanityManagerStatusReminder`. The factory should inject primitives for eyebrow, heading, text, metric table, completed-employee list, reminder block, and chain-summary block. It should not import React Email components or browser-only clipboard code.
- [ ] Keep terminology as "employees" in all new user-facing labels. Internally, avoid new `directReport` names except where preserving compatibility with old tests would create less churn.
- [ ] Add `packages/web/src/lib/humanity-manager-status.email.tsx`. Inject `CampaignEyebrow`, `CampaignHeading`, `CampaignText`, `CampaignMetricTable`, `CampaignCopyBlock`, `ParameterValueEmail`, and any email-specific chain math primitive. Keep absolute/relative URL policy aligned with existing email code and `getBaseUrl`; do not invent an email-only base URL helper.
- [ ] Add `packages/web/src/lib/humanity-manager-status.web.tsx` as a client-safe adapter. It should render treaty-style black-and-white UI, use inline copy buttons beside rendered reminder messages, and call the existing clipboard helper (`copyTextToClipboard`) rather than duplicating fallback clipboard code.
- [ ] Refactor `monthly-chain-digest-react-email.tsx` to delegate the reusable report body to `HumanityManagerStatusEmail`. Leave `CampaignEmailShell`, preview text, dashboard CTA, and share footer in the monthly digest file unless the extraction proves those are also shared by the dashboard.
- [ ] Preserve `MonthlyChainDigestInput` exports from `monthly-chain-digest-email.ts` during the migration. Either alias them to the new status types or keep a thin compatibility interface that extends the shared input so existing tests and callers continue compiling.
- [ ] Create `packages/web/src/lib/humanity-manager-status.server.ts`. Move current per-recipient status data fetching out of `monthly-chain-digest.server.ts` into a helper such as `loadHumanityManagerStatus({ userId, now, monthLabel, windowStart, baseUrl, referendumId })`.
- [ ] Implement the recursive downstream conversion query in that new server helper with typed `prisma.$queryRaw`. The CTE should walk `ReferendumVote` rows where a child vote's `referredByUserId` equals the prior row's `userId`, filtered to the active treaty referendum, YES answer, and `deletedAt IS NULL`. Count distinct downstream people/votes and compute max depth. Include a cycle guard using a visited `userId` path and a conservative max depth cap.
- [ ] Keep direct monthly completed employee samples separate from recursive total/depth metrics. The completed employee list remains a direct/sampled operational list; the summary metrics should clearly distinguish direct monthly completions from total downstream chain conversions/depth until Mike approves stronger wording.
- [ ] Reuse the existing overdue employee query semantics from `ReferralInvitation`: pending statuses are `PENDING`, `COPIED`, and `SENT`; filter by `referrerUserId`, not deleted, and the treaty referendum or null. Include `recipientName` and `inviteToken` in the sample so dashboard reminders can target a named human and use an invite-aware URL when available.
- [ ] Reuse the existing overdue president Task query semantics: `taskKey` starts with `TREATY_SIGNER_TASK_KEY_PREFIX`, `assigneePersonId` is non-null, `dueAt < now`, `deletedAt` is null, and status is not `VERIFIED`. Expand the selected fields only as needed for share tokens and links.
- [ ] Generate reminder messages in one helper path, not in component prose. Use `buildTaskShareTokens`, `getUsableShareTemplates`, `pickDefaultShareTemplateId`, and `renderTemplate`. Employee reminders use `recipientMode: "one_human"` and a referral/invite URL. President reminders use `recipientMode: "leader"` and task/treaty URL context.
- [ ] Update `monthly-chain-digest.server.ts` to call the new status helper. Keep `sendDedupedEmail` dedupe key, template ID, scope, skip signature, and `React.createElement(MonthlyChainDigestReactEmail, ...)` path unchanged.
- [ ] Add `humanityManagerStatus` to `DashboardData` in `packages/web/src/types/dashboard.ts`, populate it from `getDashboardData` in `packages/web/src/lib/dashboard.server.ts`, and mock it in `dashboard.server.test.ts`.
- [ ] Render `HumanityManagerStatusPanel` in `EarthOptimizationDashboardClient` after the section that contains `TreatyReminderComposer` and `ReferralInvitationStatusCard`, before the referral link/goal grid. Do not put the panel inside `More dashboard`.
- [ ] Leave `TreatyTaskDashboardClient` untouched unless Mike/orchestrator expands scope. Note: the War on Disease dashboard variant may route there instead of `EarthOptimizationDashboardClient`, so the reviewer should confirm which dashboard variant is in scope before final UI verification.
- [ ] Update `monthly-chain-digest-email.test.ts` immediately after the no-op extraction to prove the email still renders the same status content. Then add/adjust tests for transitive chain count and depth once the recursive query lands.
- [ ] Add focused tests for `humanity-manager-status.server.ts` that catch real failures: mapping recursive query results into numeric count/depth, preserving pending-invitation filters, using president task filters, and rendering copyable employee/president reminder messages through the shared template pipeline.
- [ ] Add a focused web adapter test only if it can assert behavior that ships, such as a click-to-copy button receiving the rendered reminder text. Do not add mock-and-assert-the-mock tests.
- [ ] Regenerate the monthly-chain-digest `.email.md` preview after the email source changes. For the dashboard UI change, capture screenshots and generate `packages/web/output/playwright/review/latest.html`; do not commit UI changes until Mike approves or waives screenshot review.
- [ ] Run focused verification in this order: monthly-chain-digest email tests, new status server/content tests, dashboard server tests, `pnpm --filter @optimitron/web run typecheck:fast`, and `git diff --check`. Do not run `next build` or `pnpm build` during Codex work.

## Risks

- Recursive referral chains can loop if data ever contains cycles. The query needs both a visited path and a depth cap.
- Recursive CTEs can become expensive on a hot dashboard if a user has a large downstream tree. Start with indexed `ReferendumVote.referredByUserId` traversal and revisit materialization only if real latency data demands it.
- `ReferendumVote.userId` is the traversal node and `personId` is the conversion identity. Counting the wrong one will either miss represented people or double-count user-entered votes.
- The prompt names stale promotion adapter filenames. Implementation should follow the live `.email.tsx` and `.web.tsx` filenames.
- `EarthOptimizationDashboardClient` may not be the active dashboard for every host/site variant. The plan follows the user's specified file, but final visual verification should open the relevant host and confirm the panel is actually reachable.
- Copy changes in email/dashboard surfaces require Mike review before commit under repo rules.
- Moving email body structure can break generated plaintext or manual parameter links even when HTML looks fine. Keep render-based email tests and regenerate the `.email.md` preview.

## Files to touch

Expected creates:

- `packages/web/src/lib/humanity-manager-status-content.tsx`
- `packages/web/src/lib/humanity-manager-status.email.tsx`
- `packages/web/src/lib/humanity-manager-status.web.tsx`
- `packages/web/src/lib/humanity-manager-status.server.ts`
- `packages/web/src/lib/__tests__/humanity-manager-status.server.test.ts`

Expected modifies:

- `packages/web/src/lib/email/monthly-chain-digest-react-email.tsx`
- `packages/web/src/lib/email/monthly-chain-digest.server.ts`
- `packages/web/src/lib/email/monthly-chain-digest-email.ts`
- `packages/web/src/lib/email/__tests__/monthly-chain-digest-email.test.ts`
- `packages/web/src/lib/email/monthly-chain-digest.email.md`
- `packages/web/src/types/dashboard.ts`
- `packages/web/src/lib/dashboard.server.ts`
- `packages/web/src/lib/__tests__/dashboard.server.test.ts`
- `packages/web/src/components/dashboard/EarthOptimizationDashboardClient.tsx`

Expected read-only dependencies:

- `packages/web/src/lib/tasks/share-templates.ts`
- `packages/web/src/lib/tasks/render-template.ts`
- `packages/web/src/lib/tasks/accountability.ts`
- `packages/web/src/components/landing/TreatyReminderComposer.tsx`
- `packages/db/prisma/schema.prisma`

## ALERTS

## Agent log

## Codex critique (round 1)

This plan is directionally buildable, but it is not solid yet. The raw pieces exist in the current codebase, and the plan correctly identifies the live promotion adapter filenames, the direct monthly email data path, the current "employees" terminology, and the exact EarthOptimizationDashboardClient insertion point. The weak parts are the dynamic shared-rendering boundary, the recursive query's cost model, and the template-token path.

1. Adaptive content-module pattern only fits if the shared content owns the data-driven layout, not just static prose.

The reference pattern in `packages/web/src/lib/humanity-manager-promotion-content.tsx` is almost static. `createHumanityManagerPromotion(...)` injects primitives, then returns a component with no props and no per-user conditionals. The email and web adapters only provide primitive implementations. That is a good fit for static promotion copy.

The status panel is different: it has per-user counts, sampled people, sampled presidents, chain count/depth, and dashboard-only copy buttons. The plan says to add a content factory and inject primitives for metric table, employee list, reminder block, and chain-summary block, but that can easily become two renderers that separately map the same input into email rows and web rows. If the implementation goes that way, the "shared module" will only share types and high-level naming, not rendering logic.

Plan fix: specify the exact boundary. The shared content module should export a factory that returns something like `HumanityManagerStatus({ input })`, and the shared component should own the conditionals, list slicing, empty states, metric labels, and selection/order of status sections. The `.email.tsx` and `.web.tsx` files should only adapt primitives such as `Text`, `MetricTable`, `CopyBlock`, `ActionButton`, and maybe `ReminderMessage`. The dashboard copy button can be a web primitive around the same `input.reminders[]` items; the email primitive can render the same item as `CampaignCopyBlock`. If this is not stated, the extraction will likely duplicate the real logic.

2. Recursive chain query is buildable, but the plan under-specifies semantics and cost.

Prisma has no native recursive CTE API, so the plan's choice of typed `prisma.$queryRaw` is the right class of solution. The schema supports the traversal: `ReferendumVote.referredByUserId` points to the referrer user, and each vote row has the child `userId`; `User.referralCode` is the share identity; `ReferralInvitation` and `Task` have the pending/reminder data the plan wants. The relevant indexes exist for basic traversal, especially `ReferendumVote.referredByUserId`, plus referendum/answer/deleted indexes.

But the plan still needs more precision before implementation:

- The recursive CTE must traverse distinct child user nodes, not raw vote rows, or represented votes can multiply downstream branches. Counting conversions may use distinct `personId` or distinct vote ids, but recursion should de-duplicate `userId` per depth/path.
- The plan says "count distinct downstream people/votes"; it must choose one metric name and one SQL expression. `ReferendumVote` is unique by `[referendumId, personId]`, while the referral tree edge is user-to-user. Mixing "people" and "votes" will produce confusing numbers.
- `$queryRaw` aggregate values can come back as `bigint` depending on the driver. The server helper and tests should explicitly normalize count/depth to safe numbers.
- The SQL must quote Prisma table/column names correctly, use a tagged template with parameters, include `referendumId`, `answer = YES`, `deletedAt IS NULL`, a visited-user path, and a hard max depth.
- Current indexes may still leave a high-cardinality referrer doing repeated lookups and filters. The plan should require measuring the query shape with realistic rows before putting it on dashboard load.

3. "Employees" is mostly current, but the plan should remove the remaining plan-language drift.

The current email and promotion files already use "employees" in user-facing copy. I found no remaining "direct reports" in the referenced implementation files; the only "direct reports" hit is the plan quoting old TODO scope. That quote is fine as history.

The plan should still tighten its own implementation language. The brief says "overdue assigned humans"; the proposed data flow says "pending assigned employees"; the step list uses `overdueEmployee*`. Use "employees" for user-facing labels and type names unless a legacy exported type truly requires compatibility. Do not introduce `overdueHuman` or `directReport` names in new code.

4. EarthOptimizationDashboardClient placement is specified correctly, but the active War on Disease dashboard is still unresolved.

For the file the prompt asked about, the plan is precise enough. `EarthOptimizationDashboardClient` currently renders the invite section with `TreatyReminderComposer` and `ReferralInvitationStatusCard`, then the referral link/goal grid. The panel should go immediately after that invite section and before the referral grid. That preserves the primary reminder composer as the first dashboard action.

The unresolved issue is reachability. `packages/web/src/app/dashboard/page.tsx` can route sites with `dashboard === "treatyTaskDashboard"` to `TreatyTaskDashboardClient` instead of `EarthOptimizationDashboardClient`. The plan notes this as a reviewer confirmation, but for this repo that is too late. War on Disease is the primary campaign surface. The plan should add an early verification step: confirm which dashboard variant `warondisease.org` uses locally, then either implement the status panel in the active War on Disease dashboard too, or explicitly narrow scope to the Optimitron dashboard and say the campaign dashboard will not get the panel in this pass.

5. Share-template variants exist, but the token/default path is not guaranteed.

`share-templates.ts` has the needed recipient modes: `"leader"`, `"humanity"`, `"one_human"`, and `"peer"`. It also has defaults for leader and one-human modes, and `TreatyReminderComposer` already uses `buildTaskShareTokens`, `getUsableShareTemplates`, `pickDefaultShareTemplateId`, and `renderTemplate`.

The plan's "just render default messages" claim is too optimistic:

- `ONE_HUMAN_DEFAULT_SHARE_TEMPLATE_ID` is `lumbergh-one-human`, and it requires more than `target_name` plus a URL. It needs tokens such as `deaths_from_delay`, `trial_capacity_multiplier`, `eradication_years_status_quo`, `eradication_years_treaty`, `treaty_hale_gain`, and `lifetime_income_gain`.
- `DEFAULT_SHARE_TEMPLATE_ID` is `lumbergh`; it is leader/humanity only and requires `target_name`, `deaths_from_delay`, `mil_to_trials_ratio`, and `mil_synonym`.
- `getUsableShareTemplates` filters out templates with missing token values, and `renderTemplate` throws on unresolved tokens by default.

So the status helper must define the token source for both cases. For employee reminders, use the invite-aware URL as `treatyUrl`, but also define `targetLabel`, `currentDelayDays`, and delay-cost tokens. For president reminders, the Task query must select or derive enough country/budget/context fields if the default leader template is expected to survive filtering. If the helper intentionally falls back to another usable template, the plan should say that and test it. Otherwise the implementation may render no message or silently pick a non-default template.

6. Monthly digest migration safety needs a stricter "unchanged until approved" rule.

The plan does protect the dedupe key, template id, subject path, and render entry point, and existing tests cover the important HTML/plaintext content. That is good.

The risk is that the proposed server helper generates rendered reminder messages through `share-templates.ts`, while the current monthly email hardcodes its employee and president reminder messages in `monthly-chain-digest-react-email.tsx`. If the email starts consuming the new shared reminders, the existing monthly digest will change even if the subject and CTA survive. The prompt requires the existing email to keep working unchanged.

Plan fix: stage the extraction as a literal no-op for email first. The first pass should render the same HTML/text from the same `MonthlyChainDigestInput` fields, including current reminder copy. Only the dashboard should use `share-templates.ts` copyable reminders unless Mike explicitly approves changing monthly email copy. Tests should compare positive and resend HTML/text for the current strings, regenerate the `.email.md` preview, and include at least one publisher-level regression that `sendDedupedEmail` still receives the same template id, dedupe key shape, scope, skip signature, and `MonthlyChainDigestReactEmail` element.

7. Dashboard performance and caching are not addressed enough.

The current `getDashboardData(userId)` already runs several DB queries on every dashboard request. Adding a recursive CTE there means every dashboard page load can walk the user's downstream tree. The plan's risk note says to "revisit materialization only if real latency data demands it", but that is not a caching strategy. It also does not say what counts as too slow, where metrics are recorded, or how often the value can be stale.

Plan fix: choose a first caching policy before implementation. Options:

- Keep the raw CTE for the monthly cron/email path, but do not run it synchronously on dashboard load until a cached summary exists.
- Add a short TTL per-user cache around the recursive count/depth for dashboard reads, with an explicit stale window and a test seam. This is weaker in serverless, but still better than an unconditional CTE.
- If exact dashboard freshness is required at scale, request explicit schema approval for a denormalized summary table or counter updated by vote/invitation conversion events.

Without one of those choices, the plan is likely to ship a correct query in the wrong place.

## Codex critique summary

1. The adaptive `.web` / `.email` split is viable only if the shared content module owns the dynamic status layout; otherwise this becomes duplicated email and dashboard render logic with shared names.
2. The recursive chain query is buildable with `$queryRaw`, but the plan must pin down traversal/count semantics, bigint normalization, cycle/depth guards, and a dashboard caching policy before implementation.
3. The template integration is real but under-specified: the desired default one-human and leader templates require nontrivial tokens, so the plan must define token construction or tested fallback behavior, while keeping the existing monthly digest copy unchanged until explicitly approved.

## Mike approved (round 2)

Mike's decision: cached count on User row + background job for the recursive referral-tree query.

Approved scope:
1. Schema change (NEEDS HUMAN APPROVAL per CLAUDE.md before merge): add `downstreamConversionCount Int @default(0)` and `downstreamMaxDepth Int @default(0)` columns to `User` in `packages/db/prisma/schema.prisma`. Migration named `add-user-downstream-cache`.
2. Background job at `packages/web/src/lib/jobs/refresh-user-downstream-cache.server.ts` runs hourly via cron, executes a recursive SQL CTE via `prisma.$queryRaw` walking the `ReferralInvitation` tree, writes the counts back to `User`.
3. Dashboard panel component at `packages/web/src/components/dashboard/HumanityManagerStatusPanel.tsx` (and `.email.tsx` for the digest variant) reads from the cached columns. Same adaptive-content-module pattern as `humanity-manager-promotion-*`.
4. Direct referrals (1-hop) computed live from `ReferralInvitation` — those are cheap. Only the recursive total uses the cached column.
5. Copyable reminder messages on the dashboard variant wire to `share-templates.ts` (the canonical registry per the email-template-audit plan).
6. Existing monthly-chain-digest email keeps working unchanged during the migration. Status panel is additive.

NOT in scope: real-time recursion (per Mike's pick). Slight staleness up to 1 hour is acceptable.

Schema change DISPATCH NOTE: do NOT apply the migration in this dispatch. Generate the Prisma migration file, stage it for Mike to review + apply manually via `pnpm db:migrate`. Implementation reads from the new columns assuming they exist; tests use a fixture.
