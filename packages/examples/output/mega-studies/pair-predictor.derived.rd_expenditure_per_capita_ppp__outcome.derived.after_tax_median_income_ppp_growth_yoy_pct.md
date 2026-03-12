# Pair Study: R&D Expenditure Per Capita (PPP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.rd_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 1
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6301
- Included subjects: 123
- Skipped subjects: 0
- Total aligned pairs: 4011
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.658 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3376 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended R&D Expenditure Per Capita (PPP) level for higher After-Tax Median Income Growth (YoY %): 15.443 international $/person (data-backed level).
- Best level directly seen in the grouped data: 15.443 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 3.140 international $/person; model-optimal minus observed-anchor difference is 281.21 (+8955.2%).
- Backup level check (middle 10-90% of data) suggests 18.124 international $/person.
- The math-only guess and backup level differ by 93.6%, which means extreme values may matter a lot.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 15.443 international $/person.
- Saturation/plateau zone starts around 94.082 international $/person and extends through 1333.4 international $/person.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when R&D Expenditure Per Capita (PPP) is in [0.19723, 4.911) (mean outcome 5.341).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher R&D Expenditure Per Capita (PPP) tends to go with better After-Tax Median Income Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher R&D Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 123 subjects and 4011 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.19723, 4.911) (mean outcome 5.341).
- Confidence score is 0.658 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Top temporal profiles are close (score delta 0.0197); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 93.6% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.0927 |
| Reverse correlation | -0.0556 |
| Direction score (forward - reverse) | 0.1483 |
| Effect size (% change from baseline) | 17.0052 |
| Significance score | 0.6624 |
| Weighted PIS | 0.1439 |
| Value linked with higher outcome | 284.3493 |
| Value linked with lower outcome | 274.3898 |
| Math-only best daily value | 284.3493 |
| Recommended level (reader-facing) | 15.443 international $/person (data-backed level) |
| Math-only guess (technical) | 284.35 international $/person |
| Data-backed level | 15.443 international $/person |
| Data-backed range | [10.830, 22.540) |
| Backup level (middle-data check) | 14.138 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.1972, 3227.4604] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [0.19723, 4.911) |
| Best observed range (middle-data check) | [12.117, 23.282) |
| Best observed outcome average | 5.341 |
| Best observed outcome average (middle-data check) | 5.669 |
| Backup level (bucket median) | 18.124 international $/person |
| Math-only vs backup difference | -266.23 (-93.6%) |
| Middle-data share kept | 80.0% (3209/4011) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6583 (medium confidence) |
| Reliability support component | 0.7442 |
| Reliability significance component | 0.6624 |
| Reliability directional component | 0.9886 |
| Reliability temporal-stability component | 0.6556 |
| Reliability robustness component | 0.0708 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | 15.443 international $/person (ratio=-0.374) |
| Flat zone range | [77.029, 2948.5] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 268.91 (+1741.3%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 2 | interpolation | 0.6301 | 0.0000 | 123 | 4011 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.6105 | 0.0197 | 123 | 4011 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.6024 | 0.0277 | 123 | 4011 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.5973 | 0.0329 | 123 | 4011 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.19723, 4.911) | 401 | 18 | 2.8495 | 3.1402 | 5.3414 | 5.0691 |
| 2 | [4.911, 14.231) | 401 | 34 | 9.5944 | 9.4844 | 5.1562 | 5.5375 |
| 3 | [14.231, 28.593) | 401 | 45 | 21.8231 | 22.5401 | 5.1023 | 5.2556 |
| 4 | [28.593, 47.979) | 396 | 53 | 37.7628 | 37.8837 | 4.9023 | 5.9512 |
| 5 | [47.979, 77.029) | 406 | 53 | 59.2836 | 58.5554 | 5.3006 | 5.4010 |
| 6 | [77.029, 130.68) | 401 | 53 | 99.2386 | 97.0200 | 5.2849 | 5.4958 |
| 7 | [130.68, 261.72) | 401 | 50 | 188.0262 | 184.2178 | 5.0060 | 5.2723 |
| 8 | [261.72, 482.00) | 401 | 50 | 374.1383 | 373.5937 | 4.8877 | 4.7417 |
| 9 | [482.00, 879.28) | 401 | 48 | 654.2920 | 646.9555 | 4.2334 | 4.0711 |
| 10 | [879.28, 2948.5] | 402 | 30 | 1333.6945 | 1249.0209 | 4.4274 | 4.0023 |

### Distribution Charts

```text
Predictor Distribution (R&D Expenditure Per Capita (PPP))
[0.19723, 245.89) | ############################## 2759
[245.89, 491.57) | ##### 484
[491.57, 737.26) | ### 245
[737.26, 982.95) | ## 190
[982.95, 1228.6) | # 120
[1228.6, 1474.3) | # 105
[1474.3, 1720.0) | # 47
[1720.0, 1965.7) | # 28
[1965.7, 2211.4) | # 19
[2211.4, 2457.1) | # 7
[2457.1, 2702.8) | # 5
[2702.8, 2948.5] | # 2
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-49.393, -40.524) | # 2
[-40.524, -31.654) | # 4
[-31.654, -22.785) | # 7
[-22.785, -13.916) | # 29
[-13.916, -5.047) | ## 137
[-5.047, 3.822) | ################## 1334
[3.822, 12.691) | ############################## 2256
[12.691, 21.560) | ### 205
[21.560, 30.430) | # 25
[30.430, 39.299) | # 7
[39.299, 48.168) | # 2
[48.168, 57.037] | # 3
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| OMN | 0.0063 | -0.7112 | -144.977 | 33 |
| TJK | 0.1768 | 0.6872 | 288.500 | 33 |
| PAK | -0.1524 | -0.6426 | -8.998 | 33 |
| OSS | 0.1646 | 0.5959 | -2.379 | 33 |
| MNE | 0.0346 | -0.5956 | 92.993 | 26 |
| ISL | 0.2453 | 0.5840 | 16.582 | 33 |
| LMY | 0.1686 | 0.5805 | -4.842 | 33 |
| MIC | 0.1806 | 0.5800 | -3.867 | 33 |
