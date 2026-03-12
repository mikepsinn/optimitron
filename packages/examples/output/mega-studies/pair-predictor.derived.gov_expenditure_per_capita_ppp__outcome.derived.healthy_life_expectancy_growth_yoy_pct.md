# Pair Study: Government Expenditure Per Capita (PPP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 3
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.3533
- Included subjects: 147
- Skipped subjects: 0
- Total aligned pairs: 3087
- Signal grade: F (very weak)
- Data status: enough data
- Confidence score: 0.350 (lower confidence)
- Signal tag: not enough data
- Direction: negative
- Uncertainty score: 0.8184 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy Growth (YoY %): 132.79 international $/person (data-backed level).
- Best level directly seen in the grouped data: 132.79 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 149.40 international $/person; model-optimal minus observed-anchor difference is 4182.1 (+2799.2%).
- Backup level check (middle 10-90% of data) suggests 688.01 international $/person.
- The math-only guess and backup level differ by 84.1%, which means extreme values may matter a lot.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Could not find a clear point where gains start slowing down (drop_below_detection_threshold).
- Saturation/plateau zone starts around 11462.6 international $/person and extends through 16893.9 international $/person.
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Government Expenditure Per Capita (PPP) is in [15.672, 243.75) (mean outcome 0.98739).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: lower Government Expenditure Per Capita (PPP) tends to go with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Expenditure Per Capita (PPP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 147 subjects and 3087 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [15.672, 243.75) (mean outcome 0.98739).
- Confidence score is 0.350 (lower confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0015); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 84.1% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.1262 |
| Reverse correlation | -0.0637 |
| Direction score (forward - reverse) | -0.0625 |
| Effect size (% change from baseline) | -265.0081 |
| Significance score | 0.1816 |
| Weighted PIS | 0.0625 |
| Value linked with higher outcome | 4331.5320 |
| Value linked with lower outcome | 4498.5884 |
| Math-only best daily value | 4331.5320 |
| Recommended level (reader-facing) | 132.79 international $/person (data-backed level) |
| Math-only guess (technical) | 4331.5 international $/person |
| Data-backed level | 132.79 international $/person |
| Data-backed range | [15.672, 225.14) |
| Backup level (middle-data check) | 860.80 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [8.5216, 63562.8926] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [15.672, 243.75) |
| Best observed range (middle-data check) | [547.92, 851.35) |
| Best observed outcome average | 0.98739 |
| Best observed outcome average (middle-data check) | 0.68019 |
| Backup level (bucket median) | 688.01 international $/person |
| Math-only vs backup difference | -3643.5 (-84.1%) |
| Middle-data share kept | 80.0% (2469/3087) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.3495 (lower confidence) |
| Reliability support component | 0.7472 |
| Reliability significance component | 0.1816 |
| Reliability directional component | 0.4170 |
| Reliability temporal-stability component | 0.0496 |
| Reliability robustness component | 0.1765 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | [9619.8, 44352.3] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 4198.7 (+3161.9%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 2 | interpolation | 0.3533 | 0.0000 | 147 | 3087 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.3518 | 0.0015 | 147 | 3087 |
| Runner-up | predictor_default | 3 | 3 | interpolation | 0.3494 | 0.0039 | 147 | 3087 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.3477 | 0.0056 | 147 | 3087 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [15.672, 243.75) | 309 | 20 | 153.9153 | 149.4048 | 0.9874 | 0.8847 |
| 2 | [243.75, 596.00) | 309 | 37 | 420.5219 | 413.1930 | 0.4288 | 0.4674 |
| 3 | [596.00, 1005.5) | 308 | 43 | 797.1710 | 798.9134 | 0.7002 | 0.5443 |
| 4 | [1005.5, 1538.0) | 296 | 53 | 1245.3370 | 1209.1218 | 0.0845 | 0.2565 |
| 5 | [1538.0, 2278.5) | 321 | 54 | 1837.3842 | 1819.8816 | -0.1019 | 0.1332 |
| 6 | [2278.5, 3364.4) | 309 | 49 | 2746.5452 | 2711.3519 | 0.3093 | 0.2619 |
| 7 | [3364.4, 4800.7) | 309 | 49 | 4031.9104 | 3988.4426 | 0.2082 | 0.2690 |
| 8 | [4800.7, 8171.7) | 308 | 48 | 6384.2194 | 6289.6926 | -0.0763 | 0.1619 |
| 9 | [8171.7, 12516.4) | 309 | 40 | 10337.7466 | 10274.5630 | -0.0261 | 0.2270 |
| 10 | [12516.4, 44352.3] | 309 | 32 | 17943.3244 | 15927.6875 | 0.1884 | 0.1976 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure Per Capita (PPP))
[15.672, 3710.4) | ############################## 1934
[3710.4, 7405.1) | ####### 467
[7405.1, 11099.8) | #### 283
[11099.8, 14794.5) | ### 207
[14794.5, 18489.3) | ## 97
[18489.3, 22184.0) | # 49
[22184.0, 25878.7) | # 21
[25878.7, 29573.4) | # 6
[29573.4, 33268.1) | # 14
[33268.1, 36962.9) | # 3
[36962.9, 40657.6) | # 3
[40657.6, 44352.3] | # 3
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-16.329, -13.572) | # 2
[-13.572, -10.814) | # 11
[-10.814, -8.057) | # 21
[-8.057, -5.299) | ### 105
[-5.299, -2.542) | ####### 298
[-2.542, 0.21548) | ######################### 1000
[0.21548, 2.973) | ############################## 1224
[2.973, 5.730) | ####### 295
[5.730, 8.488) | ## 100
[8.488, 11.245) | # 22
[11.245, 14.003) | # 5
[14.003, 16.760] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| EGY | -0.2287 | -1.1100 | -338.936 | 21 |
| MWI | 0.1834 | 0.9766 | 34.257 | 21 |
| GAB | 0.4966 | 0.9409 | -778.991 | 21 |
| TJK | -0.0635 | -0.9380 | -159.121 | 21 |
| ARG | -0.1833 | -0.9063 | -26.985 | 21 |
| CAF | -0.3788 | -0.8634 | -170.277 | 21 |
| IRL | 0.4523 | 0.8495 | -167.176 | 21 |
| PAN | -0.4051 | -0.8463 | -344.822 | 21 |
