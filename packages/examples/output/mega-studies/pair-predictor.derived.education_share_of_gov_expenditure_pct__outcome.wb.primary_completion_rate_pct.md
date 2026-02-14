# Pair Study: Education Share of Government Spending -> Primary School Completion Rate

- Pair ID: `predictor.derived.education_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct`
- Lag years: 5
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.5790
- Included subjects: 145
- Skipped subjects: 0
- Total aligned pairs: 3343
- Signal grade: D (weak)
- Data status: enough data
- Confidence score: 0.651 (medium confidence)
- Signal tag: not enough data
- Direction: positive
- Uncertainty score: 0.4541 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Education Share of Government Spending level for higher Primary School Completion Rate: 13.672 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 13.672 % of government expenditure.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 14.406 % of government expenditure; model-optimal minus observed-anchor difference is 6.493 (+45.1%).
- Backup level check (middle 10-90% of data) suggests 13.856 % of government expenditure.
- The math-only guess and backup level differ by 33.7%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 12.034 % of government expenditure.
- Diminishing returns likely begin near 13.672 % of government expenditure.
- Could not find a stable flat zone (no_plateau_zone_detected).
- Highest observed mean Primary School Completion Rate appears when Education Share of Government Spending is in [13.514, 15.413) (mean outcome 95.157).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher Education Share of Government Spending tends to go with better Primary School Completion Rate.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Education Share of Government Spending tends to align with better Primary School Completion Rate.
- The estimate uses 145 subjects and 3343 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [13.514, 15.413) (mean outcome 95.157).
- A minimum effective predictor level appears near 12.034 % of government expenditure in the binned response curve.
- Confidence score is 0.651 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0027); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 33.7% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.1435 |
| Reverse correlation | -0.0109 |
| Direction score (forward - reverse) | 0.1544 |
| Effect size (% change from baseline) | 0.0000 |
| Significance score | 0.5459 |
| Weighted PIS | 0.3448 |
| Value linked with higher outcome | 20.8990 |
| Value linked with lower outcome | 19.5448 |
| Math-only best daily value | 20.8990 |
| Recommended level (reader-facing) | 13.672 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 20.899 % of government expenditure |
| Data-backed level | 13.672 % of government expenditure |
| Data-backed range | [12.846, 14.406) |
| Backup level (middle-data check) | 13.510 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0000, 70.8565] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [13.514, 15.413) |
| Best observed range (middle-data check) | [13.171, 14.641) |
| Best observed outcome average | 95.157 |
| Best observed outcome average (middle-data check) | 96.553 |
| Backup level (bucket median) | 13.856 % of government expenditure |
| Math-only vs backup difference | -7.043 (-33.7%) |
| Middle-data share kept | 80.0% (2673/3343) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6510 (medium confidence) |
| Reliability support component | 0.7619 |
| Reliability significance component | 0.5459 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.0903 |
| Reliability robustness component | 0.7367 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 12.034 % of government expenditure (z=5.18) |
| Point where gains start slowing | 13.672 % of government expenditure (ratio=-0.714) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 7.227 (+52.9%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 2 | interpolation | 0.5790 | 0.0000 | 145 | 3343 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.5763 | 0.0027 | 145 | 3343 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.5601 | 0.0189 | 145 | 3343 |
| Runner-up | predictor_default | 5 | 5 | interpolation | 0.5447 | 0.0343 | 145 | 3343 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [4.450, 11.356) | 335 | 38 | 9.4523 | 9.8358 | 89.7357 | 96.4897 |
| 2 | [11.356, 13.514) | 334 | 45 | 12.4963 | 12.4045 | 94.8430 | 97.7091 |
| 3 | [13.514, 15.413) | 334 | 61 | 14.4035 | 14.4058 | 95.1570 | 97.3318 |
| 4 | [15.413, 17.194) | 334 | 60 | 16.2980 | 16.3470 | 92.3480 | 95.6519 |
| 5 | [17.194, 18.754) | 334 | 56 | 18.0724 | 18.1437 | 88.6965 | 94.7502 |
| 6 | [18.754, 20.150) | 334 | 59 | 19.4507 | 19.4415 | 86.9599 | 94.7194 |
| 7 | [20.150, 21.943) | 335 | 64 | 21.0195 | 21.1067 | 83.3917 | 91.7139 |
| 8 | [21.943, 24.093) | 329 | 57 | 23.0339 | 23.0894 | 87.1785 | 95.1089 |
| 9 | [24.093, 27.723) | 339 | 53 | 25.6947 | 25.6978 | 80.6734 | 91.2581 |
| 10 | [27.723, 66.668] | 335 | 36 | 33.4967 | 30.9648 | 73.1026 | 75.7441 |

### Distribution Charts

```text
Predictor Distribution (Education Share of Government Spending)
[4.450, 9.635) | #### 141
[9.635, 14.820) | ####################### 792
[14.820, 20.005) | ############################## 1030
[20.005, 25.190) | ######################## 841
[25.190, 30.375) | ########## 360
[30.375, 35.559) | ### 94
[35.559, 40.744) | ## 67
[40.744, 45.929) | # 2
[45.929, 51.114) | # 4
[56.299, 61.484) | # 3
[61.484, 66.668] | # 9
```

```text
Outcome Distribution (Primary School Completion Rate, welfare-aligned)
[13.580, 25.388) | # 26
[25.388, 37.196) | # 62
[37.196, 49.003) | ### 118
[49.003, 60.811) | #### 201
[60.811, 72.619) | ##### 252
[72.619, 84.427) | ####### 301
[84.427, 96.234) | ################### 893
[96.234, 108.04) | ############################## 1389
[108.04, 119.85) | ## 89
[119.85, 131.66) | # 8
[131.66, 143.47) | # 3
[143.47, 155.27] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| EST | 0.8607 | 1.3303 | 4.528 | 24 |
| COD | -0.7383 | -1.3031 | -32.021 | 17 |
| DEU | -0.6170 | -1.2955 | -2.511 | 24 |
| LBN | 0.6078 | 1.1598 | 7.687 | 27 |
| SWZ | 0.4674 | 1.0749 | 23.208 | 31 |
| EGY | -0.5135 | -1.0361 | -3.771 | 20 |
| SST | 0.6339 | 1.0288 | 5.671 | 34 |
| EMU | -0.5297 | -0.9924 | -0.638 | 25 |
