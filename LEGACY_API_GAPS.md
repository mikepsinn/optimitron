# Feature Gap Analysis

Cross-reference audit of legacy PHP API features vs Optimitron (TypeScript) implementations.
Performed 2026-02-06. Legacy source: https://github.com/mikepsinn/curedao-api/blob/main/

## Legend

| Status | Meaning |
|--------|---------|
| ✅ | Implemented in Optimitron |
| 🔶 | Partially implemented |
| ❌ | Not yet ported — needs implementation |

---

## 1. Correlation / Relationship Analysis

### ✅ Pearson Correlation Coefficient
- **Legacy API**: `Stats::calculatePearsonCorrelationCoefficient()` — covariance / (stddevX × stddevY)
  - [Stats.php#L352](https://github.com/mikepsinn/curedao-api/blob/main/app/Utils/Stats.php#L352)
  - [CorrelationForwardPearsonCorrelationCoefficientProperty.php](https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationForwardPearsonCorrelationCoefficientProperty.php)
- **Optimitron**: `pearsonCorrelation()` in `packages/optimizer/src/statistics.ts`
- **Notes**: Implementations are equivalent. Both use standard formula.

### ✅ Spearman Rank Correlation
- **Legacy API**: `CorrelationForwardSpearmanCorrelationCoefficientProperty::calculate()`
  - [QMUserCorrelation.php#L622](https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php#L622)
- **Optimitron**: `spearmanCorrelation()` in `packages/optimizer/src/statistics.ts`
- **Notes**: Both convert to ranks and compute Pearson on ranks.

### 🔶 Reverse Pearson Correlation
- **Legacy API**: `CorrelationReversePearsonCorrelationCoefficientProperty::calculate()` — swaps cause/effect roles to test whether causality direction is correct.
  - [CorrelationReversePearsonCorrelationCoefficientProperty.php](https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationReversePearsonCorrelationCoefficientProperty.php)
- **Optimitron**: Supported via `reversePairs` parameter in `calculatePredictorImpactScore()`, but not automatically calculated from the same data. The caller must construct reverse pairs explicitly.
- **Gap**: Optimitron should auto-generate reverse-aligned pairs when forward pairs are provided.

### ✅ Predictive Pearson Correlation
- **Legacy API**: `predictivePearsonCorrelationCoefficient = forwardPearson - reversePearson`
  - [CorrelationPredictivePearsonCorrelationCoefficientProperty.php](https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationPredictivePearsonCorrelationCoefficientProperty.php)
- **Optimitron**: Captured in `temporalityFactor = |r_forward| / (|r_forward| + |r_reverse|)` — different formula but same intent (penalizing reverse causation).
- **Notes**: Consider adding the subtraction-based metric as well for Legacy API parity.

### ✅ Temporal Alignment (Onset Delay / Duration of Action)
- **Legacy API**: Two pairing strategies — `setPairsBasedOnDailyCauseValues()` (predictor-based) and `setPairsBasedOnDailyEffectValues()` (outcome-based, used when cause has a filling value).
  - [QMUserCorrelation.php#L899-L975](https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php#L899)
  - Uses `GetPairRequest::createAbsolutePairs()` and `createPairForEachEffectMeasurement()`
- **Optimitron**: `alignOutcomeBased()` and `alignPredictorBased()` in `packages/optimizer/src/temporal-alignment.ts`
- **Notes**: Core logic matches. Legacy API selects strategy based on `hasFillingValue()`, Optimitron on `fillingType !== 'none'`.

### ✅ Onset Delay Optimization (Grid Search)
- **Legacy API**: `calculateCorrelationsOverOnsetDelaysAndGenerateChartConfig()` — iterates over multiple onset delay values, computing correlation at each, finding the strongest.
  - [QMUserCorrelation.php#L1876](https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php#L1876)
  - Also searches over durations via `calculateCorrelationOverDurationsOfActionAndGenerateChartConfig()`
- **Optimitron**: `optimizeTemporalParameters()` in `packages/optimizer/src/temporal-alignment.ts`
- **Notes**: Both do grid search. Legacy API stores results per hyper-parameter combination.

### ✅ Predictor Impact Score (PIS) / QM Score
- **Legacy API**: `CorrelationQmScoreProperty::calculateQmScore()` — `|coefficient| × statisticalSignificance × interestingFactor + aggregateScore`
  - [CorrelationQmScoreProperty.php](https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationQmScoreProperty.php)
  - Also older `Stats::qmScore()` which factors in skewness, kurtosis, predictive difference
  - [Stats.php#L160](https://github.com/mikepsinn/curedao-api/blob/main/app/Utils/Stats.php#L160)
- **Optimitron**: `calculatePredictorImpactScore()` — `r × S × φZ × temporalityFactor × φUsers × φPairs`
  - `packages/optimizer/src/predictor-impact-score.ts`
- **Notes**: Different formulas but same purpose. Legacy API's simplified formula is `|r| × significance`. Optimitron's is more nuanced with Bradford Hill factors.

### ✅ Statistical Significance
- **Legacy API**: `CorrelationStatisticalSignificanceProperty::calculate()` — product of 6 saturation factors:
  `rawCauseMeasurementSignificance × rawEffectMeasurementSignificance × numberOfDaysSignificance × causeChangesStatisticalSignificance × allPairsSignificance × voteStatisticalSignificance`
  Each uses `1 - exp(-x / 30)`.
  - [CorrelationStatisticalSignificanceProperty.php](https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationStatisticalSignificanceProperty.php)
- **Optimitron**: Uses p-value from t-test, saturation on pairs and users.
- **Notes**: Legacy API's significance includes vote-based weighting and per-dimension saturation curves.

### ✅ Bradford Hill Criteria Scoring
- **Legacy API**: Implicit — uses temporal asymmetry, sample size, effect magnitude, but doesn't explicitly name Bradford Hill criteria.
- **Optimitron**: Explicit Bradford Hill scoring in both `packages/optimizer/src/predictor-impact-score.ts` (health) and `packages/opg/src/bradford-hill.ts` (policy).

### ✅ Z-Score Calculation
- **Legacy API**: `CorrelationZScoreProperty::calculate()` — `|effectFollowUpPercentChange| / baselineEffectRelativeStandardDeviation`
  - [CorrelationZScoreProperty.php](https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationZScoreProperty.php)
- **Optimitron**: `zScore` in `calculateEffectSize()` — `|percentChange| / (baselineStd/baselineMean × 100)` (RSD-based)

### ✅ Optimal Value Analysis
- **Legacy API**: `CorrelationValuePredictingHighOutcomeProperty` and `CorrelationValuePredictingLowOutcomeProperty` — splits pairs by effect value relative to mean, averages the cause values in each group.
  - [QMUserCorrelation.php#L2351-L2600](https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php#L2351)
- **Optimitron**: `calculateOptimalValues()` in `packages/optimizer/src/predictor-impact-score.ts`

### ✅ Effect Size / Baseline vs Follow-up
- **Legacy API**: `calculateOutcomeBaselineStatistics()` — generates baseline and follow-up pairs by comparing cause values to mean cause, then computes effect change from baseline.
  - [QMUserCorrelation.php#L2811](https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php#L2811)
- **Optimitron**: `calculateEffectSize()` in `packages/optimizer/src/statistics.ts`

### ✅ Data Quality Validation
- **Legacy API**: Multiple checks: minimum measurement counts, variance requirements, chronological ordering, unique value counts, minimum changes.
  - [QMUserCorrelation.php#L2657-L2700](https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php#L2657)
- **Optimitron**: `validateDataQuality()` in `packages/optimizer/src/predictor-impact-score.ts`

---

## 2. Features NOT Yet Ported to Optimitron

### ❌ Aggregate Correlation (Population-Level Analysis Pipeline)
- **Legacy API**: `QMAggregateCorrelation::analyzeFully()` — aggregates NOf1VariableRelationships across multiple users via weighted averaging by statistical significance.
  - [QMAggregateCorrelation.php#L642](https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMAggregateCorrelation.php#L642)
- **Priority**: HIGH
- **Target package**: `packages/optimizer/src/` — add `aggregate-correlations.ts`
- **Description**: Takes all user-level NOf1VariableRelationships for the same predictor-outcome pair and produces a single AggregateVariableRelationship with weighted-average statistics.

### ❌ Vote-Weighted Statistical Significance
- **Legacy API**: Users can upvote/downvote correlations. Vote significance = `(upVotes + 4) / (upVotes + downVotes + 4)` (Bayesian prior). This multiplies into statistical significance.
  - [CorrelationStatisticalSignificanceProperty.php#L48-L57](https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationStatisticalSignificanceProperty.php#L48)
- **Priority**: MEDIUM
- **Target package**: `packages/optimizer/src/` — extend `predictor-impact-score.ts`

### ❌ Interesting Factor / Boring/Obvious Filtering
- **Legacy API**: `isInteresting()` method filters out "boring" or "obvious" correlations (e.g., same category predictor-outcome, non-controllable predictors). The `interestingFactor` multiplies into QM Score.
  - [HasCorrelationCoefficient trait](https://github.com/mikepsinn/curedao-api/blob/main/app/Traits/HasCorrelationCoefficient.php)
- **Priority**: MEDIUM
- **Target package**: `packages/optimizer/src/` — add `interest-filter.ts`

### ❌ P-Value Calculation (T-Test Based)
- **Legacy API**: Separate P-value from the t-test between high-effect and low-effect outcome groups:
  `p = (1/√(2π)) × e^(-0.5 × t²)` where t = |meanHigh - meanLow| / SE
  - [QMUserCorrelation.php#L2373-L2430](https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php#L2373)
- **Priority**: HIGH
- **Target package**: `packages/optimizer/src/statistics.ts`

### ❌ Unit Conversion System
- **Legacy API**: `QMUnit::convertTo()` — full unit conversion system with conversion steps, min/max validation.
  - [QMUnit.php#L1102](https://github.com/mikepsinn/curedao-api/blob/main/app/Slim/Model/QMUnit.php#L1102)
- **Priority**: HIGH
- **Target package**: `packages/data/src/` — add `units/` directory

### ❌ Daily Value Aggregation Pipeline
- **Legacy API**: `QMUserVariable::getDailyMeasurementsWithTagsAndFillingInTimeRange()` — aggregates raw measurements into daily values:
  1. Group by day
  2. Apply combination operation (SUM or MEAN)
  3. Apply tag-based joined children (e.g., "Ibuprofen" parent includes "Advil" child)
  4. Apply filling values for missing days
  - [QMUserVariable.php#L1611](https://github.com/mikepsinn/curedao-api/blob/main/app/Variables/QMUserVariable.php#L1611)
- **Priority**: HIGH
- **Target package**: `packages/optimizer/src/` — add `daily-aggregation.ts`

### ❌ Variable Tagging / Common Tags (Parent-Child Relationships)
- **Legacy API**: `CommonTag` model — allows hierarchical variable relationships.
  - [CommonTag.php](https://github.com/mikepsinn/curedao-api/blob/main/app/Models/CommonTag.php)
- **Priority**: MEDIUM
- **Target package**: `packages/db/prisma/schema.prisma` — add CommonTag model

### ❌ User Variable Statistics Calculation
- **Legacy API**: `QMUserVariable::calculateAttributes()` — calculates per-user-variable running statistics.
  - [QMUserVariable.php#L6536](https://github.com/mikepsinn/curedao-api/blob/main/app/Variables/QMUserVariable.php#L6536)
- **Priority**: MEDIUM
- **Target package**: `packages/optimizer/src/` — add `variable-statistics.ts`

### ❌ Global Variable Statistics Aggregation
- **Legacy API**: `QMCommonVariable` — aggregates statistics across all units.
  - [QMCommonVariable.php](https://github.com/mikepsinn/curedao-api/blob/main/app/Variables/QMCommonVariable.php)
- **Priority**: MEDIUM
- **Target package**: `packages/optimizer/src/` — add `global-variable-stats.ts`

### ❌ OAuth2 Connector Framework (Live API Integration)
- **Legacy API**: Full OAuth2 connector framework with token refresh, rate limiting, pagination.
  - [OAuth2Connector base](https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/OAuth2Connector.php)
- **Priority**: MEDIUM
- **Target package**: `packages/data/src/connectors/` (new directory)

### ❌ Measurement Value Validation
- **Legacy API**: `validateValueForCommonVariableAndUnit()` — validates measurement values against min/max.
  - [QMUserVariable.php](https://github.com/mikepsinn/curedao-api/blob/main/app/Variables/QMUserVariable.php)
- **Priority**: HIGH
- **Target package**: `packages/data/src/` — add `validation.ts`

### ❌ Variable Category Seed Data
- **Legacy API**: ~30 hardcoded category classes with defaults for onset delay, duration of action, combination operation, filling value.
  - [VariableCategories/](https://github.com/mikepsinn/curedao-api/blob/main/app/VariableCategories/)
- **Priority**: HIGH
- **Target package**: `packages/db/prisma/seed.ts`

### ❌ Tracking Reminders & Notifications Pipeline
- **Legacy API**: Full tracking reminder system with push notifications.
  - [TrackingReminder.php](https://github.com/mikepsinn/curedao-api/blob/main/app/Models/TrackingReminder.php)
- **Priority**: LOW

### ❌ Study Generation & Publishing
- **Legacy API**: Generates full study reports with charts, HTML, text descriptions.
  - [Studies/](https://github.com/mikepsinn/curedao-api/blob/main/app/Studies/)
- **Priority**: LOW

### ❌ Analysis Queue / Scheduling
- **Legacy API**: `AnalyzableTrait` — manages analysis scheduling with error tracking.
  - [AnalyzableTrait.php](https://github.com/mikepsinn/curedao-api/blob/main/app/Traits/AnalyzableTrait.php)
- **Priority**: MEDIUM

### ❌ Optimal Pearson Product
- **Legacy API**: `|r| × changeSpread` or `|r| × statisticalSignificance`.
  - [QMUserCorrelation.php#L1850](https://github.com/mikepsinn/curedao-api/blob/main/app/Correlations/QMUserCorrelation.php#L1850)
- **Priority**: LOW

### ❌ Grouped Cause Value Rounding
- **Legacy API**: Rounds optimal predictor values to practical actionable amounts.
  - [CorrelationGroupedCauseValueClosestToValuePredictingHighOutcomeProperty.php](https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationGroupedCauseValueClosestToValuePredictingHighOutcomeProperty.php)
- **Priority**: LOW

### ❌ Confidence Level / Strength Level Assignment
- **Legacy API**: Assigns HIGH/MEDIUM/LOW confidence and VERY_STRONG/STRONG/MODERATE/WEAK/VERY_WEAK strength.
- **Priority**: LOW

### ❌ Skewness & Kurtosis in QM Score
- **Legacy API**: Legacy `Stats::qmScore()` factors in distribution shape.
  - [Stats.php#L160-L195](https://github.com/mikepsinn/curedao-api/blob/main/app/Utils/Stats.php#L160)
- **Priority**: LOW

---

## 3. Data Import / Connector Gaps

### 🔶 Fitbit Importer
- **Legacy API**: Full OAuth2 live connector with sleep stages, heart rate zones, intraday activity.
  - [FitbitConnector.php](https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/FitbitConnector.php)
- **Optimitron**: File-based export parser for sleep, steps, heart rate, exercise, body.

### 🔶 Withings / Google Fit / Oura / Strava / MyFitnessPal
- All have Legacy API live OAuth2 connectors vs Optimitron file-based parsers.

### ❌ Missing Connectors (Legacy API has, Optimitron doesn't)
| Connector | Legacy API File | Priority |
|-----------|-------------|----------|
| Weather | [WeatherConnector.php](https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/WeatherConnector.php) | MEDIUM |
| Air Quality | [AirQualityConnector.php](https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/AirQualityConnector.php) | MEDIUM |
| RescueTime | [RescueTimeConnector.php](https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/RescueTimeConnector.php) | LOW |
| GitHub | [GithubConnector.php](https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/GithubConnector.php) | LOW |
| Sleep as Android | [SleepAsAndroidConnector.php](https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/SleepAsAndroidConnector.php) | LOW |
| Netatmo | [NetatmoConnector.php](https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/NetatmoConnector.php) | LOW |
| Daylight | [DaylightConnector.php](https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/DaylightConnector.php) | LOW |

---

## 4. Schema / Model Gaps

### ❌ CommonTag (Variable Parent-Child Hierarchy)
- **Legacy API**: `common_tags` table links tagged variables to parent variables with conversion factors.
- **Target**: `packages/db/prisma/schema.prisma`
- **Priority**: MEDIUM

### ❌ CorrelationCausalityVote / CorrelationUsefulnessVote
- **Legacy API**: Separate voting models for causality and usefulness.
- **Target**: `packages/db/prisma/schema.prisma`
- **Priority**: MEDIUM

### ❌ Study Model
- **Legacy API**: `studies` table with study types (individual, population, cohort).
- **Target**: `packages/db/prisma/schema.prisma`
- **Priority**: LOW

---

## 5. Priority Summary

### HIGH Priority (Core Analysis Features)
1. Daily Value Aggregation Pipeline
2. Unit Conversion System
3. Aggregate Correlation Pipeline
4. P-Value T-Test (high vs low outcome groups)
5. Measurement Value Validation
6. Variable Category Seed Data

### MEDIUM Priority (Quality & Features)
7. Vote-Weighted Significance
8. Interesting Factor / Boring Filter
9. User Variable Statistics
10. Global Variable Statistics
11. CommonTag Model
12. Analysis Queue / Scheduling
13. Auto-Reverse Pair Generation
14. OAuth2 Connector Framework

### LOW Priority (Nice to Have)
15. Study Generation
16. Optimal Pearson Product
17. Skewness/Kurtosis Scoring
18. Grouped Cause Value Rounding
19. Confidence/Strength Level Assignment
20. Additional Connectors (Weather, RescueTime, etc.)

