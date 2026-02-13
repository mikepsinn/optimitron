# Pair Study: R&D Expenditure (% GDP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.wb.rd_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 2
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 16
- Temporal candidates with valid results: 16
- Temporal profile score: 0.3455
- Included subjects: 97
- Skipped subjects: 0
- Total aligned pairs: 2037
- Evidence grade: F
- Direction: negative
- Derived uncertainty score: 0.7521 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best R&D Expenditure (% GDP) level for higher Healthy Life Expectancy Growth (YoY %): 0.78311 % GDP.
- Approximate per-capita PPP equivalent of that best level: 127.78 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when R&D Expenditure (% GDP) is in [0.24482, 0.37191) (mean outcome 0.28504).
- PPP per-capita equivalent in that best observed bin (p10-p90): [9.660, 68.415].
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Practical direction: decrease R&D Expenditure (% GDP) toward the estimated best level, then monitor Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher R&D Expenditure (% GDP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 97 subjects and 2037 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.24482, 0.37191) (mean outcome 0.28504).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0039); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.1016 |
| Aggregate reverse Pearson | -0.0150 |
| Aggregate directional score (forward - reverse) | -0.0866 |
| Aggregate effect size (% baseline delta) | -342.8146 |
| Aggregate statistical significance | 0.2479 |
| Weighted average PIS | 0.1162 |
| Aggregate value predicting high outcome | 0.7831 |
| Aggregate value predicting low outcome | 0.8321 |
| Aggregate optimal daily value | 0.7831 |
| Observed predictor range | [0.0126, 6.0192] |
| Estimated best level (PPP per-capita equivalent) | 127.78 international $/person |
| Best observed PPP per-capita range (p10-p90) | [9.660, 68.415] |
| Median GDP per-capita PPP (context) | 16317.1 international $ |
| Pairs with PPP conversion | 2016 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 5 | interpolation | 0.3455 | 0.0000 | 97 | 2037 |
| Runner-up | predictor_default | 3 | 3 | interpolation | 0.3417 | 0.0039 | 97 | 2037 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.3389 | 0.0066 | 97 | 2037 |
| Runner-up | predictor_default | 5 | 8 | interpolation | 0.3351 | 0.0105 | 97 | 2037 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.01269, 0.09897) | 204 | 17 | 0.0573 | 0.0576 | -0.0724 | 0.2077 |
| 2 | [0.09897, 0.16336) | 204 | 26 | 0.1279 | 0.1217 | 0.1555 | 0.2091 |
| 3 | [0.16336, 0.24482) | 203 | 30 | 0.2064 | 0.2053 | -0.0050 | 0.2484 |
| 4 | [0.24482, 0.37191) | 204 | 29 | 0.3078 | 0.3083 | 0.2850 | 0.2386 |
| 5 | [0.37191, 0.52013) | 203 | 31 | 0.4441 | 0.4421 | -0.1308 | 0.1690 |
| 6 | [0.52013, 0.72657) | 204 | 30 | 0.6209 | 0.6205 | -0.1310 | 0.1275 |
| 7 | [0.72657, 1.064) | 204 | 28 | 0.8778 | 0.8558 | 0.2505 | 0.3558 |
| 8 | [1.064, 1.599) | 203 | 24 | 1.3002 | 1.2625 | 0.0561 | 0.2147 |
| 9 | [1.599, 2.335) | 203 | 19 | 1.9597 | 1.9681 | 0.2015 | 0.1778 |
| 10 | [2.335, 4.775] | 205 | 15 | 3.0239 | 2.9345 | 0.2255 | 0.2564 |

### Distribution Charts

```text
Predictor Distribution (R&D Expenditure (% GDP))
[0.01269, 0.40956) | ############################## 865
[0.40956, 0.80642) | ############### 427
[0.80642, 1.203) | ####### 203
[1.203, 1.600) | ##### 136
[1.600, 1.997) | #### 109
[1.997, 2.394) | #### 103
[2.394, 2.791) | ## 72
[2.791, 3.188) | ## 50
[3.188, 3.584) | # 43
[3.584, 3.981) | # 14
[3.981, 4.378) | # 12
[4.378, 4.775] | # 3
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-18.191, -14.967) | # 3
[-14.967, -11.743) | # 7
[-11.743, -8.519) | # 21
[-8.519, -5.296) | ## 85
[-5.296, -2.072) | ######## 274
[-2.072, 1.152) | ############################## 1096
[1.152, 4.376) | ########### 394
[4.376, 7.600) | ### 110
[7.600, 10.824) | # 33
[10.824, 14.048) | # 8
[14.048, 17.272) | # 5
[17.272, 20.496] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| HND | -0.4607 | -1.3404 | -133.710 | 21 |
| BGR | -0.2796 | -1.1015 | -2069.986 | 21 |
| MEX | 0.3209 | 1.0557 | -135.798 | 21 |
| IRL | 0.3332 | 1.0434 | -216.713 | 21 |
| PRY | -0.7282 | -0.9768 | 2269.791 | 21 |
| AUS | -0.1643 | -0.9515 | -606.147 | 21 |
| ARE | -0.1532 | -0.9056 | 47.314 | 21 |
| LKA | 0.0835 | 0.8642 | -210.137 | 21 |
