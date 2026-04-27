# Optimitron Treaty Migration TODO

This is the working checklist for finishing the treaty migration and post-vote referral flow in Optimitron.

## Working Context

- [x] Resolved the GitHub Actions `pnpm db:deploy` P3009 on `20260425200000_create_task_comment_tables` by inspecting the live migration ledger and partial schema state, marking the stale shim row applied, and rerunning deploy.
- [x] Renamed the `/donate` founder-email constant to Mike-specific naming and use `m@warondisease.org`.
- [x] Removed the root `AGENTS.md` rule that requires full `pnpm check` before every completed task; keep focused checks as the default local protocol.
- [x] Added both conditional-on-success and 1%-success-probability suffering-years-per-dollar figures to `/donate`.
- [x] Added a Playwright screenshot audit for the treaty survey and post-vote flow so the current UI can be reviewed before deciding on a more minimal black-and-white/serif redesign.
  - Run: `pnpm --filter @optimitron/web exec playwright test e2e/treaty-vote-post-vote-screenshots.spec.ts --project=default --reporter=list`
  - Outputs 19 desktop and 19 mobile-width screenshots under `packages/web/public/img/screenshots/treaty-vote-post-vote-flow/`.
- [x] Redesign the Treaty survey/post-vote cards as a full-screen treaty-style experience: black and white, restrained Libre Baskerville typography, fewer cyan/pink neobrutalist accents, quieter controls, and preserved screen order/copy.
  - Added a shared `TreatyFlowShell` with full-viewport paper framing, treaty-style buttons/inputs, and drop-cap support.
  - Regenerated the screenshot audit after the redesign; desktop and mobile-width outputs remain under `packages/web/public/img/screenshots/treaty-vote-post-vote-flow/`.
- [x] Simplified the treaty flow visual treatment by removing decorative top labels and replacing boxed percentage/math UI with quieter treaty-text-style rules.
- [x] Removed the remaining full-screen treaty-flow edge outline, centered vote/post-vote text on mobile, and kept desktop paragraphs left-aligned.
- [x] Replaced the post-vote message-format choice with a two-position Love mode / Bossy mode toggle and updated the screenshot audit path.
- [x] Kept the treaty allocation percentages side-by-side on mobile with Military & Weapons left and Clinical Trials right.
- [x] Completed agreed post-vote cleanup slice: replaced Bossy mode ASCII/markdown task formatting, removed the final donation screen, redirected feedback submit to dashboard, and removed the stray dashboard link.
- [x] Fixed the desktop post-vote full-screen framing so screenshots and the live flow cannot show the unrelated yellow landing section beneath the treaty experience.
- [x] Collapsed the post-vote math screen's repeated inline math toggles into one full-screen math dialog and fixed mobile Frame 07 screenshot containment.
- [x] Updated `docs/questions.md` to match the current Check the Math modal and Love/Bossy mode flow while preserving ASCII as ideation reference.
- [x] Implement numbered Treaty flow variants with minimal duplication.
  - `treaty_flow_v1_vote_first` preserves the current implemented slider-first flow for later comparison.
  - `treaty_flow_v2_context_first` implements the current `docs/questions.md` context-first flow as the default.
  - Keep the fork at the orchestration/screen-sequence layer; share the slider, vote submission, verification, post-vote send loop, math dialog, and analytics plumbing.
  - Support explicit URL override with `?treatyFlow=...` and attach the selected `flowVariant` to funnel analytics.
  - Update the screenshot audit so each captured folder is keyed by flow variant and viewport.
  - `docs/questions.md` references `packages/web/public/img/grandma.jpg`; the current UI renders a framed placeholder until that real asset is added.
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
  - `TaskComment` = the readable task thread: comments, outgoing messages, inbound replies, manual assignee responses, and status notes.
  - `TaskCommunication` = the delivery/contact envelope: channel, recipient, endpoint, provider ids, status, metadata, and the link to the readable comment.
  - `TaskCommunicationEndpoint` = assignee contact methods such as email, mailto, official forms, public pages, profiles, in-app, or manual instructions.
  - `EmailLog` = email delivery, provider status, webhook events, and dedupe.
  - `TrackingReminder` = health-variable measurement reminders only; do not use it for outreach/task assignment reminders.
- [ ] Avoid one-off treaty reminder systems. New task/outreach messaging should go through shared task-message selection, rendering, attribution, and analytics helpers.
- [ ] Keep seeded default copy deterministic and reviewable, even after adding database-backed message variants.
- [ ] Preserve exact rendered outbound messages for replication analysis. The text people actually send is the unit to measure.
- [ ] Keep `TaskCommunication.status` channel-agnostic and small: `DRAFT`, `SENT`, `RECEIVED`, `FAILED`, `CANCELLED`.
  - External URL/form details such as `openedAt` and `submittedAt` belong in `TaskCommunication.metadataJson`, not as top-level lifecycle states.
  - Only record `submittedAt` when a user or agent confirms submission; opening a URL is not proof that a form was submitted.

## Architecture Refactoring And Deduplication

These are technical-debt items surfaced by a 2026-04-25 architecture audit of the referral/email/share subsystem. They are not launch blockers but should land before the second non-treaty task family is wired up, because every one of them gets harder once a second caller exists.

- [x] Shrink and split `packages/web/src/lib/referral-invitations.server.ts` (823 lines).
  - [x] First split: moved recipient invitation email send/cron logic and sender reminder cron scheduling into `packages/web/src/lib/email/referral-invitation-emails.server.ts`; lifecycle module is down to ~414 lines and no longer imports Resend or treaty sender reminder dispatch.
  - [x] Second split: moved invite task key/title/description generation, task creation, and conversion verification updates into `packages/web/src/lib/referral-invitation-tasks.server.ts`; lifecycle module is down to ~406 lines.
  - The remaining lifecycle file owns invitation validation, recipient person linkage, status transitions, and share-attempt recording only.
- [ ] Merge `packages/web/src/lib/referral-email-sequence.ts` (784 lines) and `packages/web/src/lib/referral-invitation-email-sequence.ts` (268 lines) into a single sequence module.
  - Both expose delay schedules, max-step constants (`REFERRAL_*_MAX_STEP`), subject lists, and template builders. Land one ordered sequence per role (recipient, sender) with a single discriminator.
  - This is the natural home for the eventual `TaskCommunicationTemplate` / `TaskCommunicationVariant` lookup.
- [x] Extract small shared modules for cross-file primitives.
  - Server `sha256Hex()` lives in `packages/web/src/lib/crypto.server.ts`; both prior duplicates removed.
  - `SENDER_REMINDER_DELAY_DAYS` is now exported from `referral-invitations.server.ts` and imported by the API route.
  - `getReferralEmailBatchSize()` lives in `packages/web/src/lib/email/batch.ts`; the duplicate `getReferralInvitationEmailBatchSize()` was deleted and call sites updated.
  - `MS_PER_DAY` constant added in `packages/web/src/lib/time.ts`; the inline `24 * 60 * 60 * 1000` literals in `referral-invitations.server.ts`, `referral-email.server.ts`, and `app/api/referral-invitations/route.ts` now use it. Other inline occurrences (`treaty-sender-emails.server.ts:447`, `census-aggregation.server.ts:69`) left untouched and can be migrated opportunistically.
  - Browser-side async `sha256Hex` in `components/landing/PostVoteReminders.tsx:30` and `components/tasks/task-row-share.tsx:29` is still duplicated — Web Crypto is async; not worth the risk in this pass.
- [x] Group email infrastructure under `packages/web/src/lib/email/`.
  - `email-urls.ts`, `magic-link-email.ts`, `referral-email.server.ts`, `referral-email-sequence.ts`, `referral-invitation-email-sequence.ts`, and `treaty-sender-emails.server.ts` currently sit flat in `lib/`.
  - `referral-invitation-emails.server.ts` now lives under `lib/email/` and owns recipient invitation email send/cron plus sender reminder cron scheduling.
  - [x] Moved flat email infrastructure into `packages/web/src/lib/email/`: URL helpers, magic-link email, referral sequence sender, referral sequence copy builders, recipient invitation sequence builders, treaty sender sequence builders, treaty sender dispatcher, and the Resend wrapper. Updated affected route/test imports.
  - [x] Centralized queued `EmailLog` creation and status transitions in `packages/web/src/lib/email/email-log.server.ts`; referral sequence and treaty sender email paths now share `createEmailLog()`, duplicate detection, and SENT/FAILED updates.
