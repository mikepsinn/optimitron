# Optimitron TODO - 4B Votes on the 1% Treaty

This file is the working priority list. If Mike opens it cold, the next useful
work should be visible near the top.

Old sprint plans, session journals, stale PR checklists, and migration notes are
in git history. Recover with `git show <previous-commit>:TODO.md` only when they
directly unblock the 4B-voter campaign.

## North Star

- **Goal:** verified majority of humanity voting YES on the 1% Treaty
  referendum: roughly 4B humans.
- **Propagation math:** 32 doubling rounds with each voter recruiting two more
  humans reaches about 4.3B.
- **Primary public site:** `warondisease.org`, the International Campaign to End
  War and Disease.
- **Treaty text host:** `1percenttreaty.org`.
- **App/proof engine:** `optimitron.com`.
- **Task tree:** every campaign task is under `optimize-earth`
  (`OPTIMIZE_EARTH_ROOT_TASK_ID`, re-exported by
  `packages/web/src/lib/tasks/task-keys.ts`).

## Campaign Priority Order

Do not let lower items crowd out higher ones.

1. Increase treaty vote conversion.
2. Increase referral propagation: each voter gets two more humans to vote.
3. Get organizations to endorse, embed, and recruit their own people.
4. Register plaintiffs and connect the case framing to voting.
5. Remind country leaders and treaty signers — they are paid by the
   citizenry to promote welfare and are late on a 30-second task.
6. Improve discoverability and trust in people, organization, task, and evidence
   pages.
7. Preserve Optimitron's broader governance OS as the proof layer, not as a
   competing homepage.

## Current State

- Campaign mode is active. War on Disease is the product until the treaty passes.
- Managed data now owns task tree, triggers, referendums, reference data, and
  seed shim.
- Treaty vote, referral attribution, campaign emails, organization endorsement,
  plaintiff damages, and the simple `/treaty` skim-and-sign page exist.
- Bio-template `/love` page is shipped; dating registry deferred per 2026-05-19
  CBA.
- Generic commerce schema is now the intended money path for live checkout:
  `CommerceOffer`/variant/order/item/fulfillment/entitlement cover shirts,
  sponsorships, subscriptions, digital access, and dating-app benefits without a
  shirt-only table. Product/vendor catalog IDs belong in managed data, not env.
- Dating foundation schema is additive and separate from the task system:
  dating profiles, photos, prompts, questions, likes/passes/intros, matches,
  conversations, date plans, blocks, and safety reports get dating-specific
  privacy/moderation rules. Reuse `Task` only for the mission-output part of a
  date via `DatingDatePlan.campaignTaskId`, e.g. flyers, QR posters, outreach, or
  meetup follow-up.
- `/humanity-v-government` and `/court` still need to unify plaintiff
  registration, verdict voting, and treaty settlement.
- Visual review includes email screenshots; preview DB drift and unexplained
  missing screenshots still waste review time.
- **EOS landing v2: Government of Tomorrow showroom (Mike-approved direction +
  copy gate 2026-07-03, branch `feature/eos-government-of-tomorrow`):**
  investor pitch replaced by product catalog — masthead "your application was
  accepted at birth" (closes the 2026-06-09 masthead item), IN STOCK hero,
  departments grid (Optimitron, dFDA, DIH, Court of Humanity, Department of
  Peace, Automated Revenue Service, Universal Security Administration,
  Aligned Election Commission — all priced by generated params), service
  counter (curated managed tasks + escrow funding via `EosServiceCounter` /
  shared `FundingTaskCard`), investor content (calculator/terms/data-room
  CTAs/legal gate) moved to `/fund`, one shareholder footer strip on `/`.
  "Decentralized Federal Reserve" card deliberately dropped — ARS + USA cover
  it without $WISH adjacency. Still open: `/invest` (Loving Takeover / Fund I)
  deferred until securities/legal copy is reviewed. Known flake:
  `pledges.server.test.ts` threshold-event race fails under full-suite
  parallelism (P2034 serialization), passes isolated — pre-existing from
  PR #98. Follow-ups needing the manual-repo parameter pipeline
  (`manual/dih_models/parameters.py` — the TS file is generated, do not
  hand-add): (1) `AUTOMATED_REVENUE_SERVICE_TX_TAX_RATE` (0.5%) so the ARS
  card's rate is a ParameterValue; (2) `US_TAX_CODE_PAGES` (74,000) behind
  the "17.5 Harry Potters" line; (3) params for the drug-war thermostat
  panel stats ($1T, 6,000→107,000 overdose deaths, 53 years) which are
  manual-verbatim but uncited on the panel. Cold-stranger follow-ups
  (2026-07-03 run, screenshots `packages/web/output/cold-stranger/`):
  (a) ParameterValue citation-dialog LaTeX clips off-screen on mobile
  (pre-existing, site-wide); (b) AUDIT: treaty task renders "Task value
  $84,787T" — implausible (>5,000x annual peace dividend), check
  selectedImpactFrame EV computation/units; (c) /fund calculator shows
  fail-pays-more ($64k vs $35k) with the military-contractor-stock
  explanation two screens below the numbers — move into same viewport;
  (d) cross-domain vote CTA (optimitron.com → warondisease.org) reads as
  brand whiplash to strangers — partially mitigated by naming the treaty
  in the hero; consider an interstitial or shared brand cue. (e) DoP
  manual page (`department-of-peace.qmd`) upgrade queued: buy-order robot
  framing + Megatons-to-Megawatts params (20k warheads → ~10% US
  electricity 1993–2013) so the card's lightbulbs line gets citations.
  Plans: `.claude/plans/eos-landing.md`, chat copy doc 2026-07-03.
