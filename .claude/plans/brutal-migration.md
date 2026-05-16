# Brutal Migration Plan

## Research log

Repo-internal sources read first:

- `TODO.md` entry "Single black-and-white style migration" says the scope is roughly `brutal-*` / `BrutalCard` references plus legacy decorative `packages/web/src/components/ui/` shapes. It sets the current policy: inventory by page surface, opportunistically migrate touched files, then do a final sweep and delete legacy files once `brutal-*` references drop below roughly 50. It explicitly allows admin / game-demo / email markup to keep specialized styling.
- `CLAUDE.md` UI rules say new or touched public UI must use War on Disease treaty style: white paper, black ink, thin black rules, square corners, restrained typography, no decorative color. The migration rule says public UI should replace `brutal-*` fills, hard shadows, colored panels, gradients, thick novelty borders, and rounded cards with treaty tokens; admin chips, charts, game/demo screens, and email markup may keep specialized colors.
- `.claude/codex-delegation.md` says this is plan-first work, bans `next build` during Codex sessions, requires screenshot/markdown regeneration after content/component changes, and currently forbids separate worktrees / parallel branches. It permits parallel Codex only with explicit user authorization on disjoint file scopes within the same branch.
- `packages/web/src/components/retroui/Card.tsx`, `Button.tsx`, `Badge.tsx`, `Input.tsx`, `Alert.tsx`, `Text.tsx`, and `Label.tsx` define the local target primitive shape. `Card` is a compound component with `Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`, `Card.Footer`, and `Card.Action`. `Button` and `Badge` use `cva` variants. Inputs/labels are thin class-pass-through primitives. No vendor API research was needed.

WebSearch/WebFetch:

- Not run. This migration is repo-internal. The target API is the local `retroui` implementation already in the repo, not an external SDK/API/tooling path. If a later implementation changes an actual third-party migration tool, design-token package, or retroui upstream dependency, rerun this section with current vendor docs before coding.

Inventory commands and results:

- Grep command shape: `rg -n "brutal-[A-Za-z0-9_-]+|BrutalCard|brutal_" packages/web/src`
- Raw regex inventory under `packages/web/src`: 997 matches across 145 files.
- Raw match histogram:
  - `BrutalCard` identifiers: 274
  - `brutal-card` path/token matches: 53
  - other `brutal-*` tokens: 670
  - `brutal_`: 0
- Component-use inventory:
  - `BrutalCard` JSX openings: 98
  - files importing `@/components/ui/brutal-card`: 53
  - unique files importing any TODO-listed legacy UI component: 92
- Top token histogram:
  - `BrutalCard`: 274
  - `brutal-red`: 250
  - `brutal-cyan`: 107
  - `brutal-pink`: 95
  - `brutal-red-foreground`: 78
  - `brutal-yellow`: 60
  - `brutal-card`: 53
  - `brutal-green`: 45
  - `brutal-green-foreground`: 22
  - `brutal-cyan-foreground`: 4
  - `brutal-pink-foreground`: 4
  - `brutal-yellow-foreground`: 4
  - `brutal-purple`: 1
- Area histogram by match count:
  - `app/public-or-route`: 429
  - `components/other`: 220
  - `components/tasks`: 113
  - `components/shared`: 99
  - `components/chat`: 67
  - `components/ui`: 46
  - `app/admin`: 11
  - `components/reasoning`: 8
  - `lib`: 4
- Top files by raw `brutal-*|BrutalCard|brutal_` matches:
  - `packages/web/src/app/globals.css`: 240
  - `packages/web/src/components/chat/chat-theme.css`: 65
  - `packages/web/src/app/developers/page.tsx`: 36
  - `packages/web/src/app/governments/[code]/politicians/[bioguideId]/page.tsx`: 26
  - `packages/web/src/app/obg/[slug]/page.tsx`: 20
  - `packages/web/src/app/governments/[code]/page.tsx`: 18
  - `packages/web/src/components/tasks/task-row.tsx`: 14
  - `packages/web/src/components/animations/CollapseCountdown.tsx`: 13
  - `packages/web/src/components/treatment/HealthEconomicsDisplay.tsx`: 12
  - `packages/web/src/components/landing/VoteValueReveal.tsx`: 12
  - `packages/web/src/app/governments/[code]/agencies/[agencyId]/page.tsx`: 12
  - `packages/web/src/app/fund/page.tsx`: 12
  - `packages/web/src/components/ui/brutal-card.tsx`: 12
  - `packages/web/src/app/agencies/dfec/page.tsx`: 12
