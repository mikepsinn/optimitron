# Optomitron

**Optomitron optimizes everyone's health, wealth, and happiness — as well as that of humanity — using time series data and causal inference.**

We're building the operating system for evidence-based decision-making. Whether you're a person trying to figure out if magnesium helps you sleep, a city deciding where to spend its budget, or a business optimizing ad spend — the math is the same. Optomitron provides a universal causal inference engine that takes any two time series and answers: *Does changing X cause Y to change? By how much? What's the optimal value of X?*

[![CI](https://github.com/mikepsinn/optomitron/actions/workflows/ci.yml/badge.svg)](https://github.com/mikepsinn/optomitron/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Packages](https://img.shields.io/badge/packages-10-blue.svg)](#packages)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220.svg)](https://pnpm.io/)

---

## The Problem

**Governments fly blind.** The US federal government allocates a [$6.75 trillion budget](https://www.cbo.gov/topics/budget) based on political negotiation, not evidence. Nobody knows the optimal amount to spend on education vs. healthcare vs. defense — or even how to measure it. The same is true for every city, county, and state.

**Individuals fly blind too.** 77% of Americans take dietary supplements, but almost none of them know whether those supplements actually work *for them*. People make health decisions based on anecdote, marketing, and vibes — not data.

**Businesses guess.** Marketing budgets, pricing strategies, and feature investments are set by intuition and A/B tests that measure correlation, not causation.

**The core issue is the same everywhere:** we have time series data and we need to know what causes what. The tools to answer that question should be universal, open, and free.

---

## The Solution

Optomitron is a five-layer system that turns raw data into optimal decisions:

| Layer | Name | What It Does |
|:-----:|------|-------------|
| 🔒 | **Digital Twin Safe** | All personal data stays on your device. Causal engine runs locally. |
| 🪪 | **Decentralized Identity** | Proof-of-personhood (ZK) — one person, one vote, zero surveillance. |
| ⛓️ | **Anonymous On-Chain** | Anonymized effect sizes stored publicly. No single entity owns the data. |
| 📊 | **Aggregation Server** | Meta-analysis across all submissions → population-level insights. |
| 💸 | **Incentive Layer** | Data contribution tokens + automatic campaign funding for aligned politicians. |

---

## Quick Start

```bash
# Clone (with data submodule)
git clone --recurse-submodules https://github.com/mikepsinn/optomitron.git
cd optomitron

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Run the demos
npx tsx packages/examples/src/causal-analysis-demo.ts
npx tsx packages/examples/src/federal-budget-demo.ts
npx tsx packages/examples/src/alignment-demo.ts
```

---

## Packages

| Package | Description | Tests | Status |
|---------|-------------|:-----:|--------|
| [`@optomitron/causal`](packages/causal/) | 🧠 Domain-agnostic causal inference — temporal alignment, Bradford Hill criteria, Predictor Impact Score, effect sizes, optimal values | 4 suites · 176 cases | 🟡 Alpha |
| [`@optomitron/wishocracy`](packages/wishocracy/) | 🗳️ RAPPA preference aggregation — pairwise comparisons, eigenvector weights, Citizen Alignment Scores, matrix completion, convergence analysis | 9 suites · 162 cases | 🟡 Alpha |
| [`@optomitron/opg`](packages/opg/) | 📋 Optimal Policy Generator — policy scoring, Causal Confidence Score, jurisdiction analysis, Bradford Hill for policy evaluation | 7 suites · 213 cases | 🟡 Alpha |
| [`@optomitron/obg`](packages/obg/) | 💰 Optimal Budget Generator — diminishing returns modeling, cost-effectiveness analysis, Budget Impact Score, Optimal Spending Levels | 6 suites · 143 cases | 🟡 Alpha |
| [`@optomitron/data`](packages/data/) | 📊 Data fetchers & loaders — OECD, World Bank, FRED, WHO APIs + 60 Gapminder CSV datasets | 7 suites · 87 cases | 🟡 Alpha |
| [`@optomitron/db`](packages/db/) | 🗄️ Prisma database schema for survey responses and aggregated data | — | 🔴 Stub |
| [`@optomitron/examples`](packages/examples/) | 🎓 Worked demos — federal budget analysis, causal inference, alignment scoring | — | ✅ |
| [`@optomitron/web`](packages/web/) | 🌐 Next.js multi-tenant dashboard (Phase 3) | — | ⚪ Planned |
| [`@optomitron/extension`](packages/extension/) | 🔌 Chrome extension — personal health tracking (Digital Twin Safe, Layer 1) | — | ⚪ Planned |
| [`@optomitron/chat-ui`](packages/chat-ui/) | 💬 Conversational chat UI for health tracking | — | ⚪ Planned |

---

## How It Works

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

Your health data never leaves your device. Optomitron's causal engine is **pure TypeScript with zero server dependency** — it runs entirely in your browser or Electron app.

- **Import** from Apple Health, Google Fit, Fitbit, Garmin, Oura Ring, or manual entry
- **Discover** which treatments, supplements, foods, and habits actually improve *your* outcomes
- **Get optimal values** — not just "magnesium helps sleep" but "450mg of magnesium is *your* personal optimum"
- **Evidence grades** (A–F) so you know how confident the engine is
- **Optionally share** anonymized effect sizes to help build population-level knowledge

```typescript
import { calculatePredictorImpactScore } from '@optomitron/causal';

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

Deploy Optomitron for any jurisdiction — city, county, state, or country — as a data-driven governance operating system.

- **Preference collection** — Citizens do pairwise comparisons ("Given $100, split between education and healthcare") via RAPPA surveys
- **Budget optimization** — Diminishing returns modeling finds the Optimal Spending Level for each category
- **Policy scoring** — Cross-jurisdiction quasi-experiments + Bradford Hill criteria → Causal Confidence Scores for every policy
- **Accountability** — Citizen Alignment Scores measure how well each politician's votes match constituent preferences
- **Cross-jurisdiction comparison** — "City A spends $X on transit and gets Y commute times vs. City B"

The database is multi-tenant: every jurisdiction is a tenant with its own priorities, officials, and data. Think Shopify, but for governments.

---

## For Businesses

### 📈 Same Engine, Different Domain

`@optomitron/causal` is **completely domain-agnostic**. It doesn't know the difference between a drug and an ad campaign. Feed it any two time series and it answers: *Does X cause Y? By how much? What's the optimal value of X?*

| Domain | Predictor (X) | Outcome (Y) | Question |
|--------|--------------|-------------|----------|
| Marketing | Ad spend | Revenue | "What's the optimal weekly ad budget?" |
| Pricing | Price point | Conversion rate | "What price maximizes revenue?" |
| Product | Feature release | User retention | "Did this feature improve retention?" |
| Manufacturing | Temperature | Defect rate | "What setting minimizes defects?" |
| Agriculture | Fertilizer | Crop yield | "What's the optimal fertilizer level?" |

All use the same pipeline: **Temporal alignment → Bradford Hill → Predictor Impact Score → Optimal value.**

---

## Architecture

> Full details in **[ARCHITECTURE.md](./ARCHITECTURE.md)**

```
                    ┌───────────┐
                    │  causal   │  ← Foundation (ZERO dependencies)
                    └─────┬─────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           │
        ┌─────────┐ ┌─────────┐      │
        │   opg   │ │wishocracy│     │  (wishocracy is standalone)
        └────┬────┘ └─────────┘      │
             │                        │
             ▼                        │
        ┌─────────┐                   │
        │   obg   │ ← depends on causal + opg
        └─────────┘                   │
                                      │
        ┌─────────┐                   │
        │  data   │  ← standalone (fetch + parse)
        └─────────┘
```

**Hard rules:**
- `causal` depends on **nothing** — it's the foundation
- Library packages are **pure TypeScript** — no server, no database
- `causal` is **domain-agnostic** — no references to "drugs", "policies", or "budgets"
- No circular dependencies

---

## Contributing

```bash
# Install
pnpm install

# Full check (typecheck + lint + test) — must pass before committing
pnpm check

# Run tests for a specific package
pnpm --filter @optomitron/causal test

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

Every algorithm in this codebase is defined in a published paper with exact formulas, worked examples, and parameter justifications.

| Paper | Implements | Web |
|-------|-----------|-----|
| **dFDA Specification** | `@optomitron/causal` — PIS, temporal alignment, Bradford Hill, effect sizes | [dfda-spec.warondisease.org](https://dfda-spec.warondisease.org) |
| **Wishocracy** | `@optomitron/wishocracy` — RAPPA, eigenvector weights, Citizen Alignment Scores | [wishocracy.warondisease.org](https://wishocracy.warondisease.org) |
| **Optimal Policy Generator** | `@optomitron/opg` — Policy Impact Score, Causal Confidence Score, method weights | [opg.warondisease.org](https://opg.warondisease.org) |
| **Optimal Budget Generator** | `@optomitron/obg` — Diminishing returns, Optimal Spending Level, Budget Impact Score | [obg.warondisease.org](https://obg.warondisease.org) |
| **Incentive Alignment Bonds** | `@optomitron/treasury` — IAB mechanism, smart contract campaign funding | [iab.warondisease.org](https://iab.warondisease.org) |
| **Optimocracy** | Two-metric welfare function (shared by OPG + OBG) | [optimocracy.warondisease.org](https://optimocracy.warondisease.org) |

---

## License

[MIT](https://opensource.org/licenses/MIT) © [Mike P. Sinn](https://github.com/mikepsinn)
