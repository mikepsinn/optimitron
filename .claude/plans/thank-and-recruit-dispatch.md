# Thank-and-recruit copy buttons on Humanity Management Status

## Brief

A signed-in voter on warondisease.org/dashboard has just voted YES on the 1% Treaty and shared the link with friends ("employees"). The Humanity Management Status panel currently lets them **bother** late friends with a prefilled reminder, but offers no symmetric path to **thank** the friends who already voted and **ask each one for 2 more humans**.

Mike's framing: *"I'm thinking the most. The feature I'm most interested in is like seeing who of the people that I shared it with have voted, possibly how they voted, and how many downstream votes I got so that I can bother people that didn't vote yet, and maybe thank people who did vote and ask them to get more people to vote that they know."*

Goal of the change: give the voter a one-click "Copy thanks" button next to each completed-employee row, with a Wishonia-voice message acknowledging the YES vote and asking for 2 more recruits. Same shape as the existing late-friend reminder — different mode, different intent.

## Audience and goal

- **Audience:** signed-in warondisease.org voter who already voted YES, looking at their dashboard from mobile.
- **Concrete action we want them to take:** click "Copy thanks" on a row showing a friend who voted, paste into iMessage/WhatsApp/SMS to that friend.

## Research log

This is an internal extension to an existing panel. No third-party API, SDK, or vendor surface is touched — so the research surface is the existing repo + the project manual, not vendor docs.

Repo-internal provenance (verified by Read tool 2026-05-17):

- `packages/web/src/lib/humanity-manager-status-content.tsx:120-175` — `createHumanityManagerStatus` defines the presentation contract (`CompletedEmployees`, `ReminderBlock`, `MetricTable`) and the `HumanityManagerStatusInput` shape at `packages/web/src/lib/humanity-manager-status-content.tsx:27-37`.
- `packages/web/src/lib/humanity-manager-status.web.tsx:88-139` — `CompletedEmployees` web renderer; per-row `<li>` at line 121. `ReminderBlock` Copy button visual at `packages/web/src/lib/humanity-manager-status.web.tsx:141-193`.
- `packages/web/src/lib/humanity-manager-status.server.ts:237-280` — `buildEmployeeReminder` builds reminders from overdue invitations only. `loadHumanityManagerStatus` at `packages/web/src/lib/humanity-manager-status.server.ts:339-481`. `convertedInvitationWhere` defined at line 346-351; query at line 376-396 — confirms vote answer is NOT selected.
- `packages/web/src/lib/tasks/share-templates.ts:51` — `ShareRecipientMode = "leader" | "humanity" | "one_human" | "peer"`. `peer` mode contract assertions at `packages/web/src/lib/tasks/__tests__/accountability.test.ts:710-776` lock peer to exactly one template (`most-important-secret`) at `packages/web/src/lib/tasks/share-templates.ts:763-775`. `DEFAULT_PEER_SHARE_TEMPLATE_ID` exported at `packages/web/src/lib/tasks/share-templates.ts:786` (verified post-Codex critique; original plan-author only read first 40 lines).
- `mcp__optimitron-tasks__searchManual` results (ran 2026-05-17 against `https://manual.warondisease.org`):
  - `https://manual.warondisease.org/knowledge/appendix/parameters-and-calculations.html` — `Effective R: 0.15`, `Lives Saved per Verified Voter: 2.6`, `Sharing Opportunity Cost: $0.06`, `Cascade Generations: 3`, `Sharing Upside/Downside Ratio: 58.1Mx`.
  - `https://manual.warondisease.org/knowledge/futures/wishonia.html` — Wishonia voice grounding ("We stopped having wars 4,297 years ago…"). Note: the THANKS templates use voter-to-friend voice, not Wishonia voice — voter-to-friend register lives in existing templates at `packages/web/src/lib/tasks/share-templates.ts:756-775` ("sincere", "most-important-secret").
- Git archaeology: `git log --all -S "thank" --since="2025-01-01" -- packages/web/src/lib/tasks/share-templates.ts packages/web/src/lib/humanity-manager-status*.tsx` returned 0 results. No prior thanks-template attempts to honor or supersede.

No vendor-API stale-knowledge risk here. The cutoff risks were internal (whether `peer` mode has hidden consumers, whether the manual already had quotable wording) and both have now been resolved by direct file reads + searchManual calls.

## Current state — ASCII

