# Pair Study: Military Expenditure Per Capita (PPP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.military_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6401
- Included subjects: 201
- Skipped subjects: 0
- Total aligned pairs: 6630
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.730 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.1185 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Military Expenditure Per Capita (PPP) level for higher After-Tax Median Income (PPP): 1943.0 international $/person (data-backed level).
- Best level directly seen in the grouped data: 1943.0 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 1452.7 international $/person; model-optimal minus observed-anchor difference is -1052.4 (-72.4%).
- Backup level check (middle 10-90% of data) suggests 501.25 international $/person.
- The math-only guess and backup level differ by 25.2%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 20.902 international $/person.
- Diminishing returns likely begin near 377.74 international $/person.
- Could not find a stable flat zone (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income (PPP) appears when Military Expenditure Per Capita (PPP) is in [625.07, 21187.0] (mean outcome 49141.4).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Medium signal; still sensitive to model choices.
- Pattern hint: higher Military Expenditure Per Capita (PPP) tends to go with better After-Tax Median Income (PPP).
- Signal strength: stronger in this report set.

## Plain-Language Summary

- Higher Military Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income (PPP).
- The estimate uses 201 subjects and 6630 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [625.07, 21187.0] (mean outcome 49141.4).
- A minimum effective predictor level appears near 20.902 international $/person in the binned response curve.
- Confidence score is 0.730 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0052); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 25.2% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.6408 |
| Reverse correlation | 0.7223 |
| Direction score (forward - reverse) | -0.0815 |
| Effect size (% change from baseline) | 84.6896 |
| Significance score | 0.8815 |
| Weighted PIS | 0.6819 |
| Value linked with higher outcome | 400.3894 |
| Value linked with lower outcome | 343.9854 |
| Math-only best daily value | 400.3894 |
| Recommended level (reader-facing) | 1943.0 international $/person (data-backed level) |
| Math-only guess (technical) | 400.39 international $/person |
| Data-backed level | 1943.0 international $/person |
| Data-backed range | [731.02, 21187.0] |
| Backup level (middle-data check) | 517.31 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0063, 27448.6207] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [625.07, 21187.0] |
| Best observed range (middle-data check) | [424.59, 624.77] |
| Best observed outcome average | 49141.4 |
| Best observed outcome average (middle-data check) | 31606.3 |
| Backup level (bucket median) | 501.25 international $/person |
| Math-only vs backup difference | 100.86 (+25.2%) |
| Middle-data share kept | 80.0% (5304/6630) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.7298 (medium confidence) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.8815 |
| Reliability directional component | 0.5436 |
| Reliability temporal-stability component | 0.1738 |
| Reliability robustness component | 0.8312 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 20.902 international $/person (z=8.20) |
| Point where gains start slowing | 377.74 international $/person (ratio=0.335) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -1542.6 (-79.4%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.6401 | 0.0000 | 201 | 6630 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.6348 | 0.0052 | 201 | 6630 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.6289 | 0.0111 | 201 | 6630 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.6144 | 0.0256 | 201 | 6630 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00630, 17.819) | 663 | 38 | 9.8655 | 9.7741 | 1724.9739 | 1320.0000 |
| 2 | [17.819, 32.404) | 663 | 62 | 24.5377 | 24.3138 | 3073.8416 | 2104.0475 |
| 3 | [32.404, 51.228) | 663 | 69 | 40.9806 | 40.6174 | 4264.9974 | 3356.5380 |
| 4 | [51.228, 85.830) | 663 | 76 | 67.1583 | 66.9048 | 5698.1087 | 4550.0000 |
| 5 | [85.830, 134.87) | 663 | 78 | 108.7349 | 106.6882 | 7612.0309 | 6688.6209 |
| 6 | [134.87, 190.99) | 659 | 83 | 163.6437 | 162.7843 | 10076.0858 | 8590.0000 |
| 7 | [190.99, 268.66) | 667 | 75 | 228.7006 | 229.4270 | 16128.7168 | 13930.0000 |
| 8 | [268.66, 389.99) | 663 | 67 | 329.1138 | 332.7301 | 21793.5834 | 19550.0000 |
| 9 | [389.99, 625.07) | 663 | 66 | 488.1148 | 485.5226 | 30658.8332 | 29080.0000 |
| 10 | [625.07, 21187.0] | 663 | 47 | 2277.8466 | 1452.7468 | 49141.4301 | 45690.0000 |

### Distribution Charts

```text
Predictor Distribution (Military Expenditure Per Capita (PPP))
[0.00630, 1765.6) | ############################## 6332
[1765.6, 3531.2) | # 168
[3531.2, 5296.8) | # 72
[5296.8, 7062.3) | # 47
[7062.3, 8827.9) | # 4
[14124.7, 15890.3) | # 5
[17655.8, 19421.4) | # 1
[19421.4, 21187.0] | # 1
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 14356.7) | ############################## 4451
[14356.7, 28433.3) | ####### 1090
[28433.3, 42510.0) | ### 518
[42510.0, 56586.7) | ## 282
[56586.7, 70663.3) | # 138
[70663.3, 84740.0) | # 77
[84740.0, 98816.7) | # 43
[98816.7, 112893) | # 16
[112893, 126970) | # 10
[126970, 141047) | # 1
[141047, 155123) | # 1
[155123, 169200] | # 3
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| BIH | -0.7417 | -1.2931 | -74.341 | 34 |
| LBY | -0.6652 | -1.1619 | -29.865 | 34 |
| LBR | -0.6309 | -0.9274 | -43.978 | 34 |
| HTI | -0.5062 | -0.8402 | -15.882 | 34 |
| ETH | -0.5354 | -0.7686 | -67.039 | 34 |
| OMN | -0.3627 | -0.7090 | -12.956 | 34 |
| NIC | -0.4077 | -0.7083 | -3.365 | 34 |
| OSS | -0.1502 | -0.7008 | -8.244 | 34 |
