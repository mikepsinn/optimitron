# Pair Study: Tax Revenue (% GDP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.wb.tax_revenue_pct_gdp__outcome.who.healthy_life_expectancy_years`
- Lag years: 1
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5915
- Included subjects: 146
- Skipped subjects: 0
- Total aligned pairs: 9636
- Evidence grade: A
- Direction: positive
- Derived uncertainty score: 0.0860 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Tax Revenue (% GDP) level for higher Healthy Life Expectancy (HALE): 2.63e-4 % GDP.
- Approximate per-capita PPP equivalent of that best level: 0.02699 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean Healthy Life Expectancy (HALE) appears when Tax Revenue (% GDP) is in [2.05e-5, 2.44e-5) (mean outcome 64.714).
- PPP per-capita equivalent in that best observed bin (p10-p90): [0.00123, 0.00986].
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Practical direction: increase Tax Revenue (% GDP) toward the estimated best level, then monitor Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Tax Revenue (% GDP) tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 146 subjects and 9636 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [2.05e-5, 2.44e-5) (mean outcome 64.714).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0033); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.1163 |
| Aggregate reverse Pearson | 0.0947 |
| Aggregate directional score (forward - reverse) | 0.0216 |
| Aggregate effect size (% baseline delta) | 1.5722 |
| Aggregate statistical significance | 0.9140 |
| Weighted average PIS | 0.4325 |
| Aggregate value predicting high outcome | 0.0003 |
| Aggregate value predicting low outcome | 0.0003 |
| Aggregate optimal daily value | 0.0003 |
| Observed predictor range | [0.0000, 0.0258] |
| Estimated best level (PPP per-capita equivalent) | 0.02699 international $/person |
| Best observed PPP per-capita range (p10-p90) | [0.00123, 0.00986] |
| Median GDP per-capita PPP (context) | 10254.2 international $ |
| Pairs with PPP conversion | 9636 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 3 | interpolation | 0.5915 | 0.0000 | 146 | 9636 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.5882 | 0.0033 | 146 | 9636 |
| Runner-up | predictor_default | 1 | 1 | interpolation | 0.5879 | 0.0036 | 146 | 9636 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.5849 | 0.0067 | 146 | 9636 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [5.13e-12, 1.00e-5) | 4818 | 79 | 0.0000 | 0.0000 | 60.6127 | 62.2134 |
| 2 | [1.00e-5, 1.47e-5) | 963 | 33 | 0.0000 | 0.0000 | 62.7948 | 63.7637 |
| 3 | [1.47e-5, 1.75e-5) | 963 | 39 | 0.0000 | 0.0000 | 62.8062 | 63.7565 |
| 4 | [1.75e-5, 2.05e-5) | 963 | 45 | 0.0000 | 0.0000 | 63.7372 | 64.8284 |
| 5 | [2.05e-5, 2.44e-5) | 963 | 36 | 0.0000 | 0.0000 | 64.7136 | 66.4313 |
| 6 | [2.44e-5, 0.02423] | 966 | 23 | 0.0031 | 0.0000 | 60.1799 | 61.1121 |

### Distribution Charts

```text
Predictor Distribution (Tax Revenue (% GDP))
[5.13e-12, 0.00202) | ############################## 9438
[0.00404, 0.00606) | # 45
[0.00606, 0.00808) | # 9
[0.00808, 0.01010) | # 3
[0.01414, 0.01616) | # 3
[0.01616, 0.01817) | # 54
[0.01817, 0.02019) | # 15
[0.02019, 0.02221) | # 48
[0.02221, 0.02423] | # 21
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[36.729, 39.926) | # 71
[39.926, 43.124) | ## 148
[43.124, 46.321) | #### 237
[46.321, 49.518) | ##### 324
[49.518, 52.716) | ######## 506
[52.716, 55.913) | ########## 688
[55.913, 59.110) | ############# 884
[59.110, 62.308) | ################### 1306
[62.308, 65.505) | ############################ 1870
[65.505, 68.702) | ############################## 2023
[68.702, 71.900) | ###################### 1514
[71.900, 75.097] | # 65
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| CHN | 0.4642 | 1.0048 | 3.070 | 66 |
| TZA | -0.4366 | -1.0029 | -7.479 | 66 |
| SWE | -0.5797 | -0.9935 | -0.900 | 66 |
| BDI | 0.6702 | 0.9507 | 16.264 | 66 |
| ARG | 0.2783 | 0.9171 | 1.234 | 66 |
| LAO | 0.3471 | 0.9051 | 5.963 | 66 |
| ZWE | 0.4982 | 0.8796 | 13.960 | 66 |
| HND | 0.4988 | 0.8517 | 1.287 | 66 |
