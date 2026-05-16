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
- `/humanity-v-government` and `/court` still need to unify plaintiff
  registration, verdict voting, and treaty settlement.
- Visual review includes email screenshots; preview DB drift and unexplained
  missing screenshots still waste review time.

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

## P0 - Auth UX fixes

- **Login page: form stays clickable after submit → sends N magic-link
  emails for N clicks.** Confirmed bug: a real user pressed Submit
  multiple times and received many emails. `AuthForm.tsx:322-330`
  uses `isLoading` (in-flight) to disable the button, but on
  success `isLoading` resets to false — the button becomes
  re-clickable. Fix: introduce a "submitted" state distinct from
  "loading". After success, HIDE the email field + submit button
  + the Google button (lock in the choice), and render a centered
  "check your email" confirmation in the same vertical position
  the form was. On error, restore the form. Bonus defense: server-
  side rate-limit magic-link sends per-email-per-window so even
  bypass (DevTools, scripting) can't spam.
- **Login page: post-submit "check your email" message gets lost when
  scrolled.** Same bug as above — covered by hiding the buttons +
  scroll-centering the confirmation in the form's slot.
- **Login page: excess space between slider (CTA / framing element)
  and the submit button pushes the submit below the fold.** Reduce
  vertical spacing so the entire form is visible above the fold on
  common mobile viewports without scrolling. Audit gap-* / mt-* / py-*
  on the AuthForm container.
- **Wishonia email signature uses `smirk-smile.png` — reads as a
  weird/sarcastic smile.** Swap to `happy-smile.png` (already in
  `packages/web/public/sprites/wishonia/`). Single-line change in
  `packages/web/src/lib/email/wishonia-signature.ts:17` (constant
  `WISHONIA_AVATAR_PATH`) + update the matching test fixture in
  `packages/web/src/lib/email/__tests__/wishonia-signature.test.ts:92`.
  Trivial-tier dispatch.
- **Rename "direct reports" → "employees" across user-facing surfaces.**
  Non-tech users don't read "direct reports" — it's HR jargon. "Employees"
  works AS satire (you are now the boss of 8 billion employees) and is
  universally understood. Locations:
  - `packages/web/src/lib/humanity-manager-promotion-content.tsx:68`
    (`"8 billion direct reports — humans you are responsible for..."`)
  - `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx:1144,1148`
    (`"${recipientLabel} added to your direct reports"` — TWO instances)
  - `packages/web/src/lib/email/monthly-chain-digest-email.ts:40,67`
    (the JSDoc comment + the trigger description metadata; the metadata
    surfaces in the rendered email)
  - `packages/web/src/lib/email/monthly-chain-digest.email.md:15`
    (auto-regenerated when source changes + smart `copy:preview` runs)
  Plus matching test fixture updates. Trivial-tier dispatch.
- **Email body text rendered at 12px is too small to read.** Confirmed:
  `packages/web/src/components/adaptive/email-styles.ts:82` defines
  `smallMutedParagraph` at `fontSize: "12px"`. The humanity-manager
  promotion email's middle paragraph block ("You probably do not have
  time to persuade [8 billion] humans yourself...", 200+ words at
  `humanity-manager-promotion-content.tsx:112-152`) renders with the
  `muted` flag → that 12px style. Best practice for email body copy
  is 14-16px minimum; 12px is for legal disclaimers / footnotes, not
  multi-paragraph prose. `mutedParagraph` at 13px (line 78) is also
  borderline.
  - Fix candidates: (a) bump `smallMutedParagraph` to 14px; (b)
    deprecate `smallMutedParagraph` and route prose through
    `mutedParagraph` (13px) or `paragraph` (16px); (c) drop the
    `muted` flag on long-form `PromoText` blocks and only keep it
    for one-line asides.
  - Most defensible quick fix: (a) + change the
    humanity-manager-promotion call to drop `muted` for the long
    block (line 112) and use it only for the short closing aside.
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
- **Grandma Kay's avatar is a full-body photo cropped weird by
  `aspect-square`.** Confirmed: `packages/web/public/img/grandma.jpg`
  is 1155×2257 (~2:1 vertical, full-body portrait). The
  `PersonFaceTile` component (and any other `aspect-square +
  object-cover` slot) crops to the centered region, which is her
  mid-torso, not her face. Fix: create a square head-only crop
  (e.g. `/img/grandma-headshot.jpg`, ~1024×1024) and update
  `packages/db/src/managed-data/managed-grandma-kay.ts:37,45` to
  point at the new file. Keep the full-body image accessible if
  anything else uses it (grep first; otherwise delete to clean up).
  Trivial-tier dispatch once the cropped file exists.