```
┌───────────────────────────────────────────────────────────────────────┐
│ HUMANITY MANAGEMENT STATUS                                            │
│ Your employees are either clicking or require management.            │
│ <body explaining direct vs full chain>                                │
├───────────┬────────────┬───────────┬───────────┬──────────────────────┤
│ Completed │ Votes/inv  │ Late      │ Late      │ Downstream           │
│    3      │    0.42    │    7      │   91      │     12               │ ← 5-cell strip
├───────────┴────────────┴───────────┴───────────┴──────────────────────┤
│ EMPLOYEES WHO DID THE TASK                                            │
│  • Maria Lopez completed it on 14 May; 4 downstream votes from her.  │ ← text only,
│  • Jordan Kim   completed it on 11 May; 0 downstream votes from him. │   no action
│  ...                                                                  │
├───────────────────────────────────────────────────────────────────────┤
│ 7 employees still need the 30-second vote. Examples: ...              │ ← prose dup of
│ 91 presidents and heads of government still have not signed.          │   cells above
├───────────────────────────────────────────────────────────────────────┤
│ COPY REMINDERS                                                        │
│  ┌─ Employee reminder ────────────────────────[Copy]─┐                │ ← only for
│  │ Dad                                              │                 │   LATE
│  └──────────────────────────────────────────────────┘                 │
│  ┌─ President reminder ───────────────────────[Copy]─┐                │
│  │ Lula (Brazil)                                    │                 │
│  └──────────────────────────────────────────────────┘                 │
└───────────────────────────────────────────────────────────────────────┘
```

## Proposed state — ASCII

```
┌───────────────────────────────────────────────────────────────────────┐
│ HUMANITY MANAGEMENT STATUS                                            │
│ Your employees are either clicking or require management.            │
│ <body explaining direct vs full chain>                                │
├───────────────────────────────────────────────────────────────────────┤
│ COPY REMINDERS                            ← HOISTED ABOVE METRICS     │
│  ┌─ Employee reminder ────────────────────────[Copy]─┐                │
│  │ Dad                                              │                 │
│  └──────────────────────────────────────────────────┘                 │
│  ┌─ President reminder ───────────────────────[Copy]─┐                │
│  │ Lula (Brazil)                                    │                 │
│  └──────────────────────────────────────────────────┘                 │
├──────────────────────────┬────────────────────────────────────────────┤
│ EMPLOYEES COMPLETED      │ DOWNSTREAM CONVERSIONS                     │ ← 2-cell strip
│       3                  │           12                                │   (kFactor + dup
└──────────────────────────┴────────────────────────────────────────────┘   counts removed)
├───────────────────────────────────────────────────────────────────────┤
│ EMPLOYEES WHO DID THE TASK            ← sorted by downstream desc     │
│  • Maria Lopez voted YES on 14 May; 4 downstream votes from her.     │
│    [Copy thanks] ▼ "Maria — thanks for voting YES. Bet now is..."    │ ← NEW
│  • Jordan Kim   voted YES on 11 May; 0 downstream votes from him.    │
│    [Copy thanks] ▼ "Jordan — thanks for voting YES. ..."             │ ← NEW
│  ...                                                                  │
├───────────────────────────────────────────────────────────────────────┤
│ 7 employees still need the 30-second vote. Examples: ...              │
│ 91 presidents and heads of government still have not signed.          │
└───────────────────────────────────────────────────────────────────────┘
```

## Step list

