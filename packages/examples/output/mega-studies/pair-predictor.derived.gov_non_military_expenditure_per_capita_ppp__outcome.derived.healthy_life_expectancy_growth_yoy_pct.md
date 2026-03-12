# Pair Study: Civilian Government Expenditure Per Capita (PPP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 1
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.3735
- Included subjects: 126
- Skipped subjects: 0
- Total aligned pairs: 2646
- Signal grade: F (very weak)
- Data status: enough data
- Confidence score: 0.476 (lower confidence)
- Signal tag: not enough data
- Direction: negative
- Uncertainty score: 0.7631 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Civilian Government Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy Growth (YoY %): 112.66 international $/person (data-backed level).
- Best level directly seen in the grouped data: 112.66 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 121.97 international $/person; model-optimal minus observed-anchor difference is 4200.0 (+3443.4%).
- Backup level check (middle 10-90% of data) suggests 649.66 international $/person.
- The math-only guess and backup level differ by 85.0%, which means extreme values may matter a lot.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Could not find a clear point where gains start slowing down (drop_below_detection_threshold).
- Saturation/plateau zone starts around 8770.0 international $/person and extends through 18150.6 international $/person.
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Civilian Government Expenditure Per Capita (PPP) is in [7.604, 214.06) (mean outcome 0.99627).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: lower Civilian Government Expenditure Per Capita (PPP) tends to go with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Civilian Government Expenditure Per Capita (PPP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 126 subjects and 2646 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [7.604, 214.06) (mean outcome 0.99627).
- Confidence score is 0.476 (lower confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0266); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 85.0% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.1228 |
| Reverse correlation | -0.1973 |
| Direction score (forward - reverse) | 0.0745 |
| Effect size (% change from baseline) | -364.2224 |
| Significance score | 0.2369 |
| Weighted PIS | 0.1093 |
| Value linked with higher outcome | 4321.9692 |
| Value linked with lower outcome | 4524.9730 |
| Math-only best daily value | 4321.9692 |
| Recommended level (reader-facing) | 112.66 international $/person (data-backed level) |
| Math-only guess (technical) | 4322.0 international $/person |
| Data-backed level | 112.66 international $/person |
| Data-backed range | [7.604, 198.09) |
| Backup level (middle-data check) | 559.74 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [7.6041, 62399.1940] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [7.604, 214.06) |
| Best observed range (middle-data check) | [506.71, 813.78) |
| Best observed outcome average | 0.99627 |
| Best observed outcome average (middle-data check) | 0.75785 |
| Backup level (bucket median) | 649.66 international $/person |
| Math-only vs backup difference | -3672.3 (-85.0%) |
| Middle-data share kept | 80.2% (2122/2646) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.4764 (lower confidence) |
| Reliability support component | 0.6405 |
| Reliability significance component | 0.2369 |
| Reliability directional component | 0.4964 |
| Reliability temporal-stability component | 0.8851 |
| Reliability robustness component | 0.1670 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | [7177.3, 47874.3] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 4209.3 (+3736.2%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 3 | interpolation | 0.3735 | 0.0000 | 126 | 2646 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.3470 | 0.0266 | 126 | 2646 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.3383 | 0.0352 | 126 | 2646 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.3369 | 0.0366 | 126 | 2646 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [7.604, 214.06) | 259 | 18 | 129.0571 | 121.9722 | 0.9963 | 0.8549 |
| 2 | [214.06, 561.44) | 267 | 30 | 362.8853 | 336.3062 | 0.6535 | 0.7912 |
| 3 | [561.44, 984.46) | 268 | 39 | 776.4939 | 767.4314 | 0.5639 | 0.2926 |
| 4 | [984.46, 1618.7) | 264 | 40 | 1290.2193 | 1253.4625 | 0.1064 | 0.2753 |
| 5 | [1618.7, 2377.3) | 265 | 45 | 1990.3763 | 1990.2774 | 0.1041 | 0.2214 |
| 6 | [2377.3, 3594.7) | 264 | 43 | 3015.1290 | 3032.5452 | 0.0527 | 0.2154 |
| 7 | [3594.7, 5595.6) | 265 | 41 | 4449.4961 | 4407.0886 | 0.3471 | 0.3639 |
| 8 | [5595.6, 8974.8) | 264 | 41 | 7272.4291 | 7173.9583 | -0.0828 | 0.1619 |
| 9 | [8974.8, 12767.5) | 265 | 39 | 10652.2762 | 10597.6924 | -0.0796 | 0.1895 |
| 10 | [12767.5, 47874.3] | 265 | 29 | 18538.2155 | 16768.1437 | 0.1669 | 0.1693 |

### Distribution Charts

```text
Predictor Distribution (Civilian Government Expenditure Per Capita (PPP))
[7.604, 3996.5) | ############################## 1666
[3996.5, 7985.4) | ####### 378
[7985.4, 11974.3) | ##### 299
[11974.3, 15963.2) | ### 154
[15963.2, 19952.0) | # 74
[19952.0, 23940.9) | # 41
[23940.9, 27929.8) | # 21
[27929.8, 31918.7) | # 2
[31918.7, 35907.6) | # 3
[35907.6, 39896.5) | # 3
[39896.5, 43885.4) | # 3
[43885.4, 47874.3] | # 2
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
| GAB | 0.7268 | 1.2834 | -328.118 | 21 |
| EGY | -0.1811 | -1.1396 | -338.936 | 21 |
| NPL | -0.3532 | -0.9076 | 36.962 | 21 |
| MWI | 0.4813 | 0.8907 | 379.184 | 21 |
| IRL | 0.4101 | 0.8275 | -155.187 | 21 |
| TJK | 0.0141 | -0.8135 | -159.121 | 21 |
| CAF | -0.3799 | -0.7657 | -182.493 | 21 |
| JAM | -0.0819 | 0.7561 | -78.713 | 21 |
