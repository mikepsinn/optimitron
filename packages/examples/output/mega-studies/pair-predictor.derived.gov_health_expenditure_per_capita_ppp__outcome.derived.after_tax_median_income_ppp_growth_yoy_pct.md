# Pair Study: Government Health Expenditure Per Capita (PPP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 2
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6145
- Included subjects: 229
- Skipped subjects: 0
- Total aligned pairs: 7356
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.632 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3237 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Health Expenditure Per Capita (PPP) level for higher After-Tax Median Income Growth (YoY %): 67.449 international $/person (data-backed level).
- Best level directly seen in the grouped data: 67.449 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 46.636 international $/person; model-optimal minus observed-anchor difference is 536.49 (+1150.4%).
- Backup level check (middle 10-90% of data) suggests 37.036 international $/person.
- The math-only guess and backup level differ by 93.6%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 35.834 international $/person.
- Diminishing returns likely begin near 35.834 international $/person.
- Saturation/plateau zone starts around 917.14 international $/person and extends through 2790.9 international $/person.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Government Health Expenditure Per Capita (PPP) is in [34.371, 71.973) (mean outcome 5.158).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher Government Health Expenditure Per Capita (PPP) tends to go with better After-Tax Median Income Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Health Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 229 subjects and 7356 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [34.371, 71.973) (mean outcome 5.158).
- A minimum effective predictor level appears near 35.834 international $/person in the binned response curve.
- Confidence score is 0.632 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Top temporal profiles are close (score delta 0.0064); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 93.6% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.0910 |
| Reverse correlation | -0.0368 |
| Direction score (forward - reverse) | 0.1278 |
| Effect size (% change from baseline) | 107.6031 |
| Significance score | 0.6763 |
| Weighted PIS | 0.1781 |
| Value linked with higher outcome | 583.1259 |
| Value linked with lower outcome | 560.1769 |
| Math-only best daily value | 583.1259 |
| Recommended level (reader-facing) | 67.449 international $/person (data-backed level) |
| Math-only guess (technical) | 583.13 international $/person |
| Data-backed level | 67.449 international $/person |
| Data-backed range | [46.637, 88.339) |
| Backup level (middle-data check) | 88.305 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.2591, 8503.2455] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [34.371, 71.973) |
| Best observed range (middle-data check) | [27.900, 52.150) |
| Best observed outcome average | 5.158 |
| Best observed outcome average (middle-data check) | 5.448 |
| Backup level (bucket median) | 37.036 international $/person |
| Math-only vs backup difference | -546.09 (-93.6%) |
| Middle-data share kept | 80.1% (5895/7356) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6321 (medium confidence) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.6763 |
| Reliability directional component | 0.8519 |
| Reliability temporal-stability component | 0.2134 |
| Reliability robustness component | 0.0706 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 35.834 international $/person (z=2.36) |
| Point where gains start slowing | 35.834 international $/person (ratio=-0.028) |
| Flat zone range | [662.41, 7046.4] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 515.68 (+764.5%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 2 | interpolation | 0.6145 | 0.0000 | 229 | 7356 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.6081 | 0.0064 | 229 | 7356 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.5993 | 0.0151 | 229 | 7356 |
| Runner-up | predictor_default | 3 | 3 | interpolation | 0.5990 | 0.0155 | 229 | 7356 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.25914, 16.696) | 725 | 38 | 9.2346 | 9.1744 | 3.9030 | 4.3478 |
| 2 | [16.696, 34.371) | 746 | 59 | 23.0983 | 22.1919 | 4.4561 | 4.6186 |
| 3 | [34.371, 71.973) | 735 | 67 | 49.5645 | 46.6361 | 5.1580 | 4.5070 |
| 4 | [71.973, 125.91) | 736 | 72 | 96.8745 | 96.2316 | 5.0710 | 5.0445 |
| 5 | [125.91, 212.54) | 729 | 77 | 168.1261 | 165.1073 | 4.4105 | 4.5101 |
| 6 | [212.54, 315.50) | 731 | 91 | 256.2062 | 256.3404 | 4.4989 | 4.4993 |
| 7 | [315.50, 517.29) | 747 | 94 | 404.4672 | 397.6206 | 5.1155 | 5.4144 |
| 8 | [517.29, 957.71) | 728 | 82 | 688.8502 | 660.5470 | 4.6744 | 4.9905 |
| 9 | [957.71, 1767.7) | 743 | 67 | 1340.9867 | 1380.0886 | 3.8516 | 4.0855 |
| 10 | [1767.7, 7046.4] | 736 | 50 | 2905.9041 | 2602.1826 | 4.3194 | 4.0775 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure Per Capita (PPP))
[0.25914, 587.44) | ############################## 5372
[587.44, 1174.6) | #### 732
[1174.6, 1761.8) | ### 498
[1761.8, 2349.0) | ## 316
[2349.0, 2936.2) | # 157
[2936.2, 3523.3) | # 110
[3523.3, 4110.5) | # 70
[4110.5, 4697.7) | # 44
[4697.7, 5284.9) | # 35
[5284.9, 5872.0) | # 11
[5872.0, 6459.2) | # 7
[6459.2, 7046.4] | # 4
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-62.405, -43.867) | # 5
[-43.867, -25.329) | # 29
[-25.329, -6.791) | # 265
[-6.791, 11.747) | ############################## 6461
[11.747, 30.285) | ### 562
[30.285, 48.823) | # 19
[48.823, 67.360) | # 9
[67.360, 85.898) | # 4
[141.51, 160.05] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| LBN | -0.5432 | -0.9711 | -113.983 | 33 |
| WSM | 0.1395 | 0.8005 | 14.812 | 33 |
| NRU | -0.4213 | -0.7690 | -144.111 | 33 |
| HTI | -0.2396 | -0.7619 | -74.434 | 33 |
| PHL | 0.3607 | 0.6988 | 38.203 | 33 |
| SDN | -0.1634 | -0.6754 | -97.582 | 33 |
| CSS | 0.0571 | 0.6692 | -29.528 | 33 |
| SOM | -0.0654 | 0.6528 | -84.072 | 32 |