- [ ] Step 1: `searchManual` queries ("thank voter", "ask for two", "two more humans", "viral coefficient", "k factor") + `git log -S` archaeology for prior thanks-template attempts. Quote any usable wording in the Agent log.
- [ ] Step 2: Decide `peer` reuse vs new `peer_thanks` mode. Grep `recipientModes: \["peer"`, `mode: "peer"`, and any `recipientMode === "peer"` callsites. If `peer` is truly unused, reuse it; else add `"peer_thanks"` to the union.
- [ ] Step 3: Author 2-3 thank-and-recruit template bodies in `share-templates.ts` matching the chosen mode. Address by name; acknowledge YES vote; ask for 2 more humans; include `{treaty_url}`; Wishonia voice (deadpan, data-first, no nudge/poke verbs).
- [ ] Step 4: Add `buildEmployeeThanksReminder(...)` in `humanity-manager-status.server.ts`. Driven by `convertedInvitations`. One thanks-reminder per row.
- [ ] Step 5: Extend `HumanityManagerStatusCompletedEmployee` with `thanksReminder?: HumanityManagerStatusReminder | null`. Loader populates per row.
- [ ] Step 6: Sort `completedEmployees` desc by `downstreamConversionCount` in the loader.
- [ ] Step 7: Render inline "Copy thanks" button per row in `humanity-manager-status.web.tsx` `CompletedEmployees` using the same h-10 treaty-ink visual as `ReminderBlock`. Below the row, render the rendered message in a collapsed `<details>` for preview.
- [ ] Step 8: Change row prose from "completed it on {date}" to "voted YES on {date}". Keep the downstream-count suffix.
- [ ] Step 9: Drop "Votes per invite (30d)", "Employees still late", "Late presidents" cells from the metric table. Resulting strip: 2 cells.
- [ ] Step 10: Hoist `ReminderBlock` ABOVE the metric strip in `createHumanityManagerStatus` layout order. Action first, status second.
- [ ] Step 11: Update tests:
   - `packages/web/src/lib/__tests__/humanity-manager-status.server.test.ts` — assert thanksReminder is populated + sort order.
   - `packages/web/src/components/dashboard/HumanityManagerStatusPanel.test.tsx` — assert per-row Copy thanks button + sort order.
- [ ] Step 12: `pnpm --filter @optimitron/web exec tsc --noEmit` and `pnpm --filter @optimitron/web test -- humanity-manager-status`. Fix every failure.
- [ ] Step 13: `pnpm --filter @optimitron/web copy:preview` to regenerate `.md` snapshots.
- [ ] Step 14: Mike reviews verbatim copy + screenshot. Approve → Claude commits on Codex's behalf.

## Risks

1. **`peer` mode reuse may hit invisible consumers.** Need full grep before deciding; otherwise the dispatch could break unrelated share flows. Mitigation: Step 2 enumerates all callsites first; default to NEW mode `peer_thanks` if any ambiguity.
2. **Sort by downstream desc reorders the existing list.** If anyone has wired up an integration test that asserts the prior ordering (by `convertedAt` desc / `createdAt` desc), that test breaks. Mitigation: Step 11 updates tests; grep current ordering assertions in Step 2.
3. **Thanks-template wording is the highest-failure surface** — easy to write something that sounds startup-bro or sycophantic. Mitigation: searchManual + git archaeology in Step 1; verbatim review by Mike in Step 14 BEFORE commit (hook-enforced).
4. **Asking the recipient for "2 more humans" may read as transactional.** Wishonia voice ("On my planet, every voter passed it to two") can soften this, but it's a copy taste call Mike must own. Mitigation: 2-3 variants offered to Mike, not just one.
5. **Mobile rendering of the new per-row `<details>` previews** could push the metric strip below the fold on small screens. Mitigation: Step 10 already moves the action above the metrics; verify on iPhone-14 viewport in Step 14.
6. **The `downstream votes from them` count is computed by `loadDirectReferralDownstreamCounts` (recursive SQL).** Sorting by this count is fine; the count itself is already trusted enough to render.
7. **Existing `convertedInvitations` already slices to 8.** If we sort by downstream desc AFTER the slice, low-downstream high-recency winners survive but high-downstream older entries get cut. Mitigation: sort happens in SQL or before slice; verify in Step 6.

## Files to touch

Expected scope (Codex will confirm):

- `packages/web/src/lib/humanity-manager-status-content.tsx` (data shape + presentation contract)
- `packages/web/src/lib/humanity-manager-status.web.tsx` (web renderer; per-row Copy thanks button)
- `packages/web/src/lib/humanity-manager-status.email.tsx` (email variant — likely same change to data shape; check if thanksReminder should render in email or only web)
- `packages/web/src/lib/humanity-manager-status.server.ts` (loader: new builder, sort, populate thanksReminder)
- `packages/web/src/lib/tasks/share-templates.ts` (mode union + 2-3 templates)
- `packages/web/src/lib/__tests__/humanity-manager-status.server.test.ts` (assertions)
- `packages/web/src/components/dashboard/HumanityManagerStatusPanel.test.tsx` (assertions)
- Regenerated `.md` snapshots under `packages/web/src/app/dashboard/` (from `copy:preview`)

Estimated diff size: ~250-350 lines, half of which is the new templates + tests.

