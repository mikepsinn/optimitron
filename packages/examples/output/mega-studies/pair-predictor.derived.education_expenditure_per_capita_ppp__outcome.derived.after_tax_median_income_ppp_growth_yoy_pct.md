# Pair Study: Education Expenditure Per Capita (PPP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.education_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 0
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5571
- Included subjects: 216
- Skipped subjects: 0
- Total aligned pairs: 6924
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.690 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3179 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Education Expenditure Per Capita (PPP) level for higher After-Tax Median Income Growth (YoY %): 414.30 international $/person (data-backed level).
- Best level directly seen in the grouped data: 414.30 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 431.13 international $/person; model-optimal minus observed-anchor difference is 252.90 (+58.7%).
- Backup level check (middle 10-90% of data) suggests 409.51 international $/person.
- The math-only guess and backup level differ by 40.1%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 55.100 international $/person.
- Diminishing returns likely begin near 100.74 international $/person.
- Saturation/plateau zone starts around 553.83 international $/person and extends through 2750.1 international $/person.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Education Expenditure Per Capita (PPP) is in [356.31, 511.24) (mean outcome 5.101).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher Education Expenditure Per Capita (PPP) tends to go with better After-Tax Median Income Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Education Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 216 subjects and 6924 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [356.31, 511.24) (mean outcome 5.101).
- A minimum effective predictor level appears near 55.100 international $/person in the binned response curve.
- Confidence score is 0.690 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Top temporal profiles are close (score delta 0.0158); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 40.1% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.1111 |
| Reverse correlation | 0.1795 |
| Direction score (forward - reverse) | -0.0683 |
| Effect size (% change from baseline) | 112.3550 |
| Significance score | 0.6821 |
| Weighted PIS | 0.1815 |
| Value linked with higher outcome | 684.0281 |
| Value linked with lower outcome | 660.0741 |
| Math-only best daily value | 684.0281 |
| Recommended level (reader-facing) | 414.30 international $/person (data-backed level) |
| Math-only guess (technical) | 684.03 international $/person |
| Data-backed level | 414.30 international $/person |
| Data-backed range | [356.31, 488.13) |
| Backup level (middle-data check) | 395.35 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0000, 7006.1701] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [356.31, 511.24) |
| Best observed range (middle-data check) | [356.31, 478.95) |
| Best observed outcome average | 5.101 |
| Best observed outcome average (middle-data check) | 5.226 |
| Backup level (bucket median) | 409.51 international $/person |
| Math-only vs backup difference | -274.51 (-40.1%) |
| Middle-data share kept | 80.0% (5540/6924) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6903 (medium confidence) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.6821 |
| Reliability directional component | 0.4556 |
| Reliability temporal-stability component | 0.5258 |
| Reliability robustness component | 0.6652 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 55.100 international $/person (z=1.87) |
| Point where gains start slowing | 100.74 international $/person (ratio=0.054) |
| Flat zone range | [488.13, 6745.6] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 269.73 (+65.1%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 2 | interpolation | 0.5571 | 0.0000 | 216 | 6924 |
| Runner-up | predictor_default | 0 | 5 | interpolation | 0.5413 | 0.0158 | 216 | 6924 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.5395 | 0.0176 | 216 | 6924 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.5382 | 0.0189 | 216 | 6924 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 44.993) | 692 | 47 | 28.1039 | 29.9621 | 3.7391 | 4.1325 |
| 2 | [44.993, 94.515) | 693 | 69 | 67.1774 | 64.9830 | 4.4732 | 4.3902 |
| 3 | [94.515, 163.57) | 692 | 85 | 129.8523 | 130.8799 | 4.8152 | 4.7414 |
| 4 | [163.57, 251.51) | 693 | 98 | 206.3765 | 205.6719 | 4.8664 | 5.0251 |
| 5 | [251.51, 356.31) | 692 | 107 | 302.7633 | 301.6991 | 4.5051 | 4.8846 |
| 6 | [356.31, 511.24) | 691 | 105 | 429.8844 | 431.1316 | 5.1010 | 5.0584 |
| 7 | [511.24, 754.07) | 694 | 102 | 615.3737 | 605.3740 | 5.0951 | 4.9635 |
| 8 | [754.07, 1130.9) | 691 | 97 | 928.6081 | 918.9522 | 4.2719 | 4.5535 |
| 9 | [1130.9, 1871.7) | 692 | 74 | 1441.3310 | 1417.3398 | 4.5890 | 4.4194 |
| 10 | [1871.7, 6745.6] | 694 | 48 | 2803.1391 | 2574.4576 | 4.0343 | 3.7873 |

### Distribution Charts

```text
Predictor Distribution (Education Expenditure Per Capita (PPP))
[0.00000, 562.13) | ############################## 4371
[562.13, 1124.3) | ######## 1158
[1124.3, 1686.4) | #### 594
[1686.4, 2248.5) | ## 338
[2248.5, 2810.7) | # 189
[2810.7, 3372.8) | # 136
[3372.8, 3934.9) | # 71
[3934.9, 4497.1) | # 27
[4497.1, 5059.2) | # 19
[5059.2, 5621.3) | # 13
[5621.3, 6183.4) | # 4
[6183.4, 6745.6] | # 4
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-62.405, -43.867) | # 4
[-43.867, -25.329) | # 26
[-25.329, -6.791) | # 225
[-6.791, 11.747) | ############################## 6134
[11.747, 30.285) | ## 509
[30.285, 48.823) | # 15
[48.823, 67.360) | # 6
[67.360, 85.898) | # 4
[141.51, 160.05] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| GUY | 0.1521 | 0.9117 | 32.633 | 33 |
| NRU | -0.4963 | -0.7198 | -163.801 | 33 |
| UZB | 0.1042 | -0.6042 | 18.842 | 33 |
| ATG | 0.0913 | -0.5941 | 49.118 | 33 |
| PRI | -0.0575 | -0.5851 | -25.603 | 33 |
| BIH | -0.0418 | -0.5647 | -24.325 | 33 |
| MDV | 0.0072 | -0.5479 | -33.782 | 33 |
| BWA | 0.0054 | 0.5442 | 35.271 | 33 |
