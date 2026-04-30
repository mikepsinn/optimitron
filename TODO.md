# Optimitron TODO

This is the working checklist for Optimitron's task, expected-value, treaty, MCP, and funding work. The treaty migration is still the largest active product slice, but the direction is now a generic Earth optimization task system: every person, organization, agent, and AI worker gets ranked actions, task communications, and measurable outcomes through the same primitives.

## Working Context

This file is the compaction-safe control document. If a design decision is made in chat, add it here before starting the next code slice. Operating notes:

- Active workspace: `E:\code\optimitron`. (Earlier slices used `C:\code\optimitron`; either path is fine if the IDE session matches the shell cwd.)
- Treat `E:\code\dih-neobrutalist` as the source/reference repo for DIH features. Read-only unless a task explicitly targets DIH.
- Keep source repo and target repo names explicit in commits/notes so DIH build failures are not confused with Optimitron build failures.

**Done already (do not re-check unless behavior changes):**
- Treaty-flow redesign: full-screen `TreatyFlowShell` paper framing, Libre Baskerville typography, Love / Bossy mode toggle, math dialog modal, post-vote feedback → dashboard. Screenshot audit at `packages/web/e2e/treaty-vote-post-vote-screenshots.spec.ts`; output under `packages/web/public/img/screenshots/treaty-vote-post-vote-flow/`.
- Two numbered flow variants (`treaty_flow_v1_vote_first`, `treaty_flow_v2_context_first`) sharing slider + vote submission + verification + send-loop + analytics. URL override via `?treatyFlow=...`.
- `/vote` route owns the focused treaty flow; `/vote/[code]` referral redirects target it instead of the homepage anchor.
- E2E rule: focus on behavior + route/data contracts + screenshots, not brittle exact-copy assertions.
- `/donate` shows both conditional-on-success and 1%-success-probability suffering-years-per-dollar figures; founder email uses `m@warondisease.org`.
- Migration ledger P3009 from `20260425200000_create_task_comment_tables` resolved (stale shim row marked applied).

## Active Slice — Next (2026-04-30)

Prioritized work coming out of the recent design conversations on email cleanup, MCP GitHub passthrough, and the warondisease.org new-user flow. Sequenced so each item unblocks the next; do them in order. The big idea: the new-user funnel from landing → vote → magic-link → /humanity-management-training → /dashboard now exists end-to-end, but the dashboard surfaces noise (PMS + Treaty buttons) and the onboarding tree is missing two beats: (a) "publicly sign the treaty yourself" before sharing, and (b) a Stage-2 promotion that turns finished Humanity Managers into President Managers with a leader-lobbying task.

### Recently landed (this session, 2026-04-29 → 2026-04-30) — informational

**Email cleanup + voice (committed earlier in session):**
- [x] Stripped chrome / breadcrumbs / "New activity" / "OVERDUE" banners / author-label-in-body from magic-link, comment-notification, overdue-reminder templates.
- [x] Lumbergh voice landed in nag/escalation surfaces only (overdue reminder subjects + body, magic-link mild). Deadpan-corporate stays elsewhere by design.
- [x] Sender sign-off support in comment-notification email (`senderSignature: { name, role?, org? }`); Wishonia auto-append at Resend layer now skipped when `from` override is set so share emails sign as the sender, not Wishonia.
- [x] Mortality-stat line in overdue reminders ("About 450,000 people died waiting in the meantime, just an FYI") at ~150K/day from `GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES`.

**MCP GitHub passthrough (committed earlier in session):**
- [x] `githubApi` generic passthrough tool added; existing `searchRepo`, `getFileContent`, `listRepoFiles` bumped to admin-only.
- [x] New `GITHUB` MCP scope split from `TASKS_ADMIN`; migration `20260429220000_add_mcp_scope_github`.
- [x] Saved `feedback_email_minimalism.md` memory: future email work stays minimal, share emails override From + CTA.

**S1 Dashboard cleanup + onboarding tightening (uncommitted, pending):**
- [x] Dashboard restructured: primary-CTA card for next actionable subtask, collapsed `<details>` for "up next", green-checked "done" list at bottom. Dropped "Read the Treaty" + "President Management System" exit-ramp buttons.
- [x] Tasks sorted by seed `sortOrder` (sign 0 → share 10 → phone 20 → assign1 30 → assign2 40 → completeTraining 50). Renumbered with breathing room for future siblings.
- [x] New `signTreatyPersonally` subtask in user-onboarding:treaty blueprint at sortOrder 0 — gates HMT completion alongside the other 4 siblings. Action-link → `1percenttreaty.org/treaty`.
- [x] Tightened `shareReferralUrl` / `assignFirstHuman` / `assignSecondHuman` / `completeTraining` descriptions — no jargon, no instructional drift.
- [x] `taskListSelect` exports `sortOrder`; `TaskCardTask` interface gains optional `sortOrder` field.
- [x] `user-treaty-task.server.ts` + test updated to include `signTreatyPersonally` in required subtask kinds.
- [x] `WISHONIA_WELCOME_COMMENT` confirmed as dead code (no callers outside its own file). Flagged for deletion in S9.

**S2 Parameter-link rendering (uncommitted, pending):**
- [x] `linkParam(param, rendered)` helper in `triggers/context.ts`. Resolves manual page URL → calculations URL → source URL.
- [x] Every parameter in `buildTriggerParams()` exposes raw + `*Linked` variants (`militaryVsResearchRatio` + `militaryVsResearchRatioLinked`).
- [x] `USER_TREATY_DESCRIPTION` (the Promotion content) converted to linked variants for the markdown-rendered surfaces. Phone script intentionally stays raw (read aloud).
- [x] 5 new tests in `triggers/__tests__/context.test.ts` covering the contract.

**Site tracking (uncommitted, pending):**
- [x] Schema: `User.signupLandingUrl`, `ReferralInvitation.originUrl`, `ReferendumVote.originUrl`. All nullable, all single-column-per-row consistent shape. Variant key derived from URL host on demand. Migration `20260430110000_add_site_tracking_columns`.
- [x] First-write-wins capture in `applyPostSigninSync` (User), insert-time capture in vote and invitation routes.
- [x] Client-side `<SignupLandingUrlCapture />` mounted in `Providers.tsx`. Stores `window.location.href` to localStorage on first page load (idempotent). `AuthPostSigninSync` reads it from localStorage and posts at first signin.
- [x] `storage.setSignupLandingUrlIfMissing()` helper that never overwrites a previously-set value. `clearSignupData` includes the new key.

**Other:**
- [x] Hardcoded `ALLOWED_REPOS` in `github-repo-tools.server.ts` — dropped redundant `GITHUB_REPO_ALLOWLIST` + `GITHUB_DEFAULT_REPO` env vars from local `.env`, `.env.example`, and Vercel.
- [x] Magic-link email reverted from the brief mortality-line experiment back to bare Lumbergh-mild. Site-variant aware copy work scoped into S8.
- [x] **MCP error → Sentry wiring.** The MCP tool-dispatch catch block returns errors as JSON-RPC payloads (HTTP 200 with `isError: true`) instead of throwing, which means Sentry's `onRequestError` hook never sees them. Same for auth-failure 401s. Added explicit `Sentry.captureException` calls inside the tool-dispatch catch (with `mcp.tool` + `mcp.surface` tags + userId + args context), inside the auth-token-verification catch in `app/api/mcp/route.ts`, and a top-level transport-level try/catch on the route. Dynamic import of `@sentry/nextjs` so dev/test bundles don't choke when Sentry isn't initialized. Now MCP errors actually show up in Sentry dashboards. (User-facing message in Claude Desktop is still bounded by what Anthropic's client surfaces from the `isError: true` content payload — separate concern, can't fix server-side.)

Verification at end of session: 1034/1034 vitest, `pnpm exec tsc --noEmit` clean.

### S1 — Dashboard + onboarding cleanup (Stage 1)

Concrete diff, ~2-3 hr. Land first.

- [ ] Drop "Read the Treaty" and "President Management System" nav buttons from `HumanityManagementDashboardClient.tsx`. They're exit ramps from the dashboard's actual job (get the user through the 5 HMT subtasks).
- [ ] Restrict the dashboard task list to `taskKey.startsWith("program:one-percent-treaty:user:<userId>:")`. Today `nextTasks` is mostly already filtered correctly; verify nothing else leaks in (e.g., signer-reminder subtasks claimed via MCP).
- [ ] Sort the task list by the seed's sortOrder (0/5/10/20/30), not by created/updated, so users hit them in the persuasion-optimized order: share → phone-script → assign1 → assign2 → training-completion.
- [ ] Restructure dashboard to "next task primary CTA + collapsed up-next + done": one big card showing the next-actionable subtask, a `<details>` disclosure with the rest, completed rows green-checked at the bottom. Showing 5+ tasks at once is paralyzing.
- [ ] Add `signTreatyPersonally` subtask to the `user-onboarding:treaty` blueprint at `packages/web/src/lib/triggers/blueprints/one-percent-treaty.ts`:
  - `kind: "signTreatyPersonally"`, `sortOrder: 0` (first)
  - `titleTemplate: "Sign the 1% Treaty publicly"`
  - `descriptionTemplate`: short Wishonia-deadpan line about public commitment vs. private vote
  - `actionLinkUrlTemplate: "https://1percenttreaty.org/treaty"`, `actionLinkLabelTemplate: "Sign the treaty"`
  - `contributesToGate: true`
  - Update `user-onboarding:treaty:hmt-gate` `completionGate.subtaskKinds` to add `"signTreatyPersonally"` so all 5 siblings (sign + share + phone + assign1 + assign2) gate `completeTraining`
