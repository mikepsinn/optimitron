# Optimitron Library Checklist

Comprehensive feature checklist for all non-UI library packages.
Last updated: 2026-03-22.

## Test Coverage Summary

| Package | Tests | Status |
|---------|-------|--------|
| @optimitron/optimizer | 369 | ✅ |
| @optimitron/wishocracy | 202 | ✅ |
| @optimitron/opg | 241 | ✅ |
| @optimitron/obg | 175 | ✅ |
| @optimitron/data | 546 | ✅ |
| @optimitron/db | 60 | ⚠️ Needs schema validation tests |
| @optimitron/chat-ui | 87 | ✅ |
| @optimitron/examples (integration) | 78 | ✅ |
| **Total** | **~1,737** | |

---

## @optimitron/optimizer (Causal Inference Engine)

### ✅ Implemented
- [x] Pearson correlation coefficient (176 tests)
- [x] Spearman rank correlation
- [x] Temporal alignment with onset delay + duration of action
- [x] Onset delay optimization (grid search over delays)
- [x] Predictor Impact Score (PIS) — multi-factor scoring
- [x] Bradford Hill criteria scoring (9 criteria, 0-1 each)
- [x] Effect size calculation (baseline vs follow-up)
- [x] Z-score calculation
- [x] Optimal predictor value analysis
- [x] Data quality validation (min pairs, variance, baseline/follow-up fractions)
- [x] Statistical significance (p-value from correlation)
- [x] Confidence interval (Fisher z-transform)
- [x] Evidence grade assignment (A/B/C/D/F)
- [x] ESM-compatible module (import.meta.url)
- [x] Reverse Pearson correlation — swap predictor/outcome roles to verify causality direction
- [x] Predictive Pearson — `forwardPearson - reversePearson` as causality strength metric
- [x] Aggregate correlation pipeline — weight-average user-level relationships into global relationships
- [x] T-test p-value — separate p-value for high vs low predictor outcome groups
- [x] Interesting factor / trivial filtering — filter obvious correlations (same category, non-controllable)
- [x] Grouped cause value rounding — round optimal values to practical amounts
- [x] Interpolation — in temporal alignment
- [x] Partial correlation — confounder control via `partialCorrelation(x, y, z)` (exported)
- [x] Diminishing returns detection — response curve analysis via `estimateDiminishingReturns()` (exported)

### ❌ Not Yet Implemented
- [ ] **Vote-weighted significance** — Bayesian prior: `(upVotes + 4) / (upVotes + downVotes + 4)` (MEDIUM)
- [ ] **Correlation over delays/durations storage** — JSON map `{delay: correlation}` for visualization (LOW)
- [ ] **Strongest Pearson at optimal delay** — stored separately from forward correlation (LOW)
- [ ] **Optimal Pearson Product** — `|r| × changeSpread` composite metric (LOW)
- [ ] **Skewness/kurtosis in scoring** — penalize non-normal distributions (LOW)
- [ ] **Structural break detection** — find policy change points (ACA 2010, drug war 1971) (MEDIUM)
- [ ] **Granger causality test** — formal econometric test alongside Causal Direction Score (MEDIUM)
- [ ] **Instrumental variables** — for cases where reverse causation is strong (LOW)

### Test Gaps
- [ ] Edge cases: zero-variance data, single data point, identical timestamps
- [ ] Very large datasets (10K+ measurements) performance
- [ ] NaN/Infinity propagation tests
- [ ] Round-trip: measurements → alignment → correlation → PIS → optimal value

---

## @optimitron/wishocracy (Preference Aggregation)

### ✅ Implemented
- [x] Pairwise comparison matrix construction (162 tests)
- [x] Eigenvector-based weight extraction
- [x] Consistency ratio (CR) validation
- [x] Alignment scoring (politician vs citizen preferences)
- [x] Preference gap analysis
- [x] Bootstrap confidence intervals
- [x] Manipulation resistance detection
- [x] Matrix completion (incomplete comparison matrices)
- [x] Smart pair selection (minimize comparisons needed)
- [x] Convergence tracking
- [x] Time-weighted preferences — recent comparisons weighted more
- [x] Confidence-weighted aggregation — weight by participant's consistency ratio

### ❌ Not Yet Implemented
- [ ] **Sybil resistance** — proof of personhood integration (Phase 3, Worldcoin/Holonym)
- [ ] **Delegation/liquid democracy** — delegate your comparisons to a trusted proxy (LOW)
- [ ] **Category-level aggregation** — aggregate within categories before cross-category (LOW)

### Test Gaps
- [ ] Very large matrices (100+ items) performance
- [ ] Adversarial manipulation scenarios
- [ ] Edge case: all comparisons equal

---

## @optimitron/opg (Optimal Policy Generator)

### ✅ Implemented
- [x] Policy welfare scoring (213 tests)
- [x] Jurisdiction hierarchy
- [x] Policy comparison and ranking
- [x] Budget allocation optimization
- [x] Bradford Hill evidence assessment for policies
- [x] Markdown report generation — formatted policy recommendation reports

