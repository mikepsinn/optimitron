# Pair Study: R&D Expenditure Per Capita (PPP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.rd_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 1
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5966
- Included subjects: 123
- Skipped subjects: 0
- Total aligned pairs: 4134
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.502 (low)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.1025 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best R&D Expenditure Per Capita (PPP) level for higher After-Tax Median Income (PPP): 338.55 international $/person.
- Observed-support target from binned response curve: 1186.3 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 1078.4 international $/person; model-optimal minus observed-anchor difference is -739.87 (-68.6%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 597.32 international $/person.
- Raw vs robust optimal differs by 76.4%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 6.556 international $/person.
- Diminishing returns likely begin near 13.986 international $/person.
- Saturation/plateau zone starts around 231.03 international $/person and extends through 1186.3 international $/person.
- Highest observed mean After-Tax Median Income (PPP) appears when R&D Expenditure Per Capita (PPP) is in [774.74, 2285.7] (mean outcome 53568.3).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Moderate evidence; plausible signal but still sensitive to model assumptions.
- Directional hint: higher R&D Expenditure Per Capita (PPP) is associated with better After-Tax Median Income (PPP).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher R&D Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income (PPP).
- The estimate uses 123 subjects and 4134 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [774.74, 2285.7] (mean outcome 53568.3).
- A minimum effective predictor level appears near 6.556 international $/person in the binned response curve.
- Reliability score is 0.502 (low); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Top temporal profiles are close (score delta 0.0013); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 76.4% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.8427 |
| Aggregate reverse Pearson | 0.8102 |
| Aggregate directional score (forward - reverse) | 0.0324 |
| Aggregate effect size (% baseline delta) | 115.1686 |
| Aggregate statistical significance | 0.8975 |
| Weighted average PIS | 0.8094 |
| Aggregate value predicting high outcome | 338.5466 |
| Aggregate value predicting low outcome | 161.6559 |
| Aggregate optimal daily value | 338.5466 |
| Support-constrained optimal value | 1186.3 international $/person |
| Support-constrained optimal range | [861.87, 2285.7] |
| Response-curve robust optimal value | 638.11 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.1972, 3227.4604] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [774.74, 2285.7] |
| Robust best observed range (trimmed) | [482.31, 774.12] |
| Raw best observed outcome mean | 53568.3 |
| Robust best observed outcome mean | 34996.7 |
| Robust optimal value (bin median) | 597.32 international $/person |
| Raw vs robust optimal delta | 258.77 (+76.4%) |
| Robustness retained fraction | 80.0% (3306/4134) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.5020 (low) |
| Reliability support component | 0.7545 |
| Reliability significance component | 0.8975 |
| Reliability directional component | 0.2163 |
| Reliability temporal-stability component | 0.0427 |
| Reliability robustness component | 0.2618 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 6.556 international $/person (z=9.72) |
| Diminishing-returns knee | 13.986 international $/person (ratio=0.285) |
| Saturation / plateau range | [168.00, 2285.7] |
| Support-constrained target reason | identified |
| Raw to support delta | -847.76 (-71.5%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 8 | interpolation | 0.5966 | 0.0000 | 123 | 4134 |
| Runner-up | predictor_default | 3 | 8 | interpolation | 0.5953 | 0.0013 | 123 | 4134 |
| Runner-up | predictor_default | 2 | 8 | interpolation | 0.5929 | 0.0037 | 123 | 4134 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.5860 | 0.0105 | 123 | 4134 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.19730, 4.790) | 414 | 18 | 2.7367 | 2.9228 | 3764.6377 | 3120.0000 |
| 2 | [4.790, 13.399) | 413 | 30 | 8.8281 | 9.1280 | 5480.1071 | 4960.0000 |
| 3 | [13.399, 25.497) | 413 | 40 | 20.0462 | 20.3536 | 9491.4037 | 7290.0000 |
| 4 | [25.497, 43.596) | 414 | 44 | 33.7737 | 33.2607 | 12627.1604 | 7945.0000 |
| 5 | [43.596, 65.301) | 413 | 49 | 53.2651 | 52.0011 | 13870.6079 | 9830.0000 |
| 6 | [65.301, 108.62) | 413 | 55 | 85.5879 | 84.5110 | 18895.4942 | 15030.0000 |
| 7 | [108.62, 219.03) | 414 | 50 | 153.1756 | 146.1237 | 24936.1542 | 20060.0252 |
| 8 | [219.03, 438.59) | 413 | 43 | 331.1454 | 336.0487 | 31854.6968 | 26330.0000 |
| 9 | [438.59, 774.74) | 413 | 37 | 581.0355 | 552.4188 | 33811.8198 | 32491.7693 |
| 10 | [774.74, 2285.7] | 414 | 30 | 1162.0310 | 1078.4120 | 53568.2559 | 50212.1864 |

### Distribution Charts

```text
Predictor Distribution (R&D Expenditure Per Capita (PPP))
[0.19730, 190.65) | ############################## 2825
[190.65, 381.11) | #### 355
[381.11, 571.57) | #### 351
[571.57, 762.02) | ## 180
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
[440.00, 10870.8) | ############################## 1696
[10870.8, 21301.7) | ################# 972
[21301.7, 31732.5) | ########## 567
[31732.5, 42163.3) | ###### 353
[42163.3, 52594.2) | #### 224
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
