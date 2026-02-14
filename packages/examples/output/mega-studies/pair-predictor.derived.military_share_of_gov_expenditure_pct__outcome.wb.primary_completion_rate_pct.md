# Pair Study: Military Share of Government Spending -> Primary School Completion Rate

- Pair ID: `predictor.derived.military_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct`
- Lag years: 2
- Duration years: 1
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.4801
- Included subjects: 133
- Skipped subjects: 0
- Total aligned pairs: 3043
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.493 (lower confidence)
- Signal tag: early signal
- Direction: negative
- Uncertainty score: 0.3809 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Military Share of Government Spending level for higher Primary School Completion Rate: 3.399 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 3.399 % of government expenditure.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 3.590 % of government expenditure; model-optimal minus observed-anchor difference is 4.958 (+138.1%).
- Backup level check (middle 10-90% of data) suggests 3.533 % of government expenditure.
- The math-only guess and backup level differ by 58.7%, which means extreme values may matter a lot.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Could not find a clear point where gains start slowing down (drop_below_detection_threshold).
- Could not find a stable flat zone (no_plateau_zone_detected).
- Highest observed mean Primary School Completion Rate appears when Military Share of Government Spending is in [3.075, 4.084) (mean outcome 95.342).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: lower Military Share of Government Spending tends to go with better Primary School Completion Rate.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Military Share of Government Spending tends to align with worse Primary School Completion Rate.
- The estimate uses 133 subjects and 3043 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [3.075, 4.084) (mean outcome 95.342).
- Confidence score is 0.493 (lower confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0090); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 58.7% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.3485 |
| Reverse correlation | -0.3859 |
| Direction score (forward - reverse) | 0.0374 |
| Effect size (% change from baseline) | 0.0000 |
| Significance score | 0.6191 |
| Weighted PIS | 0.4590 |
| Value linked with higher outcome | 8.5486 |
| Value linked with lower outcome | 10.8301 |
| Math-only best daily value | 8.5486 |
| Recommended level (reader-facing) | 3.399 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 8.549 % of government expenditure |
| Data-backed level | 3.399 % of government expenditure |
| Data-backed range | [2.735, 3.726) |
| Backup level (middle-data check) | 3.461 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.4821, 100.9768] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [3.075, 4.084) |
| Best observed range (middle-data check) | [3.080, 3.879) |
| Best observed outcome average | 95.342 |
| Best observed outcome average (middle-data check) | 95.595 |
| Backup level (bucket median) | 3.533 % of government expenditure |
| Math-only vs backup difference | -5.016 (-58.7%) |
| Middle-data share kept | 80.0% (2433/3043) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.4928 (lower confidence) |
| Reliability support component | 0.6969 |
| Reliability significance component | 0.6191 |
| Reliability directional component | 0.2491 |
| Reliability temporal-stability component | 0.3007 |
| Reliability robustness component | 0.4591 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 5.150 (+151.5%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 1 | interpolation | 0.4801 | 0.0000 | 133 | 3043 |
| Runner-up | predictor_default | 3 | 3 | interpolation | 0.4711 | 0.0090 | 133 | 3043 |
| Runner-up | predictor_default | 1 | 3 | interpolation | 0.4689 | 0.0112 | 133 | 3043 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.4683 | 0.0118 | 133 | 3043 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.52656, 3.075) | 305 | 28 | 1.9833 | 2.1396 | 91.4102 | 95.9981 |
| 2 | [3.075, 4.084) | 304 | 48 | 3.6023 | 3.5905 | 95.3420 | 98.2720 |
| 3 | [4.084, 4.635) | 304 | 50 | 4.3400 | 4.3296 | 89.4999 | 97.6467 |
| 4 | [4.635, 5.513) | 304 | 50 | 4.9875 | 4.9323 | 93.3647 | 97.8338 |
| 5 | [5.513, 6.607) | 286 | 56 | 5.9472 | 5.8838 | 92.3246 | 96.2092 |
| 6 | [6.607, 8.351) | 323 | 52 | 7.4224 | 7.3151 | 84.0288 | 92.8482 |
| 7 | [8.351, 10.193) | 304 | 52 | 9.2044 | 9.1689 | 81.3203 | 89.0828 |
| 8 | [10.193, 13.289) | 304 | 47 | 11.6954 | 11.7803 | 78.7196 | 88.7278 |
| 9 | [13.289, 16.284) | 304 | 47 | 14.8922 | 15.0125 | 81.9277 | 92.1514 |
| 10 | [16.284, 100.98] | 305 | 37 | 23.3210 | 18.7798 | 75.2944 | 82.9930 |

### Distribution Charts

```text
Predictor Distribution (Military Share of Government Spending)
[0.52656, 8.897) | ############################## 1930
[8.897, 17.268) | ############## 876
[17.268, 25.639) | ### 174
[25.639, 34.010) | # 26
[34.010, 42.381) | # 14
[42.381, 50.752) | # 8
[50.752, 59.123) | # 6
[59.123, 67.493) | # 2
[67.493, 75.864) | # 6
[92.606, 100.98] | # 1
```

```text
Outcome Distribution (Primary School Completion Rate, welfare-aligned)
[13.580, 25.463) | # 25
[25.463, 37.345) | ## 73
[37.345, 49.227) | ### 113
[49.227, 61.109) | ##### 203
[61.109, 72.992) | ###### 247
[72.992, 84.874) | ######## 310
[84.874, 96.756) | ##################### 818
[96.756, 108.64) | ############################## 1183
[108.64, 120.52) | # 58
[120.52, 132.40) | # 8
[132.40, 144.28) | # 3
[144.28, 156.17] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| AFE | 0.6078 | 1.1139 | 16.358 | 34 |
| LUX | -0.5588 | -0.8287 | -5.443 | 14 |
| HND | -0.2824 | -0.8076 | 0.815 | 25 |
| TZA | 0.2392 | 0.7783 | 10.478 | 27 |
| SYC | -0.2116 | -0.7721 | -11.043 | 30 |
| OED | 0.3285 | 0.7474 | 0.165 | 25 |
| BFA | -0.6780 | -0.7385 | -43.884 | 31 |
| MKD | 0.7019 | 0.7376 | 3.695 | 20 |
