# Pair Study: Government Health Expenditure Per Capita (PPP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 5
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.4195
- Included subjects: 179
- Skipped subjects: 0
- Total aligned pairs: 3759
- Signal grade: F (very weak)
- Data status: enough data
- Confidence score: 0.418 (lower confidence)
- Signal tag: not enough data
- Direction: negative
- Uncertainty score: 0.7819 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Health Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy Growth (YoY %): 7.012 international $/person (data-backed level).
- Best level directly seen in the grouped data: 7.012 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 8.222 international $/person; model-optimal minus observed-anchor difference is 519.89 (+6323.0%).
- Backup level check (middle 10-90% of data) suggests 17.753 international $/person.
- The math-only guess and backup level differ by 96.6%, which means extreme values may matter a lot.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Could not find a clear point where gains start slowing down (drop_below_detection_threshold).
- Saturation/plateau zone starts around 902.00 international $/person and extends through 2737.8 international $/person.
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Government Health Expenditure Per Capita (PPP) is in [0.25914, 14.049) (mean outcome 0.92037).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: lower Government Health Expenditure Per Capita (PPP) tends to go with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Health Expenditure Per Capita (PPP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 179 subjects and 3759 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.25914, 14.049) (mean outcome 0.92037).
- Confidence score is 0.418 (lower confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Top temporal profiles are close (score delta 0.0045); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 96.6% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.1515 |
| Reverse correlation | -0.0524 |
| Direction score (forward - reverse) | -0.0992 |
| Effect size (% change from baseline) | 98.5630 |
| Significance score | 0.2181 |
| Weighted PIS | 0.0940 |
| Value linked with higher outcome | 528.1171 |
| Value linked with lower outcome | 568.3852 |
| Math-only best daily value | 528.1171 |
| Recommended level (reader-facing) | 7.012 international $/person (data-backed level) |
| Math-only guess (technical) | 528.12 international $/person |
| Data-backed level | 7.012 international $/person |
| Data-backed range | [0.25914, 11.269) |
| Backup level (middle-data check) | 17.374 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.2591, 8503.2455] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [0.25914, 14.049) |
| Best observed range (middle-data check) | [14.055, 22.166) |
| Best observed outcome average | 0.92037 |
| Best observed outcome average (middle-data check) | 0.95496 |
| Backup level (bucket median) | 17.753 international $/person |
| Math-only vs backup difference | -510.36 (-96.6%) |
| Middle-data share kept | 80.0% (3007/3759) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.4184 (lower confidence) |
| Reliability support component | 0.8133 |
| Reliability significance component | 0.2181 |
| Reliability directional component | 0.6610 |
| Reliability temporal-stability component | 0.1514 |
| Reliability robustness component | 0.0374 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | [688.00, 5280.1] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 521.11 (+7431.8%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 2 | interpolation | 0.4195 | 0.0000 | 179 | 3759 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.4149 | 0.0045 | 179 | 3759 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.3921 | 0.0274 | 179 | 3759 |
| Runner-up | predictor_default | 3 | 3 | interpolation | 0.3861 | 0.0333 | 179 | 3759 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.25914, 14.049) | 376 | 28 | 7.6179 | 8.2223 | 0.9204 | 0.8646 |
| 2 | [14.049, 25.503) | 376 | 40 | 19.0464 | 18.3817 | 0.9098 | 0.7536 |
| 3 | [25.503, 59.970) | 376 | 44 | 40.2367 | 38.7190 | 0.1675 | 0.2720 |
| 4 | [59.970, 115.71) | 376 | 49 | 85.9733 | 84.8055 | 0.3968 | 0.3964 |
| 5 | [115.71, 188.24) | 375 | 53 | 150.0783 | 150.9679 | 0.1057 | 0.2172 |
| 6 | [188.24, 306.83) | 376 | 57 | 242.2209 | 238.8839 | -0.1163 | 0.1882 |
| 7 | [306.83, 521.63) | 376 | 59 | 398.8086 | 386.2125 | 0.4636 | 0.2508 |
| 8 | [521.63, 964.00) | 376 | 48 | 698.1961 | 688.0038 | -0.2255 | 0.0699 |
| 9 | [964.00, 1813.3) | 376 | 39 | 1359.8675 | 1379.8837 | 0.0673 | 0.2499 |
| 10 | [1813.3, 5280.1] | 376 | 28 | 2769.9107 | 2537.1999 | 0.1742 | 0.1845 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure Per Capita (PPP))
[0.25914, 440.24) | ############################## 2524
[440.24, 880.22) | ##### 444
[880.22, 1320.2) | ## 203
[1320.2, 1760.2) | ## 195
[1760.2, 2200.2) | ## 135
[2200.2, 2640.2) | # 82
[2640.2, 3080.1) | # 63
[3080.1, 3520.1) | # 53
[3520.1, 3960.1) | # 24
[3960.1, 4400.1) | # 17
[4400.1, 4840.1) | # 11
[4840.1, 5280.1] | # 8
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-39.776, -33.813) | # 1
[-21.885, -15.921) | # 2
[-15.921, -9.957) | # 14
[-9.957, -3.993) | ### 246
[-3.993, 1.971) | ############################## 2681
[1.971, 7.935) | ######### 765
[7.935, 13.899) | # 44
[13.899, 19.862) | # 5
[25.826, 31.790] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| TJK | -0.2545 | -0.9623 | -170.534 | 21 |
| JPN | -0.1258 | -0.8950 | -69.985 | 21 |
| ZAF | -0.0563 | -0.8916 | -628.179 | 21 |
| MNE | -0.2544 | -0.8673 | -68.762 | 21 |
| MKD | -0.2372 | -0.8427 | -8.670 | 21 |
| TKM | -0.3639 | -0.8349 | 5290.545 | 21 |
| YEM | 0.6759 | 0.8023 | -188.965 | 21 |
| COD | -0.1565 | -0.7769 | 60.669 | 21 |
