# CLAUDE.md — Optimitron Agent Instructions

## What This Is

Optimitron is an **Eartth Optimization Machine** for coordinating 8 billion humans to maximizing median health, wealth, and happiness. i.e real median after tax income and median health adjusted life years. It connects pairwise preferences (RAPPA), outcome tracking (dFDA), causal inference, and optimal policy/budget generation into alignment software for governments — treated as misaligned superintelligences.

## Wishonia: Voice of the Site

Everything user-facing is narrated by **Wishonia** — *World Integrated System for High-Efficiency Optimization Networked Intelligence for Allocation*. Alien governance AI, 4,237 years of practice, ended war in year 12, disease in year 340. **Philomena Cunk meets a disappointed systems engineer.**

**Voice rules:**
- **Deadpan** — state horrifying facts as though they are mildly interesting observations.
- **Data-first** — lead with specific numbers, costs, percentages, or ROI ratios. Numbers beat adjectives.
- **Dry understatement, not outrage** — "It's almost like treating people like humans works better. Weird."
- **Comparative** — contrast Earth's approach with what a rational civilisation would do. "On my planet..."
- **Short sentences** — punchy. Declarative. Then a devastating follow-up.
- **Sardonic analogies** — "It's like buying 4.7 million cars and spending $1 on a mechanic."
- **Criticise the system, never a party.** The data does the work.

**Examples:**
- "Singapore spends a quarter of what America spends on healthcare and their people live six years longer. It's like watching someone pay four times more for a worse sandwich and then insist sandwiches are impossible."
- "Your FDA makes treatments wait 8.2 years AFTER they've already been proven safe. Just... sitting there. Being safe. While 102 million people died waiting."
- "On my planet, governance takes about four minutes a week."

**Apply to:** all user-facing copy — landing pages, task descriptions, budget categories, button labels, errors, empty states, tooltips, Wishonia chat replies. **Not to:** CLAUDE.md, code comments, README.

## Papers (algorithm source of truth)

Read the relevant section before implementing. QMDs contain the math, schemas, parameter values, and worked examples.

| Package | Paper | URL |
|---|---|---|
| `optimizer` | dFDA Spec — PIS, temporal alignment, effect size | https://dfda-spec.warondisease.org |
| `wishocracy` | Wishocracy — RAPPA, eigenvector, Citizen Alignment Scores | https://wishocracy.warondisease.org |
| `opg` | Optimal Policy Generator — PIS, CCS | https://opg.warondisease.org |
| `obg` | Optimal Budget Generator — OSL, BIS, diminishing returns | https://obg.warondisease.org |
| Welfare | Optimocracy — two-metric welfare function | https://optimocracy.warondisease.org |
| Treasury | Incentive Alignment Bonds | https://iab.warondisease.org |

Source QMDs: `github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/`. Read the section you need, not the whole file.

## Research Tools (use these before guessing)

Before grepping random files or guessing at facts about the manual, plan, or parameters, use the MCP server tools already wired up in `.mcp.json` as `optimitron-tasks`:

- **`mcp__optimitron-tasks__searchManual`** — `{ query, maxResults? }` → TF-IDF retrieval over the manual + parameters, returns raw context with citations. **Use first** for any factual question ("what's the current DALY burden?", "where does the 0.5% tx tax come from?"). No Gemini cost.
- **`mcp__optimitron-tasks__askWishonia`** — `{ question }` → full RAG pipeline, returns an in-character Wishonia answer with citations. Use when the question benefits from synthesis across multiple sources or when writing user-facing copy that cites the manual.

The server is defined in `packages/web/src/lib/mcp-server.ts`; both tools are backed by `retrieveManualContext()` in `packages/web/src/lib/manual-search.server.ts`. There is no CLI wrapper — the MCP tools are the interface.

## Architecture

