# Optomitron Data Sources Catalog

Complete directory of data needed across all packages, with sources, APIs, and estimated sizes.

## 🏛️ Government Spending & Budget

| Dataset | Source | API? | Size | Frequency | Notes |
|---------|--------|------|------|-----------|-------|
| Federal spending by category | [USAspending.gov](https://api.usaspending.gov/) | ✅ Free | ~500 rows | Annual | Aggregated by budget function, not transaction-level |
| OECD government spending | [OECD.Stat](https://stats.oecd.org/restsdmx/sdmx.ashx) | ✅ Free | ~5K rows | Annual | 38 countries × 12 categories × ~30 years |
| State/local spending (US) | [Census Bureau](https://www.census.gov/programs-surveys/gov-finances.html) | ✅ Free | ~10K rows | Annual | State-level by function |
| Military expenditure | [SIPRI](https://www.sipri.org/databases/milex) | CSV download | ~10K rows | Annual | 1949-present, all countries |
| IMF fiscal data | [IMF Data](https://data.imf.org/) | ✅ Free | ~20K rows | Annual | Government Finance Statistics |

## 📊 Economic Indicators

| Dataset | Source | API? | Size | Frequency | Notes |
|---------|--------|------|------|-----------|-------|
| GDP per capita (PPP) | [World Bank WDI](https://api.worldbank.org/v2/) | ✅ Free | ~12K rows | Annual | All countries since 1960 |
| Median household income | [FRED](https://fred.stlouisfed.org/docs/api/) | ✅ Free (key) | ~100 rows | Annual | US only; other countries via OECD |
| CPI / Inflation | [FRED](https://fred.stlouisfed.org/docs/api/) | ✅ Free (key) | ~1K rows | Monthly | |
| Poverty rates | [World Bank](https://api.worldbank.org/v2/) | ✅ Free | ~10K rows | Annual | $1.90, $3.20, $5.50/day thresholds |
| Employment / unemployment | [BLS](https://www.bls.gov/developers/) | ✅ Free (key) | ~5K rows | Monthly | US; OECD for international |
| Income inequality (Gini) | [World Bank](https://api.worldbank.org/v2/) | ✅ Free | ~5K rows | Annual | |
| Corruption Perception Index | [Transparency Intl](https://www.transparency.org/) | CSV download | ~2K rows | Annual | |
| Economic Freedom Index | [Heritage Foundation](https://www.heritage.org/index/) | CSV download | ~3K rows | Annual | |

## 🏥 Health Outcomes

| Dataset | Source | API? | Size | Frequency | Notes |
|---------|--------|------|------|-----------|-------|
| Life expectancy | [WHO GHO](https://ghoapi.azureedge.net/api/) | ✅ Free | ~12K rows | Annual | All countries |
| Healthy life expectancy (HALE) | [WHO GHO](https://ghoapi.azureedge.net/api/) | ✅ Free | ~6K rows | Annual | Key welfare metric |
| Cause-of-death statistics | [WHO GHO](https://ghoapi.azureedge.net/api/) | ✅ Free | ~50K rows | Annual | By cause, country |
| Healthcare spending | [WHO GHO](https://ghoapi.azureedge.net/api/) | ✅ Free | ~12K rows | Annual | % GDP, per capita |
| Disease burden (DALYs) | [IHME GBD](https://ghdx.healthdata.org/) | Download | ~100K rows | Annual | Global Burden of Disease |
| Vaccination rates | [WHO GHO](https://ghoapi.azureedge.net/api/) | ✅ Free | ~20K rows | Annual | By vaccine, country |
| Smoking / alcohol / BMI | [WHO GHO](https://ghoapi.azureedge.net/api/) | ✅ Free | ~15K rows | Annual | Risk factors |
| US health surveys (BRFSS) | [CDC](https://data.cdc.gov/) | ✅ Free | ~50K rows | Annual | State-level health behaviors |

## 💊 Drug/Treatment Outcomes (dFDA)

| Dataset | Source | API? | Size | Frequency | Notes |
|---------|--------|------|------|-----------|-------|
| FDA adverse event reports | [openFDA](https://open.fda.gov/apis/) | ✅ Free | Huge (>15M) | Continuous | FAERS database |
| Drug labels / interactions | [openFDA](https://open.fda.gov/apis/) | ✅ Free | ~100K drugs | As updated | SPL labels |
| Clinical trial results | [ClinicalTrials.gov](https://clinicaltrials.gov/data-api/api) | ✅ Free | ~400K trials | Continuous | |
| Patient-reported outcomes | User-submitted | Custom | Varies | Continuous | Future: via Optomitron web app |
| Wearable/app health data | Various APIs | Varies | Varies | Continuous | Apple Health, Fitbit, etc. |

## 🗳️ Political / Governance (RAPPA)

| Dataset | Source | API? | Size | Frequency | Notes |
|---------|--------|------|------|-----------|-------|
| US Congress votes | [congress.gov](https://api.congress.gov/) | ✅ Free (key) | ~50K votes | Per session | Roll call votes |
| US Congress members | [congress.gov](https://api.congress.gov/) | ✅ Free (key) | ~600 current | Per session | Bioguide IDs |
| Congress votes (alt) | [ProPublica](https://projects.propublica.org/api-docs/congress-api/) | ✅ Free (key) | Same | Per session | Easier API |
| State legislatures | [OpenStates](https://v3.openstates.org/docs) | ✅ Free (key) | ~7K legislators | Per session | All 50 states |
| World governance indicators | [World Bank](https://api.worldbank.org/v2/) | ✅ Free | ~3K rows | Annual | Rule of law, corruption, etc. |
| Election results | Various | Mixed | Varies | Per election | Would need country-specific sources |
| Citizen preferences | User-submitted | Custom | Varies | Continuous | Future: via RAPPA web app |

## 📋 Policy Data

| Dataset | Source | API? | Size | Frequency | Notes |
|---------|--------|------|------|-----------|-------|
| Tax rates by country | [OECD Tax Database](https://www.oecd.org/tax/tax-policy/tax-database/) | CSV | ~5K rows | Annual | Income, corporate, VAT |
| Education spending & outcomes | [OECD PISA](https://www.oecd.org/pisa/) | CSV | ~2K rows | Triennial | Test scores + spending |
| Environmental regulations | [Yale EPI](https://epi.yale.edu/) | CSV | ~2K rows | Biennial | Environmental Performance Index |
| Drug policy (legalization dates) | Manual curation | ❌ | ~200 rows | As changed | Cannabis, psychedelics, etc. |
| Policy change dates | Manual curation | ❌ | ~1K rows | As changed | Key for causal analysis |

## 📦 Mike's Existing Data (mikepsinn/economic-data)

65 CSVs in Gapminder format (countries × years), ~2.6 MB total:

**Health (8 files):** life expectancy, BMI, blood pressure, cholesterol, HIV deaths, suicide, smoking rates, alcohol, sugar intake
**Economic (5 files):** GDP per capita, national income, poverty rates (2 thresholds)
**Energy (11 files):** CO2, coal, electricity, oil, gas, nuclear, hydro — all per capita
**Military (1 file):** SIPRI data 1949-2022
**Other:** CPI, murder rates, population, country regions

→ **Strategy: Git submodule or copy into repo (it's tiny)**

## Data Strategy Summary

| Category | Strategy | Why |
|----------|----------|-----|
| Mike's CSVs (2.6 MB) | **In repo** (submodule or copy) | Tiny, static, core reference data |
| Country metadata | **In repo** (JSON/CSV) | Small, rarely changes |
| Policy change dates | **In repo** (curated JSON) | Small, needs human curation |
| OECD, World Bank, WHO | **API at runtime + cache** | Large, frequently updated, free APIs |
| FRED, BLS, Census | **API at runtime + cache** | US-specific, needs API keys |
| USAspending | **API at runtime** | Only need aggregates, not 100GB bulk |
| Congress/OpenStates | **API at runtime + cache** | Updates per legislative session |
| openFDA, ClinicalTrials | **API at runtime** | Huge datasets, query as needed |
| User-submitted data | **Database (Prisma)** | Collected via web app |

## API Keys Needed

| API | Key Required? | Free? | Sign Up |
|-----|--------------|-------|---------|
| World Bank | No | ✅ | — |
| OECD | No | ✅ | — |
| WHO GHO | No | ✅ | — |
| FRED | Yes | ✅ | https://fred.stlouisfed.org/docs/api/api_key.html |
| BLS | Yes | ✅ | https://data.bls.gov/registrationEngine/ |
| congress.gov | Yes | ✅ | https://api.congress.gov/sign-up/ |
| ProPublica | Yes | ✅ | https://www.propublica.org/datastore/api |
| OpenStates | Yes | ✅ | https://v3.openstates.org/accounts/signup/ |
| openFDA | No | ✅ | — |
| USAspending | No | ✅ | — |
