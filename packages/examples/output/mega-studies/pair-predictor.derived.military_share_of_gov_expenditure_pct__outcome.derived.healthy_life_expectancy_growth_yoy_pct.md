# Pair Study: Military Share of Government Spending -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 3
- Duration years: 1
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.3115
- Included subjects: 126
- Skipped subjects: 0
- Total aligned pairs: 2646
- Signal grade: F (very weak)
- Data status: enough data
- Confidence score: 0.400 (lower confidence)
- Signal tag: not enough data
- Direction: neutral
- Uncertainty score: 0.8298 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Military Share of Government Spending level for higher Healthy Life Expectancy Growth (YoY %): 9.950 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 9.950 % of government expenditure.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 20.806 % of government expenditure; model-optimal minus observed-anchor difference is -11.873 (-57.1%).
- Backup level check (middle 10-90% of data) suggests 9.883 % of government expenditure.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 4.318 % of government expenditure.
- Saturation/plateau zone starts around 15.596 % of government expenditure and extends through 22.327 % of government expenditure.
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Military Share of Government Spending is in [16.650, 88.206] (mean outcome 0.59494).
- Direction signal is neutral; use caution and rely on the data-backed level.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: no clear up/down pattern; use data-backed levels only.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- No strong directional pattern is detected between Military Share of Government Spending and Healthy Life Expectancy Growth (YoY %).
- The estimate uses 126 subjects and 2646 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [16.650, 88.206] (mean outcome 0.59494).
- Confidence score is 0.400 (lower confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0002); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.0338 |
| Reverse correlation | -0.0020 |
| Direction score (forward - reverse) | 0.0358 |
| Effect size (% change from baseline) | -283.5333 |
| Significance score | 0.1702 |
| Weighted PIS | 0.0487 |
| Value linked with higher outcome | 8.9332 |
| Value linked with lower outcome | 8.5986 |
| Math-only best daily value | 8.9332 |
| Recommended level (reader-facing) | 9.950 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 8.933 % of government expenditure |
| Data-backed level | 9.950 % of government expenditure |
| Data-backed range | [9.169, 11.285) |
| Backup level (middle-data check) | 10.572 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.4821, 100.9768] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [16.650, 88.206] |
| Best observed range (middle-data check) | [9.079, 10.774) |
| Best observed outcome average | 0.59494 |
| Best observed outcome average (middle-data check) | 0.65657 |
| Backup level (bucket median) | 9.883 % of government expenditure |
| Math-only vs backup difference | 0.94929 (+10.6%) |
| Middle-data share kept | 80.0% (2116/2646) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.4005 (lower confidence) |
| Reliability support component | 0.6405 |
| Reliability significance component | 0.1702 |
| Reliability directional component | 0.2385 |
| Reliability temporal-stability component | 0.0075 |
| Reliability robustness component | 0.9930 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | 4.318 % of government expenditure (ratio=-1.409) |
| Flat zone range | [14.069, 88.206] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -1.017 (-10.2%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 1 | interpolation | 0.3115 | 0.0000 | 126 | 2646 |
| Runner-up | predictor_default | 0 | 1 | interpolation | 0.3113 | 0.0002 | 126 | 2646 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.3023 | 0.0092 | 126 | 2646 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.3009 | 0.0106 | 126 | 2646 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.65224, 2.597) | 265 | 22 | 1.7667 | 1.8505 | 0.4762 | 0.3115 |
| 2 | [2.597, 3.656) | 264 | 41 | 3.2136 | 3.2319 | -0.1563 | 0.1297 |
| 3 | [3.656, 4.372) | 265 | 50 | 4.0318 | 4.0587 | 0.4533 | 0.3452 |
| 4 | [4.372, 5.221) | 264 | 50 | 4.7352 | 4.7344 | -0.0735 | 0.2400 |
| 5 | [5.221, 6.317) | 265 | 56 | 5.7622 | 5.7392 | 0.1977 | 0.2324 |
| 6 | [6.317, 7.610) | 264 | 52 | 6.8978 | 6.8270 | 0.2433 | 0.2140 |
| 7 | [7.610, 9.891) | 265 | 47 | 8.7699 | 8.7483 | 0.3841 | 0.4494 |
| 8 | [9.891, 12.985) | 258 | 45 | 11.2438 | 11.1943 | 0.4520 | 0.6451 |
| 9 | [12.985, 16.650) | 271 | 37 | 14.7278 | 14.8348 | 0.2515 | 0.3092 |
| 10 | [16.650, 88.206] | 265 | 28 | 26.2985 | 20.8058 | 0.5949 | 0.4546 |

### Distribution Charts

```text
Predictor Distribution (Military Share of Government Spending)
[0.65224, 7.948) | ############################## 1619
[7.948, 15.245) | ############ 657
[15.245, 22.541) | ##### 260
[22.541, 29.837) | # 37
[29.837, 37.133) | # 37
[37.133, 44.429) | # 16
[44.429, 51.725) | # 6
[51.725, 59.022) | # 5
[59.022, 66.318) | # 1
[66.318, 73.614) | # 6
[80.910, 88.206] | # 2
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-16.329, -13.572) | # 2
[-13.572, -10.814) | # 11
[-10.814, -8.057) | # 21
[-8.057, -5.299) | ## 86
[-5.299, -2.542) | ####### 251
[-2.542, 0.21548) | ######################## 842
[0.21548, 2.973) | ############################## 1066
[2.973, 5.730) | ####### 246
[5.730, 8.488) | ### 91
[8.488, 11.245) | # 21
[11.245, 14.003) | # 5
[14.003, 16.760] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| GAB | -0.4763 | -1.2985 | -42.194 | 21 |
| NPL | 0.6900 | 0.9888 | -498.047 | 21 |
| UGA | -0.4065 | -0.9508 | -229.079 | 21 |
| EGY | 0.1258 | 0.8316 | -155.903 | 21 |
| COD | 0.3369 | 0.8309 | 80.646 | 21 |
| MOZ | -0.4294 | -0.7939 | -294.394 | 21 |
| MYS | 0.3026 | 0.7810 | -119.589 | 21 |
| LBN | -0.2311 | -0.7803 | -154.745 | 21 |
