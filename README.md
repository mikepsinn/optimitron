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

## The Core Insight

The same causal inference engine works across all domains:

| Application | Predictor → Outcome | Example |
|-------------|-------------------|---------|
| **Drug Assessment (dFDA)** | Drug → Symptom | "Does magnesium improve sleep?" |
| **Policy Analysis (OPG)** | Policy → Welfare | "Does tobacco tax reduce smoking?" |
| **Budget Optimization (OBG)** | Spending → Welfare | "What's the optimal education budget?" |
| **Preference Alignment (RAPPA)** | Alignment → Welfare | "Do responsive politicians produce better outcomes?" |

## Papers

The algorithms are defined in peer-reviewed papers:

- **[dFDA Specification](https://dfda-spec.warondisease.org)** — Predictor Impact Score methodology
- **[Wishocracy](https://wishocracy.warondisease.org)** — RAPPA preference aggregation
- **[Optimal Policy Generator](https://opg.warondisease.org)** — Policy recommendations
- **[Optimal Budget Generator](https://obg.warondisease.org)** — Budget optimization
- **[Optimocracy](https://optimocracy.warondisease.org)** — Two-metric welfare function

## Development

```bash
pnpm install
pnpm check     # typecheck + lint + test
pnpm build     # build all packages
```

## License

MIT
