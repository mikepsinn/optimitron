# Task tree: cause-node split + full solution seeding

## Brief

Mike-approved direction (2026-07-02/03). Two coupled changes to the managed
task tree, own branch after PR #97 merges:

1. **Cause nodes.** Split browsable cause nodes out of the single
   "End War and Disease" parent so audiences see only *their* cause
   (longevity people want disease-only lists). Single tree parent stays
   (attribution = `child.delta / parent.delta`); cross-cause relevance uses
   the existing `TaskEdge` model (`INCREASES_PROBABILITY_OF` / `ACCELERATES`),
   surfaced in the UI ("also advances → Eradicate Disease").
2. **Seed ALL 35 missing solution tasks** found by the manual-vs-tasks audit
   (Mike: "put everything in… users can make those institutions"). Full
   audit data: [task-tree-cause-split-audit.json](task-tree-cause-split-audit.json)
   (50 manual solutions, 52 existing tasks, matched/missing/cruft).

## Current state

```
Optimize Earth
└── End War and Disease
    ├── Court of Humanity → charter, Humanity v. Governments (+5 children)
    ├── Ratify the 1% Treaty → majority-vote, heads-of-government, signer:<iso2>×193
    ├── Loving Takeover → own-one-share, love-letter, optimize-lobbying
    ├── Earth Optimization Prize (funding only)
    ├── Capitalize EOS
    ├── Fund the dFDA directly (funding only)
    └── Seed the shirt cascade → distribute/wear-shirt:2026-08-06, train-ai, teach-ais
(orphan) program:amf:bed-nets-funding-gap  ← parentTaskId: null
```

## Proposed state

```
Optimize Earth
├── End War                    (cause node, NEW)
│   ├── Ratify the 1% Treaty   (mechanism = military budget; edge → Eradicate Disease)
│   ├── Court of Humanity …
│   └── Loving Takeover … (+ NEW: demand letter, 14a-8, derivative complaint,
│                            media kit, VICTORY bond [treasury-separated])
├── Eradicate Disease          (cause node, NEW)
│   ├── Fund the dFDA directly (+ NEW: dFDA bounties, Right to Trial sponsor ask,
│   │                            DIH charter, build-on-APIs)
│   └── Bed Nets Funding Gap   (Mike: KEEP — fixes the null-parent orphan)
├── (conversion/referral NEW tasks under majority-vote: vote-yes, get-two-humans,
│    20-questions call, generic org activation, Ad Grants, AI-agent queue,
│    Notice of Termination, appointment cascade, vandalism handout, …)
└── (proof-layer NEW tasks under root: ship RAPPA (= Wishocracy), ship OPG,
     replacement bureau, alignment score, Department of Peace analysis,
     Declaration of Optimization, adversarial review, fork the protocol)
```

Cause pages = filtered task views; `/missions` is TAKEN (pairing feature) —
route name TBD (`/causes`?).

## Step list

- [ ] Add cause nodes (`End War`, `Eradicate Disease`) to
      `optimize-earth-task-tree.ts`; keep existing taskKeys stable
      (site configs reference `END_WAR_AND_DISEASE_TASK_KEY` — decide whether
      it becomes a cause node alias or stays as campaign node above both).
- [ ] Reparent existing tasks under the right cause; every task keeps ONE parent.
- [ ] Seed the 35 missing tasks from the audit (titles/parents in
      `gaps.missing` of the audit JSON). Verb-first Vonnegut titles.
      Priority order within the PR: conversion/referral tier first.
- [ ] Give `program:amf:bed-nets-funding-gap` parent = Eradicate Disease.
- [ ] Seed `TaskEdge` records for cross-cause links (1% Treaty →
      Eradicate Disease, dFDA → treaty credibility, …).
- [ ] Surface edges on task pages + cause-filtered views.
- [ ] EV fields (`expectedEconomicValueUsdBase`, `successProbabilityBase`)
      from `@optimitron/data/parameters` — never hand-typed.
- [ ] VICTORY bond task: treasury-separation rule — no shared copy/components
      with Prize or EOS-equity tasks.
- [ ] Write manual page for Earth Optimization Missions (audit found the two
      mission tasks have no manual source — manual gap, not cruft).

## Risks

- Reparenting changes attribution denominators — check
  `computeParentContributionShare` consumers before/after.
- 35 new tasks in one PR = review burden; split into cause-split PR then
  seed PRs if unwieldy.
- Snapshot churn on /tasks, /fund, dashboards; regenerate previews.
- `getBlockers`/MCP already reads TaskEdge — verify no assumptions break
  when edges exist at scale.

## Files to touch

- `packages/db/src/managed-data/optimize-earth-task-tree.ts` (+ sibling
  managed-data files for grant/signer tasks if parents move)
- `packages/web/src/lib/tasks.server.ts` (cause-filtered queries)
- `packages/web/src/app/tasks/` (+ new cause routes)
- Task detail page (edge display)
- `packages/web/src/lib/routes.ts` (cause pages metadata)

## ALERTS

(empty)

## Agent log

(empty)
