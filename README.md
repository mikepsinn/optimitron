# Optomitron

**AI governance platform for maximizing median health and happiness for humanity.**

Optomitron collects human preferences and real-world outcome data, runs causal inference to figure out what actually works, and generates optimal policy and budget recommendations.

## How It Works

```
Citizens report            Causal engine finds        System recommends
what they want    →    what actually works    →    optimal allocation
(RAPPA surveys)        (Bradford Hill + PIS)       (OPG + OBG)
       ↑                       ↑
   Preferences             Outcomes
   (pairwise $100           (health, wealth,
    comparisons)             welfare data)
```

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| [`@optomitron/causal`](packages/causal/) | Domain-agnostic causal inference (temporal alignment, Bradford Hill, Predictor Impact Score) | 🟡 Alpha |
| [`@optomitron/rappa`](packages/rappa/) | RAPPA preference aggregation (pairwise comparisons, eigenvector weights, Citizen Alignment Scores) | 🟡 Alpha |
| [`@optomitron/opg`](packages/opg/) | Optimal Policy Generator (policy scoring, jurisdiction analysis) | 🟡 Alpha |
| [`@optomitron/obg`](packages/obg/) | Optimal Budget Generator (diminishing returns, cost-effectiveness, Budget Impact Score) | 🟡 Alpha |
| [`@optomitron/data`](packages/data/) | Data fetchers (OECD, World Bank, FRED, WHO, Congress) | 🔴 Stub |
| [`@optomitron/db`](packages/db/) | Prisma schema for response collection and storage | 🔴 Stub |
| `@optomitron/treasury` | IAB smart contracts, token, alignment-based campaign funding | ⚪ Planned |

## The Core Insight

`@optomitron/causal` is **completely domain-agnostic**. Give it any two time series and it tells you: does X cause Y? By how much? What's the optimal value of X?

| Domain | X → Y | Question |
|--------|-------|----------|
| **Health** | Drug → Symptom | "Does magnesium improve sleep?" |
| **Policy** | Policy → Welfare | "Does tobacco tax reduce smoking?" |
| **Budget** | Spending → Welfare | "What's the optimal education budget?" |
| **Governance** | Alignment → Welfare | "Do responsive politicians produce better outcomes?" |
| **Business** | Ad spend → Revenue | "What's the optimal marketing budget?" |
| **Business** | Price → Conversions | "What price maximizes sales?" |
| **Manufacturing** | Temperature → Defects | "What setting minimizes defects?" |

Same engine. Same math. Different data.

## Papers

The algorithms are defined in peer-reviewed papers:

- **[dFDA Specification](https://dfda-spec.warondisease.org)** — Predictor Impact Score methodology
- **[Wishocracy](https://wishocracy.warondisease.org)** — RAPPA preference aggregation
- **[Optimal Policy Generator](https://opg.warondisease.org)** — Policy recommendations
- **[Optimal Budget Generator](https://obg.warondisease.org)** — Budget optimization
- **[Optimocracy](https://optimocracy.warondisease.org)** — Two-metric welfare function

## Government OS

Any jurisdiction can deploy Optomitron as its governance operating system:

```
Your City installs Optomitron
         ↓
Citizens do pairwise comparisons on local priorities
         ↓
Local outcome data flows in (health, education, crime, satisfaction)
         ↓
Causal engine identifies what's actually working
         ↓
OPG recommends policies based on evidence from similar jurisdictions
         ↓
OBG optimizes budget allocation for maximum impact
         ↓
Alignment scores show which officials represent citizen preferences
```

The database is multi-tenant — every jurisdiction is a tenant with its own items, participants, officials, and data. Cross-jurisdiction comparison ("City A spends X on education and gets Y outcomes vs. City B") is a core feature.

### Incentive Alignment Bonds (Phase 4)

Citizens donate to a transparent crypto treasury. Smart contracts automatically fund campaigns of politicians whose voting records align with citizen preferences. See the [IAB paper](https://iab.warondisease.org).

## Development

```bash
# Clone with submodules (includes economic-data dataset)
git clone --recurse-submodules https://github.com/mikepsinn/optomitron.git

# If you already cloned without --recurse-submodules:
git submodule update --init --recursive

pnpm install
pnpm check     # typecheck + lint + test
pnpm build     # build all packages
```

## License

MIT
