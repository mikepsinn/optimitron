# Optomitron Library Checklist

Comprehensive feature checklist for all non-UI library packages.
Last updated: 2026-02-06.

## Test Coverage Summary

| Package | Tests | Status |
|---------|-------|--------|
| @optomitron/optimizer | 369 | ✅ |
| @optomitron/wishocracy | 202 | ✅ |
| @optomitron/opg | 241 | ✅ |
| @optomitron/obg | 175 | ✅ |
| @optomitron/data | 546 | ✅ |
| @optomitron/db | 60 | ⚠️ Needs schema validation tests |
| @optomitron/chat-ui | 87 | ✅ |
| @optomitron/examples (integration) | 78 | ✅ |
| **Total** | **~1,737** | |

---

## @optomitron/optimizer (Causal Inference Engine)

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

### ❌ Not Yet Implemented
- [x] **Reverse Pearson correlation** — swap predictor/outcome roles to verify causality direction (HIGH)
  - Legacy: `CorrelationReversePearsonCorrelationCoefficientProperty`
- [x] **Predictive Pearson** — `forwardPearson - reversePearson` as causality strength metric (HIGH)
  - Legacy: `CorrelationPredictivePearsonCorrelationCoefficientProperty`
- [x] **Aggregate correlation pipeline** — weight-average user-level relationships into global relationships (HIGH)
  - Legacy: `QMAggregateCorrelation::analyzeFully()`
- [ ] **Vote-weighted significance** — Bayesian prior: `(upVotes + 4) / (upVotes + downVotes + 4)` (MEDIUM)
  - Legacy: `CorrelationStatisticalSignificanceProperty`
- [x] **Interesting factor / trivial filtering** — filter obvious correlations (same category, non-controllable) (MEDIUM)
  - Legacy: `isInteresting()` in `HasCorrelationCoefficient`
- [x] **T-test p-value** — separate p-value for high vs low predictor outcome groups (MEDIUM)
  - Legacy: `QMUserCorrelation` t-test between outcome groups
- [ ] **Correlation over delays/durations storage** — JSON map `{delay: correlation}` for visualization (LOW)
  - Legacy: `correlations_over_delays`, `correlations_over_durations`
- [ ] **Strongest Pearson at optimal delay** — stored separately from forward correlation (LOW)
- [ ] **Optimal Pearson Product** — `|r| × changeSpread` composite metric (LOW)
- [x] **Grouped cause value rounding** — round optimal values to practical amounts (LOW)
- [ ] **Skewness/kurtosis in scoring** — penalize non-normal distributions (LOW)
- [x] **Interpolation** — declared in types but not implemented in temporal alignment (MEDIUM)

### Test Gaps
- [ ] Edge cases: zero-variance data, single data point, identical timestamps
- [ ] Very large datasets (10K+ measurements) performance
- [ ] NaN/Infinity propagation tests
- [ ] Round-trip: measurements → alignment → correlation → PIS → optimal value

---

## @optomitron/wishocracy (Preference Aggregation)

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

### ❌ Not Yet Implemented
- [ ] **Sybil resistance** — proof of personhood integration (Phase 3, Worldcoin/Holonym)
- [ ] **Delegation/liquid democracy** — delegate your comparisons to a trusted proxy (LOW)
- [x] **Time-weighted preferences** — recent comparisons weighted more (MEDIUM)
- [ ] **Category-level aggregation** — aggregate within categories before cross-category (LOW)
- [x] **Confidence-weighted aggregation** — weight by participant's consistency ratio (MEDIUM)

### Test Gaps
- [ ] Very large matrices (100+ items) performance
- [ ] Adversarial manipulation scenarios
- [ ] Edge case: all comparisons equal

---

## @optomitron/opg (Optimal Policy Generator)

### ✅ Implemented
- [x] Policy welfare scoring (213 tests)
- [x] Jurisdiction hierarchy
- [x] Policy comparison and ranking
- [x] Budget allocation optimization
- [x] Bradford Hill evidence assessment for policies

