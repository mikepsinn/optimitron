# Pair Study: Government Health Share of Government Spending -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.who.healthy_life_expectancy_years`
- Lag years: 2
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.6798
- Included subjects: 141
- Skipped subjects: 0
- Total aligned pairs: 9306
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.732 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.0830 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Health Share of Government Spending level for higher Healthy Life Expectancy (HALE): 27.789 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 27.789 % of government expenditure.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 25.736 % of government expenditure; model-optimal minus observed-anchor difference is -12.122 (-47.1%).
- Backup level check (middle 10-90% of data) suggests 19.044 % of government expenditure.
- The math-only guess and backup level differ by 39.9%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 6.559 % of government expenditure.
- Diminishing returns likely begin near 10.748 % of government expenditure.
- Saturation/plateau zone starts around 11.833 % of government expenditure and extends through 13.752 % of government expenditure.
- Highest observed mean Healthy Life Expectancy (HALE) appears when Government Health Share of Government Spending is in [20.671, 66.811] (mean outcome 67.739).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger signal compared with most other predictors in this report.
- Pattern hint: higher Government Health Share of Government Spending tends to go with better Healthy Life Expectancy (HALE).
- Signal strength: stronger in this report set.

## Plain-Language Summary

- Higher Government Health Share of Government Spending tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 141 subjects and 9306 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [20.671, 66.811] (mean outcome 67.739).
- A minimum effective predictor level appears near 6.559 % of government expenditure in the binned response curve.
- Confidence score is 0.732 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0029); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 39.9% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.1233 |
| Reverse correlation | 0.2321 |
| Direction score (forward - reverse) | -0.1088 |
| Effect size (% change from baseline) | 0.5927 |
| Significance score | 0.9170 |
| Weighted PIS | 0.4433 |
| Value linked with higher outcome | 13.6139 |
| Value linked with lower outcome | 13.2356 |
| Math-only best daily value | 13.6139 |
| Recommended level (reader-facing) | 27.789 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 13.614 % of government expenditure |
| Data-backed level | 27.789 % of government expenditure |
| Data-backed range | [21.427, 66.811] |
| Backup level (middle-data check) | 19.278 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.8069, 88.0822] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [20.671, 66.811] |
| Best observed range (middle-data check) | [17.457, 20.671] |
| Best observed outcome average | 67.739 |
| Best observed outcome average (middle-data check) | 66.565 |
| Backup level (bucket median) | 19.044 % of government expenditure |
| Math-only vs backup difference | 5.430 (+39.9%) |
| Middle-data share kept | 80.0% (7446/9306) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.7316 (medium confidence) |
| Reliability support component | 0.9700 |
| Reliability significance component | 0.9170 |
| Reliability directional component | 0.7255 |
| Reliability temporal-stability component | 0.0972 |
| Reliability robustness component | 0.6679 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 6.559 % of government expenditure (z=5.29) |
| Point where gains start slowing | 10.748 % of government expenditure (ratio=0.282) |
| Flat zone range | [11.339, 14.418) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -14.175 (-51.0%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 3 | interpolation | 0.6798 | 0.0000 | 141 | 9306 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.6769 | 0.0029 | 141 | 9306 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.6759 | 0.0038 | 141 | 9306 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.6749 | 0.0048 | 141 | 9306 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.84646, 6.064) | 930 | 27 | 4.6016 | 4.8183 | 55.4973 | 56.0828 |
| 2 | [6.064, 8.367) | 930 | 38 | 7.1937 | 7.1054 | 57.9656 | 59.0612 |
| 3 | [8.367, 9.836) | 930 | 48 | 9.1458 | 9.1828 | 57.4419 | 58.4163 |
| 4 | [9.836, 11.078) | 930 | 58 | 10.4751 | 10.5482 | 61.9745 | 63.6314 |
| 5 | [11.078, 12.442) | 930 | 63 | 11.7450 | 11.6654 | 62.5383 | 63.7841 |
| 6 | [12.442, 13.537) | 933 | 62 | 12.9125 | 12.8713 | 62.2404 | 63.8637 |
| 7 | [13.537, 14.909) | 930 | 61 | 14.1587 | 14.1494 | 62.8571 | 64.7948 |
| 8 | [14.909, 16.642) | 918 | 51 | 15.7520 | 15.7726 | 63.8168 | 65.6232 |
| 9 | [16.642, 20.671) | 942 | 38 | 18.5866 | 18.6320 | 66.3759 | 67.9688 |
| 10 | [20.671, 66.811] | 933 | 26 | 30.3436 | 25.7362 | 67.7386 | 68.9217 |

### Distribution Charts

```text
Predictor Distribution (Government Health Share of Government Spending)
[0.84646, 6.343) | ########## 1077
[6.343, 11.841) | ############################# 3204
[11.841, 17.338) | ############################## 3336
[17.338, 22.835) | ########## 1074
[22.835, 28.332) | ## 240
[28.332, 33.829) | ## 183
[33.829, 39.326) | # 51
[39.326, 44.823) | # 51
[44.823, 50.320) | # 9
[50.320, 55.817) | # 15
[55.817, 61.314) | # 6
[61.314, 66.811] | # 60
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[36.729, 39.928) | # 71
[39.928, 43.126) | ## 121
[43.126, 46.325) | #### 231
[46.325, 49.524) | ##### 316
[49.524, 52.723) | ####### 483
[52.723, 55.921) | ########## 678
[55.921, 59.120) | ############# 841
[59.120, 62.319) | ################### 1223
[62.319, 65.517) | ############################ 1810
[65.517, 68.716) | ############################## 1938
[68.716, 71.915) | ####################### 1488
[71.915, 75.113] | ## 106
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| ITA | 0.4734 | 1.0254 | 0.699 | 66 |
| TGO | 0.8099 | 0.9393 | 8.691 | 66 |
| ARG | -0.0258 | -0.8894 | -0.274 | 66 |
| UZB | 0.0549 | 0.8764 | 5.858 | 66 |
| ZMB | -0.7418 | -0.8235 | -12.392 | 66 |
| ECU | 0.0242 | -0.8163 | 1.116 | 66 |
| PER | -0.2364 | -0.8152 | -0.947 | 66 |
| BIH | 0.0198 | -0.7635 | 0.421 | 66 |