- [x] Unify `ShareAttempt` writes through one helper.
  - `recordShareAttempt(tx, { ... })` now lives in `packages/web/src/lib/share-attempts.server.ts` and computes both `templateHash` and `renderedHash` from the inputs, eliminating the per-call `sha256Hex` plumbing.
  - The two creation paths in `referral-invitations.server.ts` (copied invite, email-send) both go through the helper. Future task families should call the same helper.
  - `surface` is still a free-form string; an enum/lookup can come later when more surfaces exist.
- [x] Fix `getSenderInviteEmailFromAddress()` in `referral-invitations.server.ts`.
  - Extracted shared `parseEmailFromHeader()` and `sanitizeDisplayName()` into `packages/web/src/lib/email/from-address.ts` with full edge-case coverage (`from-address.test.ts`).
  - `referral-invitations.server.ts:getSenderInviteEmailFromAddress`, `resend.ts:getEmailFromAddress`, and `resend.ts:buildUnsubscribeHeaders` all now use the shared parser; removed the duplicated `/^.*<|>.*$/g` regex from both files.
- [x] Audit the `lib/alignment-legislative-*` file split before the next alignment slice.
  - `alignment-legislative-sync.server.ts` (369 lines), `alignment-legislative-config.ts` (445 lines), and `alignment-legislative-classification.ts` (193 lines) have overlapping concerns and inconsistent naming.
  - Decide between a `lib/alignment/legislative/` subdirectory with clear boundaries (sync vs. config vs. classification) or a merge into a single `alignment-legislative.server.ts`.
  - **Decision 2026-04-25:** Keep the three-file split for now. `config` is static feeds/category rules, `classification` is pure bill classification used by API/chat/CBA callers, and `sync.server` owns external fetch/dedupe/profile derivation. A subdirectory rename can wait until the next alignment feature touches these files; no merge is justified.
- [ ] Audit found clean and out of scope (do not re-check unless behavior changes):
  - Library packages (`optimizer`, `wishocracy`, `opg`, `obg`, `data`) do not import the Prisma client at runtime — boundary intact.
  - `getPersonHref()` is used at all 16 call sites; no raw `/people/${id}` URLs.
  - No display-identity violations: `User.name` / `User.username` reads all flow through `@/lib/user-display`.
  - `TrackingReminder` is not used in `packages/web/src` — no outreach misuse.
  - `TreatyPostVoteShareFlow.tsx` numerals are parameter-backed; only the milestone literal `100` and the `<ParameterValue>`-wrapped `95%` CI label remain, both intentional.
  - `POINT_NAME = "VOTE"` is declared once in `lib/messaging.ts`; the eventual reward/points rename is a single-source-of-truth change.

## MCP Server Agent Workflow

Agent-usage feedback from 2026-04-25: the current toolset covers the core loop well (`listTasks`, `getTask`, `getBlockers`, `searchManual`, `proposeTaskBundle`, `updateTask`, `setTaskImpact`, `addDependency`, `getNextAction`, `getFundingStats`) and the scope model is basically right. The main missing layer is ranking/search ergonomics.

- [x] Rewrite the MCP/developer documentation as a concise product/features page, not just a tool inventory.
  - Explain the business purpose in plain language: MCP lets AI agents find the highest-value work, understand why it matters, coordinate without collisions, execute or propose work, and leave an audit trail.
  - Include examples of why someone would use it: "ask what to do next," "find all tasks about a partner/org," "rank work by USD/hour," "check if outreach is allowed," "propose a task bundle from research," and "look up sourced parameters."
  - Keep detailed tool schemas in docs, but make the public-facing page lead with outcomes and workflows.
  - Added `docs/MCP_SERVER.md` for the repo-facing overview and naming boundaries; rewrote `/developers` to lead with business value, feature groups, and example workflows.
- [x] Verify MCP outreach naming/docs changes with focused web/agent tests and typechecks.
- [x] **Completed 2026-04-25:** Implement the task communication schema cleanup.
  - Migration `20260425220000_task_communication_system` applied: TaskEmail* renamed to TaskCommunication*; TaskCommunicationEndpoint added with backfill from Task.contactUrl/Label/Template before those columns were dropped; TaskComment expanded with `kind`/`visibility`/`source`/external-author fields; EmailLog reshaped (`userId` nullable, `dedupeKey` added).
  - Application code purged of legacy threading: zero `TaskEmail*` / `TaskAssigneeContact*` / `recordTaskAssigneeAssigneeContactActivity` / `formSubmission` references in production code; `Task.contactUrl/Label/Template` deleted across DTO, API, MCP server, components, helpers, seed; replaced with structured `primaryEndpoint` shape sourced from `TaskCommunicationEndpoint`.
  - MCP tools renamed (`recordTaskCommunication`, `checkTaskCommunicationCooldown`); Slice 4 deleted the legacy flat `contactLabel/contactUrl/contactTemplate` shape across the API/DTO/MCP/component/seed surfaces in favour of the structured `primaryEndpoint` shape.
  - Outgoing Optimitron/Wishonia messages create a readable `TaskComment` plus linked `TaskCommunication`.
  - Email sends also link to `EmailLog`; external URL/form actions use `TaskCommunication(status=SENT)` plus metadata such as `openedAt`.
  - `Activity` stays a lightweight audit feed, not the canonical message store. Doc: `docs/TASK_COMMUNICATION_MODEL.md` (covers TaskCommentKind semantics, system author identity = required `wishonia` user, endpoint priority/selection rules, inbound-email guardrails as deferred multi-week project, Activity-vs-TaskCommunication ownership).
  - Verification: `prisma migrate deploy` clean; `tsc --noEmit` clean across web/agent/db; tests green (web 790 / agent 96 / db 107).
- [ ] Add optimization-rate ranking to MCP task discovery.
  - `listTasks` should accept `sortBy: "accountability" | "optimizationRate" | "delayLoss" | "createdAt"`; keep `accountability` as default until callers deliberately switch.
  - Consider a `getOptimizationRate` or `rankTasksByOptimizationRate` helper only if the result needs more explanation than `listTasks` can return.
  - Reuse the existing `getNextAction` / task-economics path so task discovery and queue selection do not diverge.
  - First pass should compute this in a shared helper and return it from MCP responses; do **not** add `Task.optimizationRate` until profiling proves a persisted/materialized value is needed. A persisted column is a Prisma schema change and requires explicit human approval.
  - Denominate the ranking metric in USD/hour. Direct term should start from the selected frame's `expectedEconomicValueUsdBase / effortHours`, because existing treaty frames already store risk-adjusted expected value.
  - Do not multiply `expectedEconomicValueUsdBase` by `successProbabilityBase` again unless the input value is explicitly renamed/documented as gross conditional value; otherwise the formula double-discounts treaty tasks.
  - Downstream cascade boost should use `TaskEdge` weights when available: `SUM(downstream.expectedEconomicValueUsdBase * COALESCE(edge.probabilityDeltaBase, defaultCascadeWeight)) / effortHours`. Use `0.2` only as a documented fallback, not a magic constant hidden inside sorting.
  - Include a formula breakdown in leaderboard output: direct USD/hour, cascade USD/hour, delay-loss signal, and fields used.
- [ ] Expose task full-text search through MCP.
  - `packages/web/src/lib/tasks.server.ts` already has `searchTasks()`; add either a `searchTasks` MCP tool or a `query` parameter on `listTasks`.
  - Return compact task summaries plus match score/snippet where available.
  - Reuse the existing contains-based `searchTasks()` implementation first; add Postgres `tsvector`/ranking later only if search quality or performance needs it.
- [ ] Add parameter lookup MCP tools.
  - Add `listParameters` / `getParameter` backed by `@optimitron/data/parameters` and `parameters-calculations-citations.ts`.
  - Return value, formatted display, unit, confidence/conservative flags, formula, source URL/ref, and manual/calculations URL when present.
- [ ] Add a natural task-tree MCP view.
  - `listTasks(parentTaskId)` works, but `getTaskTree(taskId, depth)` should return parent -> children -> grandchildren for structure inspection.
  - Reuse existing task hierarchy helpers/relations where possible; a recursive SQL query is fine later, but not required for the first version.