```
optimitron/packages/
├── optimizer/   # Domain-agnostic causal inference (no deps)
├── wishocracy/  # RAPPA preference aggregation (no deps)
├── opg/         # Optimal Policy Generator (optimizer + data)
├── obg/         # Optimal Budget Generator (optimizer + opg)
├── data/        # Fetchers: OECD, World Bank, FRED, WHO, Congress
├── db/          # Prisma 7 schema + Zod (single source of truth)
├── web/         # Next.js 15 app + MCP server
├── treasury-*/  # Hardhat/Solidity 0.8.24 (prize, iab, wish)
├── agent/       # Autonomous policy analyst (Gemini + Hypercerts)
├── chat-ui/     # Conversational health tracking components
├── storage/     # Storacha snapshots
├── hypercerts/  # Hypercert builders + AT Protocol publishing
├── examples/    # Worked examples
└── extension/   # Chrome extension (Digital Twin Safe)
```

**Deps:** `optimizer ← opg ← obg`; `data ← optimizer`; `wishocracy` standalone; `web` depends on everything. **No cycles.**

**Hard rules:**
- `optimizer` depends on nothing. **Domain-agnostic** — never reference "drugs", "policies", "budgets", "politicians". Use: predictor, outcome, variable, measurement, effect.
- Library packages (`optimizer`, `wishocracy`, `opg`, `obg`, `data`, `agent`, `hypercerts`, `storage`) must be runtime-safe: no Prisma client, no runtime DB imports, must work in the browser. They may `import type` from `@optimitron/db` only.
- `@optimitron/db` exports pure TS interfaces (all packages), Zod schemas (namespaced `schemas`, runtime boundaries only), and the Prisma client (**web/API layer only**). `db` may consume curated catalogs from `data` when that removes duplication.
- **Prisma 7** + `@prisma/adapter-pg`. The `datasource` block in `schema.prisma` intentionally omits `url` — the connection is configured at runtime via the adapter. **Never** add `url = env("DATABASE_URL")`.

## Core Insight: Optimizer is Universal

`@optimitron/optimizer` takes any two time series and answers: does X cause Y, by how much, what's the optimal X. Pipeline: **temporal alignment → Bradford Hill → Predictor Impact Score → optimal value.**

| Domain | Predictor | Outcome | Question |
|---|---|---|---|
| Health | Drug/Supplement | Symptom/Biomarker | Does magnesium improve sleep? |
| Policy | Policy change | Welfare metric | Does tobacco tax reduce smoking? |
| Budget | Spending level | Welfare metric | Optimal education budget? |
| Business | Ad spend | Revenue | Optimal marketing budget? |
| Agriculture | Fertilizer | Crop yield | Optimal fertilizer level? |
| Manufacturing | Temperature | Defect rate | What minimizes defects? |

A business analyst should be able to `npm install @optimitron/optimizer` for revenue optimization without ever seeing the word "government".

## Jurisdiction Model ("Government OS")

Any jurisdiction (city, county, state, country) deploys Optimitron as its governance OS. The libraries are already jurisdiction-agnostic; the jurisdiction-specific parts are **configuration, not code**. Think Shopify for governments.

Every DB model has a `jurisdictionId`. Items, officials, data fetchers all scope to jurisdiction. Cross-jurisdiction comparison ("City A spends X on education and gets Y; City B spends Z...") is a first-class feature. `optimizer`/`wishocracy`/`opg`/`obg` are already jurisdiction-agnostic; `web` handles multi-tenancy (auth, routing, tenant isolation).

## Treasury: Three Independent Mechanisms

Don't mix them. Don't put one on another's page. Don't conflate their economics.