- TODO-listed legacy UI component files and current importing-file counts:

```text
component                      exists  importing files
packages/web/src/components/ui/brutal-card.tsx         yes  53
packages/web/src/components/ui/game-cta.tsx            yes  43
packages/web/src/components/ui/arcade-tag.tsx          yes  16
packages/web/src/components/ui/stat-card.tsx           yes   8
packages/web/src/components/ui/spending-bar.tsx        yes   5
packages/web/src/components/ui/nav-item-card.tsx       yes   4
packages/web/src/components/ui/comparison-card.tsx     yes   1
packages/web/src/components/ui/numbered-step-card.tsx  yes   1
packages/web/src/components/ui/rarity-badge.tsx        yes   1
packages/web/src/components/ui/stat-bar.tsx            yes   1
packages/web/src/components/ui/featured-info-card.tsx  yes   0
packages/web/src/components/ui/icon-card.tsx           yes   0
packages/web/src/components/ui/item-card.tsx           yes   0
```

Central files imported by 20+ surfaces:

```text
module                                  importing files  migration meaning
@/components/retroui/Button             71               target primitive; do not churn casually
@/components/retroui/Card               56               target primitive; do not churn casually
@/components/ui/brutal-card             53               legacy blocker
@/components/ui/game-cta                43               legacy/shared CTA blocker
@/components/shared/ParameterValue      42               shared display component; avoid cross-agent edits
@/components/ui/default-button          35               treaty-style button class; likely reuse target
@/components/ui/container               30               shared layout; avoid style churn
@/components/ui/section-container       29               shared layout; avoid style churn
@/components/ui/section-header          25               shared section typography; avoid style churn
@/components/navigation/NavItemLink     20               shared navigation; avoid style churn
@/components/retroui/Input              20               target primitive; do not churn casually
```

Important observed nuance:

- `packages/web/src/components/ui/brutal-card.tsx` is already partly neutered: it wraps `retroui/Card`, maps old colors to `bg-background` / `text-foreground`, and keeps `shadowSize` as a no-op. It is still a dependency and naming blocker, not necessarily the largest visual-color source.
- `packages/web/src/components/ui/game-cta.tsx` also already delegates to `defaultButtonClassName`. Its name and default copy are still game-era API baggage, and 43 files import it.
- `packages/web/src/components/site/OnePercentTreatyLandingPage.tsx`, `TreatyVoteFlow.tsx`, `TreatyPostVoteShareFlow.tsx`, `TreatyReminderComposer.tsx`, `/vote`, `/dashboard`, `/signatories`, `/donate`, `/survey`, and `/settings` showed no raw `brutal-*|BrutalCard|brutal_` matches in the targeted grep. Keep them as primary regression surfaces anyway because they are the campaign path.

## Brief

Migrate public `packages/web` UI away from generic neobrutalist `brutal-*` styling and legacy `components/ui/*` decorative components toward the black-and-white War on Disease treaty style, while preserving functional admin/chart/game/demo color where the repo rules allow it.

This should be reviewed and implemented as a surface-by-surface migration, not as one global component-type replacement. The main goal is to reduce campaign friction and PR review risk: public treaty/campaign surfaces first, proof/trust surfaces second, generic platform pages third, and admin/game/demo exceptions isolated so the generic legacy UI files can eventually be deleted.

Key decisions committed by this plan:

- Migration order: public campaign and treaty-adjacent surfaces first; public proof/trust surfaces second; secondary public platform pages third; admin/game/demo/email-specialized styling is deferred or isolated.
- Migration unit: per surface / per file for reviewability. Do not globally replace all `BrutalCard` usages first.
- Deletion timing: delete `brutal-card.tsx`, `arcade-tag.tsx`, `game-cta.tsx`, `comparison-card.tsx`, `featured-info-card.tsx`, `icon-card.tsx`, `item-card.tsx`, `nav-item-card.tsx`, `numbered-step-card.tsx`, `rarity-badge.tsx`, `spending-bar.tsx`, `stat-bar.tsx`, and `stat-card.tsx` only after imports reach zero.
- Parallelization: current repo protocol says no simultaneous worktree branches. Parallel agents are only safe with explicit human authorization, disjoint file ownership, and the same branch; keep a practical ceiling of 5-7 logical workstreams, with central shared files owned by one coordinator and cleanup done last.

Surface buckets:

```text
Bucket A: campaign-critical public surfaces, migrate first
- packages/web/src/components/site/OnePercentTreatyLandingPage.tsx
- packages/web/src/components/site/ReferendumSiteInlineSign.tsx
- packages/web/src/components/site/TreatyTaskDashboardClient.tsx
- packages/web/src/components/landing/TreatyVoteSection.tsx
- packages/web/src/components/landing/TreatyVoteFlow.tsx
- packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx
- packages/web/src/components/landing/TreatyReminderComposer.tsx
- packages/web/src/components/landing/VoteValueReveal.tsx
- packages/web/src/components/landing/VoteImpactSection.tsx
- packages/web/src/components/tasks/**
- packages/web/src/components/donate/**
- packages/web/src/components/dashboard/top-tasks-card.tsx
- packages/web/src/app/fund/page.tsx
- packages/web/src/app/contribute/page.tsx

Bucket B: public proof/trust surfaces, migrate after Bucket A
- packages/web/src/app/agencies/**
- packages/web/src/app/governments/**
- packages/web/src/app/opg/**
- packages/web/src/app/obg/**
- packages/web/src/components/shared/*Score*
- packages/web/src/components/shared/*Leaderboard*
- packages/web/src/components/shared/*Comparison*
- packages/web/src/components/shared/*Chart*
- packages/web/src/components/medical/**
- packages/web/src/components/treatment/**
- packages/web/src/components/dfda/**

Bucket C: secondary public platform pages, migrate after proof/trust surfaces
- packages/web/src/app/about/page.tsx
- packages/web/src/app/tools/page.tsx
- packages/web/src/app/search/page.tsx
- packages/web/src/app/developers/page.tsx
- packages/web/src/components/site/OptimitronLandingPage.tsx
- packages/web/src/components/site/SiteVariantLandingPage.tsx
- packages/web/src/components/landing/* non-treaty landing sections

Bucket D: allowed specialized/deferred styling
- packages/web/src/app/admin/**
- packages/web/src/components/demo/**
- packages/web/src/components/demo/slides/sierra/**
- packages/web/src/app/wishonia/**
- packages/web/src/app/moronia/**
- packages/web/src/app/prize/**
- packages/web/src/app/scoreboard/**
- packages/web/src/components/wishonia-agency/**
- packages/web/src/components/wishocracy/**
- packages/web/src/components/scoreboard/**
- packages/web/src/components/chat/chat-theme.css
- chart/status/admin chip colors where red/green carries functional meaning
```

Bucket D is not a license to keep importing soon-to-be-deleted generic `components/ui/*` legacy files forever. If a game/demo surface still needs a game-specific affordance, move that affordance into a game/demo namespace before deleting the generic UI file.

## Current state ASCII diagram

```text
                         packages/web/src/app/*
                                  |
                                  v
              +-----------------------------------------+
              | public pages, admin pages, game/demo UI |
              +-----------------------------------------+
                   |                 |              |
                   |                 |              |
                   v                 v              v
        +------------------+  +----------------+  +------------------+
        | legacy ui shapes |  | raw brutal-*   |  | retroui target   |
        | components/ui/*  |  | classes/tokens |  | primitives       |
        +------------------+  +----------------+  +------------------+
          |        |                 |              |       |
          |        |                 |              |       |
          v        v                 v              v       v
  brutal-card   game-cta       app/globals.css   Card    Button
  arcade-tag    stat-card      --brutal-* vars   Input   Badge
  nav-item-card spending-bar                    Alert   Text
  item-card     etc.
       |
       v
 retroui/Card wrapper in some cases, but old names remain in imports

Result:
- public campaign, proof, secondary platform, admin, game, and demo surfaces
  share generic legacy UI names
- deleting any legacy file is blocked by broad imports
- global CSS still carries large brutal token surface
```

## Proposed state ASCII diagram

