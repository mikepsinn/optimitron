# Pair Study: Education Expenditure (% GDP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.wb.education_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 5
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.3704
- Included subjects: 169
- Skipped subjects: 0
- Total aligned pairs: 3549
- Evidence grade: F
- Direction: positive
- Derived uncertainty score: 0.7986 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Education Expenditure (% GDP) level for higher Healthy Life Expectancy Growth (YoY %): 4.430 % GDP.
- Approximate per-capita PPP equivalent of that best level: 353.74 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Education Expenditure (% GDP) is in [0.00000, 2.097) (mean outcome 0.80303).
- PPP per-capita equivalent in that best observed bin (p10-p90): [11.715, 113.87].
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Practical direction: increase Education Expenditure (% GDP) toward the estimated best level, then monitor Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Education Expenditure (% GDP) tends to align with better Healthy Life Expectancy Growth (YoY %).
- The estimate uses 169 subjects and 3549 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.00000, 2.097) (mean outcome 0.80303).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0078); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.0566 |
| Aggregate reverse Pearson | -0.1178 |
| Aggregate directional score (forward - reverse) | 0.0612 |
| Aggregate effect size (% baseline delta) | -156.5524 |
| Aggregate statistical significance | 0.2014 |
| Weighted average PIS | 0.0813 |
| Aggregate value predicting high outcome | 4.4305 |
| Aggregate value predicting low outcome | 4.4983 |
| Aggregate optimal daily value | 4.4305 |
| Observed predictor range | [0.0000, 44.3340] |
| Estimated best level (PPP per-capita equivalent) | 353.74 international $/person |
| Best observed PPP per-capita range (p10-p90) | [11.715, 113.87] |
| Median GDP per-capita PPP (context) | 7984.3 international $ |
| Pairs with PPP conversion | 3507 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 5 | interpolation | 0.3704 | 0.0000 | 169 | 3549 |
| Runner-up | predictor_default | 1 | 3 | interpolation | 0.3626 | 0.0078 | 169 | 3549 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.3443 | 0.0261 | 169 | 3549 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.3440 | 0.0264 | 169 | 3549 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 2.097) | 355 | 34 | 1.6015 | 1.6492 | 0.8030 | 0.6127 |
| 2 | [2.097, 2.651) | 355 | 54 | 2.3890 | 2.4018 | 0.3838 | 0.4693 |
| 3 | [2.651, 3.247) | 355 | 68 | 2.9519 | 2.9551 | -0.1011 | 0.2084 |
| 4 | [3.247, 3.699) | 355 | 67 | 3.4659 | 3.4524 | 0.2758 | 0.3286 |
| 5 | [3.699, 4.098) | 354 | 68 | 3.9075 | 3.9103 | 0.2436 | 0.2632 |
| 6 | [4.098, 4.616) | 354 | 80 | 4.3307 | 4.3192 | -0.1292 | 0.1209 |
| 7 | [4.616, 5.131) | 356 | 73 | 4.8785 | 4.8867 | 0.2348 | 0.1319 |
| 8 | [5.131, 5.721) | 352 | 64 | 5.4135 | 5.4193 | 0.0108 | 0.1335 |
| 9 | [5.721, 6.552) | 358 | 56 | 6.1114 | 6.1073 | 0.1783 | 0.3359 |
| 10 | [6.552, 44.334] | 355 | 38 | 9.0033 | 7.6771 | 0.3043 | 0.2165 |

### Distribution Charts

```text
Predictor Distribution (Education Expenditure (% GDP))
[0.00000, 3.694) | ###################### 1411
[3.694, 7.389) | ############################## 1930
[7.389, 11.083) | ### 162
[11.083, 14.778) | # 34
[14.778, 18.472) | # 1
[18.472, 22.167) | # 2
[22.167, 25.861) | # 1
[25.861, 29.556) | # 1
[29.556, 33.250) | # 2
[33.250, 36.945) | # 2
[36.945, 40.639) | # 1
[40.639, 44.334] | # 2
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-33.373, -25.372) | # 1
[-25.372, -17.372) | # 1
[-17.372, -9.372) | # 22
[-9.372, -1.372) | ######## 756
[-1.372, 6.629) | ############################## 2671
[6.629, 14.629) | # 92
[14.629, 22.629) | # 4
[22.629, 30.629) | # 1
[54.630, 62.630] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| NER | -0.6521 | -1.3160 | -82.932 | 21 |
| EGY | 0.4836 | 1.1958 | -134.833 | 21 |
| BEN | -0.3771 | -1.1680 | -1094.724 | 21 |
| LAO | 0.5427 | 1.1516 | -434.996 | 21 |
| PSE | 0.3121 | 1.1422 | -6128.345 | 21 |
| GBR | -0.2395 | -1.0869 | -69.574 | 21 |
| TTO | -0.5302 | -1.0730 | -406.464 | 21 |
| COD | -0.4238 | -1.0615 | -84.369 | 21 |
