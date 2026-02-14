# Pair Study: R&D Share of Government Spending -> Primary School Completion Rate

- Pair ID: `predictor.derived.rd_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct`
- Lag years: 3
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 16
- Temporal candidates with valid results: 16
- Temporal profile score: 0.5381
- Included subjects: 90
- Skipped subjects: 0
- Total aligned pairs: 2012
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.616 (medium confidence)
- Signal tag: not enough data
- Direction: negative
- Uncertainty score: 0.4149 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended R&D Share of Government Spending level for higher Primary School Completion Rate: 12.049 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 12.049 % of government expenditure.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 10.945 % of government expenditure; model-optimal minus observed-anchor difference is -7.702 (-70.4%).
- Backup level check (middle 10-90% of data) suggests 1.050 % of government expenditure.
- The math-only guess and backup level differ by 67.6%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 0.74231 % of government expenditure.
- Diminishing returns likely begin near 1.039 % of government expenditure.
- Saturation/plateau zone starts around 1.447 % of government expenditure and extends through 2.755 % of government expenditure.
- Highest observed mean Primary School Completion Rate appears when R&D Share of Government Spending is in [8.367, 26.042] (mean outcome 98.679).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: lower R&D Share of Government Spending tends to go with better Primary School Completion Rate.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher R&D Share of Government Spending tends to align with worse Primary School Completion Rate.
- The estimate uses 90 subjects and 2012 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [8.367, 26.042] (mean outcome 98.679).
- A minimum effective predictor level appears near 0.74231 % of government expenditure in the binned response curve.
- Confidence score is 0.616 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0198); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 67.6% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.2074 |
| Reverse correlation | -0.0369 |
| Direction score (forward - reverse) | -0.1705 |
| Effect size (% change from baseline) | -2.2264 |
| Significance score | 0.5851 |
| Weighted PIS | 0.4088 |
| Value linked with higher outcome | 3.2428 |
| Value linked with lower outcome | 3.3993 |
| Math-only best daily value | 3.2428 |
| Recommended level (reader-facing) | 12.049 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 3.243 % of government expenditure |
| Data-backed level | 12.049 % of government expenditure |
| Data-backed range | [8.782, 26.042] |
| Backup level (middle-data check) | 1.355 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0487, 35.0684] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [8.367, 26.042] |
| Best observed range (middle-data check) | [0.95227, 1.327) |
| Best observed outcome average | 98.679 |
| Best observed outcome average (middle-data check) | 96.076 |
| Backup level (bucket median) | 1.050 % of government expenditure |
| Math-only vs backup difference | -2.192 (-67.6%) |
| Middle-data share kept | 79.9% (1608/2012) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6163 (medium confidence) |
| Reliability support component | 0.4677 |
| Reliability significance component | 0.5851 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.6607 |
| Reliability robustness component | 0.3599 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 0.74231 % of government expenditure (z=4.80) |
| Point where gains start slowing | 1.039 % of government expenditure (ratio=-0.211) |
| Flat zone range | [1.272, 2.935) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -8.806 (-73.1%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 8 | interpolation | 0.5381 | 0.0000 | 90 | 2012 |
| Runner-up | predictor_default | 5 | 5 | interpolation | 0.5183 | 0.0198 | 90 | 2012 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.4859 | 0.0521 | 90 | 2012 |
| Runner-up | predictor_default | 2 | 8 | interpolation | 0.4577 | 0.0804 | 90 | 2012 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.06241, 0.67470) | 202 | 14 | 0.4523 | 0.4822 | 91.0070 | 93.4152 |
| 2 | [0.67470, 1.026) | 201 | 23 | 0.8402 | 0.8167 | 95.1627 | 95.7778 |
| 3 | [1.026, 1.488) | 201 | 28 | 1.2512 | 1.2717 | 95.5403 | 97.2928 |
| 4 | [1.488, 1.948) | 201 | 27 | 1.7121 | 1.7154 | 95.4290 | 97.9793 |
| 5 | [1.948, 2.465) | 201 | 28 | 2.1774 | 2.1557 | 95.2298 | 97.9011 |
| 6 | [2.465, 3.015) | 186 | 25 | 2.7564 | 2.7978 | 94.8106 | 97.2278 |
| 7 | [3.015, 3.718) | 216 | 26 | 3.2410 | 3.2027 | 85.4354 | 95.4248 |
| 8 | [3.718, 4.929) | 201 | 21 | 4.4492 | 4.5534 | 95.2042 | 97.8003 |
| 9 | [4.929, 8.367) | 201 | 20 | 6.5667 | 6.6744 | 95.8020 | 97.8530 |
| 10 | [8.367, 26.042] | 202 | 12 | 11.9727 | 10.9448 | 98.6790 | 99.0381 |

### Distribution Charts

```text
Predictor Distribution (R&D Share of Government Spending)
[0.06241, 2.227) | ############################## 932
[2.227, 4.392) | ################## 551
[4.392, 6.557) | ####### 225
[6.557, 8.722) | #### 131
[8.722, 10.887) | ## 72
[10.887, 13.052) | # 44
[13.052, 15.217) | # 17
[15.217, 17.382) | # 20
[17.382, 19.547) | # 17
[19.547, 21.712) | # 1
[23.877, 26.042] | # 2
```

```text
Outcome Distribution (Primary School Completion Rate, welfare-aligned)
[17.804, 27.532) | # 14
[27.532, 37.261) | # 14
[37.261, 46.989) | # 5
[46.989, 56.718) | # 9
[56.718, 66.446) | # 31
[66.446, 76.175) | # 56
[76.175, 85.903) | ### 128
[85.903, 95.632) | ############ 475
[95.632, 105.36) | ############################## 1203
[105.36, 115.09) | ## 64
[115.09, 124.82) | # 10
[124.82, 134.55] | # 3
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| GBR | 0.8752 | 1.4261 | 1.294 | 9 |
| COL | -0.6850 | -1.4006 | -6.386 | 22 |
| EST | -0.7917 | -1.3914 | -4.717 | 24 |
| ZAF | 0.4973 | 1.3407 | 9.656 | 15 |
| NOR | -0.4870 | -1.2733 | -0.237 | 24 |
| RUS | -0.7574 | -1.2155 | -3.821 | 13 |
| DEU | -0.6159 | -1.2059 | -2.649 | 24 |
| ESP | -0.7265 | -1.1760 | -2.133 | 19 |