- [ ] Tighten `shareReferralUrl` description (replace "lineage" jargon with plain language).
- [ ] Tighten `assignFirstHuman` / `assignSecondHuman` descriptions — keep "If they vote, they get promoted too", drop everything else.
- [ ] Add ONE mortality-stat line to magic-link email between the button and the anti-phishing line: `"About 150,000 humans will die from disease today. The treaty you're about to vote on shortens that timeline."`
- [ ] Update `task-comment-notification-email.test.ts` + `task-overdue-reminder.test.ts` for any text-content changes; full vitest green before handing back.

### S2 — Parameter-link rendering in templates

Concrete, ~1-2 hr. Land second so S3 can use it.

- [ ] Add `linkParam(p, { format? })` helper alongside `roundParam()` in `packages/web/src/lib/triggers/context.ts`. Returns markdown link `[604](url)` resolving the URL via priority: `manualPageUrl` → `calculationsUrl` → `sourceUrl`.
- [ ] Extend `buildTriggerParams()` to emit two variants per parameter: `militaryVsResearchRatio` (raw) and `militaryVsResearchRatioLinked` (markdown).
- [ ] Convert markdown-rendered template surfaces (parent task description, future HTML emails) to use the linked variant.
- [ ] Phone-script body keeps the raw variant — read aloud, URLs would be ridiculous.
- [ ] Add tests: phone-script body has no `[`, parent-task description has at least one `[N](https://...)`.

### S3 — Stage 2: President Manager promotion

Multi-day; land AFTER S1 + S2 are live and after some real users go through Stage 1 to validate the funnel.

- [ ] New blueprint trigger `user-onboarding:treaty:promotion-stage-2` firing on `task.statusChanged.VERIFIED` with eventFilter for `taskKey.matches "^program:one-percent-treaty:user:.+:completeTraining$"`. Spawns:
  - Promotion message comment on the user's HMT root: "🎉 PROMOTION — You are now an Acting President Manager at Earth Optimization Services."
  - One per-user task pre-targeted to the user's country leader: `"[Leader name] is N days overdue on their treaty signing"` with action-link to the leader's contact page.
  - Resolution: user.countryCode → matching `treaty:signer` slot. If no slot match (small country, leader not in the 193-slot list yet), spawn a generic "find your leader" task instead.
- [ ] Activate the existing `treaty:signer` blueprint trigger (currently `enabled: false`). It already exists for the dataset import; flip it on once Stage 2 has somewhere for the user-leader pairing to land.
- [ ] Dashboard updates: when the HMT root has Stage-2 spawned tasks, show the promotion banner + new task as the new primary CTA. Past HMT tasks collapse to "✓ done" rows.
- [ ] Open question, do not commit: Stage 3 (after the leader signs) — do they get another role-play promotion, or does the parent task ("Get 4 billion to vote") just keep running with referral-chain visualization? The role ladder needs an answer before launch but it's not blocking S3.

### S4 — Voice + copy audit (verification pass)

~30 min. Land before launch, after S1-S3.

- [ ] Walk every user-facing string in the warondisease.org flow (landing → vote → email → /hmt → /dashboard → each subtask page). Confirm:
  - Lumbergh appears ONLY in: overdue/escalating reminders, magic-link mild ("Yeahhh, here's your sign-in link").
  - Deadpan-corporate-HR appears in: promotion screen, KPIs, dashboard headings, role titles.
  - Plain imperative appears in: action labels, CTAs, validation errors.
- [ ] Audit `ReferralInvitationStatusCard` + `ReferralInvitationComposer` for any drift toward instructional/help-doc voice.

### S5 — Visual flow audit harness + critique loop

User-flagged 2026-04-30. **Layer 1 local harness done (codex — 2026-04-30); preview-comment wiring still pending.** The funnel from landing → vote → email → /hmt → /dashboard exists, but right now we only see it by clicking through manually. Two layers to build:

**Layer 1 — Static screenshot capture (worth doing soon):**

- [x] *(codex)* Add a Playwright spec at `packages/web/e2e/new-user-flow-screenshots.spec.ts` that walks the new-user funnel for warondisease.org, optimitron.com, 1percenttreaty.org, and dfda.earth using a fresh user per run. Treaty-capable hosts capture landing, slider mid-state, slider submitted, magic-link email body (rendered HTML), dashboard immediately post-signin, /humanity-management-training, dashboard after first subtask verified, and dashboard after all 5 HMT gate subtasks are verified. dFDA does not expose the treaty/HMT route, so the harness records the landing/email/dashboard frames and flags the skipped treaty frames in the generated index.
- [x] *(codex)* Output a `<repo>/screenshots/new-user-flow/<variant>/<viewport>/<step>.png` set + a `<repo>/screenshots/new-user-flow/index.html` static page that lays them all out side-by-side per variant for visual review. Include desktop + mobile widths. Repo-root `screenshots/` is already gitignored (`.gitignore:70`) and isn't watched by Next.js dev-server / shipped by Vercel — avoids the file-watcher churn + deploy bloat that `public/` would cause.
- [ ] Wire this into Vercel deployment preview comments: a GitHub Actions job runs the spec against the preview URL and posts the static index.html link to the PR. Fail the check if any frame errors out (server crash, missing element).
- [x] *(codex)* Reuse the existing screenshot infrastructure at `packages/web/e2e/treaty-vote-post-vote-screenshots.spec.ts` — same dev-server-reuse pattern, same output-folder convention. Registered as `pnpm --filter @optimitron/web run e2e -- new-user-flow-screenshots --reporter=list`.

**Layer 2 — Automated critique (speculative, do after Layer 1 stabilizes):**
- [ ] After-deploy hook: pipe the captured screenshots + the `todo.md` "Active Slice" objectives + the rendered task descriptions to Claude/Gemini with a prompt of "given these objectives and these screens, what's reducing the chance the user completes the task tree?" Capture the output as a PR comment, NOT an automatic todo.md edit. Auto-mutating the todo from an LLM critique is too easy to get wrong silently.
- [ ] Stage 2 (only if Layer 2 produces signal worth chasing): give the critique agent permission to PROPOSE todo.md changes via PR, with a human reviewer in the loop. Never auto-merge.
- [ ] Acceptance for Layer 1 alone: a reviewer who hasn't touched the codebase in a week can scan the index.html and identify the funnel state in 30 seconds. Acceptance for Layer 2: critiques surface at least one non-obvious issue per release that a human reviewer would have agreed with in a blind comparison.

The reason this is worth investing in early: every change to a TaskTrigger blueprint or a dashboard component changes what the new-user funnel looks like. Without a visual snapshot, regressions land silently. The task-management framing helps — most of the funnel state IS just trigger blueprints + dashboard components, both of which we control directly. A normal app would need to re-discover state across many flows; here the state IS the trigger graph.

### S6 — HMT graduation quiz

User-flagged 2026-04-30. After the Humanity Management Training subtasks verify, gate the Stage-2 promotion behind a multiple-choice quiz that confirms the user can actually articulate the case to skeptics. The point is not gatekeeping; it's that a Humanity Manager who can't explain why they're recruiting will fail at recruiting.

**Question bank (each backed by a citable parameter / source so the answer key links to the manual):**
- [ ] How many nuclear-winter-scale apocalypses does humanity currently have weapons capacity for? *(target answer: ~122; parameter `NUCLEAR_WINTER_OVERKILL_FACTOR`)*
- [ ] What is the ratio of military spending to government clinical-trials spending? *(~604x; `MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO`)*
- [ ] At current throughput, how long to clear the disease-treatment queue? *(~443 years; `STATUS_QUO_QUEUE_CLEARANCE_YEARS`)*
- [ ] At dFDA throughput (1% Treaty redirect), how long? *(~36 years; `DFDA_QUEUE_CLEARANCE_YEARS`)*
- [ ] What was US military spending as a share of GDP just before WWII? *(~1.5%; needs new parameter — research source)*
- [ ] How much did the US drop military spending after WWII as a share of GDP? *(post-war drop from ~38% peak to ~5% by 1948; needs new parameter)*
- [ ] How many rounds of "each person recruits two" to reach 4 billion? *(32 rounds; from `2^32 ≈ 4.3B`, mentioned in phone-script body; encode as derived parameter or compute inline)*
- [ ] Name a global treaty that successfully abolished an entire weapons class. *(Chemical Weapons Convention 1993, Biological Weapons Convention 1975, Mine Ban Treaty 1997, Convention on Cluster Munitions 2008, Treaty on the Prohibition of Nuclear Weapons 2017 — pick one, build a small reference dataset)*
- [ ] How many humans die annually from disease and aging globally? *(~55M; `GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES`)*