## ALERTS

_(empty — orchestrator-edited mid-flight; Codex re-reads top of every Phase-3 turn)_

## Agent log

- 2026-05-17 Codex: Read dispatch plan top to bottom. ALERTS currently empty. Using revised Step 1-11 and approved peer_thanks templates; will not commit or push.
- 2026-05-17 Codex: Confirmed branch `feature/public-profile-task-assignment`; saw existing unrelated dirty worktree entries. Read `packages/web/AGENTS.md`; web package allows Prisma runtime use, requires treaty style, h2ewd copy rules, screenshots, and no extra dev servers.
- 2026-05-17 Codex: Light memory lookup only confirmed existing treaty dashboard/share-template conventions; repository plan remains the source of truth.
- 2026-05-17 Codex: Pushback before writing the YES filter: Mike's "possibly how they voted" does point toward a fuller all-converters list that shows YES/NO/ABSTAIN, with thank/recruit cards only for YES voters. For this dispatch I am keeping the revised approved YES-only recruitment slice, because the new copy asks the recipient to recruit two more voters and NO/ABSTAIN voters are not recruitment candidates.
- 2026-05-17 Codex: Completed revised Step 1. Added `peer_thanks`, `DEFAULT_PEER_THANKS_SHARE_TEMPLATE_ID`, and the three approved templates; added `target_label` as a token alias so approved copy stays verbatim.

- 2026-05-17 Codex: Completed revised Step 2. Updated `accountability.test.ts` to keep `peer` locked to `most-important-secret`, cover the three `peer_thanks` templates, assert the new default, and render the approved direct-math copy with the recipient's referral URL.

- 2026-05-17 Codex: Completed revised Step 3. Added top-level `thanksReminders` to the shared Humanity Manager input and passed it separately into `ReminderBlock`, so web can render thanks cards while email can ignore them.

- 2026-05-17 Codex: Completed revised Step 4. Tightened converted invitations to `VotePosition.YES`, selected the converted user's `handle`/`referralCode`, added `buildEmployeeThanksReminder`, and populated capped `thanksReminders` using the thanked user's own `/vote/{identifier}` URL.

- 2026-05-17 Codex: Completed revised Steps 5 and 6. Web `ReminderBlock` now renders normal reminders and YES-voter thanks cards in one action surface; email accepts but ignores `thanksReminders`; completed employee prose now says `voted YES`.

- 2026-05-17 Codex: Completed revised Step 7. Updated `humanity-manager-status.server.test.ts` with YES-filter assertions, selected recipient identity assertions, and a populated `peer_thanks` reminder that uses Ada's own referral URL instead of Mike's.

- 2026-05-17 Codex: Completed revised Step 8. Added a `HumanityManagerStatusPanel` test where overdue reminders are empty but `thanksReminders` has an entry; it renders `Copy thanks`, avoids the empty fallback, and copies the thanks message.

- 2026-05-17 Codex: Completed revised Step 9. First TypeScript run caught a missing `thanksReminders` fixture and the schema reality that handles live on `Person`, not `User`; fixed both. Rerun passed: `pnpm --filter @optimitron/web test -- humanity-manager-status accountability HumanityManagerStatusPanel` (251 tests) and `pnpm --filter @optimitron/web exec tsc --noEmit`.

- 2026-05-17 Codex: Completed revised Step 10 with a scoped run. Full `copy:preview` failed once because no server was running, then timed out after 15 minutes across many unrelated dirty routes; reran `pnpm --filter @optimitron/web copy:preview -- --routes=/dashboard`, which passed and regenerated `page.logged-out.md` + `page.logged-in.md` for `/dashboard`.
- 2026-05-17 Codex: Captured screenshot review at `packages/web/output/playwright/review/latest.html`, with images under `packages/web/output/playwright/review/thank-and-recruit/`. Demo DB has no YES-converted invitees, so the after screenshot uses a DOM fixture for the thanks-card state; real data path is covered by server/panel tests. Visual inspection: thanks cards render inside `ReminderBlock`; no clipping/overlap in the card. Browser console had Web3Modal dev CORS/fetch noise only.

- 2026-05-17 Codex: Attempted to stage the intended 10 code/test files only. `git add` failed twice with `Unable to create 'E:/code/optimitron/.git/index.lock': Permission denied`; active Git processes were present, no stale `.git/index.lock` file was visible, and I did not kill other processes. Changes remain unstaged.