- **Earth Optimization Machine page (Mike-approved 2026-07-03, queue after
  MCP-fix + cause-split):** one canonical "what is the machine" page — the
  appliance tour: inputs (census, transmit, what 10,000 jurisdictions tried)
  → organs (RAPPA/Wishocracy ranks what people want, OPG writes laws, OBG
  writes budgets, dFDA ranks treatments, automated treasury moves money) →
  output (the two Scoreboard numbers: HALE + median income). Assemble from
  EXISTING manual content (manual-search first; the "It's an appliance"
  framing is already written); Mike copy gate before ship. Link targets:
  footer brand "The Earth Optimization Machine" + a home for the
  cause-split's proof-layer tasks (Ship the OPG, Ship RAPPA) to point at.
  Also the canonical URL for fix-ai training corpora asking "what is
  Optimitron". Route TBD (`/machine`?). Own small branch.
- **Task tree: manual mechanisms seeded (Mike-approved 2026-06-10, working
  tree, uncommitted):** added `program:loving-takeover` (+ own-one-share,
  love-letter, optimize-lobbying children), `program:earth-optimization-prize`
  (→ /prize), `program:eos:capitalize` (→ /fund) to
  `packages/db/src/managed-data/optimize-earth-task-tree.ts`, and
  `expectedEconomicValueUsdBase`/`successProbabilityBase` to ManagedTaskRecord
  sync (values imported from `@optimitron/data/parameters`, never hand-typed).
  Follow-ups: (1) backfill EV fields on the EXISTING court/treaty seed
  programs from treaty params; (2) add an EOS-capitalization EV parameter —
  `TODO(param)` marker in the seed; (3) IABs deliberately deferred (Phase 2,
  gated on prize success); (4) a site route for the Loving Takeover so the
  endpoint stops pointing at the manual. Needs its own branch/PR after #88.
- **EOS landing: "every president" masthead copy — DONE 2026-07-03** in the
  Government of Tomorrow redesign (exact approved sketch shipped as the
  masthead status line). The lobbying-figure rule stands for any future
  lobbying claim on this page: `US_TOTAL_LOBBYING_ANNUAL` (~$4.4B) for the
  all-corporations claim — NOT `DEFENSE_LOBBYING_ANNUAL` (~$198M).
