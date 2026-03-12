# Pair Study: Government Expenditure Per Capita (PPP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.gov_expenditure_per_capita_ppp__outcome.who.healthy_life_expectancy_years`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.7400
- Included subjects: 147
- Skipped subjects: 0
- Total aligned pairs: 9702
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.693 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.0675 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy (HALE): 16474.4 international $/person (data-backed level).
- Best level directly seen in the grouped data: 16474.4 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 15541.4 international $/person; model-optimal minus observed-anchor difference is -10445.2 (-67.2%).
- Backup level check (middle 10-90% of data) suggests 10299.8 international $/person.
- The math-only guess and backup level differ by 102.1%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 302.76 international $/person.
- Diminishing returns likely begin near 596.04 international $/person.
- Saturation/plateau zone starts around 4866.0 international $/person and extends through 16474.4 international $/person.
- Highest observed mean Healthy Life Expectancy (HALE) appears when Government Expenditure Per Capita (PPP) is in [12184.4, 43487.5] (mean outcome 69.003).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger signal compared with most other predictors in this report.
- Pattern hint: higher Government Expenditure Per Capita (PPP) tends to go with better Healthy Life Expectancy (HALE).
- Signal strength: stronger in this report set.

## Plain-Language Summary

- Higher Government Expenditure Per Capita (PPP) tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 147 subjects and 9702 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [12184.4, 43487.5] (mean outcome 69.003).
- A minimum effective predictor level appears near 302.76 international $/person in the binned response curve.
- Confidence score is 0.693 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0024); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 102.1% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.5241 |
| Reverse correlation | 0.6877 |
| Direction score (forward - reverse) | -0.1636 |
| Effect size (% change from baseline) | 4.3195 |
| Significance score | 0.9325 |
| Weighted PIS | 0.5554 |
| Value linked with higher outcome | 5096.1758 |
| Value linked with lower outcome | 3916.7127 |
| Math-only best daily value | 5096.1758 |
| Recommended level (reader-facing) | 16474.4 international $/person (data-backed level) |
| Math-only guess (technical) | 5096.2 international $/person |
| Data-backed level | 16474.4 international $/person |
| Data-backed range | [13152.1, 43487.5] |
| Backup level (middle-data check) | 10672.1 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [8.5216, 63562.8926] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [12184.4, 43487.5] |
| Best observed range (middle-data check) | [8772.9, 12184.4] |
| Best observed outcome average | 69.003 |
| Best observed outcome average (middle-data check) | 68.352 |
| Backup level (bucket median) | 10299.8 international $/person |
| Math-only vs backup difference | 5203.6 (+102.1%) |
| Middle-data share kept | 80.6% (7815/9702) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6927 (medium confidence) |
| Reliability support component | 0.9900 |
| Reliability significance component | 0.9325 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.0806 |
| Reliability robustness component | 0.0000 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 302.76 international $/person (z=11.04) |
| Point where gains start slowing | 596.04 international $/person (ratio=0.111) |
| Flat zone range | [4100.3, 43487.5] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -11378.2 (-69.1%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.7400 | 0.0000 | 147 | 9702 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.7376 | 0.0024 | 147 | 9702 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.7313 | 0.0088 | 147 | 9702 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.7206 | 0.0194 | 147 | 9702 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [20.664, 235.66) | 918 | 19 | 144.1916 | 135.3459 | 50.8583 | 51.3564 |
| 2 | [235.66, 576.55) | 987 | 36 | 389.1286 | 372.3200 | 55.5347 | 56.5239 |
| 3 | [576.55, 974.44) | 1005 | 43 | 757.9740 | 742.4996 | 57.6074 | 58.7963 |
| 4 | [974.44, 1464.8) | 969 | 52 | 1204.9912 | 1197.9501 | 60.4368 | 62.2117 |
| 5 | [1464.8, 2105.7) | 972 | 53 | 1763.4107 | 1752.4924 | 61.8203 | 63.2320 |
| 6 | [2105.7, 3192.2) | 969 | 52 | 2623.0325 | 2581.0006 | 62.9431 | 64.7048 |
| 7 | [3192.2, 4680.7) | 969 | 49 | 3913.5619 | 3863.8129 | 64.1829 | 65.2720 |
| 8 | [4680.7, 7862.8) | 972 | 47 | 6123.2942 | 6007.2503 | 66.8546 | 67.0024 |
| 9 | [7862.8, 12184.4) | 969 | 41 | 9977.9393 | 9947.4661 | 68.1488 | 68.6415 |
| 10 | [12184.4, 43487.5] | 972 | 31 | 17506.2570 | 15541.3605 | 69.0032 | 69.7821 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure Per Capita (PPP))
[20.664, 3642.9) | ############################## 6111
[3642.9, 7265.1) | ####### 1497
[7265.1, 10887.4) | #### 870
[10887.4, 14509.6) | ### 612
[14509.6, 18131.9) | ## 312
[18131.9, 21754.1) | # 150
[21754.1, 25376.3) | # 57
[25376.3, 28998.6) | # 27
[28998.6, 32620.8) | # 39
[32620.8, 36243.0) | # 9
[36243.0, 39865.3) | # 9
[39865.3, 43487.5] | # 9
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[36.729, 39.928) | # 71
[39.928, 43.126) | ## 148
[43.126, 46.325) | #### 238
[46.325, 49.524) | ##### 324
[49.524, 52.723) | ######## 505
[52.723, 55.921) | ########## 695
[55.921, 59.120) | ############# 886
[59.120, 62.319) | #################### 1324
[62.319, 65.517) | ############################ 1890
[65.517, 68.716) | ############################## 1995
[68.716, 71.915) | ####################### 1520
[71.915, 75.113] | ## 106
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| MWI | -0.7737 | -1.2788 | -17.373 | 66 |
| PRY | -0.2080 | -1.0775 | -0.324 | 66 |
| PER | 0.0389 | -0.9044 | 1.065 | 66 |
| PAN | 0.0499 | -0.8815 | 0.869 | 66 |
| MEX | -0.0520 | -0.8732 | 0.070 | 66 |
| BHS | -0.0584 | -0.8389 | 0.048 | 66 |
| CPV | -0.1556 | -0.8285 | 0.417 | 66 |
| VCT | 0.0779 | -0.8073 | 0.138 | 66 |
