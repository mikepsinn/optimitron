# Pair Study: Education Expenditure Per Capita (PPP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.education_expenditure_per_capita_ppp__outcome.who.healthy_life_expectancy_years`
- Lag years: 0
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.7069
- Included subjects: 165
- Skipped subjects: 0
- Total aligned pairs: 10890
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.694 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.0646 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Education Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy (HALE): 2912.6 international $/person (support constrained).
- Observed-support target from binned response curve: 2912.6 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 2705.0 international $/person; model-optimal minus observed-anchor difference is -1862.4 (-68.8%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 1635.7 international $/person.
- Raw vs robust optimal differs by 94.1%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 52.790 international $/person.
- Diminishing returns likely begin near 92.581 international $/person.
- Saturation/plateau zone starts around 857.14 international $/person and extends through 2912.6 international $/person.
- Highest observed mean Healthy Life Expectancy (HALE) appears when Education Expenditure Per Capita (PPP) is in [2046.9, 6496.0] (mean outcome 69.030).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Directional hint: higher Education Expenditure Per Capita (PPP) is associated with better Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Education Expenditure Per Capita (PPP) tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 165 subjects and 10890 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [2046.9, 6496.0] (mean outcome 69.030).
- A minimum effective predictor level appears near 52.790 international $/person in the binned response curve.
- Reliability score is 0.694 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward association sign conflicts with directional score sign; reverse-direction signal may dominate.
- Top temporal profiles are close (score delta 0.0056); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 94.1% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.5119 |
| Aggregate reverse Pearson | 0.6415 |
| Aggregate directional score (forward - reverse) | -0.1295 |
| Aggregate effect size (% baseline delta) | 4.3476 |
| Aggregate statistical significance | 0.9354 |
| Weighted average PIS | 0.5577 |
| Aggregate value predicting high outcome | 842.6295 |
| Aggregate value predicting low outcome | 658.0594 |
| Aggregate optimal daily value | 842.6295 |
| Decision target value (reader-facing) | 2912.6 international $/person (support constrained) |
| Model-derived optimum (diagnostics) | 842.63 international $/person |
| Support-constrained optimal value | 2912.6 international $/person |
| Support-constrained optimal range | [2182.5, 6496.0] |
| Response-curve robust optimal value | 1712.9 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.0000, 7006.1701] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [2046.9, 6496.0] |
| Robust best observed range (trimmed) | [1333.9, 2046.9] |
| Raw best observed outcome mean | 69.030 |
| Robust best observed outcome mean | 68.664 |
| Robust optimal value (bin median) | 1635.7 international $/person |
| Raw vs robust optimal delta | 793.04 (+94.1%) |
| Robustness retained fraction | 80.1% (8718/10890) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.6943 (moderate) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.9354 |
| Reliability directional component | 0.8635 |
| Reliability temporal-stability component | 0.1861 |
| Reliability robustness component | 0.0654 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 52.790 international $/person (z=21.51) |
| Diminishing-returns knee | 92.581 international $/person (ratio=0.087) |
| Saturation / plateau range | [701.07, 6496.0] |
| Support-constrained target reason | identified |
| Raw to support delta | -2069.9 (-71.1%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 5 | interpolation | 0.7069 | 0.0000 | 165 | 10890 |
| Runner-up | predictor_default | 1 | 5 | interpolation | 0.7013 | 0.0056 | 165 | 10890 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.7013 | 0.0056 | 165 | 10890 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.7010 | 0.0059 | 165 | 10890 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 44.242) | 1089 | 34 | 28.9348 | 31.2704 | 50.1030 | 50.5494 |
| 2 | [44.242, 88.416) | 1089 | 45 | 63.5704 | 61.4310 | 54.9875 | 55.0608 |
| 3 | [88.416, 176.18) | 1089 | 58 | 131.0509 | 132.0090 | 57.9497 | 58.6578 |
| 4 | [176.18, 272.11) | 1089 | 56 | 225.5004 | 227.3005 | 59.8312 | 61.2109 |
| 5 | [272.11, 392.95) | 1089 | 68 | 328.6942 | 332.5590 | 62.0149 | 62.7229 |
| 6 | [392.95, 545.74) | 1089 | 59 | 471.0360 | 478.9943 | 62.0836 | 63.8393 |
| 7 | [545.74, 820.76) | 1089 | 58 | 654.8328 | 635.9081 | 63.6993 | 64.6759 |
| 8 | [820.76, 1225.4) | 1089 | 53 | 1017.3821 | 1004.5532 | 65.0647 | 66.1063 |
| 9 | [1225.4, 2046.9) | 1086 | 44 | 1587.0820 | 1533.5618 | 68.2647 | 68.8477 |
| 10 | [2046.9, 6496.0] | 1092 | 29 | 2942.1021 | 2705.0462 | 69.0305 | 69.7292 |

### Distribution Charts

```text
Predictor Distribution (Education Expenditure Per Capita (PPP))
[0.00000, 541.33) | ############################## 6510
[541.33, 1082.7) | ######## 1836
[1082.7, 1624.0) | ##### 1017
[1624.0, 2165.3) | ### 591
[2165.3, 2706.6) | ## 393
[2706.6, 3248.0) | # 255
[3248.0, 3789.3) | # 132
[3789.3, 4330.6) | # 81
[4330.6, 4872.0) | # 36
[4872.0, 5413.3) | # 15
[5413.3, 5954.6) | # 9
[5954.6, 6496.0] | # 15
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[31.884, 35.487) | # 2
[35.487, 39.089) | # 48
[39.089, 42.692) | ## 152
[42.692, 46.294) | #### 320
[46.294, 49.896) | ###### 477
[49.896, 53.499) | ########## 842
[53.499, 57.101) | ############ 1044
[57.101, 60.704) | ############### 1216
[60.704, 64.306) | ########################## 2157
[64.306, 67.909) | ############################## 2512
[67.909, 71.511) | ####################### 1966
[71.511, 75.113] | ## 154
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| DZA | 0.6549 | 0.9245 | 2.464 | 66 |
| GAB | -0.6315 | -0.8005 | -5.340 | 66 |
| SUR | -0.0931 | -0.7393 | -0.724 | 66 |
| LBN | 0.1674 | -0.7160 | 0.560 | 66 |
| BRN | -0.3215 | -0.7158 | -0.646 | 66 |
| VNM | 0.2249 | -0.7120 | 1.653 | 66 |
| JOR | 0.4825 | 0.6897 | 2.693 | 66 |
| CRI | 0.1472 | -0.6509 | 0.620 | 66 |