### ❌ Not Yet Implemented
- [ ] **Multi-objective optimization** — Pareto frontier for competing objectives (MEDIUM)
- [ ] **Constraint satisfaction** — budget limits, legal constraints, political feasibility (MEDIUM)
- [ ] **Sensitivity analysis** — how robust is the optimal policy to parameter changes (MEDIUM)
- [ ] **Policy simulation** — Monte Carlo simulation of policy outcomes (LOW)

### Test Gaps
- [ ] Cross-jurisdiction policy comparison
- [ ] Edge cases: zero-budget, single policy, conflicting objectives

---

## @optimitron/obg (Optimal Budget Generator)

### ✅ Implemented
- [x] Diminishing returns model fitting (146 tests) — log-linear + saturation models
- [x] Cost-effectiveness analysis
- [x] Budget Impact Score (BIS) with precision weighting
- [x] Budget optimization with welfare maximization
- [x] NaN guards for edge cases (zero spending, zero SE)
- [x] Optimal spending levels — `findOSL()` / `estimateOSL()` with bootstrap confidence intervals
- [x] Budget reallocation recommendations — suggest transfers between categories
- [x] Markdown report generation — formatted budget recommendation reports

### ❌ Not Yet Implemented
- [ ] **Multi-year budget projection** — project outcomes over time with spending scenarios (MEDIUM)
- [ ] **Multi-outcome optimization** — optimize across BOTH income AND health simultaneously (HIGH)
- [ ] **Equity weighting** — weight outcomes by population served (LOW)

### Test Gaps
- [ ] Very large budgets (100+ categories)
- [ ] Edge cases: all categories equal spending, negative budgets
- [ ] Real-world data validation (known budget outcomes)

---

## @optimitron/data (Fetchers + Importers)

### ✅ Implemented — API Fetchers
- [x] OECD health expenditure fetcher (SDMX REST API, 4 datasets)
- [x] World Bank indicators fetcher (27 indicators, pagination)
- [x] WHO GHO fetcher (HALE, mortality, UHC coverage, retry logic)
- [x] FRED economic data fetcher (15+ series, optional API key)
- [x] Congress.gov fetcher (members, bills, votes, roll calls, XML parsing)
- [x] USAspending.gov fetcher (20 budget function codes, subfunctions, FY2017+)

### ✅ Implemented — Health Importers
- [x] Apple Health XML importer (40+ HealthKit types, streaming for 500MB+ files)
- [x] Fitbit JSON importer
- [x] Oura JSON importer
- [x] MyFitnessPal CSV importer
- [x] Withings CSV importer (locale-aware delimiter detection)
- [x] Google Fit JSON importer (Takeout format)
- [x] Cronometer CSV importer
- [x] Strava JSON importer
- [x] Generic CSV importer (column mapping, delimiter auto-detection)

### ✅ Implemented — Data Processing
- [x] Standard variable names (80+ canonical definitions)
- [x] Variable name resolution (`resolveVariableName()`)
- [x] Economic data CSV loader (ESM-compatible)
- [x] Unit conversion system — 30+ units, category-based, temperature/rating formulas (`unit-conversion.ts`, 640 lines)
- [x] Daily value aggregation — SUM/MEAN/MAX/MIN with ZERO/INTERPOLATION/VALUE filling (`daily-aggregation.ts`, 273 lines)
- [x] Measurement validation — physiological bounds for 20+ variables (`measurement-validation.ts`, 217 lines)
- [x] Variable statistics — mean, median, stddev, variance, skewness, kurtosis + global aggregation (`variable-statistics.ts`, 329 lines)
- [x] Importer normalization — `resolveVariableName` wired into importers
- [x] Inflation adjustment — CPI-U deflator + US population data (2000-2025) + `toRealPerCapita()` for nominal→real per-capita conversion (`inflation-adjustment.ts`)

### ❌ Not Yet Implemented
- [ ] **Variable tagging / common tags** — hierarchical: "Advil 200mg" → "Ibuprofen" → "NSAIDs" (MEDIUM)
- [ ] **Weather data fetcher** — environmental correlates (MEDIUM)
- [ ] **Air quality data fetcher** — PM2.5, AQI, pollen (MEDIUM)
- [ ] **OAuth2 connector framework** — live API sync (not file-based) (LOW, Phase 2+)
- [ ] **RescueTime importer** — productivity/screen time (LOW)
- [ ] **Sleep as Android importer** (LOW)

### Test Gaps
- [ ] Cross-importer normalization (same metric from different sources → same variable name)
- [ ] Large file handling (500MB+ Apple Health XML)
- [ ] Malformed/corrupt input files
- [ ] API rate limiting in fetchers
- [ ] Offline/cached data fallback

---

## @optimitron/db (Prisma Schema)