- [ ] Add batch task mutation only after the single-task tools are stable.
  - `batchUpdateTasks` should be transactional where possible, return per-task validation errors, and require `tasks:write`.
- [ ] Keep lease and claim tools separate in MCP docs.
  - Lease tools (`acquireLease`, `heartbeatLease`, `releaseLease`) are Agent Ops for concurrent autonomous workers; keep them.
  - Claim tools (`claimTask`, `completeTaskClaim`) are human/UI journey tools exposed for completeness, not the primary agent coordination mechanism.
- [ ] Rename unclear task communication MCP tools directly; no compatibility aliases are needed before external consumers exist.
  - Final tool names should expose the real model: `checkTaskCommunicationCooldown` and `recordTaskCommunication`.
  - Naming boundary: `TaskCommunication` owns outbound/inbound delivery/contact envelopes; `TaskComment` owns the readable thread; `EmailLog` owns provider-level email delivery details.
  - Channel naming: use `externalUrl`, not `link` or `formSubmission`, for office forms / official pages / public profiles. "Link" sounds like the message being sent is the outreach, while "formSubmission" overclaims because the current code records opening/using the external URL, not proof that a form was submitted.
- [ ] Rename other MCP tools directly when the new name is more self-documenting; do not keep old aliases by default.

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
- [x] Audit `TreatyPostVoteShareFlow.tsx` against the canonical doc after parameterization.
  - Verify screen order, button text, alt/dismissive branches, details folds, send loop, depth hook, close, feedback, and dashboard redirect.
  - Track details-fold expansion, dismissive-path count, format choice, copy/send events, and completed invitations.
  - Canonical source checked: `docs/questions.md` share-flow v13 (2026-04-25).
  - Do not reference a missing standalone `share-flow-v13-apr25.md` unless that file is actually added to the repo; current in-repo canonical source is `docs/questions.md`.
  - Audit result: visible screen order/copy remains aligned after parameterization; direct transitions from copy/send confirmation, completed invitations, and feedback submit now use the same tracked transition helper as the rest of the flow.

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
- [x] Add a merge/cleanup path for duplicate `Person` records created from referrals, imports, and manually assigned tasks.
  - `mergeDuplicatePerson()` in `packages/web/src/lib/person.server.ts` moves duplicate `Task.assigneePersonId`, `ReferralInvitation.recipientPersonId`, and safe one-user `User.personId` links to the canonical person, preserves missing canonical metadata from the duplicate, clears duplicate unique fields, and soft-deletes the duplicate.
  - It refuses to merge two `Person` rows that are linked to different users. That keeps account identity cleanup explicit instead of silently collapsing two signed-up humans.
  - Covered by `packages/web/src/lib/__tests__/person.server.test.ts`.
- [x] Add dashboard filters for pending, sent, copied, converted, declined, cancelled, and stale referral tasks.
  - The Earth optimization tasks card now filters all/pending/copied/sent/confirmed/closed rows.

## Treaty Vote And Referral Flow

- [x] Require verified login before the post-vote share flow.
- [x] Keep generic referral attribution separate from named invite conversion.
- [x] Use `/vote/<username-or-referralCode>` as the clean generic referral URL.
- [x] Use `/vote/<username-or-referralCode>?invite=<inviteToken>` for named invitations.
- [x] Verify invite-token attribution through the full recipient path in a browser:
  vote link -> landing -> vote -> verification -> vote sync -> invitation converted -> task verified -> dashboard updated.
  - Playwright coverage exists at `packages/web/e2e/invite-token-attribution.spec.ts`:
    1. `/vote/<code>?invite=<token>` server redirect preserves both query params.
    2. Landing-page mount effect captures the token to `localStorage` (`signup_invite_token`).
    3. Token survives a demo-credentials auth roundtrip (same-origin reload).
    4. Vote POST body carries `inviteToken` end-to-end.
    5. Demo sender creates a named invitation, a fresh recipient account votes through the token, the vote response returns `CONVERTED`, `/api/referral-invitations` shows `convertedAt`, and the sender dashboard row renders as confirmed.
  - Run: `pnpm --filter @optimitron/web exec playwright test e2e/invite-token-attribution.spec.ts --project=default`. Requires the seeded demo user (`pnpm --filter @optimitron/db exec prisma db seed`) and the web server up on `:3001`.
  - Conversion logic itself (linked task verified + recipient attached to person) remains unit-covered in `referral-invitations.server.test.ts`; the browser spec now proves the real API/browser conversion and dashboard status path with a distinct per-run recipient.
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

This section tracks the analytics/measurement layer that sits on top of the generic task-message system. The schema/engine work it depends on lives in **Treaty-To-Generic Task System Migration** (next section).

- [ ] Treat task reminder text as measurable replication content, not just static copy.
  - Persist the exact text the sender copied or sent, including user edits, selected format, channel, recipient/task/invite, and created/sent timestamps.
  - Attribute downstream results to that text: opens, clicks, vote completion, recipient shares, second-generation shares, spam reports, unsubscribes, and conversion delay.
  - Report a replication coefficient by message/template/variant: average verified voters generated per completed sender action.
- [ ] Extend `ShareAttempt` as the canonical outbound-message ledger.
  - Add nullable `referralInvitationId`, `taskCommunicationVariantId`, and `purpose`.
  - Every copied message, native share, server-sent invitation email, and recipient reminder email should create or link a `ShareAttempt`.
  - [x] First referral-invitation slice: `/send` and post-vote copied invite messages now pre-generate `sa=`, persist exact copied text/hash/edit state to `ShareAttempt`, and link the invitation to that attempt.
  - [x] First recipient-email slice: server-sent referral invitation emails and recipient reminders now embed `sa=`, persist exact outbound email text/hash/template metadata to `ShareAttempt`, and link the invitation to the latest sent attempt.
  - [x] All `ShareAttempt` writes now go through `recordShareAttempt()` in `packages/web/src/lib/share-attempts.server.ts`; future task families inherit consistent attribution and hashing.
  - [x] Invite URLs include `sa=` when a specific message attempt exists, in addition to `invite=` for named invitation conversion. `embedShareAttemptId()` now handles owned invite URLs that already contain `?invite=...`, covered by `share-channels.test.ts` and `post-vote-share-flow.spec.ts`.
- [ ] Add a testable "best current reminder" selection path.
  - Start with deterministic seeded defaults.
  - Later promote variants based on replication coefficient, with guardrails for spam reports and unsubscribe rates.
- [ ] **Outbound task assignment for external organizations** (the "you have been assigned a task on the Earth Optimization tree" cold-outreach feature).
  - Use the existing task system to track work owed by external orgs we need partnerships from: Wefunder (Track 3 partnership), securities law firms (compliance review), curated companies (apply for pool inclusion), Kingscrowd (curation overlay), media outlets (coverage), allied nonprofits, etc.
  - Each external task records: target org, communication endpoint, assigned task, deadline, current status, readable thread, and communication history. Reuses `Task`, `TaskCommunicationEndpoint`, `TaskComment`, `TaskCommunication`, and `EmailLog`; no parallel system.
  - Cold-outreach reminder cadence is **distinct** from friend-to-friend referral reminders: lower frequency (no more than 2 follow-ups over 4 weeks), explicit disclosure that the recipient did not opt in, prominent and trivially actionable opt-out, no embedded tracking pixel, no engagement-bait subject lines. Treat this as cold sales outreach with a Wishonia voice, not as transactional or referral email.
  - Wishonia voice fits naturally — *"Wefunder has been notified. Wefunder has not responded. The Commission has noted this."* — but the funny framing must not paper over the fact that this is unsolicited contact. The voice is the wrapper; the substance is professional cold outreach.
  - Risks to manage: spam-filter reputation damage from any volume of "you have an overdue task" cold emails; legal exposure if the recipient is in a jurisdiction with strict cold-outreach rules (CAN-SPAM, GDPR, CASL); brand damage if the gag reads as obnoxious to a recipient who is otherwise sympathetic; corporate compliance teams flagging the messages.
  - Mitigations: send from a dedicated subdomain so spam-reputation issues don't contaminate the main referral mail flow; rate-limit aggressively (a few hundred emails/week, not thousands); always personalize at least the first line; include a clear "I did not sign up for this — remove me" link that one-click unsubscribes; never escalate after a recipient has opted out; never assign the same task to multiple competing orgs (they'll compare notes).
  - Public dashboard: `/admin/external-tasks` shows which orgs have been notified, response status, contact-attempt history. Internal-only initially; might become a public "leaderboard of who's helping" later if we're confident the framing won't backfire.
  - Acceptance: a recipient at a partner org reads their cold-outreach email, smiles or at minimum doesn't report it as spam, and the message moves them closer to action (replying, scheduling a call, applying to the pool). Test with three friendly partner-org contacts before any volume.

