# Pair Study: Tax Revenue (% GDP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.wb.tax_revenue_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 1
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.4038
- Included subjects: 146
- Skipped subjects: 0
- Total aligned pairs: 3066
- Evidence grade: F
- Direction: positive
- Derived uncertainty score: 0.8385 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Tax Revenue (% GDP) level for higher Healthy Life Expectancy Growth (YoY %): 3.26e-4 % GDP.
- Approximate per-capita PPP equivalent of that best level: 0.03427 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Tax Revenue (% GDP) is in [5.13e-12, 1.00e-5) (mean outcome 0.42876).
- PPP per-capita equivalent in that best observed bin (p10-p90): [1.25e-7, 2.53e-4].
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Practical direction: increase Tax Revenue (% GDP) toward the estimated best level, then monitor Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Tax Revenue (% GDP) tends to align with better Healthy Life Expectancy Growth (YoY %).
- The estimate uses 146 subjects and 3066 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [5.13e-12, 1.00e-5) (mean outcome 0.42876).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0169); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.0049 |
| Aggregate reverse Pearson | -0.1256 |
| Aggregate directional score (forward - reverse) | 0.1206 |
| Aggregate effect size (% baseline delta) | 0.0000 |
| Aggregate statistical significance | 0.1615 |
| Weighted average PIS | 0.0428 |
| Aggregate value predicting high outcome | 0.0003 |
| Aggregate value predicting low outcome | 0.0003 |
| Aggregate optimal daily value | 0.0003 |
| Observed predictor range | [0.0000, 0.0258] |
| Estimated best level (PPP per-capita equivalent) | 0.03427 international $/person |
| Best observed PPP per-capita range (p10-p90) | [1.25e-7, 2.53e-4] |
| Median GDP per-capita PPP (context) | 10512.2 international $ |
| Pairs with PPP conversion | 3066 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 3 | interpolation | 0.4038 | 0.0000 | 146 | 3066 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.3869 | 0.0169 | 146 | 3066 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.3864 | 0.0174 | 146 | 3066 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.3821 | 0.0217 | 146 | 3066 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [5.13e-12, 1.00e-5) | 1533 | 79 | 0.0000 | 0.0000 | 0.4288 | 0.3916 |
| 2 | [1.00e-5, 1.48e-5) | 306 | 34 | 0.0000 | 0.0000 | 0.0034 | 0.1677 |
| 3 | [1.48e-5, 1.75e-5) | 307 | 37 | 0.0000 | 0.0000 | -0.2865 | 0.1999 |
| 4 | [1.75e-5, 2.05e-5) | 306 | 45 | 0.0000 | 0.0000 | -0.0511 | 0.2016 |
| 5 | [2.05e-5, 2.44e-5) | 307 | 35 | 0.0000 | 0.0000 | -0.0396 | 0.1351 |
| 6 | [2.44e-5, 0.02423] | 307 | 23 | 0.0032 | 0.0000 | 0.3840 | 0.2545 |

### Distribution Charts

```text
Predictor Distribution (Tax Revenue (% GDP))
[5.13e-12, 0.00202) | ############################## 3003
[0.00404, 0.00606) | # 14
[0.00606, 0.00808) | # 3
[0.00808, 0.01010) | # 1
[0.01414, 0.01616) | # 1
[0.01616, 0.01817) | # 17
[0.01817, 0.02019) | # 5
[0.02019, 0.02221) | # 15
[0.02221, 0.02423] | # 7
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-18.191, -14.967) | # 3
[-14.967, -11.743) | # 7
[-11.743, -8.519) | # 20
[-8.519, -5.296) | ## 112
[-5.296, -2.072) | ####### 380
[-2.072, 1.152) | ############################## 1622
[1.152, 4.376) | ############# 714
[4.376, 7.600) | ### 151
[7.600, 10.824) | # 43
[10.824, 14.048) | # 8
[14.048, 17.272) | # 5
[17.272, 20.496] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| EGY | 0.4676 | 1.0624 | -189.959 | 21 |
| DNK | 0.4629 | 1.0494 | -127.943 | 21 |
| TON | 0.2084 | 1.0239 | -177.021 | 21 |
| CZE | -0.5123 | -1.0066 | -294.124 | 21 |
| FRA | 0.4277 | 0.9435 | -574.039 | 21 |
| ARG | -0.2278 | -0.9270 | -191.137 | 21 |
| CHN | 0.2421 | 0.9100 | 81.630 | 21 |
| CAF | -0.4566 | -0.8312 | -127.451 | 21 |
