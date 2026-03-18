# Optimitron Product Context

## Summary
Optimitron is a domain-agnostic causal inference and optimization engine. It analyzes time-series data to determine what causes what, then recommends optimal values — for government budgets, health interventions, business metrics, or anything measurable.

## Vision
"What if every dollar spent — by a government, a hospital, or a person — was backed by causal evidence of its actual impact?"

## Primary Users
- **Citizens** — see how their government's budget compares to the evidence-optimal budget
- **Researchers / Think Tanks** — reproducible causal analysis on public data ($99-999/mo API)
- **Jurisdictions** — data-driven budgeting and policy ranking for any level of government
- **Health Trackers** — personal N-of-1 causal inference on lifestyle data (Phase 2)
- **Businesses** — causal impact analysis on revenue/growth time series

## Architecture (5 Layers)
1. **Local** — Data collection + on-device causal inference (PGlite, Chrome extension)
2. **Identity** — Privacy-preserving identity (DID, future ZK proofs)
3. **On-Chain** — Anonymous submission of aggregate insights
4. **Aggregation** — Global causal inference + preference aggregation (Wishocracy/RAPPA)
5. **Incentives** — Alignment bonds, political accountability (Phase 4)

## Core Packages
| Package | Purpose | Tests |
|---------|---------|-------|
| `@optimitron/optimizer` | Domain-agnostic causal inference engine | 393 |
| `@optimitron/wishocracy` | RAPPA preference aggregation | 202 |
| `@optimitron/opg` | Optimal Policy Generator | 241 |
| `@optimitron/obg` | Optimal Budget Generator | 247 |
| `@optimitron/data` | Data fetchers, importers, datasets | 589+ |
| `@optimitron/db` | Prisma schema + Zod validators | 60 |
| `@optimitron/chat-ui` | Conversational health tracking | 87 |
| `@optimitron/storage` | Storacha/IPFS content-addressed snapshots | 20 |
| `@optimitron/hypercerts` | Hypercerts AT Protocol record mapping | 15 |
| `@optimitron/agent` | Autonomous policy analyst (Gemini + ERC-8004) | 14 |
| `@optimitron/web` | Next.js website | — |
| `@optimitron/extension` | Chrome extension (Digital Twin Safe) | — |
| `@optimitron/examples` | Runnable demos | 78 |

## Current State (Mar 2026)
- **~1,900+ tests** passing across all packages
- **Web app**: auth, referrals, World ID verification, profile/census tracking, daily check-ins, and shareable alignment reports are implemented in `packages/web`
- **Website LIVE**: https://mikepsinn.github.io/optimitron/ (legacy/static demo surface)
- **Real analyses running**: US budget optimization (231 countries), Drug War, Laffer Curve, Healthcare, Minimum Wage
- **Key finding**: US R&D should be $603B (currently $75B); Education $307B (currently $102B)
- **Key analyses**: Drug control spending has zero effect on overdose deaths (r=0.026); US healthcare spending negatively correlates with life expectancy in YoY changes

## Revenue Strategy
1. **Free**: Citizen preference collection, public misconception analyses
2. **Paid API** ($99-999/mo): Researcher/think tank access to causal inference engine
3. **Premium**: SuperPAC/campaign alignment data, jurisdiction deployment
4. **Grants**: Gitcoin, Optimism RetroPGF, VitaDAO, NSF SBIR, Knight Foundation

## Non-Goals (v1)
- Full replacement of democratic processes
- Production ZK proofs or on-chain identity
- Medical or legal advice — outputs are informational only
- Govtech procurement sales — we're a public good, not a vendor

## Success Metrics
- Reproducible pilot report that passes independent review
- First funding commitment (grant or pilot deployment)
- 15 misconception analyses with compelling, shareable findings
- Universal optimal budget report: "How the US Should Spend $6.7T"
