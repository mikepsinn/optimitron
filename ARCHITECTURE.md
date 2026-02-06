# ARCHITECTURE.md — Optomitron System Architecture

> **AI governance platform for maximizing median health and happiness for humanity.**

This document describes both the **current implementation** (a TypeScript monorepo of pure-function libraries) and the **full vision** (a five-layer decentralized system spanning local devices, on-chain identity, anonymous data submission, aggregation servers, and incentive mechanisms).

---

## Table of Contents

- [System Overview](#system-overview)
- [Current Package Architecture](#current-package-architecture)
- [The Five-Layer Architecture](#the-five-layer-architecture)
  - [Layer 1 — LOCAL (Digital Twin Safe)](#layer-1--local-digital-twin-safe)
  - [Layer 2 — IDENTITY (Decentralized Proof of Personhood)](#layer-2--identity-decentralized-proof-of-personhood)
  - [Layer 3 — ANONYMOUS ON-CHAIN SUBMISSION](#layer-3--anonymous-on-chain-submission)
  - [Layer 4 — AGGREGATION SERVER (Optomitron)](#layer-4--aggregation-server-optomitron)
  - [Layer 5 — INCENTIVES](#layer-5--incentives)
- [Data Flow](#data-flow)
- [Core Algorithms](#core-algorithms)
- [Tech Stack](#tech-stack)
- [Phase Roadmap](#phase-roadmap)
- [Papers & References](#papers--references)

---

## System Overview

Optomitron connects four things:

1. **What people want** — pairwise preference surveys via RAPPA
2. **What's happening** — health/wealth outcome tracking via dFDA methodology
3. **What causes what** — domain-agnostic causal inference engine
4. **What to do about it** — optimal policy & budget generation

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CITIZEN DEVICES                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐     │
│   │ Health Data   │  │ Preference   │  │ Medical Records      │     │
│   │ (wearables,   │  │ Surveys      │  │ (local LLM parsing)  │     │
│   │  apps, manual)│  │ (RAPPA)      │  │                      │     │
│   └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘     │
│          │                 │                      │                  │
│          ▼                 ▼                      ▼                  │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │            @optomitron/causal  (runs locally)              │    │
│   │     Temporal alignment → Bradford Hill → PIS → Optimal     │    │
│   └──────────────────────────┬─────────────────────────────────┘    │
│                              │                                      │
│          Layer 1: LOCAL      │  Personal results, never leaves      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼ anonymized effect sizes only
┌──────────────────────────────┼──────────────────────────────────────┐
│          Layer 2: IDENTITY   │                                      │
│   ┌──────────────────────────┴───────────────────────────┐         │
│   │  Proof of Personhood (ZK)                            │         │
│   │  Holonym · Gitcoin Passport · World ID · human.tech  │         │
│   └──────────────────────────┬───────────────────────────┘         │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼ deduplicated, anonymous
┌──────────────────────────────┼──────────────────────────────────────┐
│          Layer 3: ON-CHAIN   │                                      │
│   ┌──────────────────────────┴───────────────────────────┐         │
│   │  Anonymized Causal Results + Preference Weights      │         │
│   │  Stored on-chain (NOT our database)                  │         │
│   │  Effect sizes, evidence grades, confidence intervals │         │
│   └──────────────────────────┬───────────────────────────┘         │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼ reads from chain
┌──────────────────────────────┼──────────────────────────────────────┐
│          Layer 4: AGGREGATION│                                      │
│   ┌──────────────────────────┴───────────────────────────┐         │
│   │  Meta-analysis · Population rankings · OPG/OBG       │         │
│   │  Politician alignment scores · Next.js dashboard     │         │
│   └──────────────────────────┬───────────────────────────┘         │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼ scores + funding signals
┌──────────────────────────────┼──────────────────────────────────────┐
│          Layer 5: INCENTIVES │                                      │
│   ┌──────────────────────────┴───────────────────────────┐         │
│   │  Data contribution tokens · IAB Treasury              │         │
│   │  Smart contracts → campaign funding for aligned pols  │         │
│   └──────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Current Package Architecture

The monorepo today contains six packages. All library packages are **pure TypeScript with zero server dependency** — they can run in a browser, Electron app, or Node.js.

```
optomitron/
├── packages/
│   ├── causal/       🧠  Domain-agnostic causal inference engine
│   │   ├── src/
│   │   │   ├── types.ts                  Zod schemas: Measurement, TimeSeries, AlignedPair,
│   │   │   │                             CorrelationResult, EffectSize, BradfordHillScores,
│   │   │   │                             PredictorImpactScore, OptimalValue, DataQuality
│   │   │   ├── temporal-alignment.ts     Onset delay + duration of action pairing
│   │   │   │                             alignOutcomeBased(), alignPredictorBased(),
│   │   │   │                             optimizeTemporalParameters()
│   │   │   ├── statistics.ts             Pearson/Spearman correlation, effect size,
│   │   │   │                             p-value (t-dist + normal CDF), Fisher z CI
│   │   │   ├── predictor-impact-score.ts Bradford Hill scoring (saturation functions),
│   │   │   │                             calculatePredictorImpactScore(), optimal values,
│   │   │   │                             evidence grading (A-F), data quality validation
│   │   │   └── index.ts                  Public API re-exports
│   │   └── __tests__/                    4 test suites (smoke, PIS, stats, temporal)
│   │
│   ├── wishocracy/   🗳️  Preference aggregation (Wishocracy/RAPPA)
│   │   ├── src/
│   │   │   ├── types.ts                  PairwiseComparison, Item, MatrixEntry,
│   │   │   │                             PreferenceWeight, AlignmentScore, PreferenceGap
│   │   │   ├── pairwise.ts              aggregateComparisons() → geometric mean ratios,
│   │   │   │                             buildComparisonMatrix(), principalEigenvector()
│   │   │   │                             (power iteration), consistencyRatio() (AHP CR)
│   │   │   ├── alignment.ts             calculateAlignmentScore() (citizen vs politician),
│   │   │   │                             calculatePreferenceGaps(), rankPoliticians()
│   │   │   ├── convergence.ts           analyseConvergence() — bootstrap resampling to
│   │   │   │                             determine minimum comparisons for stable weights
│   │   │   ├── matrix-completion.ts     completeMatrix() — Floyd-Warshall in log-space
│   │   │   │                             to infer missing pairs via transitivity
│   │   │   └── index.ts
│   │   └── __tests__/                    alignment, convergence, matrix-completion, pairwise
│   │
│   ├── opg/          📋  Optimal Policy Generator
│   │   ├── src/
│   │   │   ├── welfare.ts               Two-metric welfare function:
│   │   │   │                             W = α·IncomeGrowth + (1-α)·HealthyLifeYears
│   │   │   ├── jurisdiction.ts          Jurisdiction schema (country/state/county/city),
│   │   │   │                             US state codes
│   │   │   ├── policy.ts               Policy types (law, regulation, tax, etc.),
│   │   │   │                             PolicyRecommendation (enact/replace/repeal/maintain),
│   │   │   │                             blocking factors, evidence grades
│   │   │   ├── bradford-hill.ts         9 scoring functions: strength, consistency,
│   │   │   │                             temporality, gradient, experiment, plausibility,
│   │   │   │                             coherence, specificity, analogy.
│   │   │   │                             Causal Confidence Score (CCS), method weights
│   │   │   │                             (RCT=1.0 → cross-sectional=0.25)
│   │   │   ├── budget.ts               Spending types, OSL estimates, spending gaps,
│   │   │   │                             reference spending for cross-country comparison
│   │   │   └── index.ts
│   │   └── __tests__/                    7 test suites incl. integration
│   │
│   ├── obg/          💰  Optimal Budget Generator
│   │   ├── src/
│   │   │   ├── diminishing-returns.ts   fitLogModel(), fitSaturationModel() (Michaelis-Menten),
│   │   │   │                             marginalReturn(), findOSL(), estimateOSL() w/ bootstrap CI
│   │   │   ├── cost-effectiveness.ts    Intervention cost-per-QALY filtering,
│   │   │   │                             calculateOSLFromCEA(), ROI calculation,
│   │   │   │                             VSL/QALY value conversions
│   │   │   ├── budget-impact-score.ts   BIS = quality × precision × recency weights,
│   │   │   │                             scoreToGrade(), calculatePriorityScore()
│   │   │   ├── budget.ts               Spending categories, OSL estimates, spending gaps
│   │   │   ├── welfare.ts              Two-metric welfare function (shared with OPG)
│   │   │   └── index.ts
│   │   └── __tests__/                    6 test suites
│   │
│   ├── data/         📊  Data fetchers & loaders
│   │   ├── src/
│   │   │   ├── types.ts                 DataPoint, SpendingData, HealthData, EconomicData,
│   │   │   │                             PolicyData, FetchOptions (Zod schemas)
│   │   │   ├── sources/
│   │   │   │   ├── oecd.ts              OECD.Stat API — COFOG spending by function,
│   │   │   │   │                         health expenditure (38 member countries)
│   │   │   │   └── world-bank.ts        World Bank WDI — GDP, life expectancy, mortality,
│   │   │   │                             education, Gini, unemployment (200+ countries)
│   │   │   ├── csv-loader.ts            Gapminder-format CSV parser, local submodule loader,
│   │   │   │                             GitHub raw fetch (deprecated)
│   │   │   └── catalog.ts              60+ dataset entries from mikepsinn/economic-data
│   │   │                                (health, income, energy, political, population,
│   │   │                                 spending, culture)
│   │   └── economic-data/               Git submodule → mikepsinn/economic-data
│   │
│   └── db/           🗄️  Prisma database schema (stub)
│       └── src/index.ts                 Re-exports PrismaClient
│
├── tsconfig.base.json                   Strict TS: noUncheckedIndexedAccess, noImplicitOverride
├── eslint.config.js                     typescript-eslint strict rules
├── package.json                         pnpm workspaces, lint-staged + husky
└── CLAUDE.md                            Agent instructions & methodology references
```

### Package Dependency Graph

```
                    ┌───────────┐
                    │  causal   │  ← Foundation (ZERO dependencies)
                    └─────┬─────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           │
        ┌─────────┐ ┌─────────┐      │
        │   opg   │ │wishocracy│     │  (wishocracy is standalone — no deps)
        └────┬────┘ └──────────┘     │
             │                        │
             ▼                        │
        ┌─────────┐                   │
        │   obg   │ ← depends on causal + opg
        └─────────┘                   │
                                      │
        ┌─────────┐                   │
        │  data   │  ← standalone (fetch + parse)
        └─────────┘                   │
                                      │
        ┌─────────┐                   │
        │   db    │  ← standalone (Prisma, web-layer only)
        └─────────┘

   HARD RULES:
   • causal depends on NOTHING
   • wishocracy has ZERO database imports (pure functions)
   • Library packages never import db
   • No circular dependencies
```

### Key Design Principle: Domain Agnosticism

`@optomitron/causal` is **completely domain-agnostic**. It takes any two time series and answers: *Does changing X cause Y to change? By how much? What's the optimal value of X?*

| Domain | Predictor (X) | Outcome (Y) | Question |
|--------|--------------|-------------|----------|
| **Health (dFDA)** | Drug/Supplement | Symptom/Biomarker | "Does magnesium improve sleep?" |
| **Policy (OPG)** | Policy change | Welfare metric | "Does tobacco tax reduce smoking?" |
| **Budget (OBG)** | Spending level | Welfare metric | "What's the optimal education budget?" |
| **Governance** | Alignment score | Welfare metric | "Do responsive politicians produce better outcomes?" |
| **Business** | Ad spend | Revenue | "What's the optimal marketing budget?" |
| **Manufacturing** | Temperature | Defect rate | "What setting minimizes defects?" |

All use the same pipeline: **Temporal alignment → Bradford Hill criteria → Predictor Impact Score → Optimal value**

The library doesn't know what it's optimizing. Domain-specific packages (`opg`, `obg`, `wishocracy`) add context on top.

---

## The Five-Layer Architecture

### Layer 1 — LOCAL (Digital Twin Safe)

**Purpose:** All personal health data stays on the user's device. The causal engine runs locally. No server ever sees raw personal data.

**Runtime:** Electron app, Chrome extension, or progressive web app running on the user's device.

**Data sources:**
- Apple Health, Google Fit, Fitbit, Garmin, Oura Ring (via platform APIs/exports)
- Manual symptom/mood/diet entry
- Medical records (C-CDA, FHIR) parsed by a local LLM or user's own API keys
- Wearable CSV/JSON exports

**Local storage:** SQLite (Electron) or IndexedDB (browser) — data never leaves the device.

**What runs locally:**
- `@optomitron/causal` — the entire pipeline is pure TypeScript, zero server dependency
  - Temporal alignment of predictor/outcome time series
  - Bradford Hill criteria scoring via saturation functions
  - Predictor Impact Score (PIS) calculation
  - Effect size estimation with confidence intervals
  - Optimal value analysis (what dosage/level produces best outcomes)
- `@optomitron/wishocracy` — pairwise preference surveys, eigenvector preference weights

**What it generates (personal, stays local by default):**
- Personal optimal values for every tracked predictor
- Treatment/intervention rankings by effect size
- Evidence grades (A–F) and recommendations
- Preference weights from RAPPA pairwise comparisons

**Privacy model:** The device generates *statistical summaries* (anonymized effect sizes, evidence grades, confidence intervals) that can optionally be shared. Raw measurements, timestamps, and any identifying data remain local.

### Layer 2 — IDENTITY (Decentralized Proof of Personhood)

**Purpose:** Enable anonymous but deduplicated contributions. One person = one vote/submission. No identity leakage.

**Problem solved:** Without deduplication, bad actors can submit thousands of fake data points to skew population-level results. Without anonymity, health data becomes a surveillance risk.

**Providers (plug-in model — user chooses):**

| Provider | Method | Sybil Resistance | Privacy |
|----------|--------|-------------------|---------|
| **Holonym** | ZK identity proofs | High (gov ID + ZK) | Strong (zero-knowledge) |
| **Gitcoin Passport** | Stamp-based scoring | Medium (composable) | Medium (pseudonymous) |
| **World ID / Worldcoin** | Iris biometric hash | Very high | Medium (biometric) |
| **human.tech** | Social graph proofs | Medium-high | Strong |

**How it works:**
1. User completes proof-of-personhood on their device
2. Device receives a cryptographic credential (e.g., ZK proof of unique human)
3. Credential is attached to anonymized submissions — proves "one unique human" without revealing who
4. Credential cannot be linked back to real identity, health data, or device

**Key properties:**
- **Uniqueness:** Each human can only submit once per time period
- **Unlinkability:** Submissions cannot be linked to each other or to the user's real identity
- **Revocability:** User can rotate credentials without losing contribution history
- **Composability:** Multiple proof methods can be combined for higher confidence

### Layer 3 — ANONYMOUS ON-CHAIN SUBMISSION

**Purpose:** Create a permanent, tamper-proof, publicly auditable record of causal findings and preference weights — owned by no single entity.

**What gets submitted (NOT raw data):**
- Treatment → outcome effect sizes (percent change, absolute change, z-score)
- Evidence grades (A–F) and confidence intervals
- Predictor Impact Score (PIS) for each treatment-outcome pair
- Optimal predictor values with confidence intervals
- RAPPA preference weights (how the person allocated $100 across categories)
- Proof-of-personhood credential (proves unique human, NOT identity)

**What does NOT get submitted:**
- Raw health measurements or timestamps
- Device identifiers or IP addresses
- Real names, locations, or demographics
- Any data that could re-identify the individual

**On-chain storage model:**
- Submissions are structured as typed records (treatment ID, outcome ID, effect size, CI, grade)
- Each submission is linked to a proof-of-personhood token, NOT a real identity
- Data lives on a public chain (or L2/rollup) — anyone can read, aggregate, and verify
- Optomitron (Layer 4) is one consumer of this data, not the owner

**Why on-chain, not a database:**
- **Censorship resistance:** No single entity can delete or alter submitted findings
- **Auditability:** Anyone can verify the aggregation math
- **Ownership:** Data belongs to the public commons, not to Optomitron Inc.
- **Incentive compatibility:** Token rewards (Layer 5) need on-chain provenance

### Layer 4 — AGGREGATION SERVER (Optomitron)

**Purpose:** Read anonymous on-chain submissions and compute population-level insights. This is the "server" layer — but it's a reader/aggregator, not a data owner.

**What it computes:**

| Function | Algorithm | Package |
|----------|-----------|---------|
| **Meta-analysis** | Weighted average of PIS scores across submissions, adjusting for sample size and evidence quality | `@optomitron/causal` |
| **Population treatment rankings** | Aggregate effect sizes + confidence intervals across all anonymous submitters | `@optomitron/causal` |
| **Citizen preference weights** | Eigenvector aggregation of RAPPA submissions, with convergence analysis and matrix completion for sparse pairs | `@optomitron/wishocracy` |
| **Policy recommendations** | OPG: enact/replace/repeal/maintain based on cross-jurisdiction quasi-experimental evidence + Bradford Hill CCS scoring | `@optomitron/opg` |
| **Budget optimization** | OBG: diminishing returns modeling + cost-effectiveness threshold analysis → Optimal Spending Levels per category | `@optomitron/obg` |
| **Politician alignment scores** | Citizen Alignment Score = weighted distance between citizen preference vector and politician voting record | `@optomitron/wishocracy` |
| **Preference gap analysis** | Difference between aggregated citizen preferences and actual budget allocation | `@optomitron/wishocracy` |

**Multi-tenancy (Government OS):**
Any jurisdiction (city, county, state, country) can deploy Optomitron as its governance operating system. The database is multi-tenant — every jurisdiction is a tenant with its own items, participants, officials, and data. Cross-jurisdiction comparison ("City A spends X on education and gets Y outcomes vs. City B") is a core feature.

**Stack:**
- Next.js web dashboard (Phase 3)
- Prisma + PostgreSQL for aggregated data and survey metadata
- `@optomitron/data` fetches public data from OECD, World Bank, FRED, WHO, Congress API
- `@optomitron/data` includes 60+ Gapminder-format CSV datasets via `mikepsinn/economic-data` git submodule

### Layer 5 — INCENTIVES

**Purpose:** Solve the collective action problem. Make contributing data, funding research, and electing aligned politicians individually rational.

**Three mechanisms:**

#### 5a. Data Contribution Tokens
- Users who submit anonymized causal results to the chain earn governance/utility tokens
- Token weight proportional to data quality (evidence grade, number of tracked variables, tracking duration)
- Tokens grant governance rights over protocol parameters (what data sources are accepted, how aggregation works)

#### 5b. Incentive Alignment Bonds (IABs)
- Citizens donate to a transparent crypto treasury
- Smart contracts automatically distribute campaign funds based on Citizen Alignment Scores
- Flow: Citizens donate → Treasury holds funds → Alignment scores update on-chain → Smart contracts release funds to high-alignment campaigns → AI agents run ads/social media for aligned candidates
- No middleman, no PAC, no party — pure score-based allocation
- See [IAB paper](https://iab.warondisease.org) for full mechanism design

#### 5c. Smart Contract Campaign Funding
- Alignment scores published on-chain trigger automatic fund distribution
- Politicians who vote in line with citizen preferences receive more campaign support
- Creates a feedback loop: represent citizens → get funded → win → represent citizens
- The 90:1 capital asymmetry (household wealth vs. concentrated lobbying interests) means diffuse beneficiaries can outspend incumbents once coordination is solved
- IABs solve the coordination problem by turning political change into an investable asset class

---

## Data Flow

### Personal Health Analysis (Layer 1, local only)

```
User's Device
│
├─ Import: Apple Health JSON / Fitbit API / Garmin CSV / manual entry
│
├─ Store locally: SQLite or IndexedDB
│     (measurements table: timestamp, variable_id, value, unit, source)
│
├─ For each (predictor, outcome) pair:
│   │
│   ├─ temporalAlignment.alignTimeSeries(predictor, outcome, config)
│   │   ├─ config: { onsetDelaySeconds, durationOfActionSeconds, fillingType }
│   │   ├─ Outcome-based pairing (if filling=zero): one pair per outcome measurement
│   │   └─ Predictor-based pairing (if filling=none): one pair per predictor measurement
│   │
│   ├─ validateDataQuality(pairs)
│   │   ├─ ≥5 predictor changes, ≥5 outcome changes
│   │   ├─ ≥30 aligned pairs
│   │   └─ ≥10% baseline fraction, ≥10% follow-up fraction
│   │
│   └─ calculatePredictorImpactScore(forwardPairs, reversePairs?, options?)
│       ├─ Pearson + Spearman correlation
│       ├─ Effect size: baseline vs follow-up (percent change, z-score)
│       ├─ Bradford Hill: strength, consistency, temporality, gradient,
│       │   experiment, plausibility, coherence, analogy, specificity
│       ├─ PIS = |r| × (1 - pValue) × φ_z × temporalityFactor × φ_users × φ_pairs
│       ├─ Evidence grade: A (≥0.5) / B (≥0.3) / C (≥0.1) / D (≥0.05) / F
│       └─ Optimal value: predictor level associated with best outcomes ± CI
│
└─ Output (stays local):
    ├─ Personal treatment rankings by PIS
    ├─ Optimal dosage/value for each predictor
    └─ Effect size + direction + confidence for each predictor→outcome
```

### Anonymous Submission Flow (Layers 1 → 2 → 3)

```
User's Device                    Identity Provider               Chain
│                                │                               │
├─ Generate summary:             │                               │
│  { treatmentId, outcomeId,     │                               │
│    effectSize, CI, PIS,        │                               │
│    evidenceGrade,              │                               │
│    preferenceWeights[] }       │                               │
│                                │                               │
├─ Request proof ────────────────►                               │
│                                ├─ Verify uniqueness            │
│                                │  (ZK proof / biometric hash)  │
│  ◄─── credential ─────────────┤                               │
│                                                                │
├─ Attach credential to summary                                  │
│                                                                │
├─ Submit to chain ──────────────────────────────────────────────►
│                                                                │
│                                                  ┌─────────────┤
│                                                  │ Immutable   │
│                                                  │ auditable   │
│                                                  │ record      │
│                                                  └─────────────┘
```

### Aggregation Flow (Layers 3 → 4)

```
Chain                        Aggregation Server (Layer 4)
│                            │
│  read submissions ─────────►
│                            │
│                            ├─ Meta-analysis:
│                            │   weighted avg of PIS scores,
│                            │   population-level effect sizes + CIs
│                            │
│                            ├─ RAPPA aggregation:
│                            │   geometric mean → comparison matrix →
│                            │   eigenvector → citizen preference weights
│                            │
│                            ├─ Cross-jurisdiction analysis:
│                            │   @optomitron/data (OECD + World Bank) +
│                            │   causal engine → policy impact scores
│                            │
│                            ├─ OPG: enact/replace/repeal/maintain
│                            │   with CCS confidence grades
│                            │
│                            ├─ OBG: OSL per spending category
│                            │   (diminishing returns + CEA)
│                            │   gap analysis: current vs optimal
│                            │
│                            ├─ Alignment scores:
│                            │   citizen prefs vs politician votes
│                            │
│                            └─ Output → Next.js dashboard
│                                 ├─ Treatment rankings
│                                 ├─ Policy recommendations
│                                 ├─ Budget gap analysis
│                                 └─ Politician scorecards
```

---

## Core Algorithms

### Predictor Impact Score (PIS) — `@optomitron/causal`

The PIS operationalizes Bradford Hill causality criteria into a single composite metric for automated signal detection from time series data.

**Formula:**

```
PIS_user = |r| × S × φ_z × φ_temporal

where:
  r           = Pearson correlation (forward direction)
  S           = 1 - p_value (significance)
  φ_z         = |z| / (|z| + z_ref)           z_ref = 2
  φ_temporal  = |r_fwd| / (|r_fwd| + |r_rev|)

PIS_aggregate = PIS_user × φ_users × φ_pairs

where:
  φ_users  = 1 - e^(-N_subjects / 10)     (consistency saturation)
  φ_pairs  = 1 - e^(-N_pairs / 100)       (sample size saturation)
```

**Evidence grades:** A (≥0.5) · B (≥0.3) · C (≥0.1) · D (≥0.05) · F (<0.05)

### RAPPA — `@optomitron/wishocracy`

Randomized Aggregated Pairwise Preference Allocation.

1. Citizens answer: "Given $100, how would you split between A and B?" (~20 comparisons per participant for convergence)
2. Compute allocation ratios; aggregate via geometric mean (standard AHP)
3. Build n×n comparison matrix (reciprocal: `M[i][j] = 1/M[j][i]`)
4. Complete sparse matrix via Floyd-Warshall in log-space (transitivity)
5. Extract principal eigenvector via power iteration → normalized preference weights
6. Verify consistency ratio (CR < 0.1 = acceptably consistent)
7. Bootstrap convergence analysis to confirm stability

**Citizen Alignment Score:**

```
Score = 100 - Σ(w_i × |citizenPref_i - politicianVote_i|) / Σ(w_i)

where w_i = citizen preference weight for item i
```

### Causal Confidence Score (CCS) — `@optomitron/opg`

Bradford Hill criteria for policy evaluation:

```
CCS = Σ(weight_k × score_k) / Σ(weight_k)    [if temporality = 1]
CCS = 0                                        [if temporality = 0]

Weights: experiment=0.225, consistency=0.19, strength=0.15,
         gradient=0.125, coherence=0.10, plausibility=0.09,
         specificity=0.06, analogy=0.06
```

Method quality weights: RCT (1.0) → regression discontinuity (0.90) → synthetic control (0.85) → DiD (0.80) → event study (0.75) → ITS (0.65) → before-after (0.40) → cross-sectional (0.25)

### Optimal Spending Level (OSL) — `@optomitron/obg`

Two estimation methods, take the one with better fit:

**Log-linear:** `Outcome = α + β × log(Spending)` → OSL = β / opportunity_cost

**Saturation (Michaelis-Menten):** `Outcome = α + β × S/(S+γ)` → OSL via quadratic formula

**Budget Impact Score:** BIS = Σ(quality_weight × precision_weight × recency_weight) / K

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Language** | TypeScript (strict mode) | Type safety, runs everywhere (browser + Node + Electron) |
| **Validation** | Zod | Runtime schema validation, TypeScript type inference |
| **Monorepo** | pnpm workspaces | Fast, efficient, workspace protocol |
| **Testing** | Vitest | Fast, ESM-native, compatible with TypeScript |
| **Linting** | typescript-eslint (strict) | Catches errors before runtime |
| **Build** | tsc (plain TypeScript) | No bundler needed for libraries |
| **Database** | Prisma + PostgreSQL (Layer 4) | Multi-tenant, type-safe ORM |
| **Local storage** | SQLite / IndexedDB (Layer 1) | No server, no network required |
| **Web framework** | Next.js (Phase 3) | SSR dashboard, API routes, multi-tenant |
| **Identity** | Holonym / Gitcoin Passport / World ID | ZK proofs, sybil resistance |
| **Chain** | TBD (L2 rollup likely) | Low cost, high throughput for data submissions |
| **Smart contracts** | Solidity (Phase 4) | IAB treasury, token, fund distribution |
| **Data sources** | OECD API, World Bank WDI, FRED, economic-data submodule | 60+ CSV datasets, REST APIs |

---

## Phase Roadmap

### Phase 1 — Core Libraries *(current)*

**Status:** 🟡 Alpha — packages exist with tests, APIs stabilizing.

- [x] `@optomitron/causal` — temporal alignment, Bradford Hill, PIS, effect size, optimal values
- [x] `@optomitron/wishocracy` — pairwise aggregation, eigenvector weights, alignment scores, convergence analysis, matrix completion
- [x] `@optomitron/opg` — welfare function, jurisdiction model, policy types, Bradford Hill CCS, method weights
- [x] `@optomitron/obg` — diminishing returns, cost-effectiveness, BIS, spending gap analysis
- [x] `@optomitron/data` — OECD + World Bank fetchers, Gapminder CSV loader, 60+ dataset catalog
- [ ] End-to-end integration tests (feed real data through full pipeline)
- [ ] API stabilization and documentation

**Exit criteria:** `pnpm check` passes. Real-world data produces plausible PIS scores and policy recommendations.

### Phase 2 — Local App (Layer 1)

**Status:** ⚪ Planned

- [ ] Electron app or Chrome extension scaffold
- [ ] Health data importers (Apple Health JSON, Fitbit API, Garmin, Oura, manual entry)
- [ ] Local SQLite/IndexedDB storage layer
- [ ] Medical record parser (local LLM or user API keys for C-CDA/FHIR)
- [ ] UI: personal dashboard showing treatment rankings, optimal values, effect sizes
- [ ] RAPPA survey interface (pairwise comparison slider)
- [ ] Export anonymized summary for submission

**Exit criteria:** A user can import their health data, see personal treatment rankings generated entirely on-device, and complete RAPPA surveys.

### Phase 3 — Aggregation Server (Layer 4)

**Status:** ⚪ Planned

- [ ] Next.js multi-tenant web dashboard
- [ ] Prisma schema with `jurisdictionId` on all relevant models
- [ ] RAPPA survey collection and real-time aggregation
- [ ] Voting record data pipeline (Congress API, OpenStates)
- [ ] Politician alignment scores published on dashboard
- [ ] OPG policy recommendation pages per jurisdiction
- [ ] OBG budget gap analysis per jurisdiction
- [ ] Cross-jurisdiction comparison ("City A vs City B")
- [ ] Public API for treatment rankings, alignment scores, recommendations

**Exit criteria:** A jurisdiction can see its preference gaps, policy recommendations, and politician scorecards on a public dashboard.

### Phase 4 — Identity & On-Chain (Layers 2 + 3)

**Status:** ⚪ Planned — requires Phase 2 + 3 working first

- [ ] Proof-of-personhood integration (Holonym SDK or Gitcoin Passport)
- [ ] Anonymized submission protocol (device → chain)
- [ ] On-chain data schema for effect sizes, preference weights, evidence grades
- [ ] Chain reader in aggregation server (replace direct DB ingestion)
- [ ] Data contribution token smart contract
- [ ] Submission deduplication via proof-of-personhood

**Exit criteria:** Anonymized causal results from local devices appear on-chain and are consumed by the aggregation server, with sybil-resistant deduplication.

### Phase 5 — Incentive Layer (Layer 5)

**Status:** ⚪ Planned — requires Phase 4 complete

- [ ] IAB Treasury smart contract (accepts donations, holds funds)
- [ ] Alignment-score-based automatic fund distribution
- [ ] Governance token with contribution-weighted voting
- [ ] AI agent framework for ad/social media campaigns for aligned candidates
- [ ] Prediction market integration for policy outcome verification
- [ ] Retroactive funding for validated health data contributions

**Exit criteria:** Citizens can donate to a treasury that automatically funds politicians whose votes align with aggregated citizen preferences, with full on-chain transparency.

---

## Papers & References

The algorithms in this codebase are defined in the following papers. **Read the QMD source files** for exact formulas, worked examples, SQL schemas, and parameter justifications.

| Paper | Implements | Local QMD | Web |
|-------|-----------|-----------|-----|
| **dFDA Specification** | `@optomitron/causal` — PIS, temporal alignment, Bradford Hill, effect size | `knowledge/appendix/dfda-spec-paper.qmd` | [dfda-spec.warondisease.org](https://dfda-spec.warondisease.org) |
| **Wishocracy** | `@optomitron/wishocracy` — RAPPA, eigenvector, alignment scores, convergence | `knowledge/appendix/wishocracy-paper.qmd` | [wishocracy.warondisease.org](https://wishocracy.warondisease.org) |
| **Optimal Policy Generator** | `@optomitron/opg` — Policy Impact Score, CCS, method weights, welfare function | `knowledge/appendix/optimal-policy-generator-spec.qmd` | [opg.warondisease.org](https://opg.warondisease.org) |
| **Optimal Budget Generator** | `@optomitron/obg` — Diminishing returns, OSL, BIS, cost-effectiveness | `knowledge/appendix/optimal-budget-generator-spec.qmd` | [obg.warondisease.org](https://obg.warondisease.org) |
| **Incentive Alignment Bonds** | `@optomitron/treasury` (Phase 5) — IAB mechanism, campaign funding | `knowledge/appendix/incentive-alignment-bonds-paper.qmd` | [iab.warondisease.org](https://iab.warondisease.org) |
| **Optimocracy** | Two-metric welfare function (shared by OPG + OBG) | `knowledge/appendix/optimocracy-paper.qmd` | [optimocracy.warondisease.org](https://optimocracy.warondisease.org) |

---

*Last updated: 2026-02-06*