```text
                         packages/web/src/app/*
                                  |
                                  v
        +--------------------------------------------------+
        | public campaign/proof/secondary surfaces          |
        +--------------------------------------------------+
                   |                         |
                   v                         v
        +----------------------+   +------------------------+
        | retroui primitives   |   | thin domain UI         |
        | Card/Button/Input... |   | campaign/proof wrappers|
        +----------------------+   +------------------------+
                   |                         |
                   +-----------+-------------+
                               v
                 treaty tokens / semantic Tailwind classes
                 bg-background, text-foreground,
                 border-foreground, muted-foreground,
                 var(--treaty-*)

        +--------------------------------------------------+
        | admin/game/demo/email-specialized surfaces        |
        +--------------------------------------------------+
                   |
                   v
        local specialized classes or components under
        admin/demo/game namespaces, not generic ui/brutal names

Result:
- no public surface imports generic legacy decorative UI
- legacy `components/ui/*` delete list reaches zero imports
- functional color remains only where the rule permits it
- `globals.css` brutal variables are removed or reduced only after no live
  references need them
```

## Step list

- [ ] Step 1: Before implementation, have Mike approve this plan or edit it directly. Do not start code migration from this draft alone.
- [ ] Step 2: Re-run the inventory on the implementation branch and paste the fresh totals into this plan's `Agent log` before coding:
  - `rg -n "brutal-[A-Za-z0-9_-]+|BrutalCard|brutal_" packages/web/src`
  - import counts for the TODO-listed legacy components
  - central import histogram for modules with 20+ importers
- [ ] Step 3: Claim the `TODO.md` "Single black-and-white style migration" entry as in progress if multiple agents will touch the repo, then leave it complete only after the final deletion PR.
- [ ] Step 4: Assign one coordinator ownership of central shared files. No other worker edits these unless the coordinator explicitly releases them:
  - `packages/web/src/components/retroui/Button.tsx`
  - `packages/web/src/components/retroui/Card.tsx`
  - `packages/web/src/components/retroui/Input.tsx`
  - `packages/web/src/components/ui/default-button.ts`
  - `packages/web/src/components/ui/container.tsx`
  - `packages/web/src/components/ui/section-container.tsx`
  - `packages/web/src/components/ui/section-header.tsx`
  - `packages/web/src/components/ui/brutal-card.tsx`
  - `packages/web/src/components/ui/game-cta.tsx`
  - `packages/web/src/app/globals.css`
- [ ] Step 5: Capture baseline screenshots for the campaign-critical pages using the existing dev server on `http://127.0.0.1:3001`; do not start a second server. Include at minimum `/`, `/vote`, `/dashboard`, `/donate`, `/signatories`, and one task/detail surface that renders task blocks.
- [ ] Step 6: Verify the current one-percent treaty path remains raw-brutal-free. If it still has zero raw `brutal-*|BrutalCard|brutal_` matches, do not churn those files except for regressions discovered during screenshots.
- [ ] Step 7: Migrate Bucket A files surface-by-surface. Replace `BrutalCard` with `retroui/Card` or plain semantic markup, replace `GameCTA` with `Button asChild` or `defaultButtonClassName`, replace `ArcadeTag` with restrained text, and remove decorative colors unless they improve task completion.
- [ ] Step 8: For each Bucket A PR/slice, run targeted typecheck/lint/tests appropriate to touched files, generate affected markdown snapshots, and update `packages/web/output/playwright/review/latest.html` with before/after screenshots. Do not run `next build`.
- [ ] Step 9: Migrate Bucket B proof/trust surfaces surface-by-surface. Preserve red/green only when it is data semantics, status, chart encoding, or admin-like state; otherwise convert to treaty tokens.
- [ ] Step 10: Migrate Bucket C secondary public pages surface-by-surface. Prefer direct `retroui` primitives and local markup over new abstraction.
- [ ] Step 11: For Bucket D, decide per surface whether it is truly allowed specialized styling. Replace imports from generic legacy UI files anyway. If game/demo needs a specialized control, move it under a game/demo-specific component name instead of keeping `components/ui/game-cta` or `components/ui/brutal-card`.
- [ ] Step 12: After imports from a TODO-listed legacy file reach zero, delete that file in the cleanup slice. Do not delete earlier and rely on a giant codemod.
- [ ] Step 13: After all TODO-listed legacy imports reach zero, run the final raw grep. If public-surface raw `brutal-*` references are above roughly 50, do another public sweep before touching `globals.css`.
- [ ] Step 14: Remove or reduce `--brutal-*` variables and generated Tailwind token exposure in `packages/web/src/app/globals.css` only after live references are either zero or explicitly allowlisted for admin/game/demo/chart use.
- [ ] Step 15: Final verification for the cleanup slice:
  - zero imports from deleted TODO-listed legacy component paths
  - public-surface raw grep is zero or documented allowlist-only
  - `pnpm --filter @optimitron/web exec tsc --noEmit` or repo-approved fast typecheck
  - focused tests for touched components/routes
  - screenshot review at `packages/web/output/playwright/review/latest.html`
  - affected markdown snapshots regenerated
- [ ] Step 16: Ask Mike to review the screenshot HTML and any changed user-facing copy before committing UI/copy changes.

Parallelization plan:

- Default execution is one branch / one worktree / one PR, matching `.claude/codex-delegation.md`.
- Do not split across simultaneous worktree branches unless Mike explicitly overrides that repo rule.
- If Mike authorizes parallel agents in the same branch, cap active implementation workers at 5-7 and use these non-overlapping ownership boundaries:
  - Worker 1: Bucket A task/donate/dashboard files under `components/tasks/**`, `components/donate/**`, and `components/dashboard/top-tasks-card.tsx`.
  - Worker 2: Bucket A/B landing and site files under `components/landing/**` and `components/site/**`, excluding central primitives.
  - Worker 3: Bucket B agency/government route files under `app/agencies/**`, `app/governments/**`, and directly required shared components.
  - Worker 4: Bucket B proof widgets under `components/shared/**`, `components/medical/**`, `components/treatment/**`, and `components/dfda/**`.
  - Worker 5: Bucket C secondary routes under `app/about`, `app/tools`, `app/search`, `app/developers`, `app/fund`, and `app/contribute`.
  - Worker 6: Bucket D isolation under `app/wishonia`, `app/moronia`, `app/prize`, `app/scoreboard`, `components/wishonia-agency/**`, `components/wishocracy/**`, `components/scoreboard/**`, and `components/demo/**`.
  - Worker 7/coordinator only: central files, final import sweep, deletions, and `globals.css`.
- Workers must not edit central shared files unless assigned to Worker 7/coordinator.
- Do not run cleanup/deletion in parallel with surface migrations. Cleanup starts only after all surface workers have landed and import counts are refreshed.

## Risks

- The raw count is larger than the TODO estimate: current grep found 997 raw matches, not roughly 560. Some of that is global CSS variables and allowed specialized surfaces, but the implementation plan should assume a larger migration.
- `app/globals.css` has 240 raw matches. Removing variables too early can break admin/game/demo/chart styling that is intentionally allowed to remain colored.
- `components/chat/chat-theme.css` has 65 raw matches and may be specialized UI. Treat it as deferred/specialized unless Mike wants chat restyled as public campaign UI.
- `BrutalCard` and `GameCTA` are central blockers. Editing or deleting either while workers still import them will create broad conflicts and type failures.
- Some legacy components are already visually neutered. Replacing them globally may create churn with little visible benefit; prioritize import deletion and public semantics over cosmetic line noise.
- Red/green can be functional in charts, score tables, admin approval buttons, and budget/policy deltas. A blind black-and-white conversion would reduce meaning.
- Per-file migration is reviewable but slower. Per-component-type migration would be faster mechanically but creates giant ambiguous diffs; this plan chooses reviewability.
- Current working tree is dirty. Implementation agents must not revert unrelated existing changes.
- UI work requires screenshots and local review before commit. This migration can touch many pages, so screenshot scope must be targeted per slice plus final campaign smoke.
- Do not run `next build` during Codex sessions. Use fast typecheck, focused tests, Playwright spot checks, and final visual review.
- Public copy edits may be incidental when replacing CTAs/components. Any user-facing copy change needs Mike review before commit.

## Files to touch

Expected migration targets:

- `packages/web/src/components/ui/brutal-card.tsx`
- `packages/web/src/components/ui/arcade-tag.tsx`
- `packages/web/src/components/ui/game-cta.tsx`
- `packages/web/src/components/ui/comparison-card.tsx`
- `packages/web/src/components/ui/featured-info-card.tsx`
- `packages/web/src/components/ui/icon-card.tsx`
- `packages/web/src/components/ui/item-card.tsx`
- `packages/web/src/components/ui/nav-item-card.tsx`
- `packages/web/src/components/ui/numbered-step-card.tsx`
- `packages/web/src/components/ui/rarity-badge.tsx`
- `packages/web/src/components/ui/spending-bar.tsx`
- `packages/web/src/components/ui/stat-bar.tsx`
- `packages/web/src/components/ui/stat-card.tsx`
- `packages/web/src/app/globals.css`
- `packages/web/src/components/landing/**`
- `packages/web/src/components/site/**`
- `packages/web/src/components/tasks/**`
- `packages/web/src/components/donate/**`
- `packages/web/src/components/dashboard/top-tasks-card.tsx`
- `packages/web/src/app/fund/page.tsx`
- `packages/web/src/app/contribute/page.tsx`
- `packages/web/src/app/agencies/**`
- `packages/web/src/app/governments/**`
- `packages/web/src/app/opg/**`
- `packages/web/src/app/obg/**`
- `packages/web/src/components/shared/**`
- `packages/web/src/components/medical/**`
- `packages/web/src/components/treatment/**`
- `packages/web/src/components/dfda/**`
- `packages/web/src/app/about/page.tsx`
- `packages/web/src/app/tools/page.tsx`
- `packages/web/src/app/search/page.tsx`
- `packages/web/src/app/developers/page.tsx`

Expected target primitives/reuse points:

- `packages/web/src/components/retroui/Card.tsx`
- `packages/web/src/components/retroui/Button.tsx`
- `packages/web/src/components/retroui/Badge.tsx`
- `packages/web/src/components/retroui/Input.tsx`
- `packages/web/src/components/retroui/Alert.tsx`
- `packages/web/src/components/retroui/Text.tsx`
- `packages/web/src/components/ui/default-button.ts`
- `packages/web/src/components/ui/container.tsx`
- `packages/web/src/components/ui/section-container.tsx`
- `packages/web/src/components/ui/section-header.tsx`

Expected generated/review artifacts during implementation, not committed unless Mike explicitly asks:

- `packages/web/output/playwright/review/latest.html`
- screenshots under `packages/web/output/playwright/**`
- affected `.md` route snapshots under `packages/web/src/app/**`

Do not touch unless a later approved implementation plan explicitly expands scope:

- `packages/db/prisma/schema.prisma`
- exported `@optimitron/db` types
- non-web library packages
- unrelated dirty files already in the working tree

## ALERTS

## Agent log

## Codex critique (round 1)

I re-read the full plan, then re-verified the dangerous parts with `rg` and by reading these files:

- legacy components: `packages/web/src/components/ui/brutal-card.tsx`, `packages/web/src/components/ui/arcade-tag.tsx`, `packages/web/src/components/ui/stat-card.tsx`
- additional legacy blocker: `packages/web/src/components/ui/game-cta.tsx`
- retroui targets: `packages/web/src/components/retroui/Card.tsx`, `packages/web/src/components/retroui/Button.tsx`, plus `Badge.tsx`
- coordination and visual references: `.claude/codex-delegation.md`, `packages/web/e2e/visual-regression.spec.ts`, `packages/web/e2e/utils/visual-routes.ts`, `packages/web/src/lib/routes.ts`

### 1. Phasing is only realistic if central files stay frozen as compatibility shims

The plan is right that this cannot be one giant global replacement. But its phasing language is still too optimistic because several components are imported by enough surfaces that touching them mid-phase effectively touches the whole migration at once.

Fresh path-string grep counts:

```text
@/components/retroui/Button        71 files
@/components/retroui/Card          56 files
@/components/ui/brutal-card        53 files
@/components/ui/game-cta           43 files
@/components/shared/ParameterValue 50 files
@/components/ui/default-button     35 files
@/components/ui/container          30 files
@/components/ui/section-container  29 files
@/components/ui/section-header     25 files
@/components/navigation/NavItemLink 20 files
@/components/retroui/Input         20 files
```

The especially dangerous-to-touch components are `brutal-card`, `game-cta`, `retroui/Card`, `retroui/Button`, `ParameterValue`, and the layout wrappers. If any worker changes their public API or default visual behavior in the middle of Bucket A/B/C work, every dependent file becomes a conflict and every screenshot becomes ambiguous.

The plan should say this more forcefully: early phases may remove imports from surface files, but the central shims must remain API-compatible and visually boring until their import count is zero. Central primitive restyling belongs in either a tiny coordinator-only PR with its own full visual pass or after the migration has drained imports.

### 2. The ASCII diagrams understate the real dependency graph

The current-state diagram is directionally useful but too simple. It should show two dependencies the code actually has:

- `brutal-card.tsx` and `stat-card.tsx` already wrap `retroui/Card`, so "legacy UI" and "retroui target" are not separate branches today.
- `globals.css` does not only expose `brutal-*` variables; it remaps large Tailwind color families to brutal variables. A surface can be visually brutal without a literal `brutal-*` class if it uses a remapped semantic color.

The proposed-state diagram is more concerning. It implies `retroui primitives -> treaty tokens / semantic Tailwind classes`, but current retroui is not treaty-style by default:

- `retroui/Card.tsx` renders `"block pixel-border rounded-none transition-all bg-card"`.
- `retroui/Button.tsx` default/secondary/destructive/outline variants include `shadow-sm`, `border-2`, hover/active translate, and a `pixel` variant.
- `retroui/Badge.tsx` still has rounded and colored variants.

So "replace `BrutalCard` with `retroui/Card`" is not automatically a treaty-style migration. The diagram and steps need either: (a) a clear instruction to use plain markup or class overrides for treaty surfaces, or (b) a separate coordinator-owned primitive restyle with explicit blast-radius verification.

### 3. Per-file vs per-component-type is under-argued

The plan chooses per-surface migration for reviewability, which is sensible for visible design changes. But it does not honestly separate two different jobs:

1. Import/name debt removal: often grep-mechanical and low visual risk if the replacement preserves output.
2. Visual restyling: high review cost, should be surface-by-surface.

`brutal-card.tsx` is already visually neutered: colored `bgColor` values map to `bg-background text-foreground`, and `shadowSize` is a no-op. `game-cta.tsx` already delegates to `defaultButtonClassName`; its biggest problem is the game-era API/name/default copy. `arcade-tag.tsx` is a plain uppercase muted paragraph. `stat-card.tsx` also maps old colors to background/foreground.

That means a hybrid plan may be better than pure per-file migration: do a mechanical import/name replacement where the visual output is intentionally preserved, then do actual visual cleanup by route. The current plan dismisses per-component-type migration as giant ambiguous diffs, but it should weigh the opposite risk too: 53 separate `BrutalCard` edits across many route PRs can be slower, harder to rebase, and harder to know when the delete gate is satisfied.

### 4. Phase 1 says campaign first, but the work ordering can still drift into non-campaign churn

The stated priority is correct: public treaty/campaign surfaces first. The plan also notes that the current one-percent treaty path appears raw-brutal-free. That is important and should control the phase order.

The risky part is Bucket A mixing true campaign-path debt with broad landing/platform components:

- Actual campaign-adjacent import debt exists in `components/donate/**`, `components/tasks/**`, `components/dashboard/top-tasks-card.tsx`, `/fund`, and `/contribute`.
- `VoteValueReveal.tsx` and `VoteImpactSection.tsx` import legacy components, but the plan should first verify whether they are mounted on the War on Disease variant before putting them ahead of task/donation/dashboard surfaces.
- Broad `components/landing/**` work can easily become generic platform cleanup, which AGENTS/CLAUDE rules explicitly de-prioritize during the treaty phase.

Recommendation: Phase 1 should be ordered by mounted War on Disease routes, not by folder. Start with `/donate`, `/dashboard` task surfaces, `/tasks/*` seeded task pages, `/fund` if it is part of campaign funding, and `/contribute` if it is still a campaign CTA. Keep raw-brutal-free `/`, `/vote`, `/survey`, `/signatories`, and core treaty flow files as regression screenshot surfaces, not churn targets.

### 5. Deletion timing is mostly right, but the gate needs to be exact and per-file

The plan says delete only after imports reach zero. That is the right rule. It should remove any ambiguity from the research-log TODO paraphrase about deleting once references drop below "roughly 50".

The gate should be explicit per file:

```text
rg -l "components/ui/<legacy-file-without-extension>" packages/web/src packages/web/e2e
```

must return zero before deleting that file. Count type-only imports too. For example, `BrutalCardBgColor` is still imported as a type by `app/about/page.tsx`, `lib/demo-script.ts`, `landing/ArmorySection.tsx`, `landing/OptimizedGovernanceSection.tsx`, `components/tasks/task-card.tsx`, and UI wrappers. Those block deletion just as much as JSX usage.

Also require a post-delete typecheck for the cleanup slice. A zero path grep catches direct imports, but it will not catch indirect export assumptions or renamed local wrappers unless TypeScript runs.

### 6. Visual regression coverage is underspecified for a migration this broad

The plan says to capture screenshots and update `packages/web/output/playwright/review/latest.html`. That is necessary, but not enough for a 100+ file style migration.

Current visual regression is route-based:

- `visual-regression.spec.ts` screenshots `VISUAL_ROUTES` for the self-built review gallery.
- `VISUAL_ROUTES` comes from `routes.ts` screenshot/authenticatedScreenshot flags plus a small seeded dynamic list such as `/tasks/optimize-earth`, `/tasks/1-pct-treaty`, and `/tasks/1-pct-treaty-signer-ca`.
- The visual diff threshold is not a design-quality oracle. It will surface diffs; it will not decide whether the new treaty treatment is uglier, less scannable, or worse for the campaign.

The plan should require each slice to map touched surfaces to existing visual routes or add temporary/approved coverage before claiming visual protection. It should also call out which changed states are not route-covered: post-submit states, task block variants, auth-only surfaces, organization survey variants, and any route hidden behind seed data. Final verification should include both visual-regression e2e and human review of `latest.html`, with changed pages expanded and inspected.

### 7. The parallel-agent plan is more theoretical than practical

`.claude/codex-delegation.md` says one worktree, one branch, one dev server, one PR by default; no `git worktree`; parallel agents only with explicit authorization on disjoint file scopes within the same branch. Under that rule, 5-7 workers is not a practical default for this migration.

The proposed ownership map overlaps in real code paths:

- Worker 1 owns task/donate/dashboard files that import `brutal-card`, `game-cta`, `ArcadeTag`, `default-button`, and sometimes shared components.
- Worker 2 owns landing/site files that also import `game-cta`, `brutal-card`, `ParameterValue`, and layout wrappers.
- Worker 3 owns government routes while Worker 4 owns shared proof widgets those routes render. That is a likely conflict boundary, not a clean split.
- Worker 5 owns `/fund` and `/contribute`, but those are also Bucket A campaign-ish surfaces and import the same central components.
- Worker 7 owns central files and cleanup, which means every other worker is blocked from the files most likely to be needed when they hit API/style mismatches.

The feasible plan is more like 2-3 implementation agents plus one coordinator, only after the coordinator freezes central APIs and assigns route-level slices. True worktree-based parallelism is currently prohibited by repo protocol, so the plan should not imply that 3-4 independent branches can safely run. If Mike wants true parallel worktrees, that requires an explicit protocol override before implementation starts.

## Codex critique summary

Top 3 issues by severity:

1. The proposed target primitives are not treaty primitives today. `retroui/Card` and `retroui/Button` still carry pixel/shadow/translate styling, so migrating to them can preserve the wrong look unless the plan distinguishes API migration from visual migration.
2. Phasing breaks if central files are touched mid-migration. `brutal-card`, `game-cta`, `retroui/Card`, `retroui/Button`, `ParameterValue`, and layout wrappers have 20-70+ dependents; freeze them or give them coordinator-only slices.
3. Visual verification needs a route/state coverage map, not just "capture screenshots." The route gallery only covers `VISUAL_ROUTES`, and it flags diffs rather than judging whether a broad public UI restyle improved the campaign experience.

The plan is directionally solid on mission priority, zero-import deletion, and avoiding a single giant rewrite. It needs stronger gates and a sharper split between mechanical import debt and actual visual restyling before it is safe to implement.

## Mike approved (round 2)

Mike's call: keep retroui styling as-is, migrate everything to it, then tone down the neobrutalism on the retroui components later if observation/feedback shows it's needed. Phase 0 (strip pixel/shadow/translate from retroui primitives) is deferred indefinitely. The brutal-migration becomes a mechanical API migration, not a visual rework.

Approved scope:

1. Migrate `brutal-card`, `arcade-tag`, `game-cta`, `comparison-card`, `featured-info-card`, `icon-card`, `item-card`, `nav-item-card`, `numbered-step-card`, `rarity-badge`, `spending-bar`, `stat-bar`, `stat-card` usages to the corresponding retroui primitive AS-IS. Don't try to change the visual styling during the migration.
2. Public treaty/campaign surfaces migrate first (per CLAUDE.md priority). Admin/game/demo surfaces explicitly allowed to keep brutal styling.
3. Delete the legacy `components/ui/brutal-*` files only after the zero-imports gate is reached (per-component basis).
4. Per-surface migration in the same PR shape we've been using. NO worktrees yet — apocalypse plan touches some of the same files (TreatyVoteFlow, TreatyPostVoteShareFlow); sequence apocalypse implementation first, then start brutal migration on a clean main.
5. Visual regression captured by the existing review pipeline. If Mike notices a surface that looks worse after migration, that triggers a tone-down decision on the relevant retroui primitive (Phase 0, on demand only).

Critique findings 2 (central-file freeze) and 3 (visual verification coverage map) addressed by Mike's "tone down on observation/feedback" stance — we ship the API migration and react to actual visual regressions rather than pre-empting them.

Dispatch order: NOT dispatched yet. Hold until apocalypse implementation lands and we have a clean working tree.
