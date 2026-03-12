# Pair Study: Civilian Government Expenditure Per Capita (PPP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 2
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5947
- Included subjects: 148
- Skipped subjects: 0
- Total aligned pairs: 4853
- Signal grade: B (strong)
- Data status: enough data
- Confidence score: 0.554 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.2981 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Civilian Government Expenditure Per Capita (PPP) level for higher After-Tax Median Income Growth (YoY %): 504.91 international $/person (data-backed level).
- Best level directly seen in the grouped data: 504.91 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 637.21 international $/person; model-optimal minus observed-anchor difference is 3357.5 (+526.9%).
- Backup level check (middle 10-90% of data) suggests 512.04 international $/person.
- The math-only guess and backup level differ by 87.2%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 265.73 international $/person.
- Diminishing returns likely begin near 504.91 international $/person.
- Saturation/plateau zone starts around 3590.6 international $/person and extends through 15899.1 international $/person.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Civilian Government Expenditure Per Capita (PPP) is in [463.28, 853.93) (mean outcome 5.816).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher Civilian Government Expenditure Per Capita (PPP) tends to go with better After-Tax Median Income Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Civilian Government Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 148 subjects and 4853 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [463.28, 853.93) (mean outcome 5.816).
- A minimum effective predictor level appears near 265.73 international $/person in the binned response curve.
- Confidence score is 0.554 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Top temporal profiles are close (score delta 0.0001); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 87.2% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.0940 |
| Reverse correlation | -0.0050 |
| Direction score (forward - reverse) | 0.0990 |
| Effect size (% change from baseline) | 56.4431 |
| Significance score | 0.7019 |
| Weighted PIS | 0.1780 |
| Value linked with higher outcome | 3994.7590 |
| Value linked with lower outcome | 3854.5105 |
| Math-only best daily value | 3994.7590 |
| Recommended level (reader-facing) | 504.91 international $/person (data-backed level) |
| Math-only guess (technical) | 3994.8 international $/person |
| Data-backed level | 504.91 international $/person |
| Data-backed range | [341.09, 637.92) |
| Backup level (middle-data check) | 1803.4 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [7.6041, 62399.1940] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [463.28, 853.93) |
| Best observed range (middle-data check) | [380.07, 652.21) |
| Best observed outcome average | 5.816 |
| Best observed outcome average (middle-data check) | 6.037 |
| Backup level (bucket median) | 512.04 international $/person |
| Math-only vs backup difference | -3482.7 (-87.2%) |
| Middle-data share kept | 80.1% (3887/4853) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.5540 (medium confidence) |
| Reliability support component | 0.8978 |
| Reliability significance component | 0.7019 |
| Reliability directional component | 0.6601 |
| Reliability temporal-stability component | 0.0044 |
| Reliability robustness component | 0.1424 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 265.73 international $/person (z=1.15) |
| Point where gains start slowing | 504.91 international $/person (ratio=-0.105) |
| Flat zone range | [3090.2, 52187.2] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 3489.8 (+691.2%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 2 | interpolation | 0.5947 | 0.0000 | 148 | 4853 |
| Runner-up | predictor_default | 2 | 1 | interpolation | 0.5945 | 0.0001 | 148 | 4853 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.5937 | 0.0010 | 148 | 4853 |
| Runner-up | predictor_default | 0 | 1 | interpolation | 0.5891 | 0.0056 | 148 | 4853 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [7.604, 214.06) | 480 | 24 | 120.8759 | 109.3998 | 4.3322 | 4.7707 |
| 2 | [214.06, 463.28) | 491 | 42 | 313.6673 | 287.8307 | 4.6549 | 4.6841 |
| 3 | [463.28, 853.93) | 484 | 51 | 638.3454 | 637.2138 | 5.8161 | 5.2262 |
| 4 | [853.93, 1304.1) | 486 | 62 | 1051.3310 | 1055.1723 | 4.1381 | 4.9892 |
| 5 | [1304.1, 2141.8) | 484 | 58 | 1690.5837 | 1685.1986 | 5.2563 | 4.9532 |
| 6 | [2141.8, 3373.3) | 487 | 58 | 2714.8065 | 2733.1754 | 4.4784 | 4.5977 |
| 7 | [3373.3, 4653.9) | 485 | 69 | 3924.0864 | 3832.6039 | 4.6353 | 4.5666 |
| 8 | [4653.9, 7261.3) | 485 | 68 | 5809.4165 | 5766.2938 | 4.7854 | 4.7775 |
| 9 | [7261.3, 11138.3) | 485 | 55 | 9151.2902 | 9256.7900 | 4.3905 | 4.1264 |
| 10 | [11138.3, 52187.2] | 486 | 46 | 16805.1710 | 15032.8938 | 4.6554 | 4.5131 |

### Distribution Charts

```text
Predictor Distribution (Civilian Government Expenditure Per Capita (PPP))
[7.604, 4355.9) | ############################## 3306
[4355.9, 8704.2) | ####### 752
[8704.2, 13052.5) | #### 456
[13052.5, 17400.8) | ## 172
[17400.8, 21749.1) | # 98
[21749.1, 26097.4) | # 33
[26097.4, 30445.7) | # 23
[30445.7, 34794.0) | # 3
[34794.0, 39142.3) | # 3
[39142.3, 43490.6) | # 3
[43490.6, 47838.9) | # 2
[47838.9, 52187.2] | # 2
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-49.393, -31.954) | # 8
[-31.954, -14.516) | # 43
[-14.516, 2.923) | ############## 1479
[2.923, 20.361) | ############################## 3257
[20.361, 37.799) | # 53
[37.799, 55.238) | # 6
[55.238, 72.676) | # 6
[142.43, 159.87] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| BOL | 0.1479 | 0.9514 | 52.022 | 33 |
| LBN | -0.5587 | -0.9428 | -94.069 | 33 |
| LDC | 0.2240 | 0.9068 | 15.065 | 33 |
| ALB | 0.1385 | 0.8810 | 4.164 | 33 |
| ECU | 0.3296 | 0.8734 | 54.882 | 33 |
| KGZ | 0.2862 | 0.8461 | 150.303 | 32 |
| GAB | -0.3352 | -0.8068 | -74.066 | 33 |
| MUS | 0.1298 | 0.7979 | 1.132 | 33 |
