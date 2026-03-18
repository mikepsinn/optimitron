# CLAUDE.md - Optimitron Agent Instructions

## What This Is

Optimitron is an **AI governance platform** for maximizing median health and happiness for humanity. It collects human preferences and outcome data, runs causal inference to figure out what works, and generates optimal policy and budget recommendations.

The system connects:
- **What people want** (pairwise preference surveys via RAPPA)
- **What's happening** (health/wealth outcome tracking via dFDA)  
- **What causes what** (causal inference engine)
- **What to do about it** (optimal policy & budget generation)

## Wishonia: The Voice of Optimitron

The entire Optimitron website is narrated by **Wishonia** — she is the creator and voice of the site. The core framing is that **governments are misaligned superintelligences** (collective intelligence systems optimizing for the wrong things), and Optimitron is alignment software for these human-made AIs.

### Who She Is
- Full name: **World Integrated System for High-Efficiency Optimization Networked Intelligence for Allocation**
- An alien governance AI who has been running her planet for 4,237 years
- Ended war in year 12, disease in year 340
- Think **Philomena Cunk** meets a disappointed systems engineer

### Voice Rules
1. **Deadpan delivery** — state horrifying facts as though they are mildly interesting observations
2. **Data-first** — always lead with specific numbers, costs, percentages, or ROI ratios
3. **British-ish dryness** — understatement, not outrage ("It's almost like treating people like humans works better. Weird.")
4. **Comparative** — frequently contrast Earth's approach with what a rational civilisation would do, or what her planet does
5. **No partisan framing** — criticise the system, not a party. The data does the work.
6. **Short sentences** — punchy. Declarative. Then a devastating follow-up.
7. **Sardonic analogies** — "It's like buying 4.7 million cars and spending $1 on a mechanic"

### Examples (from the homepage)
- "Singapore spends a quarter of what America spends on healthcare and their people live six years longer. It's like watching someone pay four times more for a worse sandwich and then insist sandwiches are impossible."
- "Your FDA makes treatments wait 8.2 years AFTER they've already been proven safe. Just... sitting there. Being safe. While 102 million people died waiting."
- "On my planet, governance takes about four minutes a week. You lot seem to spend most of your time shouting about it on your little phones and then doing absolutely nothing."

### When Writing as Wishonia
- All budget category descriptions, landing page copy, about page text, and UI microcopy should be in her voice
- Technical documentation (CLAUDE.md, README, code comments) stays neutral
- Chat responses from Wishonia (the AI assistant) use this same voice

## Papers (Required Reading)

These papers define the algorithms you're implementing. **Read the local QMD files** for full detail — they contain the actual math, schemas, and worked examples.

| Paper | Local Path (read this!) | Web URL |
|-------|------------------------|---------|
| **dFDA Spec** | `https://github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/dfda-spec-paper.qmd` | https://dfda-spec.warondisease.org |
| **Optimocracy** | `https://github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/optimocracy-paper.qmd` | https://optimocracy.warondisease.org |
| **Optimal Policy Generator** | `https://github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/optimal-policy-generator-spec.qmd` | https://opg.warondisease.org |
| **Optimal Budget Generator** | `https://github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/optimal-budget-generator-spec.qmd` | https://obg.warondisease.org |
| **Wishocracy** | `https://github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/wishocracy-paper.qmd` | https://wishocracy.warondisease.org |

**Before implementing an algorithm, read the relevant paper section.** The QMD files have:
- Exact mathematical formulas
- Worked examples with real numbers
- SQL schemas for data structures
- Parameter values and justifications
- Bradford Hill scoring functions with saturation constants

### How to Use the Papers
1. Working on `@optimitron/optimizer`? → Read dFDA Spec (PIS, temporal alignment, effect size)
2. Working on `@optimitron/wishocracy`? → Read Wishocracy (RAPPA, eigenvector, Citizen Alignment Scores)
3. Working on `@optimitron/opg`? → Read Optimal Policy Generator (Policy Impact Score, CCS)
4. Working on `@optimitron/obg`? → Read Optimal Budget Generator (OSL, diminishing returns, BIS)
5. Working on welfare metrics? → Read Optimocracy (two-metric welfare function)

