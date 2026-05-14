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
5. Pressure country leaders and treaty signers.
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

## P1 - Pressure Leaders and Treaty Signers

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

- Multi-agent/service-account architecture plans; AP2 / ACP / x402 payments.
- Optimitron root rewrite and `/features` archive.
- Donate-to-fund-task marketplace, Stripe Connect disbursement, WISH airdrop,
  VOTE-for-task-completion, monthly distributions, DAO-governed funding.
- DIH migration, generic referendum/commission/EV-calculator work outside the
  campaign path, and broad email file renames.
- Neobrutalist cleanup outside touched public campaign surfaces.