### ❌ Not Yet Implemented
- [ ] **Multi-objective optimization** — Pareto frontier for competing objectives (MEDIUM)
- [ ] **Constraint satisfaction** — budget limits, legal constraints, political feasibility (MEDIUM)
- [ ] **Sensitivity analysis** — how robust is the optimal policy to parameter changes (MEDIUM)
- [ ] **Policy simulation** — Monte Carlo simulation of policy outcomes (LOW)
- [x] **Markdown report generation** — formatted policy recommendation reports (HIGH)

### Test Gaps
- [ ] Cross-jurisdiction policy comparison
- [ ] Edge cases: zero-budget, single policy, conflicting objectives

---

## @optomitron/obg (Optimal Budget Generator)

### ✅ Implemented
- [x] Diminishing returns model fitting (146 tests)
- [x] Cost-effectiveness analysis
- [x] Budget Impact Score (BIS) with precision weighting
- [x] Budget optimization with welfare maximization
- [x] NaN guards for edge cases (zero spending, zero SE)

### ❌ Not Yet Implemented
- [x] **Optimal spending levels** — find spending level that maximizes marginal return (HIGH)
- [x] **Budget reallocation recommendations** — suggest transfers between categories (HIGH)
- [ ] **Multi-year budget projection** — project outcomes over time with spending scenarios (MEDIUM)
- [x] **Markdown report generation** — formatted budget recommendation reports (HIGH)
- [ ] **Equity weighting** — weight outcomes by population served (LOW)

### Test Gaps
- [ ] Very large budgets (100+ categories)
- [ ] Edge cases: all categories equal spending, negative budgets
- [ ] Real-world data validation (known budget outcomes)

---

## @optomitron/data (Fetchers + Importers)

### ✅ Implemented
- [x] OECD health expenditure fetcher (296 tests)
- [x] World Bank indicators fetcher
- [x] WHO GHO fetcher
- [x] FRED economic data fetcher
- [x] Congress.gov fetcher (members, bills, votes, roll calls)
- [x] Apple Health XML importer (40+ HealthKit types, streaming)
- [x] Fitbit JSON importer
- [x] Oura JSON importer
- [x] MyFitnessPal CSV importer
- [x] Withings CSV importer
- [x] Google Fit JSON importer
- [x] Cronometer CSV importer
- [x] Strava JSON importer
- [x] Generic CSV importer
- [x] Standard variable names (80+ canonical definitions)
- [x] Variable name resolution (`resolveVariableName()`)
- [x] Economic data CSV loader (ESM-compatible)

### ❌ Not Yet Implemented
- [x] **Unit conversion system** — runtime conversion between measurement units (HIGH)
  - Schema has `conversionSteps` field but no runtime logic
  - Legacy: `QMUnit::convertTo()` with 100+ unit definitions
- [x] **Daily value aggregation** — aggregate raw measurements into daily values with filling (HIGH)
  - SUM for treatments, MEAN for vitals, filling for missing days
  - Legacy: `getDailyMeasurementsWithTagsAndFillingInTimeRange()`
- [x] **Measurement validation** — validate values against variable min/max and unit constraints (HIGH)
  - Legacy: `validateValueForCommonVariableAndUnit()`
- [ ] **Variable tagging / common tags** — hierarchical variable relationships (MEDIUM)
  - "Advil 200mg" → "Ibuprofen" → "NSAIDs"
  - Legacy: `CommonTag` model
- [ ] **Unit variable statistics** — running stats: mean, median, stddev, variance, kurtosis (MEDIUM)
  - Legacy: `QMUserVariable::calculateAttributes()`
- [ ] **Global variable statistics** — aggregate stats across all units (MEDIUM)
  - Legacy: `QMCommonVariable`
- [x] **Importer normalization** — wire `resolveVariableName` into all importers (HIGH)
  - Standard names exist but importers don't call the resolver
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

## @optomitron/db (Prisma Schema)

### ✅ Implemented
- [x] 24 models, 12 enums, ~300+ documented fields
- [x] Layer 1: Universal measurement (Unit, VariableCategory, GlobalVariable, NOf1Variable, Measurement, TrackingReminder, TrackingReminderNotification, NOf1VariableRelationship, AggregateVariableRelationship, IntegrationProvider, IntegrationConnection, IntegrationSyncLog)
- [x] Layer 2: Governance (Jurisdiction, Item, Participant, PairwiseComparison, PreferenceWeight, AggregationRun, Politician, PoliticianVote, AlignmentScore)
- [x] JSDoc on every field
- [x] deletedAt on all models (soft deletes)
- [x] Enums for all categorical fields
- [x] Seed script (31 units, 15 categories, 50 variables, 51 jurisdictions, 20 budget items)