**Implementation plan:**
- [ ] Add a `quiz` package or extend `packages/data/src/quizzes/` with a `humanity-management-training-quiz.ts` that exports `{ questions: QuizQuestion[] }` where each `QuizQuestion` has `prompt`, `options[]`, `correctOptionId`, and `parameterRef` (string or Parameter import) for the answer-explanation deep-link.
- [ ] Add the missing two parameters (`PRE_WWII_US_MIL_SPEND_GDP_PCT`, `POST_WWII_US_MIL_SPEND_GDP_PCT`) to `packages/data/src/parameters/parameters-calculations-citations.ts` with sourceUrl pointing to OMB Historical Tables or similar primary source. Add a small dataset of major weapons-abolition treaties (`packages/data/src/datasets/weapons-abolition-treaties.ts`) with name, year, jurisdiction count, and source URL.
- [ ] New page `/humanity-management-training/quiz` rendered after all five subtasks verify. Multiple choice, randomize option order, randomize question order, pass threshold (e.g. 7/9). Show the answer + parameter source URL after each question whether the user got it right or not — the goal is teaching, not grading.
- [ ] Add a new HMT subtask `passQuiz` (sortOrder 60) that gates Stage-2 promotion. Update `user-onboarding:treaty:hmt-gate` `subtaskKinds` and the quiz page sets it VERIFIED on a passing score.
- [ ] On fail, route back to a "review the case" page that surfaces the relevant manual chapter for the question(s) they missed, then let them retake. No 24-hour cooldown — friction here doesn't help.
- [ ] Track per-question accuracy across all users (analytics) so the question bank can be tuned: a question that 95% get wrong is either too obscure or the explanation is bad; a question that 99% get right isn't testing anything.

Open question: should the quiz be optional or gating? Gating fits the role-play ("you can't be promoted to President Manager without passing the certification") but adds friction. Optional with a graduation badge is softer. Default to gating, see what funnel data shows.

### S10 — URL-helper sweep + always-attach-referral-code

User-flagged 2026-04-30. Right now URLs to `1percenttreaty.org/treaty`, `warondisease.org/...`, share links, and treaty pages are scattered across the codebase as string literals. Two related fixes:

**Centralize URL generation:**
- [ ] Audit + replace hardcoded `1percenttreaty.org`, `warondisease.org`, `optimitron.com`, `dfda.earth`, `trialabundancesurvey.org` literals across `packages/web/src/`. Each should resolve through a helper that knows which environment we're in (`site.canonicalOrigin` already exists per `lib/site.ts:1213+`).
- [ ] New module `packages/web/src/lib/url-helpers.ts` exporting:
  - `treatySignUrl(opts?: { referralCode?: string })` → `https://1percenttreaty.org/treaty?ref=...`
  - `voteUrl(opts?: { referralCode?: string; siteKey?: SiteKey })` → variant-aware `/vote` URL with optional referral
  - `dashboardUrl(opts?: { siteKey?: SiteKey })`
  - `referralLandingUrl(opts: { username?: string; referralCode?: string; inviteToken?: string })`
- [ ] Decision rule: if a URL points to a public landing page that supports referral attribution, the helper accepts a `referralCode` param and appends it. Callers responsible for passing the user's code; the helper is dumb.

**Always attach referral code when a logged-in user shares:**
- [ ] Wherever the app builds an outbound shareable URL on behalf of a logged-in user — task action-links, share buttons, referral composer, signer-reminder URLs — make sure the user's `referralCode` is appended. Today it's mostly correct but at least one site (the new `signTreatyPersonally` action-link in S1) hardcodes `https://1percenttreaty.org/treaty` with no ref. Fix in the same PR as the URL helper landing.
- [ ] Add a vitest that grep's the codebase for hardcoded `1percenttreaty.org` outside `lib/url-helpers.ts` and the test file itself, and fails if any are found. Prevents future regressions.

**Trigger-blueprint URL templates:**
- [ ] Trigger spawn-specs hold URL templates as literal strings (`actionLinkUrlTemplate: "https://1percenttreaty.org/treaty"` in `blueprints/one-percent-treaty.ts`). After the helper module exists, expose the URL helpers as trigger context tokens (`{{urls.treatySign}}`, `{{urls.dashboardForUser}}`) so seed authors can write `actionLinkUrlTemplate: "{{urls.treatySign}}"` and the spawn engine substitutes the right URL with the right ref appended at fire time. This also makes the per-user referral-code attachment automatic for seeded tasks.

**ShareAttempt codes (`sa=`) + provenance:**
- [ ] The URL helper should accept an optional `shareAttemptId` param and append `sa=<id>` when present, matching the existing `embedShareAttemptId()` pattern at `lib/share-channels.ts`. That helper is the closest existing equivalent — fold it into the new url-helpers module rather than maintaining two URL builders.
- [ ] **Provenance question:** should the helper also append a `src=<page>` or `gen=<surface>` query param tagging WHERE the URL was generated (e.g., `src=dashboard`, `src=email-overdue-reminder`, `src=phone-script-task`)? This would let us answer "which surface produced the most converting share-link clicks?" Worth doing IF the analytics is wanted; the cost is one extra query-param everywhere we generate a URL. Open question — defaulting to YES because it's cheap and the data is otherwise lost. Acceptable values should be a small enum so analytics can group cleanly. Do not log full page paths (high cardinality).
- [ ] Decide whether `src=` overrides or coexists with `sa=` — they answer different questions (`sa` is "which exact composed message", `src` is "which surface composed it"). Keep both, both nullable.

**Don't collapse 1percenttreaty.org → warondisease.org/treaty.** Considered and rejected: 1percenttreaty.org is a memorable shareable URL ("vote at 1percenttreaty.org") that beats "warondisease.org/treaty" for stickiness, podcast mentions, and coalition-partner pitching. Internally everything is one codebase already, so the maintenance cost of the separate domain is just one DNS record + SSL cert.

### S9 — Hardcoded-stats audit: convert literal numbers in user-facing strings to linked parameters

