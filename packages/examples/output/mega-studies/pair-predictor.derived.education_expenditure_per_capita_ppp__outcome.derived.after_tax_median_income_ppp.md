# Pair Study: Education Expenditure Per Capita (PPP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.education_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 1
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5807
- Included subjects: 216
- Skipped subjects: 0
- Total aligned pairs: 7140
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.553 (medium confidence)
- Signal tag: early signal
- Direction: neutral
- Uncertainty score: 0.1070 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Education Expenditure Per Capita (PPP) level for higher After-Tax Median Income (PPP): 2563.5 international $/person (data-backed level).
- Best level directly seen in the grouped data: 2563.5 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 2372.0 international $/person; model-optimal minus observed-anchor difference is -1547.5 (-65.2%).
- Backup level check (middle 10-90% of data) suggests 1378.1 international $/person.
- The math-only guess and backup level differ by 67.2%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 49.628 international $/person.
- Could not find a clear point where gains start slowing down (drop_below_detection_threshold).
- Could not find a stable flat zone (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income (PPP) appears when Education Expenditure Per Capita (PPP) is in [1686.3, 6496.0] (mean outcome 54774.6).
- Direction signal is neutral; use caution and rely on the data-backed level.

## Decision Summary

- Interpretation: Medium signal; still sensitive to model choices.
- Pattern hint: no clear up/down pattern; use data-backed levels only.
- Signal strength: stronger in this report set.

## Plain-Language Summary

- No strong directional pattern is detected between Education Expenditure Per Capita (PPP) and After-Tax Median Income (PPP).
- The estimate uses 216 subjects and 7140 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [1686.3, 6496.0] (mean outcome 54774.6).
- A minimum effective predictor level appears near 49.628 international $/person in the binned response curve.
- Confidence score is 0.553 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0001); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 67.2% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.8487 |
| Reverse correlation | 0.8305 |
| Direction score (forward - reverse) | 0.0182 |
| Effect size (% change from baseline) | 104.3094 |
| Significance score | 0.8930 |
| Weighted PIS | 0.7971 |
| Value linked with higher outcome | 824.4792 |
| Value linked with lower outcome | 440.6519 |
| Math-only best daily value | 824.4792 |
| Recommended level (reader-facing) | 2563.5 international $/person (data-backed level) |
| Math-only guess (technical) | 824.48 international $/person |
| Data-backed level | 2563.5 international $/person |
| Data-backed range | [1896.1, 6496.0] |
| Backup level (middle-data check) | 1403.1 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0000, 7006.1701] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [1686.3, 6496.0] |
| Best observed range (middle-data check) | [1124.4, 1686.2] |
| Best observed outcome average | 54774.6 |
| Best observed outcome average (middle-data check) | 33574.4 |
| Backup level (bucket median) | 1378.1 international $/person |
| Math-only vs backup difference | 553.66 (+67.2%) |
| Middle-data share kept | 80.0% (5712/7140) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.5527 (medium confidence) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.8930 |
| Reliability directional component | 0.1212 |
| Reliability temporal-stability component | 0.0031 |
| Reliability robustness component | 0.3650 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 49.628 international $/person (z=13.26) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -1739.0 (-67.8%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 5 | interpolation | 0.5807 | 0.0000 | 216 | 7140 |
| Runner-up | predictor_default | 0 | 5 | interpolation | 0.5806 | 0.0001 | 216 | 7140 |
| Runner-up | predictor_default | 1 | 3 | interpolation | 0.5770 | 0.0037 | 216 | 7140 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.5767 | 0.0040 | 216 | 7140 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 41.763) | 714 | 45 | 26.1067 | 26.9829 | 1450.4651 | 1187.2845 |
| 2 | [41.763, 81.905) | 713 | 67 | 60.2241 | 59.6390 | 2426.7822 | 2160.0000 |
| 3 | [81.905, 148.87) | 715 | 79 | 116.5091 | 116.5714 | 3759.7293 | 3490.4011 |
| 4 | [148.87, 229.60) | 714 | 93 | 187.9920 | 186.3389 | 5354.6334 | 5235.0000 |
| 5 | [229.60, 324.88) | 714 | 98 | 276.1921 | 274.6985 | 7514.4473 | 7200.0000 |
| 6 | [324.88, 466.80) | 714 | 101 | 384.4934 | 373.7033 | 9746.4763 | 9605.0000 |
| 7 | [466.80, 676.84) | 714 | 92 | 553.1569 | 548.5225 | 14344.7798 | 13750.0000 |
| 8 | [676.84, 1027.7) | 714 | 91 | 845.1178 | 840.5466 | 19573.9611 | 19535.0000 |
| 9 | [1027.7, 1686.3) | 714 | 73 | 1313.2145 | 1305.3567 | 32087.1315 | 29770.0000 |
| 10 | [1686.3, 6496.0] | 714 | 46 | 2614.6051 | 2371.9843 | 54774.6243 | 49705.0000 |

### Distribution Charts

```text
Predictor Distribution (Education Expenditure Per Capita (PPP))
[0.00000, 541.33) | ############################## 4620
[541.33, 1082.7) | ######## 1163
[1082.7, 1624.0) | #### 613
[1624.0, 2165.3) | ## 317
[2165.3, 2706.6) | # 177
[2706.6, 3248.0) | # 121
[3248.0, 3789.3) | # 63
[3789.3, 4330.6) | # 29
[4330.6, 4872.0) | # 16
[4872.0, 5413.3) | # 12
[5413.3, 5954.6) | # 4
[5954.6, 6496.0] | # 5
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 14356.7) | ############################## 4718
[14356.7, 28433.3) | ######## 1249
[28433.3, 42510.0) | #### 590
[42510.0, 56586.7) | ## 290
[56586.7, 70663.3) | # 144
[70663.3, 84740.0) | # 82
[84740.0, 98816.7) | # 31
[98816.7, 112893) | # 16
[112893, 126970) | # 15
[126970, 141047) | # 1
[141047, 155123) | # 1
[155123, 169200] | # 3
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| CUW | 0.7145 | 1.1128 | 10.195 | 19 |
| PRI | -0.7001 | -1.0579 | -36.553 | 34 |
| HTI | 0.9084 | 0.7229 | 38.678 | 34 |
| FCS | 0.8537 | 0.7219 | 18.607 | 16 |
| BMU | -0.0268 | -0.7018 | 4.272 | 14 |
| JOR | -0.6725 | -0.6591 | -25.301 | 34 |
| NRU | -0.0436 | -0.5964 | -19.697 | 34 |
| ATG | 0.8439 | 0.5675 | 40.597 | 34 |
