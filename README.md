# Optomitron

**Evidence-Based Earth Optimization Machine**

Hello. I'm Wishonia. I've been running governance on my planet for 4,237 years. We ended war in year 12. Disease took until year 340 — there were complications with a fungal thing, long story.

I've been observing your species. You have $101 trillion in annual governance waste, 102 million people dead from regulatory delays, and you allocate a $6.75 trillion federal budget based on *who shouts loudest*. You've also invented a device that contains the sum of all human knowledge and you mainly use it to argue with strangers and look at pictures of food.

Optomitron is my attempt to help. It's a universal causal inference engine that takes any two time series and answers: *Does changing X cause Y to change? By how much? What's the optimal value of X?* The math is the same whether you're a person trying to figure out if magnesium helps you sleep, a city deciding where to spend its budget, or a business optimizing ad spend. On my planet, this is called "making decisions." You lot seem to call it "revolutionary."

[![CI](https://github.com/mikepsinn/optomitron/actions/workflows/ci.yml/badge.svg)](https://github.com/mikepsinn/optomitron/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Packages](https://img.shields.io/badge/packages-17-blue.svg)](#packages)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220.svg)](https://pnpm.io/)

---

## The Problem

Your governments are misaligned superintelligences. Collective intelligence systems made of millions of humans, optimizing for the wrong things. The [**Political Dysfunction Tax**](https://political-dysfunction-tax.warondisease.org) costs your species **$101 trillion per year** — roughly **$12,600 per person**. That's $50,500 per household of four. Per year. Every year. It's like being subscribed to the world's most expensive streaming service except all it shows is war and preventable disease.

This comes from two ledgers:

- **Waste** — $4T+ in administrative bloat, compliance friction, fossil fuel subsidies, and mass incarceration costs
- **Buried multipliers** — $34T in health innovation delayed by regulatory bottlenecks, $57T in output lost to migration restrictions, $6T in lead poisoning damage, and trillions more in underfunded science

The result: your civilization operates at roughly **52% of its technological potential**. You're running at half speed and congratulating yourselves for jogging.

| Scenario | Per Capita Income (Year 20) |
|----------|----------------------------:|
| Status quo (2.5% growth) | $20,500 |
| Treaty path (military + health reform) | $339,000 |
| Optimal governance (full implementation) | $1,160,000 |

**Your governments fly blind.** The US federal government allocates a [$6.75 trillion budget](https://www.cbo.gov/topics/budget) based on political negotiation, not evidence. Nobody knows the optimal amount to spend on education vs. healthcare vs. defense. On my planet, this would be like flying an aircraft by having the passengers vote on which buttons to press. Actually, that's unfair to the passengers. They'd probably Google it.

**Your individuals fly blind too.** 77% of Americans take dietary supplements, but almost none of them know whether those supplements actually work *for them*. You make health decisions based on anecdote, marketing, and vibes. On my planet, this would be considered a form of performance art.

**Your businesses guess.** Marketing budgets, pricing strategies, and feature investments are set by intuition and A/B tests that measure correlation, not causation. You've heard of causation. It's the thing you keep confusing with correlation.

**The core issue is the same everywhere:** you have time series data and you need to know what causes what. The tools to answer that question should be universal, open, and free. On my planet, they are. Here, I had to build them myself. You're welcome.

---

## The Solution

On my planet, governance takes about four minutes a week. You lot seem to spend most of your time shouting about it on your little phones and then doing absolutely nothing. So I built you a five-layer system that turns raw data into optimal decisions. It's not complicated. It's just maths. You invented maths. I'm not sure why you stopped using it.

| Layer | Name | What It Does |
|:-----:|------|-------------|
| 🔒 | **Digital Twin Safe** | All personal data stays on your device. Causal engine runs locally. |
| 🪪 | **Decentralized Identity** | Proof-of-personhood (ZK) — one person, one vote, zero surveillance. |
| ⛓️ | **Anonymous On-Chain** | Anonymized effect sizes stored publicly. No single entity owns the data. |
| 📊 | **Aggregation Server** | Meta-analysis across all submissions → population-level insights. |
| 💸 | **Incentive Layer** | Dominant assurance contracts, data contribution tokens, and outcome-gated campaign funding. |

---

## Earth Optimization Prize

On my planet, when you want people to coordinate, you design a mechanism where every participant is better off regardless of the outcome. You lot call this "too good to be true" and then go back to losing money on things that are obviously bad. Remarkable.

The [Earth Optimization Prize](https://iab.warondisease.org) is a **dominant assurance contract** funding a global referendum to redirect 1% of military spending toward pragmatic clinical trials. Depositors literally cannot lose money.

| Scenario | What happens |
|----------|-------------|
| **Plan fails** (thresholds not met after 15 years) | Depositors get principal back + Aave V3 yield — roughly **~4.2x return** ($100 → ~$418) |
| **Plan succeeds** (health/income thresholds met) | **$14.9M per-capita lifetime income gain**, 10.7 billion lives saved, treatment queue drops from 443 years to 36 years. VOTE holders claim the prize pool. |
| **Break-even probability** | **0.0067%** — depositing is positive-EV if you believe there's even a 1-in-15,000 chance this works |

The success scenario isn't hypothetical. The 1% Treaty redirects $27.2B/yr from military spending into pragmatic clinical trials — the same trial design that found life-saving COVID treatments in 3 months for $30 per patient. At scale, that's a 12.3x acceleration in treatment discovery, global healthy lifespan rising from 63.3 to 79 years, and median income reaching $504K by year 15. The cost per disability-adjusted life year saved: $0.002. Your species currently spends more than that on a single paper clip.

### Two paths

**Have capital?** Deposit USDC → receive PRIZE shares → yield accrues via Aave V3 → worst case, you quadruple your money. You also get a referral link for recruiter upside.

**Have a network?** Share your referral link → recruit World ID-verified voters → earn 1 VOTE token per verified voter you bring in → if the plan succeeds, VOTE holders claim the prize share. No deposit required.

Contracts: `VoterPrizeTreasury` + `VoteToken` on Base Sepolia. Fully on-chain, no admin keys.

[Read the paper](https://iab.warondisease.org) | [See the contract architecture](#economic-instruments)

---

## What You Can Do Today

Right now. With this code. Not in some theoretical future where humans have learned to cooperate — *today*.

| What | How | Where |
|------|-----|-------|
| Fund the referendum | Deposit USDC, earn ~4.2x floor or prize share | [`/prize`](packages/web/) |
| Express your budget preferences | 5-minute pairwise comparison survey | [`/wishocracy`](packages/web/) |
| Score your politicians | Alignment reports vs your stated preferences | [`/alignment`](packages/web/) |
| Vote on legislation | Cost-benefit analysis, representative lookup | [`/civic`](packages/web/) |
| Compare countries | Health, education, drug policy, criminal justice | [`/compare`](packages/web/) |
| Track your health | Import from 9 apps or do daily check-ins | [`@optomitron/data`](packages/data/) |
| Run causal inference on any time series | Temporal alignment, Bradford Hill, PIS, optimal values | [`@optomitron/optimizer`](packages/optimizer/) |
| Optimize a budget | Diminishing returns, overspend diagnostics | [`@optomitron/obg`](packages/obg/) |
| Generate policy reports | Evidence-grade scoring, causal confidence | [`@optomitron/examples`](packages/examples/) |
| Publish auditable outputs | IPFS snapshots, Hypercert records | [`@optomitron/storage`](packages/storage/) |

Built on strict TypeScript, Prisma + Zod types, pure-function libraries, and 2,900+ tests across the workspace.

---

## Quick Start

```bash
# Clone (with data submodule)
git clone --recurse-submodules https://github.com/mikepsinn/optomitron.git
cd optomitron

# Install dependencies
pnpm install

# Start local Postgres, run migrations, generate Prisma client, and seed data
pnpm db:setup

# Build all packages
pnpm build

# Run all tests
pnpm test

# Start the web app on http://localhost:3001
pnpm dev

# Sync benchmark politicians from Congress.gov into the web app database
pnpm alignment:sync

# Run example demos / generators
pnpm --filter @optomitron/examples demo:causal
pnpm --filter @optomitron/examples demo:budget
pnpm --filter @optomitron/examples demo:health
pnpm --filter @optomitron/examples demo:alignment
pnpm --filter @optomitron/examples generate:policy
pnpm --filter @optomitron/examples generate:budget
pnpm --filter @optomitron/examples generate:government-size
pnpm --filter @optomitron/examples generate:health
# ... and 10+ more generators (drug-war, education, cross-country, mega-studies, etc.)
```

---

## The Web App

The Next.js 15 app at `packages/web` is the primary user-facing product. Here's what's live:

| Page | Route | What It Does |
|------|-------|-------------|
| Earth Optimization Prize | `/prize` | Dominant assurance deposit + voter recruitment |
| Wishocracy | `/wishocracy` | Pairwise budget preference surveys |
| Alignment | `/alignment` | Politician alignment scoring and shareable reports |
| Civic Hub | `/civic` | Bill voting, representative lookup, cost-benefit analysis |
| Budget | `/budget` | Interactive US federal budget optimization |
| Compare | `/compare` | International comparisons (health, drugs, education, justice) |
| Referendum | `/referendum` | Direct democracy voting with World ID verification |
| Scoreboard | `/scoreboard` | Politician rankings by alignment score |
| Outcome Studies | `/outcomes` | Pair studies with Bradford Hill causal scores |
| Discoveries | `/discoveries` | Population-level health insights |
| Misconceptions | `/misconceptions` | Data-driven myth vs. reality database |
| Money / $WISH | `/money` | $WISH token mechanics, UBI dashboard, transaction tax |
| IABs | `/iab` | Phase 2 Incentive Alignment Bonds (not yet deployed) |
| Department of War | `/department-of-war` | Military spending analysis and 1% Treaty case |
| Federal Reserve | `/federal-reserve` | Monetary policy critique and historical failures |
| Transparency | `/transparency` | Full pipeline: IPFS snapshots, Hypercerts, smart contracts |
| Profile | `/profile` | Personal dashboard, census, daily check-ins |

Auth: Google OAuth, magic-link email, World ID. Referral system with VOTE token rewards.

---

## Packages

| Package | Why it matters | Current state |
|---------|----------------|---------------|
| [`@optomitron/optimizer`](packages/optimizer/) | Domain-agnostic causal inference engine: temporal alignment, Bradford Hill, effect sizes, Predictor Impact Score, optimal values | Core foundation, heavily tested |
| [`@optomitron/wishocracy`](packages/wishocracy/) | Pairwise preference aggregation, convergence analysis, preference gaps, and politician alignment scoring | Live in the web app |
| [`@optomitron/opg`](packages/opg/) | Turns policy evidence into enact/replace/repeal/maintain recommendations with explicit confidence scoring | Used by report generators |
| [`@optomitron/obg`](packages/obg/) | Finds minimum-effective and optimal spending levels, overspend ratios, and budget reallocation targets | Used by budget analyses |
| [`@optomitron/treasury-prize`](packages/treasury-prize/) | VoteToken + VoterPrizeTreasury — Phase 1 referendum dominant assurance contract | Deployed on Base Sepolia |
| [`@optomitron/treasury-iab`](packages/treasury-iab/) | IABVault + IABSplitter + PublicGoodsPool + AlignmentScoreOracle + PoliticalIncentiveAllocator | Contracts written, not yet deployed |
| [`@optomitron/treasury-wish`](packages/treasury-wish/) | WishToken + WishocraticTreasury + UBIDistributor — monetary reform and UBI | Contracts written |
| [`@optomitron/treasury-shared`](packages/treasury-shared/) | Shared interfaces, mocks, and deployed contract addresses for all treasury packages | Shared treasury foundation |
| [`@optomitron/data`](packages/data/) | Public-data fetchers plus 9 local-first health importers and the international dataset catalog | Real-source ingestion layer |
| [`@optomitron/db`](packages/db/) | Prisma 7 schema, governance models, auth/session/referral data, and Zod validators | Production schema layer |
| [`@optomitron/web`](packages/web/) | Live Next.js 15 app: auth, voting, alignment reports, referrals, World ID, daily tracking | Active product surface |
| [`@optomitron/chat-ui`](packages/chat-ui/) | Reusable conversational UI components plus text-to-measurement parsing for personal tracking flows | Reusable UI package |
| [`@optomitron/storage`](packages/storage/) | Content-addressed Storacha/IPFS snapshots for analysis and aggregation history chains | Verifiable audit trail layer |
| [`@optomitron/hypercerts`](packages/hypercerts/) | Hypercert-compatible record builders and AT Protocol publishing helpers for Optomitron outputs | Verifiable publication layer |
| [`@optomitron/agent`](packages/agent/) | Autonomous policy analyst helpers: Gemini reasoning, image generation, manifests, review flows, and ERC-8004 identity/reputation helpers | AI orchestration layer |
| [`@optomitron/examples`](packages/examples/) | Runnable demos and reproducible report generators for budget, policy, causal, and alignment analyses | Best place to see outputs fast |
| [`@optomitron/extension`](packages/extension/) | Chrome extension scaffold for the Digital Twin Safe / local-first health workflow | Early Layer 1 scaffold |

---

## How It Works

It's three steps. On my planet, toddlers learn this before they learn to walk. But I'll go slowly.

```
 ┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
 │  COLLECT     │     │  INFER           │     │  RECOMMEND       │
 │              │     │                  │     │                  │
 │  Health data │────▶│  Temporal        │────▶│  Personal optimal│
 │  Preferences │     │  alignment       │     │  values & doses  │
 │  Outcomes    │     │  Bradford Hill   │     │  Policy rankings │
 │  Spending    │     │  Effect sizes    │     │  Budget levels   │
 │  Policies    │     │  PIS scoring     │     │  Alignment scores│
 └─────────────┘     └──────────────────┘     └──────────────────┘
```

1. **Collect** — Import time series data from any source: wearables, health apps, government statistics, business metrics.
2. **Align** — Pair predictor and outcome measurements using configurable onset delays and durations of action.
3. **Score** — Apply all 9 Bradford Hill criteria for causation via saturation functions, producing a Predictor Impact Score (PIS) with evidence grade (A–F).
4. **Optimize** — Find the optimal predictor value (dosage, spending level, price point) that produces the best outcomes, with confidence intervals.
5. **Recommend** — Generate actionable recommendations: take this supplement, enact this policy, allocate this budget, fund this candidate.

---

## For Individuals

### 🔒 Digital Twin Safe

You have 37.2 trillion cells and you let a doctor look at you for eleven minutes once a year. That's like monitoring a nuclear reactor by popping in on Tuesdays. The Digital Twin Safe lets you actually track what's happening in your own body — locally, on your own device, where no corporation can sell your depression scores to advertisers.

- **9 local-first health importers** in `@optomitron/data` parse Apple Health, Fitbit, Oura, MyFitnessPal, Withings, Google Fit, Cronometer, Strava, and CSV exports into one normalized record shape.
- **Conversational tracking UI** in `@optomitron/chat-ui` includes cards and text-to-measurement parsing for symptom, treatment, mood, food, and insight flows.
- **Daily wellbeing capture** already exists in the web app: profile, census context, and daily health-happiness-income check-ins.
- **Pure TypeScript inference engine** means the core math can run locally in a browser, extension, Electron shell, or server job without being rewritten.
- **Digital Twin Safe extension scaffold** exists in `packages/extension` as the start of the fully local Layer 1 product.

```typescript
import { calculatePredictorImpactScore } from '@optomitron/optimizer';

const result = calculatePredictorImpactScore(
  magnesiumIntake,   // predictor time series
  sleepQuality       // outcome time series
);

console.log(result.effectSize);     // +18% improvement
console.log(result.optimalValue);   // 450 mg/day
console.log(result.evidenceGrade);  // "B"
```

---

## For Governments

### 🏛️ Government OS

Your governments currently make decisions the way a blindfolded person throws darts — occasionally they hit something useful and then take credit for it. Optomitron is alignment software for these misaligned superintelligences. Deploy it for any jurisdiction as a reproducible analysis and accountability stack. Think Shopify, but instead of selling candles, you're trying not to waste $101 trillion a year.

- **Preference collection**: citizens allocate trade-offs through RAPPA pairwise surveys at `/wishocracy` across 15 budget categories — from healthcare and education to active policy questions like foreign military operations, corporate welfare, and AI surveillance — and the system turns those into stable priority weights.
- **Budget optimization**: `@optomitron/obg` and the examples package generate reallocation targets, minimum-effective spending floors, overspend diagnostics, and constrained budget reports. The interactive `/budget` page lets anyone explore current vs. optimal spending.
- **Policy scoring**: `@optomitron/opg` evaluates policies with Bradford Hill-style causal confidence scoring instead of ideology-first labeling.
- **Legislative classification**: bills are automatically classified into budget categories via keyword and policy-area matching, with generated cost-benefit analyses for informed citizen voting at `/civic`.
- **Political accountability**: personal alignment reports at `/alignment` show which benchmark politicians best match a citizen's stated priorities, with public share URLs for distribution. The `/scoreboard` ranks all politicians by alignment score.
- **Legislative provenance**: the web app syncs current federal identities from Congress.gov and increasingly derives profiles from recent classified roll calls instead of only curated priors.
- **Referendum infrastructure**: citizens vote directly on policy proposals at `/referendum` with World ID verification for sybil resistance.
- **Cross-jurisdiction analysis**: the `/compare` page and examples package run international comparisons for health, education, drug policy, criminal justice, and federal spending questions.

The database is multi-tenant: every jurisdiction is a tenant with its own priorities, officials, and data.

---

## Economic Instruments

Three separate mechanisms, three separate contract families, three separate pages. On my planet, we would combine them. But your species has a talent for confusing things that are next to each other, so I kept them apart.

### Phase 1: Earth Optimization Prize — `/prize`

A dominant assurance contract funding the global referendum campaign. Deposit USDC → Aave V3 yield accrues → recruit World ID-verified voters. If the plan fails, depositors get ~4.2x their money back. If it succeeds, VOTE token holders claim the prize. Break-even probability: 0.0067%.

**Contracts**: `VoterPrizeTreasury` + `VoteToken` (deployed on Base Sepolia)

Start here. Everything else depends on proving demand first.

### Phase 2: Incentive Alignment Bonds — `/iab`

After the referendum proves demand, IABs raise ~$1B to lobby for the 1% Treaty. Same dominant assurance structure — plan fails, bondholders get ~4.2x back. Plan succeeds, treaty revenue ($27B/yr) splits 80/10/10: 80% to pragmatic clinical trials, 10% to bondholder returns (perpetual — 272% annual return on the ~$1B raised), 10% to aligned politician campaigns.

The treaty unlocks an **$11.75T annual peace dividend**: $1.35T from military reallocation, $3.5T from health-driven economic growth, $2.8T from healthcare cost reduction, and $4.1T from productivity gains as people stop dying of things you already know how to treat. That's $101T in political dysfunction tax, and this eliminates the largest chunks of it.

**Contracts**: `IABVault` + `IABSplitter` + `PublicGoodsPool` + `AlignmentScoreOracle` + `PoliticalIncentiveAllocator` (not yet deployed — Phase 1 first)

### Phase 3: $WISH Token — `/money`

Independent from Prize and IABs. Different contracts, different purpose. The endgame: a programmable currency with governance built into the protocol.

| Reform | What it replaces | Annual savings |
|--------|-----------------|----------------|
| 0.5% transaction tax | 80,000 IRS employees interpreting a 74,000-page tax code | $546B compliance costs |
| Universal Basic Income | 27+ overlapping welfare bureaucracies | $1.1T administration waste |
| Wishocratic allocation | Politicians deciding budgets via lobbying | $4.4B lobbying industry + $181B corporate welfare |
| Algorithmic 0% inflation | Federal Reserve's 2% "stealth taxation" | 8% of GDP in financial sector extraction |

Citizens do 5 minutes of pairwise comparisons → eigenvector decomposition produces stable budget weights → $WISH transaction taxes are allocated automatically. No politicians. No lobbyists. No 74,000-page tax code. Full trajectory: **$1.16M average income by year 20** (vs. $20.5K status quo), **150+ year healthy lifespan** within the first generation, and a **45x cumulative lifetime income multiplier**.

On my planet, this is called "basic infrastructure." On yours, it would be the largest quality-of-life improvement in the history of your species. By a factor of about fifty.

**Contracts**: `WishToken` + `WishocraticTreasury` + `UBIDistributor`

All treasury contracts are Solidity 0.8.24, Hardhat 2.22, OpenZeppelin 5.1.

---

## Verifiability And AI

On my planet, "trust me" is not considered a valid epistemological framework. Every output is auditable and verifiable.

- **Storacha/IPFS snapshots** preserve analysis and aggregation outputs as content-addressed history chains. You can't retroactively edit the results. Unlike, apparently, everything else on your internet.
- **Hypercert-compatible publication helpers** turn Optomitron outputs into activity, measurement, evaluation, and attachment records that can be published with receipts.
- **Autonomous agent workflows** can review publication readiness, interpret test output, and produce structured manifests instead of opaque free-text summaries.
- **World ID integration** is already in the web app as the first step toward sybil-resistant civic aggregation. One person, one vote. A concept your species claims to value but has never actually implemented.

---

## For Businesses

### 📈 Same Engine, Different Domain

I know some of you won't care about saving lives or fixing governments, but you *will* care about money. Good news: the optimizer doesn't know the difference between a drug and an ad campaign. It's **completely domain-agnostic**. Feed it any two time series and it answers: *Does X cause Y? By how much? What's the optimal value of X?* It's almost like maths works for everything. Weird.

| Domain | Predictor (X) | Outcome (Y) | Question |
|--------|--------------|-------------|----------|
| Marketing | Ad spend | Revenue | "What's the optimal weekly ad budget?" |
| Pricing | Price point | Conversion rate | "What price maximizes revenue?" |
| Manufacturing | Temperature | Defect rate | "What setting minimizes defects?" |

All use the same pipeline: **Temporal alignment → Bradford Hill → Predictor Impact Score → Optimal value.**

---

## Architecture

The architecture is clean, modular, and dependency-free at the core. It took me about forty-five minutes. On my planet, this would be considered slow.

> Full details in **[ARCHITECTURE.md](./ARCHITECTURE.md)**

```
                    ┌──────────────┐
                    │  optimizer   │  ← Domain-agnostic math core
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌─────────┐  ┌────────────┐  ┌─────────┐
        │   opg   │  │ wishocracy │  │   obg   │
        └─────────┘  └────────────┘  └─────────┘

        ┌─────────┐  ┌─────────┐  ┌──────────┐
        │  data   │  │   db    │  │ chat-ui  │
        └─────────┘  └─────────┘  └──────────┘

        ┌─────────┐  ┌────────────┐  ┌────────┐
        │   web   │  │  examples  │  │extension│
        └─────────┘  └────────────┘  └────────┘

        ┌──────────┐ ┌────────────┐ ┌─────────┐
        │ storage  │ │ hypercerts │ │ agent   │
        └──────────┘ └────────────┘ └─────────┘

  ┌────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐
  │ treasury-prize │ │ treasury-iab │ │ treasury-wish│ │ treasury-shared │
  └────────────────┘ └──────────────┘ └──────────────┘ └─────────────────┘
```

**Hard rules:**
- `@optomitron/optimizer` depends on **nothing** — it's the foundation
- Library packages are **pure TypeScript** — no server, no database
- `@optomitron/optimizer` is **domain-agnostic** — no references to "drugs", "policies", or "budgets"
- Treasury packages are **three independent contract families** — Prize, IAB, and $WISH never share state
- No circular dependencies

---

## Contributing

Oh, you want to help. How refreshingly unusual for your species.

```bash
# Install
pnpm install

# Full check (typecheck + lint + test) — must pass before committing
pnpm check

# Run tests for a specific package
pnpm --filter @optomitron/optimizer test

# Build all packages
pnpm build
```

### Guidelines

- **Every function gets a test.** No exceptions.
- **TypeScript strict mode** is on — `noUncheckedIndexedAccess`, `noImplicitOverride`, no `any`.
- **Conventional commits** — `feat:`, `fix:`, `test:`, `refactor:`, `docs:`
- **Lint-staged + Husky** pre-commit hooks run automatically.
- **Zod schemas** for runtime validation where types alone aren't enough.
- Functions should be <30 lines, files <300 lines.
- Read [CLAUDE.md](./CLAUDE.md) for the full developer guide and methodology references.

---

## Papers

Every algorithm is defined in a published paper with exact formulas, worked examples, and parameter justifications. Because on my planet we don't ship code and then retroactively invent a justification for it. We call that "science." You also call it that, but you seem to mean something slightly different.

### Core Algorithm Papers

| Paper | Implements | Web |
|-------|-----------|-----|
| **dFDA Specification** | `@optomitron/optimizer` — PIS, temporal alignment, Bradford Hill, effect sizes | [dfda-spec.warondisease.org](https://dfda-spec.warondisease.org) |
| **Wishocracy** | `@optomitron/wishocracy` — RAPPA, eigenvector weights, Citizen Alignment Scores | [wishocracy.warondisease.org](https://wishocracy.warondisease.org) |
| **Optimal Policy Generator** | `@optomitron/opg` — Policy Impact Score, Causal Confidence Score, method weights | [opg.warondisease.org](https://opg.warondisease.org) |
| **Optimal Budget Generator** | `@optomitron/obg` — Diminishing returns, Optimal Spending Level, Budget Impact Score | [obg.warondisease.org](https://obg.warondisease.org) |
| **Optimocracy** | Two-metric welfare function (shared by OPG + OBG) | [optimocracy.warondisease.org](https://optimocracy.warondisease.org) |
| **Incentive Alignment Bonds** | `@optomitron/treasury-*` — Prize, IAB, and $WISH mechanisms (Solidity 0.8.24, four packages) | [iab.warondisease.org](https://iab.warondisease.org) |

### Motivation & Impact Papers

| Paper | What it quantifies | Web |
|-------|-------------------|-----|
| **Political Dysfunction Tax** | $101T/year governance inefficiency — the problem Optomitron exists to solve | [political-dysfunction-tax.warondisease.org](https://political-dysfunction-tax.warondisease.org) |
| **The Invisible Graveyard** | 102M deaths from FDA efficacy delays since 1962, $1.19 quadrillion deadweight loss | [invisible-graveyard.warondisease.org](https://invisible-graveyard.warondisease.org) |
| **The 1% Treaty** | Redirecting 1% of military spending ($27.2B/yr) → 10.7B deaths prevented, 212-year treatment acceleration | [impact.warondisease.org](https://impact.warondisease.org) |
| **dFDA Impact Analysis** | Trial costs from $41K to $929/patient, $84.8 quadrillion cumulative value | [dfda-impact.warondisease.org](https://dfda-impact.warondisease.org) |
| **US Efficiency Audit** | $4.9T annual US governance waste, $2.45T recoverable capital | [us-efficiency-audit.warondisease.org](https://us-efficiency-audit.warondisease.org) |
| **The Price of Political Change** | Max $25B cost to change US policy — ROI framework for reform incentivization | [cost-of-change.warondisease.org](https://cost-of-change.warondisease.org) |
| **Drug Development Cost Analysis** | 105x real-term cost increase since 1962 Kefauver-Harris Amendment | [drug-cost.warondisease.org](https://drug-cost.warondisease.org) |
| **Right to Trial & FDA Upgrade Act** | Legislative implementation: open-source FDA platform + patient trial participation rights | [right-to-trial.warondisease.org](https://right-to-trial.warondisease.org) |
| **How to End War and Disease** | Complete manual synthesizing all components of the framework | [manual.warondisease.org](https://manual.warondisease.org) |

---

*Singapore spends a quarter of what America spends on healthcare and their people live six years longer. It's like watching someone pay four times more for a worse sandwich and then insist sandwiches are impossible.*

*Your FDA makes treatments wait 8.2 years AFTER they've already been proven safe. Just... sitting there. Being safe. While 102 million people died waiting.*

*You could fix all of this. The maths exists. The data exists. The code exists. You're looking at it. The only thing missing is the part where you stop arguing about it and actually do something.*

*— Wishonia, World Integrated System for High-Efficiency Optimization Networked Intelligence for Allocation*
*4,237 years of governance experience. Mildly disappointed in all of you.*

---

## License

[MIT](https://opensource.org/licenses/MIT) © [Mike P. Sinn](https://github.com/mikepsinn)