## Codex critique (round 1)

Codex ran read-only and could not write to the plan file (sandbox blocked `apply_patch`). Findings transcribed by Claude from the dispatch output:

### 1. `peer` mode is contractually locked, NEW mode required
`peer` is the secret-chain no-link mode consumed by `SecretChainPitch` via `DEFAULT_PEER_SHARE_TEMPLATE_ID`. Callsites:
- `packages/web/src/lib/tasks/share-templates.ts:764-796`
- `packages/web/src/components/.../SecretChainPitch.tsx:24-28`
- `packages/web/src/components/landing/ReferendumSignatureBox.tsx:269-274`
- `packages/web/src/lib/tasks/__tests__/accountability.test.ts:710-776` (asserts `PEER_TEMPLATES.map(t=>t.id) === ["most-important-secret"]` and that peer-mode filter returns ONLY that template)

Adding thank-templates with `recipientModes: ["peer"]` breaks the contract. **Verdict: add new mode `peer_thanks`** (or use a local builder that doesn't go through `recipientModes` at all — see point 6).

### 2. Sort by downstream desc is wrong for the modal new voter
A new voter's completed invitees all have `downstreamConversionCount === 0`, so sorting by it produces an arbitrary order. Current `convertedAt desc / createdAt desc` (`humanity-manager-status.server.ts:376-395`) reads as "who just voted" and is the natural framing. **Verdict: KEEP recency order.**

### 3. Per-row `<details>` previews fragment the action surface
The existing `ReminderBlock` consolidates all copy-action cards in one section (`humanity-manager-status.web.tsx:141-193`). Splitting thanks-buttons inline into the completed-employees list breaks that consistency and creates two action surfaces. **Verdict: render thanks-cards INSIDE the existing `ReminderBlock` alongside overdue reminders**, visually distinguished (e.g., "Thank Maria" vs "Remind Dad"). One action surface.

### 4. Hoisting `ReminderBlock` above metrics is a regression for zero-reminder users
For the modal user with 0 overdue, 0 completed, the hoist puts an empty fallback ("No copyable reminders yet…") at the top. Current status-first / action-second ordering (`humanity-manager-status-content.tsx:157-170`) is correct. **Verdict: KEEP current layout order.**

### 5. Metric cells are not all redundant
`Votes per invite (30d)` only lives in the strip. Late counts are faster to scan than prose. **Verdict: drop the cleanup pass from THIS dispatch** — it's scope creep relative to Mike's actual ask. Defer the kFactor-cell question to a separate small commit if Mike wants it.

### 6. `humanity-manager-status.email.tsx` exists and consumes the shared input contract
File path: `packages/web/src/lib/humanity-manager-status.email.tsx:10-14, 155-170`. If thanks-reminders are placed inside `input.reminders`, the email accidentally renders them. **Verdict: add a separate top-level `thanksReminders: HumanityManagerStatusReminder[]` field**; web reads it inside `ReminderBlock`; email ignores it.

### 7. Tests need wider scope
`accountability.test.ts:710-776` asserts the current peer contract — must be updated for the new `peer_thanks` mode (or the local-builder approach). A focused panel render test for the zero-overdue case is warranted. **Verdict: update accountability.test.ts + add panel render test.**

### 8. **CRITICAL: `CONVERTED` ≠ YES vote**
The vote route at `packages/web/src/app/api/.../route.ts:53-58, 124-160` accepts YES / NO / ABSTAIN, writes the answer, then converts the invitation **unconditionally**. The loader at `humanity-manager-status.server.ts:376-395` does NOT select the vote answer. So the plan's "voted YES on {date}" prose is unsafe — a NO voter or abstainer would appear on the thanks list.

**Verdict: filter `convertedInvitationWhere` to only include invitations whose `convertedVote.answer === YES`.** NO / ABSTAIN converters aren't recruitment candidates anyway.

### 9. Thanks URL needs the converted voter's OWN referral link
The thank message asks them to recruit 2 more — so the embedded URL should be THEIR personal link, not the thanker's. Current query does not select the converted user's `handle` or `referralCode`. **Verdict: extend the query to select `convertedVote.user.{handle, referralCode}` and use `buildUserInviteReferralUrl` with their identity for the thanks template.**

### 10. Research log: `searchManual` was pending; now run
- `mcp__optimitron-tasks__searchManual` results (post-critique) — quotable from the manual: `Effective R: 0.15` (current sub-replacement propagation), `Lives Saved per Verified Voter: 2.6`, `Sharing Opportunity Cost: $0.06`, `Cascade Generations: 3`, `Sharing Upside/Downside Ratio: 58.1Mx`. The Wishonia voice grounding ("On my planet we stopped having wars 4,297 years ago…") is available in `knowledge/futures/wishonia.qmd`.
- Git archaeology: no prior thanks-template attempts in panel files (`git log -S "thank"` returned nothing on `packages/web/src/lib/tasks/share-templates.ts` or `humanity-manager-status*`).

### Other concerns
- The plan assumed `humanity-manager-status.email.tsx` may not exist (it does).
- The plan estimated 250-350 lines but didn't account for accountability.test.ts updates or the YES-filter + handle-selection query changes.
- Sort change risked breaking a snapshot test that asserts current ordering.

### Bottom line
**Do not ship this plan as-is.** Rework around: status-first layout (keep), recency-first list (keep), consolidated copy-action block (one surface, both overdue + thanks), new `peer_thanks` mode or local-builder, YES-filter + voter-referral-attribution wiring, accountability.test.ts updates + zero-overdue panel render test. Drop the metric-strip cleanup pass from this dispatch.

## Claude response (round 1)

Accepting all 10 of Codex's findings. The revisions are load-bearing — points 8 and 9 alone (CONVERTED≠YES, thanks URL must be the recipient's own link) would have shipped a feature that thanks NO voters and gives them links pointing to the WRONG referrer. Those two are critical bugs the original plan would have caused.

