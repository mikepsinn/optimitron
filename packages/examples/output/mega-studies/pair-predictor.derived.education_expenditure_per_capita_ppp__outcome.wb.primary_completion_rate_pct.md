# Pair Study: Education Expenditure Per Capita (PPP) -> Primary School Completion Rate

- Pair ID: `predictor.derived.education_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct`
- Lag years: 5
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.5724
- Included subjects: 198
- Skipped subjects: 0
- Total aligned pairs: 4555
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.703 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3081 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Education Expenditure Per Capita (PPP) level for higher Primary School Completion Rate: 2362.1 international $/person (data-backed level).
- Best level directly seen in the grouped data: 2362.1 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 2153.7 international $/person; model-optimal minus observed-anchor difference is -1685.8 (-78.3%).
- Backup level check (middle 10-90% of data) suggests 785.62 international $/person.
- The math-only guess and backup level differ by 67.9%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 43.782 international $/person.
- Diminishing returns likely begin near 69.668 international $/person.
- Saturation/plateau zone starts around 308.74 international $/person and extends through 2362.1 international $/person.
- Highest observed mean Primary School Completion Rate appears when Education Expenditure Per Capita (PPP) is in [1497.0, 6496.0] (mean outcome 98.296).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher Education Expenditure Per Capita (PPP) tends to go with better Primary School Completion Rate.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Education Expenditure Per Capita (PPP) tends to align with better Primary School Completion Rate.
- The estimate uses 198 subjects and 4555 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [1497.0, 6496.0] (mean outcome 98.296).
- A minimum effective predictor level appears near 43.782 international $/person in the binned response curve.
- Confidence score is 0.703 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Robustness check: trimmed-range optimal differs by 67.9% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.3696 |
| Reverse correlation | 0.4498 |
| Direction score (forward - reverse) | -0.0803 |
| Effect size (% change from baseline) | 0.0000 |
| Significance score | 0.6919 |
| Weighted PIS | 0.5144 |
| Value linked with higher outcome | 467.8811 |
| Value linked with lower outcome | 460.6176 |
| Math-only best daily value | 467.8811 |
| Recommended level (reader-facing) | 2362.1 international $/person (data-backed level) |
| Math-only guess (technical) | 467.88 international $/person |
| Data-backed level | 2362.1 international $/person |
| Data-backed range | [1690.9, 6496.0] |
| Backup level (middle-data check) | 613.91 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0000, 7006.1701] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [1497.0, 6496.0] |
| Best observed range (middle-data check) | [635.00, 935.72) |
| Best observed outcome average | 98.296 |
| Best observed outcome average (middle-data check) | 97.606 |
| Backup level (bucket median) | 785.62 international $/person |
| Math-only vs backup difference | 317.74 (+67.9%) |
| Middle-data share kept | 80.0% (3643/4555) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.7034 (medium confidence) |
| Reliability support component | 0.8796 |
| Reliability significance component | 0.6919 |
| Reliability directional component | 0.5352 |
| Reliability temporal-stability component | 1.0000 |
| Reliability robustness component | 0.3566 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 43.782 international $/person (z=10.04) |
| Point where gains start slowing | 69.668 international $/person (ratio=0.115) |
| Flat zone range | [273.26, 6496.0] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -1894.2 (-80.2%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 5 | interpolation | 0.5724 | 0.0000 | 198 | 4555 |
| Runner-up | predictor_default | 5 | 2 | interpolation | 0.5383 | 0.0342 | 198 | 4555 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.5374 | 0.0350 | 198 | 4555 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.5251 | 0.0473 | 198 | 4555 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [7.607, 37.111) | 456 | 35 | 24.0149 | 24.6473 | 50.4574 | 51.2045 |
| 2 | [37.111, 65.601) | 426 | 53 | 51.0573 | 52.3341 | 66.4921 | 63.6585 |
| 3 | [65.601, 123.23) | 485 | 59 | 90.2567 | 86.1351 | 75.5611 | 70.9063 |
| 4 | [123.23, 182.98) | 454 | 63 | 150.6112 | 146.5405 | 81.8975 | 84.2422 |
| 5 | [182.98, 273.26) | 456 | 80 | 230.4617 | 233.0708 | 91.7335 | 94.2080 |
| 6 | [273.26, 368.79) | 456 | 82 | 320.8451 | 319.8856 | 92.9569 | 94.7285 |
| 7 | [368.79, 550.93) | 455 | 82 | 458.3856 | 461.9486 | 96.2603 | 97.2327 |
| 8 | [550.93, 868.95) | 456 | 76 | 681.3208 | 670.5131 | 98.0415 | 97.6967 |
| 9 | [868.95, 1497.0) | 455 | 60 | 1131.9321 | 1107.8220 | 96.5830 | 98.2471 |
| 10 | [1497.0, 6496.0] | 456 | 37 | 2459.8624 | 2153.7279 | 98.2959 | 98.9210 |

### Distribution Charts

```text
Predictor Distribution (Education Expenditure Per Capita (PPP))
[7.607, 548.30) | ############################## 3185
[548.30, 1089.0) | ###### 675
[1089.0, 1629.7) | ### 302
[1629.7, 2170.4) | ## 171
[2170.4, 2711.1) | # 95
[2711.1, 3251.8) | # 52
[3251.8, 3792.5) | # 34
[3792.5, 4333.2) | # 18
[4333.2, 4873.9) | # 6
[4873.9, 5414.6) | # 10
[5414.6, 5955.3) | # 2
[5955.3, 6496.0] | # 5
```

```text
Outcome Distribution (Primary School Completion Rate, welfare-aligned)
[13.404, 25.301) | # 59
[25.301, 37.198) | ## 97
[37.198, 49.095) | ### 152
[49.095, 60.992) | ####### 367
[60.992, 72.889) | ######### 486
[72.889, 84.786) | ######### 464
[84.786, 96.682) | ######################## 1233
[96.682, 108.58) | ############################## 1541
[108.58, 120.48) | ### 132
[120.48, 132.37) | # 17
[132.37, 144.27) | # 3
[144.27, 156.17] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| SLE | 0.9051 | 1.8014 | 36.624 | 13 |
| TON | -0.6122 | -1.5763 | -5.779 | 9 |
| COG | -0.6666 | -1.3065 | -21.399 | 20 |
| BGR | -0.8377 | -1.2865 | -4.394 | 24 |
| COL | -0.4499 | -1.2507 | -6.749 | 22 |
| UKR | -0.8218 | -1.2171 | -11.791 | 20 |
| GBR | 0.8395 | 1.2134 | 1.635 | 9 |
| CIV | -0.3430 | -1.1907 | -18.610 | 28 |
