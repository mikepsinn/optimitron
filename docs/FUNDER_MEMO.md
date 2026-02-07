# Optomitron: Funder Targeting Memo

## One-Liner
A domain-agnostic causal inference engine that optimizes health, budget, and policy outcomes using real data — running entirely on-device.

## The Problem
Governments and individuals make trillion-dollar resource allocation decisions based on ideology rather than evidence. The US spends $10,200/capita on healthcare for *worse* outcomes than countries spending $3,000. 14 of 15 popular policy beliefs are contradicted by data. There is no public tool that makes this visible.

## The Solution
Optomitron is an open-source TypeScript library and web application that:
1. **Finds minimum effective spending** — the lowest budget level per category that achieves comparable outcomes
2. **Ranks countries by efficiency** — outcome-per-dollar across healthcare, defense, education, R&D
3. **Tests policy myths** — 15 common beliefs analyzed with year-over-year causal methods
4. **Runs locally** — all computation in-browser via PGlite/WebAssembly, no data leaves the device

## Traction
- **Live demo:** [mikepsinn.github.io/optomitron](https://mikepsinn.github.io/optomitron/)
- **1,700+ tests** passing across 10 packages
- **308 OBG tests** covering budget optimization, efficient frontier, overspend analysis
- **15 policy misconception analyses** completed with real US data (1950–2023)
- **9 health data importers** (Apple Health, Fitbit, Oura, etc.)
- **Open source:** [github.com/mikepsinn/optomitron](https://github.com/mikepsinn/optomitron)

## Target Funders

### Tier 1: Public Goods / Crypto
| Funder | Fit | Amount | Cycle |
| --- | --- | --- | --- |
| **Gitcoin** | Open source, public goods | $5-50K | Rolling |
| **Optimism RetroPGF** | Public goods on Ethereum | $10-100K | Rounds |
| **VitaDAO** | Health data, longevity | $10-50K | Proposals |
| **Worldcoin** | Proof-of-personhood for voting | $10-50K | Grants |

### Tier 2: Traditional
| Funder | Fit | Amount | Cycle |
| --- | --- | --- | --- |
| **Knight Foundation** | Civic tech, transparency | $50-200K | LOI |
| **NSF SBIR** | Causal inference research | $275K Phase I | Quarterly |
| **Arnold Ventures** | Evidence-based policy | $50-500K | LOI |
| **Hewlett Foundation** | Open government | $50-200K | LOI |

### Tier 3: Health-Specific
| Funder | Fit | Amount | Cycle |
| --- | --- | --- | --- |
| **Gates Foundation** | Global health optimization | $100K-1M | LOI |
| **Wellcome Trust** | Health data, open research | $50-500K | Proposals |
| **PCORI** | Patient-centered outcomes | $50-300K | Cycles |

## Key Differentiators
1. **Local-first:** No server, no surveillance. Browser-native Postgres (PGlite).
2. **Domain-agnostic:** Same engine optimizes health supplements, government budgets, or business spend.
3. **Causal, not correlational:** Year-over-year analysis + causal direction scoring eliminates spurious findings.
4. **Already built:** Working demo with real data, not a whitepaper.

## Ask
$50K–$100K for 6 months to:
- Polish the web demo for public launch
- Add 5 more country analyses (UK, Germany, Japan, Australia, Canada)
- Build the health tracking import pipeline for consumer use
- Submit to 3 grant programs

## Team
- **Mike P. Sinn** — 15 years building quantified-self and health data platforms. Previously built a 115-table health analytics API used by 30K+ users.
- **Open source contributors** welcome.

## Risk Mitigation
| Risk | Mitigation |
| --- | --- |
| Data quality | All sources cited; OECD/World Bank/FRED primary data |
| Causal claims | Year-over-year analysis + Bradford Hill scoring + explicit limitations |
| Adoption | Policy demo requires no account; health tracking optional |
| Sustainability | Open source + grant funding → consulting/enterprise licensing long-term |

---
*Contact: m@thinkbynumbers.org | [GitHub](https://github.com/mikepsinn/optomitron)*
