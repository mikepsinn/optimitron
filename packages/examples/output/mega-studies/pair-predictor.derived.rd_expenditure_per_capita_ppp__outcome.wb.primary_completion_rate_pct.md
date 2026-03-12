# Pair Study: R&D Expenditure Per Capita (PPP) -> Primary School Completion Rate

- Pair ID: `predictor.derived.rd_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct`
- Lag years: 5
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 16
- Temporal candidates with valid results: 16
- Temporal profile score: 0.6542
- Included subjects: 111
- Skipped subjects: 0
- Total aligned pairs: 2510
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.655 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3588 (lower is better)

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
- Best observed bin anchor (median/mean) is 455.90 international $/person; model-optimal minus observed-anchor difference is -288.29 (-63.2%).
- Backup level check (middle 10-90% of data) suggests 492.17 international $/person.
- The math-only guess and backup level differ by 193.6%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 5.790 international $/person.
- Diminishing returns likely begin near 12.371 international $/person.
- Saturation/plateau zone starts around 44.740 international $/person and extends through 62.673 international $/person.
- Highest observed mean Primary School Completion Rate appears when R&D Expenditure Per Capita (PPP) is in [284.52, 689.76) (mean outcome 98.750).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher R&D Expenditure Per Capita (PPP) tends to go with better Primary School Completion Rate.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher R&D Expenditure Per Capita (PPP) tends to align with better Primary School Completion Rate.
- The estimate uses 111 subjects and 2510 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [284.52, 689.76) (mean outcome 98.750).
- A minimum effective predictor level appears near 5.790 international $/person in the binned response curve.
- Confidence score is 0.655 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Robustness check: trimmed-range optimal differs by 193.6% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.1271 |
| Reverse correlation | 0.3554 |
| Direction score (forward - reverse) | -0.2283 |
| Effect size (% change from baseline) | 2.9891 |
| Significance score | 0.6412 |
| Weighted PIS | 0.4334 |
| Value linked with higher outcome | 167.6155 |
| Value linked with lower outcome | 186.7126 |
| Math-only best daily value | 167.6155 |
| Recommended level (reader-facing) | 553.39 international $/person (data-backed level) |
| Math-only guess (technical) | 167.62 international $/person |
| Data-backed level | 553.39 international $/person |
| Data-backed range | [408.16, 769.50) |
| Backup level (middle-data check) | 520.85 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.1972, 3227.4604] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [284.52, 689.76) |
| Best observed range (middle-data check) | [356.13, 689.50] |
| Best observed outcome average | 98.750 |
| Best observed outcome average (middle-data check) | 99.097 |
| Backup level (bucket median) | 492.17 international $/person |
| Math-only vs backup difference | 324.55 (+193.6%) |
| Middle-data share kept | 80.2% (2014/2510) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6551 (medium confidence) |
| Reliability support component | 0.5792 |
| Reliability significance component | 0.6412 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 1.0000 |
| Reliability robustness component | 0.0000 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 5.790 international $/person (z=10.77) |
| Point where gains start slowing | 12.371 international $/person (ratio=0.024) |
| Flat zone range | [38.131, 75.167) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -385.77 (-69.7%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 8 | interpolation | 0.6542 | 0.0000 | 111 | 2510 |
| Runner-up | predictor_default | 5 | 5 | interpolation | 0.6113 | 0.0430 | 111 | 2510 |
| Runner-up | predictor_default | 3 | 8 | interpolation | 0.5988 | 0.0554 | 111 | 2510 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.5611 | 0.0931 | 111 | 2510 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.33670, 4.633) | 245 | 16 | 2.3810 | 2.0933 | 73.7670 | 80.0991 |
| 2 | [4.633, 11.759) | 252 | 25 | 7.6750 | 7.8579 | 93.2711 | 95.3424 |
| 3 | [11.759, 24.101) | 243 | 32 | 18.0337 | 18.7099 | 91.7662 | 93.2465 |
| 4 | [24.101, 36.029) | 264 | 35 | 28.3974 | 27.6291 | 94.9602 | 96.2823 |
| 5 | [36.029, 52.001) | 250 | 41 | 43.3855 | 43.0478 | 95.9086 | 97.0543 |
| 6 | [52.001, 80.736) | 252 | 46 | 65.3030 | 63.9978 | 97.3384 | 98.1611 |
| 7 | [80.736, 127.45) | 251 | 41 | 102.1253 | 102.0724 | 93.8074 | 96.0848 |
| 8 | [127.45, 284.52) | 251 | 35 | 186.9619 | 179.9666 | 95.9743 | 97.7134 |
| 9 | [284.52, 689.76) | 251 | 28 | 467.5580 | 455.9014 | 98.7503 | 98.6722 |
| 10 | [689.76, 1938.7] | 251 | 20 | 1059.5487 | 1006.4109 | 97.5296 | 98.9559 |

### Distribution Charts

```text
Predictor Distribution (R&D Expenditure Per Capita (PPP))
[0.33670, 161.87) | ############################## 1852
[161.87, 323.39) | ### 184
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
| BGR | -0.7609 | -1.3599 | -4.646 | 24 |
| GBR | 0.8923 | 1.3355 | 1.294 | 9 |
| UKR | -0.8278 | -1.2123 | -11.791 | 20 |
| DEU | -0.6214 | -1.2061 | -2.865 | 24 |
| PST | -0.6713 | -1.1907 | -0.897 | 25 |
| EST | -0.7188 | -1.1674 | -4.234 | 24 |
