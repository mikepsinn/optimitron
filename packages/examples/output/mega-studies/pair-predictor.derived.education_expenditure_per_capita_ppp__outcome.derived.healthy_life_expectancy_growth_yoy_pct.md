# Pair Study: Education Expenditure Per Capita (PPP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.education_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 5
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.4429
- Included subjects: 165
- Skipped subjects: 0
- Total aligned pairs: 3465
- Signal grade: F (very weak)
- Data status: enough data
- Confidence score: 0.473 (lower confidence)
- Signal tag: not enough data
- Direction: negative
- Uncertainty score: 0.7581 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Education Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy Growth (YoY %): 21.584 international $/person (data-backed level).
- Best level directly seen in the grouped data: 21.584 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 25.596 international $/person; model-optimal minus observed-anchor difference is 566.50 (+2213.2%).
- Backup level check (middle 10-90% of data) suggests 49.502 international $/person.
- The math-only guess and backup level differ by 91.6%, which means extreme values may matter a lot.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Could not find a clear point where gains start slowing down (drop_below_detection_threshold).
- Could not find a stable flat zone (no_plateau_zone_detected).
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Education Expenditure Per Capita (PPP) is in [0.00000, 37.595) (mean outcome 1.027).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: lower Education Expenditure Per Capita (PPP) tends to go with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Education Expenditure Per Capita (PPP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 165 subjects and 3465 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.00000, 37.595) (mean outcome 1.027).
- Confidence score is 0.473 (lower confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0080); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 91.6% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.1900 |
| Reverse correlation | -0.0684 |
| Direction score (forward - reverse) | -0.1216 |
| Effect size (% change from baseline) | -58.5595 |
| Significance score | 0.2419 |
| Weighted PIS | 0.1173 |
| Value linked with higher outcome | 592.0954 |
| Value linked with lower outcome | 640.9438 |
| Math-only best daily value | 592.0954 |
| Recommended level (reader-facing) | 21.584 international $/person (data-backed level) |
| Math-only guess (technical) | 592.10 international $/person |
| Data-backed level | 21.584 international $/person |
| Data-backed range | [0.00000, 35.068) |
| Backup level (middle-data check) | 46.477 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0000, 7006.1701] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [0.00000, 37.595) |
| Best observed range (middle-data check) | [37.622, 61.553) |
| Best observed outcome average | 1.027 |
| Best observed outcome average (middle-data check) | 0.64887 |
| Backup level (bucket median) | 49.502 international $/person |
| Math-only vs backup difference | -542.59 (-91.6%) |
| Middle-data share kept | 80.0% (2771/3465) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.4735 (lower confidence) |
| Reliability support component | 0.7888 |
| Reliability significance component | 0.2419 |
| Reliability directional component | 0.8106 |
| Reliability temporal-stability component | 0.2650 |
| Reliability robustness component | 0.0929 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 570.51 (+2643.3%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 3 | interpolation | 0.4429 | 0.0000 | 165 | 3465 |
| Runner-up | predictor_default | 5 | 5 | interpolation | 0.4349 | 0.0080 | 165 | 3465 |
| Runner-up | predictor_default | 5 | 2 | interpolation | 0.4269 | 0.0160 | 165 | 3465 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.4219 | 0.0210 | 165 | 3465 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 37.595) | 347 | 34 | 24.5353 | 25.5963 | 1.0275 | 0.9616 |
| 2 | [37.595, 71.106) | 346 | 45 | 52.9741 | 52.9152 | 0.6507 | 0.6060 |
| 3 | [71.106, 146.65) | 347 | 50 | 106.3818 | 103.2495 | 0.1859 | 0.2728 |
| 4 | [146.65, 240.13) | 346 | 58 | 192.0140 | 191.4465 | 0.0674 | 0.1795 |
| 5 | [240.13, 340.08) | 346 | 63 | 285.4787 | 281.1048 | 0.2839 | 0.3668 |
| 6 | [340.08, 481.24) | 347 | 62 | 404.1372 | 396.0520 | 0.4978 | 0.3203 |
| 7 | [481.24, 678.73) | 346 | 61 | 560.2334 | 557.5354 | -0.1433 | 0.1336 |
| 8 | [678.73, 1102.9) | 347 | 52 | 880.5704 | 893.5432 | -0.0684 | 0.1801 |
| 9 | [1102.9, 1857.1) | 346 | 48 | 1408.3084 | 1382.6216 | 0.0382 | 0.2228 |
| 10 | [1857.1, 6748.5] | 347 | 27 | 2693.4920 | 2473.7076 | 0.0714 | 0.1667 |

### Distribution Charts

```text
Predictor Distribution (Education Expenditure Per Capita (PPP))
[0.00000, 562.38) | ############################## 2274
[562.38, 1124.8) | ####### 507
[1124.8, 1687.1) | #### 296
[1687.1, 2249.5) | ## 176
[2249.5, 2811.9) | # 96
[2811.9, 3374.3) | # 66
[3374.3, 3936.6) | # 29
[3936.6, 4499.0) | # 7
[4499.0, 5061.4) | # 6
[5061.4, 5623.8) | # 3
[5623.8, 6186.2) | # 2
[6186.2, 6748.5] | # 3
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-39.776, -33.813) | # 1
[-21.885, -15.921) | # 2
[-15.921, -9.957) | # 13
[-9.957, -3.993) | ### 230
[-3.993, 1.971) | ############################## 2476
[1.971, 7.935) | ######## 697
[7.935, 13.899) | # 42
[13.899, 19.862) | # 3
[25.826, 31.790] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| ZMB | -0.4601 | -1.1614 | -93.247 | 21 |
| PRI | -0.5172 | -1.1320 | -214.771 | 21 |
| PAK | -0.2694 | -1.0743 | -240.699 | 21 |
| AFG | -0.6451 | -1.0428 | -271.706 | 21 |
| TJK | -0.2060 | -0.9822 | -170.534 | 21 |
| ZAF | -0.0789 | -0.9725 | 168.489 | 21 |
| LBR | -0.1909 | -0.9649 | -46.816 | 21 |
| KOR | -0.0863 | -0.9249 | -58.119 | 21 |
