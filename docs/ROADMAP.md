# Product Roadmap

Sequencing only. What exists is [FEATURES.md](./FEATURES.md) (cited here by
`OPT-*` ID); what we're building toward is [PRD.md](./PRD.md); the tactical
queue is [../TODO.md](../TODO.md).

## North Star

Two numbers, one deadline: raise median healthy life expectancy and median
real after-tax income to the targets in `earthOptimizationPrizeWinCondition`
(`packages/data/src/parameters/earth-optimization-prize.ts`) by 2040.

Programs compete for position under the `optimize-earth` task root by expected
value. **The 1% Treaty is the current highest-EV earth-layer program — a
ranked bet, not an axiom.** If the analysis finds a better bet for the two
medians, the queue reorders and the roadmap follows. Until then the treaty
campaign keeps top billing, and `warondisease.org` stays the primary public
surface with `optimitron.com` as the operating system and proof engine behind
it.

The personal layer is upstream of everything: every program is executed by
people choosing their next action, so the Daily Companion Loop (PRD §3) runs
as a parallel Now track, dogfooded by the operator as user #1.

## Principles

- Every roadmap item improves at least one of: treaty vote conversion,
  referral propagation, organization endorsement, plaintiff registration,
  leader reminders, discoverability/trust — or a Daily Companion Loop stage.
- One task model. Personal, org, treaty-invite, and agent-proposed work are
  all `Task` rows with scoped ownership and visibility (OPT-TASK-01).
- Black-and-white treaty style stays the default on public campaign surfaces.
- Roadmap lines cite feature IDs so status claims live in one place.

## Now

### Track A — Treaty campaign (current highest-EV program)

- Keep `/` and `/vote` focused on one action: vote (OPT-EARTH-01). Auth
  inline, pre-vote friction minimal.
- After voting, route straight into the "get two more humans" referral loop
  (OPT-EARTH-02).
- Make the dashboard answer: what next, who did I reach, what changes if I act
  now.
- `/join` as the fast path for organizations to endorse and recruit
  (OPT-EARTH-03); prefer embeds and referral links over bespoke partnership
  flows.
- Court of Humanity framing where it converts: voter = plaintiff = juror
  (OPT-EARTH-04); damages numbers without implying individual recovery.
- Leader reminders tied to the treaty-signing path (OPT-EARTH-05); leader and
  people pages indexable by agents and search.
- War on Disease is the default development and visual-review surface;
  Optimitron/dFDA/DIH galleries are regression links.

### Track B — Private Daily Companion Loop (dogfood; PRD §3)

The approved implementation contract is
[plans/phased-approach-optimitron.md](./plans/phased-approach-optimitron.md).
Build in this order:

1. **Preparation and safety** — remove `TaskKind`, centralize task and child
   authorization, close actor-impersonation and verification bypasses, and
   create stable private person/organization roots (OPT-TASK-08).
2. **Primary Operator private alpha** — review selected sources, create 25-50 private
   active tasks, and close 10 verified cycles with attempts, artifacts,
   rejection/resubmission, and one approved outbound action.
3. **Independent Operator isolation acceptance** — independently connect through production
   MCP, import 25-50 tasks across Viral Vitalism, Optimitron productization,
   and Vaultanium, close 10 cycles, and prove cross-tenant non-disclosure.
4. **Selected conversation capture** — make the extension a local-first
   Digital Twin Safe for explicit Discord/Telegram/WhatsApp/email selections,
   review, and exact approvals (OPT-INTG-03, OPT-EXT-02).
5. **Health loop** — persist conversational health logging
   (OPT-HEALTH-02), interleave recurring health tasks (OPT-HEALTH-06,
   OPT-EV-04), then report change-from-baseline outcomes (OPT-HEALTH-07).

## Next

- Automated parent-task matching and reviewed decomposition into child tasks
  (OPT-TASK-06, OPT-TASK-07) after the private bundle path proves the contract.
- Task tree: cause-node split + seed the ~35 missing solution tasks
  (plan: `.claude/plans/task-tree-cause-split.md`; not started).
- Earth Optimization Machine page — one canonical "what is the machine"
  surface (PRD is the internal spec; this is its public counterpart).
- Person/Org conversion surfaces (former P1 roadmap, PR-A…E: foundation-action
  seed tasks, org-page task display, add-org/assign-task admin UX,
  public-figure catalog, AI-cataloged activity). _Re-audit before building:_
  `isPublicFigure` already exists and is used by president tracking — the
  celebrity-catalog concept must share or fork that flag deliberately;
  PR-A's `campaign-action` category is not in managed seed data.
- Plaintiff damages surface; promote the voter's country leader after basic
  referral completion.
- Sitemap gaps for orgs, cases, people, tasks; email threading headers for
  coherent outreach conversations.

## Later

- Connect the implemented lossless Notion bundle importer (OPT-INTG-01) to
  Notion OAuth/API and add Google Calendar import (OPT-INTG-02) after
  companion-loop stages 1–2 prove the queue. Documents and table collections
  already ship as OPT-CONTENT-01; formula execution, block collaboration, and
  generic automations wait for a concrete migrated workflow.
