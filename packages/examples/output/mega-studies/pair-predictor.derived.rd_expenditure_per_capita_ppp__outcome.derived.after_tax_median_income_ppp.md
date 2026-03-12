# Pair Study: R&D Expenditure Per Capita (PPP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.rd_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 1
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5965
- Included subjects: 123
- Skipped subjects: 0
- Total aligned pairs: 4134
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.502 (lower confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.1025 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended R&D Expenditure Per Capita (PPP) level for higher After-Tax Median Income (PPP): 1186.3 international $/person (data-backed level).
- Best level directly seen in the grouped data: 1186.3 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 1078.6 international $/person; model-optimal minus observed-anchor difference is -739.69 (-68.6%).
- Backup level check (middle 10-90% of data) suggests 597.32 international $/person.
- The math-only guess and backup level differ by 76.2%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 6.556 international $/person.
- Diminishing returns likely begin near 13.986 international $/person.
- Saturation/plateau zone starts around 231.52 international $/person and extends through 1186.3 international $/person.
- Highest observed mean After-Tax Median Income (PPP) appears when R&D Expenditure Per Capita (PPP) is in [774.88, 2285.7] (mean outcome 53570.5).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Medium signal; still sensitive to model choices.
- Pattern hint: higher R&D Expenditure Per Capita (PPP) tends to go with better After-Tax Median Income (PPP).
- Signal strength: stronger in this report set.

## Plain-Language Summary

- Higher R&D Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income (PPP).
- The estimate uses 123 subjects and 4134 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [774.88, 2285.7] (mean outcome 53570.5).
- A minimum effective predictor level appears near 6.556 international $/person in the binned response curve.
- Confidence score is 0.502 (lower confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Top temporal profiles are close (score delta 0.0013); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 76.2% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.8427 |
| Reverse correlation | 0.8104 |
| Direction score (forward - reverse) | 0.0323 |
| Effect size (% change from baseline) | 115.5196 |
| Significance score | 0.8975 |
| Weighted PIS | 0.8094 |
| Value linked with higher outcome | 338.9250 |
| Value linked with lower outcome | 161.6714 |
| Math-only best daily value | 338.9250 |
| Recommended level (reader-facing) | 1186.3 international $/person (data-backed level) |
| Math-only guess (technical) | 338.93 international $/person |
| Data-backed level | 1186.3 international $/person |
| Data-backed range | [861.87, 2285.7] |
| Backup level (middle-data check) | 638.11 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.1972, 3227.4604] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [774.88, 2285.7] |
| Best observed range (middle-data check) | [482.31, 774.59] |
| Best observed outcome average | 53570.5 |
| Best observed outcome average (middle-data check) | 35001.9 |
| Backup level (bucket median) | 597.32 international $/person |
| Math-only vs backup difference | 258.39 (+76.2%) |
| Middle-data share kept | 80.0% (3306/4134) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.5024 (lower confidence) |
| Reliability support component | 0.7545 |
| Reliability significance component | 0.8975 |
| Reliability directional component | 0.2155 |
| Reliability temporal-stability component | 0.0449 |
| Reliability robustness component | 0.2640 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 6.556 international $/person (z=9.63) |
| Point where gains start slowing | 13.986 international $/person (ratio=0.281) |
| Flat zone range | [170.94, 2285.7] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -847.38 (-71.4%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 8 | interpolation | 0.5965 | 0.0000 | 123 | 4134 |
| Runner-up | predictor_default | 3 | 8 | interpolation | 0.5951 | 0.0013 | 123 | 4134 |
| Runner-up | predictor_default | 2 | 8 | interpolation | 0.5927 | 0.0037 | 123 | 4134 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.5858 | 0.0106 | 123 | 4134 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.19730, 4.790) | 414 | 18 | 2.7390 | 2.9228 | 3775.0483 | 3120.0000 |
| 2 | [4.790, 13.399) | 413 | 30 | 8.8304 | 9.1280 | 5483.4727 | 4960.0000 |
| 3 | [13.399, 25.497) | 413 | 40 | 20.0657 | 20.3609 | 9511.5518 | 7290.0000 |
| 4 | [25.497, 43.622) | 414 | 44 | 33.8164 | 33.2607 | 12663.7380 | 7955.0000 |
| 5 | [43.622, 65.647) | 413 | 49 | 53.4953 | 52.0011 | 13871.1141 | 9824.7707 |
| 6 | [65.647, 109.03) | 413 | 55 | 86.1187 | 85.0621 | 19076.1518 | 15120.0000 |
| 7 | [109.03, 219.30) | 410 | 50 | 153.7649 | 147.0577 | 25034.9067 | 20240.0000 |
| 8 | [219.30, 438.59) | 417 | 43 | 330.6572 | 336.0487 | 31967.5407 | 26420.0000 |
| 9 | [438.59, 774.88) | 413 | 37 | 581.1006 | 552.4188 | 33816.4856 | 32500.0000 |
| 10 | [774.88, 2285.7] | 414 | 30 | 1162.0915 | 1078.6111 | 53570.4548 | 50220.0000 |

### Distribution Charts

```text
Predictor Distribution (R&D Expenditure Per Capita (PPP))
[0.19730, 190.65) | ############################## 2822
[190.65, 381.11) | #### 358
[381.11, 571.57) | #### 350
[571.57, 762.02) | ## 181
[762.02, 952.48) | ## 148
[952.48, 1142.9) | # 93
[1142.9, 1333.4) | # 73
[1333.4, 1523.9) | # 52
[1523.9, 1714.3) | # 27
[1714.3, 1904.8) | # 16
[1904.8, 2095.2) | # 9
[2095.2, 2285.7] | # 5
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[440.00, 10870.8) | ############################## 1691
[10870.8, 21301.7) | ################# 967
[21301.7, 31732.5) | ########## 570
[31732.5, 42163.3) | ###### 356
[42163.3, 52594.2) | #### 228
[52594.2, 63025.0) | ## 125
[63025.0, 73455.8) | # 84
[73455.8, 83886.7) | # 44
[83886.7, 94317.5) | # 33
[94317.5, 104748) | # 21
[104748, 115179) | # 10
[115179, 125610] | # 5
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| IRN | 0.7435 | 0.7737 | 45.307 | 34 |
| OMN | -0.1322 | 0.6905 | -6.326 | 34 |
| TTO | 0.9203 | 0.6583 | 117.622 | 34 |
| KWT | -0.4362 | -0.6534 | -19.649 | 34 |
| KGZ | 0.7663 | 0.6187 | 125.429 | 33 |
| UGA | -0.0194 | -0.6072 | -27.183 | 34 |
| UKR | 0.6906 | 0.6018 | 120.407 | 34 |
| MNG | 0.8622 | 0.4494 | 157.956 | 34 |