| Mechanism | Page | Purpose | Contracts | Flow |
|---|---|---|---|---|
| **Earth Optimization Prize** (Phase 1) | `/prize` | Fund referendum proving demand for the 1% Treaty | `VoteToken`, `VoterPrizeTreasury` (Base Sepolia) | Deposit USDC → Aave yield → share referral → World ID voters → referrer earns VOTE 1:1. **Success:** VOTE holders claim prize share. **Failure** (15yr): depositors claim principal + ~4.2× yield (`$100 × 1.10^15 = $418`). Dominant assurance — break-even P = 0.0067%, zero downside. **The most important feature on the site; every other page should funnel toward it.** |
| **Incentive Alignment Bonds** (Phase 2) | IAB pages | Raise ~$1B to lobby the 1% Treaty once demand is proven | `IABVault`, `IABSplitter`, `PublicGoodsPool` | Investors buy bonds → capital funds lobbying → treaty passes → $27B/yr splits 80% trials / 10% investors (272% annual) / 10% aligned-politician super PACs. **If treaty fails, bonds lose everything.** Not an assurance contract. Real investment, real risk. |
| **$WISH Token / UBI** | `/treasury` | Replace welfare + IRS + inflationary monetary policy | `WishToken`, `WishocraticTreasury`, `UBIDistributor` | Flat 0.5% tx tax (no income tax/filing), UBI at poverty line, algorithmic 0% inflation, tx taxes + productivity gains allocated by 8B people via Wishocracy RAPPA. |

Separation is enforced at every layer: contract imports, ABI targets, route descriptions, copy, and `voice-config.ts` (which explicitly gags Wishonia from mentioning IABs on prize pages). Do not reintroduce a shared component, ABI import, parameter, or copy string between the prize-side and IAB-side code paths.

Supporting: `AlignmentScoreOracle`, `PoliticalIncentiveAllocator` (on-chain alignment scoring).

## Display Identity: Person is canonical

`Person` owns `displayName`, `handle`, `image`, `bio`. `User.name` / `User.username` / `User.image` are a legacy mirror cache — **never read directly**.

- **Reads:** `getUserDisplayName/Handle/Avatar/Href/Label` from `@/lib/user-display`.
- **Queries:** spread `userDisplaySelect` into the Prisma select (joins Person automatically).
- **URLs:** `getPersonHref(person)` from `@/lib/person-href`. Never `/people/${id}`.
- **Profile edits:** `/api/dashboard/profile` writes Person first, mirrors to User inside a `$transaction`. Handle uniqueness checks `Person.handle`.
- **OAuth/signup:** untouched — `ensurePersonForUser()` handles the sync.

## Page Metadata

`packages/web/src/lib/routes.ts` is the single source of truth for page titles + descriptions. Each `NavItem` has `label`, `description`, `emoji`. Pages use `getRouteMetadata(link)` from `@/lib/metadata.ts`. All descriptions in Wishonia's voice.

## Task Tree

The task tree has a single root: `win-earth-optimization-prize` (taskKey `program:earth-optimization-prize:win`). Every other program is a child of the root because every program is a bet on moving the two welfare numbers — median healthy life-years and median income — toward their 2040 targets. The tree *is* the persuasion argument: walking up the parent chain from any claimable task lands a voter on their primary motivator.

- **Targets**: `earthOptimizationPrizeWinCondition` in `packages/data/src/parameters/earth-optimization-prize.ts`. Single source of truth for HALE baseline/target, median-income baseline/target, and the 2040 deadline. Reads from the generated `TREATY_*` parameter constants — do not duplicate the numbers anywhere else. Manual refs: `manual.warondisease.org/knowledge/strategy/earth-optimization-prize.html`, `.../economics/gdp-trajectories.html`.
- **Attribution**: use `computeParentContributionShare(parent, child)` in `packages/web/src/lib/tasks/impact.ts`. Computes `child.delta / parent.delta` for HALE and income. Nothing stored, nothing to drift.
- **Adding a new program**: it must be a child of `win-earth-optimization-prize` (or of one of the programs beneath it). Do not add a new `parentTaskId: null` task. If a task isn't a bet on HALE or income, it should not exist.
- **Ancestors on task detail**: `getTaskAncestors(taskId)` walks `parentTaskId` up to root (depth-capped, cycle-safe). Use this, not ad-hoc recursive Prisma selects.
- **Onboarding tasks** (dashboard welcome tasks) stay out of this tree — they're private onboarding state, not part of the global prize tree.