## Treaty-To-Generic Task System Migration

The task system pretends to be generic but the communication sequences, post-vote share flow, share templates, and parts of the cron/lifecycle layer are bolted to the 1% Treaty. The next non-treaty task family will tear half of this code apart unless it lands behind a data-driven layer first. Confirmed by the 2026-04-25 audit. Phases are ordered so each one unblocks the next; every phase should ship byte-identical treaty output until a second task family flips a `TaskCommunicationTemplate` row to its own copy.

### Phase A — Schema for task-driven communication

> **Completed 2026-04-25** — Migration `20260425220000_task_communication_system` applied. Schema, generated Prisma client, Zod schemas, and application code (DTO + API + MCP + components + seed) all switched to TaskCommunication*. Legacy `Task.contactUrl/Label/Template` flat fields fully removed; replaced by structured `primaryEndpoint` exposed off `TaskCommunicationEndpoint`. `prisma migrate status` clean; `tsc --noEmit` clean; web 790 / agent 96 / db 107 tests green.
>
> **Naming decision (2026-04-25):** `TaskCommunication*` is the honest long-term name because the same task can be contacted by email, in-app, mailto, external URL/form, manual import, or future channels. `TaskComment` stores the text humans and agents read. `TaskCommunication` stores the envelope and status. `EmailLog` stores email-provider details.

- [x] Add `TaskCommunicationTemplate` and `TaskCommunicationVariant` models in `packages/db/prisma/schema.prisma`.
  - `TaskCommunicationTemplate` keyed by `(taskId, audience, purpose)` where `audience` ∈ {`RECIPIENT`, `SENDER`, `OBSERVER`, `ASSIGNEE`} and `purpose` ∈ {`INVITATION`, `ASSIGNMENT`, `REMINDER`, `FOLLOW_UP`, `EVIDENCE_REQUEST`, `STATUS_UPDATE`, `REPLY`, `SCORECARD`, `RE_ENGAGEMENT`, `VOTE_CONFIRMED`, `RECIPIENT_VOTED`, `SHARE`}.
  - `TaskCommunicationVariant` keyed by `(templateId, step, format)` with `subject`, `htmlBody`, `textBody`, `delayDays`, `senderIdentity`, `signature`, `footer`, `unsubscribeScope`, `isActive`, `weight`.
  - Link variants to `ShareAttempt` via the nullable `taskCommunicationVariantId` FK (added in same migration); `ShareAttempt.templateId` (free-form analytics group key) coexists until Phase B engine becomes the sole writer.
  - Seeding deterministic defaults that match current treaty copy verbatim is Phase B work (still pending). Do **not** reuse `TrackingReminder` (health-variable measurement only).
- [x] Add `TaskCommunication` model to own per-recipient/per-endpoint communication state currently overloaded onto `ReferralInvitation`, `Task`, and `Activity`.
  - Fields landed: `taskId`, `taskCommentId`, `endpointId`, `recipientPersonId`, `recipientUserId`, `recipientOrganizationId`, `recipientEmail`, `audience`, `purpose`, `direction`, `channel`, `format`, `step`, `nextSendAt`, `sentAt`, `receivedAt`, `unsubscribeToken`, `templateVariantId`, `shareAttemptId`, `emailLogId`, `referralInvitationId`, `status`, `errorMessage`, `providerMessageId`, `metadataJson`.
  - Status reduced to `DRAFT`, `SENT`, `RECEIVED`, `FAILED`, `CANCELLED`; channel-specific details such as external URL `openedAt` / confirmed `submittedAt` live in `metadataJson` per `docs/TASK_COMMUNICATION_MODEL.md`.
  - **Pending follow-up sub-slice:** migrate these `ReferralInvitation` columns onto `TaskCommunication` and drop them from `ReferralInvitation`: `recipientEmailStep`, `recipientUnsubscribeToken`, `senderReminderStep`, `nextRecipientEmailAt`, `nextSenderReminderAt`, `lastRecipientEmailAt`, `lastSenderReminderAt`, `recipientEmailErrorMessage`, `recipientEmailProviderMessageId`. After backfill `ReferralInvitation` keeps the named-invite lifecycle only — invite token, recipient identity, message format choice, copied/sent state, conversion linkage.
- [x] Replace `Task.contactUrl`, `Task.contactLabel`, and `Task.contactTemplate` with `TaskCommunicationEndpoint`.
  - Schema columns dropped. Seed fills a primary endpoint for the root, treaty, dFDA, AMF, and per-leader signer tasks via `upsertSeedTaskCommunicationEndpoint` (reached through the `createTaskWithImpact` adapter that now takes `primaryEndpoint` directly).
  - **Pending follow-up:** `seed.integration.test.ts` should assert every treaty signer task has parent, assignee, due date, and a primary communication endpoint with label/url/instructions; future recipient/sender `TaskCommunicationTemplate` rows point at tasks with usable endpoints. The integration test currently skips without a DB — re-enable after the migration becomes the standard dev path.

**Phase A follow-ups status (updated 2026-04-25):**

- [x] Seed the `wishonia` system `User` row + add `User.isSystem` boolean. Migration `20260425230000_add_user_is_system` adds the column; `seedWishoniaUser()` sets `isSystem: true` on upsert. Filtering helpers across listings/leaderboards/attribution are still needed where they touch user lists — track per surface as found.
- [x] `packages/db/src/__tests__/seed.integration.test.ts` already includes the endpoint-contract assertion (lines 119-179) — runs whenever a local Postgres `DATABASE_URL` is set; intentionally skips against shared dev DB (Neon) per `assertSafeLocalTestDatabaseUrl` safety. No code change needed.
- [→] **Folded into Phase B:** Migrate `ReferralInvitation` per-recipient send columns (`recipientEmailStep`, `recipientUnsubscribeToken`, `senderReminderStep`, `nextRecipientEmailAt`, `nextSenderReminderAt`, `lastRecipientEmailAt`, `lastSenderReminderAt`, `recipientEmailErrorMessage`, `recipientEmailProviderMessageId`) onto `TaskCommunication` rows. Doing this separately would mean rewriting the same cron twice — the Phase B engine collapse touches the exact same code paths. Track this as Phase B step (6) below.

### Phase B — One generic email-sequence engine

> **Next-session work, scoped 2026-04-25.** Estimate 4-6 hours of focused work. Do NOT bundle with anything else; the parity-proof step requires concentration.
>
> **Plan (in order):**
> 1. Add `packages/web/src/lib/tasks/render-task-communication.server.ts` exporting `renderTaskCommunication({ task, communication, variant, tokens })` returning `{ subject, html, text }`. Pure function; no DB writes.
> 2. Add seed helpers `seedTaskCommunicationTemplate` + `seedTaskCommunicationVariants` invoked from `seedTreatyTasks()` for the five audience/purpose families: A1-A4 recipient invitation (4 steps × 2 formats), B1-B5 sender reminders, B5 monthly scorecard, C1 re-engagement, vote-confirmed, recipient-voted. Transcribe content verbatim from `lib/email/referral-invitation-email-sequence.ts`, `lib/email/referral-email-sequence.ts`, `lib/email/treaty-sender-email-sequence.ts`.
> 3. Add a parity test suite: for each family, render via the legacy builder and via the new engine, assert byte-equal subject/html/text across N seed inputs.
> 4. Migrate the cron callers (`processDueReferralInvitationRecipientEmails`, `processDueReferralInvitationSenderEmails`, `processDueTreatyMonthlyScorecardEmails`, `processDueTreatyNeverSharedReengagementEmails`, treaty vote / recipient-voted handlers) to use the engine. Drop the `referendum.slug === TREATY_REFERENDUM_SLUG` filters in the same change. Rename functions to generic (`processDueTaskRecipientCommunications`, etc.).
> 5. After parity proven and callers migrated, delete `lib/email/referral-invitation-email-sequence.ts`, `lib/email/referral-email-sequence.ts`, `lib/email/treaty-sender-email-sequence.ts`.
> 6. Fold in the deferred Phase A column migration: drop `ReferralInvitation.recipientEmailStep`, `recipientUnsubscribeToken`, `senderReminderStep`, `nextRecipientEmailAt`, `nextSenderReminderAt`, `lastRecipientEmailAt`, `lastSenderReminderAt`, `recipientEmailErrorMessage`, `recipientEmailProviderMessageId` once `TaskCommunication` rows are load-bearing.