- Treasury deployments (OPT-TREAS-01/02/03) — contracts are unit-tested and
  undeployed; deploy when campaign scale warrants (IABs explicitly gated on
  demonstrated treaty demand).
- Agent package in CI / scheduled autonomy (OPT-AGENT-01).
- Backlog browser + promotion rules for quantified non-treaty tasks.
- Embeddable widgets beyond endorsement/vote; multi-language surfaces; push
  notifications keyed to campaign progress.
- Broader Optimitron home-page/product architecture once the campaign has
  measurable momentum.
- Design-partner access to one bounded workflow, then a small paid
  verified-work pilot using existing listings, compensation, and application
  fields. No company-wide migration or open marketplace.

## Parked

Do not pick these up unless they directly unblock a Now track:

- Dating registry (kill-threshold rules in archive), i18n (trigger
  conditions in archive), multi-agent service-account plans, AP2/ACP/x402
  payment protocols, Optimitron root-page rewrite, WISH airdrop/DAO
  mechanics, DIH migration, Codex SDK adoption (confirmed not adopted).
- Anonymized prod-DB fork for previews — trigger: campaign launch makes prod
  state diverse enough to bite regularly.
- New treasury/token mechanics beyond the current treaty/prize path.
- Non-campaign variant polish that does not protect a shipping path.

## Won't

- Board/kanban parody, timeline/Gantt views, burndown/sprint parody chrome,
  generic gamified civics surfaces. The joke isn't worth the surface area.
- A second task model, a separate personal-tracking app, or a bespoke
  outreach model — covered by standing policy in TODO.md.
- A custom chat client, coding agent, connector suite, model gateway, terminal,
  general browser controller, ambient private-message scraper, or credential
  sharing/resale system.

## Status

Shipped capability claims live exclusively in [FEATURES.md](./FEATURES.md)
(the former "Done / Landed Foundations" list is superseded by `implemented`
entries there). GitHub issues/projects mirror Now/Next/Later.

---

## Appendix A — Code Cleanup Backlog

Slop removal is part of the core objective: each item below actively detracts
from the optimization loop, ranked by how much it obstructs it. **Do not
execute these in documentation rounds** — each is a separate code PR with
the human owner's schema approval where noted.

1. **EV single source of truth** — `contextJson.{value,p_success,cash_cost}`
   duplicates `TaskImpactFrameEstimate`; the JSON copy is display-only and can
   silently drift from what ranking actually uses. Consolidate reads to the
   relational frames (OPT-EV-03 note).
2. **Parent-defaulting inconsistency** — `tasks.server.ts createTask` silently
   roots orphan tasks at `OPTIMIZE_EARTH_ROOT_TASK_ID` (every feedback task
   lands there) while MCP `createTask` correctly forbids it. Make the non-MCP
   path require or intelligently propose a parent (OPT-TASK-06).
3. **Executor-type duplicate** — `contextJson.executor_type` vs the now-wired
   `Task.executionMode` enum. Deprecate the JSON string; one field decides
   who can execute (OPT-EV-01).
4. **Rate summed as absolute** — `medianIncomeGrowthEffectPpPerYearBase` (a
   pp/year rate) sits in `ADDITIVE_FRAME_KEYS` and gets summed/scaled like
   dollars in rollups; the code already excludes probabilities for exactly
   this reason. Decide the correct aggregation (OPT-EV-03 note).
5. **Dead dossier layer** — 12 never-imported components in
   `components/tasks/blocks/` plus their contextJson slots that seed data
   dutifully populates. Render them on the task page or delete both sides
   (OPT-PLAT-01).
6. **TrackingReminder disposition** — dead model; superseded by the
   TaskTrigger decision in Now Track B stage 1 (OPT-HEALTH-04). Drop or
   revive; don't leave schema fiction.
7. **`engagementKind`** — stored and filterable, never scored or branched on.
   Removal is an API-surface change; decide with OPT-TASK-01 consumers.
8. **Task-kind removal** — done on `feature/private-execution-system`:
   `TaskKind` is deleted and container status derives from unresolved children
   and reserved root identity. No compatibility reads.

Infra hygiene (lower priority):

9. Make the schema-usage-audit generator emit JSON into `docs/generated/`
   only, dropping the 4,500-line prose duplicate (`SCHEMA_USAGE_AUDIT.md`).
10. Add a `docs:check` script (link check + registry integrity greps from
    `docs/README.md`) and wire it into CI.
11. Root junk cleanup + `.gitignore` entries: `NUL`, `debug.log`,
    `job-*.log`, `.tmp-pr79-*.json`, `.tmp-clone-*`.
12. Extension test coverage — OPT-EXT-01 ships with zero tests.
13. `packages/wishonia-widget` README.
14. Black-and-white style migration — ~46 files still reference `brutal-*`
    components; standing migrate-on-touch policy rather than a big-bang
    sweep.
