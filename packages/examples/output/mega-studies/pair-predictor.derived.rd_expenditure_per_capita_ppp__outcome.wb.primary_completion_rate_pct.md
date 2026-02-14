# Pair Study: R&D Expenditure Per Capita (PPP) -> Primary School Completion Rate

- Pair ID: `predictor.derived.rd_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct`
- Lag years: 5
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 16
- Temporal candidates with valid results: 16
- Temporal profile score: 0.6539
- Included subjects: 111
- Skipped subjects: 0
- Total aligned pairs: 2510
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.655 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3589 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended R&D Expenditure Per Capita (PPP) level for higher Primary School Completion Rate: 553.39 international $/person (data-backed level).
- Best level directly seen in the grouped data: 553.39 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 455.90 international $/person; model-optimal minus observed-anchor difference is -288.47 (-63.3%).
- Backup level check (middle 10-90% of data) suggests 492.17 international $/person.
- The math-only guess and backup level differ by 193.9%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 5.779 international $/person.
- Diminishing returns likely begin near 12.371 international $/person.
- Saturation/plateau zone starts around 44.489 international $/person and extends through 62.673 international $/person.
- Highest observed mean Primary School Completion Rate appears when R&D Expenditure Per Capita (PPP) is in [282.47, 689.76) (mean outcome 98.769).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher R&D Expenditure Per Capita (PPP) tends to go with better Primary School Completion Rate.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher R&D Expenditure Per Capita (PPP) tends to align with better Primary School Completion Rate.
- The estimate uses 111 subjects and 2510 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [282.47, 689.76) (mean outcome 98.769).
- A minimum effective predictor level appears near 5.779 international $/person in the binned response curve.
- Confidence score is 0.655 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Robustness check: trimmed-range optimal differs by 193.9% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.1273 |
| Reverse correlation | 0.3554 |
| Direction score (forward - reverse) | -0.2280 |
| Effect size (% change from baseline) | 2.9856 |
| Significance score | 0.6411 |
| Weighted PIS | 0.4332 |
| Value linked with higher outcome | 167.4348 |
| Value linked with lower outcome | 186.2267 |
| Math-only best daily value | 167.4348 |
| Recommended level (reader-facing) | 553.39 international $/person (data-backed level) |
| Math-only guess (technical) | 167.43 international $/person |
| Data-backed level | 553.39 international $/person |
| Data-backed range | [408.16, 769.50) |
| Backup level (middle-data check) | 520.40 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.1972, 3227.4604] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [282.47, 689.76) |
| Best observed range (middle-data check) | [356.13, 689.50] |
| Best observed outcome average | 98.769 |
| Best observed outcome average (middle-data check) | 99.097 |
| Backup level (bucket median) | 492.17 international $/person |
| Math-only vs backup difference | 324.73 (+193.9%) |
| Middle-data share kept | 80.2% (2014/2510) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6551 (medium confidence) |
| Reliability support component | 0.5792 |
| Reliability significance component | 0.6411 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 1.0000 |
| Reliability robustness component | 0.0000 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 5.779 international $/person (z=10.77) |
| Point where gains start slowing | 12.371 international $/person (ratio=0.024) |
| Flat zone range | [38.041, 74.977) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -385.95 (-69.7%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 8 | interpolation | 0.6539 | 0.0000 | 111 | 2510 |
| Runner-up | predictor_default | 5 | 5 | interpolation | 0.6110 | 0.0429 | 111 | 2510 |
| Runner-up | predictor_default | 3 | 8 | interpolation | 0.6001 | 0.0538 | 111 | 2510 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.5612 | 0.0927 | 111 | 2510 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.33670, 4.633) | 245 | 16 | 2.3791 | 2.0933 | 73.7670 | 80.0991 |
| 2 | [4.633, 11.759) | 252 | 25 | 7.6711 | 7.8579 | 93.2711 | 95.3424 |
| 3 | [11.759, 24.101) | 245 | 32 | 18.0565 | 18.6908 | 91.7968 | 93.3030 |
| 4 | [24.101, 35.920) | 262 | 35 | 28.4023 | 27.5595 | 94.9893 | 96.3313 |
| 5 | [35.920, 51.579) | 251 | 42 | 43.2948 | 43.1566 | 95.8737 | 96.7916 |
| 6 | [51.579, 80.617) | 251 | 46 | 65.0439 | 63.4677 | 97.3029 | 98.1664 |
| 7 | [80.617, 125.86) | 251 | 41 | 101.3381 | 100.3380 | 93.8377 | 96.1172 |
| 8 | [125.86, 282.47) | 251 | 35 | 185.6581 | 177.8917 | 95.9661 | 97.6072 |
| 9 | [282.47, 689.76) | 251 | 27 | 467.4713 | 455.9014 | 98.7694 | 98.6799 |
| 10 | [689.76, 1938.7] | 251 | 20 | 1059.4925 | 1006.4109 | 97.5296 | 98.9559 |

### Distribution Charts

```text
Predictor Distribution (R&D Expenditure Per Capita (PPP))
[0.33670, 161.87) | ############################## 1856
[161.87, 323.39) | ### 180
[323.39, 484.92) | ## 114
[484.92, 646.45) | ## 93
[646.45, 807.98) | # 76
[807.98, 969.51) | # 52
[969.51, 1131.0) | # 47
[1131.0, 1292.6) | # 35
[1292.6, 1454.1) | # 33
[1454.1, 1615.6) | # 16
[1615.6, 1777.2) | # 5
[1777.2, 1938.7] | # 3
```

```text
Outcome Distribution (Primary School Completion Rate, welfare-aligned)
[17.804, 27.532) | # 14
[27.532, 37.261) | # 14
[37.261, 46.989) | # 5
[46.989, 56.718) | # 28
[56.718, 66.446) | # 43
[66.446, 76.175) | ## 71
[76.175, 85.903) | #### 199
[85.903, 95.632) | ############### 684
[95.632, 105.36) | ############################## 1358
[105.36, 115.09) | ## 79
[115.09, 124.82) | # 12
[124.82, 134.55] | # 3
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| KGZ | 0.5909 | 1.3812 | 3.828 | 27 |
| COL | -0.4427 | -1.3694 | -6.386 | 22 |
| BGR | -0.7585 | -1.3464 | -4.838 | 24 |
| GBR | 0.8923 | 1.3355 | 1.294 | 9 |
| UKR | -0.8278 | -1.2123 | -11.791 | 20 |
| DEU | -0.6214 | -1.2061 | -2.865 | 24 |
| PST | -0.6712 | -1.1906 | -0.897 | 25 |
| EST | -0.7188 | -1.1674 | -4.234 | 24 |
