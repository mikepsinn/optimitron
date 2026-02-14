# Pair Study: Civilian Government Expenditure Per Capita (PPP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 3
- Duration years: 1
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6025
- Included subjects: 148
- Skipped subjects: 0
- Total aligned pairs: 4853
- Evidence grade: B
- Data sufficiency: sufficient
- Reliability score: 0.570 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.3000 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Civilian Government Expenditure Per Capita (PPP) level for higher After-Tax Median Income Growth (YoY %): 484.31 international $/person (support constrained).
- Observed-support target from binned response curve: 484.31 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 622.18 international $/person; model-optimal minus observed-anchor difference is 3251.3 (+522.6%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 511.72 international $/person.
- Raw vs robust optimal differs by 86.8%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 251.59 international $/person.
- Diminishing returns likely begin near 484.31 international $/person.
- Saturation/plateau zone starts around 3488.0 international $/person and extends through 15502.1 international $/person.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Civilian Government Expenditure Per Capita (PPP) is in [457.16, 845.17) (mean outcome 5.931).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: higher Civilian Government Expenditure Per Capita (PPP) is associated with better After-Tax Median Income Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Civilian Government Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 148 subjects and 4853 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [457.16, 845.17) (mean outcome 5.931).
- A minimum effective predictor level appears near 251.59 international $/person in the binned response curve.
- Reliability score is 0.570 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Top temporal profiles are close (score delta 0.0011); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 86.8% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.0956 |
| Aggregate reverse Pearson | -0.0119 |
| Aggregate directional score (forward - reverse) | 0.1075 |
| Aggregate effect size (% baseline delta) | 57.3407 |
| Aggregate statistical significance | 0.7000 |
| Weighted average PIS | 0.1800 |
| Aggregate value predicting high outcome | 3873.5181 |
| Aggregate value predicting low outcome | 3720.4768 |
| Aggregate optimal daily value | 3873.5181 |
| Decision target value (reader-facing) | 484.31 international $/person (support constrained) |
| Model-derived optimum (diagnostics) | 3873.5 international $/person |
| Support-constrained optimal value | 484.31 international $/person |
| Support-constrained optimal range | [328.32, 622.18) |
| Response-curve robust optimal value | 1778.8 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [7.6041, 62399.1940] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [457.16, 845.17) |
| Robust best observed range (trimmed) | [372.83, 649.66) |
| Raw best observed outcome mean | 5.931 |
| Robust best observed outcome mean | 6.166 |
| Robust optimal value (bin median) | 511.72 international $/person |
| Raw vs robust optimal delta | -3361.8 (-86.8%) |
| Robustness retained fraction | 80.0% (3881/4853) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.5704 (moderate) |
| Reliability support component | 0.8978 |
| Reliability significance component | 0.7000 |
| Reliability directional component | 0.7168 |
| Reliability temporal-stability component | 0.0374 |
| Reliability robustness component | 0.1468 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 251.59 international $/person (z=1.06) |
| Diminishing-returns knee | 484.31 international $/person (ratio=-0.106) |
| Saturation / plateau range | [3073.5, 51665.2] |
| Support-constrained target reason | identified |
| Raw to support delta | 3389.2 (+699.8%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 1 | interpolation | 0.6025 | 0.0000 | 148 | 4853 |
| Runner-up | predictor_default | 2 | 1 | interpolation | 0.6014 | 0.0011 | 148 | 4853 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.6013 | 0.0012 | 148 | 4853 |
| Runner-up | predictor_default | 0 | 1 | interpolation | 0.5910 | 0.0115 | 148 | 4853 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [7.604, 211.08) | 486 | 24 | 119.9166 | 107.9202 | 4.3827 | 4.7707 |
| 2 | [211.08, 457.16) | 485 | 41 | 307.1541 | 287.8307 | 4.6044 | 4.7331 |
| 3 | [457.16, 845.17) | 485 | 50 | 625.1364 | 622.1792 | 5.9309 | 5.2556 |
| 4 | [845.17, 1259.4) | 485 | 60 | 1032.5545 | 1022.9992 | 4.1873 | 5.0776 |
| 5 | [1259.4, 2058.6) | 484 | 58 | 1649.4765 | 1648.9683 | 5.1004 | 4.6831 |
| 6 | [2058.6, 3277.1) | 487 | 60 | 2637.5121 | 2635.5958 | 4.4317 | 4.5317 |
| 7 | [3277.1, 4544.8) | 485 | 68 | 3832.8515 | 3782.2386 | 4.4793 | 4.4813 |
| 8 | [4544.8, 7053.8) | 485 | 70 | 5644.8697 | 5493.8454 | 4.9722 | 4.7417 |
| 9 | [7053.8, 10886.0) | 485 | 55 | 8919.0912 | 9049.4836 | 4.4251 | 4.1062 |
| 10 | [10886.0, 51665.2] | 486 | 46 | 16379.1383 | 14642.5590 | 4.6249 | 4.4589 |

### Distribution Charts

```text
Predictor Distribution (Civilian Government Expenditure Per Capita (PPP))
[7.604, 4312.4) | ############################## 3323
[4312.4, 8617.2) | ####### 752
[8617.2, 12922.0) | #### 463
[12922.0, 17226.8) | # 158
[17226.8, 21531.6) | # 86
[21531.6, 25836.4) | # 34
[25836.4, 30141.2) | # 24
[30141.2, 34446.0) | # 3
[34446.0, 38750.8) | # 3
[38750.8, 43055.6) | # 4
[43055.6, 47360.4) | # 2
[47360.4, 51665.2] | # 1
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-49.393, -31.954) | # 8
[-31.954, -14.516) | # 43
[-14.516, 2.923) | ############## 1482
[2.923, 20.361) | ############################## 3253
[20.361, 37.799) | # 54
[37.799, 55.238) | # 6
[55.238, 72.676) | # 6
[142.43, 159.87] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| GAB | -0.4567 | -0.9776 | -87.203 | 33 |
| ECU | 0.5503 | 0.9538 | 190.003 | 33 |
| BOL | 0.1520 | 0.9437 | 52.022 | 33 |
| SST | 0.2185 | 0.7911 | 3.623 | 33 |
| TLA | 0.1874 | 0.7049 | 4.517 | 33 |
| LAC | 0.1748 | 0.7031 | -4.783 | 33 |
| LCN | 0.1907 | 0.7026 | 4.662 | 33 |
| LDC | 0.2132 | 0.7004 | 24.611 | 33 |
