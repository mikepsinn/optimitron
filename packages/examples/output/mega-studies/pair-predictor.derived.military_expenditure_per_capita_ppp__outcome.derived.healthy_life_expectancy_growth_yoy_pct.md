# Pair Study: Military Expenditure Per Capita (PPP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 0
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.3717
- Included subjects: 159
- Skipped subjects: 0
- Total aligned pairs: 3339
- Signal grade: F (very weak)
- Data status: enough data
- Confidence score: 0.398 (lower confidence)
- Signal tag: not enough data
- Direction: negative
- Uncertainty score: 0.7720 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Military Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy Growth (YoY %): 8.665 international $/person (data-backed level).
- Best level directly seen in the grouped data: 8.665 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 9.671 international $/person; model-optimal minus observed-anchor difference is 347.19 (+3590.0%).
- Backup level check (middle 10-90% of data) suggests 21.730 international $/person.
- The math-only guess and backup level differ by 93.9%, which means extreme values may matter a lot.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Could not find a clear point where gains start slowing down (drop_below_detection_threshold).
- Saturation/plateau zone starts around 619.75 international $/person and extends through 2204.8 international $/person.
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Military Expenditure Per Capita (PPP) is in [0.91749, 16.666) (mean outcome 0.99641).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: lower Military Expenditure Per Capita (PPP) tends to go with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Military Expenditure Per Capita (PPP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 159 subjects and 3339 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.91749, 16.666) (mean outcome 0.99641).
- Confidence score is 0.398 (lower confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Top temporal profiles are close (score delta 0.0118); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 93.9% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.1223 |
| Reverse correlation | -0.1807 |
| Direction score (forward - reverse) | 0.0584 |
| Effect size (% change from baseline) | 0.0000 |
| Significance score | 0.2280 |
| Weighted PIS | 0.1040 |
| Value linked with higher outcome | 356.8618 |
| Value linked with lower outcome | 377.4634 |
| Math-only best daily value | 356.8618 |
| Recommended level (reader-facing) | 8.665 international $/person (data-backed level) |
| Math-only guess (technical) | 356.86 international $/person |
| Data-backed level | 8.665 international $/person |
| Data-backed range | [0.91749, 14.784) |
| Backup level (middle-data check) | 20.871 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0063, 27448.6207] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [0.91749, 16.666) |
| Best observed range (middle-data check) | [16.681, 26.916) |
| Best observed outcome average | 0.99641 |
| Best observed outcome average (middle-data check) | 0.76222 |
| Backup level (bucket median) | 21.730 international $/person |
| Math-only vs backup difference | -335.13 (-93.9%) |
| Middle-data share kept | 80.0% (2671/3339) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.3984 (lower confidence) |
| Reliability support component | 0.7782 |
| Reliability significance component | 0.2280 |
| Reliability directional component | 0.3891 |
| Reliability temporal-stability component | 0.3922 |
| Reliability robustness component | 0.0677 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | [507.41, 7538.5] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 348.20 (+4018.4%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 3 | interpolation | 0.3717 | 0.0000 | 159 | 3339 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.3599 | 0.0118 | 159 | 3339 |
| Runner-up | predictor_default | 1 | 3 | interpolation | 0.3467 | 0.0249 | 159 | 3339 |
| Runner-up | predictor_default | 0 | 1 | interpolation | 0.3349 | 0.0368 | 159 | 3339 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.91749, 16.666) | 334 | 25 | 9.7429 | 9.6712 | 0.9964 | 0.8197 |
| 2 | [16.666, 30.728) | 334 | 42 | 23.2103 | 22.9926 | 0.8062 | 0.7640 |
| 3 | [30.728, 59.752) | 334 | 48 | 42.5483 | 41.1122 | 0.4526 | 0.5272 |
| 4 | [59.752, 106.52) | 334 | 47 | 82.7407 | 82.5890 | 0.3448 | 0.3364 |
| 5 | [106.52, 165.70) | 333 | 52 | 136.8876 | 135.0267 | 0.2869 | 0.2259 |
| 6 | [165.70, 235.14) | 334 | 56 | 199.4186 | 198.3341 | 0.1913 | 0.4121 |
| 7 | [235.14, 338.20) | 332 | 51 | 281.3048 | 277.9244 | -0.0882 | 0.2193 |
| 8 | [338.20, 450.95) | 336 | 49 | 386.0430 | 380.4638 | 0.3096 | 0.2416 |
| 9 | [450.95, 733.41) | 334 | 52 | 562.2339 | 545.3658 | -0.1669 | 0.0883 |
| 10 | [733.41, 7538.5] | 334 | 31 | 2273.0190 | 2037.8634 | 0.1802 | 0.2216 |

### Distribution Charts

```text
Predictor Distribution (Military Expenditure Per Capita (PPP))
[0.91749, 629.05) | ############################## 2928
[629.05, 1257.2) | ## 192
[1257.2, 1885.3) | # 37
[1885.3, 2513.4) | # 69
[2513.4, 3141.6) | # 36
[3141.6, 3769.7) | # 18
[3769.7, 4397.8) | # 15
[4397.8, 5025.9) | # 28
[5025.9, 5654.1) | # 7
[5654.1, 6282.2) | # 5
[6282.2, 6910.3) | # 3
[6910.3, 7538.5] | # 1
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-39.776, -33.813) | # 1
[-21.885, -15.921) | # 2
[-15.921, -9.957) | # 14
[-9.957, -3.993) | ### 209
[-3.993, 1.971) | ############################## 2369
[1.971, 7.935) | ######### 693
[7.935, 13.899) | # 45
[13.899, 19.862) | # 5
[25.826, 31.790] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| ZAF | 0.7056 | 0.8510 | -151.222 | 21 |
| FJI | -0.0028 | 0.7694 | 42.996 | 21 |
| LSO | -0.0799 | -0.7366 | 255.781 | 21 |
| ECU | 0.1585 | 0.7348 | -78.989 | 21 |
| KOR | -0.1071 | -0.7180 | -50.585 | 21 |
| PRT | 0.1492 | 0.6992 | -100.077 | 21 |
| FIN | 0.0563 | 0.6959 | -232.367 | 21 |
| UZB | 0.0255 | -0.6934 | 2.260 | 21 |
