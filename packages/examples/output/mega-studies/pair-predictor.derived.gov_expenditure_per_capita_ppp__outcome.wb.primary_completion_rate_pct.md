# Pair Study: Government Expenditure Per Capita (PPP) -> Primary School Completion Rate

- Pair ID: `predictor.derived.gov_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5835
- Included subjects: 159
- Skipped subjects: 0
- Total aligned pairs: 3577
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.602 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3249 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Expenditure Per Capita (PPP) level for higher Primary School Completion Rate: 10221.6 international $/person (data-backed level).
- Best level directly seen in the grouped data: 10221.6 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 8996.1 international $/person; model-optimal minus observed-anchor difference is -5190.2 (-57.7%).
- Backup level check (middle 10-90% of data) suggests 9486.4 international $/person.
- The math-only guess and backup level differ by 149.3%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 315.85 international $/person.
- Diminishing returns likely begin near 547.92 international $/person.
- Saturation/plateau zone starts around 1752.5 international $/person and extends through 15651.4 international $/person.
- Highest observed mean Primary School Completion Rate appears when Government Expenditure Per Capita (PPP) is in [6592.2, 11473.4) (mean outcome 98.252).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher Government Expenditure Per Capita (PPP) tends to go with better Primary School Completion Rate.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Expenditure Per Capita (PPP) tends to align with better Primary School Completion Rate.
- The estimate uses 159 subjects and 3577 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [6592.2, 11473.4) (mean outcome 98.252).
- A minimum effective predictor level appears near 315.85 international $/person in the binned response curve.
- Confidence score is 0.602 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0180); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 149.3% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.2375 |
| Reverse correlation | 0.3453 |
| Direction score (forward - reverse) | -0.1078 |
| Effect size (% change from baseline) | 0.0000 |
| Significance score | 0.6751 |
| Weighted PIS | 0.5088 |
| Value linked with higher outcome | 3805.8800 |
| Value linked with lower outcome | 4195.3457 |
| Math-only best daily value | 3805.8800 |
| Recommended level (reader-facing) | 10221.6 international $/person (data-backed level) |
| Math-only guess (technical) | 3805.9 international $/person |
| Data-backed level | 10221.6 international $/person |
| Data-backed range | [8263.9, 12342.2) |
| Backup level (middle-data check) | 9860.2 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [8.5216, 63562.8926] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [6592.2, 11473.4) |
| Best observed range (middle-data check) | [7550.4, 11472.7] |
| Best observed outcome average | 98.252 |
| Best observed outcome average (middle-data check) | 98.235 |
| Backup level (bucket median) | 9486.4 international $/person |
| Math-only vs backup difference | 5680.5 (+149.3%) |
| Middle-data share kept | 80.0% (2861/3577) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6018 (medium confidence) |
| Reliability support component | 0.7981 |
| Reliability significance component | 0.6751 |
| Reliability directional component | 0.7187 |
| Reliability temporal-stability component | 0.5985 |
| Reliability robustness component | 0.0000 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 315.85 international $/person (z=7.19) |
| Point where gains start slowing | 547.92 international $/person (ratio=0.108) |
| Flat zone range | [1495.9, 48525.1] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -6415.8 (-62.8%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.5835 | 0.0000 | 159 | 3577 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.5655 | 0.0180 | 159 | 3577 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.5592 | 0.0243 | 159 | 3577 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.5548 | 0.0287 | 159 | 3577 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [26.880, 270.92) | 358 | 25 | 160.3644 | 150.3132 | 55.1788 | 56.0015 |
| 2 | [270.92, 525.73) | 358 | 37 | 372.7441 | 352.7108 | 69.9140 | 68.4986 |
| 3 | [525.73, 960.18) | 357 | 45 | 724.6496 | 727.2047 | 80.1383 | 83.8357 |
| 4 | [960.18, 1375.3) | 358 | 53 | 1159.2525 | 1157.8927 | 91.5846 | 93.7763 |
| 5 | [1375.3, 2036.6) | 357 | 56 | 1695.4006 | 1666.1668 | 93.3237 | 95.6142 |
| 6 | [2036.6, 3147.3) | 351 | 61 | 2531.3562 | 2500.0271 | 94.3338 | 95.4876 |
| 7 | [3147.3, 4303.6) | 365 | 57 | 3622.4715 | 3587.6595 | 95.9642 | 96.5636 |
| 8 | [4303.6, 6592.2) | 357 | 57 | 5329.4916 | 5316.1275 | 97.7245 | 98.1021 |
| 9 | [6592.2, 11473.4) | 358 | 46 | 9026.3477 | 8996.0512 | 98.2521 | 98.7478 |
| 10 | [11473.4, 48525.1] | 358 | 38 | 16985.6065 | 14869.7654 | 97.4381 | 98.4911 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure Per Capita (PPP))
[26.880, 4068.4) | ############################## 2457
[4068.4, 8109.9) | ###### 513
[8109.9, 12151.4) | #### 300
[12151.4, 16193.0) | ## 176
[16193.0, 20234.5) | # 70
[20234.5, 24276.0) | # 20
[24276.0, 28317.5) | # 15
[28317.5, 32359.0) | # 13
[32359.0, 36400.5) | # 4
[36400.5, 40442.1) | # 4
[40442.1, 44483.6) | # 3
[44483.6, 48525.1] | # 2
```

```text
Outcome Distribution (Primary School Completion Rate, welfare-aligned)
[13.580, 25.463) | # 26
[25.463, 37.345) | ## 74
[37.345, 49.227) | ### 118
[49.227, 61.109) | ##### 219
[61.109, 72.992) | ###### 263
[72.992, 84.874) | ######## 344
[84.874, 96.756) | ####################### 1053
[96.756, 108.64) | ############################## 1364
[108.64, 120.52) | ## 98
[120.52, 132.40) | # 12
[132.40, 144.28) | # 3
[144.28, 156.17] | # 3
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| NIC | -0.7561 | -1.3509 | -31.371 | 18 |
| AFE | -0.8681 | -1.1927 | -23.412 | 34 |
| BRB | -0.7504 | -1.1042 | -10.716 | 19 |
| KNA | 0.4839 | 0.9955 | 10.335 | 23 |
| BGR | -0.7562 | -0.9525 | -4.424 | 24 |
| MWI | -0.5153 | -0.9476 | -27.667 | 25 |
| CAF | 0.7137 | 0.9469 | 36.328 | 12 |
| GRC | -0.1370 | -0.8774 | -0.949 | 18 |