- **Task tree: cause-node split + seed ALL 35 missing solution tasks
  (Mike-approved 2026-07-02/03):** full plan + tree diagrams in
  `.claude/plans/task-tree-cause-split.md`; complete manual-vs-tasks audit
  (50 solutions × 52 tasks, matched/missing/cruft) in
  `.claude/plans/task-tree-cause-split-audit.json`. Decisions: seed all 35
  missing tasks ("users can make those institutions" — includes OPG/RAPPA
  proof-layer builder tasks); biggest gap = NO referral task ("get two more
  humans to vote"), priority-2's only exponential mechanism; bed-nets task
  KEPT, parent under Eradicate Disease (also fixes its null-parent rule
  violation); write a manual page for Earth Optimization Missions (the two
  mission tasks have no manual source). Single tree parent stays
  (attribution math); cross-cause links via existing `TaskEdge`
  (`INCREASES_PROBABILITY_OF`/`ACCELERATES`), surfaced in UI. `/missions`
  route is TAKEN — cause pages name TBD (`/causes`?). Own branch after
  PR #97 merges; diagram-before-code satisfied by the plan file.
- **Task funding end-state: assurance-contract escrow (Mike-approved
  direction, 2026-07-03):** apply the campaign's own conditional-commitment
  mechanism to task funding. Flow: pledge = Stripe SetupIntent (card saved,
  $0 charged) → target fully funded = off-session charge (money becomes
  real; worker has assurance) → claim verified = payout (rail from PR #97,
  reused unchanged) → target expires/cancelled or task dies = automatic
  refund of anything charged. Keep instant "pay now" checkout as a secondary
  option. Wire the never-used `TaskFundingPledge.calledAt`/`fulfilledAt` as
  the decline-recovery email flow (saved card fails at charge time → email a
  pay-now link; expect ~2–5% declines, over-pledge buffer covers it). Why:
  conditional money is near-free to commit (Kickstarter/assurance-contract
  psychology) → maximizes committed funds; makes the progress bar
  enforceable rather than decorative; makes "Nothing proven, nothing paid"
  true for donors, not just workers. Zero users today = no migration; build
  the end-state once instead of the intermediate thing twice. Known gaps it
  closes: pledges currently promise-only (THRESHOLD_MET is a no-op event)
  and paid money strands with no auto-refund. NEXT BRANCH after PR #97
  merges (Mike 2026-07-03: "finish up assurance contract escrow now");
  cause-split follows it. Keep task funding treasury-separated from
  Prize/IAB economics — plain assurance (refund), NOT dominant assurance
  (refund+bonus is the Prize's mechanic).
  - Deferred (CodeRabbit PR #98, verified real but low-probability):
    `refreshTaskFundingTargetStatus` races between a plain-transaction
    settle (webhook decline/success) and a concurrent serializable pledge
    create on the same target can leave `taskFundingTarget.status` stale
    (e.g. OPEN while sums meet target, so `retryCallableCharges` skips it
    until the next mutation). Money paths are safe — the planner re-derives
    sums under `withTaskFundingLock` and never trusts `status` — and
    locking only the settle path would NOT close the race because pledge
    creation doesn't take the advisory lock. Real fix is routing all
    status-affecting writes (including `createOrReplaceTaskFundingPledge`)
    through the task lock; do it when touching the pledge-create path.
- **MCP getTask double-escapes nested child descriptions (found 2026-07-03,
  fix immediately after escrow branch):** child rows inside a parent
  `getTask` response carry literal `\n` (verified: all 11 children of
  `teach-ais:2026-q3` corrupt in-payload while the SAME rows fetched
  directly are clean; DB verified clean locally and on prod samples). The
  double-stringify lives in the mcp-server.ts getTask child/enrichment
  path — find and fix. This is a CONTAMINATION VECTOR: agents reading
  parents via MCP get `\n`-littered text and paste it into new task bodies
  (prod tasks are being created via MCP daily). Also: (a) add a write-side
  guard in createTask/updateTask — description containing literal `\n`
  with zero real newlines is definitionally double-escaped → normalize;
  (b) one-time sweep of prod Task/TaskComment rows for literal-`\n` bodies
  to repair anything already contaminated. Do NOT "fix" by unescaping at
  render — that corrupts legitimate content and leaves other consumers
  broken. Mike reported seeing rendered `\n` on the site — confirm his
  exact URL against the sweep results.

## Active Review - 2026-05-19: Money and 4B Votes

Repo audit finding: the campaign machinery mostly exists. `/vote` and
`/treaty` mount the treaty flow; `AuthForm` now locks the email-login controls
after a sign-in link is sent; `/join` creates or opens organization tools;
organization pages expose a survey URL, email starter, website button, iframe,
preview, manager referral URL, and grant calculator; `/poster` has referral QR
printing; `/donate` and `/fund` exist; signatories rank humans and
organizations by attributable signatures; agent-readable mirrors and sitemap
coverage exist for the public campaign surfaces; tests cover the vote API,
referral attribution, invite-token paths, org endorsement, public detail
sitemaps, share/email templates, treaty vote clicks, login, and reminder flows.

Main gap: this is not yet packaged as a fundable distribution sprint. The
highest-value money path is a concrete 30-day institutional distribution sprint:
fund outreach to organizations with audiences, get them to endorse/embed/recruit,
and report signatures, organizations, referrals, and conversion bottlenecks.

Cost-benefit gate for near-term work:

| Proposed change | Benefit | Cost / risk | Decision |
| --- | --- | --- | --- |
| Write a 30-day funder/distribution sprint packet (`docs/funding-sprint.md` first; public page only after copy review) | Gives donors and partner orgs a concrete ask: budget, targets, proof links, and done conditions | 2-4 hours, no schema, no new UI required | Do now |
| Seed or curate the first outreach task queue in existing `Task` records | Converts "get organizations" into accountable follow-up work using the current task model | 0.5-1 day; avoid new outreach schema | Do after the packet if outreach starts |
| Polish `/join` and organization tools from first 5 real outreach attempts | Removes actual conversion friction at the organization step | 1-3 hours per observed issue; screenshots and copy approval required | Do only from observed friction |
| Add a cheap weekly metrics report from existing referral/org/vote tables | Shows whether money bought votes, orgs, referrals, or nothing | 2-6 hours; avoid a dashboard until reports are used | Do as a script/export, not a product surface |
| Redesign `/fund` or expand prize/fund mechanics | Could look more fundable, but funders need a concrete sprint first | High copy/UI review cost; risks leading with mechanism instead of distribution | Defer |
| Poster style selector, PDF export, OG variants | Useful if physical distribution proves real | 0.5-2 days plus UI screenshot review | Defer until poster scans/signatures show demand |
| Dating registry and per-app dating templates | Potential niche channel, but `/love` bio-template is already the cheap test | Schema, moderation, and privacy cost | Parked until `/love` attribution clears the threshold |
| Public-figure catalog | Could create social proof, but attribution disputes are expensive | New data policy, likely schema, manual source review | Defer until org sprint has traction |
| Full analytics dashboard | Useful later; premature if nobody reads the report | 1-3 days and another surface to maintain | Use SQL/export first |

Do not start a new feature unless it helps the sprint get money, convert votes,
convert referrals, convert organizations, or prove the quantified case to a
specific funder/partner.

## Backlog - Organization Join Task Scaling

- Keep the first 0-200 researched priority organizations in managed data when
  each row deserves code review. Build the bulk org-task import script when the
  target list crosses 200 researched organizations, not before. The script
  should consume reviewed CSV/JSON, upsert organizations and `Task` rows by
  stable source refs/task keys, and reuse the same organization join template.
- For 200-5K organization targets, store the roster outside git and import it
  through the script; do not add thousands of per-org rows to
  `managed-seed-data.ts`.
- For 5K+ targets, import from an external organization registry such as Form
  990, GuideStar, or Charity Navigator, then curate priority slices before
  assigning public join tasks.

## Active Checkout Launch Gates - 2026-05-20

- Deploy the commerce migration before enabling paid shirt checkout.
- Run managed-data sync after the migration so the shirt offer, variants, and
  CustomCat fulfillment mappings exist in the target database.
- Keep env limited to secrets/ops toggles: `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `CUSTOMCAT_API_TOKEN`, `CUSTOMCAT_SANDBOX`,
  `SHIRT_COMMERCE_ENABLED`, and R2 credentials. Do not put product or variant
  IDs back in env.
- Verify CustomCat catalog SKUs against `GET /catalog/952` using the live API
  token, then run one Stripe test-mode/sandbox CustomCat order end to end.
  Local verification on 2026-05-20 skipped because no local
  `CUSTOMCAT_API_TOKEN` was present.
- Only flip production `SHIRT_COMMERCE_ENABLED=true` after Stripe Tax, R2 public
  artwork URLs, CustomCat sandbox submission, and webhook retry behavior are all
  verified.

## Active Dating Foundation - 2026-05-20

- The first dating implementation should stay MVP: opt-in profile, photos,
  prompts, match questions, discover list, like/pass/intro, mutual-match
  messages, block/report, and optional mission-date plan linked to a `Task`.
- Do not turn normal dating mechanics into tasks. A like, intro, match, private
  message, block, or safety report is not campaign work and should not enter the
  task tree.
- Use existing `Task` records only when a pair chooses a concrete campaign
  activity: hang flyers, distribute QR posters, invite people to vote, host a
  singles meetup, or verify completion evidence.
- Before public launch: decide photo moderation policy, approximate-location
  display rules, minimum age/consent checks, DM reporting workflow, and whether
  dating profiles are visible only to opted-in dating users.
- Backfill `jurisdictionId` across the 25 new models added in PR #86
  (`DatingProfile` + 14 dating models, `CommerceOffer`/`CommerceOrder` + 6
  commerce models, `TaskFundingTarget` + `TaskFundingPledge` + `TaskFundingEvent`).
  CLAUDE.md requires it on every model. Deferred from PR #86 because adding
  it mid-deployment would require a coordinated schema migration + all server
  helpers + managed-data resync. Own PR: schema-only diff, default-backfill
  to the campaign jurisdiction, then update creators in a follow-up.

- Task-payout ledger hardening (deferred from PR #97, CodeRabbit-flagged;
  remaining items are heavy/schema-coupled — batch into one follow-up). The
  critical per-`taskId` double-allocation race is FIXED in-PR: `withTaskFundingLock`
  (Postgres `pg_advisory_xact_lock`) serializes each read+transition in
  `executeTaskPayout` / `queueTaskPayoutForVerifiedClaim` /
  `reconcileQueuedPayoutReadiness`, and `getAvailableTaskFundingCents` now
  reserves only committed states (READY/PROCESSING/TRANSFERRED) so competing
  claims resolve first-come instead of blocking. Remaining:
  - Reconcile `VERIFIED` claims on paid/bounty tasks that have no `TaskPayout`
    row (queue-failure after claim marked VERIFIED currently only logs).
    Add a cron scan re-invoking `queueTaskPayoutForVerifiedClaim`.
  - Idempotency key on the `/v2/core/accounts` create in
    `getOrCreateStripeConnectedAccount` + catch the `userId` unique race and
    reload the existing row (currently the `userId` unique index makes the
    loser error rather than create a usable phantom, so low blast radius).
  - AbortController timeout in `stripeV2Request` so onboarding/status/payout
    routes can't hang on a slow Stripe connection.
  - Schema-boundary DB invariants for the funding ledger (require the
    coordinated schema-only migration above — new migration + schema.prisma
    edit needs Mike's approval; the applied migration file must not be
    hand-edited): CHECK(`amountCents` > 0) on `TaskFundingPayment`/`TaskPayout`;
    composite relation `(targetId, taskId)` on `TaskFundingPayment`;
    align `TaskPayout.(taskClaimId, taskId, payeeUserId)`; switch
    payment/payout FKs off `Cascade` (use `Restrict` for anchors, `SetNull`
    for optional identity snapshots) so hard-deleting a Task/CommerceOrder/User
    doesn't erase durable ledger history.

## Active Handoff - 2026-05-13

- Codex hook cleanup: Mike prefers deleting repo-local `.codex` hooks instead of
  condensing them. The intended change is to remove `.codex/hooks.json` and
  `.codex/hooks/*`; keep `.codex/agents/*` and `.codex/config.toml` MCP config.
  The hooks were mostly Claude-Code guardrails and add friction/background risk
  for Codex.
- Adaptive email rendering: the bug was a process-wide `renderSurface` global
  leaking between async email renders and normal web renders. The safer shape is
  React context via `EmailRenderSurface`, plus a regression test proving an async
  email render does not affect a web render. Watch the `"use client"` boundary:
  if `components/adaptive/index.tsx` or `ParameterValue.tsx` must be client-side
  for web pages, also verify `/dev/email/*` still renders server-side.
- Verification already run for the adaptive/email fix: `pnpm --filter
  @optimitron/web exec tsc --noEmit`; focused Vitest suite covering adaptive
  components, `ParameterValue.email`, share footer, monthly digest, post-vote
  share email, first-conversion email, magic-link host dispatch, and share
  message; direct `renderPreviewBodyHtml` for all six email previews. The dev
  `/dev/email/*?raw=1&full=1` route timed out while `copy:preview` had the Next
  dev server overloaded, so re-check it after the server is calm/restarted.
- Parallel-agent boundary: `packages/web/src/app/employees/page.tsx`,
  `packages/web/src/components/tasks/PresidentManagementSystemSection.tsx`, and
  `packages/web/src/lib/tasks/overdue.ts` were already staged by another agent.
  Do not unstage, revert, or fold them into unrelated commits.
- Process note: another `copy:preview` run drove the Next dev child above 10 GB
  private memory. I stopped only the `copy:preview` worker chain; the shared
  `3001` dev server stayed up and root responded afterward.

## P0 - Conversion and Email Safety

- **Login page: excess space between slider (CTA / framing element)
  and the submit button pushes the submit below the fold.** Reduce
  vertical spacing so the entire form is visible above the fold on
  common mobile viewports without scrolling. Audit gap-* / mt-* / py-*
  on the AuthForm container.
- **Server-side sign-in-link send rate limit is a defense, not the next
  product bottleneck.** Client-side repeat-send spam is already mitigated by
  `AuthForm`'s `hasSubmitted` state hiding the email/Google/demo controls after
  success. Add a server-side limiter only if Resend/auth logs still show repeat
  sends after the UI fix, or before a high-volume outreach push. Avoid an
  in-memory limiter as a false guarantee on serverless.
- **Add a min-font-size validation pass — emails first, then web.**
  We need automated detection so this doesn't recur. Two layers:
  - **Email-specific Playwright test:** render every email preview
    via the existing `pnpm copy:preview` / `email:preview-md` flow,
    walk every text node in the rendered HTML, fail if computed
    `font-size` < 14px UNLESS the node has an explicit `data-allow-
    small="footnote"` opt-out attribute. Reuses the existing
    `contrast-audit.spec.ts` pattern at `packages/web/e2e/`.
  - **Web ESLint rule** (faster, complementary): flag JSX
    `className` patterns containing `text-xs`, `text-[N]px` with
    N<14, and inline `style={{ fontSize: "<14px" }}`. Allow
    overrides via `// eslint-disable-next-line min-font-size`
    comments naming why. Lives in the existing ESLint config
    alongside the strict-mode rules.
  - **Long-term:** replace numeric `fontSize` with named tokens
    (`body`, `lead`, `caption`, `footnote`) in
    `adaptive/email-styles.ts` so the size policy lives in ONE
    place and surfaces use semantic intent. Token-based then the
    lint rule has a clean allowlist to enforce against.
- **Poster follow-ups after v1.** `/poster` now exists with a logged-in
  referral QR, generic logged-out QR, compact copy affordance, letter/A4 print
  CSS, and the default treaty-editorial style. Remaining: style selector, OG
  image variants, optional PDF download, and share-template text selection if
  printed posters become a measured channel.
- **Apocalypse framing standardization follow-up.** Canonical War on Disease
  site description exports exist, but source and generated copy still contain
  direct "apocalypse" phrasing in route metadata, referendum-site copy, managed
  task triggers, Grandma Kay seed text, and share templates. Finish only after
  the copy gate approves one standardized phrase.

- **Other human-language candidates while we're sweeping copy:**
  - `"magic link"` in user-facing error strings (`/auth/signin/page.tsx:12`
    *"That magic link is invalid or has expired."* + AuthForm error
    fallback *"Unable to send a magic link right now."*). Non-tech users
    don't know what a magic link is. Use `"sign-in link"` or `"email
    login link"`. Keep `magic-link` as the internal slug / file name —
    only the user-visible strings change.
  - KEEP (intentional Wishonia-voice satire — do NOT change):
    `"Humanity Manager"`, `"promoted to"`, `"subordinate humanity
    managers"`, `"Earth Optimization Services LLC"`, `"Earth Optimization
    Points"`, `"AEOSP / Authorized Earth Optimization Services
    Provider"`. These are the corporate-org-chart joke, not jargon.

## P0 - Increase Treaty Vote Conversion

### Keep `/treaty` boring and fast

- Preserve the one-page skim-and-sign treaty flow: headline, treaty body,
  signature box, YES/NO. No stepper, slide split, competing Court CTA, or
  decorative explanation before the vote.
- After the PR #75 managed referendum sync reaches production, regenerate and
  commit the treaty/h-v-g/join markdown snapshots so citation URLs reflect
  the fixed upstream manual refs.
- Keep treaty copy parameter-backed. Do not hand-type 4B, 32 rounds, 122
  apocalypses, trial multiplier, or eradication-timeline numbers where a
  `ParameterValue` or generated parameter exists.

### Make the logged-in dashboard a command surface

- Dashboard top priority: vote/verdict status, canonical share message, plaintiff
  status, assigned campaign tasks.
- Remove duplicate embedded surfaces from the dashboard when a dedicated page
  exists. Presidents belong on `/employees` or its eventual rename; full treaty
  text belongs on `/treaty`; signatories belong on `/signatories`.
- Add the Humanity Manager status panel only when it increases the next action:
  direct converts, overdue humans, overdue presidents, and one copy action.

### Simplify task execution

- Task-list rows should behave as one link to `/tasks/<id>`. Assignee names and
  avatars inside lists should not trap row clicks; assignee navigation belongs on
  the detail page.
- `/tasks` page redundancy: the top section heading is "Humanity's Tasks" but
  the root row chip shows assignee `"You"` (because `isAssignedToYou` is true
  for any humanity-org-assigned task), then a separate "Your Tasks" section
  appears below. Hide the assignee chip on the Humanity's Tasks section
  (section heading already establishes the context) — the empty-state "Your
  Tasks" CTA below should also render via the same task-row component as the
  rest, not a one-off `TreatyVoteCta` box.
- Task-table column hiding: when no task in a given task-list rendering has a
  value for a column (e.g. Military Budget on non-signer task sets), hide that
  column entirely rather than rendering empty cells. Today columns are static.
- Impact inheritance for tasks without their own numbers: recommendation —
  show "—" (no inheritance) for tasks without an `impact.selectedFrame`. Reason:
  inheritance from parent creates double-counting when aggregating children
  (sum of N children "inheriting" parent X gives N×X, which is wrong); explicit
  per-task numbers force data-entry discipline. If the empty cell feels too
  bare visually, fall back to "shows parent estimate — this task has no
  estimate yet" with the parent's number, but mark it as inherited and exclude
  from aggregations. Per-task overrides take precedence over parent values.
- On `/tasks/[id]`, keep title, assignee/avatar, due date, primary action,
  markdown body, comments, complete/reassign controls, and admin disclosures.
  Remove duplicated metadata blocks.
- Decide the logged-in task action label. Current "Claim Task" is bad. Working
  candidate: "Do this." Do not use "Take this on."
- Reframe enum labels in the viewer state strip so users do not see raw
  "Claimed / In Progress / Completed / Verified" workflow labels.
- Add one E2E regression that a signed-in user can open an assigned/private task
  from "Your Tasks" without hitting 404.

## P0 - Increase Referral Propagation

### Canonical share message and post-vote email

- The post-vote email is a single forward-friendly share kit fired when a YES
  treaty vote is counted. No drip sequence. No generic reminder spam.
- Canonical share-message wording now lives in
  `packages/web/src/lib/share-message.ts`. Keep dashboard, post-vote flow,
  monthly digest, and email footer aligned to that source.
- First-conversion email stays one-time only per referrer. Do not notify on every
  conversion.

### `share-templates.ts` is the source of truth for ALL reminder copy

- `packages/web/src/lib/tasks/share-templates.ts` is the canonical voice-variant
  registry: ~26 named templates (Trump versions, office memo, performance
  review, polite reminder, etc.) keyed by `recipientModes`
  (`leader | humanity | one_human | peer`) with token-based interpolation.
- Monthly-chain-digest and the shared email footer now read from
  `share-templates.ts`; `referral-first-conversion` inherits that footer.
  Remaining audit: `post-vote-share` still builds from `share-message.ts`, and
  `task-comment-notification` needs a final check for hand-rolled reminder copy.
- Every email module that includes reminder/share copy should pull
  recipient-appropriate templates from `share-templates.ts` where a reusable
  template fits. Hand-rolled copy stays only when no template fits AND a new
  template would be too narrow to reuse.

### Humanity Manager status report

- Replace direct-only monthly counts with transitive chain counts when the query
  is ready.
- The dashboard version should expose copyable messages for overdue humans and
  presidents instead of motivational filler.

## P1 - Organizations Endorse, Embed, and Recruit

- Persist the organization grant/application workflow: request data, review
  status, and follow-up outreach. The current calculator/request framing is not
  enough for operational follow-through.
- Keep organization attribution first-org-wins for `ReferendumVote`, matching
  `referredByUserId`. Later org links should not steal attribution.
- Keep neutral partner/embed copy where full Wishonia voice would make adoption
  harder. Partner-safe is not the same as bland.
- Adopt the "Authorized Earth Optimization Services Provider" framing for
  partner orgs in campaign-facing copy. Extends the corporate-promotion voice
  from the post-vote-share email: voters are Humanity Managers at Earth
  Optimization Services LLC; partner orgs are Authorized Earth Optimization
  Services Providers, each with a vendor-style certification badge they can
  display. Update `/join` to register orgs under this category. Per the
  neutral-partner-copy note above: keep the application form itself
  professional enough not to scare off serious nonprofits — AEOSP framing
  lives in campaign-facing pages, shared snippets, and the badge artifact,
  not the onboarding form.
- For the next sprint, do not build new organization admin surfaces before
  outreach proves the existing tools are the blocker. Current org pages already
  provide the share URL, email starter, linked HTML starter, website button,
  iframe, preview, manager referral URL, and grant calculator.

## P1 - Person/Org Conversion Surfaces (post-PR #81)

Roadmap from Mike's 2026-05-15 brainstorm. /people/[id] redesign lands in PR #81; the rest follow once that merges. Ship in this order for maximum reuse.

- **PR-A: Foundation-action seed tasks.** Seed `optimize-earth` task tree with concrete user actions: donate $1, print poster, hang flyer, social-share. New task category `campaign-action`. Hours-prevented impact metric per task. One file: `packages/db/src/managed-data/managed-seed-data.ts`. Smallest, lowest risk; unlocks PR-B and PR-C.

- **PR-B: `/orgs/[slug]` task display.** Mirror `/people/[id]` conversion-surface pattern onto org pages. Reuse `SufferingPreventedMetric` (extracted in #81). Wire `getOrganizationTasks` MCP to a page consumer. Primary CTA: ENDORSE (visitor not in org) vs SHARE (visitor's org already endorsed). Below-fold: org-completed tasks + member leaderboard.

- **PR-C: Add-org + assign-task UX.** Backend primitives exist (`createOrganization` + `createTask` MCP). New surfaces: `/orgs/[slug]/admin/tasks` for org admin self-assignment; `/admin/assign-task` (superuser, Mike-only) for cross-org. Gate behind superuser role until proper moderation. Audience: org admin who joined via `/join`, wants to coordinate their members.

- **PR-D: Hand-curated public-figure catalog.** Seed Person rows for top 50-100 public figures (scientists, politicians, celebrities). Each row: displayName, handle (`mlk`, `einstein`, `gates`), 50-word deadpan-Wishonia bio, 1-3 attributed campaign-relevant actions with documented public-statement sources, impact-estimate (DALYs averted, methodology-cited from `parameters-calculations-citations.ts`), `isPublicFigure: true` flag (new bool on Person). `/people/<famous-slug>` renders with "Public-figure record" eyebrow. Visitors can co-sign the figure's position.

- **PR-E: AI-cataloged public-figure activity (deferred).** Scale PR-D with NER on Wikipedia/news/govt records → impact-attribution model → manual-review pipeline. Scaffolding only after PR-D's manual seed proves the UX works. Not on the campaign critical path.

**Out-of-scope for this roadmap:** peer-task-assignment on `/people/[id]` (Mike deferred 2026-05-15; needs whitelist/opt-in moderation design — separate plan).

**Shared component reuse:** all five PRs share `SufferingPreventedMetric` (extracted in #81). No new design primitive.

**Risks:** public-figure attribution disputes (use only documented public statements; label "historical position, not active endorsement"); spam on `/admin/assign-task` (superuser-gated); org-task display competing with conversion CTA (keep task list below the fold).

Durable summary lives here; no loose `.claude/plans/campaign-impact-attribution-roadmap.md` file should be kept unless a fresh plan review starts.

## P1 - Plaintiffs and Court Framing

### `/humanity-v-government` plaintiff-first rework

- Primary action becomes plaintiff registration. Hero CTA: "Name your dead" or
  the strongest approved variant, not "Support the settlement."
- Show a running plaintiff count near the hero. Named plaintiffs are harder to
  ignore than an anonymous vote total.
- Build the public death/plaintiff stream: a constantly updating, moderated
  list of humans submitted by loved ones who recently died, shown as
  wrongful-death claims against the governments that kept buying apocalypse
  capacity instead of medical progress. Use represented people /
  `CourtCaseParty` data first; do not scrape or invent deaths for v1.
  Landing-page placement: below the primary treaty vote/referral action, not
  above it. Show the most recent named person, a ranked/recent list, and a CTA
  to "Name your dead" / register the estate. Tie the legal theory to the
  1900-counterfactual: disease deaths after the model cutoff and aging deaths
  after the aging cutoff are prima facie government-caused because a rational
  treaty could have redirected military growth to clinical trials and public
  goods. Reuse parameter-backed apocalypse / cutoff / damages claims; no
  hardcoded 122-apocalypse or 1950/1990 copy.
- Add the missing counterfactual sentence: damages are what humanity would have
  had if governments had signed the 1% Treaty in 1900, freezing military
  spending growth and redirecting surplus to clinical trials and public goods.
- Drop secondary hero CTAs to `/vote` and external evidence. Demote them below
  the plaintiff action.
- Collapse "usual defenses" into a disclosure. Remove decorative case-caption
  repetition. Move `DamagesSensitivityCalculator` next to the damages/vote
  context instead of burying it.

### `/court` as the operational Court surface

- Build `/court` around the case caption, plaintiff/juror count, defendant
  status, settlement progress, and one treaty/verdict CTA.
- Seed or sync the `Humanity v. Government` `CourtCase` row with claims, harms,
  evidence, parties, and the 1% Treaty settlement remedy.
- Add the 193 governments as respondent parties and drive status from treaty
  signature/ratification state.
- Surface implicit class membership on the dashboard before vote: "You are a
  potential plaintiff. Render your verdict to formalize your claim."

### Represented people and estates

- **Plaintiff-registration aspect-ratio handling is no longer P0.**
  `SquarePhotoCropper` is wired into user upload surfaces, and Grandma Kay now
  uses `/img/grandma-headshot.jpg`. Add managed-data validation for non-square
  seeded person images only when another seed image regresses or when plaintiff
  registration becomes the active sprint.
- Reframe memorial/deceased-person registration as filing a wrongful-death claim
  for the estate, with descendants as beneficiaries.
- Add pre-search before creating represented people: canonicalized display name
  + birth date + death date, then offer "join as co-next-of-kin" on match.
- Avoid schema work unless duplicate `Person` rows become a real operational
  problem. Optional later: indexed `Person.canonicalKey`.

- Earth Optimization Day stays separate until the case page is coherent. MVP:
  `/earth-optimization-day`, countdown/RSVP, existing verdict/treaty widgets, and
  `isEarthOptimizationDayWindow()` before seasonal CTA swaps.

## P1 - Remind Leaders and Treaty Signers

- Keep `/employees` as the president-accountability surface for now. Consider
  `/presidents` rename later if it improves comprehension.
- Dashboard should link to the president surface instead of embedding the whole
  management table.
- The government-side task wording is "Get 193 heads of government to sign."
  Avoid vague "get governments to adopt the treaty."
- Monthly status and dashboard panels should identify overdue presidents and
  provide copyable reminder language.
- Internal leader/signature tasks should stay under managed data, not ad hoc
  seed fragments.

## P1 - Discoverability and Trust

### Sitemap and evidence paths

- Split sitemap files by entity type when tasks/people/orgs approach the 500-row
  cap.
- Keep `1percenttreaty.org` as a separate shareable treaty domain. Do not collapse
  it into `warondisease.org/treaty`.

### Copy and citation quality

- Sweep public copy for startup-bro/system-architecture filler:
  `off-ramp`, `enforcement stack`, `incentive layer`, `coordination mechanism`,
  `primitive`, `substrate`, `fundamentally`, and similar.
- Replace abstractions with concrete user action, villain, number, or outcome.
- Keep a lightweight email/template validation test: render templates with
  fixtures, cap length, reject banned phrases, assert required tokens, and
  enforce one primary CTA unless the share footer is intentionally part of the
  action.

### Visual review and preview workflow

- Add a missing-screenshot banner to `latest.html`, auto-screenshot changed
  routes after preview READY, and write review pages under
  `packages/web/output/playwright/pr-watch/`.
- Investigate Neon branch-per-preview or preview-scoped managed-data sync.
- Add `/dev/email` index over `EMAIL_PREVIEWS`.
- Extract large GitHub Actions inline JavaScript blocks when touched again.
- **Preview deploy smoke test** (would have caught the 2026-05-14 stale
  `/plaintiffs` regression: Prisma error rendering on the PR #79 preview while
  production was healthy — preview DB out of sync with main):
  - One CI step that fires AFTER Vercel reports `deployment_status: ready`,
    hits ~5-8 critical routes against the preview URL with the
    `_vercel_share` bypass token, and asserts: HTTP 200 + body does NOT
    contain "Something went wrong" or "Application error" + the expected
    `<h1>` is present.
  - Routes to cover: `/`, `/treaty`, `/plaintiffs`, `/tasks`,
    `/humanity-v-government`, `/employees`, `/court`, `/people`.
  - Target: under 30 seconds total. NOT the full Playwright suite — that's
    slow + redundant with the existing local-build e2e + visual review.
  - Catches: preview DB drift, env var mismatches, Edge-vs-Node runtime
    errors, missing migration sync, generic 500s from Vercel.
  - Won't catch: internal logic bugs or UI regressions (already covered by
    existing CI against the local build).
  - Stash the bypass token in the GitHub `Preview` environment alongside
    `VERCEL_TOKEN`.
- **Production smoke test after deploy** — same shape as the preview smoke
  test above, pointed at production after every prod deploy. Same routes,
  same assertions (200 + no error-boundary text + expected `<h1>`). Catches
  the bug class where a query works against demo/seed data but explodes
  against real production data shape (NULL relationships, large row counts,
  edge-case user states). Run as a GitHub Actions step on
  `deployment_status: production_ready` for the Vercel deploy.
- **Anonymized prod-DB fork for preview (parked)** — Neon branching + a
  one-shot anonymization step (hash emails, redact non-public-figure display
  names, null out signatures, keep schema shape + row counts). Solves the
  "preview data ≠ production data" problem properly. Engineering cost: ~1-2
  days + recurring maintenance as new sensitive columns land. Privacy is
  load-bearing — even with Vercel preview auth protecting against the
  public, team members + invited reviewers can see real data. Parked until
  campaign launch makes prod state diverse enough to bite regularly.

## P2 - Preserve the Governance OS as Proof Layer

- Optimitron supports the campaign. Do not rebuild the generic Optimitron
  homepage, feature archive, demo surfaces, or platform narrative while the vote
  funnel is the bottleneck.
- Keep managed data as the source for semi-permanent app records. Missing from a
  manifest must not imply delete; only explicitly retired managed records should
  be soft-deleted.
- Do not introduce a second task model. Personal/private, org-assigned,
  treaty-invite, and agent-proposed work all remain `Task` rows with scoped
  ownership/visibility.
- Outreach stays on `Task`, `TaskCommunicationEndpoint`, `TaskCommunication`,
  `TaskComment`, `ReferralInvitation`, `ShareAttempt`, and `EmailLog`. Do not add
  special outreach models without a real path that the existing model cannot
  cover.
- `allowsUserSubtasks` schema work is parked. Existing schema is enough until
  public subtask creation UI is immediate.
- Funding split: retail donations fund campaign operations; chain treasuries are
  a separate prize-pool track after institutional-host signal. Do not divert
  Stripe/Endaoment charitable donations into the prize contract.

## Durable Guardrails

- Read the relevant `AGENTS.md` before package edits.
- Prisma schema or exported `@optimitron/db` type changes require explicit human
  approval.
- Library packages must not import Prisma client or runtime DB code; use
  `import type` for cross-package type imports.
- `@optimitron/optimizer` remains domain-agnostic: predictor, outcome, variable,
  measurement, effect size.
- Never write tests that only assert mocks were called. Test shipped behavior or
  a real regression boundary.
- Never merge PRs. When checks are green and valid review complaints are handled,
  report ready for human review/merge.
- Plan files (under `~/.gstack/projects/<slug>/`) MUST include a Cost-Benefit
  Matrix section before `/autoplan` final-gate review. Enforced by
  `.claude/hooks/enforce-cba-table-on-plan-files.mjs`.
- New-feature plans MUST acknowledge existing routes/branches/commits matching
  the feature noun before drafting. Enforced by
  `.claude/hooks/enforce-feature-preexistence-check-on-autoplan.mjs`.

## Parked Unless They Directly Unblock 4B

### Dating registry — deferred until `/love` proves attribution

- `Person.isOpenToDating` + `/love/registry` browse + email-bridge messaging —
  full plan reviewed 2026-05-19 by `/autoplan`, deferred per CBA verdict.
  `/love` bio-template page already shipped at
  `packages/web/src/app/love/page.tsx` (commit `ba27f38d`).
- Kill threshold: ship only if `/love` bio-template channel produces ≥X treaty
  signatures attributable to dating-bio referrals per 30 days.
- Wishonia-voice copy expansion (per-app Tinder/Hinge/Bumble templates,
  follow-up scripts, QR date-card variant) also deferred until `/love`
  instrumentation proves per-app variants matter.

### Internationalization — centralize copy into a single message catalog

- All user-facing copy currently lives inline in `.tsx` components, email
  modules, `share-message.ts`, `share-templates.ts`, managed task descriptions,
  `routes.ts` metadata, and external manual pages. Voice review (Wishonia
  rules, qa-editorial, voice-critic) currently greps prose in source.
- Strategically correct migration target: a single `messages/en.json` (or
  `packages/web/src/messages/en/*.json` split by surface) feeding a typed key
  catalog, so the same prose can be translated to other locales without
  forking React components.
- **Cost vs. benefit today:** thousands of strings to extract, voice review
  becomes harder (key-in-JSON harder to scan than prose-in-JSX), and the
  campaign is English-only until the 1% Treaty has English-speaker traction.
- **Trigger to start:** either (a) English campaign demonstrates a verified-
  voter trajectory that justifies non-English rollout, or (b) a specific
  non-English country is targeted for launch. Until either happens, every
  hour spent on i18n plumbing is an hour not spent on the current English
  conversion funnel.
- **When started:** lift `share-templates.ts` first (already token-based and
  the closest shape to an i18n catalog), then email modules, then component
  copy. Don't try to migrate everything in one PR.

- Multi-agent/service-account architecture plans; AP2 / ACP / x402 payments.
- Optimitron root rewrite and `/features` archive.
- WISH airdrop, VOTE-for-task-completion, monthly distributions,
  DAO-governed funding. (Donate-to-fund-task marketplace + Stripe Connect
  payout disbursement landed in `feature/task-donations-connect-payouts` /
  PR #97.)
- DIH migration, generic referendum/commission/EV-calculator work outside the
  campaign path, and broad email file renames.
- **Adopt `@openai/codex-sdk` for Codex dispatches.** Current dispatches
  go through Bash → `codex exec '...' < NUL > log 2>&1` with the
  enforce-codex-protocol hook gating substantive work. The SDK gives
  us streamed agent events, parallel threads with stable IDs, and
  `turn/steer` / `turn/interrupt` mid-run — solving the wrapper-opacity
  and stdin-hang failure modes today's session demonstrated. Setup is
  `npm install @openai/codex-sdk` in a dispatcher script; was wrongly
  estimated as "couple hours of work" before — actual cost is small.
  Implement when we hit the first failure mode direct exec can't cover
  (mid-turn steering, parallel agent coordination). Sources:
  https://www.npmjs.com/package/@openai/codex-sdk,
  https://developers.openai.com/codex/sdk
- **Single black-and-white style migration.** Scope: ~560 `brutal-*` /
  `BrutalCard` references + most of `packages/web/src/components/ui/`
  legacy decorative shapes (`brutal-card`, `arcade-tag`, `game-cta`,
  `comparison-card`, `featured-info-card`, `icon-card`, `item-card`,
  `nav-item-card`, `numbered-step-card`, `rarity-badge`, `spending-bar`,
  `stat-bar`, `stat-card`). Migrate to retroui primitives + semantic
  markup matching the editorial treaty style. Phased: (a) inventory by
  page surface, (b) opportunistic migrate when touching a file (current
  policy — keep this until usage drops), (c) once `brutal-*` references
  drop below ~50, do a final sweep + delete the legacy files. Eventually
  assign to a long-running Codex agent. Admin / game-demo / email
  markup may keep specialized styling.
