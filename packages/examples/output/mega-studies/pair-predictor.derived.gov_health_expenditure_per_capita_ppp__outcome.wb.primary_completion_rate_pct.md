# Pair Study: Government Health Expenditure Per Capita (PPP) -> Primary School Completion Rate

- Pair ID: `predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct`
- Lag years: 5
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.6025
- Included subjects: 205
- Skipped subjects: 0
- Total aligned pairs: 4678
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.735 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3016 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Health Expenditure Per Capita (PPP) level for higher Primary School Completion Rate: 1214.5 international $/person (data-backed level).
- Best level directly seen in the grouped data: 1214.5 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 2163.9 international $/person; model-optimal minus observed-anchor difference is -1742.4 (-80.5%).
- Backup level check (middle 10-90% of data) suggests 571.13 international $/person.
- The math-only guess and backup level differ by 35.5%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 17.845 international $/person.
- Diminishing returns likely begin near 29.574 international $/person.
- Saturation/plateau zone starts around 279.23 international $/person and extends through 2353.2 international $/person.
- Highest observed mean Primary School Completion Rate appears when Government Health Expenditure Per Capita (PPP) is in [1469.3, 5486.7] (mean outcome 98.126).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher Government Health Expenditure Per Capita (PPP) tends to go with better Primary School Completion Rate.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Health Expenditure Per Capita (PPP) tends to align with better Primary School Completion Rate.
- The estimate uses 205 subjects and 4678 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [1469.3, 5486.7] (mean outcome 98.126).
- A minimum effective predictor level appears near 17.845 international $/person in the binned response curve.
- Confidence score is 0.735 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0174); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 35.5% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.3206 |
| Reverse correlation | 0.4287 |
| Direction score (forward - reverse) | -0.1080 |
| Effect size (% change from baseline) | 14.9265 |
| Significance score | 0.6984 |
| Weighted PIS | 0.5104 |
| Value linked with higher outcome | 421.5028 |
| Value linked with lower outcome | 455.3941 |
| Math-only best daily value | 421.5028 |
| Recommended level (reader-facing) | 1214.5 international $/person (data-backed level) |
| Math-only guess (technical) | 421.50 international $/person |
| Data-backed level | 1214.5 international $/person |
| Data-backed range | [866.48, 1605.4) |
| Backup level (middle-data check) | 630.03 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.2591, 8503.2455] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [1469.3, 5486.7] |
| Best observed range (middle-data check) | [467.96, 740.51) |
| Best observed outcome average | 98.126 |
| Best observed outcome average (middle-data check) | 98.044 |
| Backup level (bucket median) | 571.13 international $/person |
| Math-only vs backup difference | 149.62 (+35.5%) |
| Middle-data share kept | 80.0% (3742/4678) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.7353 (medium confidence) |
| Reliability support component | 0.8898 |
| Reliability significance component | 0.6984 |
| Reliability directional component | 0.7201 |
| Reliability temporal-stability component | 0.5783 |
| Reliability robustness component | 0.7167 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 17.845 international $/person (z=6.67) |
| Point where gains start slowing | 29.574 international $/person (ratio=0.052) |
| Flat zone range | [239.03, 5486.7] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -792.96 (-65.3%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 5 | interpolation | 0.6025 | 0.0000 | 205 | 4678 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.5851 | 0.0174 | 205 | 4678 |
| Runner-up | predictor_default | 5 | 2 | interpolation | 0.5726 | 0.0299 | 205 | 4678 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.5625 | 0.0400 | 205 | 4678 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.25914, 16.706) | 468 | 32 | 10.1716 | 10.1018 | 51.0635 | 51.3294 |
| 2 | [16.706, 27.730) | 468 | 44 | 21.0819 | 20.5125 | 65.9111 | 64.8321 |
| 3 | [27.730, 52.984) | 468 | 51 | 37.8554 | 36.8053 | 74.4173 | 69.1474 |
| 4 | [52.984, 103.90) | 467 | 50 | 77.9653 | 76.1601 | 81.5504 | 83.3728 |
| 5 | [103.90, 168.93) | 468 | 51 | 134.2140 | 132.0659 | 93.8143 | 95.3479 |
| 6 | [168.93, 256.34) | 467 | 64 | 211.9304 | 212.5388 | 92.6778 | 93.7441 |
| 7 | [256.34, 388.75) | 468 | 71 | 313.9251 | 305.2426 | 93.1390 | 95.3893 |
| 8 | [388.75, 630.12) | 468 | 63 | 498.7032 | 501.6274 | 97.1620 | 97.6286 |
| 9 | [630.12, 1469.3) | 468 | 59 | 1004.0323 | 968.9561 | 97.6157 | 98.0692 |
| 10 | [1469.3, 5486.7] | 468 | 34 | 2437.6174 | 2163.8670 | 98.1263 | 98.9925 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure Per Capita (PPP))
[0.25914, 457.46) | ############################## 3434
[457.46, 914.66) | #### 494
[914.66, 1371.9) | ## 236
[1371.9, 1829.1) | ## 183
[1829.1, 2286.3) | # 118
[2286.3, 2743.5) | # 75
[2743.5, 3200.7) | # 52
[3200.7, 3657.9) | # 36
[3657.9, 4115.1) | # 18
[4115.1, 4572.3) | # 15
[4572.3, 5029.5) | # 14
[5029.5, 5486.7] | # 3
```

```text
Outcome Distribution (Primary School Completion Rate, welfare-aligned)
[13.404, 25.301) | # 59
[25.301, 37.198) | ## 107
[37.198, 49.095) | ### 155
[49.095, 60.992) | ######## 391
[60.992, 72.889) | ########## 502
[72.889, 84.786) | ########## 500
[84.786, 96.682) | ######################### 1267
[96.682, 108.58) | ############################## 1541
[108.58, 120.48) | ### 132
[120.48, 132.37) | # 17
[132.37, 144.27) | # 3
[144.27, 156.17] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| GBR | 0.8307 | 1.5392 | 1.635 | 9 |
| SLE | 0.8929 | 1.4543 | 36.940 | 13 |
| LBN | -0.5691 | -1.3333 | -9.949 | 27 |
| COM | -0.4431 | -1.2307 | -29.600 | 13 |
| TON | -0.2839 | -1.2034 | -5.779 | 9 |
| CAF | -0.7253 | -1.1611 | -28.447 | 12 |
| PAN | -0.2415 | -1.1377 | -3.287 | 21 |
| BRB | -0.8500 | -1.1358 | -10.716 | 19 |
