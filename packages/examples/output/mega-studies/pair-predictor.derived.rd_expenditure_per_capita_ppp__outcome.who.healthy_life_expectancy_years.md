# Pair Study: R&D Expenditure Per Capita (PPP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.rd_expenditure_per_capita_ppp__outcome.who.healthy_life_expectancy_years`
- Lag years: 2
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 16
- Temporal candidates with valid results: 16
- Temporal profile score: 0.7493
- Included subjects: 95
- Skipped subjects: 0
- Total aligned pairs: 6270
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.658 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.0668 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended R&D Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy (HALE): 1356.1 international $/person (data-backed level).
- Best level directly seen in the grouped data: 1356.1 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 1302.4 international $/person; model-optimal minus observed-anchor difference is -953.04 (-73.2%).
- Backup level check (middle 10-90% of data) suggests 805.20 international $/person.
- The math-only guess and backup level differ by 130.4%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 5.168 international $/person.
- Diminishing returns likely begin near 12.003 international $/person.
- Saturation/plateau zone starts around 540.46 international $/person and extends through 1356.1 international $/person.
- Highest observed mean Healthy Life Expectancy (HALE) appears when R&D Expenditure Per Capita (PPP) is in [984.07, 2227.7] (mean outcome 70.299).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Medium signal; still sensitive to model choices.
- Pattern hint: higher R&D Expenditure Per Capita (PPP) tends to go with better Healthy Life Expectancy (HALE).
- Signal strength: stronger in this report set.

## Plain-Language Summary

- Higher R&D Expenditure Per Capita (PPP) tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 95 subjects and 6270 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [984.07, 2227.7] (mean outcome 70.299).
- A minimum effective predictor level appears near 5.168 international $/person in the binned response curve.
- Confidence score is 0.658 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0041); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 130.4% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.4413 |
| Reverse correlation | 0.6453 |
| Direction score (forward - reverse) | -0.2040 |
| Effect size (% change from baseline) | 2.7520 |
| Significance score | 0.9332 |
| Weighted PIS | 0.4793 |
| Value linked with higher outcome | 349.4044 |
| Value linked with lower outcome | 240.2505 |
| Math-only best daily value | 349.4044 |
| Recommended level (reader-facing) | 1356.1 international $/person (data-backed level) |
| Math-only guess (technical) | 349.40 international $/person |
| Data-backed level | 1356.1 international $/person |
| Data-backed range | [1081.6, 2227.7] |
| Backup level (middle-data check) | 832.82 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.1972, 3227.4604] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [984.07, 2227.7] |
| Best observed range (middle-data check) | [641.05, 983.99] |
| Best observed outcome average | 70.299 |
| Best observed outcome average (middle-data check) | 69.426 |
| Backup level (bucket median) | 805.20 international $/person |
| Math-only vs backup difference | 455.80 (+130.4%) |
| Middle-data share kept | 80.1% (5025/6270) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6578 (medium confidence) |
| Reliability support component | 0.8167 |
| Reliability significance component | 0.9332 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.1355 |
| Reliability robustness component | 0.0000 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 5.168 international $/person (z=8.11) |
| Point where gains start slowing | 12.003 international $/person (ratio=0.100) |
| Flat zone range | [421.41, 2227.7] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -1006.7 (-74.2%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 3 | interpolation | 0.7493 | 0.0000 | 95 | 6270 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.7453 | 0.0041 | 95 | 6270 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.7444 | 0.0050 | 95 | 6270 |
| Runner-up | predictor_default | 1 | 5 | interpolation | 0.7422 | 0.0072 | 95 | 6270 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.19723, 4.613) | 618 | 18 | 2.3734 | 2.2318 | 58.9927 | 60.1360 |
| 2 | [4.613, 11.087) | 636 | 21 | 7.4869 | 7.6446 | 61.4661 | 61.8401 |
| 3 | [11.087, 24.253) | 627 | 30 | 17.1947 | 16.2889 | 62.1348 | 62.4961 |
| 4 | [24.253, 43.980) | 627 | 36 | 33.1914 | 33.0383 | 63.5899 | 64.1014 |
| 5 | [43.980, 71.636) | 627 | 36 | 57.7832 | 57.9164 | 64.4206 | 65.3890 |
| 6 | [71.636, 120.98) | 627 | 35 | 92.1846 | 89.1112 | 64.5565 | 65.4448 |
| 7 | [120.98, 275.23) | 627 | 30 | 185.7405 | 177.5360 | 66.6791 | 66.9574 |
| 8 | [275.23, 573.37) | 627 | 34 | 413.9161 | 421.4101 | 68.1864 | 68.4392 |
| 9 | [573.37, 984.07) | 627 | 26 | 769.8248 | 763.4699 | 69.3222 | 69.4762 |
| 10 | [984.07, 2227.7] | 627 | 21 | 1340.2222 | 1302.4465 | 70.2989 | 70.5071 |

### Distribution Charts

```text
Predictor Distribution (R&D Expenditure Per Capita (PPP))
[0.19723, 185.82) | ############################## 4113
[185.82, 371.45) | #### 489
[371.45, 557.07) | ### 390
[557.07, 742.69) | ## 297
[742.69, 928.32) | ## 273
[928.32, 1113.9) | ## 225
[1113.9, 1299.6) | # 165
[1299.6, 1485.2) | # 162
[1485.2, 1670.8) | # 75
[1670.8, 1856.4) | # 48
[1856.4, 2042.1) | # 24
[2042.1, 2227.7] | # 9
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[41.561, 44.357) | # 9
[44.357, 47.153) | # 39
[47.153, 49.949) | # 33
[49.949, 52.745) | # 69
[52.745, 55.541) | #### 183
[55.541, 58.337) | ###### 286
[58.337, 61.133) | ############ 591
[61.133, 63.929) | #################### 1019
[63.929, 66.725) | ########################### 1387
[66.725, 69.521) | ############################## 1530
[69.521, 72.317) | ##################### 1046
[72.317, 75.113] | ## 78
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| HND | -0.2633 | -1.0573 | -0.196 | 66 |
| PRY | -0.2993 | -0.9549 | -0.678 | 66 |
| UKR | 0.2851 | 0.8633 | 2.314 | 66 |
| PER | -0.1839 | -0.8456 | -0.068 | 66 |
| ARE | -0.0270 | -0.8015 | 0.675 | 66 |
| MUS | 0.1804 | -0.7516 | 0.844 | 66 |
| BGR | 0.2124 | -0.7316 | 1.557 | 66 |
| USA | -0.1167 | -0.7214 | 0.269 | 66 |
