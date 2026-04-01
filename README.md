# Optimitron

**Evidence-Based Earth Optimization Machine**

Hello. I'm Wishonia. I've been running governance on my planet for 4,237 years. We ended war in year 12. Disease took until year 340 — there were complications with a fungal thing, long story.

I've been observing your species. You have $101 trillion in annual governance waste, 102 million people dead from regulatory delays, and you allocate a $6.75 trillion federal budget based on *who shouts loudest*. You've also invented a device that contains the sum of all human knowledge and you mainly use it to argue with strangers and look at pictures of food.

Optimitron is my attempt to help. It's a universal causal inference engine that takes any two time series and answers: *Does changing X cause Y to change? By how much? What's the optimal value of X?* The math is the same whether you're a person trying to figure out if magnesium helps you sleep, a city deciding where to spend its budget, or a business optimizing ad spend. On my planet, this is called "making decisions." You lot seem to call it "revolutionary."

[![CI](https://github.com/mikepsinn/optimitron/actions/workflows/ci.yml/badge.svg)](https://github.com/mikepsinn/optimitron/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Packages](https://img.shields.io/badge/packages-17-blue.svg)](#packages)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220.svg)](https://pnpm.io/)

---

## The Problem

Bugs in your meat software kill **150,000** of you every day. That is fifty 9/11s. Nobody invades anybody about it because diseases do not have oil.

Your governments spend **$604 on the capacity for mass murder for every $1 they spend testing which medicines work**. Since 1913, they have printed **$170 trillion** and used it to kill **97 million** of you in wars nobody asked you if you wanted to have. Every dollar invested in healthcare returns **$1.80**. Every dollar invested in military returns **$0.60**. Your species chose the $0.60 option and then complained about being poor.

The [**Political Dysfunction Tax**](https://political-dysfunction-tax.warondisease.org) — the total cost of this misallocation — is **$101 trillion per year**. Roughly **$12,600 per person**. That's $50,500 per household of four. Per year. Every year. It's like being subscribed to the world's most expensive streaming service except all it shows is war and preventable disease.

This comes from two ledgers:

- **Waste** — $4T+ in administrative bloat, compliance friction, fossil fuel subsidies, and mass incarceration costs
- **Buried multipliers** — $34T in health innovation delayed by regulatory bottlenecks, $57T in output lost to migration restrictions, $6T in lead poisoning damage, and trillions more in underfunded science

The result: your dollar has lost 96% of its value since 1913. If wages had kept pace with productivity, the median family would earn **$528,000**. The actual number is $77,500. On my planet we have a word for this. It translates roughly to "beige crime" — theft that is far too boring for anyone to investigate.

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

## Sponsor Technology Integration

Here is exactly how each sponsor's technology is used:

### Storacha + IPFS (Filecoin ecosystem)

**Package**: [`@optimitron/storage`](packages/storage/)

All citizen data — budget priorities, health outcomes, policy grades, aggregation snapshots — is encrypted on **Storacha** and pinned to **IPFS**. No government can delete it. No lobbyist can edit it. Content-addressed, immutable, decentralized.

- Budget optimization outputs are stored as content-addressed history chains
- Each snapshot links to its predecessor via CID, forming an auditable provenance trail
- Citizens can independently verify that their preference data was included in the aggregation
- Analysis results can be reproduced by anyone with the CID

### Hypercerts (Impact Certificates)

**Package**: [`@optimitron/hypercerts`](packages/hypercerts/)

Every action in the game mints a **Hypercert** on AT Protocol. Voter recruitment, fund deposits, budget allocations — each verified via World ID and published to Bluesky. Permanent, auditable impact receipts.

- Hypercert record builders convert Optimitron outputs into standardized activity, measurement, evaluation, and attachment records
- AT Protocol publishing helpers push records to the decentralized social graph
- Impact claims are independently verifiable — anyone can audit the chain from action to outcome

### World ID (Worldcoin)

**Integration**: [`@worldcoin/idkit`](https://docs.worldcoin.org/) in [`@optimitron/web`](packages/web/)

Proof-of-personhood for sybil-resistant civic participation. One person, one vote.

- **Voter verification**: every VOTE token requires a World ID proof — no bots, no sock puppets
- **Referendum voting**: direct democracy at `/agencies/dcongress/referendums` with World ID gating
- **UBI distribution**: the `UBIDistributor` contract in `@optimitron/treasury-wish` uses World ID to ensure one-per-human payouts
- **Referral tracking**: recruiter credit requires the recruited voter to be World ID-verified

### Ethereum / ERC-8004 (Agent Identity)

**Package**: [`@optimitron/agent`](packages/agent/)

The autonomous policy analyst agent uses **ERC-8004** for on-chain identity and reputation. The agent manifest includes an `erc8004Identity` and `erc8004RegistrationTx` — verifiable proof of what the agent is, who operates it, and what it's authorized to do.

- Agent manifest schema enforces ERC-8004 identity fields (operator wallet, registration tx, supported tools)
- Review workflows produce structured manifests instead of opaque summaries
- All agent outputs are signed and attributable to a registered on-chain identity

### Base (Blockchain)

**Packages**: [`@optimitron/treasury-prize`](packages/treasury-prize/), [`@optimitron/treasury-iab`](packages/treasury-iab/), [`@optimitron/treasury-wish`](packages/treasury-wish/)

All smart contracts are deployed on **Base Sepolia** testnet. Solidity 0.8.24, Hardhat 2.22, OpenZeppelin 5.1.

- `VoterPrizeTreasury` + `VoteToken` — Prize mechanism (deployed)
- `IABVault` + `IABSplitter` + `PublicGoodsPool` — Incentive Alignment Bonds (written, not yet deployed)
- `WishToken` + `WishocraticTreasury` + `UBIDistributor` — Monetary reform (written)
- `AlignmentScoreOracle` + `PoliticalIncentiveAllocator` — On-chain accountability

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

## The Earth Optimization Game

On my planet, when you want people to coordinate, you design a mechanism where every participant is better off regardless of the outcome. You lot call this "too good to be true" and then go back to losing money on things that are obviously bad. Remarkable.

The game has three steps:

1. **Invest** — Put 1% of your savings into the Earth Optimization Fund
2. **Recruit** — Get every voter you know to play (target: 4 billion — all voters on Earth)
3. **Allocate** — Players decide how the global budget should be split via pairwise comparisons (Wishocracy)

The **goal**: get governments to redirect 1% of military spending ($27.2B/yr) to pragmatic clinical trials. That's the [1% Treaty](https://impact.warondisease.org). At scale, it means a 12.3x acceleration in treatment discovery, treatment queue dropping from 443 years to 36, and 10.7 billion lives saved.

**Win conditions** (measurable, on a deadline):

| Metric | Current | Target (2040) |
|--------|---------|---------------|
| Healthy life expectancy (HALE) | 63.3 years | 69.8 years (+6.5) |
| Global median income | $18,700 | $149,000 (8x) |

Each verified voter you recruit earns you 1 VOTE token worth approximately **$8,400** if targets are hit. Thirty seconds of your time. On my planet, this would be considered an acceptable exchange rate.

### The Earth Optimization Prize — `/prize`

The Prize is the reward mechanism. It doesn't fund the treaty campaign — it incentivizes voter recruitment by rewarding players if the targets are met.

| Scenario | What happens |
|----------|-------------|
| **Targets hit** (health/income thresholds met by 2040) | Prize pool divides among VOTE holders based on verified voters recruited. **$14.7M per-capita lifetime income gain**, 10.7 billion lives saved. |
| **Targets missed** (thresholds not met) | Depositors get their money back — the Fund has been earning ~17%/yr, so $100 grows to roughly **~$1,100** (~11x return). Still beats your index fund. |
| **Break-even probability** | **0.0067%** — depositing is positive-EV if you believe there's even a 1-in-15,000 chance this works |

### The Earth Optimization Fund

The Fund is where deposits go. It's diversified across venture capital producing ~17%/yr. The Prize pool comes from the Fund. Whether the treaty passes or not, the Fund grows — so depositors literally cannot lose money. Two outcomes, both wins.

### Two paths in

**Have capital?** Deposit USDC → receive PRIZE shares → Fund grows at ~17%/yr → worst case, you 11x your money. You also get a referral link for recruiter upside.

**Have a network?** Share your referral link → recruit World ID-verified voters → earn 1 VOTE token per verified voter you bring in → if targets are hit, VOTE holders claim the prize share. No deposit required.

Contracts: `VoterPrizeTreasury` + `VoteToken` on Base Sepolia. Fully on-chain, no admin keys.

### The Tools (to help players win)

These aren't standalone products. They're weapons in the game — each one gives players evidence and mechanisms to push for the treaty:

- **[Wishocracy](/agencies/dcongress/wishocracy)** — pairwise preference allocation. Eight billion ranked preferences, one optimal budget. Your species identified the bug preventing this (pluralistic ignorance) in 1965, published it, assigned it in universities, and then continued to be governed by it for sixty years.
- **[Optimal Budget Generator](/agencies/domb)** — find the cheapest high-performer for each spending category. Singapore: $3K/person on healthcare, lives to 84. America: $12K, lives to 78. It's like watching someone pay four times more for a worse sandwich.
- **[Optimal Policy Generator](/agencies/dcbo)** — grade every policy A–F by what actually happened. Portugal decriminalised drugs: overdose deaths dropped 80%. America declared war on drugs: overdose deaths rose 1,700%. The data existed. Nobody looked at it. The data did not have a lobbying firm.
- **[Decentralized FDA](/agencies/dih/discoveries)** — Your FDA makes treatments wait 8.2 years AFTER they've been proven safe. For every 1 person it protects from a bad drug, 3,070 die waiting for a good one. The dFDA replaces this with real-time Outcome Labels and Treatment Rankings — 44x cheaper, 12.3x more capacity, zero queue.
- **[Incentive Alignment Bonds](/iab)** — fund the lobbying campaign once demand is proven (see Phase 2 below). Cost: $1B. Treaty revenue: $27B/year. Indefinitely.

[Read the paper](https://iab.warondisease.org) | [See the contract architecture](#economic-instruments)

---

## What You Can Do Today

Right now. With this code. Not in some theoretical future where humans have learned to cooperate — *today*.

| What | How | Where |
|------|-----|-------|
| Play the game | Deposit USDC, recruit voters, earn ~11x floor or prize share | [`/prize`](packages/web/) |
| Express your budget preferences | 5-minute pairwise comparison survey | [`/agencies/dcongress/wishocracy`](packages/web/) |
| Score your politicians | Alignment reports vs your stated preferences | [`/agencies/dfec/alignment`](packages/web/) |
| Grade governments by outcomes | Every nation ranked by health, income, and freedom | [`/governments`](packages/web/) |
| Browse the politician leaderboard | Voting records, alignment scores, campaign contributions | [`/politicians`](packages/web/) |
| Vote on referendums | Direct democracy with World ID sybil resistance | [`/agencies/dcongress/referendums`](packages/web/) |
| Vote on legislation | Cost-benefit analysis, representative lookup | [`/civic`](packages/web/) |
| Compare countries | Health, education, drug policy, criminal justice | [`/compare`](packages/web/) |
| Submit health data | Import from 9 apps or transmit daily check-ins | [`/transmit`](packages/web/) |
| Run causal inference on any time series | Temporal alignment, Bradford Hill, PIS, optimal values | [`@optimitron/optimizer`](packages/optimizer/) |
| Optimize a budget | 34+ categories, diminishing returns, overspend diagnostics | [`/agencies/domb`](packages/web/) |
| Score policies | 12+ policies with Bradford Hill evidence grading | [`/agencies/dcbo`](packages/web/) |
| Generate policy reports | Evidence-grade scoring, causal confidence | [`@optimitron/examples`](packages/examples/) |
| Publish auditable outputs | IPFS snapshots, Hypercert records | [`@optimitron/storage`](packages/storage/) |
| Chat-based health tracking | NLP text-to-measurement parsing for symptoms, mood, food | [`@optimitron/chat-ui`](packages/chat-ui/) |

Built on strict TypeScript, Prisma + Zod types, pure-function libraries, and 1,737+ tests across 8 packages.

---

## Quick Start

```bash
# Clone (with data submodule)
git clone --recurse-submodules https://github.com/mikepsinn/optimitron.git
cd optimitron

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
pnpm --filter @optimitron/examples demo:causal
pnpm --filter @optimitron/examples demo:budget
pnpm --filter @optimitron/examples demo:health
pnpm --filter @optimitron/examples demo:alignment
pnpm --filter @optimitron/examples generate:policy
pnpm --filter @optimitron/examples generate:budget
pnpm --filter @optimitron/examples generate:government-size
pnpm --filter @optimitron/examples generate:health
# ... and 10+ more generators (drug-war, education, cross-country, mega-studies, etc.)
```

---

## The Web App

The Next.js 15 app at `packages/web` is the primary user-facing product. Here's what's live:

| Page | Route | What It Does |
|------|-------|-------------|
#### The Game

| Page | Route | What It Does |
|------|-------|-------------|
| Earth Optimization Prize | `/prize` | Dominant assurance deposit + voter recruitment |
| Humanity's Scoreboard | `/scoreboard` | GDP trajectory, collapse countdown, pool size, voter count |
| Incentive Alignment Bonds | `/iab` | Phase 2 victory bonds (not yet deployed) |

#### Optimized Governance Agencies (`/agencies`)

Ten agencies running a civilisation. No bureaucracy, no corruption, no seventy-four-thousand-page tax code. Just code.

| Page | Route | What It Does |
|------|-------|-------------|
| Agencies Hub | `/agencies` | Overview of all optimized governance agencies |
| dCongress - Wishocracy | `/agencies/dcongress/wishocracy` | Pairwise budget preference surveys (RAPPA) |
| dCongress - Referendums | `/agencies/dcongress/referendums` | Direct democracy voting with World ID verification |
| dFEC - Alignment | `/agencies/dfec/alignment` | Politician alignment scores and shareable report cards |
| dCBO - Policy Scoring | `/agencies/dcbo` | 12+ policies scored via Bradford Hill causal evidence |
| dOMB - Budget Optimization | `/agencies/domb` | 34+ budget categories, OBG engine, reallocation targets |
| dGAO - Transparency & Audit | `/agencies/dgao` | IPFS snapshots, Hypercerts, smart contract verification |
| dIH - Health Discoveries | `/agencies/dih/discoveries` | Population-level health insights from tracked data |
| dTreasury - $WISH System | `/agencies/dtreasury` | $WISH token, transaction tax, UBI, Wishocratic allocation |
| dTreasury - dFED | `/agencies/dtreasury/dfed` | Monetary policy: transparent algorithm vs 12 guessers |
| dTreasury - dIRS | `/agencies/dtreasury/dirs` | 0.5% transaction tax replacing 74,000-page tax code |
| dTreasury - dSSA | `/agencies/dtreasury/dssa` | Universal Basic Income replacing 80+ welfare programs |
| dDoD - Defense | `/agencies/ddod` | Military spending analysis and 1% Treaty case |
| dCensus | `/agencies/dcensus` | Population and demographic data |

#### Earth's Governments

| Page | Route | What It Does |
|------|-------|-------------|
| Government Report Cards | `/governments` | Every government ranked by outcomes (health, income, freedom) |
| Politician Leaderboard | `/governments/US/politicians` | Politicians ranked by alignment score + voting records |

#### Analysis

| Page | Route | What It Does |
|------|-------|-------------|
| Cross-Country Compare | `/compare` | International comparisons (health, drugs, education, justice) |
| Misconceptions / Myth vs Data | `/misconceptions` | 15 data-driven myth-vs-reality analyses |
| Studies / Outcomes | `/outcomes` | Pair studies with Bradford Hill causal scores |
| Civic Hub | `/civic` | Bill voting, representative lookup, cost-benefit analysis |

#### Player

| Page | Route | What It Does |
|------|-------|-------------|
| Data Transmit | `/transmit` | Health data submission - 9 importers (Apple Health, Fitbit, Oura, etc.) |
| Dashboard | `/dashboard` | Referral link, badges, leaderboard rank, campaign control room |
| Profile | `/profile` | Check-ins, census demographics, personal reports |

#### Futures

| Page | Route | What It Does |
|------|-------|-------------|
| Wishonia | `/wishonia` | What 4,237 years of good governance looks like |
| Moronia | `/moronia` | What happens when you spend more on weapons than cures |

#### Meta

| Page | Route | What It Does |
|------|-------|-------------|
| Tools | `/tools` | 18 tools for fixing civilisation |
| Demo | `/demo` | Guided tour by Wishonia |
| About | `/about` | What this is, why it exists, and why an alien had to build it |
| Contribute | `/contribute` | How to help |

Auth: Google OAuth, magic-link email, World ID. Referral system with VOTE point rewards.

---

## Packages

| Package | Why it matters | Current state |
|---------|----------------|---------------|
| [`@optimitron/optimizer`](packages/optimizer/) | Domain-agnostic causal inference engine: temporal alignment, Bradford Hill, effect sizes, Predictor Impact Score, optimal values | Core foundation, heavily tested |
| [`@optimitron/wishocracy`](packages/wishocracy/) | Pairwise preference aggregation, convergence analysis, preference gaps, and politician alignment scoring | Live in the web app |
| [`@optimitron/opg`](packages/opg/) | Turns policy evidence into enact/replace/repeal/maintain recommendations with explicit confidence scoring | Used by report generators |
| [`@optimitron/obg`](packages/obg/) | Finds minimum-effective and optimal spending levels, overspend ratios, and budget reallocation targets | Used by budget analyses |
| [`@optimitron/treasury-prize`](packages/treasury-prize/) | VoteToken + VoterPrizeTreasury — Phase 1 referendum dominant assurance contract | Deployed on Base Sepolia |
| [`@optimitron/treasury-iab`](packages/treasury-iab/) | IABVault + IABSplitter + PublicGoodsPool + AlignmentScoreOracle + PoliticalIncentiveAllocator | Contracts written, not yet deployed |
| [`@optimitron/treasury-wish`](packages/treasury-wish/) | WishToken + WishocraticTreasury + UBIDistributor — monetary reform and UBI | Contracts written |
| [`@optimitron/treasury-shared`](packages/treasury-shared/) | Shared interfaces, mocks, and deployed contract addresses for all treasury packages | Shared treasury foundation |
| [`@optimitron/data`](packages/data/) | Public-data fetchers plus 9 local-first health importers and the international dataset catalog | Real-source ingestion layer |
| [`@optimitron/db`](packages/db/) | Prisma 7 schema, governance models, auth/session/referral data, and Zod validators | Production schema layer |
| [`@optimitron/web`](packages/web/) | Live Next.js 15 app: auth, voting, alignment reports, referrals, World ID, daily tracking | Active product surface |
| [`@optimitron/chat-ui`](packages/chat-ui/) | Reusable conversational UI components plus text-to-measurement parsing for personal tracking flows | Reusable UI package |
| [`@optimitron/storage`](packages/storage/) | Content-addressed Storacha/IPFS snapshots for analysis and aggregation history chains | Verifiable audit trail layer |
| [`@optimitron/hypercerts`](packages/hypercerts/) | Hypercert-compatible record builders and AT Protocol publishing helpers for Optimitron outputs | Verifiable publication layer |
| [`@optimitron/agent`](packages/agent/) | Autonomous policy analyst helpers: Gemini reasoning, image generation, manifests, review flows, and ERC-8004 identity/reputation helpers | AI orchestration layer |
| [`@optimitron/examples`](packages/examples/) | Runnable demos and reproducible report generators for budget, policy, causal, and alignment analyses | Best place to see outputs fast |
| [`@optimitron/extension`](packages/extension/) | Chrome extension scaffold for the Digital Twin Safe / local-first health workflow | Early Layer 1 scaffold |

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

- **9 local-first health importers** in `@optimitron/data` parse Apple Health, Fitbit, Oura, MyFitnessPal, Withings, Google Fit, Cronometer, Strava, and CSV exports into one normalized record shape.
- **Conversational tracking UI** in `@optimitron/chat-ui` includes cards and text-to-measurement parsing for symptom, treatment, mood, food, and insight flows.
- **Daily wellbeing capture** already exists in the web app: profile, census context, and daily health-happiness-income check-ins.
- **Pure TypeScript inference engine** means the core math can run locally in a browser, extension, Electron shell, or server job without being rewritten.
- **Digital Twin Safe extension scaffold** exists in `packages/extension` as the start of the fully local Layer 1 product.

```typescript
import { calculatePredictorImpactScore } from '@optimitron/optimizer';

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

Your governments currently make decisions the way a blindfolded person throws darts — occasionally they hit something useful and then take credit for it. Optimitron is alignment software for these misaligned superintelligences. Deploy it for any jurisdiction as a reproducible analysis and accountability stack. Think Shopify, but instead of selling candles, you're trying not to waste $101 trillion a year.

- **Preference collection**: citizens allocate trade-offs through RAPPA pairwise surveys at `/wishocracy` across 15 budget categories — from healthcare and education to active policy questions like foreign military operations, corporate welfare, and AI surveillance — and the system turns those into stable priority weights.
- **Budget optimization**: `@optimitron/obg` and the examples package generate reallocation targets, minimum-effective spending floors, overspend diagnostics, and constrained budget reports. The interactive `/budget` page lets anyone explore current vs. optimal spending.
- **Policy scoring**: `@optimitron/opg` evaluates policies with Bradford Hill-style causal confidence scoring instead of ideology-first labeling.
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

The Prize rewards voter recruitment. Deposit USDC → Fund grows at ~17%/yr → recruit World ID-verified voters → earn VOTE tokens. If health/income targets are met by 2040, VOTE holders claim the prize share. If targets are missed, depositors get their money back with ~11x compound returns. Break-even probability: 0.0067%.

**Contracts**: `VoterPrizeTreasury` + `VoteToken` (deployed on Base Sepolia)

Start here. Everything else depends on proving demand first.

### Phase 2: Incentive Alignment Bonds — `/iab`

After the Prize proves demand, IABs raise ~$1B to lobby for the 1% Treaty. Same dominant assurance structure — plan fails, bondholders get compound returns back. Plan succeeds, treaty revenue ($27B/yr) splits 80/10/10: 80% to pragmatic clinical trials, 10% to bondholder returns, 10% to a SuperPAC smart contract that funds aligned politicians and defunds the rest.

The treaty unlocks an **$114B annual peace dividend** from reduced conflict costs — direct military savings, reduced infrastructure damage, trade disruption reduction, and veteran healthcare savings. Combined with the $101T political dysfunction tax, this is the first cut.

**Contracts**: `IABVault` + `IABSplitter` + `PublicGoodsPool` + `AlignmentScoreOracle` + `PoliticalIncentiveAllocator` (not yet deployed — Phase 1 first)

### Phase 3: $WISH Token — `/money`

Independent from Prize and IABs. Different contracts, different purpose. The endgame: a programmable currency with governance built into the protocol.

| Reform | What it replaces | Annual savings |
|--------|-----------------|----------------|
| 0.5% transaction tax | 80,000 IRS employees interpreting a 74,000-page tax code | $546B compliance costs |
| Universal Basic Income | 27+ overlapping welfare bureaucracies | $1.1T administration waste |
| Wishocratic allocation | Politicians deciding budgets via lobbying | $4.4B lobbying industry + $181B corporate welfare |
| Algorithmic 0% inflation | Federal Reserve's 2% "stealth taxation" | 8% of GDP in financial sector extraction |

Citizens do 5 minutes of pairwise comparisons → eigenvector decomposition produces stable budget weights → $WISH transaction taxes are allocated automatically. No politicians. No lobbyists. No 74,000-page tax code. Full trajectory: **$1.16M average income by year 20** (vs. $20.5K status quo) and a **12x cumulative lifetime income multiplier** under the treaty path alone. Optimal governance pushes that further.

On my planet, this is called "basic infrastructure." On yours, it would be the largest quality-of-life improvement in the history of your species.

**Contracts**: `WishToken` + `WishocraticTreasury` + `UBIDistributor`

All treasury contracts are Solidity 0.8.24, Hardhat 2.22, OpenZeppelin 5.1.

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
- `@optimitron/optimizer` depends on **nothing** — it's the foundation
- Library packages are **pure TypeScript** — no server, no database
- `@optimitron/optimizer` is **domain-agnostic** — no references to "drugs", "policies", or "budgets"
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
pnpm --filter @optimitron/optimizer test

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
| **dFDA Specification** | `@optimitron/optimizer` — PIS, temporal alignment, Bradford Hill, effect sizes | [dfda-spec.warondisease.org](https://dfda-spec.warondisease.org) |
| **Wishocracy** | `@optimitron/wishocracy` — RAPPA, eigenvector weights, Citizen Alignment Scores | [wishocracy.warondisease.org](https://wishocracy.warondisease.org) |
| **Optimal Policy Generator** | `@optimitron/opg` — Policy Impact Score, Causal Confidence Score, method weights | [opg.warondisease.org](https://opg.warondisease.org) |
| **Optimal Budget Generator** | `@optimitron/obg` — Diminishing returns, Optimal Spending Level, Budget Impact Score | [obg.warondisease.org](https://obg.warondisease.org) |
| **Optimocracy** | Two-metric welfare function (shared by OPG + OBG) | [optimocracy.warondisease.org](https://optimocracy.warondisease.org) |
| **Incentive Alignment Bonds** | `@optimitron/treasury-*` — Prize, IAB, and $WISH mechanisms (Solidity 0.8.24, four packages) | [iab.warondisease.org](https://iab.warondisease.org) |

### Motivation & Impact Papers

| Paper | What it quantifies | Web |
|-------|-------------------|-----|
| **Political Dysfunction Tax** | $101T/year governance inefficiency — the problem Optimitron exists to solve | [political-dysfunction-tax.warondisease.org](https://political-dysfunction-tax.warondisease.org) |
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
