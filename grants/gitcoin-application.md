# Gitcoin Grants Application — Optimitron

## Project Name
Optimitron — Open Source World Optimization Engine

## Project Description (Short)
Optimitron is a domain-agnostic causal inference engine that optimizes anything measurable — from personal health to government budgets to business outcomes. One command finds causal relationships in time series data and generates evidence-based recommendations.

## Project Description (Long)

### What is Optimitron?

Optimitron is an open-source TypeScript monorepo that combines causal inference, preference aggregation, and policy optimization into a single platform. It implements five peer-reviewed methodologies:

1. **Causal Inference Engine** — Temporal alignment, Bradford Hill scoring, effect size estimation, and optimal value detection for any predictor-outcome pair
2. **Wishocracy (RAPPA)** — Confidence-weighted pairwise preference aggregation for democratic decision-making
3. **Optimal Policy Generator** — Ranks policies by causal evidence strength and welfare impact
4. **Optimal Budget Generator** — Finds optimal resource allocation using diminishing returns modeling
5. **Health Data Pipeline** — 9 importers (Apple Health, Fitbit, Oura, etc.) + 5 API fetchers (WHO, World Bank, OECD, FRED, Congress.gov)

### Why It Matters

Every year, governments spend trillions of dollars on policies with no causal evidence of effectiveness. Meanwhile, individuals make health decisions based on anecdote rather than personal data. Optimitron applies the same rigorous causal analysis to both problems:

- **Personal**: "Does Vitamin D actually improve my mood?" → Upload your health data, get a Bradford Hill-scored answer
- **Policy**: "Does increasing education spending improve PISA scores?" → Cross-country analysis with 20+ nations
- **Budget**: "Where should the next $1B of federal spending go for maximum welfare?" → Diminishing returns modeling across 20 budget categories

### Current State

- **~1,700+ tests** across 8 packages, all passing
- **Live website**: https://mikepsinn.github.io/optimitron/
- **Golden path demo**: One command generates synthetic health data → runs full causal pipeline → outputs markdown report
- **Country-level analysis**: Converts WHO/World Bank data into optimizer-compatible format — same pipeline for personal health and national statistics
- 24-model Prisma schema with Zod validators
- Domain-agnostic core — works for health, government, business, agriculture, anything with time series data

### Roadmap

**Q1 2026**: Auth + API, wire real optimizer output to website, Chrome extension for local health tracking
**Q2 2026**: PGlite (Postgres-in-browser) for on-device analysis, anonymous on-chain preference submission
**Q3 2026**: Proof of personhood integration, cross-jurisdiction comparative effectiveness
**Q4 2026**: Incentive Alignment Bonds — fund campaigns of politicians whose votes match citizen preferences

## How does this project benefit the Ethereum/Web3 ecosystem?

1. **Privacy-preserving governance**: Citizen preferences collected locally, aggregated anonymously — a model for on-chain voting without surveillance
2. **Public goods infrastructure**: Open source causal inference benefits all DAOs making resource allocation decisions (treasury management, grant distribution)
3. **DeSci application**: Health data analysis pipeline enables privacy-preserving medical research without centralized data collection
4. **ZK-ready architecture**: Designed for future ZK proof integration (anonymous preference submission, verifiable aggregation)
5. **Retroactive public goods**: Every policy recommendation is a public good — if Optimitron improves one government budget decision, the welfare gain is billions

## Team

**Mike P. Sinn** — 10+ years building health data platforms. Previously built the largest open-source personal health data repository (500K+ users). Published 12 papers on health optimization, decentralized clinical trials, and evidence-based governance through the Institute for Accelerated Medicine.

## Funding Request
$25,000 — $50,000

## Use of Funds
- 60% — Development: Complete Chrome extension, PGlite integration, API layer
- 20% — Infrastructure: Hosting, CI/CD, domain costs
- 10% — Documentation: User guides, API docs, contribution guides
- 10% — Community: Grant application support, conference presentations, ecosystem partnerships

## Links
- **GitHub**: https://github.com/mikepsinn/optimitron
- **Live Demo**: https://mikepsinn.github.io/optimitron/
- **Papers**: https://dfda-spec.warondisease.org, https://wishocracy.warondisease.org, https://opg.warondisease.org, https://obg.warondisease.org
- **License**: MIT
