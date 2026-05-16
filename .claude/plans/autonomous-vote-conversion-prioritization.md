# Autonomous Vote Conversion Prioritization

Slug: `autonomous-vote-conversion-prioritization`
Branch: `feature/plaintiffs-variant-1-and-copy-hooks` (will spin a new `feature/...` branch per shipped item)
Date: 2026-05-16
Author: Claude (drafted on Mike's direction, revised by Codex critique round 1)
Status: DRAFT - awaiting `/autoplan` Phase 4 final gate + Mike approval

## Brief

**Goal:** rank the next campaign work by expected autonomous treaty votes per month, not by PR neatness. Output: a concrete 4-week roadmap of the top 5-7 items, each scoped so Mike can review it on his phone, with no plan that depends on Mike personally emailing or calling humans.

**Mike's verbatim brief:**
> "should we start an /autoplan. review the todo.md and strategize and calculate the value of each thing in terms of getting us more votes like I don't want to have to like email anyone or communicate with humans. I want this thing to just like get all the votes itself and good. I guess organizations to put it on their websites stuff"

**Revised scoring model:**
- **V** = expected incremental treaty votes per 30-day month after the item is live. Plain vote/month estimate, not log scale and not "votes per PR."
- **E** = elapsed dev-days to ship, verify, get screenshots/copy review where required, and open the PR. A tiny PR still costs at least 0.5 days because review/deploy latency is real.
- **A** = autonomous distribution multiplier. `1.0` = existing traffic/search/product/referral loop drives usage with no Mike outreach; `0.7` = self-serve distribution exists but adoption depends on org/admin discovery; `0.4` = partners must notice/adopt it; `0.1` = effectively requires Mike outreach.
- **Score** = `(V * A) / E`, reported as autonomous votes/month unlocked per dev-day.

The score selects the work; the execution order below also respects dependency and safety gates. In particular, the CI filter and login bug ship before the org button because bad CI and auth spam slow or poison every later conversion experiment.

Two strategic levers Mike named explicitly:
1. **Site converts visitors autonomously** - no Mike-in-the-loop per vote.
2. **Org-embeddable/copyable vote surface** - let organizations put a treaty vote button or badge on their own sites. The first version must be copyable HTML linking to `/treaty?ref=<orgSlug>`; iframe voting/auth is a later project, not the 3-day PR.

## Current state (ASCII)

```
TODO.md (~700 lines, 7 priority groups):

P0 - Auth UX fixes (login button respam, mobile fold, font sizes)
P0 - Treaty vote conversion (/treaty boring+fast, dashboard, tasks)
P0 - Referral propagation (share templates, HM digest, K-factor missing)
P1 - Organizations Endorse/Embed/Recruit (survey embed exists, treaty vote badge missing)
P1 - Person/Org Conversion Surfaces (prior PR-A through PR-E roadmap)
P1 - Plaintiffs and Court Framing (/humanity-v-government rework, /court ops)
P2+ - Distribution channels (posters, QR, search/LLM surfaces)

Repo facts that change the plan:
  - /organizations/[id] already resolves both id and slug; do not create /orgs/[slug].
  - /orgs/[slug] currently exists only for admin/reasoning paths.
  - packages/db/src/task-keys.ts already exists; new persistent task keys go there first.
  - Person.isPublicFigure already exists in Prisma; no schema migration for public figures.
  - packages/web/src/lib/site-structured-data.ts exists; structured data should be extended, not invented.
  - No app/llms.txt route exists yet.
  - ShareAttempt, ReferralClick, ReferralInvitation, and ReferendumVote already provide most K-factor raw material.
  - Organization pages already expose survey URL/button/iframe copy fields, but not a treaty vote button/badge.
  - /treaty currently renders TreatyNameSignatureBox without parsing search params; org referral/attribution needs verification before promising /treaty?ref=<orgSlug>.
  - web-e2e-validate currently runs in .github/workflows/ci.yml; skipping the whole workflow with paths-ignore would hide regressions.

Capabilities already shipped (don't redo):
  - /treaty skim-and-sign single page
  - Post-vote email share kit
  - Humanity Manager corp-org-chart framing
  - /people/[id] conversion surface (PR #81)
  - /plaintiffs above-form Variant 1 (PR #84)
  - SufferingPreventedMetric shared component
  - Organization survey link/button/iframe copy surface on /organizations/[id]
```

## Proposed state (ASCII)

```
Top 7 execution queue for next 4 weeks
(order includes safety/dependency gates; score is monthly vote leverage):

#1: SAFE JOB-LEVEL PATHS-FILTER FOR WEB E2E        V=20/mo,  E=0.5d, A=1.0 -> Score 40
    - Keep CI workflow running; gate expensive web-e2e steps/jobs with paths-filter.
    - Do not use workflow-level paths-ignore.
    - Value is throughput/risk reduction, not a fake vote machine.

#2: LOGIN FORM-STAYS-CLICKABLE BUG                V=50/mo,  E=0.5d, A=1.0 -> Score 100
    - Prevent duplicate magic/sign-in emails after success.
    - Required before driving more logged-out treaty traffic through org badges.

#3: COPYABLE ORG TREATY BUTTON/BADGE              V=300/mo, E=1.0d, A=0.7 -> Score 210
    - Extend existing /organizations/[id], do not add /orgs/[slug].
    - Copyable HTML button/badge links to /treaty?ref=<orgSlug>.
    - No cross-origin iframe voting, no auth-in-iframe, no JS snippet.

#4: EMBED DISTRIBUTION SPEC + SELF-SERVE SURFACE  V=500/mo, E=2.0d, A=0.8 -> Score 200
    - Solve discovery: where org admins find the badge, what they copy, how it credits them.
    - Add sitemap/indexing for approved org pages and a partner-safe install checklist.
    - Define the later iframe contract, but do not build it in this phase.

#5: K-FACTOR INSTRUMENTATION                      V=160/mo, E=1.5d, A=1.0 -> Score 107
    - Track visitor -> sign -> share -> click -> referred vote by source.
    - Report per-channel K: personal referral, org badge, email share, post-vote share.
    - Use existing ShareAttempt/ReferralClick/ReferendumVote where possible.

#6: LLMS.TXT + STRUCTURED DATA DISTRIBUTION       V=200/mo, E=1.5d, A=1.0 -> Score 133
    - Add /llms.txt and extend existing schema.org graph for treaty/org/signatory surfaces.
    - Improve search and AI-agent discovery without Mike outreach.
    - Keep facts parameter-backed and route-metadata-backed.

#7: FOUNDATION ACTION TASK KEYS + LIGHT ORG TASKS V=120/mo, E=2.0d, A=0.9 -> Score 54
    - Add 5 campaign action task keys in packages/db/src/task-keys.ts first.
    - Seed tasks in managed data after keys exist.
    - Extend /organizations/[id] with a below-fold light task DTO and revalidate strategy.

Deferred but reshaped:
  - Public-figure catalog becomes an import/review pipeline with 5 pilot records.
  - Apocalypse copy sweep becomes a plan-first copy project, not a trivial grep sweep.
  - Full cross-origin voting iframe waits until badge attribution and auth are proven.
```

## Step list

### Dispatch sequence

For each item: tighten scope, verify the exact files, write a short plan section if the item touches multiple systems, run Codex critique, dispatch, review, capture screenshots for UI/copy, and open the PR. Mike reviews PR + screenshots + changed copy before commit when the repo rules require it.

**Week 1**

- **Item #1 - Safe job-level paths-filter for web-e2e**
  - Modify `.github/workflows/ci.yml`.
  - Add a lightweight `changes`/filter step or job using job-level path filtering, then guard expensive `web-e2e-validate` install/build/playwright steps or split the expensive work behind `if:`.
  - Required behavior: the CI workflow and required check still complete successfully on markdown-only/non-web PRs; relevant web, shared package, Prisma, lockfile, route, content, and Playwright changes still run e2e.
  - Explicitly forbidden: top-level `on.pull_request.paths-ignore` or any filter that prevents the required workflow/check from reporting.
  - Plan-first? NO - one workflow, high safety requirement, direct implementation.

- **Item #2 - Login form-stays-clickable bug**
  - Modify `packages/web/src/components/auth/AuthForm.tsx`.
  - Add a durable submitted/success state distinct from in-flight loading so the submit button does not re-enable after email success.
  - Add/adjust focused tests around email-provider success, duplicate click prevention, and callback URL/referral persistence.
  - Screenshot the affected sign-in state locally before commit.
  - Plan-first? NO - single-component bug fix, but do it before org badge traffic.

**Week 2**

- **Item #3 - Copyable org treaty button/badge**
  - Extend `packages/web/src/app/organizations/[id]/page.tsx`; the existing route already accepts slug via `OR: [{ id }, { slug: id }]`.
  - Add a treaty vote URL and copyable HTML button/badge for approved organizations. Initial contract: `/treaty?ref=<orgSlug>`.
  - Before implementation, verify whether `/treaty?ref=<orgSlug>` should overload the current user-referral `ref` semantics or whether the button needs `?org=<orgSlug>` plus a redirect/compatibility shim. Current vote API has separate `ref` and `organizationSlug` fields; do not silently break user referral attribution.
  - Keep it copyable HTML only: no cross-origin iframe voting, no JS snippet, no auth inside an iframe.
  - Copy must be partner-safe and reviewed before commit.
  - Screenshot `/organizations/<approved-org-slug>` after the change.
  - Plan-first? BORDERLINE - write a short pre-dispatch contract note if query semantics are not obvious.

- **Item #4 - Embed distribution spec + self-serve surface**
  - Plan-first? YES - this is product distribution, not a widget.
  - Plan file: `.claude/plans/org-embed-distribution.md`.
  - Define: who sees the install controls, where approved org pages are indexed, how org admins find the badge, what exact copy they paste, how attribution is verified, and what the later iframe version must support.
  - Extend, do not duplicate, `packages/web/src/app/organizations/[id]/page.tsx`.
  - Add approved public organizations to `packages/web/src/app/sitemap.ts` if not already covered.
  - Keep tasks and secondary controls below the vote badge so the page does not become an admin dashboard.

**Week 3**

- **Item #5 - K-factor instrumentation**
  - Plan-first? YES - this spans analytics, DB-derived metrics, and reporting.
  - Define the KPI table before code:
    - `visitors_by_source`
    - `treaty_signatures_by_source`
    - `share_attempts_per_signer`
    - `referral_clicks_per_share_attempt`
    - `votes_per_referral_click`
    - `K = share_attempts_per_signer * referral_clicks_per_share_attempt * votes_per_referral_click`
  - Prefer deriving from existing `ShareAttempt`, `ReferralClick`, `ReferralInvitation`, and `ReferendumVote` records before adding schema.
  - Add client analytics only where it changes product decisions; do not create metrics theater.
  - Candidate files: `packages/web/src/lib/analytics.ts`, `packages/web/src/app/api/share-attempts/route.ts`, `packages/web/src/lib/referral-redirect.server.ts`, `packages/web/src/app/api/referendums/[slug]/vote/route.ts`, and an existing dashboard/admin reporting surface.

- **Item #6 - /llms.txt + structured data distribution**
  - Add `packages/web/src/app/llms.txt/route.ts`.
  - Extend `packages/web/src/lib/site-structured-data.ts` and tests instead of creating a parallel structured-data system.
  - Include treaty, organization endorsement, signatory, and action URLs that are real, indexed, and useful to search/LLM agents.
  - Add route metadata/sitemap/robots links only if they are supported by current Next.js patterns.
  - Plan-first? NO for `/llms.txt`; YES if expanding route-specific JSON-LD beyond the existing site graph.

**Week 4**

- **Item #7 - Foundation action task keys + light org task display**
  - Add all new persistent task constants/builders to `packages/db/src/task-keys.ts` first.
  - Seed task rows in `packages/db/src/managed-data/managed-seed-data.ts` using those constants.
  - Extend `packages/web/src/lib/organization.server.ts` with a narrow DTO for org action tasks. Select only what the page renders.
  - Extend `packages/web/src/app/organizations/[id]/page.tsx` with a below-fold task list and a revalidation strategy; do not turn the public org page into a task admin screen.
  - Tests should guard the task-key contract and the light DTO, not mock-and-assert wiring.
  - Plan-first? YES if the task display includes claiming/assignment. NO if it is read-only links below the fold.

### Items explicitly DEFERRED after critique

| Item | Disposition |
|------|-------------|
| Full org iframe voting/auth embed | Deferred. Cross-origin iframe + auth + vote submission + attribution is not a 3-day PR. Start with copyable HTML badge. |
| Public-figure catalog of 50 hand-curated people | Deferred and reshaped. `isPublicFigure` already exists; 50 is too small to matter and large enough to create defamation/review risk. Build import/review pipeline + 5 pilots later. |
| `/orgs/[slug]` public conversion surface | Rejected. It duplicates `/organizations/[id]`, which already resolves slug. Extend the existing route. |
| Standardize apocalypse framing | Deferred to a real copy plan. It touches many surfaces and user-facing copy; not a trivial grep sweep. |
| Assign-task admin UX | Deferred until security review covers Mermaid SVG injection, `innerHTML`, remote/external images, authz, moderation, and audit behavior. |
| `/court` operational rework | Deferred. Potentially valuable, but not the highest autonomous vote/month channel yet. |
| Printable signs/posters | Deferred. Requires physical-world distribution unless paired with autonomous QR generation and an existing print/distribution channel. |
| Email body min-font-size validation | Deferred. Useful quality guard, but lower vote/month than org badge/search/referral instrumentation. |
| "Remind country leaders" outreach | Filtered out. It requires direct human outreach, against the brief. |

### Items REQUIRING MIKE OUTREACH (filtered out per his ask)

- Organization-by-organization coalition outreach
- Press / journalist contact
- Manual public-figure endorsement negotiation
- AEOSP certification rollout that depends on Mike personally recruiting partners
- Country leader reminders without an autonomous sender/channel

## Risks

- **Votes/month estimates are still speculative.** They are now honest about the unit, but not causal. Mitigation: Item #5 ships K-factor instrumentation so month 2 ranking uses observed conversion by source.
- **CI speedup can become rationalized tooling.** It stays only because it is tiny, safe if job-level, and unblocks iteration. If it grows past 0.5 dev-days, drop it behind direct vote work.
- **`/treaty?ref=<orgSlug>` may conflict with current referral semantics.** Current vote submission distinguishes user `ref` from `organizationSlug`. The org badge PR must define/verify the attribution contract before shipping public HTML.
- **Org badge still needs distribution.** A copyable badge with no install path is just a prettier TODO. That is why Item #4 follows immediately.
- **Org task display can overfetch and bury the vote action.** Keep a light DTO, below-fold placement, and revalidation; the first screen remains treaty vote/referral action.
- **Structured data and `/llms.txt` can become SEO theater.** Include only real, canonical campaign URLs and parameter-backed claims. Do not stuff pages with generic nonprofit copy.
- **Public-figure records are legally and reputationally risky.** Do not claim endorsement without documented public statements. The plan now defers bulk records and starts with an import/review pipeline plus 5 pilots.
- **Apocalypse copy is copy-review gated.** It changes user-facing persuasion copy across many pages and emails. It needs review, screenshots where applicable, and exact changed-copy output before commit.
- **Assign-task surfaces are security-sensitive.** Mermaid rendering currently injects SVG via `innerHTML`, and remote image handling must be controlled before admin task assignment becomes broader.
- **UI/copy rules still apply.** Any touched public UI needs screenshots and Mike screenshot approval before commit; any user-facing copy needs changed-copy review before commit.

## Files to touch (per item, summary)

```
#1 SAFE JOB-LEVEL PATHS-FILTER FOR WEB E2E:
  .github/workflows/ci.yml

#2 LOGIN FORM-STAYS-CLICKABLE:
  packages/web/src/components/auth/AuthForm.tsx
  packages/web/src/components/auth/AuthForm.test.tsx              (new focused duplicate-submit test)
  packages/web/e2e/treaty-vote-login.spec.ts                     (only if browser auth regression coverage is needed)

#3 COPYABLE ORG TREATY BUTTON/BADGE:
  packages/web/src/app/organizations/[id]/page.tsx
  packages/web/src/components/organizations/OrganizationCopyField.tsx   (reuse; change only if needed)
  packages/web/src/lib/site.ts or packages/web/src/lib/routes.ts         (only if a shared treaty org URL helper is needed)
  packages/web/src/components/treaty/TreatyNameSignatureBox.tsx          (only if /treaty ref/org capture is missing)
  packages/web/src/app/treaty/page.tsx                                  (only if search-param plumbing is needed)
  packages/web/src/components/treaty/TreatyNameSignatureBox.test.tsx     (focused attribution tests)
  packages/web/src/app/api/referendums/[slug]/vote/route.test.ts        (organizationSlug/ref contract)

#4 EMBED DISTRIBUTION SPEC + SELF-SERVE SURFACE:
  .claude/plans/org-embed-distribution.md
  packages/web/src/app/organizations/[id]/page.tsx
  packages/web/src/app/organizations/page.tsx
  packages/web/src/app/sitemap.ts
  packages/web/src/lib/organization.server.ts
  packages/web/src/lib/routes.ts                                      (only if route metadata/nav review flags change)

#5 K-FACTOR INSTRUMENTATION:
  packages/web/src/lib/analytics.ts
  packages/web/src/app/api/share-attempts/route.ts
  packages/web/src/lib/referral-redirect.server.ts
  packages/web/src/app/api/referendums/[slug]/vote/route.ts
  packages/web/src/lib/dashboard.server.ts or existing admin metrics surface
  packages/web/src/lib/__tests__/referral-redirect.server.test.ts
  packages/web/src/lib/__tests__/referral.server.test.ts
  packages/web/src/app/api/share-attempts/route.test.ts              (new if API behavior changes)

#6 LLMS.TXT + STRUCTURED DATA DISTRIBUTION:
  packages/web/src/app/llms.txt/route.ts                             (new)
  packages/web/src/lib/site-structured-data.ts
  packages/web/src/lib/__tests__/site-structured-data.test.ts
  packages/web/src/app/robots.ts                                     (only if advertising llms.txt there)
  packages/web/src/app/sitemap.ts                                    (only if canonical URL set changes)
  packages/web/src/lib/routes.ts                                     (route metadata source)

#7 FOUNDATION ACTION TASK KEYS + LIGHT ORG TASKS:
  packages/db/src/task-keys.ts
  packages/db/src/managed-data/managed-seed-data.ts
  packages/db/src/managed-data/sync-managed-tasks.test.ts
  packages/web/src/lib/tasks/task-keys.ts                            (re-export/update if needed)
  packages/web/src/lib/organization.server.ts
  packages/web/src/app/organizations/[id]/page.tsx
  packages/web/src/components/organizations/OrganizationTaskList.tsx  (new only if display deserves a component)
```

## ALERTS

- Mike approval needed for the public attribution contract: keep Eng's `/treaty?ref=<orgSlug>` suggestion, or use a safer explicit `?org=<orgSlug>` and preserve `ref` for user referrals.
- No Prisma schema changes are approved by this plan.
- Do not commit user-facing copy changes from Items #3, #4, #6, or #7 until Mike reviews the changed copy.
- Do not commit UI changes from Items #2, #3, #4, or #7 until screenshots are captured, inspected, and Mike approves or waives screenshot review.
- If Item #1 cannot be kept to job-level filtering with required-check success, drop it rather than weakening CI.

## Agent log

- 2026-05-16 - Codex critique round 1 incorporated. Replaced vote-per-PR scoring with votes/month scoring, demoted iframe embed, added missing distribution/K-factor/LLM-search items, removed schema migration for `isPublicFigure`, redirected org work to existing `/organizations/[id]`, and added security/overfetch caveats.

## Mike approved

(NOT YET - pending `/autoplan` Phase 4 final gate)

## Codex critique (round 1)

### CEO findings

- **Finding:** Plan scored vote-per-PR instead of vote-per-month. **Disposition: accepted.** V is now expected incremental treaty votes per 30-day month; E is elapsed dev-days; Score is autonomous votes/month per dev-day.
- **Finding:** Autonomy filter measured CEO-energy, not vote-max. **Disposition: partially accepted.** A now measures autonomous distribution. Direct Mike outreach still filters out because the brief explicitly forbids depending on Mike emailing/calling humans.
- **Finding:** Embed widget #1 had no distribution mechanism. **Disposition: accepted.** The plan splits the work into copyable org badge first and embed-distribution spec/self-serve surface immediately after.
- **Finding:** CI speedup was rationalized tooling. **Disposition: accepted.** CI stays only as a 0.5-day safety/throughput item with low direct V; if it expands, it should be dropped behind direct vote work.
- **Finding:** Public-figure 50 seeds is three orders of magnitude too small. **Disposition: accepted.** Bulk manual seeding is deferred; later work is an import/review pipeline with 5 pilot records, then scale.
- **Finding:** Missing top-7 item: `llms.txt` / structured data. **Disposition: accepted.** Added Item #6.
- **Finding:** Missing top-7 item: K-factor instrumentation. **Disposition: accepted.** Added Item #5.
- **Finding:** Missing top-7 item: embed-distribution spec. **Disposition: accepted.** Added Item #4.

### Codex Eng findings

- **Finding:** Original #1 embed was under-scoped; cross-origin iframe + voting + auth is not 3 days. Start with copyable button/badge linking to `/treaty?ref=<orgSlug>`. **Disposition: accepted.** Item #3 is copyable HTML only; iframe voting/auth is deferred.
- **Finding:** Original #2 CI filter was unsafe; `paths-ignore` can skip regressions. Use job-level `paths-filter`. **Disposition: accepted.** Item #1 explicitly forbids workflow-level `paths-ignore`.
- **Finding:** `isPublicFigure` already exists in Prisma; no schema migration. 50 hand-curated records create defamation risk. Rescope to import pipeline + 5 pilots. **Disposition: accepted.** Public-figure work is deferred and reshaped; no schema change.
- **Finding:** `/orgs/[slug]` would duplicate `/organizations/[id]`. **Disposition: accepted.** All org conversion work extends `/organizations/[id]`, which already accepts slug.
- **Finding:** Org task display has overfetch risk. **Disposition: accepted.** Item #7 requires a light DTO, below-fold display, and revalidation strategy.
- **Finding:** Assign-task security is oversimplified; Mermaid SVG via `innerHTML` and external images are risky. **Disposition: accepted.** Assign-task admin UX is deferred until a security plan handles rendering, image, authz, moderation, and audit risks.
- **Finding:** Task keys belong in `packages/db/src/task-keys.ts`, not seed-data. **Disposition: accepted.** Item #7 adds keys there first, then seed data.
- **Finding:** Apocalypse sweep is not trivial. **Disposition: accepted.** It is deferred to a real copy plan and copy-review gate.
- **Finding:** Recommended order is #2 safe paths-filter -> #7 login bug if embed touches auth -> narrowed #1 copyable button -> defer #5 to pipeline. **Disposition: accepted.** The execution queue starts with safe CI, then login, then narrowed org badge; public figures are deferred to pipeline work.