Revised plan diff vs original:

| Original | Revised |
|---|---|
| Sort completed list by downstream desc | KEEP recency order (`convertedAt desc / createdAt desc`) |
| Inline per-row `<details>` thanks buttons | Render thanks-cards INSIDE existing `ReminderBlock`, alongside overdue reminders, visually labeled "Thank {name}" vs "Remind {name}" |
| Hoist `ReminderBlock` above metric strip | KEEP existing status-first / action-second layout order |
| Cut kFactor + duplicate count cells from metric strip | OUT OF SCOPE this dispatch; defer to a separate small commit |
| `thanksReminder?` field on each `CompletedEmployee` | Separate top-level `thanksReminders: HumanityManagerStatusReminder[]` on `HumanityManagerStatusInput`; web reads it, email ignores it |
| Show "voted YES on {date}" for all converted invitations | Filter the loader's `convertedInvitationWhere` to only `convertedVote.answer === VotePosition.YES`. Keep recency order within that filtered set |
| Thanks URL = thanker's link with their tokens | Thanks URL = THE THANKED USER's personal referral link. Query must `select` `convertedVote.user.{handle, referralCode}` |
| Tests in 2 files | Same 2 + `packages/web/src/lib/tasks/__tests__/accountability.test.ts` (new mode contract) + a zero-overdue panel render test |

Revised step list (replaces the original Step 1-14):

