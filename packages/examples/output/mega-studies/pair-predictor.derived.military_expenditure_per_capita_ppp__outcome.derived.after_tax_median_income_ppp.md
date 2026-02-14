# Pair Study: Military Expenditure Per Capita (PPP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.military_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6409
- Included subjects: 201
- Skipped subjects: 0
- Total aligned pairs: 6630
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.732 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.1185 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best Military Expenditure Per Capita (PPP) level for higher After-Tax Median Income (PPP): 399.58 international $/person.
- Observed-support target from binned response curve: 1943.0 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 1452.7 international $/person; model-optimal minus observed-anchor difference is -1053.2 (-72.5%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 501.20 international $/person.
- Raw vs robust optimal differs by 25.4%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 20.902 international $/person.
- Diminishing returns likely begin near 377.10 international $/person.
- No stable plateau zone detected (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income (PPP) appears when Military Expenditure Per Capita (PPP) is in [625.06, 21187.0] (mean outcome 49136.2).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Moderate evidence; plausible signal but still sensitive to model assumptions.
- Directional hint: higher Military Expenditure Per Capita (PPP) is associated with better After-Tax Median Income (PPP).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Military Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income (PPP).
- The estimate uses 201 subjects and 6630 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [625.06, 21187.0] (mean outcome 49136.2).
- A minimum effective predictor level appears near 20.902 international $/person in the binned response curve.
- Reliability score is 0.732 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward association sign conflicts with directional score sign; reverse-direction signal may dominate.
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0055); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 25.4% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.6387 |
| Aggregate reverse Pearson | 0.7210 |
| Aggregate directional score (forward - reverse) | -0.0823 |
| Aggregate effect size (% baseline delta) | 84.2593 |
| Aggregate statistical significance | 0.8815 |
| Weighted average PIS | 0.6804 |
| Aggregate value predicting high outcome | 399.5848 |
| Aggregate value predicting low outcome | 343.8655 |
| Aggregate optimal daily value | 399.5848 |
| Support-constrained optimal value | 1943.0 international $/person |
| Support-constrained optimal range | [729.37, 21187.0] |
| Response-curve robust optimal value | 514.61 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.0063, 27448.6207] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [625.06, 21187.0] |
| Robust best observed range (trimmed) | [423.09, 624.77] |
| Raw best observed outcome mean | 49136.2 |
| Robust best observed outcome mean | 31458.3 |
| Robust optimal value (bin median) | 501.20 international $/person |
| Raw vs robust optimal delta | 101.61 (+25.4%) |
| Robustness retained fraction | 80.0% (5304/6630) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.7321 (moderate) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.8815 |
| Reliability directional component | 0.5488 |
| Reliability temporal-stability component | 0.1845 |
| Reliability robustness component | 0.8286 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 20.902 international $/person (z=8.20) |
| Diminishing-returns knee | 377.10 international $/person (ratio=0.336) |
| Saturation / plateau range | Not identified (no_plateau_zone_detected) |
| Support-constrained target reason | identified |
| Raw to support delta | -1543.4 (-79.4%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.6409 | 0.0000 | 201 | 6630 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.6353 | 0.0055 | 201 | 6630 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.6286 | 0.0123 | 201 | 6630 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.6143 | 0.0266 | 201 | 6630 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00630, 17.819) | 663 | 38 | 9.8655 | 9.7741 | 1724.9739 | 1320.0000 |
| 2 | [17.819, 32.404) | 663 | 62 | 24.5377 | 24.3138 | 3073.8416 | 2104.0475 |
| 3 | [32.404, 51.228) | 663 | 69 | 40.9824 | 40.6174 | 4264.2282 | 3356.5380 |
| 4 | [51.228, 85.816) | 663 | 76 | 67.1482 | 66.9048 | 5700.8509 | 4550.0000 |
| 5 | [85.816, 134.77) | 663 | 78 | 108.5681 | 106.5831 | 7580.3227 | 6670.0000 |
| 6 | [134.77, 191.06) | 663 | 83 | 163.1127 | 162.6525 | 10135.5153 | 8640.0000 |
| 7 | [191.06, 265.16) | 663 | 74 | 227.6684 | 227.2168 | 15831.0811 | 13780.0000 |
| 8 | [265.16, 389.53) | 663 | 67 | 328.2573 | 331.8686 | 21779.8049 | 19600.0000 |
| 9 | [389.53, 625.06) | 663 | 66 | 486.7975 | 482.7017 | 30623.7900 | 28940.0000 |
| 10 | [625.06, 21187.0] | 663 | 47 | 2277.8472 | 1452.7468 | 49136.2330 | 45690.0000 |

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
[280.00, 14356.7) | ############################## 4462
[14356.7, 28433.3) | ####### 1087
[28433.3, 42510.0) | ### 512
[42510.0, 56586.7) | ## 280
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
| BIH | -0.7416 | -1.2673 | -73.462 | 34 |
| LBY | -0.6652 | -1.1619 | -29.865 | 34 |
| LBR | -0.6309 | -0.9274 | -43.978 | 34 |
| HTI | -0.5062 | -0.8402 | -15.882 | 34 |
| ETH | -0.5354 | -0.7686 | -67.039 | 34 |
| OSS | -0.1905 | -0.7136 | -12.255 | 34 |
| OMN | -0.3627 | -0.7090 | -12.956 | 34 |
| NIC | -0.4077 | -0.7083 | -3.365 | 34 |
