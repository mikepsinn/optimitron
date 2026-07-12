# REFERENCES.md — Optimitron Source Material & References

> Complete index of papers, schemas, APIs, standards, and data sources that inform the Optimitron codebase.

---

## Table of Contents

- [Papers (Source of All Algorithms)](#papers-source-of-all-algorithms)
- [Optimitron Schema (Legacy Reference)](#optimitron-schema-legacy-reference)
- [Data APIs](#data-apis)
- [Health Data Standards](#health-data-standards)
- [Proof of Personhood / Identity](#proof-of-personhood--identity)
- [Crypto / On-Chain Infrastructure](#crypto--on-chain-infrastructure)
- [Mike's Economic Data](#mikes-economic-data)
- [Additional Data Sources](#additional-data-sources)

---

## Papers (Source of All Algorithms)

Every algorithm in this codebase originates from one of these papers. The **local QMD source files** contain exact formulas, worked examples, SQL schemas, and parameter justifications. Always read the relevant QMD before implementing.

| Paper | Package(s) | Key Concepts | Local QMD | Web |
|-------|-----------|--------------|-----------|-----|
| **dFDA Specification** | `@optimitron/optimizer` | PIS methodology, temporal alignment (onset delay + duration of action), Bradford Hill scoring (9 criteria with saturation functions), effect size estimation, evidence grading (A–F), optimal value analysis | `knowledge/appendix/dfda-spec-paper.qmd` | [dfda-spec.warondisease.org](https://dfda-spec.warondisease.org) |
| **Wishocracy** | `@optimitron/wishocracy` | RAPPA (Randomized Aggregated Pairwise Preference Allocation), eigenvector preference weights via power iteration, Citizen Alignment Scores, consistency ratio (AHP CR), Floyd-Warshall matrix completion, bootstrap convergence analysis | `knowledge/appendix/wishocracy-paper.qmd` | [wishocracy.warondisease.org](https://wishocracy.warondisease.org) |
| **Optimocracy** | `@optimitron/opg`, `@optimitron/obg` | Two-metric welfare function: W = α·IncomeGrowth + (1−α)·HealthyLifeYears | `knowledge/appendix/optimocracy-paper.qmd` | [optimocracy.warondisease.org](https://optimocracy.warondisease.org) |
| **Optimal Policy Generator** | `@optimitron/opg` | Policy Impact Score, Causal Confidence Score (CCS), Bradford Hill for policy evaluation, method quality weights (RCT=1.0 → cross-sectional=0.25), jurisdiction analysis, policy recommendations (enact/replace/repeal/maintain) | `knowledge/appendix/optimal-policy-generator-spec.qmd` | [opg.warondisease.org](https://opg.warondisease.org) |
| **Optimal Budget Generator** | `@optimitron/obg` | Budget Impact Score (BIS), Optimal Spending Level (OSL) via log-linear and Michaelis-Menten saturation models, cost-effectiveness analysis (cost-per-QALY), diminishing returns modeling, spending gap analysis | `knowledge/appendix/optimal-budget-generator-spec.qmd` | [obg.warondisease.org](https://obg.warondisease.org) |
| **Incentive Alignment Bonds** | `@optimitron/treasury` (Phase 5) | IAB treasury mechanism, smart contract campaign funding, alignment-score-based automatic fund distribution, data contribution tokens | `knowledge/appendix/incentive-alignment-bonds-paper.qmd` | [iab.warondisease.org](https://iab.warondisease.org) |

**Local QMD source files** are in the disease-eradication-plan repo:
```
https://github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/
```

---

## Optimitron Schema (Legacy Reference)

The Optimitron schema (`@optimitron/db`) was inspired by the legacy PostgreSQL database. We extracted and modernized the essential models for the universal measurement system from the original 115-table schema.

**Source Repository:** [mikepsinn/curedao-api](https://github.com/mikepsinn/curedao-api)

**Schema Location:** `database/ddl/postgres-v0/public/`

### Table Mapping

| Legacy DDL File | Optimitron Model | Purpose |
|------------------|-----------------|---------|
| `measurements.sql` | `Measurement` | Individual data points (timestamp, value, unit, source) |
| `variables.sql` | `GlobalVariable` | Canonical variable definitions (name, category, default unit, combination method) |
| `user_variables.sql` | `NOf1Variable` | Per-unit variable settings (onset delay, duration of action, filling type, personal stats) |
| `units.sql` | `Unit` | Unit definitions with conversion factors (mg, hours, rating/5, etc.) |
| `variable_categories.sql` | `VariableCategory` | Variable groupings (Treatments, Symptoms, Biomarkers, Foods, etc.) |
| `tracking_reminders.sql` | `TrackingReminder` | Scheduled measurement prompts |
| `correlations.sql` | `NOf1VariableRelationship` | Per-unit causal analysis results (PIS, effect size, optimal value) |
| `aggregate_correlations.sql` | `AggregateVariableRelationship` | Population-level aggregated causal analysis results |

**Note:** The original legacy database has 115 tables covering OAuth, social features, purchases, studies, and more. We intentionally ported only the core measurement and analysis tables — the minimal set needed for the universal measurement system and causal inference pipeline.

---

## Data APIs

External APIs used by `@optimitron/data` and planned integrations. See [DATA_SOURCES.md](./DATA_SOURCES.md) for full dataset catalog with row counts and update frequencies.

### Open APIs (No Key Required)

| API | URL | Data Provided | Used By |
|-----|-----|---------------|---------|
| **OECD SDMX JSON API** | [data-explorer.oecd.org](https://data-explorer.oecd.org/) | Government spending by COFOG function, health expenditure, tax rates (38 member countries) | `@optimitron/data` — `sources/oecd.ts` |
| **World Bank Indicators** | [API Docs](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation) | GDP, life expectancy, mortality, education, Gini, unemployment, poverty (200+ countries, 1960–present) | `@optimitron/data` — `sources/world-bank.ts` |
| **WHO GHO OData** | [gho-odata-api](https://www.who.int/data/gho/info/gho-odata-api) | Life expectancy, HALE, cause-of-death, healthcare spending, vaccination rates, risk factors | `@optimitron/data` (planned) |
| **USAspending.gov** | [api.usaspending.gov](https://api.usaspending.gov/) | Federal spending by budget function (aggregated, not transaction-level) | `@optimitron/data` (planned) |
| **openFDA** | [open.fda.gov/apis](https://open.fda.gov/apis/) | Adverse event reports (FAERS, 15M+ records), drug labels, interactions | `@optimitron/data` (planned, dFDA) |
| **ClinicalTrials.gov** | [data-api](https://clinicaltrials.gov/data-api/api) | 400K+ clinical trial records and results | `@optimitron/data` (planned, dFDA) |

### APIs Requiring Free Keys

| API | URL | Data Provided | Used By |
|-----|-----|---------------|---------|
| **FRED** (Federal Reserve Economic Data) | [API Docs](https://fred.stlouisfed.org/docs/api/fred/) | Median household income, CPI/inflation, employment, interest rates (US) | `@optimitron/data` (planned) |
| **Congress.gov API** | [api.congress.gov](https://api.congress.gov/) | US Congress roll call votes, member data, bill text | `@optimitron/data` (planned, RAPPA alignment) |
| **ProPublica Congress API** | [Docs](https://www.propublica.org/datastore/api/propublica-congress-api) | Congress votes (alternative, easier API), member profiles | `@optimitron/data` (planned, RAPPA alignment) |
| **OpenStates** | [v3.openstates.org/docs](https://v3.openstates.org/docs) | State legislature members, votes, bills (all 50 US states) | `@optimitron/data` (planned, state-level RAPPA) |
| **BLS** (Bureau of Labor Statistics) | [bls.gov/developers](https://www.bls.gov/developers/) | Employment, unemployment, wages (US, detailed) | `@optimitron/data` (planned) |

### API Key Status

| API | Key Required | Free | Sign Up |
|-----|-------------|------|---------|
| World Bank | No | ✅ | — |
| OECD | No | ✅ | — |
| WHO GHO | No | ✅ | — |
| USAspending | No | ✅ | — |
| openFDA | No | ✅ | — |
| FRED | Yes | ✅ | [Sign up](https://fred.stlouisfed.org/docs/api/api_key.html) |
| BLS | Yes | ✅ | [Sign up](https://data.bls.gov/registrationEngine/) |
| Congress.gov | Yes | ✅ | [Sign up](https://api.congress.gov/sign-up/) |
| ProPublica | Yes | ✅ | [Sign up](https://www.propublica.org/datastore/api) |
| OpenStates | Yes | ✅ | [Sign up](https://v3.openstates.org/accounts/signup/) |

---

## Health Data Standards

Standards referenced for data import/export and interoperability. Optimitron has its own schema (see `@optimitron/db`) — inspired by a prior project but redesigned for modern TypeScript, local-first architecture, and domain-agnostic use.

| Standard | URL | Usage in Optimitron |
|----------|-----|---------------------|
| **FHIR R4** (HL7) | [hl7.org/fhir](https://hl7.org/fhir/) | Import/export format for clinical data (Observations, Conditions, MedicationStatements). Maps to `Measurement` model on import. Not used as internal schema. |
| **OMOP CDM** (OHDSI) | [CommonDataModel](https://ohdsi.github.io/CommonDataModel/) | Reference for observational health research. Informs our approach to variable standardization and outcome definitions. |
| **Apple Health XML** | Apple HealthKit export format | Layer 1 data import — parses `export.xml` into `Measurement` records. Supports HKQuantityType, HKCategoryType, workout data. |
| **Google Health Connect** | Android Health Connect API | Layer 1 data import — Android equivalent of Apple Health. Reads exercise, nutrition, sleep, vitals, body measurements. |

---

## Proof of Personhood / Identity

Layer 2 of the architecture. Enables anonymous but deduplicated contributions (one person = one vote/submission). User chooses their provider.

| Provider | URL | Method | Sybil Resistance | Privacy |
|----------|-----|--------|-------------------|---------|
| **Holonym** | [holonym.id](https://holonym.id/) | ZK identity proofs from government ID | High (gov ID + ZK) | Strong (zero-knowledge, no data leaves device) |
| **Gitcoin Passport** | [passport.gitcoin.co](https://passport.gitcoin.co/) | Composable stamp-based scoring (social, on-chain, identity) | Medium (stamp accumulation) | Medium (pseudonymous) |
| **Worldcoin / World ID** | [worldcoin.org/world-id](https://worldcoin.org/world-id) | Iris biometric hash (Orb device) | Very high (biometric uniqueness) | Medium (biometric, hash stored) |
| **human.tech** | [human.tech](https://human.tech/) | Social graph proofs, decentralized identity | Medium-high | Strong (social proof, no biometrics) |

**Key properties for Layer 2:**
- **Uniqueness** — Each human can only submit once per time period
- **Unlinkability** — Submissions cannot be linked to each other or to real identity
- **Revocability** — User can rotate credentials without losing contribution history
- **Composability** — Multiple proof methods can be combined for higher confidence

---

## Crypto / On-Chain Infrastructure

Technologies for Layer 3 (on-chain submission) and Layer 5 (incentives).

### Local-First Database

| Technology | URL | Purpose |
|-----------|-----|---------|
| **PGlite** (Postgres in browser) | [electric-sql.com/product/pglite](https://electric-sql.com/product/pglite) | Run full PostgreSQL in WebAssembly for Layer 1 local storage — enables complex queries on device without a server |
| **cr-sqlite** (CRDT sync) | [vlcn.io/docs/cr-sqlite/intro](https://vlcn.io/docs/cr-sqlite/intro) | Conflict-free replicated SQLite for peer-to-peer data sync between user devices |

### Smart Contracts

Existing Solidity contracts from the Wishocracy repo serve as a starting point for Phase 5 (Incentive Alignment Bonds):

```
https://github.com/mikepsinn/wishocracy/tree/main/contracts/
├── genie-dao-factory.sol    # DAO creation and governance
├── wish-ubi.sol             # Universal basic income distribution
└── wishing-well.sol         # Treasury and fund allocation
```

**Phase 5 will need:**
- IAB Treasury contract (accepts donations, holds funds)
- Alignment-score-based automatic fund distribution
- Data contribution token (governance/utility)
- On-chain data schema for effect sizes, preference weights, evidence grades

---

## Mike's Economic Data

**Repository:** [mikepsinn/economic-data](https://github.com/mikepsinn/economic-data)

65 CSVs in Gapminder format (countries × years), ~2.6 MB total. Included in `@optimitron/data` as a git submodule at `packages/data/economic-data/`.

### Dataset Categories

| Category | Files | Examples |
|----------|-------|---------|
| **Health** | 8 | Life expectancy, BMI, blood pressure, cholesterol, HIV deaths, suicide rates, smoking prevalence, alcohol consumption, sugar intake |
| **Income** | 5 | GDP per capita, national income, poverty rates (multiple thresholds) |
| **Energy** | 11 | CO2 emissions, coal, electricity, oil, gas, nuclear, hydroelectric — all per capita |
| **Political** | 1 | Military expenditure (SIPRI, 1949–2022) |
| **Population** | Varies | Country population, demographics |
| **Culture** | Varies | CPI, murder rates, other social indicators |
| **Spending** | Varies | Government expenditure breakdowns |

Full catalog of all 60+ datasets is in `packages/data/src/catalog.ts`.

---

## Additional Data Sources

These sources are referenced in [DATA_SOURCES.md](./DATA_SOURCES.md) for future integration:

| Source | URL | Data | Notes |
|--------|-----|------|-------|
| **SIPRI** (Military Expenditure) | [sipri.org/databases/milex](https://www.sipri.org/databases/milex) | Military spending, all countries, 1949–present | CSV download |
| **IMF Fiscal Data** | [data.imf.org](https://data.imf.org/) | Government Finance Statistics | Free API |
| **Census Bureau** (State/Local Finances) | [census.gov/programs-surveys/gov-finances](https://www.census.gov/programs-surveys/gov-finances.html) | US state-level spending by function | Free API |
| **IHME Global Burden of Disease** | [ghdx.healthdata.org](https://ghdx.healthdata.org/) | DALYs, disease burden by cause/country | Download |
| **CDC BRFSS** | [data.cdc.gov](https://data.cdc.gov/) | US state-level health behaviors | Free API |
| **OECD Tax Database** | [oecd.org/tax/tax-policy/tax-database](https://www.oecd.org/tax/tax-policy/tax-database/) | Income, corporate, VAT rates by country | CSV |
| **OECD PISA** | [oecd.org/pisa](https://www.oecd.org/pisa/) | Education spending & test scores | CSV (triennial) |
| **Yale EPI** | [epi.yale.edu](https://epi.yale.edu/) | Environmental Performance Index | CSV (biennial) |
| **Transparency International CPI** | [transparency.org](https://www.transparency.org/) | Corruption Perception Index | CSV (annual) |
| **Heritage Economic Freedom** | [heritage.org/index](https://www.heritage.org/index/) | Economic Freedom Index | CSV (annual) |

---

## Cross-References

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Five-layer system architecture, package dependency graph, phase roadmap
- **[CLAUDE.md](./CLAUDE.md)** — Agent instructions, paper reading guide, implementation workflow
- **[DATA_SOURCES.md](./DATA_SOURCES.md)** — Full dataset catalog with row counts, frequencies, and API details

---

*Last updated: 2026-02-06*