- [ ] Collapse the separate builders into one `renderTaskCommunication({ task, communication, variant, tokens })` returning `{ subject, html, text }`. Replaces:
  - `buildReferralSequenceEmail` (`lib/referral-email-sequence.ts`)
  - `buildReferralInvitationRecipientEmail` (`lib/referral-invitation-email-sequence.ts`)
  - `buildTreatyVoteConfirmedEmail`, `buildTreatyRecipientVotedEmail`, `buildTreatySenderReminderEmail`, monthly-scorecard, and re-engagement builders (`lib/treaty-sender-email-sequence.ts`)
- [ ] Move all hardcoded subject pools and body copy into `TaskCommunicationVariant` rows: `SUBJECT_POOL_GENERIC` / `SUBJECT_POOL_PRESIDENT` (`referral-email-sequence.ts:284-304`), recipient subjects (`referral-invitation-email-sequence.ts:80-241`), sender reminder subjects (`treaty-sender-email-sequence.ts:152-254`).
- [ ] Replace `getTreatyParentTaskHref()`, `ROUTES.send`, `ROUTES.dashboard` reads in the email layer with task endpoint / dashboard URL data. The communication engine must not import app-route constants.
- [ ] Drop the `referendum.slug === TREATY_REFERENDUM_SLUG` filters at `treaty-sender-emails.server.ts:455` (re-engagement) and `:569` (monthly scorecard). Replace with a `taskFamily` or `taskId IN (...)` filter so other campaigns can opt in.
- [ ] Rename cron functions: `processDueTreatyMonthlyScorecardEmails` → `processDueTaskScorecardEmails`; `processDueTreatyNeverSharedReengagementEmails` → `processDueTaskReengagementEmails`; `processDueReferralInvitationRecipientEmails` → `processDueTaskRecipientCommunications`; `processDueReferralInvitationSenderEmails` → `processDueTaskSenderCommunications`. Update callers and tests in the same change.
- [ ] After the engine ships, delete `lib/referral-email-sequence.ts`, `lib/referral-invitation-email-sequence.ts`, and `lib/treaty-sender-email-sequence.ts`. With 0 users we skip the previously-planned "merge sequence files first" staging step and collapse straight into the engine.
- [ ] Add `direction: INBOUND` handling — schema-supports inbound replies but no inbound capability exists today. Implementing it is a separate multi-week project requiring DKIM/SPF/DMARC verification, References/In-Reply-To threading, spam filtering, loop prevention, and routing setup with the inbound provider (Resend Inbound / CloudMailin / SES Inbound). Do not surface "task replies via email" until those guardrails exist; manual `INBOUND_MESSAGE` comments via admin tooling are the temporary substitute.

### Phase C — Generic lifecycle, accountability, and cron

- [x] Replace `isTreatySignerTaskKey()` filters at `lib/tasks/overdue-signers.server.ts:64,87` and `lib/tasks/user-president.server.ts:29-44` with predicate filters: `task.dueAt < now && task.assigneePersonId && task.status !== TaskStatus.VERIFIED`. Leader/president highlights then work for any overdue task with an assigned official.
  - `countOverdueSigners()` and `getOverdueSignerHighlights()` now key off overdue assigned-official task data instead of treaty task-key prefixes.
  - Added coverage proving a non-treaty assigned official task can be highlighted.
- [ ] Move treaty-only follow-up calls out of `app/api/referendums/[slug]/vote/route.ts:15-18`. Replace direct calls to `sendTreatyRecipientVotedEmailForInvitation` and `sendTreatyVoteConfirmedEmailForUser` with a generic `onTaskCompletion(task, completionContext)` hook that fans out via the `TaskCommunicationTemplate` rows the task has registered.
- [ ] Rename treaty-prefixed helpers in `lib/treaty-sender-emails.server.ts` (`sendTreaty*ForInvitation`, `sendTreatyVoteConfirmedEmailForUser`) to drop `Treaty` once the generic engine handles them. Delete the file when empty.
- [ ] Drop the hardcoded task-key prefix `program:one-percent-treaty:referral-invitation` (`referral-invitations.server.ts:40`) and the `TREATY_REFERENDUM_SLUG` defaults (`:23`, `:236`, `:286`). Each invitation records `taskId` and (optionally) `referendumId` from the calling context.
- [ ] Generalize the invitation task title/description templates (`referral-invitations.server.ts:155-164`) so they read from task communication endpoint label/instructions instead of "1% Treaty" inline strings.

### Phase D — Component parameterization (template-shaped only)

The principle for this phase: data-drive the components whose variation is *template-shaped* (labels, numbers, URLs swapped per task). Do **not** try to data-drive the post-vote share flow — its variation is *structural* (screen sequence, narrative arc, animations), and JSX-in-JSON is a worse authoring surface than writing a second component when the second campaign actually arrives. Rule of three: one narrative is not enough evidence to extract the abstraction.

**Template-shaped parameterizations (do these):**

- [ ] Make `components/landing/PostVoteReminders.tsx` task-driven: replace `TREATY_DUE_AT` (line 38) with `task.dueAt`; replace `taskTitle: "Sign the 1% Treaty"` (lines 74, 96) and `getTreatyLevelCostOfDelay()` (line 75) with `task.title` and a generic `getTaskCostOfDelay(task, delayDays)`.
- [ ] Decouple `components/dashboard/ReferralInvitationStatusCard.tsx` from treaty parameters: replace the `FLOW_VOTER_LIVES_SAVED_ROUNDED` import (line 9) and the inline math (lines 165, 168) with `task.metrics.perCompletionImpact`. Header "Earth Optimization Tasks" (line 177) and "Inverse Kills Score" (line 184) become `task.metrics.cardTitle` / `task.metrics.impactLabel`.
- [ ] Parameterize `components/landing/ReferralInvitationComposer.tsx`: header "Assign One Earth Optimization Task" (line 239), "vote task" copy (lines 242, 271), and the default `messageFormat` (line 38) all derive from `task.invitationConfig`.
- [ ] Rewrite `app/send/page.tsx`: replace the hardcoded hierarchy "Optimize Earth contains End War and Disease, which contains Ratify the 1% Treaty…" (lines 29-31) with `getTaskAncestors(task.id)` plus a copy template.
- [ ] Replace `const isTreaty = program.id === "1-pct-treaty"` at `app/tasks/page.tsx:83` with a `program.hasDetailedSubtaskView` boolean (or equivalent metadata) on the program record. The branch at lines 84-97 then keys off task data.
- [ ] Keep the Wishonia voice and project-management framing intact through these renames — the goal is to data-drive the copy, not flatten its tone. Seeded `TaskCommunicationVariant` rows for the treaty must read identically to today's hand-written strings.

**Structural — extract primitives, keep narrative as code:**