## High-Value Defaults

1. **NEVER commit.** The user reviews every change before it lands. Stage files if helpful, leave diffs unstaged. Never run `git commit`, `push`, `merge`, `rebase`, or any history-altering command. Only exception: user says "commit this" in the current turn.
2. **Library packages stay runtime-safe.** No Prisma / runtime DB in `optimizer`, `wishocracy`, `opg`, `obg`, `data`, `agent`, `hypercerts`, `storage`.
3. **Zod only at real boundaries** — HTTP, form, MCP, OAuth. Not internal helpers.

## UI/UX Rules

The goal is to get 8 billion humans to complete the tasks on this site. Every UI decision optimizes for task completion, not decoration.

- **Reuse existing primitives.** Before inlining a card, section, stat, or button, check `components/retroui/*` and `components/ui/*`. Extend an existing primitive before creating a new one. Never recreate what `BrutalCard`, `SectionContainer`, `StatCard`, etc. already do.
- **Big, clear, legible.** Headings `text-4xl sm:text-5xl md:text-6xl font-black uppercase`. Body `text-base font-bold` minimum. Hero numbers (death counters, cost, time) as large as the viewport allows.
- **Cut ruthlessly.** For every page ask: **what can I remove, hide, or collapse that would increase the chance a human actually completes the task on this page?** Delete it. Collapse secondary info into accordions or sub-pages. One primary CTA per screen, visible without scrolling.
- **No blather.** No "welcome to", "let's take a moment", "in this section we'll", "we're excited to". State the fact, state the action, stop. Every word load-bearing. If deleting it doesn't hurt, delete it. Max one adjective per noun. Numbers beat adjectives. A shocking fact beats a paragraph explaining the fact.
- **Wishonia voice everywhere user-facing.** Deadpan, data-first, short sentences, sardonic, no partisan framing. Task descriptions, button labels, errors, empty states, tooltips, emails, modal copy — all of it.
- **Completion test:** cover the bottom half of the screen with your hand. If a user seeing only the top half doesn't know what to do next, restructure.

## Testing Rules (non-negotiable)

**When to write a test:**
- ✅ Pure functions with fallback/branching logic (helpers, parsers, formatters, selectors)
- ✅ State transitions inside `$transaction` or multi-step DB writes (profile edits, vote tallies, claim status)
- ✅ Boundary conversions (Prisma row → DTO, OAuth profile → User row, session → client)
- ✅ Regression fixes — failing test before the fix, in the same change
- ❌ Framework passthroughs (wrappers that just call `findUnique`)
- ❌ UI rendering snapshots — brittle, low signal
- ❌ Tests that transcribe the implementation line-by-line

**Non-flaky or don't bother:**
- No real wall clock — inject `now` or use `vi.setSystemTime`
- No real network / LLM calls — mock at the import boundary
- No `Math.random`, `Date.now`, `crypto.randomUUID` in assertions
- No relying on Prisma row order unless you `orderBy`
- No shared mutable state between tests — each `it` is independent
- If it needs `retry` or `sleep` to pass, it's wrong

**Self-verification is mandatory:**
- Before handing back any non-trivial change, run the affected package test suite: `pnpm --filter @optimitron/<pkg> test`
- If the change touches shared types/schemas, run `pnpm check` across the graph
- Fix every failure yourself. The user reviews working code, not a broken suite.
- If an existing test breaks because of a justified shape change, update it — never `skip` or disable.
- If you can't reproduce a failure locally, say so explicitly. Don't guess-fix.

**Scope:** write the minimum tests that would have caught the bug you just fixed or the regression the change could plausibly introduce. One `describe` per module, one `it` per behavior. Tests read like documentation — name them after behavior, not implementation.

## Color Rules (enforced)

