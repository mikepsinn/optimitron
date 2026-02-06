# QuantiModo → Optomitron Gap Analysis

Cross-reference audit of QuantiModo API (PHP) features vs Optomitron (TypeScript) implementations.
Performed 2026-02-06. QuantiModo source: https://github.com/mikepsinn/quantimodo-api/blob/main/

## Legend

| Status | Meaning |
|--------|---------|
| ✅ | Implemented in Optomitron |
| 🔶 | Partially implemented |
| ❌ | Not yet ported — needs implementation |

---

## 1. Correlation / Relationship Analysis

### ✅ Pearson Correlation Coefficient
- **QuantiModo**: `Stats::calculatePearsonCorrelationCoefficient()` — covariance / (stddevX × stddevY)
  - [Stats.php#L352](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Utils/Stats.php#L352)
  - [CorrelationForwardPearsonCorrelationCoefficientProperty.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Properties/Correlation/CorrelationForwardPearsonCorrelationCoefficientProperty.php)
- **Optomitron**: `pearsonCorrelation()` in `packages/optimizer/src/statistics.ts`
- **Notes**: Implementations are equivalent. Both use standard formula.

### ✅ Spearman Rank Correlation
- **QuantiModo**: `CorrelationForwardSpearmanCorrelationCoefficientProperty::calculate()`
  - [QMUserCorrelation.php#L622](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Correlations/QMUserCorrelation.php#L622)
- **Optomitron**: `spearmanCorrelation()` in `packages/optimizer/src/statistics.ts`
- **Notes**: Both convert to ranks and compute Pearson on ranks.

### 🔶 Reverse Pearson Correlation
- **QuantiModo**: `CorrelationReversePearsonCorrelationCoefficientProperty::calculate()` — swaps cause/effect roles to test whether causality direction is correct.
  - [CorrelationReversePearsonCorrelationCoefficientProperty.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Properties/Correlation/CorrelationReversePearsonCorrelationCoefficientProperty.php)
- **Optomitron**: Supported via `reversePairs` parameter in `calculatePredictorImpactScore()`, but not automatically calculated from the same data. The caller must construct reverse pairs explicitly.
- **Gap**: Optomitron should auto-generate reverse-aligned pairs when forward pairs are provided.

### ✅ Predictive Pearson Correlation
- **QuantiModo**: `predictivePearsonCorrelationCoefficient = forwardPearson - reversePearson`
  - [CorrelationPredictivePearsonCorrelationCoefficientProperty.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Properties/Correlation/CorrelationPredictivePearsonCorrelationCoefficientProperty.php)
- **Optomitron**: Captured in `temporalityFactor = |r_forward| / (|r_forward| + |r_reverse|)` — different formula but same intent (penalizing reverse causation).
- **Notes**: Consider adding the subtraction-based metric as well for QuantiModo parity.

### ✅ Temporal Alignment (Onset Delay / Duration of Action)
- **QuantiModo**: Two pairing strategies — `setPairsBasedOnDailyCauseValues()` (predictor-based) and `setPairsBasedOnDailyEffectValues()` (outcome-based, used when cause has a filling value).
  - [QMUserCorrelation.php#L899-L975](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Correlations/QMUserCorrelation.php#L899)
  - Uses `GetPairRequest::createAbsolutePairs()` and `createPairForEachEffectMeasurement()`
- **Optomitron**: `alignOutcomeBased()` and `alignPredictorBased()` in `packages/optimizer/src/temporal-alignment.ts`
- **Notes**: Core logic matches. QuantiModo selects strategy based on `hasFillingValue()`, Optomitron on `fillingType !== 'none'`.

### ✅ Onset Delay Optimization (Grid Search)
- **QuantiModo**: `calculateCorrelationsOverOnsetDelaysAndGenerateChartConfig()` — iterates over multiple onset delay values, computing correlation at each, finding the strongest.
  - [QMUserCorrelation.php#L1876](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Correlations/QMUserCorrelation.php#L1876)
  - Also searches over durations via `calculateCorrelationOverDurationsOfActionAndGenerateChartConfig()`
- **Optomitron**: `optimizeTemporalParameters()` in `packages/optimizer/src/temporal-alignment.ts`
- **Notes**: Both do grid search. QuantiModo stores results per hyper-parameter combination.

### ✅ Predictor Impact Score (PIS) / QM Score
- **QuantiModo**: `CorrelationQmScoreProperty::calculateQmScore()` — `|coefficient| × statisticalSignificance × interestingFactor + aggregateScore`
  - [CorrelationQmScoreProperty.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Properties/Correlation/CorrelationQmScoreProperty.php)
  - Also older `Stats::qmScore()` which factors in skewness, kurtosis, predictive difference
  - [Stats.php#L160](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Utils/Stats.php#L160)
- **Optomitron**: `calculatePredictorImpactScore()` — `r × S × φZ × temporalityFactor × φUsers × φPairs`
  - `packages/optimizer/src/predictor-impact-score.ts`
- **Notes**: Different formulas but same purpose. QuantiModo's simplified formula is `|r| × significance`. Optomitron's is more nuanced with Bradford Hill factors. QuantiModo also has a legacy formula that uses skewness/kurtosis coefficients.

### ✅ Statistical Significance
- **QuantiModo**: `CorrelationStatisticalSignificanceProperty::calculate()` — product of 6 saturation factors:
  `rawCauseMeasurementSignificance × rawEffectMeasurementSignificance × numberOfDaysSignificance × causeChangesStatisticalSignificance × allPairsSignificance × voteStatisticalSignificance`
  Each uses `1 - exp(-x / 30)`.
  - [CorrelationStatisticalSignificanceProperty.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Properties/Correlation/CorrelationStatisticalSignificanceProperty.php)
- **Optomitron**: Uses p-value from t-test, saturation on pairs and users.
- **Notes**: QuantiModo's significance includes vote-based weighting and per-dimension saturation curves. Optomitron should consider porting the vote-weighted significance approach.

### ✅ Bradford Hill Criteria Scoring
- **QuantiModo**: Implicit — uses temporal asymmetry, sample size, effect magnitude, but doesn't explicitly name Bradford Hill criteria.
- **Optomitron**: Explicit Bradford Hill scoring in both `packages/optimizer/src/predictor-impact-score.ts` (health) and `packages/opg/src/bradford-hill.ts` (policy).
- **Notes**: Optomitron is more advanced here with named criteria.

### ✅ Z-Score Calculation
- **QuantiModo**: `CorrelationZScoreProperty::calculate()` — `|effectFollowUpPercentChange| / baselineEffectRelativeStandardDeviation`
  - [CorrelationZScoreProperty.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Properties/Correlation/CorrelationZScoreProperty.php)
- **Optomitron**: `zScore` in `calculateEffectSize()` — `|percentChange| / (baselineStd/baselineMean × 100)` (RSD-based)
- **Notes**: Same formula (effect magnitude relative to baseline variability).

### ✅ Optimal Value Analysis
- **QuantiModo**: `CorrelationValuePredictingHighOutcomeProperty` and `CorrelationValuePredictingLowOutcomeProperty` — splits pairs by effect value relative to mean, averages the cause values in each group.
  - [QMUserCorrelation.php#L2351-L2600](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Correlations/QMUserCorrelation.php#L2351)
- **Optomitron**: `calculateOptimalValues()` in `packages/optimizer/src/predictor-impact-score.ts`
- **Notes**: Equivalent logic. Both split on outcome mean and average predictor values.

### ✅ Effect Size / Baseline vs Follow-up
- **QuantiModo**: `calculateOutcomeBaselineStatistics()` — generates baseline and follow-up pairs by comparing cause values to mean cause, then computes effect change from baseline.
  - [QMUserCorrelation.php#L2811](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Correlations/QMUserCorrelation.php#L2811)
  - `generateBaselineAndFollowupPairs()` at L2870
- **Optomitron**: `calculateEffectSize()` in `packages/optimizer/src/statistics.ts`
- **Notes**: Same approach — partition by predictor mean, compare outcome in each partition.

### ✅ Data Quality Validation
- **QuantiModo**: Multiple checks: minimum measurement counts, variance requirements, chronological ordering, unique value counts, minimum changes.
  - [QMUserCorrelation.php#L2657-L2700](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Correlations/QMUserCorrelation.php#L2657)
- **Optomitron**: `validateDataQuality()` in `packages/optimizer/src/predictor-impact-score.ts`
- **Notes**: Optomitron checks variance, minimum pairs, baseline/follow-up fractions. QuantiModo also checks chronological order and minimum unique values.

---

## 2. Features NOT Yet Ported to Optomitron

### ❌ Aggregate Correlation (Population-Level Analysis Pipeline)
- **QuantiModo**: `QMAggregateCorrelation::analyzeFully()` — aggregates UserCorrelations across multiple users via weighted averaging by statistical significance.
  - [QMAggregateCorrelation.php#L642](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Correlations/QMAggregateCorrelation.php#L642)
  - `HasCalculatedAttributes` trait computes weighted averages of all correlation properties
- **Priority**: HIGH
- **Target package**: `packages/optimizer/src/` — add `aggregate-correlations.ts`
- **Description**: Takes all user-level UserVariableRelationships for the same predictor-outcome pair and produces a single GlobalVariableRelationship with weighted-average statistics. QuantiModo weights by `statisticalSignificance`. Also computes `numberOfUsers`, `aggregate_qm_score`.

### ❌ Vote-Weighted Statistical Significance
- **QuantiModo**: Users can upvote/downvote correlations. Vote significance = `(upVotes + 4) / (upVotes + downVotes + 4)` (Bayesian prior). This multiplies into statistical significance.
  - [CorrelationStatisticalSignificanceProperty.php#L48-L57](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Properties/Correlation/CorrelationStatisticalSignificanceProperty.php#L48)
- **Priority**: MEDIUM
- **Target package**: `packages/optimizer/src/` — extend `predictor-impact-score.ts`
- **Description**: Allows community feedback to modulate confidence in correlations. Prevents noisy or obviously spurious correlations from ranking highly.

### ❌ Interesting Factor / Boring/Obvious Filtering
- **QuantiModo**: `isInteresting()` method filters out "boring" or "obvious" correlations (e.g., same category predictor-outcome, non-controllable predictors). The `interestingFactor` multiplies into QM Score.
  - [QMUserCorrelation.php and HasCorrelationCoefficient trait](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Traits/HasCorrelationCoefficient.php)
- **Priority**: MEDIUM
- **Target package**: `packages/optimizer/src/` — add `interest-filter.ts`
- **Description**: Prevents trivial relationships (e.g., "Steps → Walking Distance") from cluttering results. Uses variable category pairs and controllability flags.

### ❌ P-Value Calculation (T-Test Based)
- **QuantiModo**: Separate P-value from the t-test between high-effect and low-effect outcome groups (not just the correlation p-value):
  `p = (1/√(2π)) × e^(-0.5 × t²)` where t = |meanHigh - meanLow| / SE
  - [QMUserCorrelation.php#L2373-L2430](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Correlations/QMUserCorrelation.php#L2373)
- **Priority**: HIGH
- **Target package**: `packages/optimizer/src/statistics.ts`
- **Description**: Tests whether the difference between outcomes when predictor is high vs low is statistically significant. Different from the correlation p-value (which tests r ≠ 0). Includes confidence interval and critical t-value computation.

### ❌ Optimal Pearson Product
- **QuantiModo**: `CorrelationOptimalPearsonProductProperty::calculateOptimalPearsonProduct()` — `|r| × changeSpread` or `|r| × statisticalSignificance`, factoring in predictive spread.
  - [QMUserCorrelation.php#L1850](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Correlations/QMUserCorrelation.php#L1850)
- **Priority**: LOW
- **Target package**: `packages/optimizer/src/predictor-impact-score.ts`
- **Description**: Composite metric that combines correlation strength with the practical magnitude of the effect spread. Used in QM Score calculation.

### ❌ Correlations Over Onset Delays Chart Data
- **QuantiModo**: Stores `correlations_over_delays` as a JSON map `{delay_seconds: correlation}` and `correlations_over_durations` similarly. Used for visualization.
  - [QMUserCorrelation.php#L1876](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Correlations/QMUserCorrelation.php#L1876)
- **Priority**: LOW
- **Target package**: `packages/optimizer/src/temporal-alignment.ts`
- **Description**: `optimizeTemporalParameters()` already returns `searchResults[]` which contains this data. Just need to surface it in the API response format.

### ❌ Strongest Pearson Correlation (Across Onset Delays)
- **QuantiModo**: `CorrelationStrongestPearsonCorrelationCoefficientProperty` and `CorrelationOnsetDelayWithStrongestPearsonCorrelationProperty` — stored separately from forward correlation.
  - [QMUserCorrelation.php#L1883-L1886](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Correlations/QMUserCorrelation.php#L1883)
- **Priority**: MEDIUM
- **Target package**: `packages/optimizer/src/temporal-alignment.ts`
- **Description**: Already computed by `optimizeTemporalParameters()` — just needs to be stored in the analysis result.

### ❌ Unit Conversion System
- **QuantiModo**: `QMUnit::convertTo()` — full unit conversion system with conversion steps (multiply, add operations), minimum/maximum validation, unit category hierarchy.
  - [QMUnit.php#L1102](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Slim/Model/QMUnit.php#L1102)
  - Supports: weight, volume, count, rating, currency, percent, duration, distance, energy, temperature
  - Also: `convertToYesNoFromRating()`, `convertToYesNoFromCountCategory()`
- **Priority**: HIGH
- **Target package**: `packages/data/src/` — add `units/` directory
- **Description**: Convert between measurement units (mg→g, minutes→hours, etc.). QuantiModo has ~100+ unit definitions with conversion rules. Optomitron's Prisma schema has Unit model with `conversionSteps` field but no runtime conversion logic.

### ❌ Daily Value Aggregation Pipeline
- **QuantiModo**: `QMUserVariable::getDailyMeasurementsWithTagsAndFillingInTimeRange()` — aggregates raw measurements into daily values:
  1. Group by day
  2. Apply combination operation (SUM or MEAN)
  3. Apply tag-based joined children (e.g., "Ibuprofen" parent includes "Advil" child)
  4. Apply filling values for missing days
  - [QMUserVariable.php#L1611](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Variables/QMUserVariable.php#L1611)
  - [QMUserVariable.php#L3781](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Variables/QMUserVariable.php#L3781)
- **Priority**: HIGH
- **Target package**: `packages/optimizer/src/` — add `daily-aggregation.ts`
- **Description**: Critical preprocessing step before correlation analysis. Raw measurements must be collapsed to daily values, with missing days filled according to the variable's filling type. Also handles tag-based variable aggregation (child → parent summation).

### ❌ Variable Tagging / Common Tags (Parent-Child Relationships)
- **QuantiModo**: `CommonTag` model — allows hierarchical variable relationships. E.g., "Advil 200mg" → "Ibuprofen" → "NSAIDs". When computing daily values, child variable measurements are summed into parent.
  - [CommonTag.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Models/CommonTag.php)
  - [CommonTagTrait.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Traits/ModelTraits/CommonTagTrait.php)
- **Priority**: MEDIUM
- **Target package**: `packages/db/prisma/schema.prisma` — add CommonTag model, then `packages/data/src/`
- **Description**: Enables ingredient-level tracking while analyzing at the compound level. Important for nutritional and pharmaceutical analysis.

### ❌ User Variable Statistics Calculation
- **QuantiModo**: `QMUserVariable::calculateAttributes()` — calculates per-user-variable running statistics: mean, median, stddev, variance, kurtosis, skewness, min/max recorded values, number of unique values, most common values, data source counts.
  - [QMUserVariable.php#L6536](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Variables/QMUserVariable.php#L6536)
- **Priority**: MEDIUM
- **Target package**: `packages/optimizer/src/` — add `variable-statistics.ts`
- **Description**: Running statistics updated on each new measurement. Used for data quality checks, normalization, and optimal value interpretation. Optomitron schema has the fields but no calculation logic.

### ❌ Global Variable Statistics Aggregation
- **QuantiModo**: `QMCommonVariable` — aggregates statistics across all users: global mean, median, standard deviation, number of user variables, total measurements, best cause/effect variables.
  - [QMCommonVariable.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Variables/QMCommonVariable.php)
- **Priority**: MEDIUM
- **Target package**: `packages/optimizer/src/` — add `global-variable-stats.ts`
- **Description**: Population-level variable statistics. Feeds into GlobalVariableRelationship analysis.

### ❌ OAuth2 Connector Framework (Live API Integration)
- **QuantiModo**: Full OAuth2 connector framework with `OAuth2Connector` base class, token refresh, rate limiting, pagination, error handling.
  - [OAuth2Connector base](https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/OAuth2Connector.php)
  - Connectors: Fitbit, Withings, Oura, Strava, Google Fit, RescueTime, etc.
  - Includes: token persistence, automatic refresh, rate limit handling
- **Priority**: MEDIUM
- **Target package**: `packages/data/src/connectors/` (new directory)
- **Description**: Optomitron currently only has file-based importers (parse exported data). QuantiModo has live API connectors with OAuth2 flows for real-time data sync. Different concern — Optomitron importers parse exports; QuantiModo connectors pull from APIs.

### ❌ Measurement Value Validation
- **QuantiModo**: `validateValueForCommonVariableAndUnit()` — validates measurement values against variable's min/max allowed values, unit constraints, and data type.
  - [QMUserVariable.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Variables/QMUserVariable.php)
  - Also: `InvalidVariableValueException` thrown when out of range
- **Priority**: HIGH
- **Target package**: `packages/data/src/` — add `validation.ts`
- **Description**: Prevents erroneous data from corrupting analysis. Checks: value within unit min/max, value within variable min/max, non-negative for ratio scale, rating within bounds.

### ❌ Tracking Reminders & Notifications Pipeline
- **QuantiModo**: Full tracking reminder system — schedules, sends, and processes tracking reminder notifications. Includes push notifications (FCM/APN), email reminders, and notification action handling.
  - [TrackingReminder.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Models/TrackingReminder.php)
  - [TrackingReminderNotification.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Models/TrackingReminderNotification.php)
- **Priority**: LOW (Optomitron schema has the models but no business logic)
- **Target package**: `packages/data/src/` — add `reminders/`
- **Description**: Schema exists in Optomitron but no reminder scheduling, sending, or processing logic.

### ❌ Study Generation & Publishing
- **QuantiModo**: `QMUserStudy`, `QMPopulationStudy`, `QMCohortStudy` — generates full study reports with charts, HTML, text descriptions, sharing, and WordPress publishing.
  - [QMUserStudy, QMPopulationStudy](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Studies/)
  - Includes: StudyHtml, StudyText, StudyImages, StudyLinks, StudyCard
- **Priority**: LOW
- **Target package**: New `packages/studies/` or `packages/reports/`
- **Description**: Generates human-readable study reports from correlation analyses. Good for sharing results.

### ❌ Variable Category System (With Defaults)
- **QuantiModo**: `QMVariableCategory` — each category has defaults for onset delay, duration of action, combination operation, filling value, min/max values, whether it's a predictor-only or outcome category, and more.
  - [VariableCategory model + ~30 hardcoded category classes](https://github.com/mikepsinn/quantimodo-api/blob/main/app/VariableCategories/)
  - E.g., Treatments: fillingValue=0, combinationOp=SUM, predictorOnly=true
  - E.g., Symptoms: fillingValue=null, combinationOp=MEAN, outcome=true
- **Priority**: HIGH
- **Target package**: `packages/db/prisma/seed.ts` and `packages/data/src/`
- **Description**: Optomitron has the VariableCategory model but needs seed data with sensible defaults. Critical for correct analysis — e.g., treatments should default to SUM with zero-filling, symptoms to MEAN with no filling.

### ❌ Analysis Queue / Scheduling
- **QuantiModo**: `AnalyzableTrait` — manages analysis scheduling with `analysis_requested_at`, `analysis_started_at`, `analysis_ended_at`, error tracking, and `analyzeIfNecessary()` logic.
  - [AnalyzableTrait.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Traits/AnalyzableTrait.php)
  - Also: `QMAnalyzableTrait` with `beforeAnalysis()`, `afterAnalysis()`, `AlreadyAnalyzedException`
- **Priority**: MEDIUM
- **Target package**: `packages/optimizer/src/` — add `analysis-queue.ts`
- **Description**: Manages when variables and correlations need re-analysis (new data triggers), prevents duplicate analysis, tracks analysis errors.

### ❌ Skewness & Kurtosis in QM Score
- **QuantiModo**: Legacy `Stats::qmScore()` factors in distribution shape (skewness/kurtosis coefficients) to penalize non-normal distributions.
  - [Stats.php#L160-L195](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Utils/Stats.php#L160)
- **Priority**: LOW
- **Target package**: `packages/optimizer/src/statistics.ts`
- **Description**: `skewnessCoefficient = 1/(1+skew²) × 1/(1+effectSkew²)` — reduces score for heavily skewed data. Currently unused in QuantiModo's simplified QM score but available.

### ❌ Grouped Cause Value (Rounding for Display)
- **QuantiModo**: `CorrelationGroupedCauseValueClosestToValuePredictingHighOutcomeProperty` — rounds optimal predictor values to practical actionable amounts (e.g., "Take 200mg" instead of "Take 198.7mg").
  - [CorrelationGroupedCauseValueClosestToValuePredictingHighOutcomeProperty.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Properties/Correlation/CorrelationGroupedCauseValueClosestToValuePredictingHighOutcomeProperty.php)
- **Priority**: LOW
- **Target package**: `packages/optimizer/src/predictor-impact-score.ts`
- **Description**: Already in Optomitron's type definition (`groupedValueHigh`, `groupedValueLow`) but no calculation logic.

### ❌ Confidence Interval & Confidence Level Assignment
- **QuantiModo**: `CorrelationConfidenceIntervalProperty::calculate()` — `standardError × criticalTValue`. Plus `CorrelationConfidenceLevelProperty` assigns HIGH/MEDIUM/LOW based on thresholds.
  - [QMCorrelation.php#L614](https://github.com/mikepsinn/quantimodo-api/blob/main/app/Correlations/QMCorrelation.php#L614)
- **Priority**: MEDIUM
- **Target package**: `packages/optimizer/src/statistics.ts`
- **Description**: Optomitron calculates confidence interval for correlation via Fisher z-transform, but doesn't have the effect-size confidence interval or the categorical HIGH/MEDIUM/LOW assignment that QuantiModo uses.

### ❌ Strength Level Assignment
- **QuantiModo**: `CorrelationStrengthLevelProperty` — assigns VERY_STRONG/STRONG/MODERATE/WEAK/VERY_WEAK based on |r| thresholds (>0.7, >0.4, >0.2, etc.).
- **Priority**: LOW
- **Target package**: `packages/optimizer/src/predictor-impact-score.ts`
- **Description**: Optomitron has the enum in Prisma schema but no assignment logic.

### ❌ Relationship Direction Assignment
- **QuantiModo**: `CorrelationRelationshipProperty` — assigns "positive", "negative", or "none" based on correlation sign and significance.
- **Priority**: LOW
- **Target package**: `packages/optimizer/src/predictor-impact-score.ts`
- **Description**: Simple sign-based classification. Optomitron has the enum but no calculation.

---

## 3. Data Import / Connector Gaps

### 🔶 Fitbit Importer
- **QuantiModo**: Full OAuth2 live connector with sleep stages, heart rate zones, activity intraday, body composition, food logging.
  - [FitbitConnector.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/FitbitConnector.php)
- **Optomitron**: File-based export parser for sleep, steps, heart rate, exercise, body.
  - `packages/data/src/importers/fitbit.ts`
- **Gap**: QuantiModo extracts more granular data (sleep stages breakdown, heart rate zones, intraday activity). Optomitron covers the main categories from export files.

### 🔶 Withings Importer
- **QuantiModo**: Live OAuth2 connector.
  - [WithingsConnector.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/WithingsConnector.php)
- **Optomitron**: File-based CSV export parser.
  - `packages/data/src/importers/withings.ts`

### ❌ Missing Connectors (QuantiModo has, Optomitron doesn't)
| Connector | QuantiModo File | Priority |
|-----------|-------------|----------|
| RescueTime | [RescueTimeConnector.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/RescueTimeConnector.php) | LOW |
| Weather | [WeatherConnector.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/WeatherConnector.php) | MEDIUM |
| GitHub | [GithubConnector.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/GithubConnector.php) | LOW |
| Sleep as Android | [SleepAsAndroidConnector.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/SleepAsAndroidConnector.php) | LOW |
| Netatmo (Air Quality) | [NetatmoConnector.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/NetatmoConnector.php) | LOW |
| Air Quality | [AirQualityConnector.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/AirQualityConnector.php) | MEDIUM |
| Pollen Count | [PollenCountConnector.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/PollenCountConnector.php) | LOW |
| Daylight | [DaylightConnector.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/DaylightConnector.php) | LOW |
| MoodPanda | [MoodPandaConnector.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/MoodPandaConnector.php) | LOW |
| WhatPulse | [WhatPulseConnector.php](https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/WhatPulseConnector.php) | LOW |

---

## 4. Schema / Model Gaps

### ❌ CommonTag (Variable Parent-Child Hierarchy)
- **QuantiModo**: `common_tags` table links tagged variables to parent variables with conversion factors.
- **Target**: `packages/db/prisma/schema.prisma`
- **Priority**: MEDIUM

### ❌ UserTag (Per-User Variable Aliases)
- **QuantiModo**: `user_tags` table allows per-user variable aliasing and grouping.
- **Target**: `packages/db/prisma/schema.prisma`
- **Priority**: LOW

### ❌ CorrelationCausalityVote / CorrelationUsefulnessVote
- **QuantiModo**: Separate voting models for causality and usefulness.
- **Target**: `packages/db/prisma/schema.prisma`
- **Priority**: MEDIUM

### ❌ ConnectorImport / ConnectorRequest Logging
- **QuantiModo**: Detailed logging of each import run and API request for debugging.
- **Target**: `packages/db/prisma/schema.prisma` — already partially covered by `IntegrationSyncLog`
- **Priority**: LOW

### ❌ Study Model
- **QuantiModo**: `studies` table with study types (individual, population, cohort), HTML, images, links.
- **Target**: `packages/db/prisma/schema.prisma`
- **Priority**: LOW

---

## 5. Priority Summary

### HIGH Priority (Core Analysis Features)
1. **Daily Value Aggregation Pipeline** — preprocessing before correlation analysis
2. **Unit Conversion System** — runtime unit conversion logic
3. **Aggregate Correlation Pipeline** — population-level analysis from user-level results
4. **P-Value T-Test** — statistical test for high vs low predictor outcome difference
5. **Measurement Value Validation** — data quality at ingestion time
6. **Variable Category Seed Data** — sensible defaults for analysis parameters

### MEDIUM Priority (Quality & Features)
7. **Vote-Weighted Significance** — community feedback integration
8. **Interesting Factor / Boring Filter** — noise reduction in results
9. **Strongest Pearson Across Delays** — store best onset delay result
10. **User Variable Statistics** — running stats per user-variable
11. **Global Variable Statistics** — population-level variable stats
12. **Confidence Level / Strength Level Assignment** — categorical quality labels
13. **Auto-Reverse Pair Generation** — auto-compute reverse correlation
14. **CommonTag Model** — variable hierarchy for ingredient-level tracking
15. **Analysis Queue / Scheduling** — re-analysis triggers and deduplication

### LOW Priority (Nice to Have)
16. **Study Generation** — human-readable reports
17. **Optimal Pearson Product** — legacy composite metric
18. **Skewness/Kurtosis Scoring** — distribution shape penalties
19. **Grouped Cause Value Rounding** — actionable dosage rounding
20. **Relationship Direction Assignment** — sign-based classification
21. **Correlations Over Delays Chart Data** — visualization data format
22. **Additional Connectors** — Weather, RescueTime, etc.