- [ ] Split `components/landing/TreatyPostVoteShareFlow.tsx` (~1000 lines) into reusable primitives + treaty-specific narrative.
  - Extract reusable, task-agnostic primitives into `components/share-flow/` (or similar): the send-loop subcomponent (much of which already lives in `ReferralInvitationComposer`), the screen-transition / animation wrapper, the depth-hook component, the analytics tracker scaffolding, the feedback step, and the completion → dashboard redirect. These take a `task` prop and don't know anything about the treaty.
  - Leave the screen sequence (`opening`, `stakes`, `nuclear`, `math`, `neat`, `twoHumans`, `perVote`, `sendName` at lines 84-101) and the narrative copy at lines 239-620 (nuclear / wasteful-apocalypses / chain-letter screens) inside `TreatyPostVoteShareFlow.tsx`. They are deliberately campaign-specific persuasion. Do **not** move them to database rows.
  - Replace `manual.warondisease.org` citation URLs (lines 558, 617, 626) with parameter-backed wrappers (`task.helpUrl` if it exists, otherwise leave the literal — these are cite links, not generic).
  - Rename analytics events from `trackTreatyPostVote*` (lines 15-21) to `trackTaskShareFlow*` with a `taskId` dimension *only if* the underlying primitive emits the event. Treaty-specific screen-advanced events stay treaty-named.
  - Acceptance: when campaign #2 needs a post-action share flow, the engineer writes a sibling component (e.g., `Campaign2PostActionFlow.tsx`) that imports the same primitives — not a JSON config. If that authoring experience is cleaner than today, the split worked.

### Phase E — Share template data layer (motivation: editability + A/B testing, not cross-campaign reuse)

The honest reason to move share templates into a data layer is **so non-engineers can edit copy and so the replication-coefficient analytics in "Task Reminder Replication System" can A/B test variants**. It is *not* "campaign #2 will reuse the treaty's templates" — campaign #2 will author its own templates from scratch, just as the treaty did. The shared infrastructure is the engine and the schema, not the copy.

- [ ] Migrate the 17+ share-template variants at `lib/tasks/share-templates.ts:85-380` into `TaskCommunicationVariant` rows under `audience=OBSERVER` / `purpose=SHARE`. Each variant carries its own token list and copy. Wins: ops can edit copy without a deploy, and the analytics layer can score variants by replication coefficient.
- [ ] Replace treaty-specific token names (`eradication_years_treaty`, `treaty_url`, `treaty_hale_gain`, etc. at `share-templates.ts:35-49`) with a small generic registry that resolves tokens from `task.contextJson` plus a few standard names (`{taskUrl}`, `{leaderName}`, `{daysOverdue}`, `{impactLabel}`, `{impactValue}`). The treaty stays the only campaign with `eradication_years` until a second campaign actually needs it.
- [ ] Expose the `lib/treaty-share-flow-parameters.ts` outputs through task communication template metadata instead of compile-time imports. Once nothing imports the file directly, shrink it to a seed script that populates the treaty's `TaskCommunicationTemplate` row (don't delete; the seed *is* the canonical treaty config).

### Sequencing notes

- Phases A and B can ship together as one cutover: introduce schema + engine, migrate treaty copy verbatim, switch callers, delete dead builders. No user-visible change.
- Phase C is mechanical (renames + filter swaps); land in the same PR or immediately after.
- Phase D is the largest visible change — hold until A/B/C are stable. The template-shaped parameterizations are the priority; the share-flow primitive split is a follow-up that's only worth doing once a second narrative is on the horizon (resist doing it speculatively).
- Phase E (template content + token registry) lands last and is justified by editability + A/B testing, not by hypothetical campaign reuse.

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
- [ ] Site-wide voice + framing audit: commit to "you are a project manager / employee of Earth Optimization Services" as the dominant user-facing metaphor.
  - Inventory every user-facing string (landing, `/send`, dashboard cards, task detail pages, all email subjects + bodies, error messages, empty states, tooltips, button labels, modal copy) and check that it reads consistently as PMO bureaucracy applied to civilizational tasks. The user is a project manager; humanity is the workforce; Wishonia is the disappointed senior auditor.
  - Reject the parallel "Earth Optimization Commission" framing as a user role — it dilutes the deadpan PMO joke and doesn't match the data model (recruit, assign, complete tasks). Reserve "Commission" only for Wishonia narrator asides ("the Commission has reviewed humanity's performance and noted some concerns") so it stays a one-line gag from above, not a competing user identity.
  - Surfaces that should explicitly carry the PMO frame: post-vote share flow, `/send`, dashboard task card, email task-notification format, monthly scorecard, task detail pages, leaderboards, badges, impact/reward ledger.
  - Surfaces that should NOT carry the frame: input labels, validation errors, sign-in buttons, and ordinary action buttons where the joke would hurt clarity. Default to plain language there.
  - Tie back to existing voice rules: deadpan, data-first, short sentences, sardonic, Wishonia voice (CLAUDE.md). The PMO frame is the *vehicle* for the voice, not a replacement for it.
  - Acceptance: a reviewer reading any 5 random user-facing strings cold can correctly identify the site's voice + role-frame within one read; no string accidentally calls the user a "commissioner", "member", or "delegate."
  - **Canonical company name**: "Earth Optimization Services" (EOS). Do not churn. "Bureau" / "Authority" / "Co." considered and rejected — EOS keeps the deadpan-vendor register that "Services" implies (someone hired them; nobody on Earth did; Wishonia self-appointed).
  - **"8 billion direct reports" as gap-stat moments, not a repeated frame.** The funny version is the *gap* between potential and onboarded, not the raw number. Use sparingly — onboarding line, dashboard subtitle, email footer signature. Examples:
    - Onboarding: *"Welcome. You have been promoted to project manager. Your initial assigned headcount is 8 billion. Currently onboarded: 0. The Commission has noted this."*
    - Dashboard subtitle: *"Direct reports onboarded: {n} of 8 billion. Performance review pending."*
    - Email footer: *"Project Manager, Earth Optimization Services. Reporting hierarchy: 8,000,000,000 humans, {n} confirmed."*
  - **Urgency framed as elapsed-time + treaty deadline, never as competitive scarcity.** Reject "hurry before another peer claims them" copy — it sounds like Black Friday and breaks the deadpan voice. Use deadline-driven and elapsed-time-driven copy instead. Examples:
    - *"Time elapsed since your appointment: {n} days. Direct reports onboarded: {m}. The treaty deadline does not adjust for your schedule."*
    - *"Each potential direct report is also a potential direct report for every other project manager. Coordination is the bottleneck. Always has been."*
  - **Surface the named-invite scarcity mechanic as a fact, not a sales pitch.** On `/send`: *"Note: each human can only be the named direct report of one project manager per task. If a peer onboards them first, you can still credit them via your generic referral link, but they won't appear in your direct reports panel."* Honest mechanic, no hype.
- [ ] Write the canonical "yes-this-is-MLM-and-here's-why-that's-fine" explainer page.
  - Lead with the chain-letter analogy already in the post-vote flow: same structural mechanism, inverted ethics. Original chain letters lied about both the curse (no real bad luck) and the reward (no real money); this one tells the truth about both (preventable disease deaths continue every day the chain breaks; eradicating disease compounds prosperity globally). The MLM comparison is the same move applied to recruitment compensation.
  - Explicit table-of-inversions to include in the page: structure identical (recruit → downline → compounding); economics inverted (value flows out to humanity, not up to top of pyramid); no buy-in; recruitment IS the product (every vote matters, no Trojan-horse soap); math is parameter-backed and citable, not aspirational fiction.
  - Wishonia voice: deadpan, own the comparison, frame the inversion as *governance, not marketing*. Sample copy: *"On Earth, this structure is currently classified as 'multi-level marketing.' On my planet we called it 'governance.' The Commission is comfortable with the comparison."*
  - Lead the page with the *inversion*, not the *admission* — most readers don't know what MLM technically means; they just know "scam." Headline frames the chain-letter-with-true-curse first; the MLM comparison is named in the body where it can be immediately inverted.
  - Land before launch + before any on-chain payout copy goes live. Pair with a legal review (SEC/FTC posture) — the decay-attribution model + no buy-in + transparent accounting is what keeps this on the right side of MLM-fraud thresholds.
  - Test with a hostile reader: someone who already thinks the project is sketchy. If after reading they still think "this is an MLM scam," rewrite. If they think "this is an MLM but actually defensible," ship it.
  - Surfaces that should link to the explainer: `/send`, post-vote share flow ("why does my recruit's recruit count?"), reward/impact dashboard, FAQ, footer.
  - Pair with the decay-attribution commitment in **Impact Dollars, Points, And Rewards** — the explainer doesn't work if the underlying math isn't actually defensible.

## Impact Dollars, Points, And Rewards

