# Pair Study: Government Health Expenditure Per Capita (PPP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5776
- Included subjects: 229
- Skipped subjects: 0
- Total aligned pairs: 7585
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.495 (low)
- Quality tier: exploratory
- Direction: neutral
- Derived uncertainty score: 0.1095 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Government Health Expenditure Per Capita (PPP) level for higher After-Tax Median Income (PPP): 2501.0 international $/person (support constrained).
- Observed-support target from binned response curve: 2501.0 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 2304.3 international $/person; model-optimal minus observed-anchor difference is -1618.6 (-70.2%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 1369.4 international $/person.
- Raw vs robust optimal differs by 99.7%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 17.753 international $/person.
- Diminishing returns likely begin near 33.100 international $/person.
- No stable plateau zone detected (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income (PPP) appears when Government Health Expenditure Per Capita (PPP) is in [1635.2, 5977.9] (mean outcome 46324.6).
- Directional signal is neutral; use caution when treating the estimated optimal value as prescriptive.

## Decision Summary

- Interpretation: Moderate evidence; plausible signal but still sensitive to model assumptions.
- Directional hint: no stable increase/decrease signal; prioritize observed-support targets.
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- No strong directional pattern is detected between Government Health Expenditure Per Capita (PPP) and After-Tax Median Income (PPP).
- The estimate uses 229 subjects and 7585 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [1635.2, 5977.9] (mean outcome 46324.6).
- A minimum effective predictor level appears near 17.753 international $/person in the binned response curve.
- Reliability score is 0.495 (low); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Top temporal profiles are close (score delta 0.0000); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 99.7% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.8133 |
| Aggregate reverse Pearson | 0.8292 |
| Aggregate directional score (forward - reverse) | -0.0159 |
| Aggregate effect size (% baseline delta) | 100.9860 |
| Aggregate statistical significance | 0.8905 |
| Weighted average PIS | 0.7625 |
| Aggregate value predicting high outcome | 685.6825 |
| Aggregate value predicting low outcome | 391.3345 |
| Aggregate optimal daily value | 685.6825 |
| Decision target value (reader-facing) | 2501.0 international $/person (support constrained) |
| Model-derived optimum (diagnostics) | 685.68 international $/person |
| Support-constrained optimal value | 2501.0 international $/person |
| Support-constrained optimal range | [1831.4, 5977.9] |
| Response-curve robust optimal value | 1403.7 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.2591, 8503.2455] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [1635.2, 5977.9] |
| Robust best observed range (trimmed) | [1002.6, 1630.3] |
| Raw best observed outcome mean | 46324.6 |
| Robust best observed outcome mean | 36980.6 |
| Robust optimal value (bin median) | 1369.4 international $/person |
| Raw vs robust optimal delta | 683.73 (+99.7%) |
| Robustness retained fraction | 80.0% (6067/7585) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.4946 (low) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.8905 |
| Reliability directional component | 0.1063 |
| Reliability temporal-stability component | 0.0015 |
| Reliability robustness component | 0.0032 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 17.753 international $/person (z=17.66) |
| Diminishing-returns knee | 33.100 international $/person (ratio=0.323) |
| Saturation / plateau range | Not identified (no_plateau_zone_detected) |
| Support-constrained target reason | identified |
| Raw to support delta | -1815.3 (-72.6%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 5 | interpolation | 0.5776 | 0.0000 | 229 | 7585 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.5776 | 0.0000 | 229 | 7585 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.5755 | 0.0021 | 229 | 7585 |
| Runner-up | predictor_default | 0 | 5 | interpolation | 0.5717 | 0.0059 | 229 | 7585 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.25914, 15.955) | 759 | 34 | 8.7585 | 8.6572 | 1374.8372 | 1170.0000 |
| 2 | [15.955, 31.472) | 758 | 53 | 21.5214 | 20.1254 | 2487.2113 | 2205.0000 |
| 3 | [31.472, 66.791) | 755 | 59 | 45.0000 | 41.9080 | 3966.5172 | 3356.5380 |
| 4 | [66.791, 114.38) | 762 | 59 | 89.5003 | 89.2877 | 4619.6878 | 4199.9152 |
| 5 | [114.38, 195.43) | 758 | 69 | 153.1366 | 154.3724 | 7688.5031 | 7115.0000 |
| 6 | [195.43, 284.60) | 746 | 80 | 234.3313 | 232.8851 | 9423.1872 | 8925.0000 |
| 7 | [284.60, 461.72) | 771 | 87 | 361.1506 | 362.3802 | 12916.4208 | 12284.9373 |
| 8 | [461.72, 867.40) | 759 | 73 | 612.1788 | 577.9993 | 19425.6553 | 17940.0000 |
| 9 | [867.40, 1635.2) | 758 | 58 | 1246.5472 | 1245.4132 | 35381.7842 | 28360.0000 |
| 10 | [1635.2, 5977.9] | 759 | 42 | 2596.5810 | 2304.3273 | 46324.6418 | 41990.0000 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure Per Capita (PPP))
[0.25914, 498.39) | ############################## 5432
[498.39, 996.52) | #### 782
[996.52, 1494.7) | ### 474
[1494.7, 1992.8) | ## 356
[1992.8, 2490.9) | # 221
[2490.9, 2989.1) | # 121
[2989.1, 3487.2) | # 77
[3487.2, 3985.3) | # 55
[3985.3, 4483.5) | # 29
[4483.5, 4981.6) | # 24
[4981.6, 5479.7) | # 10
[5479.7, 5977.9] | # 4
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 14356.7) | ############################## 5180
[14356.7, 28433.3) | ####### 1273
[28433.3, 42510.0) | ### 552
[42510.0, 56586.7) | ## 285
[56586.7, 70663.3) | # 142
[70663.3, 84740.0) | # 79
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
| DJI | -0.8362 | -0.9621 | -30.852 | 11 |
| CAF | -0.7661 | -0.8879 | -32.623 | 34 |
| NGA | -0.5481 | -0.8728 | -18.603 | 16 |
| SDN | 0.7156 | 0.8645 | 48.652 | 34 |
| IRQ | 0.6985 | 0.8509 | 71.737 | 33 |
| MDG | 0.5746 | 0.8102 | 20.147 | 34 |
| NRU | 0.1086 | -0.7354 | 12.711 | 34 |
| ZWE | 0.2263 | 0.6298 | 89.399 | 34 |