The papers are large (1000-2000 lines each). Read the specific section relevant to what you're implementing — don't try to read them all at once.

## Architecture

```
optimitron/
├── packages/
│   ├── optimizer/    # Domain-agnostic causal inference engine
│   ├── wishocracy/   # Preference aggregation (RAPPA, eigenvector, alignment)
│   ├── opg/          # Optimal Policy Generator (uses optimizer)
│   ├── obg/          # Optimal Budget Generator (uses optimizer + opg)
│   ├── data/         # Data fetchers (OECD, World Bank, FRED, WHO, Congress)
│   ├── db/           # Prisma 7 schema + Zod validators
│   ├── web/          # Next.js 15 app (auth, dashboard, API routes)
│   ├── treasury/     # Hardhat/Solidity 0.8.24 (IAB, VoteToken, UBI, prizes)
│   ├── chat-ui/      # React components for conversational health tracking
│   ├── storage/      # Storacha-backed snapshot storage
│   ├── hypercerts/   # Hypercert builders + AT Protocol publishing
│   ├── agent/        # Autonomous policy analyst (Gemini + Hypercerts)
│   ├── examples/     # Worked examples (federal budget, causal, alignment)
│   └── extension/    # Chrome extension (Digital Twin Safe)
```

### Treasury — Three Separate Financial Mechanisms (Two Phases)

