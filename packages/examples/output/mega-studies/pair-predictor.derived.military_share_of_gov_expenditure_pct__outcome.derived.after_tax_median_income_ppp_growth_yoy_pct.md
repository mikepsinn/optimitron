# Pair Study: Military Share of Government Spending -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 2
- Duration years: 1
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6174
- Included subjects: 148
- Skipped subjects: 0
- Total aligned pairs: 4853
- Evidence grade: C
- Data sufficiency: sufficient
- Reliability score: 0.760 (high)
- Quality tier: exploratory
- Direction: negative
- Derived uncertainty score: 0.3192 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best Military Share of Government Spending level for higher After-Tax Median Income Growth (YoY %): 9.785 % of government expenditure.
- Observed-support target from binned response curve: 4.734 % of government expenditure.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 5.208 % of government expenditure; model-optimal minus observed-anchor difference is 4.577 (+87.9%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 4.759 % of government expenditure.
- Raw vs robust optimal differs by 51.4%, indicating strong tail influence.
- Minimum effective level not reliably identified (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 4.734 % of government expenditure.
- Saturation/plateau zone starts around 10.950 % of government expenditure and extends through 13.996 % of government expenditure.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Military Share of Government Spending is in [4.760, 5.660) (mean outcome 5.170).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: lower Military Share of Government Spending is associated with better After-Tax Median Income Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Military Share of Government Spending tends to align with worse After-Tax Median Income Growth (YoY %).
- The estimate uses 148 subjects and 4853 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [4.760, 5.660) (mean outcome 5.170).
- Reliability score is 0.760 (high); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Top temporal profiles are close (score delta 0.0223); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 51.4% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.1138 |
| Aggregate reverse Pearson | 0.0153 |
| Aggregate directional score (forward - reverse) | -0.1291 |
| Aggregate effect size (% baseline delta) | 25.5839 |
| Aggregate statistical significance | 0.6808 |
| Weighted average PIS | 0.1834 |
| Aggregate value predicting high outcome | 9.7847 |
| Aggregate value predicting low outcome | 10.2187 |
| Aggregate optimal daily value | 9.7847 |
| Support-constrained optimal value | 4.734 % of government expenditure |
| Support-constrained optimal range | [4.395, 5.018) |
| Response-curve robust optimal value | 4.508 % of government expenditure |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.4821, 100.9768] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [4.760, 5.660) |
| Robust best observed range (trimmed) | [4.441, 5.096) |
| Raw best observed outcome mean | 5.170 |
| Robust best observed outcome mean | 5.460 |
| Robust optimal value (bin median) | 4.759 % of government expenditure |
| Raw vs robust optimal delta | -5.025 (-51.4%) |
| Robustness retained fraction | 80.0% (3881/4853) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.7596 (high) |
| Reliability support component | 0.8978 |
| Reliability significance component | 0.6808 |
| Reliability directional component | 0.8608 |
| Reliability temporal-stability component | 0.7450 |
| Reliability robustness component | 0.5405 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | Not identified (no_consistent_effective_dose_detected) |
| Diminishing-returns knee | 4.734 % of government expenditure (ratio=-0.356) |
| Saturation / plateau range | [9.950, 15.368) |
| Support-constrained target reason | identified |
| Raw to support delta | 5.050 (+106.7%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 1 | interpolation | 0.6174 | 0.0000 | 148 | 4853 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.5951 | 0.0223 | 148 | 4853 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.5948 | 0.0226 | 148 | 4853 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.5943 | 0.0231 | 148 | 4853 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.51710, 2.985) | 486 | 34 | 2.0045 | 2.1403 | 4.9467 | 4.8772 |
| 2 | [2.985, 4.052) | 485 | 59 | 3.5530 | 3.5780 | 4.7604 | 4.5404 |
| 3 | [4.052, 4.760) | 485 | 66 | 4.4128 | 4.3951 | 4.9877 | 4.6512 |
| 4 | [4.760, 5.660) | 485 | 71 | 5.2063 | 5.2081 | 5.1698 | 5.0373 |
| 5 | [5.660, 6.902) | 485 | 76 | 6.2487 | 6.2103 | 4.5796 | 4.7059 |
| 6 | [6.902, 8.590) | 474 | 70 | 7.7189 | 7.6964 | 4.6819 | 4.5666 |
| 7 | [8.590, 10.747) | 484 | 73 | 9.6005 | 9.6276 | 4.3653 | 4.4642 |
| 8 | [10.747, 14.381) | 497 | 69 | 12.4939 | 12.5238 | 4.0869 | 4.5455 |
| 9 | [14.381, 17.805) | 486 | 52 | 15.9017 | 15.8956 | 4.8979 | 5.2594 |
| 10 | [17.805, 100.98] | 486 | 45 | 28.4999 | 22.6817 | 4.6731 | 4.0101 |

### Distribution Charts

```text
Predictor Distribution (Military Share of Government Spending)
[0.51710, 8.889) | ############################## 2972
[8.889, 17.260) | ############## 1346
[17.260, 25.632) | ### 339
[25.632, 34.004) | # 90
[34.004, 42.375) | # 40
[42.375, 50.747) | # 26
[50.747, 59.119) | # 8
[59.119, 67.490) | # 4
[67.490, 75.862) | # 15
[84.234, 92.605) | # 11
[92.605, 100.98] | # 2
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
| HPC | -0.4569 | -0.9360 | -33.053 | 33 |
| ALB | -0.3087 | -0.9092 | -59.619 | 33 |
| IDX | -0.2524 | -0.8642 | -15.543 | 33 |
| LDC | -0.2313 | -0.8025 | -16.126 | 33 |
| IDN | -0.1200 | -0.6896 | -21.043 | 33 |
| KWT | 0.2094 | 0.6860 | 2922.996 | 33 |
| NAM | -0.0535 | -0.6803 | -27.040 | 33 |
| BOL | -0.1129 | -0.6485 | -34.220 | 33 |
