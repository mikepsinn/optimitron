# Pair Study: Government Expenditure Per Capita (PPP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 2
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5854
- Included subjects: 175
- Skipped subjects: 0
- Total aligned pairs: 5740
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.585 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3106 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Expenditure Per Capita (PPP) level for higher After-Tax Median Income Growth (YoY %): 931.16 international $/person (data-backed level).
- Best level directly seen in the grouped data: 931.16 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 752.26 international $/person; model-optimal minus observed-anchor difference is 3370.1 (+448.0%).
- Backup level check (middle 10-90% of data) suggests 974.44 international $/person.
- The math-only guess and backup level differ by 76.4%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 1837.8 international $/person.
- Diminishing returns likely begin near 931.16 international $/person.
- Saturation/plateau zone starts around 2604.2 international $/person and extends through 16281.6 international $/person.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Government Expenditure Per Capita (PPP) is in [576.55, 979.24) (mean outcome 5.395).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher Government Expenditure Per Capita (PPP) tends to go with better After-Tax Median Income Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 175 subjects and 5740 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [576.55, 979.24) (mean outcome 5.395).
- A minimum effective predictor level appears near 1837.8 international $/person in the binned response curve.
- Confidence score is 0.585 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Top temporal profiles are close (score delta 0.0007); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 76.4% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.0884 |
| Reverse correlation | -0.0057 |
| Direction score (forward - reverse) | 0.0941 |
| Effect size (% change from baseline) | 48.8803 |
| Significance score | 0.6894 |
| Weighted PIS | 0.1713 |
| Value linked with higher outcome | 4122.3383 |
| Value linked with lower outcome | 3898.4716 |
| Math-only best daily value | 4122.3383 |
| Recommended level (reader-facing) | 931.16 international $/person (data-backed level) |
| Math-only guess (technical) | 4122.3 international $/person |
| Data-backed level | 931.16 international $/person |
| Data-backed range | [755.20, 1123.1) |
| Backup level (middle-data check) | 850.26 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [8.5216, 63562.8926] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [576.55, 979.24) |
| Best observed range (middle-data check) | [806.31, 1164.8) |
| Best observed outcome average | 5.395 |
| Best observed outcome average (middle-data check) | 5.334 |
| Backup level (bucket median) | 974.44 international $/person |
| Math-only vs backup difference | -3147.9 (-76.4%) |
| Middle-data share kept | 80.0% (4592/5740) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.5852 (medium confidence) |
| Reliability support component | 0.9783 |
| Reliability significance component | 0.6894 |
| Reliability directional component | 0.6275 |
| Reliability temporal-stability component | 0.0224 |
| Reliability robustness component | 0.2626 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 1837.8 international $/person (z=1.37) |
| Point where gains start slowing | 931.16 international $/person (ratio=-0.188) |
| Flat zone range | [2181.9, 52862.3] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 3191.2 (+342.7%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 2 | interpolation | 0.5854 | 0.0000 | 175 | 5740 |
| Runner-up | predictor_default | 2 | 1 | interpolation | 0.5847 | 0.0007 | 175 | 5740 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.5793 | 0.0061 | 175 | 5740 |
| Runner-up | predictor_default | 0 | 1 | interpolation | 0.5606 | 0.0248 | 175 | 5740 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [15.672, 269.79) | 574 | 28 | 159.6083 | 153.0826 | 4.1690 | 4.6333 |
| 2 | [269.79, 576.55) | 570 | 50 | 405.4567 | 388.7454 | 4.7892 | 4.7601 |
| 3 | [576.55, 979.24) | 578 | 60 | 763.8378 | 752.2567 | 5.3952 | 5.0627 |
| 4 | [979.24, 1446.5) | 574 | 70 | 1203.0970 | 1204.4886 | 4.4745 | 4.8325 |
| 5 | [1446.5, 2181.9) | 574 | 70 | 1782.5918 | 1773.8334 | 4.7665 | 4.5012 |
| 6 | [2181.9, 3333.1) | 574 | 74 | 2749.9845 | 2697.7083 | 4.8745 | 5.0761 |
| 7 | [3333.1, 4741.0) | 574 | 80 | 4003.9923 | 3993.6300 | 4.1868 | 4.4321 |
| 8 | [4741.0, 7118.1) | 574 | 82 | 5857.1384 | 5773.5042 | 4.4917 | 4.5143 |
| 9 | [7118.1, 11811.3) | 574 | 64 | 9268.8792 | 9198.6166 | 4.6819 | 4.4458 |
| 10 | [11811.3, 52862.3] | 574 | 49 | 17370.1692 | 15469.1827 | 4.4125 | 4.2229 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure Per Capita (PPP))
[15.672, 4419.6) | ############################## 3900
[4419.6, 8823.4) | ####### 928
[8823.4, 13227.3) | #### 459
[13227.3, 17631.2) | ## 266
[17631.2, 22035.1) | # 100
[22035.1, 26439.0) | # 41
[26439.0, 30842.9) | # 30
[30842.9, 35246.8) | # 5
[35246.8, 39650.7) | # 3
[39650.7, 44054.6) | # 4
[44054.6, 48458.4) | # 2
[48458.4, 52862.3] | # 2
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-62.405, -43.867) | # 4
[-43.867, -25.329) | # 22
[-25.329, -6.791) | # 204
[-6.791, 11.747) | ############################## 5041
[11.747, 30.285) | ### 443
[30.285, 48.823) | # 14
[48.823, 67.360) | # 8
[67.360, 85.898) | # 2
[141.51, 160.05] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| BOL | 0.1457 | 0.9546 | 52.022 | 33 |
| LBN | -0.5612 | -0.9188 | -94.069 | 33 |
| LDC | 0.2184 | 0.9094 | 15.065 | 33 |
| ALB | 0.1364 | 0.8779 | 4.164 | 33 |
| ECU | 0.3393 | 0.8716 | 54.882 | 33 |
| KGZ | 0.2860 | 0.8113 | 150.303 | 32 |
| GAB | -0.3638 | -0.8068 | -79.553 | 33 |
| MUS | 0.1292 | 0.7967 | 1.132 | 33 |
