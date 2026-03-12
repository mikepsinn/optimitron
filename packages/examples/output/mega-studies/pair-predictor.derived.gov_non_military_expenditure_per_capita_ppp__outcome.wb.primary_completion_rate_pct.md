# Pair Study: Civilian Government Expenditure Per Capita (PPP) -> Primary School Completion Rate

- Pair ID: `predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5517
- Included subjects: 133
- Skipped subjects: 0
- Total aligned pairs: 3043
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.464 (lower confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3181 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Civilian Government Expenditure Per Capita (PPP) level for higher Primary School Completion Rate: 9890.8 international $/person (data-backed level).
- Best level directly seen in the grouped data: 9890.8 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 9070.9 international $/person; model-optimal minus observed-anchor difference is -5284.3 (-58.3%).
- Backup level check (middle 10-90% of data) suggests 9335.5 international $/person.
- The math-only guess and backup level differ by 146.5%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 268.78 international $/person.
- Diminishing returns likely begin near 418.04 international $/person.
- Saturation/plateau zone starts around 1650.1 international $/person and extends through 15270.9 international $/person.
- Highest observed mean Primary School Completion Rate appears when Civilian Government Expenditure Per Capita (PPP) is in [7046.1, 10884.1) (mean outcome 98.645).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher Civilian Government Expenditure Per Capita (PPP) tends to go with better Primary School Completion Rate.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Civilian Government Expenditure Per Capita (PPP) tends to align with better Primary School Completion Rate.
- The estimate uses 133 subjects and 3043 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [7046.1, 10884.1) (mean outcome 98.645).
- A minimum effective predictor level appears near 268.78 international $/person in the binned response curve.
- Confidence score is 0.464 (lower confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0006); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 146.5% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.2900 |
| Reverse correlation | 0.3770 |
| Direction score (forward - reverse) | -0.0870 |
| Effect size (% change from baseline) | 0.0000 |
| Significance score | 0.6819 |
| Weighted PIS | 0.5215 |
| Value linked with higher outcome | 3786.6471 |
| Value linked with lower outcome | 4202.2184 |
| Math-only best daily value | 3786.6471 |
| Recommended level (reader-facing) | 9890.8 international $/person (data-backed level) |
| Math-only guess (technical) | 3786.6 international $/person |
| Data-backed level | 9890.8 international $/person |
| Data-backed range | [8434.9, 11641.8) |
| Backup level (middle-data check) | 4959.7 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [7.6041, 62399.1940] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [7046.1, 10884.1) |
| Best observed range (middle-data check) | [7830.5, 10872.8] |
| Best observed outcome average | 98.645 |
| Best observed outcome average (middle-data check) | 98.748 |
| Backup level (bucket median) | 9335.5 international $/person |
| Math-only vs backup difference | 5548.8 (+146.5%) |
| Middle-data share kept | 80.3% (2443/3043) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.4637 (lower confidence) |
| Reliability support component | 0.6969 |
| Reliability significance component | 0.6819 |
| Reliability directional component | 0.5800 |
| Reliability temporal-stability component | 0.0197 |
| Reliability robustness component | 0.0000 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 268.78 international $/person (z=5.58) |
| Point where gains start slowing | 418.04 international $/person (ratio=0.101) |
| Flat zone range | [1357.2, 47874.3] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -6104.2 (-61.7%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.5517 | 0.0000 | 133 | 3043 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.5511 | 0.0006 | 133 | 3043 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.5461 | 0.0057 | 133 | 3043 |
| Runner-up | predictor_default | 2 | 1 | interpolation | 0.5449 | 0.0069 | 133 | 3043 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [13.662, 214.06) | 295 | 19 | 123.9764 | 112.7282 | 53.8362 | 54.4618 |
| 2 | [214.06, 393.60) | 310 | 28 | 290.3854 | 287.4093 | 66.3224 | 64.0319 |
| 3 | [393.60, 806.93) | 308 | 38 | 576.4900 | 561.4437 | 76.2305 | 75.9552 |
| 4 | [806.93, 1220.2) | 304 | 46 | 1013.7753 | 999.6852 | 90.1231 | 93.4152 |
| 5 | [1220.2, 1924.4) | 304 | 48 | 1591.2888 | 1591.0749 | 91.6095 | 94.3855 |
| 6 | [1924.4, 3080.2) | 298 | 50 | 2501.5151 | 2485.3115 | 95.5921 | 96.4691 |
| 7 | [3080.2, 4316.3) | 311 | 49 | 3617.6815 | 3547.5206 | 94.7597 | 96.5335 |
| 8 | [4316.3, 7046.1) | 304 | 45 | 5432.1956 | 5313.8055 | 98.0031 | 98.2203 |
| 9 | [7046.1, 10884.1) | 304 | 40 | 8975.2442 | 9070.9097 | 98.6450 | 98.7849 |
| 10 | [10884.1, 47874.3] | 305 | 34 | 16405.9616 | 14406.4076 | 97.1113 | 98.4656 |

### Distribution Charts

```text
Predictor Distribution (Civilian Government Expenditure Per Capita (PPP))
[13.662, 4002.0) | ############################## 2077
[4002.0, 7990.4) | ###### 429
[7990.4, 11978.8) | #### 294
[11978.8, 15967.2) | ## 133
[15967.2, 19955.6) | # 54
[19955.6, 23944.0) | # 28
[23944.0, 27932.3) | # 15
[27932.3, 31920.7) | # 2
[31920.7, 35909.1) | # 3
[35909.1, 39897.5) | # 3
[39897.5, 43885.9) | # 3
[43885.9, 47874.3] | # 2
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
| AFE | -0.8693 | -1.1885 | -23.412 | 34 |
| CAF | 0.7059 | 0.9792 | 36.328 | 12 |
| BGR | -0.7607 | -0.9606 | -4.424 | 24 |
| MWI | -0.5198 | -0.9517 | -27.667 | 25 |
| GRC | -0.1249 | -0.8756 | -0.949 | 18 |
| TZA | 0.3370 | 0.8710 | 10.359 | 27 |
| PST | -0.6646 | -0.8133 | -0.869 | 25 |
| GBR | 0.8530 | 0.8008 | 1.419 | 9 |