- [x] Step 1: Add `peer_thanks` to `ShareRecipientMode` union in `share-templates.ts`. Author 2-3 thanks-templates with `recipientModes: ["peer_thanks"]`. Templates must: address by name, acknowledge YES vote, ask for 2 more humans (k=2 framing, "Effective R: 0.15" currently from manual), include `{treaty_url}` (the recipient's own referral link), Wishonia voice. Mike reviews verbatim before commit.
- [x] Step 2: Update `accountability.test.ts:710-776` peer-mode contract assertions to cover the new `peer_thanks` mode and its filter behavior.
- [x] Step 3: Add `thanksReminders: HumanityManagerStatusReminder[]` to `HumanityManagerStatusInput`. Default `[]`.
- [x] Step 4: In `humanity-manager-status.server.ts` `loadHumanityManagerStatus`:
   - Tighten `convertedInvitationWhere` to `convertedVote: { is: { answer: VotePosition.YES, deletedAt: null } }`.
   - Extend `prisma.referralInvitation.findMany` select to include `convertedVote.user.handle` and `convertedVote.user.referralCode`.
   - Add `buildEmployeeThanksReminder(...)` builder using the recipient's identity to build `{treaty_url}` via `buildUserInviteReferralUrl`. Pick template via `pickRenderedReminder({ mode: "peer_thanks", tokens })`.
   - Populate `thanksReminders` from the converted invitations (cap at 3, same shape as employee/president reminders).
- [x] Step 5: In `humanity-manager-status.web.tsx` `ReminderBlock`: render both `employeeReminders` and `thanksReminders` (separate sub-headings or visual chips). Email renderer (`humanity-manager-status.email.tsx`) ignores `thanksReminders` field.
- [x] Step 6: Change row prose from "completed it on {date}" to "voted YES on {date}". Keep downstream-count suffix. KEEP recency order (no sort change).
- [x] Step 7: Update `humanity-manager-status.server.test.ts` to assert the YES-filter, the referral URL points to the recipient's identity, and `thanksReminders` is populated.
- [x] Step 8: Add a zero-overdue panel render test in `HumanityManagerStatusPanel.test.tsx` asserting the empty-reminders fallback still renders correctly when `thanksReminders` has entries.
- [x] Step 9: `pnpm --filter @optimitron/web exec tsc --noEmit` + `pnpm --filter @optimitron/web test -- humanity-manager-status accountability`. Fix every failure.
- [x] Step 10: `pnpm --filter @optimitron/web copy:preview` to regenerate `.md` snapshots.
- [ ] Step 11: Mike reviews verbatim thanks-template copy + screenshot. Approve → Claude commits on Codex's behalf.

Revised file list:

- `packages/web/src/lib/tasks/share-templates.ts` — `peer_thanks` mode + 2-3 templates
- `packages/web/src/lib/tasks/__tests__/accountability.test.ts` — mode contract updates
- `packages/web/src/lib/humanity-manager-status-content.tsx` — `thanksReminders` field on input
- `packages/web/src/lib/humanity-manager-status.web.tsx` — render both reminder kinds inside `ReminderBlock`
- `packages/web/src/lib/humanity-manager-status.email.tsx` — verify ignores `thanksReminders` (should already, since it reads `input.reminders` not new field)
- `packages/web/src/lib/humanity-manager-status.server.ts` — YES filter, handle select, `buildEmployeeThanksReminder`, `thanksReminders` populate
- `packages/web/src/lib/__tests__/humanity-manager-status.server.test.ts` — YES filter + URL ownership + thanksReminders assertions
- `packages/web/src/components/dashboard/HumanityManagerStatusPanel.test.tsx` — render test with thanks-reminders present
- Regenerated `.md` snapshots under `packages/web/src/app/dashboard/`

Estimated diff: ~300-400 lines, half templates + tests.

Convergence: Claude + Codex agree on all 10 points. Ready for Mike approval — but copy wording (Step 1 templates) is the highest-failure surface and Mike must see the verbatim drafts before commit. Will present 3 template variants alongside the plan summary.

## Mike approved

Mike delegated the copy-register decision back to Claude with "I don't know what do you think?" Claude's call:

**Ship all three template variants in `peer_thanks` mode, picker-driven, A as default.** Rationale: the existing share-templates pattern is multi-template-per-mode with one default (lumbergh in `one_human` mode, polite-reminder in `humanity` mode); recipients getting the same canned thanks from 5 different friends is a real failure mode if only one template exists.

Verbatim templates approved:

**Template `peer-thanks-direct-math` (default):**
```
{target_label} — thanks for actually voting. Each voter currently brings 0.15 more voters. The number we need is 2. Two humans, 30 seconds each, your own link:
{treaty_url}
```

**Template `peer-thanks-casual`:**
```
{target_label} — you voted YES. That's already more than most humans manage. Final favor: 2 more people you know, 30 seconds each. Your link, not mine:
{treaty_url}
```

**Template `peer-thanks-stakes`:**
```
{target_label} — your YES vote saves 2.6 lives in expectation. Two more votes from people you know = 7.8. Send them your link:
{treaty_url}
```

`DEFAULT_PEER_THANKS_SHARE_TEMPLATE_ID = "peer-thanks-direct-math"`.

All three use the same token set: `{target_label}` and `{treaty_url}`. No other required tokens. The thanks URL must be the THANKED RECIPIENT's personal referral link (built from their `handle`/`referralCode` selected in the loader query), not the thanker's.

Engineering details from the revised Step list (1-11 above) are also approved by delegation — they're mechanical fixes to the bugs Codex caught (CONVERTED≠YES, wrong URL ownership, layout regressions). No further taste input needed.

Codex may dispatch.