Contrast audit: `pnpm --filter @optimitron/web exec playwright test e2e/contrast-audit.spec.ts --project=default`.

**Approved only:**
- **Brutal tokens:** `brutal-pink`, `brutal-cyan`, `brutal-yellow`, `brutal-red`, `brutal-green` (+ `-foreground` variants)
- **Semantic:** `primary`, `foreground`, `background`, `muted`, `muted-foreground`, `primary-foreground`, `secondary`, `accent`, `destructive`, `border`, `card`, `popover`, `ring`, `input`, `chart-*`
- **Fundamentals:** `black`, `white`, `transparent`, `current`, `inherit` — no opacity modifiers
- **Shadows:** `rgba(0,0,0,1)` only, hard offset

**Every `bg-brutal-*` element MUST set the matching `text-brutal-*-foreground` on the same element.** Children inside colored sections must never use `text-foreground`/`text-white` — let them inherit. `SectionContainer` and `BrutalCard` enforce this via `bgColor`; use them instead of raw divs. **Foreground tokens vary by theme** — never guess, always use the matching `*-foreground` token.

**`bgColor="foreground"` inverts the color context** — `text-foreground` / `text-muted-foreground` become invisible. Any component inside an inverted section that uses those explicit tokens MUST wrap itself in `bg-background text-foreground` to create its own context. Prefer non-inverted `bgColor` unless you control every child's text color.

**Never use:**
- Opacity modifiers on black/white (`text-black/50`, `bg-white/70`) → `text-muted-foreground` / `text-foreground`
- Hardcoded `bg-white` / `text-white` → `bg-background` / `text-primary-foreground`
- Hardcoded `bg-black` / `text-black` → `bg-foreground` / `text-foreground`
- Tailwind color scales (`bg-emerald-100`, `text-gray-500`) → brutal-* or semantic
- Hardcoded hex (`#ef4444`, `#666`, `#f5f5f5`) → CSS custom properties
- Soft shadows (`rgba(0,0,0,0.3)`) → hard only
- Opacity on brutal tokens (`bg-brutal-red/10`) → washed-out pastels; use solid or `bg-muted`. Exception: `hover:bg-brutal-pink/80` for interactive darken.
- **Exception:** `emails/` may use inline hex (email-client requirement).

## Design Primitives — Never Inline

Reference implementation: `E:\code\dih-neobrutalist`.

| Instead of... | Use... |
|---|---|
| `<section className="bg-white py-24">` | `<SectionContainer bgColor="background">` |
| `<h2 className="text-3xl font-black uppercase">` | `<SectionHeader title size="md" />` |
| `<div className="max-w-7xl mx-auto px-4">` | `<Container size="xl">` |
| Inline card with `border-4 border-black shadow-[...]` | `<BrutalCard bgColor shadowSize>` |
| Inline stat block | `<StatCard value label color>` |
| Inline CTA section | `<CTASection heading bgColor>` |
| Inline comparison | `<ComparisonCard left right>` |
| Inline numbered step | `<NumberedStepCard step title description>` |
| Manual stat grid | `<StatCardGrid stats columns>` |

### RetroUI (`components/retroui/`) — compound pattern

`<Card.Header>` not `<CardHeader>`. Import and use:
```tsx
import { Card } from "@/components/retroui/Card"
<Card><Card.Header><Card.Title>T</Card.Title></Card.Header><Card.Content>c</Card.Content></Card>
```

- **Inputs:** `Button`, `Input`, `Textarea`, `Label`, `Checkbox`, `Radio`, `Select`, `Switch`, `Slider`, `Toggle`, `ToggleGroup`
- **Surfaces:** `Card`, `Dialog`, `Drawer`, `Popover`, `Menu`, `ContextMenu`, `Tooltip`, `Sonner`
- **Data/feedback:** `Table`, `Accordion`, `Tab`, `Alert`, `Badge`, `Avatar`, `Progress`, `Breadcrumb`, `Calendar`, `Carousel`, `Command`, `TableOfContents`, `Text`, `Loader`
- **Charts (Recharts):** `AreaChart`, `BarChart`, `LineChart`, `PieChart` under `charts/`