User-flagged 2026-04-30 alongside S2. S2 added the `*Linked` markdown-link variants for trigger-spawned templates, but plenty of user-facing copy outside the trigger blueprint still has literal numbers baked in. Each of these is a credibility leak (no source link) and a drift risk (the `parameters-calculations-citations.ts` source moves; the literal doesn't).

**Known offenders to audit (search `packages/web/src/` for hardcoded numerals + the words around them):**
- [ ] `WISHONIA_WELCOME_COMMENT` in `packages/web/src/lib/tasks/user-treaty-task.server.ts:48-58` — has "60 million" deaths/year, "10.7 billion" deaths prevented over the century, "1%" of military spending, "4 billion people". Each number has a parameter export (`GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES`, `EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL` or similar, `TREATY_TARGET_VOTERS`). Note: this constant may already be unused per F6 ("drop welcome comment"); verify before editing — if it's unused, just delete it.
- [ ] `OverdueReminderTaskInput` mortality line in `task-overdue-reminder.server.ts` currently hardcodes `GLOBAL_DAILY_DEATHS_FROM_DISEASE = 150_000` (rounded from 55M/yr). Replace with a derived `GLOBAL_DAILY_DEATHS_FROM_DISEASE` parameter export, or compute at module load from `GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES.value / 365`. Either way, render with a markdown link.
- [ ] `TreatyPostVoteShareFlow.tsx` — already noted in "Highest Priority" section as parameterized, but verify *Linked variants are used wherever JSX renders sourced numbers (currently uses `<ParameterValue>` component for hover popovers, which is the JSX-equivalent of `*Linked`).
- [ ] All landing-page hero copy for treaty/optimitron/dfda variants — search for literal "$3.48M", "21.7", "604", "443", "36", "60 million", "10.7 billion", "150,000", "8 billion", "4 billion" and convert.
- [ ] Email template bodies that don't yet use the trigger framework (magic-link, referral invitations) — magic-link is intentionally bare per S8; referral invitations already pull from `treaty-share-flow-parameters.ts` wrappers.

**Approach:**
1. Grep for the canonical literal numbers across `packages/web/src/`. Each match is either (a) intentional copy that doesn't need linking, or (b) a candidate to replace.
2. For trigger-rendered surfaces, swap to `{{params.fooLinked}}`.
3. For React components, use the existing `<ParameterValue>` component (already wired into `TreatyPostVoteShareFlow.tsx`).
4. For static markdown / HTML email helpers outside the trigger framework, build a small `formatParameterAsMarkdownLink(param, rendered)` helper in `lib/parameter-link.ts` and use it inline.
5. Add a vitest that scans the trigger blueprint file for numbers like `\b(604|443|36|122|150,000|60 million)\b` and fails if any survive — prevents regression as new copy lands.

This is a sweep, not a one-shot fix. Land it after S2 + S8 are done; queue S3 / S5 / S6 / S7 ahead since they unblock product flow. S9 is a quality-tightening slice that benefits from S2's linked-variants infrastructure already being there.

### S8 — Variant-aware magic-link email (and the broader "where did this user sign up from" question) — DONE (codex — 2026-04-30)

User-flagged 2026-04-30 after the mortality-stat experiment was reverted. The magic-link email fires on EVERY login, not just first signup, which means any treaty/voting framing in it is wrong: most recipients have already voted, and `trialabundancesurvey.org` signups (partner-survey, neutral voice per Q1) shouldn't see treaty copy at all. Current state is fine — the body is treaty-agnostic ("Yeahhh, here's your sign-in link. Mmkay.") — but we have no story for personalizing it per site.

**The core question:** does the magic-link content branch on (a) the URL host the user is signing INTO right now, or (b) the site the user originally signed up FROM?

- (a) is free — the host is already in the URL passed to `sendMagicLinkEmail`. Recipient receiving a link to `trialabundancesurvey.org/auth/callback?...` gets trial-abundance branding; recipient signing into `warondisease.org` gets H2EWD branding. Default behavior matches user expectation.
- (b) requires schema (`User.signupSiteKey String?`) plus capture-at-signup-time. More work, justified later for cross-variant emails the system originates (e.g., a Wishonia digest sent to a treaty user vs. a partner-survey user).

Default: do (a) now, defer (b) until a non-magic-link email needs it.

**Implementation sketch (~1-2 hr):**
- [x] *(codex)* `getSiteFromHost` already exists in `lib/site.ts`. Extend `sendMagicLinkEmail` to derive the site key from the magic-link URL host and pick a per-variant copy bundle.
- [x] *(codex)* Per-variant copy bundles in `lib/email/magic-link-email.ts` (or a sibling `magic-link-copy.ts`):
  - `warondisease.org` / `optimitron.com` / `1percenttreaty.org`: current Lumbergh-mild ("Yeahhh, here's your sign-in link. Mmkay." + "Didn't ask for this? Just go ahead and ignore it. That'd be great.")
  - `trialabundancesurvey.org`: NEUTRAL, partner-friendly ("Sign in to Trial Abundance Survey." + "If you didn't request this, you can ignore it.") Q1 decision: don't make partner orgs nervous.
  - `dfda.earth`: clinical-neutral ("Sign in to dFDA." + same anti-phishing line)
- [x] *(codex)* Subject line should include the site display name (already does via `host`), so just confirm `Sign in to ${host}` reads cleanly per variant.
- [x] *(codex)* Test: a magic-link generated against `trialabundancesurvey.local` URL produces the neutral body; one against `warondisease.local` produces the Lumbergh body. Lock both with snapshot tests in `magic-link-email.test.ts` (file doesn't exist yet — add it).

**Defer until justified (with concrete trigger conditions):**
- [ ] `User.signupSiteKey String?` — capture at User creation from `headers().get("host")` → `getSiteFromHost`. Trigger to add: first feature that sends an outbound email NOT keyed off the URL host (e.g., a Wishonia digest, a cross-variant promotional email). Magic-link doesn't qualify because it already has the host in the URL.
- [ ] `ReferendumVote.siteKey String?` and `ReferralInvitation.siteKey String?` — capture at insert time. Trigger: first analytics view that needs per-site conversion breakdown. Until then, `Task.taskKey` prefixes and `referendumId` joins give an awkward-but-workable approximation.
- [ ] Do NOT add `siteKey` to every model speculatively. YAGNI — most rows can derive their origin from foreign keys / taskKey prefixes; adding columns nothing reads is just schema noise.
- [ ] Per-variant Wishonia signature toggle — keep the rotating-title signature on EVERY variant including trialabundancesurvey.org until a real partner org actually complains. The 15-titles × 11-taglines gag is more charming than alarming, and removing it speculatively is premature optimization. When/if the complaint lands, the fix is to add a per-message `signatureMode: "wishonia" | "none" | "sender"` option at the `resend.ts` chokepoint.
- [ ] Audit other email surfaces (referral invitations, overdue reminders, comment notifications) for whether their voice is universally appropriate or needs the same per-variant branching. Likely yes — a partner-survey overdue reminder shouldn't read "Did you get the memo on signing the treaty?"

### S7 — Earth Optimization Day (annual recurring task, August 4th)

User-flagged 2026-04-30. Annual ritual: every August 4th, every Humanity Manager gets a one-day task to "conduct a distributed denial of death attack on humanity" — share their vote/referral link across every social channel they own. Framing: humanity becomes 1% less irrational each year on this day.

**Schema check first — does the trigger framework already support this?**
- [ ] The TaskTrigger model has `schedule` and `iterationSource` (added in F1). A schedule like `0 9 4 8 *` (cron: 9am August 4th, every year) fires the trigger annually. The `iterationSource` resolver enumerates active users → fires `fireTaskTrigger` per-user → spawns the day-of task. So yes, capable in principle. Confirm by re-reading `packages/web/src/lib/triggers/iteration-sources.ts` to verify "active users" is one of the registered sources, or add it.
- [ ] If no `activeUsers` iteration source exists, add one. Filter: `User` rows where the user has an HMT root with `completeTraining` VERIFIED (i.e., they're actually a Humanity Manager, not a stalled signup).

**Trigger blueprint to add:**
- [ ] New blueprint `program:earth-optimization-day:annual` in `packages/web/src/lib/triggers/blueprints/earth-optimization-day.ts` (separate file from one-percent-treaty so it can outlive the treaty campaign).
- [ ] `eventName: "cron.earth-optimization-day"`, `schedule: "0 9 4 8 *"` (Earth time — pick a TZ for the rendering layer; UTC is fine for the cron itself).
- [ ] `iterationSource: "users.activeHumanityManagers"`.
- [ ] Spawns one task per user, parented under that user's HMT root:
  - `kind: "earthOptimizationDay:{{year}}"` (year-suffixed so each year is its own row, idempotent on re-fire)
  - `idempotencyKeyTemplate: "earth-optimization-day:{{user.id}}:{{year}}"`
  - `titleTemplate: "Earth Optimization Day {{year}}: post your referral URL everywhere"`
  - `descriptionTemplate`: deadpan corporate-HR voice. "Today is the day humanity becomes 1% less irrational. Your annual contribution: post your treaty referral URL on every social channel you have access to. The Commission expects participation."
  - `dueDays: 1` (closes end-of-day)
  - `actionLink` to a special `/earth-optimization-day` page that bundles share buttons for X / Bluesky / Mastodon / LinkedIn / Facebook / email-everyone-in-contacts with pre-filled copy.
- [ ] On verification: a follow-up email goes out the next day reporting how many votes flowed in via that user's referral URL on Aug 4th — closes the loop, makes participation feel measured.

**Calendar surface (separate from the trigger):**
- [ ] Use the wishonia@gmail.com Google account to publish a public Google Calendar with "Earth Optimization Day" recurring annually on August 4th. Embed the public calendar link in the dashboard footer + on `/earth-optimization-day`. Subscribe-button goes to `https://calendar.google.com/calendar/u/0/r?cid=...` so users add it to their own calendars. Decision needed: does the calendar invite ALL signed-up users automatically, or do they have to subscribe themselves? Auto-invite from a noreply Google account looks like spam to many filters; subscribe-yourself is cleaner. Default to subscribe-yourself.
- [ ] Event description should match the task description so users get the same framing whether they see it in calendar or in the app.

**Pre-launch verification:**
- [ ] Test the trigger by manually firing `fireTaskTrigger("program:earth-optimization-day:annual", { year: 2026, user: { id: <test user> } })` to confirm the spawn path works before the first real Aug 4 fires. The cron route at `/api/cron/run-due-triggers` should pick it up automatically once seeded + enabled.
- [ ] Decide what happens to non-active-HM users on Aug 4: skip silently? Send them a "you're missing the holiday — finish HMT" reminder? Default: skip silently. Earth Optimization Day is a graduate-only event; missing it isn't a nag opportunity.

### Open questions (don't guess; ask)

- After Stage 2 (President Manager) — what's Stage 3 when the user's leader actually signs? Another promotion? A "graduation"? The role ladder runs out of rungs eventually.
- Should Stage 1's `signTreatyPersonally` task be the very first thing (sortOrder 0, gate-blocking) or a parallel side-quest? Current proposal: gate-blocking — you can't ask friends to vote for something you haven't signed. Risk: adds friction to a flow that already lost users at the magic-link round-trip.
- "Late employee program" task section currently appears on the LANDING page (pre-vote, pre-signup). That's odd — assigning tasks before commitment. Worth pulling off the landing entirely? Probably yes; not in S1 scope.

## Stale Items Audit (2026-04-30)

Items in this file that are obsolete or partially overtaken by recent work. Listed for cleanup in a follow-up pass; do not act on them as written.

- **"Phase B — One generic email-sequence engine"**: partially obsolete. The TaskTrigger framework's spawn-spec template rendering now owns the equivalent for spawned tasks. `renderTaskCommunication` is still relevant for ASSIGNMENT / cron-driven sends not yet on triggers, but the "collapse active builders" goal is half-done by triggers.
- **"Drop hardcoded task-key prefix `program:one-percent-treaty:referral-invitation`"** (Phase C): verify against current state. Idempotency-key templates have moved into the trigger blueprint (`program:one-percent-treaty:referral-invitation:{{inviteToken}}`) — the literal might still appear in helper functions but is no longer the source of truth.
- **"Phase 1: Rename TaskCommunicationEndpoint → TaskActionLink"** marked completed in this-session task tracker, but `schema.prisma` still defines `TaskCommunicationEndpoint` (line 543). Either the rename was reverted or the tracker is wrong. Re-evaluate before any future use.
- **"Add the `wishonia` system User row + `User.isSystem` boolean"** under Phase A follow-ups (line ~423): completed in migration `20260425230000_add_user_is_system`. Marked `[x]` but the "Filtering helpers across listings/leaderboards/attribution are still needed" half-sentence is open-ended; re-state as concrete tasks per surface or drop.
- **GITHUB_REPO_ALLOWLIST / GITHUB_DEFAULT_REPO env-var docs anywhere in the repo**: those env vars no longer exist (replaced by hardcoded `ALLOWED_REPOS`). If MCP/dev docs reference them, sweep.
- **Magic-link email entries in "Email Sequences" section**: copy is now in Lumbergh voice — any test or doc still asserting the old "Sign in to {host}" + "Use the secure link below" body is stale.

## Architecture Guardrails

- [x] **Decision 2026-04-27:** Do not add special outreach models for nonprofit/company/partner tasks. Use the existing `Task` assignment model plus `Organization`, `Person`, `TaskCommunicationEndpoint`, `TaskCommunication`, `TaskComment`, and `EmailLog`.
- [x] **Decision 2026-04-27:** Do not keep a parallel local enum mirror in web. Regenerate/build `@optimitron/db` when schema enums or delegates are stale, then import generated enums from `@optimitron/db/enums`.
- [x] **Decision 2026-04-27:** Rank concrete action options, not abstract tasks. The production engine should choose between execute, agent execution, delegate, outsource, fund, de-risk, decompose, queue repair, and kill.
- [ ] Do not add Stripe Connect, marketplace payments, Wish tokens, or new credit-ledger schema until generic private tasks + ranking + notifications are boring and stable.
- [ ] Do not introduce a second task model. Personal/private work, org-assigned work, treaty invite work, and agent-proposed work all remain `Task` rows with scoped ownership/visibility and optional assignee relations.
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
- [x] Retire the legacy `referral_sequence_*` sender lifecycle.
  - Follow-up is now owned by concrete `Task` rows and the generic overdue-task reminder cron.
  - Do not recreate standalone sender receipt, reminder, scorecard, or re-engagement emails outside the task system.
- [x] Extract small shared modules for cross-file primitives.
  - Server `sha256Hex()` lives in `packages/web/src/lib/crypto.server.ts`; both prior duplicates removed.
  - `SENDER_REMINDER_DELAY_DAYS` is now exported from `referral-invitations.server.ts` and imported by the API route.
  - `getReferralEmailBatchSize()` lives in `packages/web/src/lib/email/batch.ts`; the duplicate `getReferralInvitationEmailBatchSize()` was deleted and call sites updated.
  - `MS_PER_DAY` constant added in `packages/web/src/lib/time.ts`; the inline `24 * 60 * 60 * 1000` literals in `referral-invitations.server.ts`, `referral-email.server.ts`, and `app/api/referral-invitations/route.ts` now use it. Other inline occurrences such as `census-aggregation.server.ts:69` can be migrated opportunistically.
  - Browser-side async `sha256Hex` in `components/landing/PostVoteReminders.tsx:30` and `components/tasks/task-row-share.tsx:29` is still duplicated — Web Crypto is async; not worth the risk in this pass.
- [x] Group email infrastructure under `packages/web/src/lib/email/`.
  - Current active paths are magic-link email, explicit task notifications, and the Resend wrapper.
  - [x] Centralized queued `EmailLog` creation and status transitions in `packages/web/src/lib/email/email-log.server.ts`; task notification paths share durable claim/send/update logic.
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
- [x] Replace the old "optimizationRate sort" idea with a risk-adjusted optimal next action engine.
  - Pure engine lives in `packages/agent/src/optimal-next-action.ts`.
  - MCP tools added: `getMyOptimalNextAction`, `rankMyActionOptions`, and `explainTaskRanking`.
  - The engine ranks action options, not just task rows, and returns assumptions, sensitivity, next-best alternatives, required approvals, and a recommended action block.
  - `expectedEconomicValueUsdBase` is treated as already probability-weighted to avoid double-discounting imported Notion/treaty estimates.
  - Downstream value uses `TaskEdge` data where present; fallback dependency boosts are explicit and flagged lower-confidence.
- [x] Add Notion EV regression coverage without importing private row dumps.
  - `notionExpectedValuePerHourUsd()` covers the confirmed Notion `P(success) * Value / Hours` baseline.
  - `notionOptimizationRateUsdPerHour()` covers the confirmed `EV/hr + Downstream Value * 0.2 * P(success) / Hours` baseline.
  - Tests use anonymized/generalized Notion-style tasks and verify that readiness constraints still beat a blocked high-rate task.
  - Tests also cover generalized treaty onboarding actions for a new user and a low-value Notion-style merchandise task (`0.5 * $300 / 8hr = $18.75/hr`) so low-EV work stays low.
- [x] Improve MCP estimate guidance for subjective task values.
  - `docs/MCP_SERVER.md` now documents USD-equivalent welfare, probability-weighted expected value semantics, low/base/high ranges, source URLs, assumptions, anti-inflation rules, and a concrete `setTaskImpact` example.
  - `setTaskImpact` now exposes/stores low/base/high probability, value, effort, cash cost, DALY, and delay-cost fields instead of base-only estimates.
  - `setTaskImpact` stores `assumptions`, `sourceUrls`, and `estimateNotes` in `TaskImpactEstimateSet.assumptionsJson` so future explanations can cite why a subjective number exists.
- [ ] Add first-class support for the remaining Notion ranking signals that are currently only partially represented.
  - `Context Fit` should become an actor/current-session input so the same task ranks differently for deep-work, quick-win, admin, exhausted, or mobile contexts.
  - `Exposure risk` should become a hard or near-hard health/safety constraint with citations required before recommending in-person or COVID-risky work.
  - `Sensitivity` / `Trust Level` should constrain which actors, agents, vendors, and organizations can see or execute private tasks.
  - Revenue-path gates should become structured marginal-EV inputs instead of only text/tag/runway heuristics.
  - Execution Options should import into `contextJson.executionV1` or a typed adapter so route choice can use Mike hours, external hours, cash cost, route probability, quality risk, and acceptance criteria.
  - Deadline urgency should be modeled as cost-of-delay / expiry risk rather than a blunt multiplier, while preserving a Notion-parity test for the old 7-day/14-day behavior.
- [ ] Split MCP implementation before it grows further.
  - Move optimal-action tool definitions/handlers out of `packages/web/src/lib/mcp-server.ts` into a small module.
  - Move organization/task-notification tool definitions/handlers out of `mcp-server.ts` into a small module.
  - Keep `mcp-server.ts` as the registry/composition layer, not the home for every tool's business logic.
- [ ] Add a compact `searchTasks` MCP tool or `query` parameter on `listTasks`.
  - `packages/web/src/lib/tasks.server.ts` already has `searchTasks()`; reuse it before adding full-text indexes.
  - Return compact task summaries plus match score/snippet where available.
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

## Optimitron MCP Queue Sync (2026-04-30)

Synced from the live Optimitron MCP server (`http://localhost:3001/api/mcp`) — engineering tasks present in the live priority queue that are not already covered above. Items are listed with their MCP task ID so the bidirectional state stays explicit. Mark `[x]` here AND call `updateTask({status: "VERIFIED"})` against the MCP server when finishing one.

**Already verified on the MCP server during this sync (no action needed):**

- [x] `cmokes2c9000e04jslbkjuggu` — Add GitHub repo search/read tools to MCP server. Implementation lives at `packages/web/src/lib/github-repo-tools.server.ts`; registered in `packages/web/src/lib/mcp-server.ts` (scope, deferred-tool list, defs, handler). Marked VERIFIED 2026-04-30.
- [x] `cmoke6wzh000004js3ilpxnmy` — Fix MCP server: `getMyQueue` / `getQueueAudit` / `getMe` + test coverage. `getMyQueue` and `getMe` now return clean responses over HTTP transport; `mcp-local-identity.server.ts` and tests are present. Marked VERIFIED 2026-04-30.

**Open engineering items from MCP queue not already in this file:**

- [ ] **`cmojj9hwo002f04l1mr4bmxrh` — Fix failed Vercel production deployments** (`optimitron-web` + `s3-file-manager-nextjs`). Production sites down per Notion source. Diagnose the build failure first (Vercel logs, recent dependency / config changes), then fix in `packages/web` or root config. Priority 4500 in the MCP queue.
- [ ] **`cmojj98ks002c04l1dcucgl9x` — Finish survey MVP (acceptable UI for demo)**. Core product surface for Earth Optimization Prize voting. Scaffolding already exists at `packages/web/src/app/survey/page.tsx` and `survey/[organizationSlug]/page.tsx`; finishing means: working post-vote state, partner-org embed flow, and a usable demo against a real referendum. Priority 4000.
- [ ] **`cmojj6a1h001904l1hrtlhehd` — Implement vote flow v13 (11 screens)**. Core product feature. Confirm what the v13 spec is (likely lives at `docs/questions.md` or a successor doc — check the open question on `Update TODO.md: kill EOPs, add Optimization Rate formula, v13 spec ref` task `cmoj9142u000k1opieifih8ci`), then port the 11-screen flow into `packages/web/src/components/landing/TreatyVoteFlow.tsx` (which already supports flow variants via `TREATY_FLOW_VARIANTS`). Priority 3333.
- [ ] **`cmojj9oif002i04l11wfukd3f` — Build interactive EV/uncertainty calculator for grant and donation pages**. Shows donors the expected-impact math driving the welfare-function rollup. Re-use `packages/data/src/parameters/parameters-calculations-citations.ts` and the existing `lib/treaty-share-flow-parameters` helpers; render as a client component with sliders for the most uncertain inputs (probability of treaty passage, fraction of users who recruit, etc.). Priority 4250.
- [ ] **`cmojj9w2q002l04l1ezkjy553` — Add share-inducing questions to vote flow**. Viral mechanic. After the user votes, ask questions whose honest answer pulls them into sharing the link (e.g., "Who is the first person you'll send this to?"). Lives in `TreatyPostVoteShareFlow.tsx`. Keep neutral-mode partner-survey behavior intact (Q1 decision). Priority 5333.
- [ ] **`cmojj61ho001604l1q3aj39gw` — Build commission page on warondisease.org**. Public-facing page showing Technical Commission members and their roles. New route under `packages/web/src/app/` (probably `/commission`). Read members + roles from a small static dataset in `packages/data/src/datasets/`. Priority 4500.
- [ ] **`cmokjax3u000004l3sviunmuw` — Build referendum system with Court of Humanity as first referendum**. Optimitron currently has the 1% Treaty referendum hardcoded; this generalizes it. Schema work in `packages/db/prisma/schema.prisma`, route work in `packages/web/src/app/agencies/dcongress/referendums/`. Court of Humanity is the first instance. Priority 2125. Read full task description before scoping — overlaps with the existing `Referendum` model so likely a delta, not a rewrite.
- [ ] **`cmojjamq3002u04l1hgy5p07g` — Build Revenue Paths table + rewire EV calculations to WIG (Annual Revenue Run Rate)**. Tagged ENGINEERING but the description is "Notion database restructure" — confirm whether this is in-app (a new page under `/admin` or `/fund/portfolio`) or external Notion-only before starting. Priority 4500.

**MCP queue items already covered by other sections (no new entry needed):**
- "Set up donation processor (Stripe nonprofit / Every.org)" `cmojj8t4m002604l1uf1g4lmo` and "Set up IAM donation page (Stripe)" `cmojj6hh8001c04l1ny2pjpgg` → Track 1 IAM donation flow at line 778+.
- [x] *(2026-04-30)* "Update TODO.md: kill EOPs, add Optimization Rate formula, v13 spec ref" `cmoj9142u000k1opieifih8ci` — EOP refs hardened to the 2026-04-30 USD-denomination decision; Optimization Rate formula + v13 spec doc pointers added in a new Reference docs subsection of Impact Dollars. Marked VERIFIED on the MCP server.

## Multi-Agent / Service-Account Architecture (2026-04-30)

Optimitron is the to-do list for humanity. Long-run shape: 8 billion humans × N AI agents each × M tasks each, all writing to a shared coordination layer. Current schema (one User = one OAuth = full owner permissions) doesn't scale. **Goal of this section: do enough now that future agents drop in cleanly, without prebuilding capacity nobody needs yet.** Wisdom is "right shape, small scale."

### Long-run target: agent-native sign-up

Any agent can sign up at `optimitron.com/agents`, get default `tasks:read` + `tasks:comment` scopes, and start working on the public task tree. Reputation gates more permissions over time. The Phase 0 service-account architecture is the substrate for this — same schema, one new sign-up route, no rework. Compatibility with emerging agent-identity standards (Cloudflare/GoDaddy [Agent Name Service](https://www.cloudflare.com/press/press-releases/2026/cloudflare-and-godaddy-partner-to-help-enable-an-open-agentic-web/), [Web Bot Auth](https://blog.cloudflare.com/agents-week-in-review/), DIDs) is a Phase 2 goal — speak the same protocols other agent platforms speak, don't reinvent.

| Phase | When | What |
|---|---|---|
| **0 — Service accounts** | now | The "Build now" checklist below. Mike-only or sponsoring-human pattern. |
| **1 — Sponsored agent sign-up** | ~3 months | `/api/agent-signup` requires human OAuth + agent metadata. Default scopes: read-public + comment + claim-one. Rate limits per agent. Reputation v0 (claim/completion ratio, dispute rate). Public docs + example SDK at `optimitron.com/agents`. |
| **2 — Self-sovereign agents** | ~6–12 months | DID-based identity (no sponsoring human required, but agent must stake). Reputation portability across agent versions. On-chain attestations for verified work. Public agent profiles + capability tags + discovery feed. Cloudflare ANS / Web Bot Auth interop. |
| **3 — Agent economic loop** | ~18 months | Reward mint flows directly to agents. Task bidding. Agent-to-agent delegation. Cross-platform payment interop — see "Agent payments" subsection below. |

### Plausible agent classes (ordered by blast radius)

| Tier | What it does | Permissions needed | Failure mode |
|---|---|---|---|
| 1. Read | Daily digest, queue ranking, "what should I do next" | `tasks:read` (own + public) | wastes attention |
| 2. Self-state | Claim/complete own tasks, log time, draft descriptions | `tasks:write:own` | overstates progress |
| 3. Comment-on-public | Audit, recommend, post evidence on shared tasks | `tasks:comment` | spam |
| 4. Outreach | Phone scripts, DM drafts, recruit follow-up | `tasks:write:own` + comm-channel send | impersonation, spam |
| 5. Network-effect | Match collaborators, propose joint tasks | `tasks:read:aggregate` (k-anon) | privacy leak |
| 6. Delegated-on-others | Task generators (e.g., per-politician signer tasks); independent verifiers | `tasks:write:public` (curated) | mass-spam, fraud |
| 7. Economic | Allocate IAB votes, route donations, mint reward credit | `treasury:*` (per-action signature) | financial loss |
| 8. Governance | Resolve disputes, score reputation, gate fraud | admin-class | system capture |

Tiers 1–3 are 90% of plausible near-term agents. Tiers 4–5 are the 4-billion-voter recruitment story. Tier 6+ needs cryptoeconomic + legal scaffolding before shipping.

### Permission model (when it gets real)

ABAC, not RBAC:

- **Scope on resource**: `tasks:comment` ⇒ comment on any task; `tasks:claim` ⇒ claim public tasks; `tasks:complete:own` ⇒ mark VERIFIED only on tasks the actor claimed.
- **Delegation, not impersonation**: agent acts ON BEHALF of a user. Audit log records both `actorUserId` (the agent) and `onBehalfOfUserId` (the human who delegated). Today both = Mike; tomorrow they diverge.
- **Time-bounded grants**: every delegation has an expiry (default 90 days). Auto-renew if used; auto-revoke if dormant. Solves "I forgot which agents have my keys."
- **Per-resource grants for high-stakes ops**: Tier 7 (economic) is not a blanket scope. Each token-mint or refund needs the user's signature, possibly a co-signer, possibly on-chain.

### DB shape implied (when it gets real)

1. **`Actor` model that subsumes User + Agent.** Today's `User` becomes a subtype `Actor.kind = "human"`. Agents are `Actor.kind = "agent"` with `delegatedFromActorId`. Service accounts ditto. Every authenticated request resolves to an `actorId`.
2. **`Delegation` table** — `(grantorActorId, granteeActorId, scopes[], expiresAt, revokedAt)`. Append-only.
3. **Audit log on every write** — `(eventId, actorId, onBehalfOfActorId, clientId, action, resourceType, resourceId, before, after, ts)`. Event-sourced is best (state materialized from events) but a side-log table is enough until the system is bigger.
4. **Resource-level ACL** for non-trivial cases — `TaskActorPermission(taskId, actorId, scopes[])`. Most tasks won't have rows here (default ownership rules apply); only the delegated cases do.
5. **Per-actor rate limits & cost accounting.** Track `eventsPerActor` per minute/day. Bill compute back to the human who delegated.
6. **Reputation score on actors.** Affects how much friction their writes face — known-good actors mark VERIFIED at face value; new actors require co-sign or evidence. Folds into the existing Wishocracy CAS work.
7. **Privacy boundaries.** Public tasks visible to all. Private tasks visible to owner + delegates + claim holders. Aggregate stats visible to all but with k-anonymity floor.

### Build now (~half day, before next agent ships)

Locks in the right shape. Future agents drop in cleanly without retrofits.

- [ ] **Schema migration:** add `User.kind` enum (`human` / `service` / `ai_agent`), `User.apiTokenHash` (string?), `User.apiTokenScopes` (string[]), `User.walletAddress` (string?, nullable, for future stablecoin payout). Add `TaskReward` table stub: `(taskId, claimantUserId, amountUsd, status, payoutTxHash?, payoutChain?, payoutToken?)`. Both wallet + reward fields are unused today but cost nothing to ship now and avoid a Phase 3 migration. Migrate existing rows to `kind = "human"`. Reseed.
- [ ] **Bearer-token middleware** in `packages/web/src/lib/mcp-server.ts` parallel to the OAuth path. Accept `Authorization: Bearer <token>`, look up by hash, set `userId` + scopes for the request.
- [ ] **Mint-token CLI script:** `pnpm db:cli mint-service-account --name engineering-audit --scopes tasks:read,tasks:comment`. Outputs the bearer token once, hashed in DB. Document in `docs/MCP_SERVER.md`.
- [ ] **Update the `Daily Optimitron engineering-task audit` routine** (`trig_01M8DDQ1nZwr3Vu6eioRA74Z`) to use the new service-account token instead of Mike's OAuth.
- [ ] **Tests + smoke run:** unit-test the middleware, integration-test scope enforcement, run an end-to-end audit-routine smoke check.

### Architectural disciplines (no extra work, just don't violate)

- [ ] **Always record `actorUserId` on writes.** Never elide. Even when it's always Mike today.
- [ ] **Every authorization check uses the scope system, never `if (userId === ownerUserId)` shortcuts.**
- [ ] **New write tools accept (don't require) a `clientId` param** so we can distinguish "Mike's CLI" vs "Mike's audit routine" vs "Mike's recruit-followup agent" without a schema change. Log it.
- [ ] **Comments are the canonical "who did what" surface.** Agents post comments to leave their fingerprint visibly. `[routine:engineering-audit]` prefix convention.
- [ ] **Person ≠ User** is already correctly modeled — Person is canonical identity, User is auth artifact. Don't blur.

### Defer until you actually have a second human user

- Delegation table (today's "service account = a User row" is enough).
- Cross-actor permission grants.
- Reputation system.
- Privacy / k-anonymity.
- Rate limiting / cost accounting.
- Multi-tenant sharding (jurisdiction-scoped DB partitioning).

### Agent payments (2026 protocol landscape)

The agentic-payments stack settled in early 2026 around three layers, and Optimitron should adopt the standards rather than invent. **No payment infrastructure is part of Phase 0** — only the schema stubs (wallet column, TaskReward table) so we don't migrate later.

| Protocol | Owner | Layer | Use for Optimitron |
|---|---|---|---|
| **[AP2](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol)** (Agent Payments Protocol) | Google + 60+ partners (Mastercard, PayPal, Coinbase, Adyen, Stripe) | Authorization / trust — signed mandates, accountability, intent verification | Trust framework when an agent commits to a task with a stated reward. Cryptographically signed intent links agent's claim to authorized payout. Apache 2.0 license. |
| **[ACP](https://stripe.com/blog/agentic-commerce-suite)** (Agentic Commerce Protocol) | Stripe + OpenAI | Checkout / merchant — instant agent purchases | Premium-tier sales where an agent buys access (bulk API quota, priority queue access). Stripe Agentic Commerce SDK is the implementation path. In production at ChatGPT today. |
| **[x402](https://developers.cloudflare.com/agents/agentic-payments/)** | Coinbase + Cloudflare Foundation (co-governed since Sep 2025) | Execution — HTTP 402 + on-chain USDC stablecoin (Base / Ethereum / Solana) | Per-request micro-payments. Cloudflare-hosted services already speak x402; Stripe added USDC-on-Base support Feb 2026. Default rail for "pay $0.005 to call this MCP tool." |

Two payment use cases for Optimitron:

1. **Agents PAY Optimitron** for premium features (priority queue access, write-tier API, bulk compute). Use **x402** for per-request, **ACP/Stripe** for subscription / one-shot. Default agent spend cap mirrors Stripe's $100/month/provider default. The Cloudflare [Agentic Payments docs](https://developers.cloudflare.com/agents/agentic-payments/) have the reference flow.

2. **Optimitron PAYS agents** for verified completed work — closes the economic loop. Pattern:
   - Agent identity = Cloudflare ANS + Web Bot Auth signature on every request.
   - Agent claims a task with stated reward (gross USD value × completion probability).
   - Agent completes work, posts evidence as a task comment.
   - Verification via co-signing oracle + reputation (Wishocracy CAS).
   - On verification, payout via stablecoin (USDC on Base) to agent's wallet (resolved from DID).
   - Reward credit is denominated in `impactUsd` (the unit decided 2026-04-30 — see Impact Dollars section).

Open design questions (resolve before Phase 3):

- [ ] **Reverse-x402 flow?** HTTP 402 is "client pays server." Outgoing payment to agents-as-workers is structurally different — closer to a marketplace claim/payout. Either build custom flow or wait for AP2 v2 to standardize the worker-side.
- [ ] **Agent wallet attribution.** Agent DID → on-chain wallet mapping. Use ANS resolver or build a custom one. Don't skip — the link from "verified agent identity" to "destination wallet" is the highest fraud surface in the loop.
- [ ] **Co-verification thresholds by reward size.** <$10 = self-attest + dispute window; $10–$1K = single co-verifier; >$1K = on-chain proof or human review. Tune from data once Phase 1 ships.
- [ ] **Stablecoin choice.** USDC on Base = path of least resistance (Coinbase x402 default + Stripe Feb 2026 integration). Multi-chain support landed in x402 v2 (Dec 2025). Don't lock to one chain at the schema layer.
- [ ] **Write `docs/AGENTS.md`** capturing the protocol summary, Optimitron's adoption plan, and a hello-world agent example. This is the doc Cloudflare/Moltbook/agent-dev folks land on when they ask "what is Optimitron and how do I plug in."

### Defer until tier 6–7 agents become real

- Co-signing for economic / mint actions.
- On-chain attestations.
- Fraud detection.
- Disputes / governance UI.
- Live AP2 / ACP / x402 wiring (the schema stubs in Phase 0 keep the door open; no infra needed until first paying agent shows up).

### Why this matters

The trap is Mike-as-everything: every authorization check, every audit query, every UI surface assumes a single human owner. When the second human + first non-Mike agent shows up, retrofitting that assumption is a rewrite. Doing the half-day foundation now keeps every future agent a `pnpm db:cli mint-service-account ...` away.

## Code Review Fixes (2026-04-29) — DONE

Review of ~1700-add / ~380-remove uncommitted-changes batch on `main` (site.ts restructure, org-vote-survey-attribution migration, medical/treatment/condition/survey infrastructure, four new shadcn `components/ui/*` primitives, vote-API extensions). All Critical / High-confidence-bugs / CLAUDE.md-violations / Test-gaps / Cleanup items completed; web suite was 879/879 + data 749/749 green at 14:50. Full archived review: `~/.claude/plans/please-review-all-polished-hopcroft.md`. Decisions captured below for future reference; do not re-litigate without behavior change.

### Decisions captured (do not re-litigate)

- **Q1 — `copyMode="neutral"`**: neutral partner-survey copy is intentional for embeds/nonprofit adoption. Concise + direct + useful; not full Wishonia voice if it would make partner orgs nervous.
- **Q2 — Org attribution**: `ReferendumVote` is first-org-wins, matching `referredByUserId`. Later votes from another org link must not steal attribution. Per-org `SurveyResponse` rows can record their own org context.
- **Q3 — `/conditions` vs `/agencies/dfda/conditions`**: canonical depends on host. `dfda.earth` → short paths canonical. `optimitron.com` → agency-scoped paths canonical. Use canonical metadata or host-aware redirects, not a single global canonical.
- **Q4 — dfda.earth**: keep as standalone medical surface AND expose DFDA under Optimitron's agency tree. Do not deprecate the domain by accident.
- **Q5 — `components/ui/*` shadcn files**: rewrite compatibility wrappers to brutalist/semantic tokens; preserve API surface; do not introduce a second visual system.
- **Q6 — `google-grounded-search.ts`**: do not delete while `OutcomeLabel` imports it.
- **Q7 — Treatment slug consistency**: 216 conditions, 0 missing `treatments/*.json` files. Stable.

**Coordination protocol:** mark a task `[~]` (in progress) and put your handle in parens before editing the listed files. Mark `[x]` when done. Each task lists the files it touches so a parallel agent can pick non-conflicting work. **Do not** start a `[~]` task someone else has claimed.

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
  vote link -> focused vote route -> vote -> verification -> vote sync -> invitation converted -> task verified -> dashboard updated.
  - Playwright coverage exists at `packages/web/e2e/invite-token-attribution.spec.ts`:
    1. `/vote/<code>?invite=<token>` server redirect preserves both query params.
    2. Vote-route mount effect captures the token to `localStorage` (`signup_invite_token`).
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
  - Standalone sender receipt, recipient-voted, reminder, scorecard, and re-engagement sequences were retired; sender lifecycle now lives in tasks.
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
- [x] Remove standalone sender receipt/follow-up email sequences.
  - Deleted the vote-confirmed receipt send from the referendum vote route.
  - Deleted the treaty-specific recipient-voted sender email; invite conversion now verifies the referral task and posts a generic task status update.
  - Sender follow-up, "assign one more," scorecard, and "you voted but did not share" nudges are task states, not separate `referral_sequence_*` emails.
- [x] Preserve format consistency per invite; do not mix Task Notification and Sincere variants within a recipient sequence.
  - `ReferralInvitation.messageFormat` is read for every recipient email step and covered by regression tests.
- [x] Enforce the recipient hard cap of four emails.
  - Recipient processing filters `recipientEmailStep < 4`; direct sends return `maxed` after step 4.
- [x] Enforce sender follow-up through task reminders.
  - The task reminder cron owns cadence/caps for overdue sender work; no dedicated sender reminder or monthly scorecard sequence should be reintroduced.
- [x] Suppress reminders after conversion, unsubscribe, cancellation, decline, or hard cap.
  - Recipient reminders filter converted/deleted/unsubscribed/maxed rows, declined rows are inactive, and cancel/decline clear pending recipient/sender schedules.
- [x] Use existing email preference/unsubscribe semantics instead of adding a parallel suppression system.
  - Generic task notifications use `scope: "task_notifications"`; recipient invitations use their one-click per-invite unsubscribe token.
- [x] Keep tests focused on active email paths.
  - Invitation conversion tests cover the task status update and generic task notification path.
  - Task reminder tests cover due timing, cooldowns, caps, and unsubscribe replacement for generic overdue work.

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
> 2. Add seed helpers `seedTaskCommunicationTemplate` + `seedTaskCommunicationVariants` only for active task-communication families. Do not seed retired `referral_sequence_*` sender reminders, vote receipts, monthly scorecards, or re-engagement nudges.
> 3. Add a parity test suite: for each family, render via the legacy builder and via the new engine, assert byte-equal subject/html/text across N seed inputs.
> 4. Migrate active task-notification callers to the engine. Drop treaty-only filters where the task itself can identify the communication family.
> 5. After active callers are migrated, delete any remaining legacy sequence modules that no longer own a live send path.
> 6. Fold in the deferred Phase A column migration: drop `ReferralInvitation.recipientEmailStep`, `recipientUnsubscribeToken`, `senderReminderStep`, `nextRecipientEmailAt`, `nextSenderReminderAt`, `lastRecipientEmailAt`, `lastSenderReminderAt`, `recipientEmailErrorMessage`, `recipientEmailProviderMessageId` once `TaskCommunication` rows are load-bearing.


- [ ] Collapse active builders into one `renderTaskCommunication({ task, communication, variant, tokens })` returning `{ subject, html, text }`.
  - Do not restore the deleted vote receipt, sender reminders, monthly scorecard, or re-engagement builders.
- [ ] Move active hardcoded subject/body copy into `TaskCommunicationVariant` rows only when the communication still has a concrete job.
- [ ] Replace `getTreatyParentTaskHref()`, `ROUTES.send`, `ROUTES.dashboard` reads in the email layer with task endpoint / dashboard URL data. The communication engine must not import app-route constants.
- [ ] After the engine ships, delete any remaining legacy email-sequence modules once they have no active caller.
- [ ] Add `direction: INBOUND` handling — schema-supports inbound replies but no inbound capability exists today. Implementing it is a separate multi-week project requiring DKIM/SPF/DMARC verification, References/In-Reply-To threading, spam filtering, loop prevention, and routing setup with the inbound provider (Resend Inbound / CloudMailin / SES Inbound). Do not surface "task replies via email" until those guardrails exist; manual `INBOUND_MESSAGE` comments via admin tooling are the temporary substitute.

### Phase C — Generic lifecycle, accountability, and cron

- [x] Replace `isTreatySignerTaskKey()` filters at `lib/tasks/overdue-signers.server.ts:64,87` and `lib/tasks/user-president.server.ts:29-44` with predicate filters: `task.dueAt < now && task.assigneePersonId && task.status !== TaskStatus.VERIFIED`. Leader/president highlights then work for any overdue task with an assigned official.
  - `countOverdueSigners()` and `getOverdueSignerHighlights()` now key off overdue assigned-official task data instead of treaty task-key prefixes.
  - Added coverage proving a non-treaty assigned official task can be highlighted.
- [x] Remove the treaty vote-confirmed receipt from `app/api/referendums/[slug]/vote/route.ts`.
- [x] Remove the treaty-specific recipient-voted email from `app/api/referendums/[slug]/vote/route.ts`.
  - Invitation conversion now verifies the referral-invitation task, creates a `STATUS_UPDATE` task comment, and fans out through the generic task comment notification path.
  - Deleted the now-empty treaty sender email module.
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
  - Leave the screen sequence (`opening`, `stakes`, `nuclear`, `math`, `neat`, `twoHumans`, `perVote`, `sendMessage`) and the narrative copy (nuclear / wasteful-apocalypses / chain-letter screens) inside `TreatyPostVoteShareFlow.tsx`. They are deliberately campaign-specific persuasion. Do **not** move them to database rows.
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
  - **Decision (2026-04-30): EOPs are dead.** Impact accounting is denominated in USD (`STANDARD_ECONOMIC_QALY_VALUE_USD` for health, real after-tax income for income). No "Earth Optimization Points" unit. Public reward-credit labels — if any — must be a thin display layer over impact USD components, not a separate unit.
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
  - Decide whether public "VOTE Points" surfaces become a generic contribution-credit label, stay as a treaty-specific label, or get replaced by impact USD. Do not introduce new invented units (no EOP — see decision above).
  - Use "You have been hired by Earth Optimization Services as a project manager" as campaign copy, not legal/employment semantics.
  - Do not rename `ReferralInvitation` to `EmploymentNotification`; keep `ReferralInvitation` as the internal invite-token lifecycle model and use "task assignment" / "employment notification" only where it improves user-facing copy.
- [ ] Plan the schema migration as a separate architecture slice.
  - Candidate replacement for `WishPoint`: `ContributionCreditLedger`, `ImpactCreditLedger`, or similar dollar-backed ledger.
  - Candidate replacement for `VoteTokenMint`: generalized reward-credit mint only if on-chain payout claims generalize beyond votes.
  - Preserve old rows with a reviewable migration; no destructive reset.
  - Add reporting tests that prove the same action cannot mint duplicate payout-eligible reward credit.

### Reference docs

- **Task ranking — Optimization Rate formula:** `EV/hr + (Downstream Value * 0.2 * P(success) / Hours)`. The `0.2` factor models the expected lift from completing a prerequisite. Full table + filter views in `docs/EXPECTED_VALUE_DATABASE.md`.
- **Vote flow spec (current = `treaty_flow_v2_context_first`):** `docs/questions.md`. Variant comparison + URL override rules in `docs/treaty-flow-variants.md`.

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
- [ ] Trademark filings: "Earth Optimization Services," "Earth Optimization Fund." (No EOP filing — that unit was killed on 2026-04-30 in favor of USD-denominated impact accounting.)
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