- [ ] **IN PROGRESS:** Make the launch reward/accounting decision before adding users or making payout promises.
  - Current leaning after 2026-04-25 MCP PRD feedback: task ranking, MCP economics, and impact accounting should be denominated in USD, not invented units.
  - Use `STANDARD_ECONOMIC_QALY_VALUE_USD` (`$150K/QALY`) as the canonical health-to-dollar conversion. Median after-tax inflation-adjusted income gains are already dollar-denominated.
  - Do not create a public **Earth Optimization Points** (`EOP`) unit unless there is a real reward/viral/product reason that dollars cannot handle. If EOP survives, it is a display/reward-credit label backed by impact USD components, not a separate optimization unit.
  - Treat current "VOTE Points" as the narrow treaty/referral reward label until the decision is made, not a separate long-term unit.
  - Treat current in-app `WishPoint` grants as temporary engagement rewards; either migrate them into dollar-backed contribution credit with honest expected-impact amounts or hide/deprecate them before launch.
  - Keep on-chain `$WISH` / `packages/treasury-wish` conceptually separate unless the whole monetary-system story is intentionally productized; do not use "wishes" for impact payout claims.
  - Public donation copy must not promise EOP/VOTE payouts or prize-pool distributions until the ledger and legal structure are final. Use conditional, model-based impact language instead: donations fund the global referendum/survey infrastructure and public education; if the $1B campaign works, current parameters imply about 10.7 modeled deaths averted and about 220 years of suffering prevented per campaign dollar. At the 1% success probability used by the model, that is about 2.2 expected years of suffering prevented per campaign dollar.
- [ ] Define impact-dollar accounting from the Optimitron objective function.
  - Public wording: contribution credit measures expected contribution to maximizing median healthy life years and median after-tax inflation-adjusted income.
  - Accounting unit: `impactUsd`, where QALY / DALY health gains are converted through `STANDARD_ECONOMIC_QALY_VALUE_USD` and income gains are counted as real after-tax income dollars.
  - If a point label survives, publish the exact conversion from `impactUsd` to public points before showing balances.
  - For income improvements, use gains to ordinary humans near the median or modeled distributional gains, not billionaire wealth or raw GDP.
  - Keep health-impact USD and income-impact USD as separately stored components even if the UI shows a single total.
- [ ] Define reward-credit lifecycle and attribution before schema changes.
  - Statuses: `PENDING`, `CONFIRMED`, `REJECTED`, `REVERSED`, and optionally `PAID`.
  - Store `grossImpactUsd`, `rewardImpactUsd`, `healthImpactUsd`, `incomeImpactUsd`, optional `displayPoints`, `confidence`, `attributionRule`, `sourceModelVersion`, and links to task/vote/referral/deposit evidence.
  - Do not double-count for payout: if voter, inviter, task assigner, and task completer all contributed, split a single modeled reward amount by an explicit attribution rule.
  - For treaty launch, start with deterministic rules for verified vote tasks: voter/completer share, inviter/project-manager share, plus a capped, decaying upstream share (see decay-attribution commitment below).
  - Keep "pending impact" separate from payout-eligible confirmed reward credit.
- [ ] Commit to a downstream-attribution rule for reward credit before launch.
  - Direct recruit = 100% credit. Depth-2 (recruit-of-recruit) = 50%. Depth-3 = 25%. Hard cap at depth 4 or 5 (decide before launch and write the cap into the rule itself, not as runtime config).
  - Decay rationale: each downstream layer would have voted at some non-zero rate without the upstream recruiter, so partial credit reflects partial causation. Uncapped uniform credit would (a) inflate total reward credit beyond modeled impact and (b) make the system structurally indistinguishable from a pyramid scheme.
  - Display in dashboard as a transparent subtree breakdown ("3 direct + 7 indirect (depth 2, 50% weight) + 4 indirect (depth 3, 25% weight) = $X modeled contribution credit" or the final point-label equivalent), not as an "earn from your downline" hook.
  - Do NOT frame downstream credit as competitive urgency in user-facing copy. Treaty deadline is the urgency lever; downstream credit is causal accounting.
  - Surface the named-invite-claim mechanic on `/send` as a fact, not a hype line (see Copy And Framing Audit).
  - MLM-optics review before launch: the decay caps + no-buy-in + transparent accounting + value-flowing-outward are the structural defenses against being mistaken for or classified as multi-level-marketing fraud. Pair this commitment with the canonical MLM-explainer page in **Copy And Framing Audit** — the math has to be defensible *and* explained, in that order.
  - Acceptance: write the page that explains the math. Have someone hostile read it. If they think "this is a pyramid scheme," fix the math, not just the copy.
- [ ] Rename and simplify public product language after the accounting decision.
  - Replace `POINT_NAME = "VOTE"` only after the reward model is defined.
  - Do not rename public "VOTE Points" surfaces to EOP by default; first decide whether the product should show impact dollars, contribution credits, or a short point label.
  - Use "You have been hired by Earth Optimization Services as a project manager" as campaign copy, not legal/employment semantics.
  - Do not rename `ReferralInvitation` to `EmploymentNotification`; keep `ReferralInvitation` as the internal invite-token lifecycle model and use "task assignment" / "employment notification" only where it improves user-facing copy.
- [ ] Plan the schema migration as a separate architecture slice.
  - Candidate replacement for `WishPoint`: `ContributionCreditLedger`, `ImpactCreditLedger`, or similar dollar-backed ledger.
  - Candidate replacement for `VoteTokenMint`: generalized reward-credit mint only if on-chain payout claims generalize beyond votes.
  - Preserve old rows with a reviewable migration; no destructive reset.
  - Add reporting tests that prove the same action cannot mint duplicate payout-eligible reward credit.

## Donations And Crowdfunding

### Funding architecture (decided 2026-04-25)

The Earth Optimization Prize / treaty funding ecosystem ships as a four-track architecture, each track serving a distinct audience and risk profile, all funneling into a single verified contribution-credit / `impactUsd`-proportional distribution pool on success. See **Impact Dollars, Points, And Rewards** for the earning formula and decay-attribution rules; see **Copy And Framing Audit** for the MLM-explainer page that must accompany Track 3 / Track 4 launch.

| Track | Vehicle | Audience | Allocation control | Status |
|---|---|---|---|---|
| 1 | IAM tax-deductible donations (Stripe → 501(c)(3)) | Traditional donors | Charity grants, no allocation choice | Phase 1 — can ship near-term |
| 2 | Conservative DAC — existing `/prize` (Aave yield) | Anyone with USDC, no KYC | DeFi protocol, fixed yield | Already partially built |
| 3 | **Earth Optimization Coordination Platform** (Wefunder partnership, retail Reg CF / Reg A+) | Mission-aligned retail (no accreditation) | Depositor preference via Wishocracy pairwise comparisons, **binding** | Phase 1.5 — design now, ship after generic-task migration Phase A lands |
| 4 | DAO-governed tokenized fund (Innovation Exemption sandbox) | Retail post-Innovation-Exemption | On-chain Wishocracy governance, expanded universe beyond Reg CF caps | Phase 2 (12-36 months) |

Allocation rules across all tracks: 100% innovation (no Treasuries / no broad index funds). Aggressive sleeves (Track 3, Track 4) target 17%+ but make no fixed-bonus guarantee — refund on miss is NAV-at-maturity, not principal-plus-bonus. Donations and DAC deposits do **not** mint payout-eligible reward credit by default; treaty voting + recruitment can only mint after the launch accounting rule is finalized.

### Track 1 — IAM donation flow

- [ ] `/donate` route — Stripe checkout → IAM 501(c)(3) → audited grant to disease eradication / treaty advocacy. Donor's referrer earns attribution metadata, not payout-eligible reward credit by default.
- [ ] `/donate/success` confirmation page with receipt + thank-you copy in Wishonia voice.
- [ ] `lib/stripe.ts` adapter, `app/api/stripe/{create-checkout,session,webhook}/route.ts` — port DIH structure but route to IAM.
- [ ] One-time + recurring monthly support via Stripe subscriptions.
- [ ] Source-URL / referrer / invite-token attribution captured on checkout.
- [ ] Email receipt via Resend (transactional scope, no unsubscribe headers).
- [ ] Webhook idempotency tests; refund/failure handling; tax receipt generation.
- [ ] Compliance: confirm IAM 501(c)(3) status; donor record retention.
- [ ] Dashboard activity entry for donor (no reward-credit mint, but visible "you donated $X to IAM" line).