### ❌ Not Yet Implemented
- [x] **Zod validators** — auto-generate from Prisma via `zod-prisma-types` (HIGH)
- [x] **Variable category seed data** — sensible defaults per category (onset delay, duration, filling, combination op) (HIGH)
  - Legacy has ~30 hardcoded category classes with defaults
- [x] **Schema validation tests** — Zod schema coverage plus committed migration asset checks and env-gated seed smoke test in `packages/db/src/__tests__/`
- [x] **Migration setup** — Docker Compose Postgres + committed Prisma migrations + root `db:*` workflow
- [ ] **CommonTag model** — variable parent-child hierarchy (MEDIUM)
- [ ] **UserTag model** — per-user variable aliasing (LOW)
- [ ] **CorrelationVote models** — causality + usefulness voting (MEDIUM)
- [ ] **Study model** — study types, reports, sharing (LOW)
- [ ] **Analysis queue fields** — `analysisStartedAt`, `analysisEndedAt`, error tracking (MEDIUM)
  - `analysisRequestedAt` exists but no scheduling logic

### Test Gaps
- [x] Seed script execution test (env-gated `packages/db/src/__tests__/seed.integration.test.ts`)
- [ ] Enum completeness validation
- [ ] Foreign key integrity tests

---

## @optomitron/chat-ui (Conversational Health Tracking)

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

## Cross-Package Features (Not Assigned)

### ❌ Not Yet Implemented
- [x] **End-to-end pipeline function** — single function: measurements → daily values → alignment → correlation → PIS → report (HIGH)
- [x] **Markdown report generation** — formatted analysis reports for any pipeline output (HIGH)
- [ ] **API routes** — Express/Hono API for submitting data and querying results (MEDIUM)
- [ ] **PGlite integration** — Postgres-in-browser for local-first (Phase 2)
- [ ] **cr-sqlite sync** — P2P device synchronization (Phase 2)
- [ ] **Proof of personhood** — Worldcoin/Holonym integration (Phase 3)
- [ ] **On-chain submission** — ZK-proof anonymous data contribution (Phase 3)
- [ ] **Incentive Alignment Bonds** — crypto treasury + smart contracts (Phase 4)

---

## Priority Ordering (Libraries Only)

### P0 — Must Have for MVP
1. Unit conversion system (@optomitron/data)
2. Daily value aggregation pipeline (@optomitron/data)
3. Importer normalization — wire resolveVariableName (@optomitron/data)
4. Measurement validation (@optomitron/data)
5. Zod validators from Prisma (@optomitron/db)
6. Reverse + predictive Pearson (@optomitron/optimizer)
7. Aggregate correlation pipeline (@optomitron/optimizer)
8. End-to-end pipeline function (cross-package)
9. Markdown report generation (cross-package)
10. Variable category seed data with defaults (@optomitron/db)

### P1 — Important
11. Temporal expressions in NLP (@optomitron/chat-ui)
12. T-test p-value (@optomitron/optimizer)
13. Interesting factor / trivial filtering (@optomitron/optimizer)
14. User variable statistics (@optomitron/data)
15. Global variable statistics (@optomitron/data)
16. Variable tagging / common tags (@optomitron/db + @optomitron/data)
17. Vote-weighted significance (@optomitron/optimizer)
18. Budget reallocation recommendations (@optomitron/obg)
19. Optimal spending levels (@optomitron/obg)
20. Markdown report for OPG (@optomitron/opg)

### P2 — Nice to Have
21. Confidence-weighted preference aggregation (@optomitron/wishocracy)
22. Time-weighted preferences (@optomitron/wishocracy)
23. Interpolation in temporal alignment (@optomitron/optimizer)
24. Correlation over delays storage (@optomitron/optimizer)
25. Multi-objective optimization (@optomitron/opg)
26. Sensitivity analysis (@optomitron/opg)
27. Weather / air quality fetchers (@optomitron/data)
28. Analysis queue / scheduling (@optomitron/db)
29. CorrelationVote models (@optomitron/db)
30. Study model (@optomitron/db)