### ✅ Implemented
- [x] 70+ models, 80+ enums, documented fields
- [x] Layer 1: Universal measurement (Unit, VariableCategory, GlobalVariable, NOf1Variable, Measurement, TrackingReminder, etc.)
- [x] Layer 2: Governance (Jurisdiction, WishocraticItem, Participant, PairwiseComparison, PreferenceWeight, Politician, PoliticianVote, AlignmentScore, Referendum, VoteTokenMint, PrizeTreasuryDeposit)
- [x] JSDoc on every field
- [x] deletedAt on all models (soft deletes)
- [x] Enums for all categorical fields
- [x] Seed script (31 units, 15 categories, 50 variables, 51 jurisdictions, 20 budget items)
- [x] Zod validators — auto-generated from Prisma via `zod-prisma-types`
- [x] Variable category seed data — sensible defaults per category (onset delay, duration, filling, combination op)
- [x] Schema validation tests — Zod coverage + committed migration asset checks + env-gated seed smoke test
- [x] Migration setup — Docker Compose Postgres + committed Prisma migrations + root `db:*` workflow

### ❌ Not Yet Implemented
- [ ] **CommonTag model** — variable parent-child hierarchy (MEDIUM)
- [ ] **UserTag model** — per-user variable aliasing (LOW)
- [ ] **CorrelationVote models** — causality + usefulness voting (MEDIUM)
- [ ] **Study model** — study types, reports, sharing (LOW)
- [ ] **Analysis queue fields** — `analysisStartedAt`, `analysisEndedAt`, error tracking (MEDIUM)

### Test Gaps
- [ ] Enum completeness validation
- [ ] Foreign key integrity tests

---

## @optimitron/chat-ui (Conversational Health Tracking)

### ✅ Implemented
- [x] 8 React components (87 tests)
- [x] NLP text-to-measurements pipeline
- [x] 15 variable categories, 31 unit abbreviations, 12 regex patterns
- [x] LLM fallback (OpenAI/Anthropic/Gemini via fetch)
- [x] Conversation context tracking

### ❌ Not Yet Implemented
- [ ] **Medication dose parsing** — "took 200mg ibuprofen" → structured measurement (MEDIUM)
- [ ] **Temporal expressions** — "yesterday at 3pm", "this morning", "2 hours ago" (HIGH)
- [ ] **Multi-measurement parsing** — "took vitamin D 5000IU and magnesium 400mg" (MEDIUM)
- [ ] **Confirmation/correction flow** — "did you mean..." with inline buttons (MEDIUM)
- [ ] **Tracking reminder integration** — "remind me to rate mood at 8pm" (LOW)
- [ ] **Insight delivery** — proactive "Your mood is 15% higher on days you take vitamin D" (MEDIUM)

### Test Gaps
- [ ] Ambiguous input handling ("I feel good" vs "good 7/10")
- [ ] Multi-language support
- [ ] Edge cases: empty input, very long input, special characters

---

## Cross-Package Features

### ✅ Implemented
- [x] End-to-end pipeline function — measurements → daily values → alignment → correlation → PIS → report
- [x] Markdown report generation — formatted analysis reports for any pipeline output
- [x] Web integration — `generate-analysis.ts` script wires OBG/OPG library outputs to web pages via JSON
- [x] Misconceptions page — `/misconceptions` with 15 myth-vs-reality analyses
- [x] Budget page — 34+ categories scored via real OSL estimation from `@optimitron/obg`
- [x] Policy page — 12 policies scored via Bradford Hill from `@optimitron/opg`

### ❌ Not Yet Implemented
- [ ] **PGlite integration** — Postgres-in-browser for local-first (Phase 2)
- [ ] **cr-sqlite sync** — P2P device synchronization (Phase 2)
- [ ] **Proof of personhood** — Worldcoin/Holonym integration (Phase 3, World ID partially done in web)
- [ ] **Interactive "what if" budget tool** — slider per category, real-time welfare estimate
- [ ] **Country comparison tool** — pick any 2 countries, see spending differences + outcome differences
- [ ] **Causal direction visualization** — show forward vs reverse arrows with strength

---

## Remaining Priority Items

### P0 — High Impact
1. Multi-outcome optimization — income + health simultaneously (@optimitron/obg)
2. Inflation-adjusted per-capita mode for all analyses (@optimitron/data + @optimitron/obg)
3. Remaining misconception analyses — 13 of 28 still to do (Tier 1-3 from TODO-OPTIMAL-BUDGET.md)

### P1 — Important
4. Temporal expressions in NLP (@optimitron/chat-ui)
5. Vote-weighted significance (@optimitron/optimizer)
6. Variable tagging / common tags (@optimitron/db + @optimitron/data)
7. Multi-year budget projection (@optimitron/obg)
8. Structural break detection (@optimitron/optimizer)

### P2 — Nice to Have
9. Granger causality test (@optimitron/optimizer)
10. Instrumental variables (@optimitron/optimizer)
11. Weather / air quality fetchers (@optimitron/data)
12. Analysis queue / scheduling (@optimitron/db)
13. CorrelationVote models (@optimitron/db)
14. Study model (@optimitron/db)
15. Interactive budget tool (web)
16. Country comparison tool (web)
