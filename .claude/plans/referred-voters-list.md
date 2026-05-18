# Plan: Humanity Manager Status Report (replaces "Referred Voters List")

## Brief

Original direction: build a "list of humans who voted via my referral link" on /dashboard. Phase 1 CEO review (Codex + Claude subagent, both independent) converged on SCRAP_AND_REPLACE. Mike pivot with "use your best judgment": ship the FULL Humanity Manager Status Report from TODO.md:399-411 instead — TWO cards, not one.

Card 1 (the propagation lever): **"Humans waiting on your reminder."** Lists invitations Mike sent (or referral clicks his link generated) where the recipient hasn't voted yet. Each row has a copyable reminder text sourced from `share-templates.ts`. This is the recruitment-action surface the campaign was missing.

Card 2 (the celebration / answer-Mike's-original-question): **"Humans you recruited."** Lists humans who actually VOTED YES on the treaty via Mike's referral link. Concrete names + faces (when public) of the chain doubling.

Mike originally asked "I thought we previously made it possible to see all the people that voted with our links" — confirmed via investigation we only have a count today. This plan ships the list AND the more-load-bearing reminder action that BOTH Phase 1 reviewers said was the actual K-factor lever.

Voice: "reminder," never "nudge" (Mike directive, see memory [[feedback_reminder_not_nudge]]). CLAUDE.md's "remind your overdue presidents/employees" frame extends to voter reminders.

## Current state — ASCII diagram

```text
┌─────────────────────────────────────────────────────────────────────┐
│                          /dashboard                                  │
│                                                                      │
│  ┌────────────────────────┐    ┌────────────────────────┐           │
│  │    YOUR PROFILE        │    │  REFERRAL LINK         │           │
│  │  ProfileCard.tsx       │    │  count: 12  ←── ABSTRACT│           │
│  └────────────────────────┘    └────────────────────────┘           │
│                                                                      │
│  ┌────────────────────────┐                                          │
│  │ Other cards            │  GAP: no reminder action surface         │
│  │ ...                    │  GAP: no list of WHO voted via my link   │
│  └────────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘

Data layer (already ships):
  ReferendumVote { userId, referendumId, answer (VotePosition), referredByUserId, ... }
    ← source of truth for "voted via my link" — Codex critique caught this
  ReferralInvitation { referrerUserId, recipientPersonId, convertedVoteId, ... }
    ← source of truth for "invited but not yet voted"
  ReferralClick { code, referrerUserId, shareAttemptId, createdAt, ... }
    ← secondary: clicks on my link (some convert, some don't)
  ShareAttempt { ... }
    ← copy/send events keyed to referrer
  Referral { userId, referredByUserId, answer (ReferralAnswer), ... }
    ← legacy: signup-flow attribution (NOT vote attribution). Skip for celebration card.

Existing helpers:
  getReferralCount(userId) → integer
  getReferralCountsByUserIds(userIds[]) → Map<userId, count>
  share-templates.ts — canonical reminder copy registry
```

## Proposed state — ASCII diagram

```text
┌──────────────────────────────────────────────────────────────────────┐
│                          /dashboard                                   │
│                                                                       │
│  ┌────────────────────────┐    ┌─────────────────────────┐           │
│  │    YOUR PROFILE        │    │  REFERRAL LINK + count   │           │
│  │  ProfileCard.tsx       │    │  (unchanged)             │           │
│  └────────────────────────┘    └─────────────────────────┘           │
│                                                                       │
│  ┌─────────────────────────────────────────────────────┐             │
│  │  HUMANS WAITING ON YOUR REMINDER          🔔 NEW     │  Card 1     │
│  │ ┌─────────────────────────────────────────────────┐ │             │
│  │ │ 👤 Sarah (invited 4d ago, hasn't voted)         │ │             │
│  │ │   [📋 Copy reminder text]  [✉ Send]              │ │             │
│  │ ├─────────────────────────────────────────────────┤ │             │
│  │ │ 👤 +47 anonymous clicks (no name captured)      │ │             │
│  │ │   [📋 Copy generic reminder]                     │ │             │
│  │ └─────────────────────────────────────────────────┘ │             │
│  │ [Show more]                                          │             │
│  └─────────────────────────────────────────────────────┘             │
│                                                                       │
│  ┌─────────────────────────────────────────────────────┐             │
│  │  HUMANS YOU RECRUITED                     🎉 NEW     │  Card 2     │
│  │ ┌─────────────────────────────────────────────────┐ │             │
│  │ │ 🟢 Alice Chen "data scientist"                  │ │             │
│  │ │   voted 3 days ago · recruited 2 more humans    │ │             │
│  │ ├─────────────────────────────────────────────────┤ │             │
│  │ │ 👤 Anonymous Humanity Manager                    │ │             │
│  │ │   voted 1 week ago                              │ │             │
│  │ └─────────────────────────────────────────────────┘ │             │
│  │ [Show more] [Share your link again →]                │             │
│  └─────────────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────┘

Data flow:
  Card 1: getOverdueReferralInvitations(userId, { limit })
    → ReferralInvitation where referrerUserId=userId AND convertedVoteId IS NULL
    → joins recipientPersonId for displayName when available
    → ALSO: bucket of unnamed ReferralClicks (count only, generic reminder)
    → returns rows with status="pending" + copyable reminder text key

  Card 2: getReferredVoters(userId, { limit, cursor })
    → ReferendumVote where referredByUserId=userId
        AND referendumId = TREATY_REFERENDUM_ID
        AND answer = VotePosition.YES
    → joins userId.person
    → batched: getReferralCountsByUserIds(...) for downstream-count badges
    → privacy: when person.isPublic=false, redact identity fields
    → returns: [{ voteId, votedAt, person: {…or anonymized}, downstreamCount }]

  <HumanityManagerStatusReport overdue={...} recruited={...} />
    → renders two cards in priority order (reminder card FIRST, celebration second)
    → copy buttons use share-templates.ts (canonical registry, no new copy)
    → "reminder" verb throughout (per [[feedback_reminder_not_nudge]])
```

## Phase 2 pivot (Mike approved C)

After Phase 2 design dual voices: existing `ReferralInvitationStatusCard.tsx` already does 70% of the proposed reminder card. EXTEND it + rename to "Humanity Manager Status Report" instead of building a new component. Cuts diff from ~500 LOC to ~150 LOC. Reuses status chips, filter UI, Inverse Kills Score, treaty styling.

## Step list

- [ ] **Extend** `packages/web/src/components/dashboard/ReferralInvitationStatusCard.tsx`:
  - Rename component + heading: "Earth Optimization Tasks" → "Humanity Manager Status Report"
  - Rename file to `HumanityManagerStatusReport.tsx` (keep export so any other consumers can be migrated)
  - Remove `if (isLoading || invitations.length === 0) return null;` — render start-the-chain CTA + share link inline when empty
  - Add anonymous-clicks aggregate row (one "+N humans clicked but didn't register" line, no per-click controls)
  - Add celebration section: `ReferendumVote.referredByUserId` rows NOT already represented by a `ReferralInvitation` (anonymous votes from raw referral URL)
  - Add row-level "Copy reminder" affordance using `packages/web/src/lib/tasks/share-templates.ts` keys (correct path per Codex Phase 2 critique)
  - Aggregate private/anonymous voters into a single "+N private" line at the bottom of the celebration section (don't render inline "Anonymous Humanity Manager" rows — Phase 2 reviewer consensus)
- [ ] Add `getReferredVoters(userId, opts)` in `referral.server.ts` querying `ReferendumVote where referredByUserId=userId AND referendumId=TREATY_REFERENDUM_ID AND answer=VotePosition.YES` with privacy redaction.
- [ ] Add `getAnonymousReferralClickCount(userId)` — count `ReferralClick` rows where referrer=userId minus those with corresponding `ReferralInvitation` or `ReferendumVote`. Single integer, no row data.
- [ ] Extend the `/api/referral-invitations` route (or add a sibling) to return celebration data + anonymous count alongside the existing invitation list. OR fetch all three server-side in `dashboard/page.tsx`.
- [ ] Wire into `dashboard/page.tsx` — pass new data into the renamed component.
- [ ] Card-level error boundaries (per Phase 2 reviewers): if celebration query fails, reminder section still renders, and vice versa.
- [ ] Mobile layout: stacked row interior, full-width 44px Copy button below sm breakpoint (per Phase 2 reviewers).
- [ ] Drop NEW emoji badges (`🔔 NEW` / `🎉 NEW`) — off-voice for treaty surfaces (per Phase 2 reviewers).
- [ ] Send button: DEFER. Phase 2 reviewers split (Codex: define channel matrix; Claude subagent: drop). Default to Copy-only for v1 — single affordance per row, predictable across devices. Add channel-specific Send in a follow-up PR if data shows demand.
- [ ] Unit tests: `getReferredVoters` (treaty-referendum filter, YES filter, privacy redaction), `getAnonymousReferralClickCount` (excludes converted rows), new empty-state rendering.
- [ ] Integration test: dashboard renders combined card with seeded fixtures (mix of converted invitations, raw-link votes, private profiles, anonymous clicks).
- [ ] Run `pnpm --filter @optimitron/web exec tsc --noEmit` clean.
- [ ] Regenerate `/dashboard/page.logged-in.md`.

## Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | **Privacy default = false.** Most rendered rows in card 2 will show "Anonymous." Reviewers flagged this as feature-gutting. | HIGH | Frame the empty/anonymized state as part of the value: "Most voters keep their identity private — that's normal. Each anonymized row is still a real human you recruited." Defer vote-time consent prompt to follow-up PR (not blocking). |
| 2 | **No K-factor instrumentation yet (TODO #34).** Without it, can't measure if this feature moves the needle. | HIGH | Track #34 as separate follow-up PR. Leading metric we CAN measure today: `ShareAttempt` count per user in 7 days after first dashboard view. If reminder-card click → copy-reminder → ShareAttempt count rises, the feature is working. |
| 3 | **Data source pitfall (now fixed in this plan).** Codex caught: `Referral.answer=YES` ≠ vote. Use `ReferendumVote.referredByUserId` for celebration card; `ReferralInvitation.convertedVoteId IS NULL` for reminder card. | RESOLVED | Schema verified 2026-05-17: ReferendumVote line 4278 confirms `referredByUserId`. |
| 4 | **Reminder card requires sufficient invitation data.** If users haven't been creating `ReferralInvitation` rows (vs raw share links), the reminder card stays empty. | MEDIUM | Verify in code: which user actions create ReferralInvitation rows? If it's only the assignTask flow on /people/[id], reminder card has limited audience. May need to backfill from ReferralClick rows where referrer is known but click didn't convert. |
| 5 | **Privacy leak via the anonymous-clicks bucket.** Showing "+47 anonymous clicks" could leak click-count to attackers timing-attacking the referrer's audience. | LOW | Round down to nearest 5 ("+45 humans clicked"); rate-limit if dashboard is publicly accessible (it shouldn't be — it's the authed dashboard). |
| 6 | **`share-templates.ts` reminder copy might not exist for this surface.** | MEDIUM | Verify the registry has a "reminder to overdue invited voter" template before building. If absent, add it as the FIRST commit of the PR; don't fork the registry. |

## Files to touch

| Path | Why |
|------|-----|
| `packages/web/src/lib/referral.server.ts` | Add `getReferredVoters()` + `getOverdueReferralInvitations()` |
| `packages/web/src/lib/__tests__/referral.server.test.ts` | Tests (create if absent) |
| `packages/web/src/components/dashboard/HumanityManagerStatusReport.tsx` | NEW |
| `packages/web/src/lib/share-templates.ts` | Possibly: add reminder-to-overdue-invitee template if absent |
| `packages/web/src/app/dashboard/page.tsx` | Wire fetch + render |
| `packages/web/src/app/dashboard/page.logged-in.md` | Regenerated snapshot |
| `packages/web/src/types/dashboard.ts` | Types for client/server boundary |

Estimated diff: ~400-500 lines (two server functions, one component with two cards, tests, dashboard wiring, possibly one share-template addition). No schema changes.

## Out of scope (defer)

- Vote-time consent prompt for name visibility (follow-up PR; could unlock anonymized rows but isn't blocking ship).
- K-factor instrumentation (TODO #34, separate PR right after).
- Multi-level descendant tree.
- Upstream chain "you were recruited by X" — Codex flagged as potentially higher-leverage; defer to its own plan after this ships.
- Notification / digest email for downstream events — defer; can ride the same data once these queries exist.
- CSV export / share screenshot.

## Research log

Repo-internal provenance verified before drafting (file:line refs):

- `packages/db/prisma/schema.prisma:3487` — `Referral` model: signup-flow attribution, NOT vote attribution. Schema comment explicit: "Whether the user opted into the referral/signup flow."
- `packages/db/prisma/schema.prisma:4278` — `ReferendumVote.referredByUserId` is the source of truth for "voted via my link." Includes `voteSource` (SELF vs represented).
- `packages/db/prisma/schema.prisma:3568` — `ReferralInvitation.convertedVoteId String? @unique` — null when invitation sent but no vote yet. The reminder-card data source.
- `packages/db/prisma/schema.prisma:3526` — `ReferralClick.referrerUserId` — clicks on link where referrer is resolvable but no invitation/vote row exists. Anonymous bucket data.
- `packages/web/src/lib/referral.server.ts:44` — `getReferralCount` exists, integer only.
- `packages/web/src/lib/referral.server.ts:108` — `getReferralCountsByUserIds` reusable for downstream-count badges.
- `packages/web/src/lib/share-templates.ts` — canonical reminder copy registry. Per Codex critique: must NOT invent new copy; source row-level reminder buttons here.
- `packages/web/src/components/dashboard/ReferralLinkCard.tsx` — current dashboard surface; new component renders below this.
- `packages/web/src/app/dashboard/page.tsx` — server component fetches dashboard data. Add new fetches to this block.
- `CLAUDE.md` — "remind your overdue presidents/employees, never pressure politicians" + Wishonia voice + treaty editorial style + "Reuse before rewrite."
- `TODO.md:399-411` — pre-existing "Humanity Manager status report" specification with both halves (overdue + completed). This plan implements it.
- `TODO.md` top-6 #34 — K-factor instrumentation, separate PR.
- Phase 1 dual voices completed 2026-05-17:
  - Codex critique log: appended to this plan file under `## Codex critique (round 1)`.
  - Claude subagent critique returned as agent result; key findings incorporated above.

## ALERTS

_(orchestrator-edited; empty at plan time)_

## Agent log

_(Codex appends after each meaningful action)_

## Codex critique (round 1)

| Finding | Severity | Concrete fix |
|---|---|---|
| The plan optimizes for a passive dashboard return visit, but the growth moment is when a voter has just voted or just caused someone else to vote. | critical | Reframe this as a conversion-feedback loop: post-vote next action, one-time downstream milestone email, and dashboard status only as the archive. **Partially addressed in revised plan: reminder card is the propagation lever; notification email deferred to follow-up.** |
| The proposed query uses `Referral.answer=YES` as "actual voters," but treaty vote attribution now lives on `ReferendumVote.referredByUserId` plus `ReferralInvitation.convertedVoteId`. | critical | Build from official YES `ReferendumVote` rows for the treaty referendum, joined to `ReferralInvitation` where present, and treat legacy `Referral` as signup-only context. **ADDRESSED in revised plan — verified in schema, queries rewritten.** |
| The premise that names and faces make referrers share more is intuition, not a validated campaign fact. | high | Ship only behind an experiment with an exposure event, holdout, and a predeclared action metric before expanding the UI. **Partially addressed: leading metric specified (ShareAttempt delta), experiment framework deferred.** |
| K-factor instrumentation is a prerequisite because otherwise this ships as a vanity feature with no way to prove it increased the branching factor. | critical | Instrument referrer exposure, copy/share/invite actions, click-throughs, direct votes, first downstream votes, depth, and 7-day cohort lift before or in the same PR. **Tracked as TODO #34, separate follow-up PR — Mike's judgment.** |
| The 7-day leading metric cannot be dashboard views because views can rise while the chain still dies. | high | Use "share or named-invitation action within 24 hours of conversion feedback, then referred voter creates one downstream vote within 7 days vs holdout" as the leading metric. |
| Anonymizing private rows destroys the plan's stated names-and-faces value for the exact users most likely to keep profiles private. | high | Split the privacy model: named invitations can show the recipient name the referrer entered, generic referral voters require explicit "show my name to the referrer" consent, and everything else is aggregate. **Partially addressed: reminder card shows invited-recipient names from ReferralInvitation.recipientPersonId (referrer-entered); celebration card still anonymizes private profiles until consent flow lands as follow-up.** |
| The out-of-scope downstream-vote notification email is more important than the passive list because it reaches the referrer without requiring a dashboard habit that probably does not exist yet. | critical | Replace the feed-first slice with a capped milestone email such as "Alice recruited her first voter; make sure she gets to two," with unsubscribe scope and no per-vote spam. **Deferred to follow-up PR — the dashboard cards ship first because Mike's original question was about the dashboard surface.** |
| The plan targets `ReferralLinkCard` placement, but the current War on Disease `/dashboard` renders `TreatyTaskDashboardClient` and `DashboardShareCard`, so the feature can miss the primary campaign surface. | critical | Design against the treaty dashboard branch first and only backfill the generic Earth Optimization dashboard if the same component is reused. **Will verify during Phase 2 design review — added to Phase 2 entry criteria.** |
| A private "humans you recruited" list is weaker than public social proof because it helps one referrer after login while a public verified-referrer leaderboard can influence every visitor. | medium | Test a public verified-referrer/signatory proof module on vote and post-vote surfaces using only public, verified identities and aggregate private counts. **Defer to future plan; out of scope here.** |
| The upstream-chain alternative is underweighted because "X recruited you, now help X get to two" creates obligation at peak commitment. | high | Add upstream attribution to the post-vote flow and notification copy before building a downstream-only archive. **Defer to follow-up plan; the current plan ships the reminder-half of the HM Status Report which is its own propagation lever.** |
| The 6-month regret case is that the team built a privacy-sensitive CRM widget, nobody returned to see it, K-factor stayed below 1, and the campaign lost time on the post-vote/share loop. | high | Time-box this to instrumentation plus one notification experiment and require a measured lift before adding avatars, pagination, or "show more." |
| This is not the right build before the current P0 referral items because TODO prioritizes post-vote email alignment, share-template consolidation, Humanity Manager status, and forward-to-better-fit flows. | high | Move this below those P0 items unless it becomes the measured status/notification work that directly serves them. **ADDRESSED in revised plan — this IS the Humanity Manager Status report (TODO.md:399-411), with both halves.** |

Overall recommendation: **SCRAP_AND_REPLACE** (resolved — plan rewritten per this critique + Claude subagent critique + Mike's "use your best judgment" + reminder-not-nudge directive).

## Claude subagent critique (round 1) — summary

Eight findings, recommendation also SCRAP_AND_REPLACE. Independent verification of the same data-source bug (Referral vs ReferendumVote). Additional independent flag: signup flow at `packages/web/src/app/api/auth/signup/route.ts:61` calls `ensurePersonForUser(user.id, { displayName: name })` and never sets `isPublic=true` — every voter created via the campaign funnel is private-by-default. Full critique text in agent result `a9952a4b896dc480d.output`. Replacement direction matched Codex: ship K-factor first, then HM Status Report with both halves, vote-time consent for name visibility.

## Mike approved

2026-05-17: Phase 4 final gate. Both Phase 1+3 reviewers caught that `HumanityManagerStatusPanel` already implements ~80% of the proposed feature. Mike's response to the gate: "use your best judgment, my theory is we can just do them both in the same pull request."

**Approved scope (bundled into PR #85 feature/public-profile-task-assignment):**

1. **Treaty dashboard integration**: render `HumanityManagerStatusPanel` on `TreatyTaskDashboardClient.tsx` (currently only on `EarthOptimizationDashboardClient`). Fetch status data via existing `loadHumanityManagerStatus` in the treaty dashboard server component path.
2. **K-factor instrumentation v1 (minimal)**: add `getKFactorForUser(userId)` returning (direct vote conversions / total invitations sent) over 30-day window. Surface as one metric line on `HumanityManagerStatusPanel`. Full cohort-lift analytics deferred.

**Deferred (not blocking ship):**
- Anonymous-clicks aggregate bucket (no FK to dedupe clicks→votes; approximate at best)
- Vote-time consent prompt for `Person.isPublic=true` (separate UX flow)
- Adding avatars to `completedEmployees` rendering (treaty style minimal already)
- Full HumanityManagerStatus refactor (`HumanityManagerStatusPanel` works as-is)

**Original "referred voters list" plan: SCRAP_AND_REPLACE outcome.** The autoplan correctly determined this feature mostly already exists.

## Codex design critique (round 1)

| Finding | Severity | Concrete fix |
|---|---|---|
| The default reminder-first order is right only when there is at least one contactable pending invitation; otherwise it wastes the first status-report slot on nothing. | high | Sort by state: pending named invitations first, then recent conversion celebration when pending is zero, then a single first-action empty state for brand-new voters. |
| The celebration card belongs above the reminder card when pending count is zero and at least one human has voted through the user's link, especially immediately after a new conversion. | high | Add a `primaryStatusMode` decision before rendering: `pending`, `celebrate`, or `start`, and place only the matching card in the first visible slot. |
| The anonymous-click bucket is not a reminder list because there is no person or channel to remind. | critical | Render unnamed clicks as an aggregate insight below named pending rows, with a CTA to send a named invitation or share again, and never show row-level Send or Copy reminder controls for that bucket. |
| A celebration card with zero votes is dead space and weakens the dashboard's action clarity. | medium | Collapse the celebration card when `recruited.length === 0` unless it is the only status area, in which case show one compact line: "No votes through your link yet" plus the same primary share action. |
| Showing two empty cards to a brand-new voter fails the peak-commitment test because it tells them what did not happen instead of what to do next. | critical | Replace both empty cards with one first-run panel directly under `DashboardShareCard`: "Send this to two humans" with Text, WhatsApp, Email, and Copy actions. |
| The loading state is underspecified for a server-rendered dashboard and risks adding fake skeleton chrome that users never need. | low | If the data stays server-fetched, use the route's existing page loading behavior; if the report fetches client-side, show one compact text row per card, not full skeleton tables. |
| The error and partial states are missing, so a failed report query could hide useful share controls or render the whole dashboard as broken. | high | Fail the report independently: keep `DashboardShareCard` visible, show whichever card loaded, and render a small retry/error line only inside the failed report section. |
| Row-level Send is undefined and currently mixes email delivery, native share, manual copy, and task-comment status into one word. | critical | Define a channel matrix: email uses `sendReferralInvitationMessage`, SMS/WhatsApp/native share open channel links and then mark manual contact, and Copy stays a secondary fallback. |
| Copy alone is not sufficient on mobile because the user still has to choose a channel, find the recipient, paste, and remember to mark it sent. | high | Make the primary row action channel-specific ("Text Sarah", "Email Sarah", "WhatsApp") based on stored contact method, with Copy in an overflow or secondary slot. |
| The plan points to `packages/web/src/lib/share-templates.ts`, but the current canonical task reminder registry is `packages/web/src/lib/tasks/share-templates.ts`. | high | Correct the file path and explicitly decide whether voter reminders use the task template registry's `one_human` mode or the existing referral-invitation copy helpers. |
| The desktop ASCII layout does not answer the real mobile layout problem: two bordered cards plus per-row dual buttons will be cramped and repetitive on a phone. | high | On mobile, render each row as name/status/date followed by one full-width primary action and one compact secondary copy control, with 44px minimum tap targets and no side-by-side action buttons below `sm`. |
| The report should not show more than the first few rows before the user reaches a clear action. | medium | Limit the first view to the top 3 pending rows or top 3 recent conversions and put "View all" behind a disclosure or task list link. |
| Repeating "Anonymous Humanity Manager" as individual celebration rows makes the social proof feel fake and gives the referrer no useful human story. | high | Show public named voters first, show current-referrer-entered invitation names without profile links when appropriate, and merge generic private voters into one aggregate row below named entries. |
| Private converted voters should not be treated the same as named invitees whose name the referrer supplied. | high | Split identity display rules: invitation-converted private rows may use the invitation recipient name as plain text, while generic private referral votes stay aggregate-only. |
| The dashboard reminder rows overlap with `/people/[id]` assign-task and the existing referral-invitation task flow, which can make users wonder whether they are managing people, tasks, or messages. | high | Make this report a status-and-next-action summary over existing `ReferralInvitation` tasks; link to the task detail only as a secondary audit path and do not create a second invitation-management surface. |
| The generic dashboard already has `ReferralInvitationStatusCard`, so adding another invitation list can duplicate the same mental model under a new name. | medium | Replace or fold `ReferralInvitationStatusCard` into the Humanity Manager report on the generic dashboard, and add the report to the treaty dashboard without duplicating old status-card controls. |
| Two equal-weight bordered cards below `DashboardShareCard` will compete with the primary share composer instead of supporting it. | high | Keep `DashboardShareCard` as the dominant first action and render the status report as a lower-weight editorial section with thin rules, compact headings, no "NEW" badges, no emojis, no shadows, and no nested cards. |
| The proposed celebration card title is internally satisfying but not enough of a next step. | medium | Pair each recent conversion with a visible action such as "Ask Alice to send it to two humans" when the row is named, and fall back to "Share with two more humans" for aggregate/private rows. |
| Both cards lack a visible next action above the fold when the user has no pending named reminders. | critical | Put the same primary action in every state: pending = remind the next named human, celebrate = ask the new voter to pass it on, start = share with two humans. |

Overall recommendation: **SHIP_WITH_REVISIONS** — keep the two-status concept, but revise before implementation so rendering is state-prioritized, anonymous clicks are aggregate-only, Send has defined channel behavior, mobile rows use one primary action, private voters are grouped correctly, the generic invitation status card is not duplicated, and the report stays visually subordinate to the existing treaty share composer.

## Codex engineering critique (round 1)

| Finding | Severity | Concrete fix |
|---|---|---|
| Merging ReferralInvitation, ReferendumVote, and ReferralClick inside a client card or across three endpoint calls will create inconsistent auth, loading, error, deduplication, and pagination behavior. | high | Build one server-owned report DTO, preferably by extending the existing `loadHumanityManagerStatus` path or adding one adjacent server helper, and let the component render that normalized payload. |
| Converted named invitations can appear in both ReferralInvitation and ReferendumVote, so the plan needs a canonical row key before any UI work. | critical | Treat `ReferendumVote.id` as the recruited-voter canonical key, exclude votes with `convertedReferralInvitation` from the raw-link vote set, and keep `ReferralInvitation.convertedVoteId IS NULL` as pending-only. |
| The plan says celebration rows are "NOT already represented by a ReferralInvitation," but it also wants named invitation conversions, which are currently the existing Humanity Manager sample. | high | Split recruited rows into `convertedInvitationVotes` and `rawReferralVotes`, display both under one section, and dedupe by vote id before computing totals. |
| The current `/api/referral-invitations` GET returns raw invitation rows with fields such as `recipientEmail`, `messageText`, `originUrl`, and `inviteToken`, so extending it directly would widen a privacy-sensitive API surface. | critical | Replace raw Prisma rows with an allowlisted DTO using `select`, and return only display-safe fields needed by the report. |
| Privacy redaction cannot live in the React component because private names, handles, images, emails, and headlines would already have crossed the server boundary. | critical | Add a server-only mapper such as `toReferredVoterReportRow` that checks `Person.isPublic` and `ReferendumVote.isPublic` before serialization and emits aggregate/private rows with no identity fields. |
| Private voters and sender-entered invitation recipients have different privacy semantics. | high | Use `ReferralInvitation.recipientName` only for the inviter's pending or converted invitation context, and never use private `Person` fields to enrich that row unless the profile and vote are public. |
| At 5000 invitations, the existing API `take: 100` plus client-side filters will lie because the filter only sees the first page. | high | Move filters and counts server-side, return per-status totals, and page pending invitations with a stable cursor such as `(createdAt, id)`. |
| At 800 recruited votes and 50000 clicks, one "Show more" cursor over stacked mixed row types will either skip data or starve one section. | high | Use independent cursors for pending invitations, recruited votes, and anonymous-click aggregates, and expose "Show more" per section instead of one global offset. |
| Anonymous clicks are not humans the manager can remind, so row-level controls for them would be misleading and expensive at high volume. | medium | Render anonymous clicks as one aggregate insight with a share-again action, never as per-click rows or per-click reminder controls. |
| `getReferralCountsByUserIds` is already a single grouped Prisma query, but it counts legacy signup `Referral` rows rather than treaty vote conversions. | medium | Keep its grouped-query shape, but use it only when signup-referral semantics are intended; use `User.downstreamConversionCount` or a treaty-vote conversion query for downstream-vote badges. |
| `getReferredVoters` will become N+1 if downstream counts are fetched per rendered voter. | high | Query a limited page of votes with a narrow `select`, then batch downstream counts for those page user ids in one grouped query or from the cached user column. |
| Exact "anonymous clicks that did not convert" is not derivable from ReferralClick to raw-link ReferendumVote without a first-class vote attribution key. | high | Avoid a slow origin-url or referer parse join; use indexed anti-joins on `shareAttemptId` for invitation/signup-linked conversions, or defer exact raw-vote exclusion until votes persist `shareAttemptId`. |
| A naive `LEFT JOIN` over all clicks for a power user will be slow because `ReferralClick` has only separate indexes on `referrerUserId` and `shareAttemptId`. | high | Query from a limited/indexed candidate set by `referrerUserId` and `deletedAt`, aggregate by `shareAttemptId`, and anti-join against indexed conversion tables before counting. |
| React error boundaries do not catch async fetch failures inside the current client `useEffect`, and route-level `error.tsx` would hide the primary share dashboard. | high | Load report sections with server-side `Promise.allSettled` or explicit per-section try/catch and return section-level error DTOs while keeping `DashboardShareCard` rendered. |
| The repository already has `HumanityManagerStatusPanel`, `loadHumanityManagerStatus`, and `HumanityManagerStatus` rendered on the Earth dashboard, so renaming `ReferralInvitationStatusCard` to the same concept risks two competing implementations. | high | Consolidate into one Humanity Manager report implementation by extending or replacing the existing panel, then remove the old invite-status card from the Earth dashboard. |
| Only `EarthOptimizationDashboardClient` imports `ReferralInvitationStatusCard`, but E2E tests assert the old dashboard text "Earth Optimization Tasks" and unrelated `/tasks` routes also use that title. | medium | Update dashboard-specific tests and imports, but do not rename `/tasks` labels, smoke expectations, or translation strings unless that surface is intentionally in scope. |
| The War on Disease `/dashboard` path currently renders `TreatyTaskDashboardClient` with only `DashboardShareCard`, so wiring only the generic dashboard would miss the primary campaign surface. | critical | Fetch the same report data in the treaty dashboard branch of `dashboard/page.tsx` and render the report under `DashboardShareCard` in `TreatyTaskDashboardClient`. |
| Importing `lib/tasks/share-templates.ts` from dashboard code is package-local and directionally acceptable, but raw template selection needs task/referral tokens and should not be reimplemented in the component. | medium | Keep template rendering in a server helper or reuse the existing reminder-builder functions, and pass final copyable reminder text to the client. |
| The proposed tests include useful boundary cases but also risk route passthrough and UI snapshot tests that CLAUDE.md explicitly discourages. | high | Must test official treaty YES filtering, redaction DTO behavior, invitation/vote deduplication, anonymous-click exclusion semantics, cursor/count behavior, and empty-state behavior at the component boundary; skip symmetry tests that only assert mocked Prisma arguments or rendered copy snapshots. |
| The existing route test style already asserts Prisma call shapes, so adding more of that for the new report would mostly lock implementation instead of protecting behavior. | medium | Put the higher-value tests on pure DTO mappers and server helpers with realistic row fixtures, plus one API/RSC boundary test that proves private data is absent from JSON. |

Overall recommendation: **SHIP_WITH_REVISIONS**:

- Consolidate the existing Humanity Manager panel/card paths before renaming anything.
- Use one server-owned DTO with explicit deduplication, redaction, section errors, and per-section cursors.
- Treat anonymous clicks as an aggregate only, and do not claim exact unconverted raw-link click counts unless the query has a real attribution key.
- Add the report to the War on Disease treaty dashboard branch, not just the generic Earth Optimization dashboard.
- Keep tests focused on privacy, source-of-truth filtering, deduplication, pagination/counts, and anonymous-click exclusion semantics.