- **Plaintiff-registration aspect-ratio handling — seed images bypass
  the existing cropper.** `SquarePhotoCropper` is already wired into
  `RepresentedPersonForm` / `ManageRepresentedPeopleClient` /
  `OrganizationProfileEditor` / `ProfileCard`, so users uploading
  new plaintiffs DO get a square crop step. The gap is
  managed-data seeded images (e.g. Grandma Kay) — they go straight
  to the database without passing through the cropper, so a tall
  portrait can land in a `aspect-square` tile cropped wrong.
  - Right fix: a managed-data validation step that rejects
    non-square seed images (or auto-crops them server-side at sync
    time). Sync step lives at
    `packages/db/scripts/sync-managed-data.ts`; image-fetch helper
    at `packages/web/src/lib/storage/image-fetcher.ts` if one
    exists, otherwise inline the square-crop in sync. Use
    `sharp` (already a dep for image work elsewhere if any
    package uses it; grep before adding).
  - Cheaper-but-uglier fix: just commit pre-cropped square images
    for every managed-data seed person and don't add validation.
    Easier today, fragile tomorrow.

- **Printable signs / posters with QR codes pointing at warondisease.org.**
  Physical-world distribution channel: a sheet someone prints, posts on
  a coffee shop bulletin board / dorm wall / office, and passers-by scan
  the QR to vote. Each print can carry the printer's referral code, so
  physical distribution feeds the same propagation math as digital
  sharing.
  - **New route:** `/poster` (or `/sign` per Mike's framing). Logged-in
    users see their referral code pre-filled in the QR. Logged-out
    users get a generic QR to `warondisease.org`.
  - **Style selector** — multiple printable aesthetics:
    - **Treaty editorial** (default, matches existing site)
    - **Soviet/constructivist** (red + black, geometric, bold type)
    - **WPA public-service** (typography-heavy, 1930s civic poster)
    - **UK wartime minimal** ("Keep Calm"-style: single color, calm
      typography, single message)
    - **Bauhaus geometric** (limited palette, asymmetric, strong type
      hierarchy)
    - **NOT included: Nazi-era styling.** The user mentioned it as an
      example, but the specific visual vocabulary is historically
      poisoned and would do real damage to the campaign's credibility.
      Soviet/WPA/UK styles communicate the same "urgent civic
      mobilization" energy without the association.
  - **Reuse existing OG image generation** as the central image where
    appropriate. Next.js `opengraph-image.tsx` files at
    `packages/web/src/app/**/opengraph-image.tsx` already produce
    per-entity 1200×630 PNGs via the edge runtime — a poster can
    embed a downscaled version of e.g. `humanity-v-government`
    OG or `tasks/[id]` OG to anchor the visual.
  - **QR generation** — `qrcode.react@4.0.1` is already installed
    and in use (`slide-final-call-to-action.tsx`). The QR target is
    `https://warondisease.org/r/<referralCode>` (or bare
    `warondisease.org` for logged-out users). Generate as SVG for
    print-clean rendering. Cite via `ParameterValue` where the "30
    seconds" claim appears (matches existing parameter pattern).
  - **Print flow** — letter (8.5×11) and A4 sizes, both supported.
    Browser print via `@media print` CSS that hides chrome and
    expands the poster fullscreen. "Download PDF" button as
    secondary option (use `react-pdf` or a headless-render route;
    don't bring in puppeteer just for this).
  - **Message text** — copy comes from `share-templates.ts` (the
    canonical voice-variant registry per the email-template-audit
    plan); poster surface picks one variant by default but allows
    user override. Reuses the dispatch-time recipient-mode
    filtering.
  - **Plan-first dispatch.** This touches: new app route, new
    components, OG-image reuse, print CSS, optional PDF gen,
    share-templates integration. Crosses too many systems for a
    `trivial:` bypass.

- **Standardize "apocalypse" framing across the project.** Ivy (real-
  user feedback) said *"a hundred of them ends civilization is a
  confusing sentence."* The word "apocalypse" treats civilization-
  ending event as a countable unit, and "122 apocalypses" / "trade
  one apocalypse" doesn't land for people who haven't been told the
  causal chain (~100 warheads → nuclear winter → food system collapse
  → civilizational collapse; we stockpiled ~12,200 → 122x overkill).
  Pick ONE standardized phrasing, parameter-back it, sweep all
  surfaces.
  - **User-facing surfaces to update (one consistent phrasing):**
    `Footer.tsx:44,50` (header tagline) ·
    `donate/page.tsx:51` ·
    `endorse/page.tsx:185` ·
    `DonationCalculationNarrative.tsx:397` ·
    `TreatyPostVoteShareFlow.tsx:802,809,812,862,871,948` (6 uses)
    in the post-vote sharing flow ·
    `TreatyVoteFlow.tsx:558,571,579,588` (pre-vote screens incl. the
    *"More apocalypses please"* button label) ·
    `managed-task-triggers.ts:142` (the reminder-template prose
    used in every nudge email) ·
    `managed-grandma-kay.ts:83,91` (*"She would trade one apocalypse
    for dementia research"* — keep the trade frame but rephrase).
  - **NOT user-facing — leave as-is or rename only with the
    standardized term:** `TreatyVoteFlow.tsx:66` (the
    `PreVoteScreen` type literal `"apocalypse"`), e2e screen
    identifiers, test fixtures, the `APOCALYPSE_MARKUP` /
    `APOCALYPSE_MARKUP_MULTIPLIER` / `PRICE_OF_APOCALYPSE`
    parameter slugs (renaming the parameter slug touches every
    citation URL — high cost, low benefit unless we're doing it
    anyway).
  - **Candidate phrasings to pick between:**
    - A) Causal-chain version (Ivy's suggestion): *"It takes 100
      nuclear weapons to trigger nuclear winter and collapse the
      global food system. Humanity stockpiled 12,200. The 1% Treaty
      trades 100 of those weapons (one civilization's worth of
      overkill) for disease eradication."* — explicit, no
      assumed knowledge, longer.
    - B) Overkill-layer version: *"Humanity has 122x the warheads
      needed to end civilization. Trade ONE of those 122 layers of
      overkill for disease eradication. The other 121 stay; the
      deterrent doesn't move."* — keeps the trade frame, makes the
      absurdity explicit, doesn't require defining "apocalypse."
    - C) Civilization-ending winter version: *"Humanity has 122
      civilization-ending nuclear winters ready to deploy. Trade
      ONE for disease eradication."* — shortest, drops "apocalypse"
      entirely.
  - **My honest recommendation: B (overkill-layer).** It keeps
    Wishonia's dry "spending one layer of overkill" frame, names
    the absurdity (we have 122x what we need), and explicitly
    preserves the deterrent argument (*"the other 121 stay"*) which
    pre-empts the most common objection. A is most defensible but
    long. C is shortest but loses the "trade" frame's punch.
  - **Implementation note:** the standardized phrasing should be
    parameter-backed via `ParameterValue` where the numbers appear,
    and the prose templates should live in a single constants
    module that all surfaces import — so a future rewording is one
    edit, not a sweep across 12 files.

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
  commit the treaty/h-v-g/endorse markdown snapshots so citation URLs reflect
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
- Today only `TreatyReminderComposer` reads from it. `monthly-chain-digest`,
  `post-vote-share`, `referral-first-conversion`, and `task-comment-notification`
  emails hand-roll their own reminder copy — confirmed for monthly-chain-digest,
  audit needed for the others.
- Migration: every email module that includes reminder/share copy should pull
  recipient-appropriate templates from `share-templates.ts` (filtered by the
  email's `recipientModes`), interpolate via `renderTemplate`, and pick a
  default variant. Hand-rolled copy stays only when no template fits AND a new
  template would be too narrow to reuse.
- Audit task: grep all `packages/web/src/lib/email/*.ts` and
  `*-react-email.tsx` for hardcoded "Sign now"/"Vote"/"You haven't voted yet"-
  shaped prose and replace with template lookups.

### Humanity Manager status report

- Extract reusable status sections from the monthly digest into a shared module
  that can render both email and dashboard forms.
- Data needed:
  - direct reports who completed their task;
  - overdue humans assigned through the user's link;
  - overdue presidents;
  - total downstream conversion count and depth from a recursive chain query.
- Replace direct-only monthly counts with transitive chain counts when the query
  is ready.
- The dashboard version should expose copyable messages for overdue humans and
  presidents instead of motivational filler.

### Forward to someone better fit

- Add a lightweight `mailto:` affordance to task-assignment emails: prefilled
  task title, task link, and a short "this was sent to me but you are better
  fit" note.
- Do not build delegation APIs, new Person confirmation flows, or rate-limit
  systems until forward conversions become a measured channel.

## P1 - Organizations Endorse, Embed, and Recruit

- Persist the organization grant/application workflow: request data, review
  status, and follow-up outreach. The current calculator/request framing is not
  enough for operational follow-through.
- Keep organization attribution first-org-wins for `ReferendumVote`, matching
  `referredByUserId`. Later org links should not steal attribution.
- Add approved public organizations to dynamic sitemap output so partner and
  supporter pages can be indexed.
- Keep neutral partner/embed copy where full Wishonia voice would make adoption
  harder. Partner-safe is not the same as bland.
- Adopt the "Authorized Earth Optimization Services Provider" framing for
  partner orgs in campaign-facing copy. Extends the corporate-promotion voice
  from the post-vote-share email: voters are Humanity Managers at Earth
  Optimization Services LLC; partner orgs are Authorized Earth Optimization
  Services Providers, each with a vendor-style certification badge they can
  display. Update `/endorse` to register orgs under this category. Per the
  neutral-partner-copy note above: keep the application form itself
  professional enough not to scare off serious nonprofits — AEOSP framing
  lives in campaign-facing pages, shared snippets, and the badge artifact,
  not the onboarding form.

## P1 - Plaintiffs and Court Framing

### `/humanity-v-government` plaintiff-first rework

- Primary action becomes plaintiff registration. Hero CTA: "Name your dead" or
  the strongest approved variant, not "Support the settlement."
- Show a running plaintiff count near the hero. Named plaintiffs are harder to
  ignore than an anonymous vote total.
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

- Verify `/humanity-v-government` and `/court` are in the static route list for
  War on Disease.
- Add approved organizations to the dynamic sitemap.
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

## Parked Unless They Directly Unblock 4B

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
- Donate-to-fund-task marketplace, Stripe Connect disbursement, WISH airdrop,
  VOTE-for-task-completion, monthly distributions, DAO-governed funding.
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