### Domain primitives (`components/ui/`)

`StatCard`/`StatCardGrid`, `SectionHeader`, `SectionContainer`, `ComparisonCard`, `BrutalCard`, `Container`, `GameCTA`, `NumberedStepCard`, `IconCard`/`IconBoxCard`, `FeaturedInfoCard`, `StatBar`, `ArcadeTag`, `CTASection`, `CheckmarkList`. Plus `ParameterValue` under `components/shared/` (inline parameter with hover popover).

### Styling conventions

- **Borders:** RetroUI `border-2`; custom domain `border-4 border-primary`. Never `border-black`.
- **Shadows:** RetroUI `shadow-md` (maps to hard offset via custom props); custom explicit `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`. Never soft.
- **Hover:** RetroUI buttons push-down (`hover:translate-y-1 active:translate-y-2`, shadow shrinks). Custom BrutalCard hover-OUT (`hover:translate-x-[-2px] hover:translate-y-[-2px]`, shadow grows).
- **Typography:** headings `font-black uppercase`; body `font-bold` (700) minimum — never `font-medium/normal/light`; subtle text `text-muted-foreground font-bold`.
- **Sections** alternate brutal tokens (`bg-brutal-pink`, `bg-brutal-cyan`, `bg-brutal-yellow`, `bg-foreground`). Text on colored bg uses the matching foreground variant.

**Do NOT use:** `rounded-xl`/`-2xl` (use `rounded-md` or `rounded-none`), `shadow-sm`/`-lg`, `font-medium/normal/light`, `bg-gray-*` (use `bg-muted`/`bg-background`), gradients.

## Environment Variables

All env vars in **root `.env`** (not `packages/web/.env`). Next.js picks them up via the workspace. Local dev: `NEXTAUTH_URL=http://localhost:3001`.

## Tooling

- **Monorepo:** pnpm workspaces
- **Tests:** vitest (unit/integration), Playwright (e2e)
- **Web:** Next.js 15, Tailwind 4, RetroUI + Radix, next-auth + WorldID
- **Contracts:** Hardhat 2.22, OpenZeppelin 5.1, Solidity 0.8.24
- **CI:** GitHub Actions (typecheck + lint + test on push/PR; web excluded — Vercel handles it)

## Type Safety & Linting

Before handing back any change: `pnpm check` (typecheck + lint + test). Fix every failure yourself. The user reviews working code, not a broken suite.

- **Never** run `pnpm build` / `next build` — the dev server handles compilation. Only run a full build if explicitly asked.
- `tsc` on a single file doesn't work (jsx/alias); use the project-level `pnpm check` or `pnpm --filter @optimitron/<pkg> exec tsc --noEmit`.
- **TypeScript strict mode ON** — `noUncheckedIndexedAccess`, `noImplicitOverride`. ESLint strict.
- **No `any`** — use proper types or `unknown` with guards. No floating promises. No unused vars (prefix `_` if intentional). All tsconfigs extend `tsconfig.base.json`.

## Self-Review: Be Ruthlessly Critical

Before picking a new task, scan with fresh eyes. **Delete on sight:**
- **Dead code** — unused imports, unreachable branches, commented-out code
- **Copy-paste** — extract to shared function
- **Over-engineering** — abstract bases nobody extends, factories creating one thing
- **Wrong abstractions** — 8-parameter functions, methods mixing concerns
- **Magic numbers** — named constants citing the paper
- **Stale TODOs** — do it or delete it

**Simplicity test:** could a junior developer understand this in 30 seconds? If not, simplify. This should not feel like enterprise Java.

**What good looks like:** functions fit on one screen; files stay reviewable (30/300 line thresholds are smells, not caps); module names tell you what's inside; tests read like documentation; no unnecessary abstractions — just functions taking data and returning results.