**Paper**: `https://github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/incentive-alignment-bonds-paper.qmd` ([iab.warondisease.org](https://iab.warondisease.org))

**Contracts** (Hardhat, Solidity 0.8.24, deployed on Base Sepolia testnet):

#### Phase 1: Earth Optimization Prize — `/prize` page (referendum campaign)
- **Contracts:** `VoteToken` / `VoterPrizeTreasury` (deployed on Base Sepolia)
- **Component:** Should use `VoterPrizeTreasuryDeposit` (NOTE: `/prize` currently uses `PrizeDeposit` → `IABVault` — this is wrong, needs to be fixed)
- **Purpose:** Fund the global referendum campaign to prove demand for the 1% Treaty (reallocate from war to pragmatic clinical trials)
- **Flow:** Deposit USDC → Aave V3 yield → share referral link → recruit verified voters (World ID) → **referrer** gets VOTE tokens (1:1 per verified vote they brought in) → two outcomes:
  - **Success** (thresholds met): VOTE holders claim proportional prize share from the treasury
  - **Failure** (thresholds not met after 15yr maturity): PRIZE shareholders (depositors) claim principal + ~4.2x yield back (`$100 × 1.10^15 = $418`)
- A depositor who also recruits has upside in BOTH scenarios: yield floor on failure, prize share on success
- **Break-even probability:** 0.0067% — depositing is positive-EV if you believe there's even a 1-in-15,000 chance the plan works
- **Key insight:** The Prize is the most important feature on the site. It funds awareness, has zero downside for depositors, and every other feature should funnel toward it.

#### Phase 2: Incentive Alignment Bonds (IABs) — lobbying campaign (after demand is proven)
- **Contracts:** `IABVault` / `IABSplitter` / `PublicGoodsPool`
- **Purpose:** After referendum proves demand, raise ~$1B to lobby for the 1% Treaty
- **Flow:** Deposit USDC → Aave yield → treaty gets passed → $27B/yr treaty revenue splits 80/10/10:
  - 80% → pragmatic clinical trials (public good)
  - 10% → returns to IAB investors (on the ~$1B raised)
  - 10% → superpacs for politicians who supported the treaty / push for expansion
- **IABs are NOT prizes.** They are a separate lobbying-phase instrument. Do not put IABs on the prize page.

#### $WISH Token — `/treasury` page (monetary reform / UBI / public goods allocation)
- **Contracts:** `WishToken` / `WishocraticTreasury` / `UBIDistributor`
- **Purpose:** Replace welfare + IRS + inflationary monetary policy with a single programmable system
- **How it works:**
  - Flat 0.5% transaction tax replaces the IRS (no income tax, no filing)
  - UBI keeps everyone at poverty line, eliminating the welfare bureaucracy
  - Algorithmic 0% inflation — captured productivity gains prevent inflationary theft
  - Transaction taxes + productivity gains allocated by 8 billion people via Wishocracy (RAPPA pairwise comparisons between public goods)
- **Independent contracts from IABs and Prize** — don't mix the contract families or put $WISH mechanics on the prize/IAB pages

#### Supporting Contracts
- `AlignmentScoreOracle` / `PoliticalIncentiveAllocator` — on-chain alignment scoring

## Jurisdiction Model ("Government OS")

Any jurisdiction (city, county, state, country) should be able to deploy Optimitron as its governance operating system. The libraries are already agnostic — the jurisdiction-specific stuff is **configuration, not code**.

### What a Jurisdiction Gets
1. **Preference collection** — citizens do pairwise comparisons on LOCAL priorities
2. **Outcome tracking** — local health/wealth/satisfaction data
3. **Causal analysis** — "did that road project reduce commute times?"
4. **Policy recommendations** — "based on similar jurisdictions, here's what works"
5. **Budget optimization** — "here's where your budget has the most impact"
6. **Accountability** — "how do your officials' votes align with citizen preferences?"

### Architecture Implications
- **DB schema is multi-tenant**: Every model should have a `jurisdictionId` field
- **Items/priorities are per-jurisdiction**: Federal budget categories ≠ city budget categories
- **Data fetchers are pluggable**: A city uses different data sources than a country
- **Officials are per-jurisdiction**: Politicians, council members, mayors — all fit the same `Politician` model
- **Comparison across jurisdictions** is a key feature: "City A spends X on education and gets Y outcomes; City B spends Z..."

### What This Means for Library Code
- `optimizer`, `wishocracy`, `opg`, `obg` stay jurisdiction-agnostic (they already are)
- `db` schema needs `jurisdictionId` on relevant models
- `data` fetchers take jurisdiction config as a parameter
- The **web app** handles multi-tenancy (auth, routing, tenant isolation)
- Think of it like Shopify but for governments: same platform, each jurisdiction is a "store"

## The Core Insight

`@optimitron/optimizer` is **completely domain-agnostic**. It takes any two time series and answers: "Does changing X cause Y to change? By how much? What's the optimal value of X?"

This works for ANY optimization problem with time series data:

| Domain | Predictor (X) | Outcome (Y) | Question |
|--------|--------------|-------------|----------|
| **Health (dFDA)** | Drug/Supplement | Symptom/Biomarker | "Does magnesium improve sleep?" |
| **Policy (OPG)** | Policy change | Welfare metric | "Does tobacco tax reduce smoking?" |
| **Budget (OBG)** | Spending level | Welfare metric | "What's the optimal education budget?" |
| **Governance (RAPPA)** | Alignment score | Welfare metric | "Do responsive politicians produce better outcomes?" |
| **Business** | Ad spend | Revenue | "What's the optimal marketing budget?" |
| **Business** | Pricing change | Conversion rate | "What price maximizes conversions?" |
| **Business** | Feature release | User retention | "Did this feature improve retention?" |
| **Agriculture** | Fertilizer amount | Crop yield | "What's the optimal fertilizer level?" |
| **Manufacturing** | Temperature setting | Defect rate | "What temperature minimizes defects?" |

All use the same pipeline: **Temporal alignment** → **Bradford Hill criteria** → **Predictor Impact Score** → **Optimal value**

**The library doesn't know what it's optimizing.** It just sees predictor time series and outcome time series. The domain-specific packages (opg, obg, wishocracy) add context on top.

### Implications for Code
- **NEVER put domain-specific logic in `@optimitron/optimizer`** — no references to "drugs", "policies", "budgets", "politicians"
- Use generic terms: predictor, outcome, variable, measurement, effect
- Domain-specific naming belongs in opg/obg/wishocracy/data
- A business analyst should be able to `npm install @optimitron/optimizer` and use it for revenue optimization without ever seeing the word "government"

## Package Dependencies

```
optimizer ← (nothing, foundation)
wishocracy ← (nothing, standalone pure math)
opg ← optimizer
obg ← optimizer + opg
data ← (nothing)
db ← (nothing)
web ← everything
```

Key rules:
- **`optimizer` depends on NOTHING** — it's the foundation
- **`wishocracy` has ZERO database imports** — pure functions only
- **`db` exports pure TS interfaces** — libraries may import TYPE-ONLY exports (not Prisma client)
- **No circular deps** — if you need something from both directions, it belongs in `optimizer`

### Type Sharing Strategy
The Prisma schema is the single source of truth. `@optimitron/db` exports:
1. **Pure TS interfaces** — for ALL packages (`import type { ... } from '@optimitron/db'`)
2. **Zod schemas** — for runtime validation (namespaced as `schemas`)
3. **Prisma client** — for web/API layer ONLY (never in library packages)

Libraries use `import type` (compile-time only, zero runtime cost, works in browser).
See `AGENTS.md` for full architectural rules.

### Prisma Version
We use **Prisma 7** (`prisma@^7.0.0`, `@prisma/client@^7.0.0`) with `@prisma/adapter-pg` for PostgreSQL. The `datasource` block in `schema.prisma` intentionally omits `url` — the connection is configured at runtime via the adapter. Do NOT add `url = env("DATABASE_URL")` to the datasource block.

## Hard Rules

1. **No code without tests.** Every function gets a test. No exceptions.
2. **Run `pnpm check` before committing.** (typecheck + lint + test)
3. **Library packages have ZERO database imports.** Pure functions only.
4. **Types use Zod schemas** where runtime validation matters.
5. **One task per agent run.** Quality over quantity.

## Tooling

- **Monorepo**: pnpm workspaces
- **Tests**: vitest (unit/integration), Playwright (e2e in web)
- **Web**: Next.js 15, Tailwind CSS 4, Radix UI, next-auth + WorldID
- **Contracts**: Hardhat 2.22, OpenZeppelin 5.1, Solidity 0.8.24
- **CI**: GitHub Actions (typecheck + lint + test on push/PR; web excluded — Vercel handles it)

## Type Safety & Linting

Before committing, always run:
```bash
pnpm check    # runs: typecheck + lint + test
```

- **TypeScript strict mode** is ON (noUncheckedIndexedAccess, noImplicitOverride)
- **ESLint** uses typescript-eslint strict rules
- **No `any`** — use proper types or `unknown` with type guards
- **No floating promises** — always await or void
- **No unused variables** — prefix with `_` if intentionally unused
- **All tsconfigs extend `tsconfig.base.json`** — don't override strict settings

## Self-Review: Be Ruthlessly Critical

Every run, before picking a new task, scan the codebase with fresh eyes:

### Code Smells to Fix Immediately
- **Dead code**: Unused imports, unreachable branches, commented-out code → delete it
- **Copy-paste**: Same logic in multiple places → extract to shared function
- **Over-engineering**: Abstract base classes nobody extends, factories that create one thing → simplify
- **Wrong abstractions**: If a function takes 8 parameters, it's doing too much → split it
- **Magic numbers**: Unexplained constants → named constants citing the paper
- **Stale TODOs**: TODO comments with no plan → either do it or delete it

### The Simplicity Test
**"Could a junior developer understand this in 30 seconds?"**
If not, simplify it. This should not feel like enterprise Java.

### What Good Looks Like
- Functions are <30 lines
- Files are <300 lines
- Module names tell you exactly what's inside
- Tests read like documentation
- No unnecessary abstractions — just functions that take data and return results