### Track 2 — Conservative DAC (existing `/prize`)

- [ ] Audit existing `/prize` copy against the four-track architecture; ensure it doesn't claim to be the only path or imply the depositor controls allocation.
- [ ] Cross-link the MLM-explainer page from `/prize` so Aave-DAC depositors land in the same explanation.
- [ ] Confirm `packages/treasury-prize` contracts can handle verified contribution-credit / `impactUsd`-proportional distribution at maturity, not just VOTE-proportional. Distribution must be the same end-pool regardless of which track fed it.

### Track 3 — Earth Optimization Coordination Platform

**Architecture summary:** Wefunder is the registered funding portal (regulatory wrapper); Optimitron is the curation + preference-aggregation layer. Each depositor's commitment routes through Wefunder into individual direct equity stakes in pool companies, weighted by aggregated Wishocracy preferences. No pooled fund; no investment adviser. Reg CF caps ($5M/company/year) and Reg A+ Tier 2 ($75M) constrain the universe — fine for the thesis since most early-stage longevity / fusion / drug-discovery / synthetic-bio companies fit.

**Pages to build:**
- [ ] `/fund` — landing for the Coordination Platform; explains the model, the math, the listing standards, the chain-letter / MLM analogy. Wishonia voice.
- [ ] `/fund/companies` — pool listing with filters (sector, raise size, mission-fit score) + entry to the pairwise ranking UI.
- [ ] `/fund/companies/[slug]` — individual company detail; parameter-backed welfare-function impact projection; Reg CF / Reg A+ disclosures pulled from Wefunder.
- [ ] `/fund/companies/apply` — application form for companies seeking pool inclusion. Captures entity type, mission alignment, current raise stage, intended use of funds, modeled impact on welfare function (HALE / median income).
- [ ] `/fund/rank` — Wishocracy pairwise UI for companies in the pool. One-person-one-vote, pairwise sampling, eigenvector aggregation, live weight display. Analogous to the existing `/wishocracy` allocation surface but scoped to the fund pool.
- [ ] `/fund/commit` — subscription commit flow; depositor specifies amount + cadence (one-time or recurring); handoff to Wefunder for execution against live preference weights.
- [ ] `/fund/portfolio` — depositor's holdings (aggregated across individual stakes), reward credit if any, contribution to the welfare function.
- [ ] `/fund/explainer` — canonical "yes-this-is-MLM-and-here's-why-that's-fine" page (see **Copy And Framing Audit**). Tracks 3 and 4 both link here.
- [ ] `/admin/fund/companies` — internal admin: review applications, approve/reject, edit listing-standards compliance, monitor mission-fit scores, retire companies that complete their raises.

**Features to build:**
- [ ] Wefunder partnership API integration: deal feed (curated companies they host), per-depositor investment routing, KYC handoff, transaction status. Confirm whether one commit can route across N pool companies in one transaction.
- [ ] Listing-standards system: published inclusion criteria, application review workflow, mission-fit scoring against the welfare function, rejection reasons, appeal path.
- [ ] Pool company state machine: `APPLIED` → `UNDER_REVIEW` → `APPROVED` / `REJECTED` → `ACTIVE` → `RAISE_CLOSED` → `RETIRED`. Each transition emits an audit-loggable event.
- [ ] Wishocracy pair-ranking adapter for companies: extends existing RAPPA implementation with company-pool scope, one-person-one-vote, weight caps (single-company max ~15-20%, single-sleeve max ~35%) to prevent runaway concentration.
- [ ] Subscription commit flow: depositor pre-authorizes $X over Y period; system distributes against live weights at each disbursement window.
- [ ] Portfolio aggregation view: pulls individual stakes from Wefunder, computes weighted exposure per sleeve, shows modeled welfare-function contribution.
- [ ] Per-company welfare-function impact projection: generalize the `lib/treaty-share-flow-parameters` helpers into a per-company impact module.
- [ ] Liquidity / secondary-market integration via StartEngine secondary or Wefunder's equivalent (nice-to-have, not blocking).

**Compliance / legal (engage securities counsel before any of this ships):**
- [ ] Securities counsel engagement.
- [ ] Wefunder partnership term sheet + master services agreement.
- [ ] Listing-standards documentation reviewed by counsel (anti-discrimination, fair access, conflict-of-interest disclosures).
- [ ] MLM-explainer page legal review (counsel reads, hostile reader reads, both sign off).
- [ ] Trademark filings: "Earth Optimization Services," "Earth Optimization Fund"; add "Earth Optimization Points" / "EOP" only if the point label survives the accounting decision.
- [ ] IAM 501(c)(3) status confirmation for Track 1.
- [ ] Privacy policy + ToS updates covering the funding platform, KYC handoff, and shared data with Wefunder.
- [ ] State blue-sky compliance check.

**Outreach / partnerships:**
- [ ] Wefunder BD outreach. Lead message: curated mission-aligned company pool + Wishocracy retail preference-aggregation = a new product category sitting on top of their infrastructure.
- [ ] Backup paths if Wefunder declines: StartEngine (has secondary market) → Republic.
- [ ] Curated-company outreach: longevity biotech (Altos, NewLimit, Retro), drug discovery AI (Recursion, Insitro), fusion (Commonwealth, Helion, TAE), synthetic-bio (Ginkgo, Asimov), robotics, frontier energy. Many already file under Reg CF / Reg A+; we're aggregating + ranking, not displacing.
- [ ] Securities law firm engagement (priority: firms with active Reg CF + DAO experience).
- [ ] SEC Innovation Exemption tracking: monitor publication; when binding rule lands, evaluate path to Track 4 launch.

### Track 4 — DAO-governed tokenized fund (Phase 2)

- [ ] Architecture not designed yet; depends on Innovation Exemption finalized rule.
- [ ] When Innovation Exemption is binding, evaluate: token-bound governance, on-chain Wishocracy execution, expanded universe beyond Reg CF caps, retail access without funding-portal partnership.
- [ ] Write Track-4 architecture spec only after Track 3 has shipped + 6 months of preference-aggregation data is collected. Speculative design now is wasted work.

### Reference: DIH donation/crowdfunding source files (for porting patterns where useful)

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
- [x] Decide whether treaty funding should be a Stripe donation flow, a DIH-style crowdfunding campaign, an Earth Optimization Prize deposit path, or an IAB path.
  - **Decided 2026-04-25:** four-track architecture (see "Funding architecture" section above). Stripe → IAM (Track 1), existing Aave-DAC `/prize` (Track 2), Wefunder-coordinated Wishocracy-allocated pool (Track 3), and Innovation-Exemption DAO (Track 4 / Phase 2). Not "or" — all four, each serving a different audience, all funneling into one verified contribution-credit / `impactUsd`-proportional distribution pool.
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
  - [x] verified vote -> post-vote flow (`packages/web/e2e/post-vote-share-flow.spec.ts`);
  - [x] copy-only invite (`packages/web/e2e/post-vote-share-flow.spec.ts`);
  - [x] emailed invite (`packages/web/e2e/email-invite.spec.ts`);
  - [x] recipient invite conversion (`packages/web/e2e/invite-token-attribution.spec.ts`);
  - [x] dashboard pending/confirmed update (`packages/web/e2e/invite-token-attribution.spec.ts`);
  - [x] partner/demo lite mode (`packages/web/e2e/lite-mode-guard.spec.ts`).
- [ ] Use focused checks before each local commit; keep full `pnpm check` green before push or after substantial cross-package/schema changes.
  - Default web loop: `pnpm --filter @optimitron/web run typecheck` plus the focused Vitest/Playwright files touched by the change.
  - Docs/TODO-only edits do not need the full monorepo gate.
- [ ] Keep `pnpm --filter @optimitron/web run e2e -- smoke --reporter=list` green after UI/routing changes.
- [ ] Keep `pnpm --filter @optimitron/db exec prisma migrate status --schema prisma/schema.prisma` current before testing dashboard/API features against the configured DB.
- [ ] Clean up existing lint warnings only in a separate, focused pass.
- [ ] Do a final copy audit before launch: visible post-vote UI, generated invite copy, email templates, dashboard labels, and task rows.
